import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore, Magnetic, SplitText } from '@/components/motion';
import type { Player, Team, Match, Sport } from '@/types';

interface SportLeaderboardPreview {
  sportId: string;
  sportName: string;
  icon: string;
  status: 'live' | 'upcoming' | 'completed' | 'standings';
  leader: string;
  entries: {
    rank: number;
    name: string;
    team: string;
    points: number;
    wins: number;
    losses: number;
    photo?: string;
  }[];
}

const DEFAULT_SPORTS_PREVIEWS: SportLeaderboardPreview[] = [
  {
    sportId: 'football',
    sportName: 'Football',
    icon: '⚽',
    status: 'live',
    leader: 'Thunderbolts FC',
    entries: [
      { rank: 1, name: 'Arjun Mehta', team: 'Thunderbolts FC', points: 1420, wins: 12, losses: 2 },
      { rank: 2, name: 'Vikram Joshi', team: 'Phoenix United', points: 1280, wins: 10, losses: 3 },
      { rank: 3, name: 'Kabir Singh', team: 'Thunderbolts FC', points: 1150, wins: 9, losses: 3 },
      { rank: 4, name: 'Aditya Sharma', team: 'Phoenix United', points: 1040, wins: 8, losses: 4 },
      { rank: 5, name: 'Rajesh Nair', team: 'Iron Wolves', points: 960, wins: 7, losses: 4 },
    ],
  },
  {
    sportId: 'cricket',
    sportName: 'Cricket',
    icon: '🏏',
    status: 'standings',
    leader: 'Storm Breakers XI',
    entries: [
      { rank: 1, name: 'Rahul Dravid Jr', team: 'Storm Breakers XI', points: 1340, wins: 11, losses: 2 },
      { rank: 2, name: 'Ankit Rajput', team: 'Golden Warriors', points: 1220, wins: 10, losses: 3 },
      { rank: 3, name: 'Suresh Raina Jr', team: 'Golden Warriors', points: 1130, wins: 9, losses: 4 },
      { rank: 4, name: 'Pradeep Sangwan', team: 'Storm Breakers XI', points: 1010, wins: 8, losses: 3 },
      { rank: 5, name: 'Deepak Chahar Jr', team: 'Golden Warriors', points: 940, wins: 7, losses: 4 },
    ],
  },
  {
    sportId: 'volleyball',
    sportName: 'Volleyball',
    icon: '🏐',
    status: 'standings',
    leader: 'Spike Masters',
    entries: [
      { rank: 1, name: 'Akash Reddy', team: 'Spike Masters', points: 1280, wins: 11, losses: 4 },
      { rank: 2, name: 'Harsh Pandey', team: 'Block Titans', points: 1190, wins: 10, losses: 4 },
      { rank: 3, name: 'Sameer Khan', team: 'Block Titans', points: 1080, wins: 8, losses: 4 },
      { rank: 4, name: 'Yash Malhotra', team: 'Spike Masters', points: 990, wins: 7, losses: 5 },
      { rank: 5, name: 'Rohan Sharma', team: 'Spike Masters', points: 920, wins: 7, losses: 5 },
    ],
  },
  {
    sportId: 'lan-games',
    sportName: 'LAN Games',
    icon: '🎮',
    status: 'standings',
    leader: 'Cyber Phantoms',
    entries: [
      { rank: 1, name: 'CyberX', team: 'Cyber Phantoms', points: 1290, wins: 12, losses: 3 },
      { rank: 2, name: 'N3onBl4de', team: 'Neon Strikers', points: 1180, wins: 10, losses: 4 },
      { rank: 3, name: 'PhantomGhost', team: 'Cyber Phantoms', points: 1090, wins: 9, losses: 4 },
      { rank: 4, name: 'HyperNova', team: 'Neon Strikers', points: 980, wins: 8, losses: 5 },
      { rank: 5, name: 'VortexAce', team: 'Cyber Phantoms', points: 910, wins: 7, losses: 5 },
    ],
  },
];

export const ArenaLeaderboardPreview: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const matches = useCollection<Match>('matches');
  const players = useCollection<Player>('players');
  const teams = useCollection<Team>('teams');
  const sports = useCollection<Sport>('sports');

  // Find if any match is currently live to automatically highlight that sport
  const liveSportId = useMemo(() => {
    const liveMatch = matches.data.find((m) => m.status === 'live');
    return liveMatch?.sportId || 'football';
  }, [matches.data]);

  const [activeSportId, setActiveSportId] = useState<string>(liveSportId);

  // Build live preview datasets per sport
  const previews = useMemo(() => {
    return DEFAULT_SPORTS_PREVIEWS.map((sp) => {
      const isLiveMatch = matches.data.some(
        (m) => m.sportId === sp.sportId && m.status === 'live',
      );
      return {
        ...sp,
        status: isLiveMatch ? ('live' as const) : sp.status,
      };
    });
  }, [matches.data]);

  const currentPreview = useMemo(() => {
    return previews.find((p) => p.sportId === activeSportId) || previews[0];
  }, [previews, activeSportId]);

  return (
    <section
      className={`py-24 relative transition-colors duration-500 border-t ${
        isDay
          ? 'bg-[#F7F6F1] border-[#071426]/10 text-[#071426]'
          : 'bg-[#080A0D] border-white/5 text-white'
      }`}
    >
      <Container>
        {/* Header and Link */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span
              className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
              }`}
            >
              ARENA PERFORMANCE SNAPSHOT
            </span>
            <SectionTitle
              title={
                <SplitText
                  text="LEADERBOARD PREVIEW"
                  charClassName={isDay ? 'text-[#071426]' : 'text-white'}
                />
              }
              subtitle="Top 5 contenders per discipline · Synchronized with live match outcomes"
              className="mb-0"
            />
          </div>

          <Magnetic strength={0.3} radius={90}>
            <Link
              to="/leaderboard"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                isDay
                  ? 'bg-[#071426] text-white hover:bg-[#155EEF] shadow-[0_4px_20px_rgba(7,20,38,0.15)]'
                  : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] hover:brightness-110 shadow-[0_0_20px_rgba(217,164,65,0.4)]'
              }`}
            >
              <span>Explore Full Rankings</span>
              <span className="text-sm">→</span>
            </Link>
          </Magnetic>
        </div>

        {/* Sport Navigation Switcher */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {previews.map((sp) => {
            const isSelected = activeSportId === sp.sportId;
            const isLive = sp.status === 'live';

            return (
              <button
                key={sp.sportId}
                onClick={() => setActiveSportId(sp.sportId)}
                className={`relative flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                  isSelected
                    ? isDay
                      ? 'bg-white border-[#155EEF] text-[#155EEF] shadow-[0_4px_20px_rgba(21,94,239,0.15)]'
                      : 'bg-[#071426] border-[#D9A441] text-[#FFD21F] shadow-[0_0_20px_rgba(217,164,65,0.3)]'
                    : isDay
                      ? 'bg-white/60 border-[#071426]/10 text-[#071426]/70 hover:bg-white'
                      : 'bg-[#071426]/60 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <span>{sp.icon}</span>
                <span>{sp.sportName}</span>
                {isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Sport Leaderboard Card */}
        <TiltCard
          tiltAngle={5}
          glowColor={isDay ? 'rgba(21, 94, 239, 0.1)' : 'rgba(217, 164, 65, 0.15)'}
          cursorLabel="PREVIEW"
        >
          <div
            className={`rounded-3xl border p-6 sm:p-10 relative overflow-hidden transition-all duration-500 ${
              isDay
                ? 'bg-white/90 border-[#071426]/10 shadow-[0_20px_50px_rgba(7,20,38,0.06)]'
                : 'bg-[#071426]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            }`}
          >
            {/* Card Header: Sport Icon + Name + Olympia Flame */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentPreview.icon}</span>
                <div>
                  <h3
                    className={`text-2xl font-black uppercase tracking-tight ${
                      isDay ? 'text-[#071426]' : 'text-white'
                    }`}
                  >
                    {currentPreview.sportName} Standings
                  </h3>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
                    }`}
                  >
                    Current Discipline Leader: {currentPreview.leader}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/5 dark:bg-white/5">
                  OLYMPIA 2K26
                </span>
              </div>
            </div>

            {/* Top 5 Contenders List */}
            <div className="flex flex-col space-y-3">
              <AnimatePresence mode="wait">
                {currentPreview.entries.map((entry, index) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;

                  return (
                    <motion.div
                      key={`${currentPreview.sportId}-${entry.rank}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      className={`p-4 rounded-2xl flex items-center justify-between border transition-colors ${
                        isFirst
                          ? isDay
                            ? 'bg-gradient-to-r from-[#FFFDF8] via-white to-[#FAF6EC] border-[#D9A441]/40 shadow-sm'
                            : 'bg-gradient-to-r from-[#18150D] via-[#071426] to-[#0B1A30] border-[#D9A441]/40'
                          : isDay
                            ? 'bg-white/60 border-[#071426]/5 hover:bg-white'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {/* Rank & Name */}
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                            isFirst
                              ? 'bg-gradient-to-br from-[#FFD21F] to-[#D9A441] text-[#071426] shadow-[0_0_15px_rgba(217,164,65,0.4)]'
                              : isSecond
                                ? 'bg-[#155EEF] text-white'
                                : isThird
                                  ? 'bg-[#FF6A00] text-white'
                                  : isDay
                                    ? 'bg-[#071426]/5 text-[#071426]/60'
                                    : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {entry.rank}
                        </span>

                        <div className="min-w-0">
                          <h4
                            className={`font-black uppercase text-sm md:text-base truncate ${
                              isDay ? 'text-[#071426]' : 'text-white'
                            }`}
                          >
                            {entry.name}
                          </h4>
                          <p
                            className={`text-xs font-bold truncate ${
                              isDay ? 'text-[#071426]/50' : 'text-white/50'
                            }`}
                          >
                            {entry.team}
                          </p>
                        </div>
                      </div>

                      {/* Stats & Points */}
                      <div className="flex items-center gap-6 shrink-0">
                        <span
                          className={`text-xs font-bold hidden sm:inline-block ${
                            isDay ? 'text-[#071426]/60' : 'text-white/60'
                          }`}
                        >
                          {entry.wins}W - {entry.losses}L
                        </span>

                        <div className="text-right min-w-[70px]">
                          <span className="text-base sm:text-lg font-black text-[#D9A441] tabular-nums">
                            <RollingScore value={entry.points} suffix=" PTS" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </TiltCard>
      </Container>
    </section>
  );
};

export default ArenaLeaderboardPreview;
