import { motion } from 'framer-motion';
import type { TimeRange } from '@shared/api.interface';
import { LANGUAGES, TIME_RANGES } from '@shared/api.interface';

interface TrendingFilterProps {
  timeRange: TimeRange;
  language: string;
  onTimeRangeChange: (range: TimeRange) => void;
  onLanguageChange: (lang: string) => void;
}

const TrendingFilter: React.FC<TrendingFilterProps> = ({
  timeRange,
  language,
  onTimeRangeChange,
  onLanguageChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 font-medium">时间范围</span>
        <div className="flex bg-slate-900/50 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <motion.button
              key={range.value}
              onClick={() => onTimeRangeChange(range.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 font-medium">编程语言</span>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-slate-900/50 text-slate-200 text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};

export default TrendingFilter;
