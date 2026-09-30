import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore } from '@/components/motion';
import { getTeamLogo } from '@/utils/teamLogos';

export interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  subtitle: string;
  sportId: string;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  rating?: number;
  photo?: string;
  logo?: string;
  trend: number;
  type: 'player' | 'team';
  role?: string;
  position?: string;
}

export const PodiumHero: React.FC<{
  items: LeaderboardItem[];
  mode: 'players' | 'teams';
  onSelect: (item: LeaderboardItem) => void;
}> = ({ items, mode, onSelect }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (items.length < 3) return null;

  const first = items[0];
  const second = items[1];
  const third = items[2];

  const getFallbackAvatar = (name: string, seed: number) => {
    return `https://images.unsplash.com/photo-${
      seed === 1
        ? '1534528741775-53994a69daeb'
        : seed === 2
          ? '1507003211169-0a1dd7228f2d'
          : '1500648767791-00dcc994a43e'
    }?w=800&auto=format&fit=crop&q=80`;
  };

  return (
    <section className="relative mb-20">
      {/* Background Arena Ambient Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[400px] rounded-full blur-[140px] opacity-35 bg-gradient-to-r from-[#1264FF]/20 via-[#D9A441]/25 to-[#FF6A00]/20"
      />

      {/* Grid Composition: #2 on left, #1 in center (prominent), #3 on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-8 items-end max-w-7xl mx-auto">
        
        {/* ========================================================= */}
        {/* #02 PODIUM — Electric Blue                                */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 md:col-span-1 lg:col-span-3 order-2 md:order-2 lg:order-1"
        >
          <TiltCard
            tiltAngle={6}
            glowColor="rgba(21, 94, 239, 0.25)"
            cursorLabel="02 RANK"
            onClick={() => onSelect(second)}
          >
            <div
              className={`relative rounded-3xl p-4 sm:p-6 md:p-7 border overflow-hidden transition-all duration-300 group cursor-pointer ${
                isDay
                  ? 'bg-gradient-to-b from-white to-[#F0F4FF] border-[#155EEF]/20 shadow-[0_15px_40px_rgba(21,94,239,0.08)] hover:border-[#155EEF]'
                  : 'bg-gradient-to-b from-[#0B1A30] to-[#040B17] border-[#1264FF]/30 shadow-[0_15px_40px_rgba(0,0,0,0.7)] hover:border-[#1264FF]'
              }`}
            >
              {/* Giant Rank Watermark */}
              <span
                aria-hidden
                className="absolute right-2 top-2 text-5xl sm:text-7xl md:text-8xl font-black leading-none select-none opacity-10 text-[#155EEF] pointer-events-none"
              >
                02
              </span>

              {/* Contender Image with Cutout Mask */}
              <div className="relative h-40 sm:h-48 md:h-52 w-full mb-3 sm:mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#155EEF]/20 to-transparent" />
                <img
                  src={second.photo || second.logo || getTeamLogo(second.name) || getFallbackAvatar(second.name, 2)}
                  alt={second.name}
                  className="h-full w-full object-cover object-top rounded-2xl filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#155EEF] text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase shadow-md">
                  #02 Contender
                </span>
              </div>

              {/* Contender Info */}
              <div className="relative z-10">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#155EEF] block truncate">
                  {second.sportId} · {second.subtitle}
                </span>
                <h3
                  className={`text-base sm:text-lg md:text-xl font-black uppercase tracking-tight truncate mt-0.5 ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}
                >
                  {second.name}
                </h3>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Points
                    </span>
                    <div className="text-lg sm:text-xl md:text-2xl font-black text-[#155EEF] tabular-nums">
                      <RollingScore value={second.points} />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Record
                    </span>
                    <p className={`text-xs sm:text-sm font-black ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                      {second.wins}W - {second.losses}L
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>


        {/* ========================================================= */}
        {/* #01 CHAMPION — Olympia Gold (Dominant Hero Centerpiece)    */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 md:col-span-2 lg:col-span-6 order-1 md:order-1 lg:order-2"
        >
          <TiltCard
            tiltAngle={8}
            glowColor="rgba(217, 164, 65, 0.35)"
            cursorLabel="CHAMPION"
            onClick={() => onSelect(first)}
          >
            <div
              className={`relative rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 overflow-hidden transition-all duration-500 group cursor-pointer ${
                isDay
                  ? 'bg-gradient-to-b from-[#FFFDF8] via-white to-[#FAF6EC] border-[#D9A441] shadow-[0_25px_60px_rgba(217,164,65,0.2)]'
                  : 'bg-gradient-to-b from-[#18150D] via-[#0B1729] to-[#040B17] border-[#D9A441] shadow-[0_25px_70px_rgba(0,0,0,0.9)]'
              }`}
            >
              {/* Olympia Gold Flame Aura Effect behind #1 */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D9A441]/25 via-transparent to-transparent pointer-events-none"
              />

              {/* Giant 01 Crown Watermark */}
              <span
                aria-hidden
                className="absolute right-2 top-2 text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black leading-none select-none opacity-10 text-[#D9A441] pointer-events-none"
              >
                01
              </span>

              {/* Crown Banner */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10 flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest shadow-[0_0_20px_rgba(217,164,65,0.4)]">
                  <span>👑</span>
                  <span>THE OLYMPIA CHAMPION</span>
                </div>

                <div className="flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] text-[10px] sm:text-xs font-black shrink-0">
                  <span>★</span>
                  <span>RANK 01</span>
                </div>
              </div>

              {/* Big Editorial Cutout Image */}
              <div className="relative h-48 sm:h-60 md:h-72 w-full mb-4 sm:mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#D9A441]/20 to-transparent" />
                <img
                  src={first.photo || first.logo || getTeamLogo(first.name) || getFallbackAvatar(first.name, 1)}
                  alt={first.name}
                  className="h-full w-full object-cover object-top rounded-3xl filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Title & Stats */}
              <div className="relative z-10">
                <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.2em] text-[#D9A441] block truncate">
                  {first.sportId} · {first.subtitle}
                </span>

                <h2
                  className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight mt-1 mb-3 sm:mb-5 drop-shadow-md truncate ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}
                >
                  {first.name}
                </h2>

                {/* Performance HUD row */}
                <div className={`p-3 sm:p-4 md:p-5 rounded-2xl border grid grid-cols-3 gap-1.5 sm:gap-3 text-center ${
                  isDay
                    ? 'bg-white/90 border-[#D9A441]/30 shadow-sm'
                    : 'bg-[#040B17]/80 border-[#D9A441]/30'
                }`}>
                  <div>
                    <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Score PTS
                    </span>
                    <span className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-[#D9A441] tabular-nums">
                      <RollingScore value={first.points} />
                    </span>
                  </div>

                  <div className="border-x border-black/10 dark:border-white/10">
                    <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Wins
                    </span>
                    <span className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-black ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                      {first.wins}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider block ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Win Rate
                    </span>
                    <span className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-emerald-500">
                      {first.matches > 0 ? Math.round((first.wins / first.matches) * 100) : 100}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>


        {/* ========================================================= */}
        {/* #03 PODIUM — Bright Yellow / Orange                        */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 md:col-span-1 lg:col-span-3 order-3 md:order-3 lg:order-3"
        >
          <TiltCard
            tiltAngle={6}
            glowColor="rgba(255, 106, 0, 0.25)"
            cursorLabel="03 RANK"
            onClick={() => onSelect(third)}
          >
            <div
              className={`relative rounded-3xl p-4 sm:p-6 md:p-7 border overflow-hidden transition-all duration-300 group cursor-pointer ${
                isDay
                  ? 'bg-gradient-to-b from-white to-[#FFF6F0] border-[#FF6A00]/20 shadow-[0_15px_40px_rgba(255,106,0,0.08)] hover:border-[#FF6A00]'
                  : 'bg-gradient-to-b from-[#24130A] to-[#040B17] border-[#FF6A00]/30 shadow-[0_15px_40px_rgba(0,0,0,0.7)] hover:border-[#FF6A00]'
              }`}
            >
              {/* Giant Rank Watermark */}
              <span
                aria-hidden
                className="absolute right-2 top-2 text-5xl sm:text-7xl md:text-8xl font-black leading-none select-none opacity-10 text-[#FF6A00] pointer-events-none"
              >
                03
              </span>

              {/* Contender Image with Cutout Mask */}
              <div className="relative h-40 sm:h-48 md:h-52 w-full mb-3 sm:mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#FF6A00]/20 to-transparent" />
                <img
                  src={third.photo || third.logo || getTeamLogo(third.name) || getFallbackAvatar(third.name, 3)}
                  alt={third.name}
                  className="h-full w-full object-cover object-top rounded-2xl filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#FF6A00] text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase shadow-md">
                  #03 Contender
                </span>
              </div>

              {/* Contender Info */}
              <div className="relative z-10">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FF6A00] block truncate">
                  {third.sportId} · {third.subtitle}
                </span>
                <h3
                  className={`text-base sm:text-lg md:text-xl font-black uppercase tracking-tight truncate mt-0.5 ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}
                >
                  {third.name}
                </h3>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Points
                    </span>
                    <div className="text-lg sm:text-xl md:text-2xl font-black text-[#FF6A00] tabular-nums">
                      <RollingScore value={third.points} />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Record
                    </span>
                    <p className={`text-xs sm:text-sm font-black ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                      {third.wins}W - {third.losses}L
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

      </div>
    </section>
  );
};
