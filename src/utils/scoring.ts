export function calculateCricketRunRate(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return runs / overs;
}

export function calculateRequiredRunRate(target: number, currentRuns: number, remainingOvers: number): number {
  if (remainingOvers === 0) return 0;
  const runsNeeded = target - currentRuns;
  return runsNeeded > 0 ? runsNeeded / remainingOvers : 0;
}

export function calculateOversBowled(balls: number): number {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return overs + (remainingBalls / 10);
}

export function formatCricketScore(innings: any): string {
  if (!innings) return '';
  return `${innings.runs}/${innings.wickets} (${innings.overs})`;
}

export function getMatchWinner(match: any): string | null {
  if (match.status !== 'completed' || !match.winnerId) return null;
  return match.winnerId;
}

export function isMatchComplete(match: any): boolean {
  return match.status === 'completed';
}
