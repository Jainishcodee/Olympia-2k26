import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { SplitText } from '@/components/motion';

export interface LeaderboardHeroProps {
  sportName: string;
  sportCategory: 'team' | 'individual';
  totalEntries: number;
}

export const LeaderboardHero: React.FC<LeaderboardHeroProps> = ({
  sportName,
  sportCategory,
  totalEntries,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { scrollY } = useScroll();

  const textY = useTransform(scrollY, [0, 500], [0, 80]);
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0.15]);

  return (
    <section className="relative pt-8 pb-12 sm:pb-16 overflow-hidden">
      {/* Background outline watermark based on current sport */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 select-none text-[clamp(4.5rem,18vw,16rem)] font-black leading-none tracking-tighter"
      >
        <span
          className={
            isDay
              ? 'text-[#071426]/[0.03]'
              : 'text-white/[0.03]'
          }
          style={{ WebkitTextStroke: isDay ? '1px rgba(7,20,38,0.06)' : '1px rgba(255,255,255,0.06)' }}
        >
          {sportName.toUpperCase()}
        </span>
      </motion.div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Title Block */}
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
            <span className="h-px w-6 sm:w-8 bg-[#D9A441] shrink-0" />
            <span
              className={`text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ${
                isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
              }`}
            >
              OLYMPIA 2K26 · {sportCategory === 'team' ? 'CHAMPIONSHIP STANDINGS' : 'TOP 3 CHAMPIONSHIP LEADERS'}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-widest shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE CHAMPIONSHIP RANKINGS
            </span>
          </div>

          <h1
            className={`text-[clamp(2.4rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.04em] uppercase ${
              isDay ? 'text-[#071426]' : 'text-white'
            }`}
          >
            <SplitText text="THE" charClassName={isDay ? 'text-[#071426]' : 'text-white'} />
            <br />
            <span className={isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'}>
              <SplitText text="RANKINGS" delay={0.15} />
            </span>
          </h1>

          {/* Dynamic Sport Headline Bar */}
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`text-lg sm:text-2xl font-black uppercase tracking-wider ${
                isDay ? 'text-[#071426]' : 'text-[#D9A441]'
              }`}
            >
              {sportName}
            </span>
            <span className="text-sm font-bold opacity-50 uppercase tracking-widest">
              / {sportCategory === 'team' ? 'TEAM STANDINGS' : 'CHAMPIONSHIP PODIUM'}
            </span>
          </div>

          {/* Kinetic Gold/Blue dual hairline */}
          <div className="mt-4 flex items-center gap-2 max-w-md">
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

        {/* Right side telemetry info */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div
            className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${
              isDay
                ? 'bg-white/90 border-[#071426]/10 shadow-sm'
                : 'bg-[#071426]/90 border-white/10 shadow-md'
            }`}
          >
            <div className="text-right">
              <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                Active Tracking
              </span>
              <span className="text-base font-black text-[#D9A441]">
                {sportCategory === 'team' ? `${totalEntries} SQUADS` : 'TOP 3 PODIUM SEEDS'}
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className={`text-[10px] font-semibold tracking-wider uppercase ${isDay ? 'text-[#071426]/50' : 'text-white/40'}`}>
            Realtime Firestore Sync Enabled
          </span>
        </div>
      </div>
    </section>
  );
};
