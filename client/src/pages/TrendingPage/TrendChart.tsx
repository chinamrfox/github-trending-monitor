import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { motion } from 'framer-motion';
import type { RankingHistoryPoint, GhRepository, TimeRange } from '@shared/api.interface';

interface TrendChartProps {
  repo: GhRepository | null;
  history: RankingHistoryPoint[];
  timeRange: TimeRange;
  loading: boolean;
}

const TrendChart: React.FC<TrendChartProps> = ({ repo, history, timeRange, loading }) => {
  const option = useMemo<EChartsOption>(() => {
    if (!repo || history.length === 0) {
      return {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
        xAxis: { type: 'category', data: [], show: false },
        yAxis: { type: 'value', show: false },
        series: [],
      };
    }

    const dates = history.map((h) => h.snapshotDate.slice(5));
    const ranks = history.map((h) => h.rank);
    const stars = history.map((h) => h.stargazersCount);

    const maxRank = Math.max(...ranks, 25);
    const minRank = Math.min(...ranks, 1);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        axisPointer: { type: 'cross', lineStyle: { color: '#475569' } },
      },
      legend: {
        data: ['排名', '星标数'],
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '排名',
          inverse: true,
          min: 1,
          max: maxRank,
          nameTextStyle: { color: '#64748b', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        {
          type: 'value',
          name: '星标数',
          nameTextStyle: { color: '#64748b', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: (value: number) => {
              if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
              return value.toString();
            },
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '排名',
          type: 'line',
          yAxisIndex: 0,
          data: ranks,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
              ],
            },
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
        },
        {
          name: '星标数',
          type: 'line',
          yAxisIndex: 1,
          data: stars,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: '#10b981' },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
          animationDelay: 300,
        },
      ],
    };
  }, [repo, history]);

  if (loading) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <div className="h-6 bg-slate-700/30 rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-[300px] bg-slate-700/20 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-slate-200">
          {repo ? `${repo.fullName} · 趋势分析` : '选择仓库查看趋势'}
        </h3>
        {repo && (
          <span className="text-xs text-slate-500">
            {timeRange === 'daily' ? '今日' : timeRange === 'weekly' ? '本周' : '本月'}榜单
          </span>
        )}
      </div>
      {repo ? (
        <ReactECharts
          option={option}
          theme="dark"
          className="h-[300px] w-full"
          notMerge
        />
      ) : (
        <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
          <svg
            className="w-12 h-12 mb-3 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p className="text-sm">点击左侧列表中的仓库</p>
          <p className="text-xs mt-1">查看排名和星标数的历史变化</p>
        </div>
      )}
    </motion.div>
  );
};

export default TrendChart;
