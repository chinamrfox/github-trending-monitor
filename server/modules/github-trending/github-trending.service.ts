import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, asc, inArray, gte, lt } from 'drizzle-orm';
import axios from 'axios';
import type { TimeRange, TrendingRepo, RankingHistoryPoint, GhRepository } from '@shared/api.interface';
import { ghRepositories, ghTrendingSnapshots, ghRankingHistory } from '../../database/schema';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API_BASE = 'https://api.github.com';
const TOP_N = 25;

interface GithubRepoItem {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  license: { name: string } | null;
}

@Injectable()
export class GithubTrendingService {
  private readonly logger = new Logger(GithubTrendingService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private getDateRange(range: TimeRange): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    switch (range) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setDate(start.getDate() - 30);
        break;
    }
    return { start, end };
  }

  async fetchTrendingFromGithub(
    timeRange: TimeRange,
    language: string = 'all',
  ): Promise<GithubRepoItem[]> {
    const { start } = this.getDateRange(timeRange);
    const dateStr = start.toISOString().split('T')[0];

    let query = `created:>${dateStr}`;
    if (language && language !== 'all') {
      query += ` language:${language}`;
    }
    query += '&sort=stars&order=desc&per_page=25';

    const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}`;

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'miaoda-trending-app',
      };
      if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
      }
      const response = await axios.get(url, {
        headers,
        timeout: 15000,
      });
      return response.data.items || [];
    } catch (error) {
      this.logger.error(`GitHub API 请求失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async saveTrendingSnapshot(
    repos: GithubRepoItem[],
    timeRange: TimeRange,
    language: string,
  ): Promise<number> {
    if (repos.length === 0) return 0;

    const today = new Date();
    const snapshotDate = today.toISOString().split('T')[0];

    await this.db.transaction(async (tx) => {
      for (let i = 0; i < repos.length; i++) {
        const item = repos[i];
        const rank = i + 1;

        const existing = await tx
          .select({ id: ghRepositories.id })
          .from(ghRepositories)
          .where(eq(ghRepositories.githubId, item.id))
          .limit(1);

        let repoId: string;
        if (existing.length > 0) {
          repoId = existing[0].id;
          await tx
            .update(ghRepositories)
            .set({
              fullName: item.full_name,
              name: item.name,
              owner: item.owner.login,
              description: item.description,
              language: item.language,
              htmlUrl: item.html_url,
              homepage: item.homepage,
              stargazersCount: item.stargazers_count,
              forksCount: item.forks_count,
              openIssuesCount: item.open_issues_count,
              topics: item.topics || [],
              license: item.license?.name || null,
              updatedAt: new Date(),
            })
            .where(eq(ghRepositories.id, repoId));
        } else {
          const inserted = await tx
            .insert(ghRepositories)
            .values({
              githubId: item.id,
              fullName: item.full_name,
              name: item.name,
              owner: item.owner.login,
              description: item.description,
              language: item.language,
              htmlUrl: item.html_url,
              homepage: item.homepage,
              stargazersCount: item.stargazers_count,
              forksCount: item.forks_count,
              openIssuesCount: item.open_issues_count,
              topics: item.topics || [],
              license: item.license?.name || null,
            })
            .returning({ id: ghRepositories.id });
          repoId = inserted[0].id;
        }

        await tx
          .insert(ghTrendingSnapshots)
          .values({
            snapshotDate,
            timeRange,
            language,
            repoId,
            rank,
            starsToday: Math.floor(item.stargazers_count * 0.05),
            stargazersCount: item.stargazers_count,
          })
          .onConflictDoNothing();

        const prevHistory = await tx
          .select({
            stargazersCount: ghRankingHistory.stargazersCount,
          })
          .from(ghRankingHistory)
          .where(
            and(
              eq(ghRankingHistory.repoId, repoId),
              eq(ghRankingHistory.timeRange, timeRange),
              eq(ghRankingHistory.language, language),
            ),
          )
          .orderBy(desc(ghRankingHistory.snapshotDate))
          .limit(1);

        const prevStars = prevHistory[0]?.stargazersCount ?? item.stargazers_count;
        const starsDelta = item.stargazers_count - prevStars;

        await tx
          .insert(ghRankingHistory)
          .values({
            repoId,
            snapshotDate,
            timeRange,
            language,
            rank,
            stargazersCount: item.stargazers_count,
            starsDelta,
          })
          .onConflictDoUpdate({
            target: [ghRankingHistory.repoId, ghRankingHistory.snapshotDate, ghRankingHistory.timeRange, ghRankingHistory.language],
            set: {
              rank,
              stargazersCount: item.stargazers_count,
              starsDelta,
            },
          });
      }
    });

    this.logger.log(`已保存 ${repos.length} 条热榜数据 (${timeRange}/${language})`);
    return repos.length;
  }

  async fetchAndSave(timeRange: TimeRange, language?: string): Promise<number> {
    const langs = language && language !== 'all' ? [language] : ['JavaScript', 'TypeScript', 'Python', 'Go', 'Java'];
    let total = 0;
    for (const lang of langs) {
      const repos = await this.fetchTrendingFromGithub(timeRange, lang);
      total += await this.saveTrendingSnapshot(repos, timeRange, lang);
    }
    return total;
  }

  async fetchAllRanges(): Promise<number> {
    let total = 0;
    for (const range of ['daily', 'weekly', 'monthly'] as TimeRange[]) {
      total += await this.fetchAndSave(range);
    }
    return total;
  }

  async getTrendingList(
    timeRange: TimeRange,
    language: string = 'all',
  ): Promise<{ items: TrendingRepo[]; snapshotDate: string; total: number }> {
    const today = new Date().toISOString().split('T')[0];

    if (language === 'all') {
      return this.getAggregatedTrendingList(timeRange, today);
    }

    const snapshots = await this.db
      .select({
        id: ghTrendingSnapshots.id,
        repoId: ghTrendingSnapshots.repoId,
        rank: ghTrendingSnapshots.rank,
        starsToday: ghTrendingSnapshots.starsToday,
        stargazersCount: ghTrendingSnapshots.stargazersCount,
        snapshotDate: ghTrendingSnapshots.snapshotDate,
      })
      .from(ghTrendingSnapshots)
      .where(
        and(
          eq(ghTrendingSnapshots.timeRange, timeRange),
          eq(ghTrendingSnapshots.language, language),
          eq(ghTrendingSnapshots.snapshotDate, today),
        ),
      )
      .orderBy(asc(ghTrendingSnapshots.rank))
      .limit(TOP_N);

    if (snapshots.length === 0) {
      const latest = await this.db
        .select({ snapshotDate: ghTrendingSnapshots.snapshotDate })
        .from(ghTrendingSnapshots)
        .where(
          and(
            eq(ghTrendingSnapshots.timeRange, timeRange),
            eq(ghTrendingSnapshots.language, language),
          ),
        )
        .orderBy(desc(ghTrendingSnapshots.snapshotDate))
        .limit(1);

      if (latest.length > 0) {
        const latestDate = latest[0].snapshotDate;
        const allSnapshots = await this.db
          .select({
            id: ghTrendingSnapshots.id,
            repoId: ghTrendingSnapshots.repoId,
            rank: ghTrendingSnapshots.rank,
            starsToday: ghTrendingSnapshots.starsToday,
            stargazersCount: ghTrendingSnapshots.stargazersCount,
            snapshotDate: ghTrendingSnapshots.snapshotDate,
          })
          .from(ghTrendingSnapshots)
          .where(
            and(
              eq(ghTrendingSnapshots.timeRange, timeRange),
              eq(ghTrendingSnapshots.language, language),
              eq(ghTrendingSnapshots.snapshotDate, latestDate),
            ),
          )
          .orderBy(asc(ghTrendingSnapshots.rank))
          .limit(TOP_N);
        return this.mapSnapshotsToList(allSnapshots);
      }

      const repos = await this.fetchTrendingFromGithub(timeRange, language);
      if (repos.length > 0) {
        await this.saveTrendingSnapshot(repos, timeRange, language);
        return this.getTrendingList(timeRange, language);
      }
      return { items: [], snapshotDate: today, total: 0 };
    }

    return this.mapSnapshotsToList(snapshots);
  }

  private async getAggregatedTrendingList(
    timeRange: TimeRange,
    date: string,
  ): Promise<{ items: TrendingRepo[]; snapshotDate: string; total: number }> {
    const allSnapshots = await this.db
      .select({
        repoId: ghTrendingSnapshots.repoId,
        rank: ghTrendingSnapshots.rank,
        starsToday: ghTrendingSnapshots.starsToday,
        stargazersCount: ghTrendingSnapshots.stargazersCount,
        snapshotDate: ghTrendingSnapshots.snapshotDate,
        language: ghTrendingSnapshots.language,
      })
      .from(ghTrendingSnapshots)
      .where(
        and(
          eq(ghTrendingSnapshots.timeRange, timeRange),
          eq(ghTrendingSnapshots.snapshotDate, date),
        ),
      );

    if (allSnapshots.length === 0) {
      const latest = await this.db
        .select({ snapshotDate: ghTrendingSnapshots.snapshotDate })
        .from(ghTrendingSnapshots)
        .where(eq(ghTrendingSnapshots.timeRange, timeRange))
        .orderBy(desc(ghTrendingSnapshots.snapshotDate))
        .limit(1);

      if (latest.length > 0) {
        const latestDate = latest[0].snapshotDate;
        const latestDateStr = String(latestDate);
        return this.getAggregatedTrendingList(timeRange, latestDateStr);
      }

      const repos = await this.fetchTrendingFromGithub(timeRange, 'JavaScript');
      if (repos.length > 0) {
        await this.fetchAndSave(timeRange);
        return this.getAggregatedTrendingList(timeRange, new Date().toISOString().split('T')[0]);
      }
      return { items: [], snapshotDate: date, total: 0 };
    }

    const seen = new Map<string, typeof allSnapshots[0]>();
    for (const s of allSnapshots) {
      if (!seen.has(s.repoId)) {
        seen.set(s.repoId, s);
      }
    }

    const uniqueSnapshots = Array.from(seen.values())
      .sort((a, b) => (b.stargazersCount || 0) - (a.stargazersCount || 0))
      .slice(0, 25)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    return this.mapSnapshotsToList(uniqueSnapshots);
  }

  private async mapSnapshotsToList(
    snapshots: Array<{
      repoId: string;
      rank: number;
      starsToday: number | null;
      stargazersCount: number | null;
      snapshotDate: string | Date;
    }>,
  ): Promise<{ items: TrendingRepo[]; snapshotDate: string; total: number }> {
    if (snapshots.length === 0) {
      return { items: [], snapshotDate: '', total: 0 };
    }

    const repoIds = snapshots.map((s) => s.repoId);
    const repos = await this.db
      .select()
      .from(ghRepositories)
      .where(inArray(ghRepositories.id, repoIds));

    const repoMap = new Map(repos.map((r) => [r.id, r]));

    const items: TrendingRepo[] = snapshots.map((s) => {
      const repo = repoMap.get(s.repoId)!;
      return {
        id: repo.id,
        githubId: Number(repo.githubId),
        fullName: repo.fullName,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        language: repo.language,
        htmlUrl: repo.htmlUrl,
        homepage: repo.homepage,
        stargazersCount: repo.stargazersCount || 0,
        forksCount: repo.forksCount || 0,
        openIssuesCount: repo.openIssuesCount || 0,
        topics: repo.topics || [],
        license: repo.license,
        rank: s.rank,
        starsToday: s.starsToday || 0,
        snapshotDate: String(s.snapshotDate),
      };
    });

    const snapshotDate = String(snapshots[0].snapshotDate);

    return { items, snapshotDate, total: items.length };
  }

  async getRankingHistory(
    repoId: string,
    timeRange: TimeRange,
    language: string = 'all',
    days: number = 30,
  ): Promise<{ history: RankingHistoryPoint[]; repo: GhRepository }> {
    const repoResult = await this.db
      .select()
      .from(ghRepositories)
      .where(eq(ghRepositories.id, repoId))
      .limit(1);

    if (repoResult.length === 0) {
      throw new Error('Repository not found');
    }

    const repo = repoResult[0];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const history = await this.db
      .select({
        snapshotDate: ghRankingHistory.snapshotDate,
        rank: ghRankingHistory.rank,
        stargazersCount: ghRankingHistory.stargazersCount,
        starsDelta: ghRankingHistory.starsDelta,
      })
      .from(ghRankingHistory)
      .where(
        and(
          eq(ghRankingHistory.repoId, repoId),
          eq(ghRankingHistory.timeRange, timeRange),
          eq(ghRankingHistory.language, language),
          gte(ghRankingHistory.snapshotDate, startDateStr),
        ),
      )
      .orderBy(asc(ghRankingHistory.snapshotDate))
      .limit(days);

    const repoData: GhRepository = {
      id: repo.id,
      githubId: Number(repo.githubId),
      fullName: repo.fullName,
      name: repo.name,
      owner: repo.owner,
      description: repo.description,
      language: repo.language,
      htmlUrl: repo.htmlUrl,
      homepage: repo.homepage,
      stargazersCount: repo.stargazersCount || 0,
      forksCount: repo.forksCount || 0,
      openIssuesCount: repo.openIssuesCount || 0,
      topics: repo.topics || [],
      license: repo.license,
    };

    return {
      repo: repoData,
      history: history.map((h) => ({
        snapshotDate: String(h.snapshotDate),
        rank: h.rank,
        stargazersCount: h.stargazersCount || 0,
        starsDelta: h.starsDelta || 0,
      })),
    };
  }
}
