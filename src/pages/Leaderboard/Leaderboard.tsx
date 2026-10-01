import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/arena/Footer';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { InteractiveParticleCanvas, VelocityMarquee } from '@/components/motion';
import { LeaderboardHero } from './components/LeaderboardHero';
import { SportFilterRibbon, DISCIPLINE_LIST } from './components/SportFilterRibbon';
import { SportAtmosphere } from './components/SportAtmosphere';
import { TeamChampionshipView } from './components/TeamChampionshipView';
import { IndividualPodiumView } from './components/IndividualPodiumView';
import { MultiSportLeaderboardGrid } from './components/MultiSportLeaderboardGrid';
import { ChampionsArchive } from './components/ChampionsArchive';
import { EntityProfileModal } from './components/EntityProfileModal';
import { LeaderboardCTA } from './components/LeaderboardCTA';
import type { LeaderboardItem } from './components/PodiumHero';
import type { Player, Team, Sport, Match, SystemSettings } from '@/types';
import { cn } from '@/utils/cn';

const TEAM_SPORTS = ['football', 'cricket', 'volleyball', 'hand-tennis', 'counter-strike', 'smash-karts', 'lan-games'];

export const Leaderboard: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // Sport is the PRIMARY navigation
  const [selectedSport, setSelectedSport] = useState<string>('football');
  const [selectedItem, setSelectedItem] = useState<LeaderboardItem | null>(null);

  // Live Firestore collections
  const playersCol = useCollection<Player>('players');
  const teamsCol = useCollection<Team>('teams');
  const sportsCol = useCollection<Sport>('sports');
  const matchesCol = useCollection<Match>('matches');
  const leaderboardsCol = useCollection<any>('leaderboards');
  const settingsDoc = useDoc<SystemSettings>('settings', 'default');

  const isMasterLeaderboardHidden = settingsDoc.data?.publicLeaderboardVisible === false;

  // Dynamic extra disciplines from Firestore 'leaderboards' collection (e.g. test record)
  const extraDisciplines = useMemo(() => {
    const defaultIds = new Set(DISCIPLINE_LIST.map((d) => d.id));
    return leaderboardsCol.data
      .filter((doc) => !doc.isHidden)
      .filter((doc) => !defaultIds.has(doc.sportId) && !defaultIds.has(doc.id || ''))
      .map((doc) => ({
        id: doc.sportId || doc.id || 'test-discipline',
        name: doc.sportName || 'Test Discipline',
        icon: '🧪',
        category: (doc.category || 'team') as 'team' | 'individual',
        description: 'Firestore Leaderboard Record',
      }));
  }, [leaderboardsCol.data]);

  // Sport metadata
  const currentSportMeta = useMemo(() => {
    const allDiscs = [...DISCIPLINE_LIST, ...extraDisciplines];
    return (
      allDiscs.find((s) => s.id === selectedSport) || {
        id: selectedSport,
        name: selectedSport.toUpperCase(),
        icon: '🏆',
        category: (TEAM_SPORTS.includes(selectedSport) ? 'team' : 'individual') as 'team' | 'individual',
        description: 'Standings',
      }
    );
  }, [selectedSport, extraDisciplines]);

  const isTeamSport = currentSportMeta.category === 'team';

  // Check if a dedicated 'leaderboards' document exists for active discipline
  const customLeaderboardDoc = useMemo(() => {
    return leaderboardsCol.data.find(
      (doc) => (doc.sportId === selectedSport || doc.id === selectedSport) && !doc.isHidden
    );
  }, [leaderboardsCol.data, selectedSport]);

  const isSelectedSportHidden = useMemo(() => {
    const d = leaderboardsCol.data.find(
      (doc) => doc.sportId === selectedSport || doc.id === selectedSport
    );
    return d?.isHidden === true;
  }, [leaderboardsCol.data, selectedSport]);

  // Map players by Team ID for supporting captain / MVP lookup
  const playersByTeam = useMemo(() => {
    const map = new Map<string, Player[]>();
    playersCol.data.forEach((p) => {
      if (p.teamId) {
        const list = map.get(p.teamId) || [];
        list.push(p);
        map.set(p.teamId, list);
      }
    });
    return map;
  }, [playersCol.data]);

  // Filtered Teams for the active discipline (handles lan-games and counter-strike aliases)
  const activeTeams = useMemo(() => {
    return teamsCol.data.filter((t) => {
      if (selectedSport === 'lan-games') {
        return t.sportId === 'lan-games' || t.sportId === 'counter-strike';
      }
      return t.sportId === selectedSport;
    });
  }, [teamsCol.data, selectedSport]);

  // Filtered Individual Players for the active discipline
  const activePlayers = useMemo(() => {
    return playersCol.data.filter((p) => p.sportId === selectedSport);
  }, [playersCol.data, selectedSport]);

  // Authoritative standings derived directly from completed matches
  const derivedMatchesStandings = useMemo(() => {
    const sLower = selectedSport.toLowerCase();
    const completedMatches = matchesCol.data.filter((m) => {
      if (m.status !== 'completed') return false;
      const mSport = (m.sportId || '').toLowerCase();
      if (sLower === 'lan-games' || sLower === 'counter-strike') {
        return mSport.includes('strike') || mSport.includes('cs') || mSport.includes('lan');
      }
      return mSport === sLower || mSport.includes(sLower) || sLower.includes(mSport);
    });

    const isFootball = sLower.includes('football') || sLower.includes('soccer');

    const entityStats = new Map<string, {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
    }>();

    const getStats = (id: string) => {
      if (!entityStats.has(id)) {
        entityStats.set(id, {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        });
      }
      return entityStats.get(id)!;
    };

    for (const match of completedMatches) {
      const idA = match.teamAId || match.participantA?.id || '';
      const idB = match.teamBId || match.participantB?.id || '';
      if (!idA || !idB) continue;

      const stA = getStats(idA);
      const stB = getStats(idB);

      stA.played += 1;
      stB.played += 1;

      const scA = Number(match.score?.teamA ?? 0);
      const scB = Number(match.score?.teamB ?? 0);

      stA.goalsFor += scA;
      stA.goalsAgainst += scB;
      stB.goalsFor += scB;
      stB.goalsAgainst += scA;

      let winner: 'A' | 'B' | 'draw' = 'draw';
      const liveWinner = (match.liveState as any)?.winnerTeam;
      if (liveWinner === 'teamA') winner = 'A';
      else if (liveWinner === 'teamB') winner = 'B';
      else if (liveWinner === 'draw' || liveWinner === 'tie') winner = 'draw';
      else if (scA > scB) winner = 'A';
      else if (scB > scA) winner = 'B';

      if (winner === 'A') {
        stA.wins += 1;
        stB.losses += 1;
        stA.points += isFootball ? 3 : 2;
      } else if (winner === 'B') {
        stB.wins += 1;
        stA.losses += 1;
        stB.points += isFootball ? 3 : 2;
      } else {
        stA.draws += 1;
        stB.draws += 1;
        stA.points += 1;
        stB.points += 1;
      }
    }

    return entityStats;
  }, [matchesCol.data, selectedSport]);

  // Sync: prioritize explicit 'leaderboards' collection documents if published, else completed match standings
  const effectiveTeams = useMemo(() => {
    if (customLeaderboardDoc && customLeaderboardDoc.category === 'team' && customLeaderboardDoc.entries?.length) {
      return customLeaderboardDoc.entries.map((entry: any) => ({
        id: entry.entityId,
        name: entry.entityName,
        shortName: (entry.entityName || '').slice(0, 4).toUpperCase(),
        logo: entry.logo,
        sportId: selectedSport,
        points: entry.points,
        wins: entry.wins,
        draws: entry.draws,
        losses: entry.losses,
        goalsFor: entry.stats?.goalsFor,
        goalsAgainst: entry.stats?.goalsAgainst,
        goalDifference: entry.stats?.goalDifference,
        active: true,
      } as unknown as Team));
    }

    return activeTeams.map((t) => {
      const derived = derivedMatchesStandings.get(t.id);
      const pts = derived ? derived.points : 0;
      const w = derived ? derived.wins : 0;
      const d = derived ? derived.draws : 0;
      const l = derived ? derived.losses : 0;
      const gf = derived ? derived.goalsFor : 0;
      const ga = derived ? derived.goalsAgainst : 0;
      const gd = gf - ga;

      return {
        ...t,
        points: pts,
        wins: w,
        draws: d,
        losses: l,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gd,
      };
    }).sort((a, b) => {
      const pB = (b as any).points ?? 0;
      const pA = (a as any).points ?? 0;
      if (pB !== pA) return pB - pA;
      const gdB = (b as any).goalDifference ?? 0;
      const gdA = (a as any).goalDifference ?? 0;
      if (gdB !== gdA) return gdB - gdA;
      return ((b as any).wins ?? 0) - ((a as any).wins ?? 0);
    });
  }, [customLeaderboardDoc, activeTeams, derivedMatchesStandings, selectedSport]);

  const effectivePlayers = useMemo(() => {
    if (customLeaderboardDoc && customLeaderboardDoc.category === 'individual' && customLeaderboardDoc.entries?.length) {
      return customLeaderboardDoc.entries.map((entry: any) => ({
        id: entry.entityId,
        name: entry.entityName,
        photo: entry.logo,
        sportId: selectedSport,
        role: 'player' as const,
        position: 'Contender',
        gender: 'male' as const,
        active: true,
        stats: {
          points: entry.points,
          wins: entry.wins,
          losses: entry.losses,
          matchesPlayed: (entry.wins || 0) + (entry.losses || 0) || 1,
          rating: entry.stats?.rating || 4.8,
          goals: 0,
          assists: 0,
          runs: 0,
          wickets: 0,
        },
      } as unknown as Player));
    }

    return activePlayers.map((p) => {
      const derived = derivedMatchesStandings.get(p.id);
      const pts = derived ? derived.points : 0;
      const w = derived ? derived.wins : 0;
      const l = derived ? derived.losses : 0;

      return {
        ...p,
        stats: {
          ...(p.stats || {}),
          points: pts,
          wins: w,
          losses: l,
          matchesPlayed: w + l,
        },
      };
    }).sort((a, b) => {
      const pB = (b.stats as any)?.points ?? 0;
      const pA = (a.stats as any)?.points ?? 0;
      if (pB !== pA) return pB - pA;
      return ((b.stats as any)?.wins ?? 0) - ((a.stats as any)?.wins ?? 0);
    });
  }, [customLeaderboardDoc, activePlayers, derivedMatchesStandings, selectedSport]);

  const totalEntries = isTeamSport ? effectiveTeams.length : effectivePlayers.length;

  return (
    <div
      className={`relative min-h-screen transition-colors duration-500 overflow-x-hidden ${
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white'
      }`}
    >
      <InteractiveParticleCanvas />

      {/* Sport-specific ambient background geometry */}
      <SportAtmosphere sportId={selectedSport} />

      {/* Top Motion Ticker Banner */}
      <div
        className={`pt-24 pb-3.5 border-b overflow-hidden transition-colors duration-300 relative z-10 ${
          isDay
            ? 'bg-white/80 border-[#071426]/10 text-[#071426]'
            : 'bg-[#040B17]/90 border-white/10 text-white'
        }`}
      >
        <VelocityMarquee baseVelocity={1.5} className="text-xs tracking-[0.3em] font-black uppercase">
          <span className="text-[#D9A441]">★</span>
          <span>OLYMPIA 2K26 RANKING INDEX</span>
          <span className="text-[#1264FF]">/</span>
          <span>{currentSportMeta.name.toUpperCase()} {isTeamSport ? 'TEAM STANDINGS' : 'TOP 3 PODIUM'}</span>
          <span className="text-[#D9A441]">★</span>
          <span>LIVE FIRESTORE TELEMETRY</span>
          <span className="text-[#FF4D3D]">/</span>
          <span>DISCIPLINE-DRIVEN ARCHITECTURE</span>
        </VelocityMarquee>
      </div>

      <Container className="pt-8 sm:pt-12 pb-20 relative z-10">
        {isMasterLeaderboardHidden ? (
          <div className="py-24 text-center max-w-2xl mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center justify-center text-4xl shadow-xl">
              🏆
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-wider mb-4 text-[#D9A441]">
              Leaderboard Under Official Audit
            </h2>
            <p className={cn('text-sm sm:text-base leading-relaxed', isDay ? 'text-slate-600' : 'text-slate-400')}>
              The Olympia 2K26 championship leaderboard and standing rankings are currently undergoing official review and verification by tournament administrators. Public standings telemetry will be restored shortly once all match results are signed off.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Header with Dynamic Sport Title & Status (NO athletes/teams toggle) */}
            <LeaderboardHero
              sportName={currentSportMeta.name}
              sportCategory={currentSportMeta.category}
              totalEntries={totalEntries}
            />

            {/* 2. Primary Navigation: SELECT DISCIPLINE */}
            <SportFilterRibbon
              selectedSport={selectedSport}
              onSelectSport={(s: string) => setSelectedSport(s)}
              extraDisciplines={extraDisciplines}
            />

            {isSelectedSportHidden ? (
              <div className="py-20 text-center max-w-md mx-auto px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
                  🔒
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wider mb-2">
                  {currentSportMeta.name} Standings Hidden
                </h3>
                <p className={cn('text-xs sm:text-sm', isDay ? 'text-slate-500' : 'text-slate-400')}>
                  Standings for this discipline have been marked private by tournament officials. Please select another discipline from the ribbon above.
                </p>
              </div>
            ) : (
              /* 3. Sport World Content with Animated Transition (500–900ms) */
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSport}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {isTeamSport ? (
                    /* Team-Based Sports: Football, Cricket, Volleyball, Hand Tennis, LAN Games */
                    <TeamChampionshipView
                      teams={effectiveTeams}
                      sportId={selectedSport}
                      playersByTeam={playersByTeam}
                      onSelectTeam={(item: LeaderboardItem) => setSelectedItem(item)}
                    />
                  ) : (
                    /* Individual Sports: Badminton, Table Tennis, Chess, Carrom (TOP 3 ONLY) */
                    <IndividualPodiumView
                      players={effectivePlayers}
                      sportId={selectedSport}
                      sportName={currentSportMeta.name}
                      onSelectPlayer={(item: LeaderboardItem) => setSelectedItem(item)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* 4. Discipline Summit: All 9 Disciplines At-A-Glance */}
            <MultiSportLeaderboardGrid
              onSelectDiscipline={(sportId: string) => setSelectedSport(sportId)}
            />

            {/* 5. Historical Champions Wall */}
            <ChampionsArchive />

            {/* 6. Closing CTA Banner */}
            <LeaderboardCTA />
          </>
        )}
      </Container>

      {/* 7. Interactive Profile Drawer Modal */}
      <EntityProfileModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <Footer />
    </div>
  );
};

export default Leaderboard;
