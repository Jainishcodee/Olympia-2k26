import { Match } from '@/types';
import { getTeamLogo } from './teamLogos';

export interface ScoringRules {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
}

export interface StandingsEntry {
  position: number;
  entityId: string;
  entityName: string;
  logo: string;
  shortName: string;
  entityType: 'team' | 'player';
  sportId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  setsWon: number;
  setsLost: number;
  roundsWon: number;
  roundsLost: number;
  runs: number;
  wickets: number;
  netRunRate: string;
  stats: Record<string, unknown>;
}

/**
 * Returns configurable scoring rules for a sport.
 * Prefers explicitly provided configuration, falls back to canonical sport standard.
 */
export function resolveScoringRules(
  sportId: string,
  configured?: { winPoints?: number; drawPoints?: number; lossPoints?: number } | null
): ScoringRules {
  if (
    configured &&
    typeof configured.winPoints === 'number' &&
    typeof configured.drawPoints === 'number' &&
    typeof configured.lossPoints === 'number'
  ) {
    return {
      winPoints: configured.winPoints,
      drawPoints: configured.drawPoints,
      lossPoints: configured.lossPoints,
    };
  }

  const s = (sportId || '').toLowerCase();
  if (s.includes('football') || s.includes('soccer')) {
    return { winPoints: 3, drawPoints: 1, lossPoints: 0 };
  }
  if (s.includes('chess')) {
    return { winPoints: 1, drawPoints: 0.5, lossPoints: 0 };
  }
  // Cricket, Volleyball, Hand Tennis, LAN, Smash Karts, Racquet, Carrom:
  return { winPoints: 2, drawPoints: 1, lossPoints: 0 };
}

export interface RegisteredEntity {
  id: string;
  name: string;
  logo?: string;
  photo?: string;
  shortName?: string;
}

/**
 * Derives authoritative standings from actual completed matches.
 * - Freezes historical match participants and scores.
 * - Populates registered participants that haven't played yet with 0 stats.
 * - Applies configurable tournament scoring rules.
 */
export function deriveStandingsFromCompletedMatches(
  sportId: string,
  completedMatches: Match[],
  registeredEntities: RegisteredEntity[] = [],
  isIndividual: boolean = false,
  rulesConfig?: { winPoints?: number; drawPoints?: number; lossPoints?: number } | null
): StandingsEntry[] {
  const rules = resolveScoringRules(sportId, rulesConfig);
  const sLower = (sportId || '').toLowerCase();
  const isFootball = sLower.includes('football') || sLower.includes('soccer');
  const isCricket = sLower.includes('cricket');
  const isVolleyball = sLower.includes('volleyball');
  const isRacquet = sLower.includes('badminton') || sLower.includes('table-tennis') || sLower.includes('table_tennis');
  const isCombatOrFps = sLower.includes('strike') || sLower.includes('cs') || sLower.includes('lan');
  const isChess = sLower.includes('chess');

  // Accumulator map: entityId -> Stats
  const map = new Map<string, StandingsEntry>();

  // Initialize with registered participants so all active competitors appear in standings table
  for (const reg of registeredEntities) {
    if (!reg.id) continue;
    const entityName = reg.name || reg.id || 'Competitor';
    const logoUrl = reg.photo || reg.logo || getTeamLogo(entityName) || getTeamLogo(reg.id) || '';
    map.set(reg.id, {
      position: 1,
      entityId: reg.id,
      entityName,
      logo: logoUrl,
      shortName: reg.shortName || String(entityName).slice(0, 4).toUpperCase(),
      entityType: isIndividual ? 'player' : 'team',
      sportId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      setsWon: 0,
      setsLost: 0,
      roundsWon: 0,
      roundsLost: 0,
      runs: 0,
      wickets: 0,
      netRunRate: '+0.000',
      stats: {},
    });
  }

  // Filter matches strictly for this sport discipline
  const sportMatches = completedMatches.filter((m) => {
    if (m.status !== 'completed') return false;
    const mSport = (m.sportId || '').toLowerCase();
    if (sLower === 'lan-games' || sLower === 'counter-strike') {
      return mSport.includes('strike') || mSport.includes('cs') || mSport.includes('lan');
    }
    return mSport === sLower || mSport.includes(sLower) || sLower.includes(mSport);
  });

  // Track cricket innings details for NRR calculation
  const cricketRunsFor = new Map<string, number>();
  const cricketOversFor = new Map<string, number>();
  const cricketRunsAgainst = new Map<string, number>();
  const cricketOversAgainst = new Map<string, number>();

  for (const match of sportMatches) {
    const idA = match.teamAId || match.participantA?.id || 'teamA';
    const idB = match.teamBId || match.participantB?.id || 'teamB';
    const nameA = String(match.participantA?.name || idA);
    const nameB = String(match.participantB?.name || idB);
    const logoA = (match.participantA as any)?.photo || match.participantA?.logo || getTeamLogo(nameA) || getTeamLogo(idA) || '';
    const logoB = (match.participantB as any)?.photo || match.participantB?.logo || getTeamLogo(nameB) || getTeamLogo(idB) || '';

    if (!map.has(idA)) {
      map.set(idA, {
        position: 1,
        entityId: idA,
        entityName: nameA,
        logo: logoA,
        shortName: (match.participantA as any)?.shortName || nameA.slice(0, 4).toUpperCase(),
        entityType: isIndividual ? 'player' : 'team',
        sportId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        setsWon: 0,
        setsLost: 0,
        roundsWon: 0,
        roundsLost: 0,
        runs: 0,
        wickets: 0,
        netRunRate: '+0.000',
        stats: {},
      });
    }

    if (!map.has(idB)) {
      map.set(idB, {
        position: 1,
        entityId: idB,
        entityName: nameB,
        logo: logoB,
        shortName: (match.participantB as any)?.shortName || nameB.slice(0, 4).toUpperCase(),
        entityType: isIndividual ? 'player' : 'team',
        sportId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        setsWon: 0,
        setsLost: 0,
        roundsWon: 0,
        roundsLost: 0,
        runs: 0,
        wickets: 0,
        netRunRate: '+0.000',
        stats: {},
      });
    }

    const rowA = map.get(idA)!;
    const rowB = map.get(idB)!;

    rowA.played += 1;
    rowB.played += 1;

    const scoreA = Number(match.score?.teamA ?? 0);
    const scoreB = Number(match.score?.teamB ?? 0);

    // Goal / Run / Point tracking
    rowA.goalsFor += scoreA;
    rowA.goalsAgainst += scoreB;
    rowB.goalsFor += scoreB;
    rowB.goalsAgainst += scoreA;

    if (isCricket) {
      rowA.runs += scoreA;
      rowB.runs += scoreB;
      const wA = Number((match.liveState as any)?.firstInnings?.wickets ?? (match.liveState as any)?.wickets ?? 0);
      const wB = Number((match.liveState as any)?.secondInnings?.wickets ?? (match.liveState as any)?.wickets ?? 0);
      rowA.wickets += wA;
      rowB.wickets += wB;

      // Simple NRR accumulator
      const ovA = Math.max(1, Number((match.liveState as any)?.overs ?? 20));
      const ovB = Math.max(1, Number((match.liveState as any)?.firstInnings?.overs ?? (match.liveState as any)?.overs ?? 20));
      cricketRunsFor.set(idA, (cricketRunsFor.get(idA) || 0) + scoreA);
      cricketOversFor.set(idA, (cricketOversFor.get(idA) || 0) + ovA);
      cricketRunsAgainst.set(idA, (cricketRunsAgainst.get(idA) || 0) + scoreB);
      cricketOversAgainst.set(idA, (cricketOversAgainst.get(idA) || 0) + ovB);

      cricketRunsFor.set(idB, (cricketRunsFor.get(idB) || 0) + scoreB);
      cricketOversFor.set(idB, (cricketOversFor.get(idB) || 0) + ovB);
      cricketRunsAgainst.set(idB, (cricketRunsAgainst.get(idB) || 0) + scoreA);
      cricketOversAgainst.set(idB, (cricketOversAgainst.get(idB) || 0) + ovA);
    }

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
      rowA.setsWon += setsA;
      rowA.setsLost += setsB;
      rowB.setsWon += setsB;
      rowB.setsLost += setsA;
    }

    if (isCombatOrFps) {
      rowA.roundsWon += scoreA;
      rowA.roundsLost += scoreB;
      rowB.roundsWon += scoreB;
      rowB.roundsLost += scoreA;
    }

    // Determine match result
    let outcome: 'A' | 'B' | 'draw' = 'draw';
    const liveWinner = (match.liveState as any)?.winnerTeam;
    if (liveWinner === 'teamA') {
      outcome = 'A';
    } else if (liveWinner === 'teamB') {
      outcome = 'B';
    } else if (liveWinner === 'draw' || liveWinner === 'tie') {
      outcome = 'draw';
    } else {
      if (scoreA > scoreB) outcome = 'A';
      else if (scoreB > scoreA) outcome = 'B';
      else outcome = 'draw';
    }

    if (outcome === 'A') {
      rowA.wins += 1;
      rowB.losses += 1;
      rowA.points += rules.winPoints;
      rowB.points += rules.lossPoints;
    } else if (outcome === 'B') {
      rowB.wins += 1;
      rowA.losses += 1;
      rowB.points += rules.winPoints;
      rowA.points += rules.lossPoints;
    } else {
      rowA.draws += 1;
      rowB.draws += 1;
      rowA.points += rules.drawPoints;
      rowB.points += rules.drawPoints;
    }
  }

  // Calculate Net Run Rates for cricket
  if (isCricket) {
    for (const [id, row] of map.entries()) {
      const rf = cricketRunsFor.get(id) || 0;
      const of = cricketOversFor.get(id) || 0;
      const ra = cricketRunsAgainst.get(id) || 0;
      const oa = cricketOversAgainst.get(id) || 0;
      const rrFor = of > 0 ? rf / of : 0;
      const rrAgainst = oa > 0 ? ra / oa : 0;
      const diff = rrFor - rrAgainst;
      row.netRunRate = (diff >= 0 ? '+' : '') + diff.toFixed(3);
    }
  }

  // Finalize GD and pack stats
  const list = Array.from(map.values()).map((row) => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.stats = {
      points: row.points,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      setsWon: row.setsWon,
      setsLost: row.setsLost,
      roundsWon: row.roundsWon,
      roundsLost: row.roundsLost,
      netRunRate: row.netRunRate,
      runs: row.runs,
      wickets: row.wickets,
    };
    return row;
  });

  // Sort standings: Points DESC -> Differential DESC -> Wins DESC -> Goals For DESC
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (isCricket) {
      const nrrA = parseFloat(a.netRunRate) || 0;
      const nrrB = parseFloat(b.netRunRate) || 0;
      if (nrrB !== nrrA) return nrrB - nrrA;
    } else if (isVolleyball || isRacquet) {
      const setDiffA = a.setsWon - a.setsLost;
      const setDiffB = b.setsWon - b.setsLost;
      if (setDiffB !== setDiffA) return setDiffB - setDiffA;
    } else {
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    }
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.goalsFor - a.goalsFor;
  });

  // Assign position ranks
  list.forEach((entry, idx) => {
    entry.position = idx + 1;
  });

  return list;
}
