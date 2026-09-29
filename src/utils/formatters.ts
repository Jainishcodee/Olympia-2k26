export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatScore(score: any, sport: string): string {
  if (!score) return '';
  if (sport === 'cricket') {
    return `${score.runs}/${score.wickets} (${score.overs})`;
  }
  return score.toString();
}

export function formatOvers(balls: number): string {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${overs}.${remainingBalls}`;
}

export function formatRunRate(runs: number, overs: number): string {
  if (overs === 0) return '0.00';
  return (runs / overs).toFixed(2);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
