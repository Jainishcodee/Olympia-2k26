import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore } from '@/components/motion';
import type { Player } from '@/types';
import type { LeaderboardItem } from './PodiumHero';

export interface IndividualPodiumViewProps {
  players: Player[];
  sportId: string;
  sportName: string;
  onSelectPlayer: (item: LeaderboardItem) => void;
}

export const IndividualPodiumView: React.FC<IndividualPodiumViewProps> = ({
  players,
  sportId,
  sportName,
  onSelectPlayer,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest opacity-60">
          No individual contenders registered for this discipline yet.
        </p>
      </div>
    );
  }

  // Sorted players by points descending
  const sorted = [...players].sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0));
  
  // TOP 3 ONLY per strict user requirement
  const top3 = sorted.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const toLeaderboardItem = (player: Player, rank: number): LeaderboardItem => {
    return {
      id: player.id,
      rank,
      name: player.name,
      subtitle: player.position || 'Olympia Contender',
      sportId: player.sportId || sportId,
      points: player.stats?.points || 0,
      matches: player.stats?.matchesPlayed || 0,
      wins: player.stats?.wins || 0,
      losses: player.stats?.losses || 0,
      rating: player.stats?.rating || 4.8,
      photo: player.photo,
      trend: rank === 1 ? 2 : rank === 2 ? 1 : 0,
      type: 'player',
      role: player.role,
      position: player.position,
    };
  };

  return (
    <div className="relative mb-20 max-w-7xl mx-auto">
      {/* Background ambient lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[450px] rounded-full blur-[140px] opacity-35 bg-gradient-to-r from-[#1264FF]/25 via-[#D9A441]/35 to-[#FF4D3D]/25"
      />

      {/* Header bar */}
      <div className="text-center mb-10 sm:mb-14">
        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] ${isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}`}>
          {sportName.toUpperCase()} CHAMPIONSHIP
        </span>
        <h2 className={`text-2xl sm:text-4xl font-black uppercase tracking-tight mt-1 ${isDay ? 'text-[#071426]' : 'text-white'}`}>
          CURRENT CHAMPIONSHIP LEADERS
        </h2>
        <p className={`text-xs font-bold uppercase tracking-wider mt-1 opacity-60`}>
          Exclusive Top 3 Championship Podium
        </p>
      </div>

      {/* Dynamic Podium Layout: #02 (Left), #01 (Center - Dominant), #03 (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-end">
        
        {/* #02 SILVER CONTENDER (Left, Medium Elevation) */}
        {second && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 order-2 lg:order-1"
          >
            <TiltCard
              tiltAngle={6}
              glowColor="rgba(21, 94, 239, 0.25)"
              cursorLabel="02 SILVER"
              onClick={() => onSelectPlayer(toLeaderboardItem(second, 2))}
            >
              <div
                className={`relative rounded-3xl p-6 sm:p-7 border overflow-hidden transition-all duration-300 group cursor-pointer ${
                  isDay
                    ? 'bg-gradient-to-b from-white to-[#F0F4FF] border-[#155EEF]/25 shadow-[0_15px_40px_rgba(21,94,239,0.08)] hover:border-[#155EEF]'
                    : 'bg-gradient-to-b from-[#0B1A30] to-[#040B17] border-[#1264FF]/30 shadow-[0_15px_40px_rgba(0,0,0,0.7)] hover:border-[#1264FF]'
                }`}
              >
                <span
                  aria-hidden
                  className="absolute right-3 top-2 text-7xl font-black leading-none select-none opacity-10 text-[#1264FF] pointer-events-none"
                >
                  02
                </span>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-[#1264FF] text-white text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1.5">
                    🥈 #02 SILVER SEED
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1264FF]">
                    {second.stats?.wins || 0}W · {second.stats?.losses || 0}L
                  </span>
                </div>

                <div className="relative h-56 sm:h-64 w-full mb-5 rounded-2xl overflow-hidden bg-black/10">
                  <img
                    src={second.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'}
                    alt={second.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#4B90FF] block">
                      {second.position || 'Championship Seed'}
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight truncate drop-shadow-md">
                      {second.name}
                    </h3>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Championship Score
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#1264FF]">
                      <RollingScore value={second.stats?.points || 0} />
                      <span className="text-xs uppercase ml-1.5 font-bold">PTS</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#1264FF]/10 text-[#1264FF] group-hover:bg-[#1264FF] group-hover:text-white transition-all"
                  >
                    PROFILE →
                  </button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}

        {/* #01 GOLD CHAMPION (Center, Dominant Elevation & Aura) */}
        {first && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 order-1 lg:order-2 -mt-4 lg:-mt-10"
          >
            <TiltCard
              tiltAngle={8}
              glowColor="rgba(217, 164, 65, 0.45)"
              cursorLabel="01 CHAMPION"
              onClick={() => onSelectPlayer(toLeaderboardItem(first, 1))}
            >
              <div
                className={`relative rounded-3xl p-6 sm:p-9 border-2 overflow-hidden transition-all duration-300 group cursor-pointer ${
                  isDay
                    ? 'bg-gradient-to-b from-[#FFFDF8] via-white to-[#FDF6E2] border-[#D9A441] shadow-[0_25px_60px_rgba(217,164,65,0.25)] hover:border-[#FFD21F]'
                    : 'bg-gradient-to-b from-[#181D26] via-[#10141D] to-[#080A0E] border-[#D9A441] shadow-[0_25px_70px_rgba(217,164,65,0.3)] hover:border-[#FFD21F]'
                }`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-[#FFD21F] to-[#D9A441]"
                />

                <span
                  aria-hidden
                  className="absolute right-4 top-2 text-8xl font-black leading-none select-none opacity-15 text-[#D9A441] pointer-events-none"
                >
                  01
                </span>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] text-xs font-black tracking-widest uppercase shadow-lg flex items-center gap-1.5 animate-pulse">
                    🥇 #01 OLYMPIA CHAMPION
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#D9A441]">
                    {first.stats?.wins || 0}W · {first.stats?.losses || 0}L
                  </span>
                </div>

                <div className="relative h-64 sm:h-72 md:h-80 w-full mb-6 rounded-2xl overflow-hidden bg-black/15 border border-[#D9A441]/40">
                  <img
                    src={first.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'}
                    alt={first.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD21F] block">
                      {first.position || 'Reigning Champion'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight truncate drop-shadow-lg">
                      {first.name}
                    </h3>
                    {first.bio && (
                      <p className="text-[11px] line-clamp-2 mt-1 text-white/80 font-medium">
                        {first.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                      Championship Score
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-[#D9A441]">
                      <RollingScore value={first.stats?.points || 0} />
                      <span className="text-sm uppercase ml-1.5 font-bold">PTS</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] shadow-md group-hover:scale-105 active:scale-95 transition-all"
                  >
                    PROFILE →
                  </button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}

        {/* #03 BRONZE CONTENDER (Right, Medium-Low Elevation) */}
        {third && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 order-3"
          >
            <TiltCard
              tiltAngle={6}
              glowColor="rgba(255, 77, 61, 0.25)"
              cursorLabel="03 BRONZE"
              onClick={() => onSelectPlayer(toLeaderboardItem(third, 3))}
            >
              <div
                className={`relative rounded-3xl p-6 sm:p-7 border overflow-hidden transition-all duration-300 group cursor-pointer ${
                  isDay
                    ? 'bg-gradient-to-b from-white to-[#FFF5F2] border-[#FF4D3D]/25 shadow-[0_15px_40px_rgba(255,77,61,0.08)] hover:border-[#FF4D3D]'
                    : 'bg-gradient-to-b from-[#2B1414] to-[#0D0505] border-[#FF4D3D]/30 shadow-[0_15px_40px_rgba(0,0,0,0.7)] hover:border-[#FF4D3D]'
                }`}
              >
                <span
                  aria-hidden
                  className="absolute right-3 top-2 text-7xl font-black leading-none select-none opacity-10 text-[#FF4D3D] pointer-events-none"
                >
                  03
                </span>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-[#FF4D3D] text-white text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1.5">
                    🥉 #03 BRONZE SEED
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4D3D]">
                    {third.stats?.wins || 0}W · {third.stats?.losses || 0}L
                  </span>
                </div>

                <div className="relative h-56 sm:h-64 w-full mb-5 rounded-2xl overflow-hidden bg-black/10">
                  <img
                    src={third.photo || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80'}
                    alt={third.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8478] block">
                      {third.position || 'Championship Seed'}
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight truncate drop-shadow-md">
                      {third.name}
                    </h3>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      Championship Score
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#FF4D3D]">
                      <RollingScore value={third.stats?.points || 0} />
                      <span className="text-xs uppercase ml-1.5 font-bold">PTS</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FF4D3D]/10 text-[#FF4D3D] group-hover:bg-[#FF4D3D] group-hover:text-white transition-all"
                  >
                    PROFILE →
                  </button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IndividualPodiumView;
