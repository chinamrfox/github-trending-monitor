/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, date, foreignKey, index, integer, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const ghRankingHistory = pgTable("gh_ranking_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoId: uuid("repo_id").notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  timeRange: varchar("time_range", { length: 20 }).notNull().default('daily'),
  language: varchar("language", { length: 50 }).notNull().default('all'),
  rank: integer("rank").notNull(),
  stargazersCount: integer("stargazers_count").default(0),
  starsDelta: integer("stars_delta").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("gh_ranking_history_repo_id_snapshot_date_time_range_languag_key").on(table.repoId, table.snapshotDate, table.timeRange, table.language),
  index("idx_gh_ranking_history_repo").on(table.repoId, table.timeRange, table.language),
  index("idx_gh_ranking_history_date").on(table.snapshotDate),
  foreignKey({
    columns: [table.repoId],
    foreignColumns: [ghRepositories.id],
    name: "gh_ranking_history_repo_id_fkey",
  }),
]);

export const ghTrendingSnapshots = pgTable("gh_trending_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  snapshotDate: date("snapshot_date").notNull(),
  timeRange: varchar("time_range", { length: 20 }).notNull().default('daily'),
  language: varchar("language", { length: 50 }).notNull().default('all'),
  repoId: uuid("repo_id").notNull(),
  rank: integer("rank").notNull(),
  starsToday: integer("stars_today").default(0),
  stargazersCount: integer("stargazers_count").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("gh_trending_snapshots_snapshot_date_time_range_language_rep_key").on(table.snapshotDate, table.timeRange, table.language, table.repoId),
  index("idx_gh_trending_snapshots_date").on(table.snapshotDate, table.timeRange, table.language),
  foreignKey({
    columns: [table.repoId],
    foreignColumns: [ghRepositories.id],
    name: "gh_trending_snapshots_repo_id_fkey",
  }),
]);

export const ghRepositories = pgTable("gh_repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: bigint("github_id", { mode: 'number' }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  description: text("description"),
  language: varchar("language", { length: 100 }),
  htmlUrl: varchar("html_url", { length: 500 }).notNull(),
  homepage: varchar("homepage", { length: 500 }),
  stargazersCount: integer("stargazers_count").default(0),
  forksCount: integer("forks_count").default(0),
  openIssuesCount: integer("open_issues_count").default(0),
  topics: text("topics").array().default([]),
  license: varchar("license", { length: 100 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("gh_repositories_github_id_key").on(table.githubId),
]);

// table aliases
export const ghRankingHistoryTable = ghRankingHistory;
export const ghRepositoriesTable = ghRepositories;
export const ghTrendingSnapshotsTable = ghTrendingSnapshots;
