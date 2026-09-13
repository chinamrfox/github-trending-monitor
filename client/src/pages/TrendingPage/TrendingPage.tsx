import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Github, RefreshCw, Activity } from 'lucide-react';
import TrendingFilter from './TrendingFilter';
import TrendingList from './TrendingList';
import TrendChart from './TrendChart';
import { githubTrendingApi } from '@client/src/api';
import type { TimeRange, TrendingRepo, RankingHistoryPoint, GhRepository } from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const TrendingPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [language, setLanguage] = useState<string>('all');
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<TrendingRepo | null>(null);
  const [historyData, setHistoryData] = useState<RankingHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const result = await githubTrendingApi.getTrendingList(timeRange, language);
      setRepos(result.items);
      setSnapshotDate(result.snapshotDate);
      if (result.items.length > 0 && !selectedRepo) {
        setSelectedRepo(result.items[0]);
      }
    } catch (error) {
      logger.error('获取热榜数据失败', error);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, language, selectedRepo]);

  const fetchHistory = useCallback(async (repo: GhRepository) => {
    setHistoryLoading(true);
    try {
      const result = await githubTrendingApi.getRankingHistory(
        repo.id,
        timeRange,
        language,
        30,
      );
      setHistoryData(result.history);
    } catch (error) {
      logger.error('获取历史数据失败', error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [timeRange, language]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await githubTrendingApi.triggerFetch(timeRange, language);
      await fetchTrending();
    } catch (error) {
      logger.error('刷新数据失败', error);
    } finally {
      setRefreshing(false);
    }
  }, [timeRange, language, fetchTrending]);

  const handleSelectRepo = useCallback((repo: TrendingRepo) => {
    setSelectedRepo(repo);
    fetchHistory(repo);
  }, [fetchHistory]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    setSelectedRepo(null);
    setHistoryData([]);
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
    setSelectedRepo(null);
    setHistoryData([]);
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  useEffect(() => {
    if (selectedRepo) {
      fetchHistory(selectedRepo);
    }
  }, [selectedRepo, fetchHistory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-emerald-950/10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Github size={36} className="text-slate-200" />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-blue-400/30 rounded-full blur-lg"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                  GitHub Trending Monitor
                </h1>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Activity size={12} />
                  <span>实时追踪 GitHub 热榜趋势</span>
                  {snapshotDate && (
                    <span className="text-slate-600">· 数据日期 {snapshotDate}</span>
                  )}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              <span>刷新数据</span>
            </motion.button>
          </div>
        </motion.header>

        <div className="mb-6">
          <TrendingFilter
            timeRange={timeRange}
            language={language}
            onTimeRangeChange={handleTimeRangeChange}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrendingList
              items={repos}
              loading={loading}
              selectedRepoId={selectedRepo?.id || null}
              onSelectRepo={handleSelectRepo}
            />
          </div>

          <div className="lg:col-span-1">
            <TrendChart
              repo={selectedRepo}
              history={historyData}
              timeRange={timeRange}
              loading={historyLoading}
            />

            {selectedRepo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-slate-300 mb-3">仓库信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">所有者</span>
                    <span className="text-slate-300">{selectedRepo.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">语言</span>
                    <span className="text-slate-300">{selectedRepo.language || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">当前排名</span>
                    <span className="text-amber-400 font-medium">#{selectedRepo.rank}</span>
                  </div>
                  {selectedRepo.license && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">许可证</span>
                      <span className="text-slate-300">{selectedRepo.license}</span>
                    </div>
                  )}
                </div>
                {selectedRepo.topics && selectedRepo.topics.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs text-slate-500">标签</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedRepo.topics.slice(0, 6).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <UniversalLink
                  to={selectedRepo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-colors"
                >
                  <Github size={14} />
                  <span>在 GitHub 查看</span>
                </UniversalLink>
              </motion.div>
            )}
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-600"
        >
          <p>数据来源: GitHub API · 每日自动更新 · Powered by Miaoda</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default TrendingPage;
