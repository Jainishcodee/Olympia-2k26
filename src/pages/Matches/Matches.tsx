import React, { useState, useMemo } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { MatchCard } from '@/components/matches/MatchCard';
import { Footer } from '@/components/arena/Footer';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import type { Fixture, Match, Sport, SystemSettings, Team, Tournament } from '@/types';
import { FiInbox } from 'react-icons/fi';
import { cn } from '@/utils/cn';

const TABS = ['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const;
type TabType = typeof TABS[number];

export const Matches: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const fixtures = useCollection<Fixture>('fixtures');
  const sports = useCollection<Sport>('sports');
  const tournaments = useCollection<Tournament>('tournaments');
  const teams = useCollection<Team>('teams');
  const settingsDoc = useDoc<SystemSettings>('settings', 'default');

  const teamById = useMemo(
    () => new Map(teams.data.map((t) => [t.id, t])),
    [teams.data]
  );
  const sportById = useMemo(
    () => new Map(sports.data.map((s) => [s.id, s])),
    [sports.data]
  );
  const tourneyById = useMemo(
    () => new Map(tournaments.data.map((t) => [t.id, t])),
    [tournaments.data]
  );

  const matchIdSet = useMemo(() => new Set(matches.data.map((m) => m.id)), [matches.data]);

  // Convert standalone fixtures without linked matches into match-like cards
  const standaloneFixtures = useMemo(() => {
    if (settingsDoc.data?.publicFixturesVisible === false) return [];
    return fixtures.data
      .filter((f) => !f.isHidden)
      .filter((f) => !f.matchId || !matchIdSet.has(f.matchId))
      .map((f) => {
        const teamA = teamById.get(f.teamAId);
        const teamB = teamById.get(f.teamBId);
        const tourney = tourneyById.get(f.tournamentId);
        const sportId = f.sportId || tourney?.sportId || teamA?.sportId || 'cricket';
        return {
          id: f.id,
          sportId,
          tournamentId: f.tournamentId,
          matchNumber: 0,
          teamAId: f.teamAId,
          teamBId: f.teamBId,
          participantA: {
            id: f.teamAId,
            name: teamA?.name || f.teamAId || 'Team A',
            logo: teamA?.logo || '',
            type: 'team' as const,
          },
          participantB: {
            id: f.teamBId,
            name: teamB?.name || f.teamBId || 'Team B',
            logo: teamB?.logo || '',
            type: 'team' as const,
          },
          venueId: f.venueId,
          scheduledAt: f.scheduledAt,
          startedAt: null,
          pausedAt: null,
          endedAt: null,
          status: (f.status as any) || 'scheduled',
          score: { teamA: 0, teamB: 0, details: {} },
          liveState: {},
          displayMode: 'dual_portrait' as const,
          featured: false,
          featuredPriority: 0,
          allowReactions: false,
          allowVoting: false,
          allowRatings: false,
          allowReviews: false,
          archived: false,
          createdBy: 'fixture',
          createdAt: f.createdAt,
          updatedAt: f.createdAt,
        } as Match;
      });
  }, [fixtures.data, matchIdSet, teamById, tourneyById, settingsDoc.data?.publicFixturesVisible]);

  const visibleMatches = useMemo(() => {
    if (settingsDoc.data?.publicMatchesVisible === false) return [];
    return matches.data.filter((m) => !m.isHidden);
  }, [matches.data, settingsDoc.data?.publicMatchesVisible]);

  const allItems = useMemo(() => {
    return [...visibleMatches, ...standaloneFixtures];
  }, [visibleMatches, standaloneFixtures]);

  const filteredMatches = useMemo(() => {
    if (activeTab === 'ALL') return allItems;
    if (activeTab === 'LIVE') return allItems.filter((m) => m.status === 'live');
    if (activeTab === 'UPCOMING') return allItems.filter((m) => m.status === 'upcoming' || m.status === 'scheduled');
    if (activeTab === 'COMPLETED') return allItems.filter((m) => m.status === 'completed');
    return allItems;
  }, [allItems, activeTab]);

  const getTeamName = (id?: string, participantName?: string) => {
    if (participantName) return participantName;
    if (!id) return 'Team';
    return teamById.get(id)?.name || id;
  };

  const getScore = (match: Match) => {
    const s = match.score as unknown as Record<string, unknown> | undefined;
    return {
      scoreA: Number(s?.teamA ?? 0),
      scoreB: Number(s?.teamB ?? 0),
    };
  };

  const getMatchTime = (match: Match) => {
    if (match.status === 'live') return match.liveState?.clock || 'LIVE';
    if (match.scheduledAt) {
      const date = typeof (match.scheduledAt as any).toDate === 'function' 
        ? (match.scheduledAt as any).toDate() 
        : new Date(match.scheduledAt as any);
      return Number.isNaN(date.getTime()) ? 'Scheduled' : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return match.status === 'completed' ? 'Final' : 'Upcoming';
  };

  return (
    <div
      className={cn(
        'min-h-screen pt-28 sm:pt-32 flex flex-col justify-between transition-colors duration-300',
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white'
      )}
    >
      <Container className="flex-1 pb-24">
        <SectionTitle title="ALL MATCHES" subtitle="Complete tournament schedule and telemetry results" />
        
        {/* Mobile-Friendly Tabs with Momentum Scroll */}
        <div className="flex space-x-2.5 mb-8 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-5 sm:px-6 py-2.5 rounded-xl font-black tracking-widest text-xs uppercase transition-all duration-200 shrink-0 active:scale-95',
                  isActive 
                    ? isDay
                      ? 'bg-[#1264FF] text-white shadow-[0_4px_20px_rgba(18,100,255,0.25)]'
                      : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#080A0D] shadow-[0_0_15px_rgba(217,164,65,0.4)]'
                    : isDay
                    ? 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {matches.isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#D9A441] inline-block mb-3" />
            <p className="text-xs uppercase tracking-widest font-black text-[#D9A441]">Loading Arena Matches…</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div
            className={cn(
              'py-16 sm:py-20 px-6 rounded-3xl border text-center max-w-lg mx-auto my-8 backdrop-blur-md shadow-xl',
              isDay ? 'bg-white/80 border-[#071426]/10 text-slate-800' : 'bg-[#071426]/50 border-white/10 text-white'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FiInbox className="h-6 w-6" />
            </div>
            <h3 className={cn('text-base font-black uppercase mb-1', isDay ? 'text-slate-900' : 'text-white')}>
              No {activeTab.toLowerCase()} matches found
            </h3>
            <p className={cn('text-xs leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>
              There are currently no {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} matches registered in the tournament database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredMatches.map((match) => {
              const { scoreA, scoreB } = getScore(match);
              return (
                <MatchCard 
                  key={match.id}
                  id={match.id} 
                  sport={sportById.get(match.sportId)?.name || match.sportId} 
                  teamA={getTeamName(match.teamAId, match.participantA?.name)} 
                  teamB={getTeamName(match.teamBId, match.participantB?.name)} 
                  scoreA={scoreA} 
                  scoreB={scoreB} 
                  status={match.status as any} 
                  time={getMatchTime(match)} 
                />
              );
            })}
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default Matches;
