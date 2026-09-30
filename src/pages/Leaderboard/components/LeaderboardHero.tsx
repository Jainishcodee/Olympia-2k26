import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { SplitText } from '@/components/motion';

export const LeaderboardHero: React.FC<{
  mode: 'players' | 'teams';
  onModeChange: (m: 'players' | 'teams') => void;
  totalEntries: number;
}> = ({ mode, onModeChange, totalEntries }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { scrollY } = useScroll();

  const textY = useTransform(scrollY, [0, 500], [0, 100]);
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  return (
    <section className="relative pt-12 pb-16 overflow-hidden">
      {/* Background outline watermark */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 select-none text-[clamp(6rem,22vw,22rem)] font-black leading-none tracking-tighter"
      >
        <span
          className={
            isDay
              ? 'text-[#071426]/[0.03]'
              : 'text-white/[0.03]'
          }
          style={{ WebkitTextStroke: isDay ? '1px rgba(7,20,38,0.06)' : '1px rgba(255,255,255,0.06)' }}
        >
          {mode === 'players' ? 'ATHLETES' : 'TEAMS'}
        </span>
      </motion.div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Title Block */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-[#D9A441]" />
            <span
              className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] ${
                isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
              }`}
            >
              OLYMPIA 2K26 · CHAMPIONSHIP PERFORMANCE INDEX
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              RANKINGS LIVE
            </span>
          </div>

          <h1
            className={`text-[clamp(2.8rem,8vw,7.5rem)] font-black leading-[0.88] tracking-[-0.04em] uppercase ${
              isDay ? 'text-[#071426]' : 'text-white'
            }`}
          >
            <SplitText text="THE" charClassName={isDay ? 'text-[#071426]' : 'text-white'} />
            <br />
            <span className={isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'}>
              <SplitText text="RANKINGS" delay={0.15} />
            </span>
          </h1>

          {/* Kinetic Gold/Blue dual hairline */}
          <div className="mt-6 flex items-center gap-2 max-w-md">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-[2px] flex-1 origin-left bg-gradient-to-r from-[#D9A441] to-[#FFD21F]"
            />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-[2px] w-24 origin-left bg-gradient-to-r from-[#1264FF] to-[#155EEF]"
            />
          </div>
        </div>

        {/* Right side controls: Mode Toggle & Stats */}
        <div className="flex flex-col items-start md:items-end gap-4">
          <span className={`text-[11px] font-bold uppercase tracking-widest ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
            Tracking <span className="font-black text-[#D9A441]">{totalEntries}</span> Contenders
          </span>

          {/* Animated PLAYERS | TEAMS Toggle */}
          <div
            className={`relative p-1.5 rounded-2xl flex items-center border ${
              isDay ? 'bg-white/80 border-[#071426]/10 shadow-sm' : 'bg-[#071426] border-white/10'
            }`}
          >
            {(['players', 'teams'] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`relative z-10 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
                    active
                      ? isDay
                        ? 'text-white'
                        : 'text-[#071426]'
                      : isDay
                        ? 'text-[#071426]/60 hover:text-[#071426]'
                        : 'text-white/60 hover:text-white'
                  }`}
                >
                  {m === 'players' ? 'Athletes' : 'Teams'}
                  {active && (
                    <motion.div
                      layoutId="leaderboard-mode-pill"
                      className={`absolute inset-0 rounded-xl -z-10 ${
                        isDay
                          ? 'bg-[#071426] shadow-md'
                          : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] shadow-[0_0_20px_rgba(217,164,65,0.4)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
