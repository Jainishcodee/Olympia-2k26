import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { MatchCard } from '@/components/matches/MatchCard';
import { Match, Sport, Team } from '@/types';

const defaultSports: Record<string, { name: string; icon: string; description: string }> = {
  football: { name: 'Football', icon: '⚽', description: 'High-intensity 11v11 field supremacy and championship matches.' },
  basketball: { name: 'Basketball', icon: '🏀', description: 'Fast-paced high-scoring hardwood battles and slam dunk showdowns.' },
  volleyball: { name: 'Volleyball', icon: '🏐', description: 'Precision spikes, team blocks, and aerial athletics at the net.' },
  tennis: { name: 'Tennis', icon: '🎾', description: 'Grand slam singles and doubles precision on the championship court.' },
  cricket: { name: 'Cricket', icon: '🏏', description: 'Strategic overs, explosive boundary hits, and wicket deliveries.' },
  badminton: { name: 'Badminton', icon: '🏸', description: 'Rapid shuttlecock rallies, smashes, and intense court agility.' },
};

export const SportDetail: React.FC = () => {
  const { sportSlug } = useParams<{ sportSlug: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { data: firestoreSports, isLoading: sportsLoading } = useCollection<Sport>('sports');
  const { data: firestoreMatches } = useCollection<Match>('matches');
  const { data: firestoreTeams } = useCollection<Team>('teams');

  const slug = (sportSlug || '').toLowerCase();
  const matchedSport = firestoreSports?.find(s => s.name.toLowerCase() === slug || s.id === slug);

  const sportName = matchedSport?.name || defaultSports[slug]?.name || (sportSlug ? sportSlug.charAt(0).toUpperCase() + sportSlug.slice(1) : 'Sport');
  const sportIcon = matchedSport?.icon || defaultSports[slug]?.icon || '🏆';
  const sportDescription = matchedSport?.description || defaultSports[slug]?.description || 'Official Olympia 2K26 championship tournament bracket.';

  const sportMatches = firestoreMatches?.filter(m => m.sportId === matchedSport?.id || m.sportId === slug) || [];
  const liveMatches = sportMatches.filter(m => m.status === 'live');
  const upcomingMatches = sportMatches.filter(m => m.status === 'upcoming' || m.status === 'scheduled');
  const completedMatches = sportMatches.filter(m => m.status === 'completed');

  const teams = firestoreTeams?.filter(t => t.sportId === matchedSport?.id || t.sportId === slug) || [];

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
        <div className="container mx-auto px-4 relative z-10">
          <Link
            to="/sports"
            className={cn(
              "inline-flex items-center text-xs font-black uppercase tracking-widest mb-6 transition-colors group",
              isDay ? "text-[#071426]/60 hover:text-[#155EEF]" : "text-white/60 hover:text-[#FFD21F]"
            )}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Sports Universe
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div
              className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl border shadow-xl shrink-0",
                isDay
                  ? "bg-white border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.06)]"
                  : "bg-white/5 border-white/10 shadow-[0_0_30px_rgba(18,100,255,0.2)]"
              )}
            >
              {sportIcon}
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase">
                {sportName}
              </h1>
              <p className={cn("mt-2 max-w-2xl text-sm sm:text-base font-medium", isDay ? "text-[#071426]/70" : "text-white/70")}>
                {sportDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* Live Matches */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D3D] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Live Matches</h2>
          </div>
          {liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map(m => (
                <MatchCard
                  key={m.id}
                  id={m.id}
                  sport={sportName}
                  teamA={m.participantA?.name || m.teamAId || 'Team A'}
                  teamB={m.participantB?.name || m.teamBId || 'Team B'}
                  scoreA={m.score?.teamA ?? 0}
                  scoreB={m.score?.teamB ?? 0}
                  status="live"
                  time={m.liveState?.clock || 'LIVE'}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "p-8 rounded-2xl border text-center text-xs sm:text-sm font-medium",
                isDay ? "bg-white/60 border-[#071426]/10 text-[#071426]/50" : "bg-white/5 border-white/10 text-white/50"
              )}
            >
              No active live fixtures for {sportName} at this moment.
            </div>
          )}
        </section>

        {/* Upcoming Fixtures */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-[#155EEF]" size={22} />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Upcoming Schedule</h2>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map(m => (
                <MatchCard
                  key={m.id}
                  id={m.id}
                  sport={sportName}
                  teamA={m.participantA?.name || m.teamAId || 'Team A'}
                  teamB={m.participantB?.name || m.teamBId || 'Team B'}
                  status="upcoming"
                  time="Scheduled"
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "p-8 rounded-2xl border text-center text-xs sm:text-sm font-medium",
                isDay ? "bg-white/60 border-[#071426]/10 text-[#071426]/50" : "bg-white/5 border-white/10 text-white/50"
              )}
            >
              No upcoming matches scheduled for {sportName}. Check back soon!
            </div>
          )}
        </section>

        {/* Results */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-[#D9A441]" size={22} />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Match Results</h2>
          </div>
          {completedMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedMatches.map(m => (
                <MatchCard
                  key={m.id}
                  id={m.id}
                  sport={sportName}
                  teamA={m.participantA?.name || m.teamAId || 'Team A'}
                  teamB={m.participantB?.name || m.teamBId || 'Team B'}
                  scoreA={m.score?.teamA ?? 0}
                  scoreB={m.score?.teamB ?? 0}
                  status="completed"
                  time="Final"
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "p-8 rounded-2xl border text-center text-xs sm:text-sm font-medium",
                isDay ? "bg-white/60 border-[#071426]/10 text-[#071426]/50" : "bg-white/5 border-white/10 text-white/50"
              )}
            >
              No completed results recorded for {sportName} yet.
            </div>
          )}
        </section>

        {/* Teams in this sport */}
        {teams.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-[#155EEF]" size={22} />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Registered Squads</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teams.map(t => (
                <Link key={t.id} to={`/teams/${t.id}`} className="block group">
                  <div
                    className={cn(
                      "p-6 rounded-2xl border text-center transition-all duration-300 group-hover:-translate-y-1 shadow-md",
                      isDay
                        ? "bg-white/80 border-[#071426]/10 hover:border-[#155EEF]/50 shadow-[0_4px_20px_rgba(7,20,38,0.04)]"
                        : "bg-white/5 border-white/10 hover:border-[#1264FF]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                    )}
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#1264FF] to-[#0D47A1] rounded-2xl flex items-center justify-center text-xl font-black text-white mb-3 shadow-md group-hover:scale-105 transition-transform">
                      {t.shortName || t.name.slice(0, 3).toUpperCase()}
                    </div>
                    <h3 className={cn("font-black text-base truncate", isDay ? "text-[#071426]" : "text-white")}>
                      {t.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SportDetail;

