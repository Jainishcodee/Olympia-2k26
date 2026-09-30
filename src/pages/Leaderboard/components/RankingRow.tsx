import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { RollingScore, Magnetic } from '@/components/motion';
import type { LeaderboardItem } from './PodiumHero';

export const RankingRow: React.FC<{
  item: LeaderboardItem;
  index: number;
  onSelect: (item: LeaderboardItem) => void;
}> = ({ item, index, onSelect }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const [isHovered, setIsHovered] = useState(false);

  const formattedRank = String(item.rank).padStart(2, '0');
  const isMilestone = item.rank === 5 || item.rank === 10 || item.rank === 15 || item.rank === 20;

  const getTrendBadge = (trend: number) => {
    if (trend > 0) {
      return (
        <span
          className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-500"
          aria-label={`Moved up by ${trend} ranks`}
        >
          <span>↑</span>
          <span>{trend}</span>
        </span>
      );
    }
    if (trend < 0) {
      return (
        <span
          className="inline-flex items-center gap-0.5 text-xs font-black text-[#FF4D3D]"
          aria-label={`Moved down by ${Math.abs(trend)} ranks`}
        >
          <span>↓</span>
          <span>{Math.abs(trend)}</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-400"
        aria-label="No rank change"
      >
        <span>—</span>
        <span>0</span>
      </span>
    );
  };

  const fallbackAvatar = `https://images.unsplash.com/photo-${
    (item.rank % 4 === 0)
      ? '1534528741775-53994a69daeb'
      : (item.rank % 4 === 1)
        ? '1507003211169-0a1dd7228f2d'
        : (item.rank % 4 === 2)
          ? '1500648767791-00dcc994a43e'
          : '1492562080023-ab3db95bfbce'
  }?w=400&auto=format&fit=crop&q=80`;

  return (
    <motion.div
      layout
      layoutId={`ranking-row-${item.id}`}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(item)}
      className={`relative rounded-2xl border mb-4 overflow-hidden transition-all duration-300 cursor-pointer group ${
        isMilestone
          ? isDay
            ? 'bg-gradient-to-r from-white via-[#F4F8FF] to-white border-[#155EEF]/40 shadow-[0_10px_30px_rgba(21,94,239,0.08)]'
            : 'bg-gradient-to-r from-[#0B1A30] via-[#071426] to-[#0B1A30] border-[#1264FF]/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
          : isDay
            ? 'bg-white/80 border-[#071426]/10 hover:border-[#155EEF]/50 shadow-[0_4px_20px_rgba(7,20,38,0.03)]'
            : 'bg-[#071426]/80 border-white/10 hover:border-[#D9A441]/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Background Watermark Repeating Number on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none hidden lg:flex items-center gap-6 text-[clamp(4rem,8vw,7rem)] font-black leading-none tracking-tighter opacity-[0.05] text-[#155EEF] dark:text-[#D9A441]"
          >
            <span>{formattedRank}</span>
            <span>{formattedRank}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Row Content */}
      <div className="p-3.5 sm:p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative z-10">
        {/* Left: Rank Number + Photo Cutout + Names */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
          {/* Rank + Trend */}
          <div className="flex flex-col items-center justify-center w-10 sm:w-14 shrink-0 text-center">
            <span
              className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-none ${
                isMilestone
                  ? 'text-[#155EEF] dark:text-[#FFD21F]'
                  : isDay
                    ? 'text-[#071426]'
                    : 'text-white'
              }`}
            >
              {formattedRank}
            </span>
            <div className="mt-1">{getTrendBadge(item.trend)}</div>
          </div>

          {/* Portrait Image Cutout */}
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl overflow-hidden shrink-0 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <img
              src={item.photo || item.logo || fallbackAvatar}
              alt={item.name}
              className="h-full w-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Name + Team/Affiliation + Sport Badge */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5 sm:mb-1">
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full ${
                  isDay
                    ? 'bg-[#071426]/5 text-[#155EEF]'
                    : 'bg-white/5 text-[#D9A441]'
                }`}
              >
                {item.sportId}
              </span>
              {item.position && (
                <span className={`text-[9px] sm:text-[10px] font-bold truncate max-w-[120px] sm:max-w-none ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                  • {item.position}
                </span>
              )}
            </div>

            <h4
              className={`text-base sm:text-lg md:text-xl font-black uppercase tracking-tight truncate ${
                isDay ? 'text-[#071426]' : 'text-white'
              }`}
            >
              {item.name}
            </h4>
            <p className={`text-xs font-bold truncate ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
              {item.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Points + Statistics + Action */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6 md:gap-8 lg:gap-10 border-t md:border-t-0 pt-3 md:pt-0 border-black/5 dark:border-white/5 shrink-0">
          {/* Record */}
          <div className="text-left md:text-center min-w-[55px] sm:min-w-0">
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
              Matches
            </span>
            <span className={`text-xs sm:text-sm md:text-base font-black ${isDay ? 'text-[#071426]' : 'text-white'}`}>
              {item.wins}W - {item.losses}L
            </span>
          </div>

          {/* Win Rate / Rating */}
          <div className="text-left md:text-center min-w-[45px] sm:min-w-0">
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
              Rating
            </span>
            <span className="text-xs sm:text-sm md:text-base font-black text-emerald-500">
              {item.rating ? `${item.rating}★` : `${item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0}%`}
            </span>
          </div>

          {/* Points */}
          <div className="text-right min-w-[70px] sm:min-w-0">
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
              <span className="hidden sm:inline">Championship </span>PTS
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-[#D9A441] tabular-nums">
              <RollingScore value={item.points} />
            </div>
          </div>

          {/* Magnetic View Profile Button */}
          <div className="hidden md:block">
            <Magnetic strength={0.3} radius={70}>
              <span
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all ${
                  isDay
                    ? 'bg-[#071426] text-white group-hover:bg-[#155EEF]'
                    : 'bg-white/10 text-white group-hover:bg-[#D9A441] group-hover:text-[#071426]'
                }`}
              >
                <span>View</span>
                <span className="text-sm">→</span>
              </span>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Expanded Accordion Statistics Drawer on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`px-6 pb-5 pt-3 border-t text-xs flex items-center justify-between gap-4 ${
              isDay ? 'border-[#071426]/5 bg-[#071426]/[0.02]' : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-6">
              <span className={isDay ? 'text-[#071426]/70' : 'text-white/70'}>
                <strong>Total Fixtures:</strong> {item.matches}
              </span>
              <span className={isDay ? 'text-[#071426]/70' : 'text-white/70'}>
                <strong>Win Percentage:</strong> {item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0}%
              </span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#155EEF] dark:text-[#D9A441]">
              Click to Open Telemetry Dossier ↗
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
