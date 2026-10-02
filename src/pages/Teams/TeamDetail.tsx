import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Users, Trophy, Calendar, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { Team, Player, Match, Sport } from '@/types';
import { MatchCard } from '@/components/matches/MatchCard';
import { getTeamLogo } from '@/utils/teamLogos';

export const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { data: teams, isLoading } = useCollection<Team>('teams');
  const { data: allPlayers } = useCollection<Player>('players');
  const { data: allMatches } = useCollection<Match>('matches');
  const { data: allSports } = useCollection<Sport>('sports');

  const team = teams?.find(
    (t) => t.id === teamId || t.name?.toLowerCase() === teamId?.toLowerCase(),
  );
  const teamLogoUrl = team
    ? (team.logo || getTeamLogo(team.name) || getTeamLogo(team.id) || getTeamLogo(team.shortName))
    : undefined;

  if (isLoading) {
    return (
      <div className={cn('min-h-screen pt-28 pb-16', isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white')}>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className={cn('text-sm font-semibold', isDay ? 'text-[#071426]/60' : 'text-white/50')}>Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className={cn('min-h-screen pt-28 pb-16', isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white')}>
        <div className="max-w-xl mx-auto text-center py-20">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Team Not Found</h2>
          <p className={cn('text-sm', isDay ? 'text-[#071426]/60' : 'text-white/50')}>No team found with id "{teamId}".</p>
          <Link to="/teams" className="mt-4 inline-block text-sm font-bold text-blue-500 hover:underline">← Back to teams</Link>
        </div>
      </div>
    );
  }

  const sportsMap = new Map<string, string>();
  allSports?.forEach(s => sportsMap.set(s.id, s.name));
  const sportName = sportsMap.get(team.sportId) || team.sportId || 'Tournament Squad';

  const teamPlayers = allPlayers?.filter(p => p.teamId === teamId || (Array.isArray(team.playerIds) && (team.playerIds as string[]).includes(p.id))) || [];
  const teamMatches = allMatches?.filter(m => m.teamAId === team.id || m.teamBId === team.id || m.participantA?.id === team.id || m.participantB?.id === team.id) || [];

  return (
    <div
      className={cn(
        "min-h-screen pt-24 pb-20 transition-colors",
        isDay ? "bg-[#F7F6F1] text-[#071426]" : "bg-[#080A0D] text-white"
      )}
    >
      {/* Header Banner */}
      <div
        className={cn(
          "relative py-12 md:py-16 border-b",
          isDay ? "bg-white/70 border-[#071426]/10" : "bg-black/40 border-white/10"
        )}
      >
        <div className="container mx-auto px-4">
          <Link
            to="/teams"
            className={cn(
              "inline-flex items-center text-xs font-black uppercase tracking-widest mb-6 transition-colors group",
              isDay ? "text-[#071426]/60 hover:text-[#155EEF]" : "text-white/60 hover:text-[#FFD21F]"
            )}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Squads
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div
              className={cn(
                "w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center text-3xl sm:text-5xl font-black border shadow-2xl shrink-0 overflow-hidden relative",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#155EEF] shadow-[0_10px_30px_rgba(7,20,38,0.08)]"
                  : "bg-gradient-to-br from-[#1264FF]/20 to-[#071426] border-white/10 text-white shadow-[0_0_30px_rgba(18,100,255,0.2)]"
              )}
            >
              {teamLogoUrl ? (
                <img
                  src={teamLogoUrl}
                  alt={team.name}
                  className="w-full h-full object-cover rounded-3xl"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.dataset.fallbackTried) {
                      el.dataset.fallbackTried = 'true';
                      const fallback = getTeamLogo(team.name) || getTeamLogo(team.id);
                      if (fallback && el.src !== fallback) {
                        el.src = fallback;
                        return;
                      }
                    }
                    el.style.display = 'none';
                  }}
                />
              ) : (
                team.shortName || team.name?.slice(0, 3).toUpperCase()
              )}
            </div>

            <div className="text-center md:text-left flex-1">
              <div
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 border",
                  isDay ? "bg-[#155EEF]/10 text-[#155EEF] border-[#155EEF]/20" : "bg-white/10 text-white/80 border-white/10"
                )}
              >
                {sportName}
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight mb-6">
                {team.name}
              </h1>

              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#071426]/10" : "bg-white/5 border-white/10"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#155EEF]">{team.wins ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Wins</span>
                </div>
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#071426]/10" : "bg-white/5 border-white/10"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#FF4D3D]">{team.losses ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Losses</span>
                </div>
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#071426]/10" : "bg-white/5 border-white/10"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black opacity-80">{team.draws ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Draws</span>
                </div>
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#D9A441]/40 shadow-sm" : "bg-white/5 border-[#D9A441]/30"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#D9A441]">{team.points ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9A441]">Points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* Roster */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-[#155EEF]" size={22} />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Squad Roster</h2>
          </div>

          {teamPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teamPlayers.map(player => (
                <Link key={player.id} to={`/players/${player.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4 transition-all shadow-md",
                      isDay
                        ? "bg-white border-[#071426]/10 hover:border-[#155EEF]/40"
                        : "bg-white/5 border-white/10 hover:border-[#1264FF]/40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 overflow-hidden",
                        isDay ? "bg-[#155EEF]/10 text-[#155EEF] border-[#155EEF]/20" : "bg-white/10 text-white border-white/10"
                      )}
                    >
                      {player.photo ? (
                        <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        player.jerseyNumber || player.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-sm sm:text-base truncate">{player.name}</div>
                      <div className={cn("text-xs font-semibold capitalize", isDay ? "text-[#071426]/60" : "text-white/50")}>
                        {player.role || player.position || 'Athlete'}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "p-8 rounded-2xl border text-center text-xs sm:text-sm font-medium",
                isDay ? "bg-white/60 border-[#071426]/10 text-[#071426]/50" : "bg-white/5 border-white/10 text-white/50"
              )}
            >
              Roster roster lineup will be officially published ahead of match time.
            </div>
          )}
        </section>

        {/* Team Fixtures */}
        {teamMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-[#D9A441]" size={22} />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Team Fixtures</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMatches.map(m => {
                const isPaused = m.status === 'paused';
                const isLiveSession = m.status === 'live' || isPaused;
                const isHalfTime = Boolean((m.liveState as Record<string, unknown>)?.isHalfTime);
                const isCricket = (m.sportId || '').toLowerCase().includes('cricket');
                const timeLabel = isLiveSession 
                  ? (isPaused ? (isCricket ? 'INNINGS BREAK' : isHalfTime ? 'HALF TIME' : 'PAUSED') : (m.liveState?.clock || 'LIVE'))
                  : 'Scheduled';

                return (
                  <MatchCard
                    key={m.id}
                    id={m.id}
                    sport={sportName}
                    teamA={m.participantA?.name || m.teamAId || 'Team A'}
                    teamB={m.participantB?.name || m.teamBId || 'Team B'}
                    scoreA={m.score?.teamA ?? 0}
                    scoreB={m.score?.teamB ?? 0}
                    status={isLiveSession ? (isPaused ? 'paused' : 'live') : m.status === 'completed' ? 'completed' : m.status === 'cancelled' ? 'cancelled' : 'upcoming'}
                    time={timeLabel}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;

