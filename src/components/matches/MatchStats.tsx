import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import type { MatchEvent, Match } from '@/types';

export interface StatItem {
  label: string;
  valA: number | string;
  valB: number | string;
  suffix?: string;
  status?: 'derived' | 'admin_entered' | 'not_tracked';
}

/**
 * Derives authentic football telemetry from canonical match events.
 * Clearly separates DERIVED from NOT_TRACKED metrics.
 */
export const deriveFootballStats = (events: MatchEvent[], liveMatch?: Match): StatItem[] => {
  const activeEvents = (events || []).filter((e) => !e.undone);
  const isTeamA = (team?: string) => team === 'teamA' || team === 'A';
  const isTeamB = (team?: string) => team === 'teamB' || team === 'B';

  const goalsA = activeEvents.filter((e) => e.type === 'goal' && isTeamA(e.team)).length;
  const goalsB = activeEvents.filter((e) => e.type === 'goal' && isTeamB(e.team)).length;

  const yellowCardsA = activeEvents.filter((e) => e.type === 'yellow_card' && isTeamA(e.team)).length;
  const yellowCardsB = activeEvents.filter((e) => e.type === 'yellow_card' && isTeamB(e.team)).length;

  const redCardsA = activeEvents.filter((e) => e.type === 'red_card' && isTeamA(e.team)).length;
  const redCardsB = activeEvents.filter((e) => e.type === 'red_card' && isTeamB(e.team)).length;

  const subsA = activeEvents.filter((e) => e.type === 'substitution' && isTeamA(e.team)).length;
  const subsB = activeEvents.filter((e) => e.type === 'substitution' && isTeamB(e.team)).length;

  const pensScoredA = activeEvents.filter((e) => e.type === 'penalty_scored' && isTeamA(e.team)).length;
  const pensScoredB = activeEvents.filter((e) => e.type === 'penalty_scored' && isTeamB(e.team)).length;

  const pensMissedA = activeEvents.filter((e) => e.type === 'penalty_missed' && isTeamA(e.team)).length;
  const pensMissedB = activeEvents.filter((e) => e.type === 'penalty_missed' && isTeamB(e.team)).length;

  const hasShootout = pensScoredA + pensScoredB + pensMissedA + pensMissedB > 0 ||
    Boolean(liveMatch?.liveState?.isShootout || (liveMatch?.liveState as any)?.penalties);

  const baseStats: StatItem[] = [
    { label: 'Goals', valA: goalsA, valB: goalsB, status: 'derived' },
  ];

  if (hasShootout) {
    const penStateA = (liveMatch?.liveState as any)?.penalties?.teamA ?? pensScoredA;
    const penStateB = (liveMatch?.liveState as any)?.penalties?.teamB ?? pensScoredB;
    baseStats.push({ label: 'Penalty Shootout', valA: penStateA, valB: penStateB, status: 'derived' });
    if (pensMissedA + pensMissedB > 0) {
      baseStats.push({ label: 'Penalties Missed', valA: pensMissedA, valB: pensMissedB, status: 'derived' });
    }
  }

  baseStats.push(
    { label: 'Yellow Cards', valA: yellowCardsA, valB: yellowCardsB, status: 'derived' },
    { label: 'Red Cards', valA: redCardsA, valB: redCardsB, status: 'derived' },
    { label: 'Substitutions', valA: subsA, valB: subsB, status: 'derived' },
    { label: 'Possession', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Shots', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Shots on Target', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Corners', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Fouls', valA: '—', valB: '—', status: 'not_tracked' },
  );

  return baseStats;
};

/**
 * Derives authentic cricket telemetry from canonical match events.
 * Accurately tracks runs, wickets, overs, boundaries, sixes, extras, and unmonitored metrics.
 */
export const deriveCricketStats = (events: MatchEvent[], liveMatch?: Match): StatItem[] => {
  const activeEvents = (events || []).filter((e) => !e.undone);
  const isTeamA = (team?: string) => team === 'teamA' || team === 'A';
  const isTeamB = (team?: string) => team === 'teamB' || team === 'B';

  const runsA = Number(liveMatch?.score?.teamA ?? 0);
  const runsB = Number(liveMatch?.score?.teamB ?? 0);

  const wicketsA = activeEvents.filter((e) => e.type === 'wicket' && isTeamA(e.team)).length;
  const wicketsB = activeEvents.filter((e) => e.type === 'wicket' && isTeamB(e.team)).length;

  const foursA = activeEvents.filter((e) => (e.type === 'four' || (e.data?.delta as any)?.runs === 4) && isTeamA(e.team)).length;
  const foursB = activeEvents.filter((e) => (e.type === 'four' || (e.data?.delta as any)?.runs === 4) && isTeamB(e.team)).length;

  const sixesA = activeEvents.filter((e) => (e.type === 'six' || (e.data?.delta as any)?.runs === 6) && isTeamA(e.team)).length;
  const sixesB = activeEvents.filter((e) => (e.type === 'six' || (e.data?.delta as any)?.runs === 6) && isTeamB(e.team)).length;

  const tensA = activeEvents.filter((e) => (e.type === 'ten' || (e.data?.delta as any)?.runs === 10) && isTeamA(e.team)).length;
  const tensB = activeEvents.filter((e) => (e.type === 'ten' || (e.data?.delta as any)?.runs === 10) && isTeamB(e.team)).length;

  const extrasTypes = ['wide', 'no_ball', 'bye', 'leg_bye'];
  const extrasA = activeEvents.filter((e) => extrasTypes.includes(e.type) && isTeamA(e.team)).length;
  const extrasB = activeEvents.filter((e) => extrasTypes.includes(e.type) && isTeamB(e.team)).length;

  const dotsA = activeEvents.filter((e) => (e.type === 'dot' || ((e.data?.delta as any)?.runs === 0 && e.type !== 'wicket')) && isTeamA(e.team)).length;
  const dotsB = activeEvents.filter((e) => (e.type === 'dot' || ((e.data?.delta as any)?.runs === 0 && e.type !== 'wicket')) && isTeamB(e.team)).length;

  const legalBallsA = activeEvents.filter((e) => e.type !== 'wide' && e.type !== 'no_ball' && ['dot', 'single', 'double', 'triple', 'four', 'six', 'ten', 'wicket', 'bye', 'leg_bye', 'run', 'ball'].includes(e.type) && isTeamA(e.team)).length;
  const legalBallsB = activeEvents.filter((e) => e.type !== 'wide' && e.type !== 'no_ball' && ['dot', 'single', 'double', 'triple', 'four', 'six', 'ten', 'wicket', 'bye', 'leg_bye', 'run', 'ball'].includes(e.type) && isTeamB(e.team)).length;

  const formatOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6} ov`;

  return [
    { label: 'Runs Scored', valA: runsA, valB: runsB, status: 'derived' },
    { label: 'Wickets Lost', valA: wicketsA, valB: wicketsB, status: 'derived' },
    { label: 'Overs Faced', valA: formatOvers(legalBallsA), valB: formatOvers(legalBallsB), status: 'derived' },
    { label: 'Fours (4s)', valA: foursA, valB: foursB, status: 'derived' },
    { label: 'Sixes (6s)', valA: sixesA, valB: sixesB, status: 'derived' },
    { label: 'Super Tens (10s)', valA: tensA, valB: tensB, status: 'derived' },
    { label: 'Extras Conceded', valA: extrasA, valB: extrasB, status: 'derived' },
    { label: 'Dot Balls Faced', valA: dotsA, valB: dotsB, status: 'derived' },
    { label: 'Control %', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Catch Efficiency', valA: '—', valB: '—', status: 'not_tracked' },
  ];
};

/**
 * Derives authentic volleyball telemetry from canonical match events.
 * Accurately tracks sets won, current points, match points, and point events,
 * while transparently marking unmonitored metrics as NOT TRACKED ('—').
 */
export const deriveVolleyballStats = (events: MatchEvent[], liveMatch?: Match): StatItem[] => {
  const activeEvents = (events || []).filter((e) => !e.undone);
  const isTeamA = (team?: string) => team === 'teamA' || team === 'A';
  const isTeamB = (team?: string) => team === 'teamB' || team === 'B';

  const setsWonA = Number(liveMatch?.liveState?.setsWon?.teamA ?? (liveMatch?.score?.details as any)?.setsWon?.teamA ?? 0);
  const setsWonB = Number(liveMatch?.liveState?.setsWon?.teamB ?? (liveMatch?.score?.details as any)?.setsWon?.teamB ?? 0);

  const currentPtsA = Number(liveMatch?.liveState?.currentSetScore?.teamA ?? liveMatch?.score?.teamA ?? 0);
  const currentPtsB = Number(liveMatch?.liveState?.currentSetScore?.teamB ?? liveMatch?.score?.teamB ?? 0);

  const pointEventsA = activeEvents.filter((e) => e.type === 'point' && isTeamA(e.team)).length;
  const pointEventsB = activeEvents.filter((e) => e.type === 'point' && isTeamB(e.team)).length;

  const completedSets = (liveMatch?.liveState?.completedSets as Array<{ teamA: number; teamB: number }>) || [];
  const completedPtsA = completedSets.reduce((sum, s) => sum + Number(s.teamA || 0), 0);
  const completedPtsB = completedSets.reduce((sum, s) => sum + Number(s.teamB || 0), 0);
  const totalPtsA = completedPtsA + currentPtsA;
  const totalPtsB = completedPtsB + currentPtsB;

  return [
    { label: 'Sets Won', valA: setsWonA, valB: setsWonB, status: 'derived' },
    { label: 'Current Set Points', valA: currentPtsA, valB: currentPtsB, status: 'derived' },
    { label: 'Total Match Points', valA: totalPtsA, valB: totalPtsB, status: 'derived' },
    { label: 'Point Rallies Won', valA: pointEventsA, valB: pointEventsB, status: 'derived' },
    { label: 'Attack Percentage', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Blocks', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Aces', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Digs', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Serve Efficiency', valA: '—', valB: '—', status: 'not_tracked' },
    { label: 'Reception Quality', valA: '—', valB: '—', status: 'not_tracked' },
  ];
};

export const MatchStats: React.FC<{ stats?: StatItem[]; className?: string }> = ({ 
  stats = [], 
  className 
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (!stats || stats.length === 0) {
    return (
      <div
        className={cn(
          "p-6 rounded-2xl border backdrop-blur-xl transition-all shadow-xl",
          isDay
            ? "bg-white/80 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
            : "bg-[#071426]/90 border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
          className
        )}
      >
        <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
          <h3 className={cn("text-lg font-black uppercase tracking-widest", isDay ? "text-[#071426]" : "text-white")}>
            Match Telemetry
          </h3>
          <span className={cn("text-xs font-bold uppercase tracking-wider", isDay ? "text-[#071426]/50" : "text-white/40")}>
            Live Stats
          </span>
        </div>
        <p className={cn("text-xs font-medium text-center py-6", isDay ? "text-[#071426]/40" : "text-white/40")}>
          No match telemetry available yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border backdrop-blur-xl transition-all shadow-xl",
        isDay
          ? "bg-white/80 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
          : "bg-[#071426]/90 border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
        <h3
          className={cn(
            "text-lg font-black uppercase tracking-widest",
            isDay ? "text-[#071426]" : "text-white"
          )}
        >
          Match Telemetry
        </h3>
        <span className={cn("text-xs font-bold uppercase tracking-wider", isDay ? "text-[#071426]/50" : "text-white/40")}>
          Live Stats
        </span>
      </div>

      <div className="space-y-5">
        {stats.map((stat, i) => {
          const isNotTracked = stat.status === 'not_tracked' || stat.valA === '—' || stat.valB === '—';
          const numA = typeof stat.valA === 'number' ? stat.valA : 0;
          const numB = typeof stat.valB === 'number' ? stat.valB : 0;
          const total = numA + numB;
          const pctA = total === 0 ? 50 : (numA / total) * 100;
          const pctB = total === 0 ? 50 : (numB / total) * 100;

          return (
            <div key={i} className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className={cn("font-black text-base sm:text-lg tabular-nums min-w-[2.5rem] text-left", isDay ? "text-[#155EEF]" : "text-[#1264FF]")}>
                  {stat.valA}{stat.suffix || ''}
                </span>

                <div className="flex flex-col items-center">
                  <span className={cn("font-black uppercase text-xs tracking-widest", isDay ? "text-[#071426]/70" : "text-white/70")}>
                    {stat.label}
                  </span>
                  {isNotTracked && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80 bg-amber-500/10 px-1.5 py-0.2 rounded mt-0.5">
                      Not Tracked
                    </span>
                  )}
                </div>

                <span className="text-[#FF4D3D] font-black text-base sm:text-lg tabular-nums min-w-[2.5rem] text-right">
                  {stat.valB}{stat.suffix || ''}
                </span>
              </div>

              {!isNotTracked && (
                <div className={cn("flex h-2.5 rounded-full overflow-hidden", isDay ? "bg-[#071426]/10" : "bg-white/10")}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctA}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-[#1264FF] rounded-l-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctB}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-[#FF4D3D] rounded-r-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
