import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { RollingScore } from '@/components/motion';
import { Link } from 'react-router-dom';
import type { LeaderboardItem } from './PodiumHero';

export const EntityProfileModal: React.FC<{
  item: LeaderboardItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (!item) return null;

  const formattedRank = String(item.rank).padStart(2, '0');
  const fallbackAvatar = `https://images.unsplash.com/photo-${
    (item.rank % 3 === 0)
      ? '1534528741775-53994a69daeb'
      : (item.rank % 3 === 1)
        ? '1507003211169-0a1dd7228f2d'
        : '1500648767791-00dcc994a43e'
  }?w=800&auto=format&fit=crop&q=80`;

  const winPercentage = item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl border shadow-2xl p-6 sm:p-10 z-10 ${
            isDay
              ? 'bg-[#FAF6EC] border-[#071426]/15 text-[#071426]'
              : 'bg-[#071426] border-white/10 text-white'
          }`}
        >
          {/* Giant Rank Watermark */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-2 text-[7rem] sm:text-[10rem] md:text-[14rem] font-black leading-none select-none opacity-5 text-[#155EEF] dark:text-[#D9A441]"
          >
            {formattedRank}
          </span>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-transform hover:scale-110 ${
              isDay ? 'bg-[#071426]/10 text-[#071426]' : 'bg-white/10 text-white'
            }`}
          >
            ✕
          </button>

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 relative z-10">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border-2 border-[#D9A441] shadow-lg bg-black/10">
              <img
                src={item.photo || item.logo || fallbackAvatar}
                alt={item.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#D9A441] text-[#071426] text-xs font-black uppercase tracking-widest">
                  RANK #{formattedRank}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#155EEF]/10 border border-[#155EEF]/30 text-[#155EEF] text-xs font-black uppercase tracking-wider">
                  {item.sportId}
                </span>
              </div>

              <h2 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                {item.name}
              </h2>
              <p className={`text-sm font-bold mt-1 ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                {item.subtitle} {item.position ? `• ${item.position}` : ''}
              </p>
            </div>
          </div>

          {/* Telemetry Stat Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-2xl border text-center ${isDay ? 'bg-white/80 border-[#071426]/10' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                Championship PTS
              </span>
              <span className="text-2xl font-black text-[#D9A441] tabular-nums">
                <RollingScore value={item.points} />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${isDay ? 'bg-white/80 border-[#071426]/10' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                Total Matches
              </span>
              <span className={`text-2xl font-black ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                {item.matches}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${isDay ? 'bg-white/80 border-[#071426]/10' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                Win Record
              </span>
              <span className="text-2xl font-black text-emerald-500">
                {item.wins}W - {item.losses}L
              </span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${isDay ? 'bg-white/80 border-[#071426]/10' : 'bg-white/5 border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                Win Efficiency
              </span>
              <span className="text-2xl font-black text-[#155EEF]">
                {winPercentage}%
              </span>
            </div>
          </div>

          {/* Performance Overview & Action CTA */}
          <div className={`p-6 rounded-2xl border mb-6 ${isDay ? 'bg-white/90 border-[#071426]/10' : 'bg-white/5 border-white/10'}`}>
            <h4 className="text-xs font-black uppercase tracking-widest mb-3 text-[#D9A441]">
              ARENA PERFORMANCE DOSSIER
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDay ? 'text-[#071426]/75' : 'text-white/75'}`}>
              Ranked #{formattedRank} overall in the official Olympia 2K26 championship ladder.
              Demonstrating consistent performance across {item.matches} fixtures with a {winPercentage}% win efficiency rating.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to={item.type === 'player' ? `/players/${item.id}` : `/teams/${item.id}`}
              className={`px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                isDay
                  ? 'bg-[#155EEF] text-white hover:bg-[#071426]'
                  : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] hover:brightness-110'
              }`}
            >
              Full Profile Dossier →
            </Link>

            <button
              onClick={onClose}
              className={`px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest border transition-all ${
                isDay ? 'border-[#071426]/20 text-[#071426] hover:bg-[#071426]/5' : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
