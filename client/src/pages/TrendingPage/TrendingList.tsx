import { motion, AnimatePresence } from 'framer-motion';
import { Star, GitFork, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendingRepo } from '@shared/api.interface';

interface TrendingListProps {
  items: TrendingRepo[];
  loading: boolean;
  selectedRepoId: string | null;
  onSelectRepo: (repo: TrendingRepo) => void;
}

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const TrendingList: React.FC<TrendingListProps> = ({
  items,
  loading,
  selectedRepoId,
  onSelectRepo,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="h-20 bg-slate-800/30 rounded-xl"
          >
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="h-full w-full bg-gradient-to-r from-slate-800/0 via-slate-700/30 to-slate-800/0 rounded-xl"
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-slate-500"
      >
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="text-lg">暂无数据</p>
        <p className="text-sm mt-1">尝试切换时间范围或语言</p>
      </motion.div>
    );
  }

  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <AnimatePresence mode="popLayout">
        {items.map((repo) => {
          const isSelected = selectedRepoId === repo.id;
          const rankChange = 0;
          return (
            <motion.li
              key={repo.id}
              variants={item}
              layout
              whileHover={{ x: 4 }}
              onClick={() => onSelectRepo(repo)}
              className={`relative cursor-pointer rounded-xl border transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'bg-slate-700/60 border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/40 hover:border-slate-600'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                  initial={false}
                />
              )}
              <div className="flex items-center gap-4 p-4 pl-5">
                <div className="flex flex-col items-center justify-center w-10 flex-shrink-0">
                  <span className={`text-xl font-bold ${
                    repo.rank <= 3 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {repo.rank}
                  </span>
                  <div className="flex items-center gap-0.5 text-xs mt-0.5">
                    {rankChange > 0 ? (
                      <><TrendingUp size={12} className="text-emerald-400" /><span className="text-emerald-400">{rankChange}</span></>
                    ) : rankChange < 0 ? (
                      <><TrendingDown size={12} className="text-red-400" /><span className="text-red-400">{Math.abs(rankChange)}</span></>
                    ) : (
                      <><Minus size={12} className="text-slate-500" /><span className="text-slate-500">-</span></>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-100 truncate">
                      {repo.fullName}
                    </h3>
                    {repo.language && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-slate-700/60 text-slate-300 rounded-full">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1 truncate">
                    {repo.description || '暂无描述'}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-medium">{formatNumber(repo.stargazersCount)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <GitFork size={16} />
                    <span className="text-sm">{formatNumber(repo.forksCount)}</span>
                  </div>
                  {repo.starsToday > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
                      <TrendingUp size={12} />
                      <span className="text-xs font-medium">+{formatNumber(repo.starsToday)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
};

export default TrendingList;
