import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  limit,
  writeBatch,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { EventType, Match, MatchEvent, MatchStatus, Score, SportPositioning } from '@/types';
import { syncSportLeaderboardToFirestore } from '@/services/standings/standingsService';
import { cleanFirestoreData } from '@/utils/firestore';

/* ============================================================================
 *  Sport-Specific Positioning Formatter
 * ==========================================================================*/

export const formatSportPositioning = (
  sportId: string,
  pos?: SportPositioning,
  clock?: string
): string => {
  if (!pos) return clock || 'LIVE';
  const s = (sportId || '').toLowerCase();
  const p = pos as Record<string, any>;

  if (s.includes('cricket')) {
    const inn = p.innings ? `Inn ${p.innings} · ` : '';
    const ov = p.over !== undefined && p.ball !== undefined ? `Over ${p.over}.${p.ball}` : '';
    return `${inn}${ov}` || 'Cricket';
  }

  if (s.includes('football') || s.includes('soccer')) {
    if (p.isShootout || p.period === 'shootout' || p.period === 3 || p.shootout || p.penaltyRound !== undefined || p.penaltyKickNumber !== undefined) {
      const kick = p.penaltyKickNumber !== undefined ? `Kick ${p.penaltyKickNumber}` : p.penaltyRound !== undefined ? `R${p.penaltyRound}` : '';
      return ['PEN', kick].filter(Boolean).join(' · ') || 'PEN Shootout';
    }
    const period = p.period === 1 ? '1H' : p.period === 2 ? '2H' : p.period ? `P${p.period}` : '';
    let time = clock || (p.matchSecond !== undefined ? `${Math.floor(p.matchSecond / 60)}'` : '');
    if (p.addedTime !== undefined && p.addedTime > 0) {
      const baseMin = p.period === 1 ? 45 : 90;
      time = `${baseMin}+${p.addedTime}'`;
    }
    return [period, time].filter(Boolean).join(' ') || 'Match play';
  }

  if (s.includes('volleyball') || s.includes('tennis')) {
    const set = p.set !== undefined ? `Set ${p.set}` : '';
    const rally = p.rally !== undefined ? `Rally ${p.rally}` : '';
    return [set, rally].filter(Boolean).join(' · ') || 'Set play';
  }

  if (s.includes('badminton') || s.includes('table-tennis') || s.includes('table_tennis')) {
    const game = p.game !== undefined ? `Game ${p.game}` : p.set !== undefined ? `Game ${p.set}` : '';
    const rally = p.rally !== undefined ? `Rally ${p.rally}` : '';
    return [game, rally].filter(Boolean).join(' · ') || 'Game play';
  }

  if (s.includes('strike') || s.includes('cs') || s.includes('lan')) {
    const map = p.map !== undefined ? `Map ${p.map}` : '';
    const round = p.round !== undefined ? `Round ${p.round}` : '';
    return [map, round].filter(Boolean).join(' · ') || 'Round play';
  }

  if (s.includes('carrom') || s.includes('racing')) {
    const board = p.board !== undefined ? `Board ${p.board}` : '';
    const lap = p.lap !== undefined ? `Lap ${p.lap}` : '';
    return board || lap || 'Board play';
  }

  if (s.includes('chess')) {
    const move = p.move !== undefined ? `Move ${p.move}` : '';
    return move || 'Move play';
  }

  if (s.includes('smash') || s.includes('kart')) {
    return 'Arena Battle';
  }

  if (p.lap !== undefined) {
    return `Lap ${p.lap}`;
  }

  return clock || 'LIVE';
};

/* ============================================================================
 *  Event-Sourced Event Input Types
 * ==========================================================================*/

export interface ScoreDelta {
  teamA?: number;
  teamB?: number;
  runs?: number;
  wickets?: number;
  balls?: number;
  overs?: number;
  extras?: number;
  points?: number;
  details?: Record<string, unknown>;
}

export interface RecordEventInput {
  matchId: string;
  sportId: string;
  type: EventType;
  team?: 'teamA' | 'teamB' | '';
  teamName?: string;
  playerId?: string;
  playerName?: string;
  description: string;
  matchTime?: string;
  positioning?: SportPositioning;
  data?: Record<string, unknown>;
  /** Optional absolute score fallback if no delta or derivation applies */
  newScore?: Record<string, unknown>;
  /** Relative change to apply against the fresh snapshot inside the transaction */
  scoreDelta?: ScoreDelta;
  /** Custom state derivation callback executed inside the transaction */
  deriveState?: (currentMatch: Match) => {
    score: Record<string, unknown>;
    liveState?: Record<string, unknown>;
  };
  newLiveState?: Record<string, unknown>;
  newStatus?: MatchStatus;
  createdBy?: string;
}

export interface CorrectEventInput {
  matchId: string;
  sportId: string;
  originalEventId: string;
  correctionNote: string;
  newType: EventType;
  newDescription: string;
  team?: 'teamA' | 'teamB' | '';
  teamName?: string;
  correctedScore: Record<string, unknown>;
  correctedLiveState?: Record<string, unknown>;
  positioning?: SportPositioning;
  correctedBy?: string;
}

/**
 * Automatically infers a score delta for canonical event types when scoreDelta is omitted.
 */
export const inferScoreDelta = (
  type: EventType,
  team?: 'teamA' | 'teamB' | '',
  data?: Record<string, unknown>
): ScoreDelta | null => {
  const t = (type || '').toLowerCase();
  const isA = team === 'teamA';
  const isB = team === 'teamB' || data?.team === 'teamB';
  const teamKey = isB ? 'teamB' : 'teamA';

  if (t === 'goal') {
    if (isA) return { teamA: 1 };
    if (isB) return { teamB: 1 };
  }
  if (t === 'goal_removed') {
    if (isA) return { teamA: -1 };
    if (isB) return { teamB: -1 };
  }
  // Net / Racquet / Combat / Board Points
  if (t === 'point' || t === 'carrom_coin' || t === 'coin') {
    const pts = Number(data?.points ?? 1);
    if (isA) return { teamA: pts };
    if (isB) return { teamB: pts };
  }
  if (t === 'queen' || t === 'queen_pocketed') {
    const pts = Number(data?.points ?? 3);
    if (isA) return { teamA: pts };
    if (isB) return { teamB: pts };
  }
  if (t === 'point_removed') {
    const pts = Number(data?.points ?? 1);
    if (isA) return { teamA: -pts };
    if (isB) return { teamB: -pts };
  }

  // Cricket
  if (t === 'four') return { [teamKey]: 4, runs: 4, balls: 1 };
  if (t === 'six') return { [teamKey]: 6, runs: 6, balls: 1 };
  if (t === 'ten') return { [teamKey]: 10, runs: 10, balls: 1 };
  if (t === 'single') return { [teamKey]: 1, runs: 1, balls: 1 };
  if (t === 'double') return { [teamKey]: 2, runs: 2, balls: 1 };
  if (t === 'triple') return { [teamKey]: 3, runs: 3, balls: 1 };
  if (t === 'run' || t === 'ball') {
    const runs = Number(data?.runs ?? 1);
    const isLegal = data?.legalBall !== false;
    return { [teamKey]: runs, runs, balls: isLegal ? 1 : 0 };
  }
  if (t === 'dot') return { balls: 1, runs: 0 };
  if (t === 'wicket') {
    const runs = Number(data?.runs ?? 0);
    return { [teamKey]: runs, wickets: 1, balls: 1, runs };
  }
  if (t === 'wide') {
    const runs = Number(data?.runs ?? 1);
    return { [teamKey]: runs, runs, extras: runs, balls: 0 };
  }
  if (t === 'no_ball') {
    const runs = Number(data?.runs ?? 1);
    return { [teamKey]: runs, runs, extras: 1, balls: 0 };
  }
  if (t === 'bye' || t === 'leg_bye') {
    const runs = Number(data?.runs ?? 1);
    return { [teamKey]: runs, runs, extras: runs, balls: 1 };
  }

  // Counter-Strike / Sets / Games
  if (t === 'round_win' || t === 'round_won' || t === 'set_won' || t === 'set_completed' || t === 'game_won' || t === 'map_won') {
    if (isA) return { teamA: 1 };
    if (isB) return { teamB: 1 };
    return { details: {} };
  }
  if (t === 'round_removed') {
    if (isA) return { teamA: -1 };
    if (isB) return { teamB: -1 };
  }

  // Chess Results
  if (t === 'chess_result') {
    const res = data?.result;
    if (res === '1-0' || isA) return { teamA: 1, teamB: 0 };
    if (res === '0-1' || isB) return { teamA: 0, teamB: 1 };
    return { teamA: 0.5, teamB: 0.5 };
  }
  return null;
};

/* ============================================================================
 *  Core Event Sourcing Operations
 * ==========================================================================*/

/**
 * Records a single scoring / timeline event and atomicity synchronizes the match state.
 * Emits monotonic sequence, positioning telemetry, state snapshot, and updates `matches/{id}`.
 * Evaluates state derivation / delta against the FRESH transaction snapshot to prevent lost updates on retry.
 */
export const recordMatchEvent = async (input: RecordEventInput): Promise<{ eventId: string; sequence: number }> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const firestore = db;

  const result = await runTransaction(firestore, async (transaction) => {
    const matchRef = doc(firestore, 'matches', input.matchId);
    const matchSnap = await transaction.get(matchRef);
    if (!matchSnap.exists()) {
      throw new Error(`Match ${input.matchId} not found`);
    }
    const matchData = matchSnap.data() as Match;

    // Validate match status allows scoring actions
    const isTerminalStatus = matchData?.status === 'completed' || matchData?.status === 'cancelled';
    const isLifecycleAction =
      input.type === 'match_start' ||
      input.type === 'TOSS_DECIDED' ||
      input.type === 'match_pause' ||
      input.type === 'match_resume' ||
      input.type === 'half_time' ||
      input.type === 'second_half' ||
      input.type === 'penalty_shootout_start' ||
      input.type === 'penalty_shootout_end' ||
      input.type === 'innings_start' ||
      input.type === 'innings_end' ||
      input.type === 'innings_completed' ||
      input.type === 'over_completed' ||
      input.type === 'drinks_break' ||
      input.type === 'set_started' ||
      input.type === 'set_completed' ||
      input.type === 'game_started' ||
      input.type === 'game_won' ||
      input.type === 'round_win' ||
      input.type === 'board_completed' ||
      input.type === 'lap_complete' ||
      input.type === 'chess_result' ||
      input.type === 'chess_move' ||
      input.type === 'match_end' ||
      input.type === 'full_time';

    const allowTerminalWrite =
      Boolean(input.data?.isPrivilegedCorrection) ||
      Boolean(input.data?.allowPostMatch) ||
      Boolean(input.data?.postMatchEntry);
    if (isTerminalStatus && !allowTerminalWrite && !isLifecycleAction) {
      throw new Error(`Cannot record scoring events on a ${matchData?.status} match without admin override`);
    }

    const currentSequence = Number(matchData?.lastSequence || 0);
    const nextSequence = currentSequence + 1;

    const currentScore = (matchData?.score || { teamA: 0, teamB: 0, details: {} }) as unknown as Record<string, unknown>;
    const currentLiveState = (matchData?.liveState || {}) as unknown as Record<string, unknown>;
    const sId = (input.sportId || '').toLowerCase();
    const isCricket = sId.includes('cricket');
    const isVolleyball = sId.includes('volleyball');
    const isBadminton = sId.includes('badminton');
    const isTableTennis = sId.includes('table-tennis') || sId.includes('table_tennis');
    const isChess = sId.includes('chess');
    const isCarrom = sId.includes('carrom');
    const isCounterStrike = sId.includes('counter') || sId.includes('cs') || sId.includes('strike');
    const isSmashKarts = sId.includes('smash') || sId.includes('kart');
    const isSetBasedSport = isVolleyball || isBadminton || isTableTennis;

    // Derive score and liveState against the FRESH transaction snapshot
    let computedScore: Record<string, unknown>;
    let computedLiveState: Record<string, unknown> = {
      ...currentLiveState,
      ...(input.newLiveState || {}),
    };

    // Automatic lifecycle mappings for periods, cricket innings, and multi-sport sets/rounds
    if (input.type === 'TOSS_DECIDED' && isCricket) {
      const tossWinner = input.data?.tossWinner as 'teamA' | 'teamB';
      const decision = input.data?.decision as 'BAT' | 'BOWL';
      const tossWinnerId = String(input.data?.tossWinnerId || (tossWinner === 'teamA' ? matchData.teamAId : matchData.teamBId));
      const tossWinnerName = String(input.data?.tossWinnerName || (tossWinner === 'teamA' ? matchData.participantA?.name : matchData.participantB?.name) || 'Team');
      const battingTeam = decision === 'BAT' ? tossWinner : tossWinner === 'teamA' ? 'teamB' : 'teamA';
      const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
      computedLiveState.tossWinner = tossWinner;
      computedLiveState.tossWinnerId = tossWinnerId;
      computedLiveState.tossWinnerName = tossWinnerName;
      computedLiveState.tossDecision = decision;
      computedLiveState.battingTeam = battingTeam;
      computedLiveState.battingTeamId = battingTeam === 'teamA' ? matchData.teamAId : matchData.teamBId;
      computedLiveState.bowlingTeamId = bowlingTeam === 'teamA' ? matchData.teamAId : matchData.teamBId;
    } else if (input.type === 'match_start') {
      if (isCricket) {
        computedLiveState.innings = 1;
        const configuredBattingTeam = currentLiveState.battingTeam === 'teamB' ? 'teamB' : currentLiveState.battingTeam === 'teamA' ? 'teamA' : input.team === 'teamB' ? 'teamB' : 'teamA';
        computedLiveState.battingTeam = configuredBattingTeam;
        computedLiveState.battingTeamId = configuredBattingTeam === 'teamA' ? matchData.teamAId : matchData.teamBId;
        computedLiveState.bowlingTeamId = configuredBattingTeam === 'teamA' ? matchData.teamBId : matchData.teamAId;
        computedLiveState.over = 0;
        computedLiveState.overs = 0;
        computedLiveState.ball = 0;
        computedLiveState.legalBalls = 0;
        computedLiveState.wickets = 0;
        computedLiveState.totalRuns = 0;
        computedLiveState.extras = 0;
        computedLiveState.inningsStatus = 'in_progress';
        const customMaxOvers = Number(
          input.data?.maxOvers ??
          input.data?.oversQuota ??
          currentLiveState.maxOvers ??
          matchData?.liveState?.maxOvers ??
          (matchData as any)?.maxOvers ??
          20
        );
        computedLiveState.maxOvers = customMaxOvers;
        computedLiveState.ballsRemaining = customMaxOvers * 6;
      } else if (isSetBasedSport) {
        const defaultTarget = isBadminton ? 21 : isTableTennis ? 11 : 25;
        const bestOf = Number(input.data?.bestOf ?? currentLiveState.bestOf ?? matchData?.liveState?.bestOf ?? 3);
        const setsReq = Number(input.data?.setsRequiredToWin ?? currentLiveState.setsRequiredToWin ?? matchData?.liveState?.setsRequiredToWin ?? Math.ceil(bestOf / 2));
        computedLiveState.bestOf = bestOf;
        computedLiveState.setsRequiredToWin = setsReq;
        computedLiveState.currentSet = 1;
        computedLiveState.game = 1;
        computedLiveState.currentSetScore = { teamA: 0, teamB: 0 };
        computedLiveState.setsWon = { teamA: 0, teamB: 0 };
        computedLiveState.gamesWon = { teamA: 0, teamB: 0 };
        computedLiveState.targetPoints = Number(input.data?.targetPoints ?? defaultTarget);
        computedLiveState.winByTwo = true;
        computedLiveState.setStatus = 'in_progress';
        computedLiveState.completedSets = [];
      } else if (isCounterStrike) {
        computedLiveState.round = 1;
        computedLiveState.roundsRequiredToWin = Number(input.data?.roundsRequiredToWin ?? 13);
        computedLiveState.maxRounds = 24;
      } else if (isCarrom) {
        computedLiveState.board = 1;
        computedLiveState.targetPoints = Number(input.data?.targetPoints ?? 25);
      } else if (isSmashKarts) {
        computedLiveState.mode = 'Team Battle';
        computedLiveState.targetPoints = Number(input.data?.targetPoints ?? input.data?.targetKills ?? 20);
        computedLiveState.playerKills = {};
      } else if (isChess) {
        computedLiveState.move = 1;
      } else {
        computedLiveState.period = 1;
        computedLiveState.isHalfTime = false;
      }
    } else if (input.type === 'set_started' && isSetBasedSport) {
      const setNum = Number(input.data?.set ?? input.positioning?.set ?? (Number(currentLiveState.currentSet || 1)));
      const bestOf = Number(computedLiveState.bestOf ?? currentLiveState.bestOf ?? 3);
      const isDeciding = setNum >= bestOf;
      const defaultTarget = isBadminton ? 21 : isTableTennis ? 11 : 25;
      const targetPts = Number(input.data?.targetPoints ?? (isDeciding ? (computedLiveState.decidingSetTarget ?? (isVolleyball ? 15 : defaultTarget)) : defaultTarget));
      computedLiveState.currentSet = setNum;
      computedLiveState.game = setNum;
      computedLiveState.targetPoints = targetPts;
      computedLiveState.setStatus = 'in_progress';
      computedLiveState.currentSetScore = { teamA: 0, teamB: 0 };
    } else if (input.type === 'half_time') {
      computedLiveState.period = 1;
      computedLiveState.isHalfTime = true;
    } else if (input.type === 'second_half') {
      computedLiveState.period = 2;
      computedLiveState.isHalfTime = false;
    } else if (input.type === 'penalty_shootout_start') {
      computedLiveState.period = 'shootout';
      computedLiveState.isShootout = true;
      computedLiveState.isHalfTime = false;
      const initialPenalties = {
        teamA: 0,
        teamB: 0,
        round: 1,
        currentTeam: 'teamA',
        kicks: [],
      };
      computedLiveState.penalties = initialPenalties;
    } else if (input.type === 'penalty_scored' || input.type === 'penalty_missed') {
      computedLiveState.period = 'shootout';
      computedLiveState.isShootout = true;
      computedLiveState.isHalfTime = false;
      const curPenalties = (computedLiveState.penalties || (currentScore.details as any)?.penalties || {
        teamA: 0,
        teamB: 0,
        round: 1,
        currentTeam: 'teamA',
        kicks: [],
      }) as Record<string, any>;
      const isScored = input.type === 'penalty_scored';
      const kickTeam: 'teamA' | 'teamB' = input.team === 'teamB' ? 'teamB' : 'teamA';
      const newTeamPens = isScored ? Number(curPenalties[kickTeam] || 0) + 1 : Number(curPenalties[kickTeam] || 0);
      const existingKicks = Array.isArray(curPenalties.kicks) ? [...curPenalties.kicks] : [];
      const kickNumber = existingKicks.length + 1;
      const roundNumber = Math.ceil(kickNumber / 2);
      const kickRecord = {
        id: `pen-${kickNumber}`,
        kickNumber,
        round: roundNumber,
        team: kickTeam,
        playerName: input.playerName || (input.data as any)?.playerName || '',
        scored: isScored,
        timestamp: Date.now(),
      };
      const updatedKicks = [...existingKicks, kickRecord];
      const nextTeam = kickTeam === 'teamA' ? 'teamB' : 'teamA';
      const nextRound = nextTeam === 'teamA' ? roundNumber + 1 : roundNumber;

      computedLiveState.penalties = {
        ...curPenalties,
        [kickTeam]: newTeamPens,
        round: nextRound,
        currentTeam: nextTeam,
        kicks: updatedKicks,
      };
    } else if (input.type === 'penalty_shootout_end') {
      computedLiveState.isShootout = false;
      const curPens = (computedLiveState.penalties || (currentScore.details as any)?.penalties || { teamA: 0, teamB: 0 }) as Record<string, any>;
      const penA = Number(curPens.teamA || 0);
      const penB = Number(curPens.teamB || 0);
      const winner = input.team === 'teamA' || penA > penB ? 'teamA' : input.team === 'teamB' || penB > penA ? 'teamB' : undefined;
      if (winner) {
        computedLiveState.winnerTeam = winner;
        computedLiveState.winnerTeamId = winner === 'teamA' ? matchData.teamAId : matchData.teamBId;
        const winnerLabel = winner === 'teamA' ? (matchData.participantA?.name || 'Team A') : (matchData.participantB?.name || 'Team B');
        computedLiveState.resultText = `${winnerLabel} won ${penA}–${penB} on penalties (FT ${currentScore.teamA}–${currentScore.teamB})`;
      } else {
        computedLiveState.resultText = `Penalties tied (${penA}–${penB}) [FT ${currentScore.teamA}–${currentScore.teamB}]`;
      }
      computedLiveState.matchStatus = 'completed';
    } else if (input.type === 'innings_start') {
      const innNum = Number(input.data?.innings ?? input.positioning?.innings ?? (Number(currentLiveState.innings || 1) + 1));
      computedLiveState.innings = innNum;
      computedLiveState.inningsStatus = 'in_progress';
      if (innNum === 2) {
        computedLiveState.battingTeam = currentLiveState.battingTeam === 'teamB' ? 'teamA' : 'teamB';
      } else {
        computedLiveState.battingTeam = input.team === 'teamB' ? 'teamB' : 'teamA';
      }
      computedLiveState.battingTeamId = computedLiveState.battingTeam === 'teamA' ? matchData.teamAId : matchData.teamBId;
      computedLiveState.bowlingTeamId = computedLiveState.battingTeam === 'teamA' ? matchData.teamBId : matchData.teamAId;
      computedLiveState.over = 0;
      computedLiveState.overs = 0;
      computedLiveState.ball = 0;
      computedLiveState.legalBalls = 0;
      computedLiveState.wickets = 0;
      computedLiveState.totalRuns = 0;
      computedLiveState.extras = 0;
      computedLiveState.extrasDetail = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
      const configuredMaxOvers = Number(
        input.data?.maxOvers ??
        currentLiveState.maxOvers ??
        matchData?.liveState?.maxOvers ??
        (matchData as any)?.maxOvers ??
        20
      );
      computedLiveState.maxOvers = configuredMaxOvers;
      computedLiveState.ballsRemaining = configuredMaxOvers * 6;
    } else if (input.type === 'innings_end' || input.type === 'innings_completed') {
      computedLiveState.inningsStatus = 'completed';
      if (!computedLiveState.firstInnings) {
        const inn1Team = (currentLiveState.battingTeam || 'teamA') as 'teamA' | 'teamB';
        const inn1Runs = Number(currentScore[inn1Team] ?? (currentScore.details as any)?.runs ?? 0);
        const inn1Wickets = Number(currentLiveState.wickets ?? 0);
        const inn1Overs = Number(currentLiveState.overs || currentLiveState.over || (currentScore.details as any)?.overs || 0);
        const inn1Balls = Number(currentLiveState.ball ?? 0);
        computedLiveState.firstInnings = {
          team: inn1Team,
          runs: inn1Runs,
          wickets: inn1Wickets,
          overs: inn1Overs,
          balls: inn1Balls,
        };
        computedLiveState.targetRuns = inn1Runs + 1;
        computedLiveState.requiredRuns = inn1Runs + 1;
      }
    } else if (input.type === 'over_completed') {
      computedLiveState.ball = 0;
      computedLiveState.legalBalls = 0;
    } else if (input.type === 'board_completed' && isCarrom) {
      computedLiveState.board = Number(computedLiveState.board || 1) + 1;
    } else if (input.type === 'chess_move' && isChess) {
      computedLiveState.move = Number(computedLiveState.move || 1) + 1;
      if (input.data?.pgnMove) {
        computedLiveState.lastMove = input.data.pgnMove;
      }
    }

    if (input.deriveState) {
      const derived = input.deriveState(matchData);
      computedScore = derived.score;
      if (derived.liveState) {
        computedLiveState = { ...computedLiveState, ...derived.liveState };
      }
    } else {
      const delta = input.scoreDelta || inferScoreDelta(input.type, input.team, input.data);

      if (delta) {
        // Delta applied against FRESH snapshot!
        let deltaTeamA = Number(delta.teamA || 0);
        let deltaTeamB = Number(delta.teamB || 0);

        if (isCricket && delta.runs !== undefined) {
          const activeBatting = input.team === 'teamB'
            ? 'teamB'
            : input.team === 'teamA'
              ? 'teamA'
              : (currentLiveState.battingTeam === 'teamB' ? 'teamB' : 'teamA');
          if (activeBatting === 'teamB') {
            deltaTeamB = delta.runs;
            deltaTeamA = 0;
          } else {
            deltaTeamA = delta.runs;
            deltaTeamB = 0;
          }
        }

        let updatedTeamA = Math.max(0, Number(currentScore.teamA || 0) + deltaTeamA);
        let updatedTeamB = Math.max(0, Number(currentScore.teamB || 0) + deltaTeamB);

        const currentDetails = ((currentScore.details as Record<string, unknown>) || {});
        const updatedDetails: Record<string, unknown> = { ...currentDetails };

        if (delta.runs !== undefined) {
          let curRuns = Number(currentDetails.runs ?? 0);
          if (isCricket) {
            if (computedLiveState.totalRuns !== undefined) {
              curRuns = Number(computedLiveState.totalRuns);
            } else if (currentLiveState.totalRuns !== undefined) {
              curRuns = Number(currentLiveState.totalRuns);
            } else {
              const activeBatting = input.team === 'teamB' || currentLiveState.battingTeam === 'teamB' ? 'teamB' : 'teamA';
              curRuns = Number(currentDetails.runs ?? (activeBatting === 'teamB' ? currentScore.teamB : currentScore.teamA) ?? 0);
            }
          }
          updatedDetails.runs = Math.max(0, curRuns + delta.runs);
          if (isCricket) {
            computedLiveState.totalRuns = updatedDetails.runs;
          }
        }
        if (delta.wickets !== undefined) {
          let curWickets = Number(currentDetails.wickets ?? 0);
          if (isCricket) {
            if (computedLiveState.wickets !== undefined) {
              curWickets = Number(computedLiveState.wickets);
            } else if (currentLiveState.wickets !== undefined) {
              curWickets = Number(currentLiveState.wickets);
            }
          }
          updatedDetails.wickets = Math.max(0, curWickets + delta.wickets);
          computedLiveState.wickets = updatedDetails.wickets;
        }
        if (delta.extras !== undefined) {
          let curExtras = Number(currentDetails.extras ?? 0);
          if (isCricket) {
            if (computedLiveState.extras !== undefined) {
              curExtras = Number(computedLiveState.extras);
            } else if (currentLiveState.extras !== undefined) {
              curExtras = Number(currentLiveState.extras);
            }
          }
          updatedDetails.extras = Math.max(0, curExtras + delta.extras);
          computedLiveState.extras = updatedDetails.extras;
        }
        if (delta.balls !== undefined && delta.balls > 0) {
          let curBalls = Number(currentDetails.balls ?? 0);
          let curOvers = Number(currentDetails.overs ?? 0);
          if (isCricket) {
            if (computedLiveState.ball !== undefined) {
              curBalls = Number(computedLiveState.ball);
            } else if (currentLiveState.ball !== undefined) {
              curBalls = Number(currentLiveState.ball);
            }
            if (computedLiveState.overs !== undefined && Number(computedLiveState.overs) > 0) {
              curOvers = Number(computedLiveState.overs);
            } else if (computedLiveState.over !== undefined && Number(computedLiveState.over) > 0) {
              curOvers = Number(computedLiveState.over);
            } else if (currentLiveState.overs !== undefined && Number(currentLiveState.overs) > 0) {
              curOvers = Number(currentLiveState.overs);
            } else if (currentLiveState.over !== undefined && Number(currentLiveState.over) > 0) {
              curOvers = Number(currentLiveState.over);
            }
          }
          let nBalls = curBalls + delta.balls;
          let nOvers = curOvers;
          if (nBalls >= 6) {
            nOvers += Math.floor(nBalls / 6);
            nBalls = nBalls % 6;
          }
          updatedDetails.balls = nBalls;
          updatedDetails.overs = nOvers;
          computedLiveState.ball = nBalls;
          computedLiveState.over = nOvers;
          computedLiveState.legalBalls = nBalls;
          computedLiveState.overs = nOvers;
        }

        // Cricket Strike Rotation, Extras Detail, Player Tracking & Chase Logic
        if (isCricket) {
          // Track detailed extras breakdown
          const currentExtrasDetail = (computedLiveState.extrasDetail || {}) as Record<string, number>;
          if (input.type === 'wide') {
            computedLiveState.extrasDetail = {
              ...currentExtrasDetail,
              wides: Number(currentExtrasDetail.wides || 0) + (delta.extras || 1),
            };
          } else if (input.type === 'no_ball') {
            computedLiveState.extrasDetail = {
              ...currentExtrasDetail,
              noBalls: Number(currentExtrasDetail.noBalls || 0) + 1,
            };
          } else if (input.type === 'bye') {
            computedLiveState.extrasDetail = {
              ...currentExtrasDetail,
              byes: Number(currentExtrasDetail.byes || 0) + (delta.extras || delta.runs || 1),
            };
          } else if (input.type === 'leg_bye') {
            computedLiveState.extrasDetail = {
              ...currentExtrasDetail,
              legByes: Number(currentExtrasDetail.legByes || 0) + (delta.extras || delta.runs || 1),
            };
          }

          // Track Batsman & Bowler telemetry
          const isByeOrLegBye = input.type === 'bye' || input.type === 'leg_bye';
          const isWide = input.type === 'wide';
          const isNoBall = input.type === 'no_ball';
          const batterRuns = isByeOrLegBye || isWide ? 0 : (delta.runs ?? 0);
          const isLegalBall = delta.balls ? delta.balls > 0 : (!isWide && !isNoBall);

          if (computedLiveState.strikerName || computedLiveState.strikerId) {
            computedLiveState.strikerRuns = Number(computedLiveState.strikerRuns || 0) + batterRuns;
            if (isLegalBall) {
              computedLiveState.strikerBalls = Number(computedLiveState.strikerBalls || 0) + 1;
            }
          }

          if (computedLiveState.currentBowlerName || computedLiveState.currentBowlerId) {
            const bowlerRuns = isByeOrLegBye ? 0 : (delta.runs ?? 0);
            computedLiveState.bowlerRunsConceded = Number(computedLiveState.bowlerRunsConceded || 0) + bowlerRuns;
            if (input.type === 'wicket' && input.data?.dismissalType !== 'run_out') {
              computedLiveState.bowlerWickets = Number(computedLiveState.bowlerWickets || 0) + 1;
            }
            if (isLegalBall) {
              const curBowlerBalls = Number(computedLiveState.bowlerBalls || 0) + 1;
              computedLiveState.bowlerBalls = curBowlerBalls % 6;
              computedLiveState.bowlerOvers = Math.floor(curBowlerBalls / 6);
            }
          }

          if (input.type === 'wicket' && input.data?.newBatsman) {
            if (input.data?.outBatsman === 'nonStriker') {
              computedLiveState.nonStrikerName = String(input.data.newBatsman);
              computedLiveState.nonStrikerRuns = 0;
              computedLiveState.nonStrikerBalls = 0;
            } else {
              computedLiveState.strikerName = String(input.data.newBatsman);
              computedLiveState.strikerRuns = 0;
              computedLiveState.strikerBalls = 0;
            }
          }

          const swapStrike = () => {
            const tmpName = computedLiveState.strikerName;
            const tmpId = computedLiveState.strikerId;
            const tmpRuns = computedLiveState.strikerRuns;
            const tmpBalls = computedLiveState.strikerBalls;
            computedLiveState.strikerName = computedLiveState.nonStrikerName;
            computedLiveState.strikerId = computedLiveState.nonStrikerId;
            computedLiveState.strikerRuns = computedLiveState.nonStrikerRuns;
            computedLiveState.strikerBalls = computedLiveState.nonStrikerBalls;
            computedLiveState.nonStrikerName = tmpName;
            computedLiveState.nonStrikerId = tmpId;
            computedLiveState.nonStrikerRuns = tmpRuns;
            computedLiveState.nonStrikerBalls = tmpBalls;
          };

          if (input.data?.swapStriker === true) {
            swapStrike();
          } else if (delta.runs !== undefined) {
            if (delta.runs % 2 !== 0) {
              swapStrike();
            }
            if (delta.balls && Number(computedLiveState.ball) === 0 && Number(computedLiveState.over) > 0) {
              if (delta.runs % 2 === 0) {
                swapStrike();
              }
            }
          }

          // Target chase progression in Innings 2
          if (Number(computedLiveState.innings) === 2 && computedLiveState.targetRuns) {
            const target = Number(computedLiveState.targetRuns);
            const currentRuns = Number(computedLiveState.totalRuns ?? updatedDetails.runs ?? 0);
            const maxOvers = Number(computedLiveState.maxOvers || 20);
            const ballsBowled = Number(computedLiveState.overs || 0) * 6 + Number(computedLiveState.ball || 0);
            computedLiveState.requiredRuns = Math.max(0, target - currentRuns);
            computedLiveState.ballsRemaining = Math.max(0, maxOvers * 6 - ballsBowled);

            if (currentRuns >= target) {
              const wicketsLost = Number(computedLiveState.wickets || 0);
              const battingTeamKey = currentLiveState.battingTeam || 'teamB';
              const teamLabel = input.teamName || (battingTeamKey === 'teamB' ? 'Team B' : 'Team A');
              computedLiveState.resultText = `${teamLabel} won by ${Math.max(1, 10 - wicketsLost)} wickets`;
              computedLiveState.winnerTeam = battingTeamKey;
              computedLiveState.winnerTeamId = battingTeamKey === 'teamB' ? matchData.teamBId : matchData.teamAId;
            } else if (Number(computedLiveState.wickets) >= 10 || (computedLiveState.maxOvers && Number(computedLiveState.overs) >= Number(computedLiveState.maxOvers))) {
              const defendingTeamKey = currentLiveState.battingTeam === 'teamB' ? 'teamA' : 'teamB';
              const margin = (target - 1) - currentRuns;
              if (margin > 0) {
                const teamLabel = defendingTeamKey === 'teamA' ? 'Team A' : 'Team B';
                computedLiveState.resultText = `${teamLabel} won by ${margin} runs`;
                computedLiveState.winnerTeam = defendingTeamKey;
                computedLiveState.winnerTeamId = defendingTeamKey === 'teamA' ? matchData.teamAId : matchData.teamBId;
              } else if (margin === 0) {
                computedLiveState.resultText = 'Match tied';
                computedLiveState.winnerTeam = 'tie';
              }
            }
          }
        }

        // Multi-Sport Set/Game Progression, Win-by-Two & Match Completion (Volleyball, Badminton, Table Tennis)
        if (isSetBasedSport) {
          const defaultTarget = isBadminton ? 21 : isTableTennis ? 11 : 25;
          const bestOf = Number(computedLiveState.bestOf ?? currentLiveState.bestOf ?? 3);
          const setsRequiredToWin = Number(computedLiveState.setsRequiredToWin ?? currentLiveState.setsRequiredToWin ?? Math.ceil(bestOf / 2));
          let currentSet = Number(computedLiveState.currentSet ?? computedLiveState.game ?? currentLiveState.set ?? 1);
          const winByTwo = computedLiveState.winByTwo !== false && currentLiveState.winByTwo !== false;
          let targetPoints = Number(computedLiveState.targetPoints ?? currentLiveState.targetPoints ?? (isVolleyball && currentSet >= bestOf ? (computedLiveState.decidingSetTarget ?? 15) : defaultTarget));

          const compLive = computedLiveState as Record<string, any>;
          const curLive = currentLiveState as Record<string, any>;

          const currentSetPts = {
            teamA: Number(compLive.currentSetScore?.teamA ?? curLive.currentSetScore?.teamA ?? currentScore.teamA ?? 0),
            teamB: Number(compLive.currentSetScore?.teamB ?? curLive.currentSetScore?.teamB ?? currentScore.teamB ?? 0),
          };

          const currentSetsWon = {
            teamA: Number(compLive.setsWon?.teamA ?? curLive.setsWon?.teamA ?? (currentScore.details as any)?.setsWon?.teamA ?? 0),
            teamB: Number(compLive.setsWon?.teamB ?? curLive.setsWon?.teamB ?? (currentScore.details as any)?.setsWon?.teamB ?? 0),
          };

          const existingCompletedSets: Array<{ set: number; teamA: number; teamB: number; winner: 'teamA' | 'teamB' }> = Array.isArray(computedLiveState.completedSets)
            ? [...computedLiveState.completedSets]
            : Array.isArray(currentLiveState.completedSets)
              ? [...currentLiveState.completedSets]
              : Array.isArray((currentScore.details as any)?.sets)
                ? (currentScore.details as any).sets.filter((s: any) => s.winner)
                : [];

          if (input.type === 'point') {
            const scoringTeam: 'teamA' | 'teamB' = input.team === 'teamB' || deltaTeamB > 0 ? 'teamB' : 'teamA';
            const pts = deltaTeamB > 0 ? deltaTeamB : deltaTeamA > 0 ? deltaTeamA : Number(input.data?.points ?? 1);
            currentSetPts[scoringTeam] += pts;

            // Automatically set positioning if not provided
            if (!input.positioning || input.positioning.set === undefined) {
              input.positioning = {
                set: currentSet,
                rally: currentSetPts.teamA + currentSetPts.teamB,
              };
            }

            const myScore = currentSetPts[scoringTeam];
            const oppTeam: 'teamA' | 'teamB' = scoringTeam === 'teamA' ? 'teamB' : 'teamA';
            const oppScore = currentSetPts[oppTeam];

            const setWon = myScore >= targetPoints && (!winByTwo || (myScore - oppScore >= 2));

            if (setWon) {
              const completedSet = {
                set: currentSet,
                teamA: currentSetPts.teamA,
                teamB: currentSetPts.teamB,
                winner: scoringTeam,
              };
              const updatedCompletedSets = [...existingCompletedSets, completedSet];
              currentSetsWon[scoringTeam] += 1;

              const matchWon = currentSetsWon[scoringTeam] >= setsRequiredToWin;
              const term = isBadminton || isTableTennis ? 'Game' : 'Set';
              if (matchWon) {
                computedLiveState.setStatus = 'completed';
                computedLiveState.matchStatus = 'completed';
                computedLiveState.winnerTeam = scoringTeam;
                computedLiveState.winnerTeamId = scoringTeam === 'teamA' ? matchData.teamAId : matchData.teamBId;
                const winnerLabel = scoringTeam === 'teamA'
                  ? (matchData.participantA?.name || 'Team A')
                  : (matchData.participantB?.name || 'Team B');
                computedLiveState.resultText = `${winnerLabel} won ${currentSetsWon.teamA}–${currentSetsWon.teamB} (${term}s)`;
                computedLiveState.currentSet = currentSet;
                computedLiveState.game = currentSet;
                computedLiveState.currentSetScore = { ...currentSetPts };
                computedLiveState.setsWon = { ...currentSetsWon };
                computedLiveState.gamesWon = { ...currentSetsWon };
                computedLiveState.completedSets = updatedCompletedSets;
                computedLiveState.targetPoints = targetPoints;
                computedLiveState.winByTwo = winByTwo;

                updatedTeamA = currentSetPts.teamA;
                updatedTeamB = currentSetPts.teamB;
                updatedDetails.sets = updatedCompletedSets;
                updatedDetails.setsWon = currentSetsWon;
                updatedDetails.gamesWon = currentSetsWon;
                updatedDetails.currentSet = currentSet;
              } else {
                // Set transition to next set
                const nextSet = currentSet + 1;
                const isDeciding = nextSet >= bestOf;
                const nextTargetPoints = isDeciding ? Number(computedLiveState.decidingSetTarget ?? (isVolleyball ? 15 : defaultTarget)) : defaultTarget;

                computedLiveState.currentSet = nextSet;
                computedLiveState.game = nextSet;
                computedLiveState.currentSetScore = { teamA: 0, teamB: 0 };
                computedLiveState.setsWon = { ...currentSetsWon };
                computedLiveState.gamesWon = { ...currentSetsWon };
                computedLiveState.targetPoints = nextTargetPoints;
                computedLiveState.winByTwo = winByTwo;
                computedLiveState.setStatus = 'in_progress';
                computedLiveState.completedSets = updatedCompletedSets;

                // Points reset to 0-0 for new set
                updatedTeamA = 0;
                updatedTeamB = 0;
                updatedDetails.sets = [...updatedCompletedSets, { set: nextSet, teamA: 0, teamB: 0 }];
                updatedDetails.setsWon = currentSetsWon;
                updatedDetails.gamesWon = currentSetsWon;
                updatedDetails.currentSet = nextSet;
              }
            } else {
              // Set continues
              computedLiveState.currentSet = currentSet;
              computedLiveState.game = currentSet;
              computedLiveState.currentSetScore = { ...currentSetPts };
              computedLiveState.setsWon = { ...currentSetsWon };
              computedLiveState.gamesWon = { ...currentSetsWon };
              computedLiveState.targetPoints = targetPoints;
              computedLiveState.winByTwo = winByTwo;
              computedLiveState.setStatus = 'in_progress';
              computedLiveState.completedSets = existingCompletedSets;

              updatedTeamA = currentSetPts.teamA;
              updatedTeamB = currentSetPts.teamB;
              updatedDetails.sets = [...existingCompletedSets, { set: currentSet, teamA: currentSetPts.teamA, teamB: currentSetPts.teamB }];
              updatedDetails.setsWon = currentSetsWon;
              updatedDetails.gamesWon = currentSetsWon;
              updatedDetails.currentSet = currentSet;
            }
          } else if (input.type === 'point_removed') {
            const scoringTeam: 'teamA' | 'teamB' = input.team === 'teamB' || deltaTeamB < 0 ? 'teamB' : 'teamA';
            const pts = deltaTeamB < 0 ? Math.abs(deltaTeamB) : deltaTeamA < 0 ? Math.abs(deltaTeamA) : Number(input.data?.points ?? 1);
            currentSetPts[scoringTeam] = Math.max(0, currentSetPts[scoringTeam] - pts);

            computedLiveState.currentSet = currentSet;
            computedLiveState.currentSetScore = { ...currentSetPts };
            computedLiveState.setsWon = { ...currentSetsWon };
            computedLiveState.targetPoints = targetPoints;
            computedLiveState.winByTwo = winByTwo;
            computedLiveState.setStatus = 'in_progress';
            computedLiveState.completedSets = existingCompletedSets;

            updatedTeamA = currentSetPts.teamA;
            updatedTeamB = currentSetPts.teamB;
            updatedDetails.sets = [...existingCompletedSets, { set: currentSet, teamA: currentSetPts.teamA, teamB: currentSetPts.teamB }];
            updatedDetails.setsWon = currentSetsWon;
            updatedDetails.currentSet = currentSet;
          } else if (input.type === 'set_completed' || input.type === 'set_won') {
            const winningTeam: 'teamA' | 'teamB' = input.team === 'teamB'
              ? 'teamB'
              : input.team === 'teamA'
                ? 'teamA'
                : (currentSetPts.teamB > currentSetPts.teamA ? 'teamB' : 'teamA');

            const completedSet = {
              set: currentSet,
              teamA: currentSetPts.teamA,
              teamB: currentSetPts.teamB,
              winner: winningTeam,
            };
            const updatedCompletedSets = [...existingCompletedSets, completedSet];
            currentSetsWon[winningTeam] += 1;

            const matchWon = currentSetsWon[winningTeam] >= setsRequiredToWin;
            if (matchWon) {
              computedLiveState.setStatus = 'completed';
              computedLiveState.matchStatus = 'completed';
              computedLiveState.winnerTeam = winningTeam;
              computedLiveState.winnerTeamId = winningTeam === 'teamA' ? matchData.teamAId : matchData.teamBId;
              const winnerLabel = winningTeam === 'teamA'
                ? (matchData.participantA?.name || 'Team A')
                : (matchData.participantB?.name || 'Team B');
              computedLiveState.resultText = `${winnerLabel} won ${currentSetsWon.teamA}–${currentSetsWon.teamB}`;
              computedLiveState.currentSet = currentSet;
              computedLiveState.currentSetScore = { ...currentSetPts };
              computedLiveState.setsWon = { ...currentSetsWon };
              computedLiveState.completedSets = updatedCompletedSets;

              updatedTeamA = currentSetPts.teamA;
              updatedTeamB = currentSetPts.teamB;
              updatedDetails.sets = updatedCompletedSets;
              updatedDetails.setsWon = currentSetsWon;
              updatedDetails.currentSet = currentSet;
            } else {
              const nextSet = currentSet + 1;
              const isDeciding = nextSet >= bestOf;
              const nextTargetPoints = isDeciding ? Number(computedLiveState.decidingSetTarget ?? 15) : 25;

              computedLiveState.currentSet = nextSet;
              computedLiveState.currentSetScore = { teamA: 0, teamB: 0 };
              computedLiveState.setsWon = { ...currentSetsWon };
              computedLiveState.targetPoints = nextTargetPoints;
              computedLiveState.winByTwo = winByTwo;
              computedLiveState.setStatus = 'in_progress';
              computedLiveState.completedSets = updatedCompletedSets;

              updatedTeamA = 0;
              updatedTeamB = 0;
              updatedDetails.sets = [...updatedCompletedSets, { set: nextSet, teamA: 0, teamB: 0 }];
              updatedDetails.setsWon = currentSetsWon;
              updatedDetails.currentSet = nextSet;
            }
          }
        }

        // Multi-Sport Completion & Derived Metrics
        if (isCounterStrike) {
          const roundsReq = Number(computedLiveState.roundsRequiredToWin ?? currentLiveState.roundsRequiredToWin ?? 13);
          const roundNum = updatedTeamA + updatedTeamB + 1;
          computedLiveState.round = roundNum;
          if (updatedTeamA >= roundsReq) {
            computedLiveState.matchStatus = 'completed';
            computedLiveState.winnerTeam = 'teamA';
            computedLiveState.winnerTeamId = matchData.teamAId;
            const winnerLabel = matchData.participantA?.name || 'Team A';
            computedLiveState.resultText = `${winnerLabel} won ${updatedTeamA}–${updatedTeamB}`;
          } else if (updatedTeamB >= roundsReq) {
            computedLiveState.matchStatus = 'completed';
            computedLiveState.winnerTeam = 'teamB';
            computedLiveState.winnerTeamId = matchData.teamBId;
            const winnerLabel = matchData.participantB?.name || 'Team B';
            computedLiveState.resultText = `${winnerLabel} won ${updatedTeamB}–${updatedTeamA}`;
          }
        }

        if (isCarrom) {
          const targetPts = Number(computedLiveState.targetPoints ?? currentLiveState.targetPoints ?? 25);
          if (updatedTeamA >= targetPts) {
            computedLiveState.matchStatus = 'completed';
            computedLiveState.winnerTeam = 'teamA';
            computedLiveState.winnerTeamId = matchData.teamAId;
            const winnerLabel = matchData.participantA?.name || 'Team A';
            computedLiveState.resultText = `${winnerLabel} won ${updatedTeamA}–${updatedTeamB}`;
          } else if (updatedTeamB >= targetPts) {
            computedLiveState.matchStatus = 'completed';
            computedLiveState.winnerTeam = 'teamB';
            computedLiveState.winnerTeamId = matchData.teamBId;
            const winnerLabel = matchData.participantB?.name || 'Team B';
            computedLiveState.resultText = `${winnerLabel} won ${updatedTeamB}–${updatedTeamA}`;
          }
        }

        if (isSmashKarts) {
          if (input.playerName || input.data?.player) {
            const scorerName = String(input.playerName || input.data?.player);
            const playerKills = { ...(((computedLiveState.playerKills as Record<string, number>) || {})) };
            playerKills[scorerName] = (playerKills[scorerName] || 0) + 1;
            computedLiveState.playerKills = playerKills;

            let topPlayer = scorerName;
            let maxPoints = 0;
            for (const [pName, pPts] of Object.entries(playerKills)) {
              if (pPts > maxPoints) {
                maxPoints = pPts;
                topPlayer = pName;
              }
            }
            computedLiveState.mvp = `${topPlayer} (${maxPoints} pts)`;
          }

          const targetPts = Number(computedLiveState.targetPoints ?? computedLiveState.targetKills ?? currentLiveState.targetPoints ?? 20);
          if (updatedTeamA >= targetPts) {
            computedLiveState.matchStatus = 'completed';
            computedLiveState.winnerTeam = 'teamA';
            computedLiveState.winnerTeamId = matchData.teamAId;
            const winnerLabel = matchData.participantA?.name || 'Team A';
            const mvpSuffix = computedLiveState.mvp ? ` · MVP: ${computedLiveState.mvp}` : '';
            computedLiveState.resultText = `${winnerLabel} won the game (${updatedTeamA}–${updatedTeamB})${mvpSuffix}`;
          } else if (updatedTeamB >= targetPts) {
            computedLiveState.matchStatus = 'completed';
            computedLiveState.winnerTeam = 'teamB';
            computedLiveState.winnerTeamId = matchData.teamBId;
            const winnerLabel = matchData.participantB?.name || 'Team B';
            const mvpSuffix = computedLiveState.mvp ? ` · MVP: ${computedLiveState.mvp}` : '';
            computedLiveState.resultText = `${winnerLabel} won the game (${updatedTeamB}–${updatedTeamA})${mvpSuffix}`;
          }
        }

        if (isChess) {
          if (input.type === 'chess_result' || input.type === 'match_end') {
            const res = String(input.data?.result || (input.team === 'teamA' ? '1-0' : input.team === 'teamB' ? '0-1' : '0.5-0.5'));
            computedLiveState.matchStatus = 'completed';
            if (res === '1-0' || input.team === 'teamA') {
              updatedTeamA = 1;
              updatedTeamB = 0;
              computedLiveState.winnerTeam = 'teamA';
              computedLiveState.winnerTeamId = matchData.teamAId;
              const winnerLabel = matchData.participantA?.name || 'White';
              computedLiveState.resultText = `${winnerLabel} won (1–0)`;
            } else if (res === '0-1' || input.team === 'teamB') {
              updatedTeamA = 0;
              updatedTeamB = 1;
              computedLiveState.winnerTeam = 'teamB';
              computedLiveState.winnerTeamId = matchData.teamBId;
              const winnerLabel = matchData.participantB?.name || 'Black';
              computedLiveState.resultText = `${winnerLabel} won (0–1)`;
            } else {
              updatedTeamA = 0.5;
              updatedTeamB = 0.5;
              computedLiveState.winnerTeam = 'tie';
              computedLiveState.resultText = 'Draw (½–½)';
            }
          }
        }

        if (delta.details) {
          Object.assign(updatedDetails, delta.details);
        }

        computedScore = {
          ...currentScore,
          teamA: updatedTeamA,
          teamB: updatedTeamB,
          details: updatedDetails,
        };
      } else if (input.newScore) {
        // Fallback: If caller passed an explicit absolute score and no delta was specified or inferred
        computedScore = input.newScore;
      } else if (input.type === 'innings_start' && isCricket) {
        computedScore = {
          ...currentScore,
          details: {
            ...((currentScore.details as Record<string, unknown>) || {}),
            runs: 0,
            wickets: 0,
            overs: 0,
            balls: 0,
            extras: 0,
            innings: computedLiveState.innings,
          },
        };
      } else if (input.type === 'match_start' && isVolleyball) {
        computedScore = {
          ...currentScore,
          teamA: 0,
          teamB: 0,
          details: {
            ...((currentScore.details as Record<string, unknown>) || {}),
            sets: [],
            currentSet: 1,
            setsWon: { teamA: 0, teamB: 0 },
          },
        };
      } else if (input.type === 'set_started' && isVolleyball) {
        computedScore = {
          ...currentScore,
          teamA: 0,
          teamB: 0,
        };
      } else if (input.type === 'penalty_scored' || input.type === 'penalty_missed' || input.type === 'penalty_shootout_start' || input.type === 'penalty_shootout_end') {
        const pens = (computedLiveState.penalties || (currentScore.details as any)?.penalties || { teamA: 0, teamB: 0 }) as Record<string, any>;
        computedScore = {
          ...currentScore,
          details: {
            ...((currentScore.details as Record<string, unknown>) || {}),
            penalties: {
              teamA: Number(pens.teamA || 0),
              teamB: Number(pens.teamB || 0),
            },
          },
        };
      } else {
        // Non-scoring action: score remains the fresh score
        computedScore = currentScore;
      }
    }

    const positioningText = formatSportPositioning(input.sportId, input.positioning, input.matchTime);

    const eventPayload: Omit<MatchEvent, 'id'> = {
      sequence: nextSequence,
      matchId: input.matchId,
      sportId: input.sportId,
      type: input.type,
      timestamp: Timestamp.now(),
      matchTime: input.matchTime || '',
      team: input.team || '',
      teamName: input.teamName || '',
      playerId: input.playerId || '',
      playerName: input.playerName || '',
      description: input.description,
      positioning: input.positioning || {},
      positioningText,
      data: {
        ...(input.data || {}),
        ...(input.scoreDelta ? { delta: input.scoreDelta } : {}),
      },
      snapshot: {
        score: computedScore,
        liveState: computedLiveState,
      },
      undone: false,
      createdBy: input.createdBy || 'admin',
    };

    const eventsCollRef = collection(firestore, `matches/${input.matchId}/events`);
    const eventDocRef = doc(eventsCollRef);
    const cleanPayload = cleanFirestoreData({
      ...eventPayload,
      createdAt: Timestamp.now(),
    });
    transaction.set(eventDocRef, cleanPayload);

    const matchUpdate: Record<string, unknown> = {
      score: computedScore,
      liveState: computedLiveState,
      lastSequence: nextSequence,
      updatedAt: Timestamp.now(),
    };

    // Determine target lifecycle status
    let targetStatus = input.newStatus;
    if (input.type === 'match_start') {
      targetStatus = 'live';
    } else if (input.type === 'half_time') {
      targetStatus = 'paused';
    } else if (input.type === 'match_pause') {
      targetStatus = 'paused';
    } else if (input.type === 'match_resume') {
      targetStatus = 'live';
    } else if (input.type === 'second_half') {
      targetStatus = 'live';
    } else if (input.type === 'penalty_shootout_start' || input.type === 'penalty_scored' || input.type === 'penalty_missed') {
      targetStatus = 'live';
    } else if (input.type === 'penalty_shootout_end') {
      targetStatus = 'completed';
    } else if (input.type === 'innings_start') {
      targetStatus = 'live';
    } else if (input.type === 'innings_end' || input.type === 'innings_completed') {
      targetStatus = 'paused';
    } else if (input.type === 'match_end' || input.type === 'full_time' || computedLiveState.resultText) {
      targetStatus = 'completed';
      if ((isVolleyball || isBadminton || isTableTennis) && !computedLiveState.resultText) {
        const setsA = Number((computedLiveState as any).setsWon?.teamA ?? (computedLiveState as any).gamesWon?.teamA ?? (computedScore?.details as any)?.setsWon?.teamA ?? 0);
        const setsB = Number((computedLiveState as any).setsWon?.teamB ?? (computedLiveState as any).gamesWon?.teamB ?? (computedScore?.details as any)?.setsWon?.teamB ?? 0);
        const winner = setsA > setsB ? 'teamA' : setsB > setsA ? 'teamB' : undefined;
        const term = isBadminton || isTableTennis ? 'Games' : 'Sets';
        if (winner) {
          const winnerLabel = winner === 'teamA' ? (matchData.participantA?.name || 'Team A') : (matchData.participantB?.name || 'Team B');
          computedLiveState.winnerTeam = winner;
          computedLiveState.winnerTeamId = winner === 'teamA' ? matchData.teamAId : matchData.teamBId;
          computedLiveState.resultText = `${winnerLabel} won ${setsA}–${setsB} (${term})`;
        } else {
          computedLiveState.resultText = `Match tied ${setsA}–${setsB}`;
        }
        computedLiveState.setStatus = 'completed';
        computedLiveState.matchStatus = 'completed';
      }
    }

    if (targetStatus) {
      matchUpdate.status = targetStatus;
      if (targetStatus === 'live' && !matchData.startedAt) {
        matchUpdate.startedAt = Timestamp.now();
      }
      if (targetStatus === 'paused') {
        matchUpdate.pausedAt = Timestamp.now();
      }
      if (targetStatus === 'live' && matchData.pausedAt) {
        const pausedMs = typeof matchData.pausedAt.toMillis === 'function' ? matchData.pausedAt.toMillis() : Date.now();
        const existingPaused = Number((matchData.liveState as any)?.pausedDurationMs || 0);
        const addedPaused = Math.max(0, Date.now() - pausedMs);
        computedLiveState.pausedDurationMs = existingPaused + addedPaused;
        matchUpdate.pausedAt = null;
      }
      if (targetStatus === 'completed') {
        // A match finished while paused banks the trailing pause first, so the
        // completed document never keeps a dangling `pausedAt` marker.
        if (matchData.pausedAt) {
          const pausedMs = typeof matchData.pausedAt.toMillis === 'function' ? matchData.pausedAt.toMillis() : Date.now();
          const existingPaused = Number((matchData.liveState as any)?.pausedDurationMs || 0);
          computedLiveState.pausedDurationMs = existingPaused + Math.max(0, Date.now() - pausedMs);
          matchUpdate.pausedAt = null;
        }
        if (!matchData.endedAt) {
          matchUpdate.endedAt = Timestamp.now();
        }
      }
    }

    // Generate cricket commentary when applicable
    try {
      const isCricketSport = (matchData.sportId || input.sportId).toLowerCase().includes('cricket');
      if (isCricketSport) {
        const { generateCricketCommentary } = await import('@/services/commentary/cricketCommentary');
        const matchForComment = {
          ...matchData,
          liveState: computedLiveState,
          score: computedScore,
        } as unknown as Match;
        const comment = generateCricketCommentary(eventPayload as MatchEvent, matchForComment);
        if (comment) {
          computedLiveState.latestCommentary = {
            text: comment.text,
            eventSequence: nextSequence,
            type: comment.type,
            voiceEnabled: comment.voiceEnabled,
          };
          matchUpdate.liveState = computedLiveState;
        }
      }
    } catch (e) {
      // Ignore commentary errors to avoid blocking scoring
    }

    transaction.update(matchRef, cleanFirestoreData(matchUpdate));

    return {
      eventId: eventDocRef.id,
      sequence: nextSequence,
      isCompleted: targetStatus === 'completed',
      sportId: matchData.sportId,
    };
  });

  if (result.isCompleted && result.sportId) {
    const isIndiv = ['badminton', 'table-tennis', 'chess', 'carrom'].includes(result.sportId.toLowerCase());
    syncSportLeaderboardToFirestore(result.sportId, result.sportId, isIndiv ? 'individual' : 'team').catch((err) => {
      console.warn('[standings] Auto-sync leaderboard failed:', err);
    });
  }

  return { eventId: result.eventId, sequence: result.sequence };
};

/**
 * Undoes the latest active event in the match and restores the prior snapshot.
 */
export const undoLastActiveEvent = async (
  matchId: string,
  operatorId: string = 'admin',
  fallbackInitialScore?: Record<string, unknown>,
  fallbackInitialLiveState?: Record<string, unknown>
): Promise<{ undoneEvent: MatchEvent; restoredScore: Record<string, unknown>; restoredLiveState: Record<string, unknown> }> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const firestore = db;

  const eventsRef = collection(firestore, `matches/${matchId}/events`);
  const q = query(eventsRef, orderBy('sequence', 'desc'));
  const snap = await getDocs(q);

  const allEvents = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MatchEvent));
  const activeEvents = allEvents.filter((e) => !e.undone);

  if (activeEvents.length === 0) {
    throw new Error('No active events found to undo.');
  }

  const targetEvent = activeEvents[0]; // highest sequence active event
  const previousEvent = activeEvents[1]; // event immediately prior to target

  return runTransaction(firestore, async (transaction) => {
    const targetEventRef = doc(firestore, `matches/${matchId}/events`, targetEvent.id);
    const targetSnap = await transaction.get(targetEventRef);
    if (!targetSnap.exists() || targetSnap.data()?.undone) {
      throw new Error('Event was already undone by another operator');
    }

    if (previousEvent) {
      const previousEventRef = doc(firestore, `matches/${matchId}/events`, previousEvent.id);
      await transaction.get(previousEventRef); // Read to ensure it hasn't changed if needed
    }

    transaction.update(targetEventRef, {
      undone: true,
      undoneAt: Timestamp.now(),
      undoneBy: operatorId,
    });

    // Determine restored score and liveState
    const restoredScore = previousEvent?.snapshot?.score || fallbackInitialScore || { teamA: 0, teamB: 0, details: {} };
    const restoredLiveState = previousEvent?.snapshot?.liveState || fallbackInitialLiveState || {};

    const matchRef = doc(firestore, 'matches', matchId);
    transaction.update(matchRef, cleanFirestoreData({
      score: restoredScore as unknown as Match['score'],
      liveState: restoredLiveState as unknown as Match['liveState'],
      updatedAt: Timestamp.now(),
    }));

    return {
      undoneEvent: targetEvent,
      restoredScore,
      restoredLiveState,
    };
  });
};

/**
 * Corrects an earlier event with an auditable replacement event and updates the match state.
 */
export const correctMatchEvent = async (input: CorrectEventInput): Promise<{ newEventId: string; sequence: number }> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const firestore = db;

  return runTransaction(firestore, async (transaction) => {
    const originalRef = doc(firestore, `matches/${input.matchId}/events`, input.originalEventId);
    const origSnap = await transaction.get(originalRef);
    if (!origSnap.exists()) throw new Error('Original event not found');

    const originalEvent = { ...origSnap.data(), id: origSnap.id } as MatchEvent;
    if (originalEvent.undone) {
      throw new Error('Event was already corrected or undone by another operator');
    }

    const matchRef = doc(firestore, 'matches', input.matchId);
    const matchSnap = await transaction.get(matchRef);
    const matchData = matchSnap.data() as Match | undefined;

    const currentSequence = Number(matchData?.lastSequence || 0);
    const nextSequence = currentSequence + 1;

    const positioningText = formatSportPositioning(input.sportId, input.positioning || originalEvent.positioning);

    // 1. Mark original event as corrected/undone
    transaction.update(originalRef, {
      undone: true,
      correctionNote: input.correctionNote,
      correctedByEventSequence: nextSequence,
      updatedAt: Timestamp.now(),
    });

    // 2. Append new correction event with monotonic sequence
    const eventsCollRef = collection(firestore, `matches/${input.matchId}/events`);
    const newDocRef = doc(eventsCollRef);
    const newEventPayload: Omit<MatchEvent, 'id'> = {
      sequence: nextSequence,
      matchId: input.matchId,
      sportId: input.sportId,
      type: input.newType,
      timestamp: Timestamp.now(),
      matchTime: originalEvent.matchTime || '',
      team: input.team || originalEvent.team || '',
      teamName: input.teamName || originalEvent.teamName || '',
      description: input.newDescription,
      positioning: input.positioning || originalEvent.positioning || {},
      positioningText,
      data: {
        originalEventId: originalEvent.id,
        replacesSequence: originalEvent.sequence,
        reason: input.correctionNote,
      },
      snapshot: {
        score: input.correctedScore,
        liveState: input.correctedLiveState || {},
      },
      undone: false,
      isCorrection: true,
      correctionNote: input.correctionNote,
      replacesSequence: originalEvent.sequence,
      createdBy: input.correctedBy || 'admin',
    };

    transaction.set(newDocRef, cleanFirestoreData({
      ...newEventPayload,
      createdAt: Timestamp.now(),
    }));

    // 3. Atomically update match doc
    transaction.update(matchRef, cleanFirestoreData({
      score: input.correctedScore as unknown as Match['score'],
      liveState: (input.correctedLiveState || matchData?.liveState || {}) as unknown as Match['liveState'],
      lastSequence: nextSequence,
      updatedAt: Timestamp.now(),
    }));

    return { newEventId: newDocRef.id, sequence: nextSequence };
  });
};

/* ============================================================================
 *  Backward Compatibility & Utility Methods
 * ==========================================================================*/

export const updateScore = async (matchId: string, score: Score): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, { score, updatedAt: serverTimestamp() });
};

export const addMatchEvent = async (matchId: string, event: Omit<MatchEvent, 'id' | 'createdAt'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const docRef = await addDoc(eventsRef, { ...event, createdAt: serverTimestamp() });
  return docRef.id;
};

export const undoLastEvent = async (matchId: string): Promise<void> => {
  await undoLastActiveEvent(matchId);
};

export const getMatchEvents = async (matchId: string): Promise<MatchEvent[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const eventsRef = collection(db, `matches/${matchId}/events`);
    const q = query(eventsRef, orderBy('sequence', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as MatchEvent));
  } catch (error) {
    console.error('Error getting match events', error);
    return [];
  }
};

export const subscribeToMatchEvents = (
  matchId: string,
  callback: (events: MatchEvent[]) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const q = query(eventsRef, orderBy('sequence', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as MatchEvent)));
  });
};

export const subscribeToScore = (
  matchId: string,
  callback: (score: Score | null) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(doc(db, 'matches', matchId), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback((data.score as Score) || null);
    } else {
      callback(null);
    }
  });
};
