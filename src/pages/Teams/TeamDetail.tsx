import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Users, Trophy, Calendar, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { Team, Player, Match } from '@/types';
import { MatchCard } from '@/components/matches/MatchCard';

export const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { data: teams, isLoading } = useCollection<Team>('teams');
  const { data: allPlayers } = useCollection<Player>('players');
  const { data: allMatches } = useCollection<Match>('matches');

  const team = teams?.find(t => t.id === teamId) || {
    id: teamId || '1',
    name: 'Thunderbolts',
    shortName: 'THN',
    sport: 'Basketball',
    stats: { wins: 8, losses: 2, draws: 0, points: 24 },
  };

  const teamPlayers = allPlayers?.filter(p => p.teamId === teamId) || [];
  const teamMatches = allMatches?.filter(m => m.teamA === team.name || m.teamB === team.name) || [];

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
                "w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center text-3xl sm:text-5xl font-black border shadow-2xl shrink-0",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#155EEF] shadow-[0_10px_30px_rgba(7,20,38,0.08)]"
                  : "bg-gradient-to-br from-[#1264FF]/20 to-[#071426] border-white/10 text-white shadow-[0_0_30px_rgba(18,100,255,0.2)]"
              )}
            >
              {team.shortName || team.name?.slice(0, 3).toUpperCase()}
            </div>

            <div className="text-center md:text-left flex-1">
              <div
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 border",
                  isDay ? "bg-[#155EEF]/10 text-[#155EEF] border-[#155EEF]/20" : "bg-white/10 text-white/80 border-white/10"
                )}
              >
                {team.sport || 'Tournament Squad'}
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
                  <span className="text-xl sm:text-2xl font-black text-[#155EEF]">{team.stats?.wins ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Wins</span>
                </div>
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#071426]/10" : "bg-white/5 border-white/10"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#FF4D3D]">{team.stats?.losses ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Losses</span>
                </div>
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#071426]/10" : "bg-white/5 border-white/10"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black opacity-80">{team.stats?.draws ?? 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Draws</span>
                </div>
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl border flex flex-col items-center min-w-[72px]",
                    isDay ? "bg-white border-[#D9A441]/40 shadow-sm" : "bg-white/5 border-[#D9A441]/30"
                  )}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#D9A441]">{team.stats?.points ?? 0}</span>
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
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border shrink-0",
                        isDay ? "bg-[#155EEF]/10 text-[#155EEF] border-[#155EEF]/20" : "bg-white/10 text-white border-white/10"
                      )}
                    >
                      {player.jerseyNumber || player.name.charAt(0)}
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
              {teamMatches.map(m => (
                <MatchCard
                  key={m.id}
                  id={m.id}
                  sport={m.sport || team.sport || 'Sports'}
                  teamA={m.teamA}
                  teamB={m.teamB}
                  scoreA={m.score?.teamA ?? 0}
                  scoreB={m.score?.teamB ?? 0}
                  status={m.status || 'upcoming'}
                  time={m.time || 'Scheduled'}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;

