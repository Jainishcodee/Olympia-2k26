import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Match, Leaderboard, LeaderboardEntry } from '@/types';

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
  stats: Record<string, number>;
}

/**
 * Calculates authoritative standings for a sport strictly from COMPLETED matches.
 */
export const calculateSportStandings = async (
  sportId: string,
  isIndividual: boolean = false
): Promise<StandingsRow[]> => {
  if (!isFirebaseConfigured || !db) return [];

  const matchesRef = collection(db, 'matches');
  // Query all completed matches for this sport (or alias like lan-games / counter-strike)
  const q = query(
    matchesRef,
    where('status', '==', 'completed')
  );

  const snapshot = await getDocs(q);
  const completedMatches = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Match))
    .filter((m) => {
      const mSport = (m.sportId || '').toLowerCase();
      const target = sportId.toLowerCase();
      if (target === 'lan-games' || target === 'counter-strike') {
        return mSport.includes('strike') || mSport.includes('cs') || mSport.includes('lan');
      }
      return mSport === target || mSport.includes(target) || target.includes(mSport);
    });

  const sLower = sportId.toLowerCase();
  const isFootball = sLower.includes('football') || sLower.includes('soccer');
  const isCricket = sLower.includes('cricket');
  const isVolleyball = sLower.includes('volleyball') || sLower.includes('tennis');
  const isRacquet = sLower.includes('badminton') || sLower.includes('table-tennis');

  // Map of entityId -> accumulator
  const entityMap = new Map<string, {
    entityId: string;
    entityName: string;
    logo: string;
    entityType: 'team' | 'player';
    played: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    setsWon: number;
    setsLost: number;
  }>();

  const getOrCreate = (id: string, name: string, logo: string, type: 'team' | 'player') => {
    if (!entityMap.has(id)) {
      entityMap.set(id, {
        entityId: id,
        entityName: name,
        logo: logo || '',
        entityType: type,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        setsWon: 0,
        setsLost: 0,
      });
    }
    return entityMap.get(id)!;
  };

  for (const match of completedMatches) {
    const pType: 'team' | 'player' = isIndividual ? 'player' : 'team';
    const idA = match.teamAId || match.participantA?.id || 'teamA';
    const nameA = match.participantA?.name || 'Team A';
    const logoA = match.participantA?.logo || '';

    const idB = match.teamBId || match.participantB?.id || 'teamB';
    const nameB = match.participantB?.name || 'Team B';
    const logoB = match.participantB?.logo || '';

    const entityA = getOrCreate(idA, nameA, logoA, pType);
    const entityB = getOrCreate(idB, nameB, logoB, pType);

    entityA.played += 1;
    entityB.played += 1;

    const scoreA = Number(match.score?.teamA ?? 0);
    const scoreB = Number(match.score?.teamB ?? 0);

    // Goal / point statistics
    entityA.goalsFor += scoreA;
    entityA.goalsAgainst += scoreB;
    entityB.goalsFor += scoreB;
    entityB.goalsAgainst += scoreA;

    // Sets won / lost for racquet & volleyball
    if (isVolleyball || isRacquet) {
      const setsA = Number(
        (match.liveState as any)?.setsWon?.teamA ??
        (match.liveState as any)?.gamesWon?.teamA ??
        (match.score?.details as any)?.setsWon?.teamA ??
        0
      );
      const setsB = Number(
        (match.liveState as any)?.setsWon?.teamB ??
        (match.liveState as any)?.gamesWon?.teamB ??
        (match.score?.details as any)?.setsWon?.teamB ??
        0
      );
      entityA.setsWon += setsA;
      entityA.setsLost += setsB;
      entityB.setsWon += setsB;
      entityB.setsLost += setsA;
    }

    // Determine match winner
    let winner: 'A' | 'B' | 'draw' = 'draw';
    const liveWinner = (match.liveState as any)?.winnerTeam;

    if (liveWinner === 'teamA') {
      winner = 'A';
    } else if (liveWinner === 'teamB') {
      winner = 'B';
    } else if (liveWinner === 'draw' || liveWinner === 'tie') {
      winner = 'draw';
    } else {
      // Fallback to score
      if (scoreA > scoreB) winner = 'A';
      else if (scoreB > scoreA) winner = 'B';
      else winner = 'draw';
    }

    // Points awarding
    if (winner === 'A') {
      entityA.wins += 1;
      entityB.losses += 1;
      entityA.points += isFootball ? 3 : 2;
    } else if (winner === 'B') {
      entityB.wins += 1;
      entityA.losses += 1;
      entityB.points += isFootball ? 3 : 2;
    } else {
      entityA.draws += 1;
      entityB.draws += 1;
      entityA.points += 1;
      entityB.points += 1;
    }
  }

  // Convert to sorted rows
  const rows: StandingsRow[] = Array.from(entityMap.values()).map((e) => {
    const gd = e.goalsFor - e.goalsAgainst;
    return {
      position: 1,
      entityId: e.entityId,
      entityName: e.entityName,
      logo: e.logo,
      entityType: e.entityType,
      sportId,
      played: e.played,
      wins: e.wins,
      draws: e.draws,
      losses: e.losses,
      points: e.points,
      goalsFor: e.goalsFor,
      goalsAgainst: e.goalsAgainst,
      goalDifference: gd,
      setsWon: e.setsWon,
      setsLost: e.setsLost,
      stats: {
        points: e.points,
        goalsFor: e.goalsFor,
        goalsAgainst: e.goalsAgainst,
        goalDifference: gd,
        setsWon: e.setsWon,
        setsLost: e.setsLost,
      },
    };
  });

  // Sort by Points DESC -> Goal Difference DESC -> Wins DESC -> Goals For DESC
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalDifference || 0;
    const gdB = b.goalDifference || 0;
    if (gdB !== gdA) return gdB - gdA;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.goalsFor || 0) - (a.goalsFor || 0);
  });

  // Assign position ranks
  rows.forEach((r, idx) => {
    r.position = idx + 1;
  });

  return rows;
};

/**
 * Regenerates and publishes sport standings into leaderboards/{sportId}
 */
export const syncSportLeaderboardToFirestore = async (
  sportId: string,
  sportName: string,
  category: 'team' | 'individual' = 'team'
): Promise<LeaderboardEntry[]> => {
  if (!db) throw new Error('Firestore not initialized');

  const rows = await calculateSportStandings(sportId, category === 'individual');

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
    stats: r.stats,
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
    },
    { merge: true }
  );

  return entries;
};
