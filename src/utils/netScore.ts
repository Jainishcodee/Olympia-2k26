/**
 * OLYMPIA 2K26 - Sports Scoring & Net Score Calculation Engine
 * 
 * Supports:
 * - Cricket: Net Run Rate (NRR) with ICC all-out quota rules
 * - Football: Net Goals, Goal Difference (GD), Goal Average, Points Table
 * - Volleyball: Set Ratio, Point Ratio (Quotient), FIVB 3-2-1 Points System
 * - Hand Tennis & Racket Sports: Game Differential, Point Differential
 * - Custom Formula & Tie-breaker resolution
 */

export interface CricketMatchInput {
  teamRuns: number;
  teamOvers: number; // e.g. 19.4 = 19 overs + 4 balls
  teamWickets: number;
  isTeamAllOut: boolean;
  maxOversQuota: number; // e.g. 20 for T20, 50 for ODI

  opponentRuns: number;
  opponentOvers: number;
  opponentWickets: number;
  isOpponentAllOut: boolean;
}

export interface CricketNRRResult {
  nrr: number; // formatted to 3 decimal places
  formattedNRR: string; // e.g. "+1.450" or "-0.820"
  teamRunRate: number;
  opponentRunRate: number;
  effectiveTeamOvers: number;
  effectiveOpponentOvers: number;
  pointsEarned: number;
  result: 'win' | 'loss' | 'tie';
  formulaBreakdown: string[];
}

/**
 * Converts cricket overs format (X.Y where Y is balls from 0 to 5) to exact decimal overs.
 * e.g., 19.3 overs = 19 + 3/6 = 19.5 overs.
 */
export function cricketOversToDecimal(overs: number): number {
  const wholeOvers = Math.floor(overs);
  const balls = Math.round((overs - wholeOvers) * 10);
  if (balls >= 6) {
    return wholeOvers + 1;
  }
  return wholeOvers + balls / 6;
}

/**
 * Formats decimal overs back to cricket standard notation X.Y
 */
export function decimalToCricketOvers(decimalOvers: number): string {
  const wholeOvers = Math.floor(decimalOvers);
  const remainingBalls = Math.round((decimalOvers - wholeOvers) * 6);
  if (remainingBalls === 0) return `${wholeOvers}.0`;
  if (remainingBalls >= 6) return `${wholeOvers + 1}.0`;
  return `${wholeOvers}.${remainingBalls}`;
}

/**
 * Calculates Cricket Net Run Rate (NRR) according to standard ICC regulations.
 * Rule: If a team is dismissed (all out) before the completion of their allocated overs,
 * their run-rate is computed over the full maximum overs quota they were entitled to face.
 */
export function calculateCricketNRR(
  input: CricketMatchInput,
  winPoints: number = 2,
  tiePoints: number = 1,
  lossPoints: number = 0
): CricketNRRResult {
  const breakdown: string[] = [];

  // Effective overs for batting team
  let teamDecOvers = cricketOversToDecimal(input.teamOvers);
  if (input.isTeamAllOut || input.teamWickets >= 10) {
    teamDecOvers = input.maxOversQuota;
    breakdown.push(`Team was All Out: Overs counted as full quota (${input.maxOversQuota.toFixed(1)} overs) instead of ${input.teamOvers} overs.`);
  } else {
    breakdown.push(`Team batted ${input.teamOvers} ov = ${teamDecOvers.toFixed(3)} decimal overs.`);
  }

  // Effective overs for opponent
  let oppDecOvers = cricketOversToDecimal(input.opponentOvers);
  if (input.isOpponentAllOut || input.opponentWickets >= 10) {
    oppDecOvers = input.maxOversQuota;
    breakdown.push(`Opponent was All Out: Overs counted as full quota (${input.maxOversQuota.toFixed(1)} overs) instead of ${input.opponentOvers} overs.`);
  } else {
    breakdown.push(`Opponent batted ${input.opponentOvers} ov = ${oppDecOvers.toFixed(3)} decimal overs.`);
  }

  // Avoid division by zero
  const teamRR = teamDecOvers > 0 ? input.teamRuns / teamDecOvers : 0;
  const oppRR = oppDecOvers > 0 ? input.opponentRuns / oppDecOvers : 0;

  const rawNRR = teamRR - oppRR;
  const roundedNRR = Math.round(rawNRR * 1000) / 1000;
  const formattedNRR = (roundedNRR > 0 ? '+' : '') + roundedNRR.toFixed(3);

  breakdown.push(`Team Run Rate (For) = ${input.teamRuns} runs / ${teamDecOvers.toFixed(3)} ov = ${teamRR.toFixed(3)} RPO`);
  breakdown.push(`Opponent Run Rate (Against) = ${input.opponentRuns} runs / ${oppDecOvers.toFixed(3)} ov = ${oppRR.toFixed(3)} RPO`);
  breakdown.push(`Net Run Rate (NRR) = ${teamRR.toFixed(3)} - ${oppRR.toFixed(3)} = ${formattedNRR}`);

  let result: 'win' | 'loss' | 'tie' = 'tie';
  let pointsEarned = tiePoints;

  if (input.teamRuns > input.opponentRuns) {
    result = 'win';
    pointsEarned = winPoints;
  } else if (input.teamRuns < input.opponentRuns) {
    result = 'loss';
    pointsEarned = lossPoints;
  }

  return {
    nrr: roundedNRR,
    formattedNRR,
    teamRunRate: Math.round(teamRR * 1000) / 1000,
    opponentRunRate: Math.round(oppRR * 1000) / 1000,
    effectiveTeamOvers: teamDecOvers,
    effectiveOpponentOvers: oppDecOvers,
    pointsEarned,
    result,
    formulaBreakdown: breakdown,
  };
}

export interface FootballMatchInput {
  goalsFor: number;
  goalsAgainst: number;
  priorGF?: number;
  priorGA?: number;
  priorWins?: number;
  priorDraws?: number;
  priorLosses?: number;
}

export interface FootballNetScoreResult {
  matchGoalDiff: number;
  totalGoalDiff: number;
  formattedGD: string;
  goalAverage: number;
  pointsEarned: number;
  totalPoints: number;
  result: 'win' | 'loss' | 'draw';
  formulaBreakdown: string[];
}

/**
 * Calculates Football Net Goals, Goal Difference (GD), Goal Ratio, and Standings Points.
 */
export function calculateFootballNetScore(
  input: FootballMatchInput,
  winPoints: number = 3,
  drawPoints: number = 1,
  lossPoints: number = 0
): FootballNetScoreResult {
  const breakdown: string[] = [];

  const matchGD = input.goalsFor - input.goalsAgainst;
  let result: 'win' | 'loss' | 'draw' = 'draw';
  let pointsEarned = drawPoints;

  if (matchGD > 0) {
    result = 'win';
    pointsEarned = winPoints;
  } else if (matchGD < 0) {
    result = 'loss';
    pointsEarned = lossPoints;
  }

  const prevGF = input.priorGF || 0;
  const prevGA = input.priorGA || 0;
  const newTotalGF = prevGF + input.goalsFor;
  const newTotalGA = prevGA + input.goalsAgainst;
  const totalGD = newTotalGF - newTotalGA;

  const prevWins = input.priorWins || 0;
  const prevDraws = input.priorDraws || 0;
  const prevLosses = input.priorLosses || 0;

  const newWins = prevWins + (result === 'win' ? 1 : 0);
  const newDraws = prevDraws + (result === 'draw' ? 1 : 0);
  const newLosses = prevLosses + (result === 'loss' ? 1 : 0);
  const totalPoints = newWins * winPoints + newDraws * drawPoints + newLosses * lossPoints;

  const goalAvg = newTotalGA > 0 ? Math.round((newTotalGF / newTotalGA) * 1000) / 1000 : newTotalGF;

  breakdown.push(`Match Result: ${input.goalsFor} - ${input.goalsAgainst} (${result.toUpperCase()})`);
  breakdown.push(`Match Goal Difference (Net Score): ${input.goalsFor} - ${input.goalsAgainst} = ${matchGD > 0 ? '+' : ''}${matchGD}`);
  breakdown.push(`Cumulative Goals: GF=${newTotalGF}, GA=${newTotalGA} => Cumulative GD = ${totalGD > 0 ? '+' : ''}${totalGD}`);
  breakdown.push(`Points Table: ${newWins}W - ${newDraws}D - ${newLosses}L = ${totalPoints} Pts`);
  if (newTotalGA > 0) {
    breakdown.push(`Goal Ratio (GF / GA): ${newTotalGF} / ${newTotalGA} = ${goalAvg.toFixed(3)}`);
  }

  return {
    matchGoalDiff: matchGD,
    totalGoalDiff: totalGD,
    formattedGD: (totalGD > 0 ? '+' : '') + totalGD.toString(),
    goalAverage: goalAvg,
    pointsEarned,
    totalPoints,
    result,
    formulaBreakdown: breakdown,
  };
}

export interface VolleyballMatchInput {
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

export interface VolleyballNetScoreResult {
  setDiff: number;
  setRatio: number;
  pointDiff: number;
  pointQuotient: number;
  pointsEarned: number;
  result: 'win' | 'loss';
  formulaBreakdown: string[];
}

/**
 * Calculates Volleyball Set Ratio, Point Quotient, and FIVB 3-2-1 Points System.
 * FIVB System:
 * - 3-0 or 3-1 win: 3 points to winner, 0 to loser
 * - 3-2 win: 2 points to winner, 1 point to loser
 */
export function calculateVolleyballNetScore(input: VolleyballMatchInput): VolleyballNetScoreResult {
  const breakdown: string[] = [];

  const setDiff = input.setsWon - input.setsLost;
  const isWin = input.setsWon > input.setsLost;
  const setRatio = input.setsLost > 0 ? Math.round((input.setsWon / input.setsLost) * 1000) / 1000 : input.setsWon;

  const pointDiff = input.pointsWon - input.pointsLost;
  const pointQuotient = input.pointsLost > 0 ? Math.round((input.pointsWon / input.pointsLost) * 1000) / 1000 : input.pointsWon;

  let pointsEarned = 0;
  if (isWin) {
    if (input.setsLost <= 1) {
      pointsEarned = 3; // 3-0 or 3-1 win
      breakdown.push(`Clean Victory (${input.setsWon}-${input.setsLost}): Awarded maximum 3 Points (FIVB rule).`);
    } else {
      pointsEarned = 2; // 3-2 win
      breakdown.push(`Tiebreak Victory (${input.setsWon}-${input.setsLost}): Awarded 2 Points (FIVB rule).`);
    }
  } else {
    if (input.setsWon === 2) {
      pointsEarned = 1; // 2-3 loss
      breakdown.push(`Close Tiebreak Loss (${input.setsWon}-${input.setsLost}): Awarded 1 Bonus Point for reaching 5th set.`);
    } else {
      pointsEarned = 0;
      breakdown.push(`Loss (${input.setsWon}-${input.setsLost}): 0 Points.`);
    }
  }

  breakdown.push(`Set Difference: ${input.setsWon} - ${input.setsLost} = ${setDiff > 0 ? '+' : ''}${setDiff}`);
  breakdown.push(`Set Ratio (Sets Won / Sets Lost): ${input.setsWon} / ${input.setsLost} = ${setRatio.toFixed(3)}`);
  breakdown.push(`Point Difference (Net Points): ${input.pointsWon} - ${input.pointsLost} = ${pointDiff > 0 ? '+' : ''}${pointDiff}`);
  breakdown.push(`Point Quotient (Ratio): ${input.pointsWon} / ${input.pointsLost} = ${pointQuotient.toFixed(3)}`);

  return {
    setDiff,
    setRatio,
    pointDiff,
    pointQuotient,
    pointsEarned,
    result: isWin ? 'win' : 'loss',
    formulaBreakdown: breakdown,
  };
}

export interface RacketSportInput {
  gamesWon: number;
  gamesLost: number;
  pointsWon: number;
  pointsLost: number;
}

export function calculateRacketNetScore(input: RacketSportInput) {
  const gameDiff = input.gamesWon - input.gamesLost;
  const pointDiff = input.pointsWon - input.pointsLost;
  const pointRatio = input.pointsLost > 0 ? Math.round((input.pointsWon / input.pointsLost) * 1000) / 1000 : input.pointsWon;

  return {
    gameDiff,
    pointDiff,
    pointRatio,
    formattedPointDiff: (pointDiff > 0 ? '+' : '') + pointDiff.toString(),
    formulaBreakdown: [
      `Game Differential: ${input.gamesWon} - ${input.gamesLost} = ${gameDiff > 0 ? '+' : ''}${gameDiff}`,
      `Point Differential: ${input.pointsWon} - ${input.pointsLost} = ${pointDiff > 0 ? '+' : ''}${pointDiff}`,
      `Point Ratio: ${input.pointsWon} / ${input.pointsLost} = ${pointRatio.toFixed(3)}`,
    ],
  };
}
