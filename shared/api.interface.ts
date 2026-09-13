export type TimeRange = 'daily' | 'weekly' | 'monthly';

export interface GhRepository {
  id: string;
  githubId: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  htmlUrl: string;
  homepage: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
  license: string | null;
}

export interface TrendingRepo extends GhRepository {
  rank: number;
  starsToday: number;
  snapshotDate: string;
}

export interface TrendingListResponse {
  items: TrendingRepo[];
  timeRange: TimeRange;
  language: string;
  snapshotDate: string;
  total: number;
}

export interface RankingHistoryPoint {
  snapshotDate: string;
  rank: number;
  stargazersCount: number;
  starsDelta: number;
}

export interface RankingHistoryResponse {
  repo: GhRepository;
  history: RankingHistoryPoint[];
  timeRange: TimeRange;
  language: string;
}

export interface FetchTriggerResponse {
  success: boolean;
  message: string;
  fetchedAt: string;
  count: number;
}

export const LANGUAGES = [
  { value: 'all', label: '全部语言' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Go', label: 'Go' },
  { value: 'Java', label: 'Java' },
  { value: 'Rust', label: 'Rust' },
  { value: 'C++', label: 'C++' },
  { value: 'C', label: 'C' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Kotlin', label: 'Kotlin' },
];

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'daily', label: '今日' },
  { value: 'weekly', label: '本周' },
  { value: 'monthly', label: '本月' },
];
