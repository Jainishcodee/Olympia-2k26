import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import { getTeamLogo } from '@/utils/teamLogos';

import type { LiveState } from '@/types';

interface ScoreDisplayProps {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  time?: string;
  className?: string;
  sportId?: string;
  liveState?: LiveState;
}

const NumberColumn: React.FC<{ value: number }> = ({ value }) => (
  <div className="relative h-[1em] overflow-hidden leading-none px-1 sm:px-2">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={value}
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {value}
      </motion.div>
    </AnimatePresence>
    {/* Invisible placeholder to maintain width */}
    <div className="invisible">{value}</div>
  </div>
);

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  teamA, 
  teamB, 
  scoreA, 
  scoreB, 
  status, 
  time, 
  className,
  sportId,
  liveState,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const isCricket = (sportId || '').toLowerCase().includes('cricket');
  const isVolleyball = (sportId || '').toLowerCase().includes('volleyball');

  return (
    <div
      className={cn(
        "w-full border-y py-8 sm:py-12 md:py-20 relative overflow-hidden transition-colors",
        isDay
          ? "bg-gradient-to-b from-[#F0ECE1] to-[#E5DEC9] border-[#071426]/10 text-[#071426]"
          : "bg-[#071426] border-white/10 text-white",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1747B8]/15 via-transparent to-transparent opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center">
        {status === 'live' && (
          <div className="flex items-center space-x-2 mb-6 sm:mb-8 bg-[#FF4D3D]/10 border border-[#FF4D3D]/30 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#FF4D3D] animate-pulse" />
            <span className="text-[#FF4D3D] font-black text-xs sm:text-sm tracking-widest uppercase">
              {time || 'LIVE BROADCAST'}
            </span>
          </div>
        )}
        {status === 'paused' && (
          <div className="flex items-center space-x-2 mb-6 sm:mb-8 bg-[#D9A441]/10 border border-[#D9A441]/30 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#D9A441]" />
            <span className="text-[#D9A441] font-black text-xs sm:text-sm tracking-widest uppercase">
              {time || 'HALF TIME / PAUSED'}
            </span>
          </div>
        )}
        {status === 'completed' && (
          <div className="flex items-center space-x-2 mb-6 sm:mb-8 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-black text-xs sm:text-sm tracking-widest uppercase">
              FINAL RESULT
            </span>
          </div>
        )}
        {status === 'scheduled' && (
          <div className="flex items-center space-x-2 mb-6 sm:mb-8 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-blue-400 font-black text-xs sm:text-sm tracking-widest uppercase">
              SCHEDULED MATCH
            </span>
          </div>
        )}

        <div className="flex items-center justify-between w-full max-w-4xl">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0 px-2">
            <div
              className={cn(
                "w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-3xl mb-3 sm:mb-5 flex items-center justify-center text-2xl sm:text-4xl font-black border shadow-lg transition-transform hover:scale-105 overflow-hidden",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#155EEF] shadow-sm"
                  : "bg-white/5 border-white/10 text-[#FFD21F] shadow-2xl"
              )}
            >
              {getTeamLogo(teamA) ? (
                <img src={getTeamLogo(teamA)} alt={teamA} className="w-full h-full object-cover" />
              ) : (
                teamA.charAt(0)
              )}
            </div>
            <h2
              className={cn(
                "text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tight truncate max-w-full",
                isDay ? "text-[#071426]" : "text-white"
              )}
            >
              {teamA}
            </h2>
            {isCricket && (
              <div className="mt-2 text-center">
                {liveState?.firstInnings?.team === 'teamA' ? (
                  <div className="text-sm sm:text-base font-black text-amber-400">
                    {liveState.firstInnings.runs}/{liveState.firstInnings.wickets} <span className="text-xs font-semibold opacity-75">({liveState.firstInnings.overs}.{liveState.firstInnings.balls} ov)</span>
                  </div>
                ) : liveState?.battingTeam === 'teamA' ? (
                  <div className="text-sm sm:text-base font-black text-emerald-400">
                    {scoreA}/{liveState?.wickets ?? 0} <span className="text-xs font-semibold opacity-75">({liveState?.overs ?? 0}.{liveState?.ball ?? 0} ov)</span>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm font-semibold opacity-60">
                    {liveState?.innings === 1 ? 'Yet to bat' : `${scoreA} runs`}
                  </div>
                )}
              </div>
            )}
            {isVolleyball && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#155EEF]/15 border border-[#155EEF]/30 text-[#4B90FF]">
                  Sets Won: {liveState?.setsWon?.teamA ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Central Score */}
          <div className="flex flex-col items-center justify-center px-2 sm:px-6 md:px-10 shrink-0">
            <div
              className={cn(
                "font-black tracking-tighter flex items-center p-3 sm:p-6 md:p-8 rounded-2xl border shadow-2xl tabular-nums",
                isCricket ? "text-3xl sm:text-5xl md:text-6xl" : "text-4xl sm:text-6xl md:text-8xl",
                isDay
                  ? "bg-white/90 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.08)]"
                  : "bg-black/60 border-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
              )}
            >
              {isCricket ? (
                <div className="flex items-center gap-3">
                  <span>{scoreA}</span>
                  <span className={cn("text-[0.6em] -translate-y-0.5", isDay ? "text-[#071426]/30" : "text-white/30")}>-</span>
                  <span>{scoreB}</span>
                </div>
              ) : (
                <>
                  <NumberColumn value={scoreA} />
                  <span className={cn("mx-1 sm:mx-3 md:mx-4 -translate-y-1 sm:-translate-y-2", isDay ? "text-[#071426]/30" : "text-white/30")}>
                    -
                  </span>
                  <NumberColumn value={scoreB} />
                </>
              )}
            </div>
            {isCricket && (
              <div className="mt-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#D9A441]">
                {liveState?.innings === 2 ? '2nd Innings' : '1st Innings'}
                {liveState?.overs !== undefined && ` · ${liveState.overs}.${liveState.ball || 0} ov`}
              </div>
            )}
            {isVolleyball && (
              <div className="mt-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#D9A441] text-center">
                Set {liveState?.currentSet ?? 1} · Target {liveState?.targetPoints ?? 25} pts
                {liveState?.winByTwo !== false && ' (Win by 2)'}
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0 px-2">
            <div
              className={cn(
                "w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-3xl mb-3 sm:mb-5 flex items-center justify-center text-2xl sm:text-4xl font-black border shadow-lg transition-transform hover:scale-105 overflow-hidden",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#FF4D3D] shadow-sm"
                  : "bg-white/5 border-white/10 text-[#FF4D3D] shadow-2xl"
              )}
            >
              {getTeamLogo(teamB) ? (
                <img src={getTeamLogo(teamB)} alt={teamB} className="w-full h-full object-cover" />
              ) : (
                teamB.charAt(0)
              )}
            </div>
            <h2
              className={cn(
                "text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tight truncate max-w-full",
                isDay ? "text-[#071426]" : "text-white"
              )}
            >
              {teamB}
            </h2>
            {isCricket && (
              <div className="mt-2 text-center">
                {liveState?.firstInnings?.team === 'teamB' ? (
                  <div className="text-sm sm:text-base font-black text-amber-400">
                    {liveState.firstInnings.runs}/{liveState.firstInnings.wickets} <span className="text-xs font-semibold opacity-75">({liveState.firstInnings.overs}.{liveState.firstInnings.balls} ov)</span>
                  </div>
                ) : liveState?.battingTeam === 'teamB' ? (
                  <div className="text-sm sm:text-base font-black text-emerald-400">
                    {scoreB}/{liveState?.wickets ?? 0} <span className="text-xs font-semibold opacity-75">({liveState?.overs ?? 0}.{liveState?.ball ?? 0} ov)</span>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm font-semibold opacity-60">
                    {liveState?.innings === 1 ? 'Yet to bat' : `${scoreB} runs`}
                  </div>
                )}
              </div>
            )}
            {isVolleyball && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FF4D3D]/15 border border-[#FF4D3D]/30 text-[#FF4D3D]">
                  Sets Won: {liveState?.setsWon?.teamB ?? 0}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cricket Additional Context (Target / Result / Batsmen) */}
        {isCricket && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {liveState?.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {liveState.resultText}
              </div>
            )}
            {!liveState?.resultText && liveState?.innings === 2 && liveState?.targetRuns && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-wider">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  Target: {liveState.targetRuns}
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Need {liveState.requiredRuns ?? Math.max(0, liveState.targetRuns - scoreB)} runs in {liveState.ballsRemaining ?? 0} balls
                </span>
              </div>
            )}
            {(liveState?.strikerName || liveState?.currentBowlerName) && (
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300 bg-white/5 py-2 px-4 rounded-xl border border-white/10">
                {liveState.strikerName && (
                  <span>🏏 {liveState.strikerName}* <span className="text-amber-400">{liveState.strikerRuns ?? 0}</span>({liveState.strikerBalls ?? 0})</span>
                )}
                {liveState.nonStrikerName && (
                  <span>{liveState.nonStrikerName} <span className="text-slate-300">{liveState.nonStrikerRuns ?? 0}</span>({liveState.nonStrikerBalls ?? 0})</span>
                )}
                {liveState.currentBowlerName && (
                  <span>🎯 Bowler: {liveState.currentBowlerName} <span className="text-red-400">{liveState.bowlerWickets ?? 0}/{liveState.bowlerRunsConceded ?? 0}</span></span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Volleyball Additional Context (Sets Ticker, Completed Sets & Final Result) */}
        {isVolleyball && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {liveState?.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {liveState.resultText}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-wider">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Sets: {teamA} {liveState?.setsWon?.teamA ?? 0} — {liveState?.setsWon?.teamB ?? 0} {teamB}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                Current Set: {liveState?.currentSetScore?.teamA ?? scoreA} — {liveState?.currentSetScore?.teamB ?? scoreB}
              </span>
            </div>
            {Array.isArray(liveState?.completedSets) && liveState.completedSets.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {liveState.completedSets.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300"
                  >
                    Set {s.set}: <strong className="text-white">{s.teamA}–{s.teamB}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
