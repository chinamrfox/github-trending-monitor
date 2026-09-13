import { Controller, Get, Query, Post, Logger } from '@nestjs/common';
import { GithubTrendingService } from './github-trending.service';
import type {
  TimeRange,
  TrendingListResponse,
  RankingHistoryResponse,
  FetchTriggerResponse,
} from '@shared/api.interface';

@Controller('api/github-trending')
export class GithubTrendingController {
  private readonly logger = new Logger(GithubTrendingController.name);

  constructor(private readonly githubTrendingService: GithubTrendingService) {}

  @Get('list')
  async getTrendingList(
    @Query('timeRange') timeRange: TimeRange = 'daily',
    @Query('language') language: string = 'all',
  ): Promise<TrendingListResponse> {
    const result = await this.githubTrendingService.getTrendingList(timeRange, language);
    return {
      items: result.items,
      timeRange,
      language,
      snapshotDate: result.snapshotDate,
      total: result.total,
    };
  }

  @Get('history')
  async getRankingHistory(
    @Query('repoId') repoId: string,
    @Query('timeRange') timeRange: TimeRange = 'daily',
    @Query('language') language: string = 'all',
    @Query('days') days: string = '30',
  ): Promise<RankingHistoryResponse> {
    const result = await this.githubTrendingService.getRankingHistory(
      repoId,
      timeRange,
      language,
      parseInt(days, 10),
    );
    return {
      repo: result.repo,
      history: result.history,
      timeRange,
      language,
    };
  }

  @Post('fetch')
  async triggerFetch(
    @Query('timeRange') timeRange?: TimeRange,
    @Query('language') language?: string,
  ): Promise<FetchTriggerResponse> {
    try {
      let count: number;
      if (timeRange) {
        count = await this.githubTrendingService.fetchAndSave(timeRange, language);
      } else {
        count = await this.githubTrendingService.fetchAllRanges();
      }
      return {
        success: true,
        message: '抓取成功',
        fetchedAt: new Date().toISOString(),
        count,
      };
    } catch (error) {
      this.logger.error('手动触发抓取失败', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '抓取失败',
        fetchedAt: new Date().toISOString(),
        count: 0,
      };
    }
  }
}
