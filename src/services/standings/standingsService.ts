
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Match, LeaderboardEntry } from '@/types';
import {
  deriveStandingsFromCompletedMatches,
  RegisteredEntity,
  ScoringRules,
} from '@/utils/standingsRules';

export interface StandingsRow {
  position: number;
  entityId: string;
  entityName: string;
  logo: string;
  entityType: 'team' | 'player';
  sportId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  setsWon?: number;
  setsLost?: number;
  roundsWon?: number;
  roundsLost?: number;
  runs?: number;
  wickets?: number;
  netRunRate?: string;
  stats: Record<string, unknown>;
}

/**
 * Calculates authoritative standings for a sport strictly from COMPLETED matches.
 * - Respects configurable scoring rules from settings/tournaments.
 * - Ensures historical stability from frozen match participant data.
 */
export const calculateSportStandings = async (
  sportId: string,
  isIndividual: boolean = false,
  customRules?: ScoringRules | null
): Promise<StandingsRow[]> => {
  if (!isFirebaseConfigured || !db) return [];

  try {
    // 1. Authoritative completed matches only
    const matchesRef = collection(db, 'matches');
    const qMatches = query(matchesRef, where('status', '==', 'completed'));
    const snapshot = await getDocs(qMatches);
    const completedMatches = snapshot.docs.map(
      (d) => ({ ...d.data(), id: d.id } as Match)
    );

    // 2. Fetch registered teams or players for this sport
    const registeredEntities: RegisteredEntity[] = [];
    if (isIndividual) {
      const playersRef = collection(db, 'players');
      const snapPlayers = await getDocs(playersRef);
      snapPlayers.docs.forEach((d) => {
        const p = d.data();
        if (p.sportId === sportId && p.active !== false) {
          registeredEntities.push({
            id: d.id,
            name: p.name,
            photo: p.photo,
          });
        }
      });
    } else {
      const teamsRef = collection(db, 'teams');
      const snapTeams = await getDocs(teamsRef);
      snapTeams.docs.forEach((d) => {
        const t = d.data();
        const matchesSport =
          t.sportId === sportId ||
          (sportId === 'lan-games' && t.sportId === 'counter-strike');
        if (matchesSport && t.active !== false) {
          registeredEntities.push({
            id: d.id,
            name: t.name,
            logo: t.logo,
            shortName: t.shortName,
          });
        }
      });
    }

    // 3. Resolve scoring rules from settings if not explicitly passed
    let rules = customRules;
    if (!rules) {
      const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data();
        const configuredRules = settings.tournamentScoringRules?.[sportId];
        if (configuredRules) {
          rules = configuredRules as ScoringRules;
        }
      }
    }

    // 4. Derive authoritative standings
    const entries = deriveStandingsFromCompletedMatches(
      sportId,
      completedMatches,
      registeredEntities,
      isIndividual,
      rules
    );

    return entries.map((e) => ({
      position: e.position,
      entityId: e.entityId,
      entityName: e.entityName,
      logo: e.logo,
      entityType: e.entityType,
      sportId: e.sportId,
      played: e.played,
      wins: e.wins,
      draws: e.draws,
      losses: e.losses,
      points: e.points,
      goalsFor: e.goalsFor,
      goalsAgainst: e.goalsAgainst,
      goalDifference: e.goalDifference,
      setsWon: e.setsWon,
      setsLost: e.setsLost,
      roundsWon: e.roundsWon,
      roundsLost: e.roundsLost,
      runs: e.runs,
      wickets: e.wickets,
      netRunRate: e.netRunRate,
      stats: e.stats,
    }));
  } catch (error) {
    console.error('Error calculating sport standings:', error);
    return [];
  }
};

/**
 * Regenerates and publishes sport standings into leaderboards/{sportId}
 * Triggered automatically when a match completes or manually by administrators.
 */
export const syncSportLeaderboardToFirestore = async (
  sportId: string,
  sportName: string,
  category: 'team' | 'individual' = 'team',
  customRules?: ScoringRules | null
): Promise<LeaderboardEntry[]> => {
  if (!db) throw new Error('Firestore not initialized');

  const rows = await calculateSportStandings(sportId, category === 'individual', customRules);

  const entries: LeaderboardEntry[] = rows.map((r) => ({
    position: r.position,
    entityId: r.entityId,
    entityType: r.entityType,
    entityName: r.entityName,
    logo: r.logo,
    sportId,
    points: r.points,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    stats: r.stats as Record<string, number>,
  }));

  const docRef = doc(db, 'leaderboards', sportId);
  await setDoc(
    docRef,
    {
      id: sportId,
      sportId,
      sportName,
      category,
      entries,
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
    },
    { merge: true }
  );

  return entries;
};
