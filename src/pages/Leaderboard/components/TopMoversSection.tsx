import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard } from '@/components/motion';
import type { LeaderboardItem } from './PodiumHero';

export const TopMoversSection: React.FC<{
  items: LeaderboardItem[];
  onSelect: (item: LeaderboardItem) => void;
}> = ({ items, onSelect }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const movers = React.useMemo(() => {
    return [...items]
      .sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend))
      .slice(0, 4);
  }, [items]);

  if (movers.length === 0) return null;

  return (
    <section className="my-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}`}>
            MOMENTUM INDEX
          </span>
          <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tight ${isDay ? 'text-[#071426]' : 'text-white'}`}>
            BIGGEST MOVERS
          </h3>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
          Live Shift Detection
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {movers.map((mover, i) => {
          const isUp = mover.trend >= 0;
          return (
            <motion.div
              key={mover.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <TiltCard
                tiltAngle={8}
                glowColor={isUp ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 77, 61, 0.15)'}
                cursorLabel="MOVER"
                onClick={() => onSelect(mover)}
              >
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 group cursor-pointer ${
                    isDay
                      ? 'bg-white/80 border-[#071426]/10 shadow-[0_4px_20px_rgba(7,20,38,0.03)] hover:border-[#155EEF]/50'
                      : 'bg-[#071426]/90 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[#D9A441]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-sm font-black px-3 py-1 rounded-full flex items-center gap-1 ${
                        isUp
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                          : 'bg-[#FF4D3D]/10 border border-[#FF4D3D]/30 text-[#FF4D3D]'
                      }`}
                    >
                      <span>{isUp ? '↑' : '↓'}</span>
                      <span>{Math.abs(mover.trend || 1)} Ranks</span>
                    </span>

                    <span className={`text-xs font-black ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                      Rank #{String(mover.rank).padStart(2, '0')}
                    </span>
                  </div>

                  <h4 className={`font-black uppercase text-base truncate mb-1 ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                    {mover.name}
                  </h4>
                  <p className={`text-xs font-bold truncate mb-3 ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                    {mover.subtitle} · {mover.sportId}
                  </p>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold">
                    <span className={isDay ? 'text-[#071426]/50' : 'text-white/50'}>Points</span>
                    <span className="font-black text-[#D9A441]">{mover.points} PTS</span>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
