import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TimeRange,
  TrendingListResponse,
  RankingHistoryResponse,
  FetchTriggerResponse,
} from '@shared/api.interface';

export async function getTrendingList(
  timeRange: TimeRange,
  language: string = 'all',
): Promise<TrendingListResponse> {
  const response = await axiosForBackend.get('/api/github-trending/list', {
    params: { timeRange, language },
  });
  return response.data;
}

export async function getRankingHistory(
  repoId: string,
  timeRange: TimeRange,
  language: string = 'all',
  days: number = 30,
): Promise<RankingHistoryResponse> {
  const response = await axiosForBackend.get('/api/github-trending/history', {
    params: { repoId, timeRange, language, days },
  });
  return response.data;
}

export async function triggerFetch(
  timeRange?: TimeRange,
  language?: string,
): Promise<FetchTriggerResponse> {
  const response = await axiosForBackend.post('/api/github-trending/fetch', null, {
    params: { timeRange, language },
  });
  return response.data;
}
