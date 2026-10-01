import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Activity, Shield, Award, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { Player, Team, Match, Sport } from '@/types';
import { MatchCard } from '@/components/matches/MatchCard';

export const PlayerDetail: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { data: allPlayers, isLoading } = useCollection<Player>('players');
  const { data: allTeams } = useCollection<Team>('teams');
  const { data: allSports } = useCollection<Sport>('sports');

  const player = allPlayers?.find(p => p.id === playerId);

  if (isLoading) {
    return (
      <div className={cn('min-h-screen pt-28 pb-16', isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white')}>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className={cn('text-sm font-semibold', isDay ? 'text-[#071426]/60' : 'text-white/50')}>Loading athlete profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className={cn('min-h-screen pt-28 pb-16', isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white')}>
        <div className="max-w-xl mx-auto text-center py-20">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Player Not Found</h2>
          <p className={cn('text-sm', isDay ? 'text-[#071426]/60' : 'text-white/50')}>No player found with id "{playerId}".</p>
          <Link to="/players" className="mt-4 inline-block text-sm font-bold text-blue-500 hover:underline">← Back to athletes</Link>
        </div>
      </div>
    );
  }
  const team = allTeams?.find(t => t.id === player.teamId);
  const sport = allSports?.find(s => s.id === player.sportId);
  const playerTeamName = team?.name || 'Thunderbolts';
  const playerSportName = sport?.name || player.sportId || 'Basketball';

  return (
    <div
      className={cn(
        "min-h-screen pt-24 pb-20 transition-colors",
        isDay ? "bg-[#F7F6F1] text-[#071426]" : "bg-[#080A0D] text-white"
      )}
    >
      <div className="container mx-auto px-4">
        <Link
          to="/players"
          className={cn(
            "inline-flex items-center text-xs font-black uppercase tracking-widest mb-8 transition-colors group",
            isDay ? "text-[#071426]/60 hover:text-[#155EEF]" : "text-white/60 hover:text-[#FFD21F]"
          )}
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Athletes
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column: Profile Card */}
          <div className="md:col-span-1">
            <div
              className={cn(
                "rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden border shadow-xl backdrop-blur-xl",
                isDay
                  ? "bg-white border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
                  : "bg-[#071426]/90 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              )}
            >
              {player.role === 'captain' && (
                <div className="absolute top-4 right-4 bg-[#D9A441]/20 text-[#D9A441] px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-[#D9A441]/30">
                  <Shield size={14} /> Captain
                </div>
              )}

              <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto rounded-3xl bg-gradient-to-br from-[#1264FF] to-[#0D47A1] flex items-center justify-center text-4xl sm:text-5xl font-black text-white mb-6 relative shadow-2xl">
                {player.name.charAt(0)}
                <div
                  className={cn(
                    "absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 border-2 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shadow-md",
                    isDay ? "bg-white text-[#155EEF] border-[#155EEF]/30" : "bg-[#080A0D] text-[#FFD21F] border-white/20"
                  )}
                >
                  #{player.jerseyNumber || 10}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">{player.name}</h1>
              <Link
                to={team ? `/teams/${team.id}` : '#'}
                className={cn("font-bold text-sm block mb-6 transition-colors", isDay ? "text-[#155EEF] hover:underline" : "text-[#1264FF] hover:underline")}
              >
                {playerTeamName}
              </Link>

              <div className="flex items-center justify-center gap-2 text-[#D9A441] bg-[#D9A441]/10 py-2.5 px-4 rounded-2xl border border-[#D9A441]/20">
                <Star className="fill-[#D9A441]" size={18} />
                <span className="text-xl font-black">{player.stats?.rating ? player.stats.rating.toFixed(1) : '5.0'}</span>
                <span className={cn("text-xs font-medium", isDay ? "text-[#071426]/50" : "text-white/40")}>
                  (Arena Verified)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Stats */}
          <div className="md:col-span-2 space-y-6 sm:space-y-8">
            {/* Info Grid */}
            <div
              className={cn(
                "rounded-3xl p-6 sm:p-8 border shadow-xl backdrop-blur-xl",
                isDay
                  ? "bg-white border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
                  : "bg-[#071426]/90 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              )}
            >
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={20} className="text-[#155EEF]" />
                Athlete Dossier
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDay ? "text-[#071426]/50" : "text-white/40")}>
                    Sport
                  </div>
                  <div className="font-black text-sm sm:text-base">{playerSportName}</div>
                </div>
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDay ? "text-[#071426]/50" : "text-white/40")}>
                    Position
                  </div>
                  <div className="font-black text-sm sm:text-base">{player.position || 'Forward'}</div>
                </div>
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDay ? "text-[#071426]/50" : "text-white/40")}>
                    Role
                  </div>
                  <div className="font-black text-sm sm:text-base capitalize">{player.role || 'Athlete'}</div>
                </div>
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDay ? "text-[#071426]/50" : "text-white/40")}>
                    Division
                  </div>
                  <div className="font-black text-sm sm:text-base">{player.gender || 'Championship'}</div>
                </div>
              </div>

              {player.bio && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.08)' }}>
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDay ? "text-[#071426]/50" : "text-white/40")}>
                    Athlete Bio
                  </div>
                  <p className={cn("text-xs sm:text-sm font-medium leading-relaxed", isDay ? "text-[#071426]/80" : "text-white/80")}>
                    {player.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div
              className={cn(
                "rounded-3xl p-6 sm:p-8 border shadow-xl backdrop-blur-xl",
                isDay
                  ? "bg-white border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
                  : "bg-[#071426]/90 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              )}
            >
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                <Award size={20} className="text-[#D9A441]" />
                Tournament Telemetry
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div
                  className={cn(
                    "p-4 rounded-2xl text-center border transition-transform hover:scale-105",
                    isDay ? "bg-[#F7F6F1] border-[#071426]/5" : "bg-black/40 border-white/5"
                  )}
                >
                  <div className="text-2xl sm:text-3xl font-black text-[#155EEF] mb-1">
                    {player.stats?.matchesPlayed ?? 0}
                  </div>
                  <div className={cn("text-[10px] font-bold uppercase tracking-wider", isDay ? "text-[#071426]/60" : "text-white/50")}>
                    Matches
                  </div>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl text-center border transition-transform hover:scale-105",
                    isDay ? "bg-[#F7F6F1] border-[#071426]/5" : "bg-black/40 border-white/5"
                  )}
                >
                  <div className="text-2xl sm:text-3xl font-black text-[#D9A441] mb-1">
                    {player.stats?.points ?? player.stats?.runs ?? 0}
                  </div>
                  <div className={cn("text-[10px] font-bold uppercase tracking-wider", isDay ? "text-[#071426]/60" : "text-white/50")}>
                    Points / Runs
                  </div>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl text-center border transition-transform hover:scale-105",
                    isDay ? "bg-[#F7F6F1] border-[#071426]/5" : "bg-black/40 border-white/5"
                  )}
                >
                  <div className="text-2xl sm:text-3xl font-black opacity-90 mb-1">
                    {player.stats?.assists ?? player.stats?.goals ?? 0}
                  </div>
                  <div className={cn("text-[10px] font-bold uppercase tracking-wider", isDay ? "text-[#071426]/60" : "text-white/50")}>
                    Assists / Goals
                  </div>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl text-center border transition-transform hover:scale-105",
                    isDay ? "bg-[#F7F6F1] border-[#071426]/5" : "bg-black/40 border-white/5"
                  )}
                >
                  <div className="text-2xl sm:text-3xl font-black opacity-90 mb-1">
                    {player.stats?.wins ?? 0}
                  </div>
                  <div className={cn("text-[10px] font-bold uppercase tracking-wider", isDay ? "text-[#071426]/60" : "text-white/50")}>
                    Victories
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;

