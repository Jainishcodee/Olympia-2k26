import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { MatchCard } from '@/components/matches/MatchCard';
import { Fixture, Match, Sport, SystemSettings, Team, Tournament, Venue } from '@/types';

const defaultSports: Record<string, { name: string; icon: string; description: string }> = {
  football: { name: 'Football', icon: '⚽', description: 'High-intensity 11v11 field supremacy and championship matches.' },
  basketball: { name: 'Basketball', icon: '🏀', description: 'Fast-paced high-scoring hardwood battles and slam dunk showdowns.' },
  volleyball: { name: 'Volleyball', icon: '🏐', description: 'Precision spikes, team blocks, and aerial athletics at the net.' },
  tennis: { name: 'Tennis', icon: '🎾', description: 'Grand slam singles and doubles precision on the championship court.' },
  cricket: { name: 'Cricket', icon: '🏏', description: 'Strategic overs, explosive boundary hits, and wicket deliveries.' },
  badminton: { name: 'Badminton', icon: '🏸', description: 'Rapid shuttlecock rallies, smashes, and intense court agility.' },
};

const parseDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const stamp = val as { toDate?: () => Date; seconds?: number };
  if (typeof stamp.toDate === 'function') return stamp.toDate();
  if (typeof stamp.seconds === 'number') return new Date(stamp.seconds * 1000);
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatScheduleTime = (val: unknown): string => {
  const d = parseDate(val);
  if (!d) return 'Scheduled';
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SportDetail: React.FC = () => {
  const { sportSlug } = useParams<{ sportSlug: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { data: firestoreSports, isLoading: sportsLoading } = useCollection<Sport>('sports');
  const { data: firestoreMatches } = useCollection<Match>('matches');
  const { data: firestoreFixtures } = useCollection<Fixture>('fixtures');
  const { data: firestoreTournaments } = useCollection<Tournament>('tournaments');
  const { data: firestoreVenues } = useCollection<Venue>('venues');
  const { data: firestoreTeams } = useCollection<Team>('teams');
  const { data: systemSettings } = useDoc<SystemSettings>('settings', 'default');

  const slug = (sportSlug || '').toLowerCase();
  const matchedSport = firestoreSports?.find(
    (s) =>
      s.slug?.toLowerCase() === slug ||
      s.name.toLowerCase() === slug ||
      s.id.toLowerCase() === slug
  );

  const sportName = matchedSport?.name || defaultSports[slug]?.name || (sportSlug ? sportSlug.charAt(0).toUpperCase() + sportSlug.slice(1) : 'Sport');
  const sportIcon = matchedSport?.icon || defaultSports[slug]?.icon || '🏆';
  const sportDescription = matchedSport?.description || defaultSports[slug]?.description || 'Official Olympia 2K26 championship tournament bracket.';

  const sportKeys = React.useMemo(() => {
    return new Set(
      [
        slug,
        matchedSport?.id?.toLowerCase(),
        matchedSport?.slug?.toLowerCase(),
        matchedSport?.name?.toLowerCase(),
      ].filter(Boolean) as string[]
    );
  }, [slug, matchedSport]);

  const sportMatches = React.useMemo(() => {
    if (systemSettings?.publicMatchesVisible === false) return [];
    return (firestoreMatches || [])
      .filter((m) => !m.isHidden)
      .filter((m) => {
        const mSport = (m.sportId || '').toLowerCase();
        return sportKeys.has(mSport) || (matchedSport?.id && m.sportId === matchedSport.id);
      });
  }, [firestoreMatches, matchedSport?.id, sportKeys, systemSettings?.publicMatchesVisible]);

  const liveMatches = sportMatches.filter(m => m.status === 'live' || m.status === 'paused');
  const completedMatches = sportMatches.filter(m => m.status === 'completed');

  const tournamentMap = React.useMemo(
    () => new Map(firestoreTournaments?.map((t) => [t.id, t])),
    [firestoreTournaments]
  );
  const teamMap = React.useMemo(
    () => new Map(firestoreTeams?.map((t) => [t.id, t])),
    [firestoreTeams]
  );
  const venueMap = React.useMemo(
    () => new Map(firestoreVenues?.map((v) => [v.id, v])),
    [firestoreVenues]
  );
  const matchIdSet = React.useMemo(() => new Set(sportMatches.map((m) => m.id)), [sportMatches]);

  // Find all fixtures belonging to this sport (by sportId, tournament, team, or linked match)
  const sportFixtures = React.useMemo(() => {
    if (!firestoreFixtures) return [];
    if (systemSettings?.publicFixturesVisible === false) return [];
    return firestoreFixtures
      .filter((f) => !f.isHidden)
      .filter((f) => {
        const fSport = (f.sportId || '').toLowerCase();
        if (fSport && sportKeys.has(fSport)) return true;
        const tourney = tournamentMap.get(f.tournamentId);
        const tSport = (tourney?.sportId || '').toLowerCase();
        if (tSport && sportKeys.has(tSport)) return true;
        const teamA = teamMap.get(f.teamAId);
        const teamB = teamMap.get(f.teamBId);
        const aSport = (teamA?.sportId || '').toLowerCase();
        const bSport = (teamB?.sportId || '').toLowerCase();
        if (aSport && sportKeys.has(aSport)) return true;
        if (bSport && sportKeys.has(bSport)) return true;
        if (f.matchId && matchIdSet.has(f.matchId)) return true;
        return false;
      });
  }, [firestoreFixtures, sportKeys, tournamentMap, teamMap, matchIdSet, systemSettings?.publicFixturesVisible]);

  // Unified upcoming schedule combining scheduled matches and tournament fixtures
  const upcomingSchedule = React.useMemo(() => {
    // 1. Scheduled / upcoming matches from matches collection
    const fromMatches = sportMatches
      .filter((m) => m.status === 'upcoming' || m.status === 'scheduled')
      .map((m) => {
        const teamA = m.participantA?.name || teamMap.get(m.teamAId)?.name || m.teamAId || 'Team A';
        const teamB = m.participantB?.name || teamMap.get(m.teamBId)?.name || m.teamBId || 'Team B';
        const tourney = tournamentMap.get(m.tournamentId);
        const venue = venueMap.get(m.venueId);
        const formatted = formatScheduleTime(m.scheduledAt);
        return {
          id: m.id,
          teamA,
          teamB,
          status: 'upcoming' as const,
          time: formatted,
          rawDate: parseDate(m.scheduledAt),
          badge: tourney?.name || 'Championship Match',
          venue: venue?.name,
        };
      });

    // 2. Tournament fixtures from fixtures collection (not already covered as a match)
    const fromFixtures = sportFixtures
      .filter((f) => !f.matchId || !matchIdSet.has(f.matchId))
      .filter((f) => f.status !== 'completed' && f.status !== 'cancelled')
      .map((f) => {
        const teamA = teamMap.get(f.teamAId)?.name || f.teamAId || 'Team A';
        const teamB = teamMap.get(f.teamBId)?.name || f.teamBId || 'Team B';
        const tourney = tournamentMap.get(f.tournamentId);
        const venue = venueMap.get(f.venueId);
        const formatted = formatScheduleTime(f.scheduledAt);
        const timeLabel = formatted !== 'Scheduled' ? formatted : (f.round || 'Scheduled');
        return {
          id: f.id,
          teamA,
          teamB,
          status: 'upcoming' as const,
          time: timeLabel,
          rawDate: parseDate(f.scheduledAt),
          badge: f.round ? `${f.round}${tourney ? ` · ${tourney.name}` : ''}` : (tourney?.name || 'Tournament Fixture'),
          venue: venue?.name,
        };
      });

    return [...fromMatches, ...fromFixtures].sort((a, b) => {
      const timeA = a.rawDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const timeB = b.rawDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
  }, [sportMatches, sportFixtures, teamMap, tournamentMap, venueMap, matchIdSet]);

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
              {liveMatches.map(m => {
                const isPaused = m.status === 'paused';
                const isHalfTime = Boolean((m.liveState as Record<string, unknown>)?.isHalfTime);
                const isCricket = (m.sportId || '').toLowerCase().includes('cricket');
                const timeLabel = isPaused 
                  ? (isCricket ? 'INNINGS BREAK' : isHalfTime ? 'HALF TIME' : 'PAUSED') 
                  : (m.liveState?.clock || 'LIVE');

                return (
                  <MatchCard
                    key={m.id}
                    id={m.id}
                    sport={sportName}
                    teamA={m.participantA?.name || m.teamAId || 'Team A'}
                    teamB={m.participantB?.name || m.teamBId || 'Team B'}
                    scoreA={m.score?.teamA ?? 0}
                    scoreB={m.score?.teamB ?? 0}
                    status={m.status as any}
                    time={timeLabel}
                  />
                );
              })}
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
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">Upcoming Schedule & Fixtures</h2>
            {upcomingSchedule.length > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {upcomingSchedule.length} Fixtures
              </span>
            )}
          </div>
          {upcomingSchedule.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingSchedule.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <MatchCard
                    id={item.id}
                    sport={sportName}
                    teamA={item.teamA}
                    teamB={item.teamB}
                    status="upcoming"
                    time={item.time}
                  />
                  {(item.badge || item.venue) && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
                      <span className="truncate max-w-[65%]">{item.badge}</span>
                      {item.venue && <span className="truncate max-w-[32%] text-right">{item.venue}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "p-8 rounded-2xl border text-center text-xs sm:text-sm font-medium",
                isDay ? "bg-white/60 border-[#071426]/10 text-[#071426]/50" : "bg-white/5 border-white/10 text-white/50"
              )}
            >
              No upcoming fixtures or matches scheduled for {sportName}. Check back soon!
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
                    <h3 className={cn("font-black text-base break-words", isDay ? "text-[#071426]" : "text-white")}>
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

