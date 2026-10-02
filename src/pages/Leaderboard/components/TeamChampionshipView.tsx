import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { RollingScore } from '@/components/motion';
import { getTeamLogo } from '@/utils/teamLogos';
import type { Player, Team } from '@/types';
import type { LeaderboardItem } from './PodiumHero';

export interface TeamChampionshipViewProps {
  teams: Team[];
  sportId: string;
  playersByTeam: Map<string, Player[]>;
  onSelectTeam: (item: LeaderboardItem) => void;
}

export const TeamChampionshipView: React.FC<TeamChampionshipViewProps> = ({
  teams,
  sportId,
  playersByTeam,
  onSelectTeam,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest opacity-60">
          No team standings available for this discipline yet.
        </p>
      </div>
    );
  }

  // Sorted teams by points descending
  const sortedTeams = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
  const champion = sortedTeams[0];
  const contenders = sortedTeams.slice(1);

  // Helper to extract sport-specific metrics
  const getSportStats = (team: Team): Array<{ label: string; value: string | number }> => {
    const raw = team as unknown as Record<string, unknown>;
    const wins = team.wins ?? 0;
    const losses = team.losses ?? 0;
    const draws = team.draws ?? 0;
    const matches = (raw.matchesPlayed as number) || (wins + losses + draws) || 0;

    switch (sportId) {
      case 'football':
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Draws', value: draws },
          { label: 'Losses', value: losses },
          { label: 'GF', value: raw.goalsFor !== undefined ? String(raw.goalsFor) : '-' },
          { label: 'GA', value: raw.goalsAgainst !== undefined ? String(raw.goalsAgainst) : '-' },
          { label: 'GD', value: (raw.goalDifference !== undefined ? `${(raw.goalDifference as number) > 0 ? '+' : ''}${raw.goalDifference}` : '-') },
        ];

      case 'cricket':
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Losses', value: losses },
          { label: 'NRR', value: (raw.netRunRate as string) ?? '+0.00' },
          { label: 'Runs', value: raw.runs !== undefined ? String(raw.runs) : '-' },
          { label: 'Wickets', value: raw.wickets !== undefined ? String(raw.wickets) : '-' },
        ];

      case 'volleyball':
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Losses', value: losses },
          { label: 'Sets Won', value: raw.setsWon !== undefined ? String(raw.setsWon) : '-' },
          { label: 'Sets Lost', value: raw.setsLost !== undefined ? String(raw.setsLost) : '-' },
          { label: 'Set Ratio', value: raw.setRatio !== undefined ? String(raw.setRatio) : '-' },
        ];

      case 'hand-tennis':
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Losses', value: losses },
          { label: 'Sets Won', value: raw.setsWon !== undefined ? String(raw.setsWon) : '-' },
          { label: 'Point Diff', value: raw.pointsDiff !== undefined ? String(raw.pointsDiff) : '0' },
        ];

      case 'lan-games':
      case 'counter-strike':
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Losses', value: losses },
          { label: 'Rounds Won', value: raw.roundsWon !== undefined ? String(raw.roundsWon) : '-' },
          { label: 'Rounds Lost', value: raw.roundsLost !== undefined ? String(raw.roundsLost) : '-' },
          { label: 'Map Diff', value: raw.mapDifference !== undefined ? String(raw.mapDifference) : '-' },
        ];

      case 'smash-karts':
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Losses', value: losses },
          { label: 'Points', value: team.points ?? 0 },
        ];

      default:
        return [
          { label: 'Matches', value: matches },
          { label: 'Wins', value: wins },
          { label: 'Draws', value: draws },
          { label: 'Losses', value: losses },
        ];
    }
  };

  // Convert Team to LeaderboardItem for the drawer/modal
  const toLeaderboardItem = (team: Team, rank: number): LeaderboardItem => {
    const raw = team as unknown as Record<string, unknown>;
    const wins = team.wins ?? 0;
    const losses = team.losses ?? 0;
    const draws = team.draws ?? 0;
    const matches = (raw.matchesPlayed as number) ?? (wins + losses + draws);

    return {
      id: team.id,
      rank,
      name: team.name,
      subtitle: `${team.playerIds?.length || 10} Contender Squad`,
      sportId: team.sportId || sportId,
      points: team.points ?? 0,
      matches,
      wins,
      losses,
      rating: 4.8,
      logo: team.logo || getTeamLogo(team.name) || getTeamLogo(team.id) || '',
      trend: rank === 1 ? 1 : 0,
      type: 'team',
    };
  };

  // Resolve Key Player / MVP / Captain for supporting display
  const getKeyPlayer = (teamId: string) => {
    const roster = playersByTeam.get(teamId) || [];
    const captain = roster.find((p) => p.role === 'captain') || roster.find((p) => p.role === 'vice_captain') || roster[0];
    return captain || null;
  };

  const championLogo = champion.logo || getTeamLogo(champion.name) || getTeamLogo(champion.id) || '';
  const championKeyPlayer = getKeyPlayer(champion.id);
  const championStats = getSportStats(champion);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 1. DOMINANT #01 CHAMPION CARD */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div
          className={`relative rounded-3xl p-6 sm:p-10 md:p-12 border overflow-hidden transition-all duration-300 ${
            isDay
              ? 'bg-gradient-to-br from-white via-[#FFF9EE] to-[#F5ECE0] border-[#D9A441]/50 shadow-[0_20px_60px_rgba(217,164,65,0.2)]'
              : 'bg-gradient-to-br from-[#121B2B] via-[#0E1524] to-[#070B14] border-[#D9A441]/60 shadow-[0_0_80px_rgba(217,164,65,0.25)]'
          }`}
        >
          {/* Flame Aura */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full blur-[100px] opacity-40 bg-gradient-to-br from-[#FFD21F] to-[#D9A441]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 rounded-full blur-[90px] opacity-25 bg-[#1264FF]"
          />

          {/* Golden Corner Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD21F] to-[#D9A441] text-[#071426] font-black text-xl shadow-lg">
                ★
              </span>
              <div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#D9A441] block">
                  CHAMPIONSHIP LEADER · #01 SEED
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                  {champion.sportId?.toUpperCase()} LEAGUE STANDINGS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-[#D9A441]/20 border border-[#D9A441]/40 text-[#D9A441] text-xs font-black tracking-widest uppercase">
                👑 1ST PLACE
              </span>
            </div>
          </div>

          {/* Main Visual Row: Hero Team Logo + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Rank & Team Crest */}
            <div className="lg:col-span-4 flex items-center gap-6">
              <span
                className={`text-6xl sm:text-7xl md:text-8xl font-black leading-none tracking-tighter ${
                  isDay ? 'text-[#071426]' : 'text-white'
                }`}
              >
                01
              </span>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden p-2.5 bg-gradient-to-br from-[#D9A441] via-[#FFD21F] to-[#1264FF] shadow-2xl flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-2xl bg-[#071426] flex items-center justify-center overflow-hidden p-1.5">
                  <img
                    src={championLogo}
                    alt={champion.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Team Name, Points, W-D-L */}
            <div className="lg:col-span-5">
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight ${
                  isDay ? 'text-[#071426]' : 'text-white'
                }`}
              >
                {champion.name}
              </h2>

              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl sm:text-5xl font-black text-[#D9A441]">
                  <RollingScore value={champion.points ?? 0} />
                </span>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[#D9A441]">
                  POINTS
                </span>
                <span className="opacity-40">•</span>
                <span className={`text-sm font-extrabold uppercase tracking-wider ${isDay ? 'text-[#071426]/70' : 'text-white/70'}`}>
                  {champion.wins ?? 0}W · {champion.draws ? `${champion.draws}D · ` : ''}{champion.losses ?? 0}L
                </span>
              </div>

              {/* Sport-specific metrics breakdown */}
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {championStats.map((stat, i) => (
                  <div
                    key={i}
                    className={`px-2.5 py-1.5 rounded-xl border text-center ${
                      isDay
                        ? 'bg-white/80 border-[#071426]/10'
                        : 'bg-[#0B1528]/80 border-white/10'
                    }`}
                  >
                    <span className={`block text-[9px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                      {stat.label}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#D9A441]">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supporting Key Player / MVP / Captain & CTA */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/10 pt-5 lg:pt-0 lg:pl-6">
              {championKeyPlayer && (
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#D9A441] bg-black/20 shrink-0">
                    <img
                      src={
                        championKeyPlayer.photo ||
                        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`
                      }
                      alt={championKeyPlayer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D9A441] block">
                      KEY CONTENDER
                    </span>
                    <span
                      className={`text-xs font-black uppercase truncate block ${
                        isDay ? 'text-[#071426]' : 'text-white'
                      }`}
                    >
                      {championKeyPlayer.name}
                    </span>
                    <span className={`text-[9px] font-bold uppercase ${isDay ? 'text-[#071426]/60' : 'text-white/50'}`}>
                      {championKeyPlayer.position || (championKeyPlayer.role === 'captain' ? 'Team Captain' : 'MVP')}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => onSelectTeam(toLeaderboardItem(champion, 1))}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                VIEW TEAM ROSTER →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. THE LADDER (#02, #03, #04, ...) */}
      {contenders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}`}>
                STANDINGS LADDER
              </span>
              <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                CONTENDING PACK
              </h3>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
              Ranks #02 to #{String(sortedTeams.length).padStart(2, '0')}
            </span>
          </div>

          <div className="space-y-3">
            {contenders.map((team, index) => {
              const rank = index + 2;
              const formattedRank = String(rank).padStart(2, '0');
              const logo = team.logo || getTeamLogo(team.name) || getTeamLogo(team.id) || '';
              const keyPlayer = getKeyPlayer(team.id);
              const stats = getSportStats(team);

              const isPodium2 = rank === 2;
              const isPodium3 = rank === 3;

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => onSelectTeam(toLeaderboardItem(team, rank))}
                  className={`group relative rounded-2xl p-4 sm:p-6 border transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                    isDay
                      ? 'bg-white hover:bg-[#FAF8F5] border-[#071426]/10 hover:border-[#155EEF]/50 shadow-sm hover:shadow-md'
                      : 'bg-[#0A1220] hover:bg-[#0E1A2E] border-white/10 hover:border-[#D9A441]/50 shadow-md hover:shadow-lg'
                  }`}
                >
                  {/* Left Block: Rank + Crest + Team Name */}
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <span
                      className={`text-2xl sm:text-3xl font-black font-mono w-10 shrink-0 text-center ${
                        isPodium2
                          ? 'text-[#1264FF]'
                          : isPodium3
                            ? 'text-[#FF4D3D]'
                            : isDay
                              ? 'text-[#071426]/40'
                              : 'text-white/30'
                      }`}
                    >
                      {formattedRank}
                    </span>

                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-black/10 border border-white/10 p-1.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={logo}
                        alt={team.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-base sm:text-lg font-black uppercase tracking-tight truncate ${
                          isDay ? 'text-[#071426]' : 'text-white'
                        }`}
                      >
                        {team.name}
                      </h4>
                      <p className={`text-xs font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/50'}`}>
                        {team.wins ?? 0}W · {team.draws ? `${team.draws}D · ` : ''}{team.losses ?? 0}L
                      </p>
                    </div>
                  </div>

                  {/* Middle Block: Sport Statistics Columns */}
                  <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1 hide-scrollbar">
                    {stats.map((s, i) => (
                      <div
                        key={i}
                        className={`px-3 py-1.5 rounded-xl border text-center shrink-0 min-w-[54px] ${
                          isDay
                            ? 'bg-[#F5F4F0] border-black/5'
                            : 'bg-[#101C30] border-white/5'
                        }`}
                      >
                        <span className={`block text-[9px] font-bold uppercase tracking-wider ${isDay ? 'text-[#071426]/50' : 'text-white/50'}`}>
                          {s.label}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-black ${
                            s.label === 'Wins'
                              ? 'text-emerald-500'
                              : s.label === 'Losses'
                                ? 'text-rose-500'
                                : isDay
                                  ? 'text-[#071426]'
                                  : 'text-white'
                          }`}
                        >
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right Block: Points + Key Player + CTA */}
                  <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
                    {keyPlayer && (
                      <div className="hidden lg:flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D9A441]/50 bg-black/20 shrink-0">
                          <img
                            src={
                              keyPlayer.photo ||
                              `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80`
                            }
                            alt={keyPlayer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#D9A441] block">
                            KEY CONTENDER
                          </span>
                          <span className={`text-[11px] font-bold uppercase truncate max-w-[90px] block ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                            {keyPlayer.name}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-[#D9A441] block leading-none">
                        <RollingScore value={team.points ?? 0} />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        PTS
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 ${
                        isDay
                          ? 'bg-[#071426]/5 text-[#071426] group-hover:bg-[#155EEF] group-hover:text-white'
                          : 'bg-white/5 text-white group-hover:bg-[#D9A441] group-hover:text-[#071426]'
                      }`}
                    >
                      VIEW →
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamChampionshipView;
