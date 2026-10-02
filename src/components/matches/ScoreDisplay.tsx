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
  const { isDay } = useTheme();
  const live = (liveState || {}) as Record<string, any>;
  const sId = (sportId || '').toLowerCase();
  const isCricket = sId.includes('cricket');
  const isVolleyball = sId.includes('volleyball');
  const isBadminton = sId.includes('badminton');
  const isTableTennis = sId.includes('table-tennis') || sId.includes('table_tennis');
  const isRacquet = isBadminton || isTableTennis;
  const isCounterStrike = sId.includes('counter') || sId.includes('cs') || sId.includes('strike');
  const isCarrom = sId.includes('carrom');
  const isSmashKarts = sId.includes('smash') || sId.includes('kart');
  const isChess = sId.includes('chess');
  const isFootball = sId.includes('football') || sId.includes('soccer');
  const penalties = live.penalties as {
    teamA?: number;
    teamB?: number;
    round?: number;
    currentTeam?: string;
    kicks?: Array<{
      id: string;
      kickNumber: number;
      round: number;
      team: 'teamA' | 'teamB';
      playerName?: string;
      scored: boolean;
    }>;
  } | undefined;
  const isShootout = Boolean(live.isShootout || penalties);

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

        <div className="flex items-center justify-between w-full max-w-4xl px-1 sm:px-4">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0 px-1 sm:px-2">
            <div
              className={cn(
                "w-14 h-14 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl mb-2 sm:mb-4 flex items-center justify-center text-xl sm:text-3xl md:text-4xl font-black border shadow-lg transition-transform hover:scale-105 overflow-hidden shrink-0",
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
                "text-xs sm:text-xl md:text-3xl font-black uppercase tracking-tight truncate max-w-[105px] sm:max-w-none w-full",
                isDay ? "text-[#071426]" : "text-white"
              )}
              title={teamA}
            >
              {teamA}
            </h2>
            {isCricket && (
              <div className="mt-1.5 sm:mt-2 text-center">
                {liveState?.firstInnings?.team === 'teamA' ? (
                  <div className="text-xs sm:text-base font-black text-amber-400">
                    {liveState.firstInnings.runs}/{liveState.firstInnings.wickets} <span className="text-[10px] sm:text-xs font-semibold opacity-75">({liveState.firstInnings.overs}.{liveState.firstInnings.balls} ov)</span>
                  </div>
                ) : liveState?.battingTeam === 'teamA' ? (
                  <div className="text-xs sm:text-base font-black text-emerald-400">
                    {scoreA}/{liveState?.wickets ?? 0} <span className="text-[10px] sm:text-xs font-semibold opacity-75">({liveState?.overs ?? 0}.{liveState?.ball ?? 0}{liveState?.maxOvers ? ` / ${liveState.maxOvers}` : ''} ov)</span>
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-sm font-semibold opacity-60">
                    {liveState?.innings === 1 ? 'Yet to bat' : `${scoreA} runs`}
                  </div>
                )}
              </div>
            )}
            {isVolleyball && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#155EEF]/15 border border-[#155EEF]/30 text-[#4B90FF]">
                  Sets: {live.setsWon?.teamA ?? 0}
                </span>
              </div>
            )}
            {isRacquet && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#155EEF]/15 border border-[#155EEF]/30 text-[#4B90FF]">
                  Games: {live.gamesWon?.teamA ?? live.setsWon?.teamA ?? 0}
                </span>
              </div>
            )}
            {isCounterStrike && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  CT · {scoreA} Rds
                </span>
              </div>
            )}
            {isSmashKarts && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  {scoreA} Elims
                </span>
              </div>
            )}
            {isFootball && penalties && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Pens: {penalties.teamA ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Central Score */}
          <div className="flex flex-col items-center justify-center px-1 sm:px-6 md:px-10 shrink-0">
            <div
              className={cn(
                "font-black tracking-tighter flex items-center p-2 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl border shadow-2xl tabular-nums select-none",
                isCricket ? "text-2xl sm:text-5xl md:text-6xl" : "text-3xl sm:text-6xl md:text-8xl",
                isDay
                  ? "bg-white/95 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.08)]"
                  : "bg-black/60 border-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
              )}
            >
              {isCricket ? (
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span>{scoreA}</span>
                  <span className={cn("text-[0.6em] -translate-y-0.5", isDay ? "text-[#071426]/30" : "text-white/30")}>-</span>
                  <span>{scoreB}</span>
                </div>
              ) : (
                <>
                  <NumberColumn value={scoreA} />
                  <span className={cn("mx-0.5 sm:mx-3 md:mx-4 -translate-y-0.5 sm:-translate-y-2", isDay ? "text-[#071426]/30" : "text-white/30")}>
                    -
                  </span>
                  <NumberColumn value={scoreB} />
                </>
              )}
            </div>
            {isCricket && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-[#D9A441]">
                {live.innings === 2 ? '2nd Innings' : '1st Innings'}
                {live.overs !== undefined && ` · ${live.overs}.${live.ball || 0} ov`}
              </div>
            )}
            {isVolleyball && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-[#D9A441] text-center">
                Set {String(live.currentSet ?? 1)} · Target {String(live.targetPoints ?? 25)} pts
                {live.winByTwo !== false && ' (Win by 2)'}
              </div>
            )}
            {isRacquet && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-[#D9A441] text-center">
                Game {String(live.currentSet ?? live.game ?? 1)} · Target {isBadminton ? 21 : 11} pts (Win by 2)
              </div>
            )}
            {isCounterStrike && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-orange-400 text-center">
                Round {String(live.round ?? (scoreA + scoreB + 1))} / 24 · MR12 (Target: 13 Rds)
              </div>
            )}
            {isCarrom && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-amber-400 text-center">
                Board {String(live.board ?? 1)} · Target: {String(live.targetPoints ?? 25)} pts
              </div>
            )}
            {isSmashKarts && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-cyan-400 text-center">
                Arena Battle · Target: {String(live.targetPoints ?? live.targetKills ?? 20)} Elims
              </div>
            )}
            {isChess && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-yellow-400 text-center">
                Move {String(live.move ?? 1)}{live.lastMove ? ` · Last: ${String(live.lastMove)}` : ''}
              </div>
            )}
            {isFootball && penalties && (
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-black uppercase tracking-wider text-amber-400 text-center">
                ⚽ Penalties · {penalties.teamA ?? 0} - {penalties.teamB ?? 0}
                {live.isShootout && penalties.round ? ` (Round ${penalties.round})` : ''}
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0 px-1 sm:px-2">
            <div
              className={cn(
                "w-14 h-14 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl mb-2 sm:mb-4 flex items-center justify-center text-xl sm:text-3xl md:text-4xl font-black border shadow-lg transition-transform hover:scale-105 overflow-hidden shrink-0",
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
                "text-xs sm:text-xl md:text-3xl font-black uppercase tracking-tight truncate max-w-[105px] sm:max-w-none w-full",
                isDay ? "text-[#071426]" : "text-white"
              )}
              title={teamB}
            >
              {teamB}
            </h2>
            {isCricket && (
              <div className="mt-1.5 sm:mt-2 text-center">
                {liveState?.firstInnings?.team === 'teamB' ? (
                  <div className="text-xs sm:text-base font-black text-amber-400">
                    {liveState.firstInnings.runs}/{liveState.firstInnings.wickets} <span className="text-[10px] sm:text-xs font-semibold opacity-75">({liveState.firstInnings.overs}.{liveState.firstInnings.balls} ov)</span>
                  </div>
                ) : liveState?.battingTeam === 'teamB' ? (
                  <div className="text-xs sm:text-base font-black text-emerald-400">
                    {scoreB}/{live.wickets ?? 0} <span className="text-[10px] sm:text-xs font-semibold opacity-75">({live.overs ?? 0}.{live.ball ?? 0}{live.maxOvers ? ` / ${live.maxOvers}` : ''} ov)</span>
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-sm font-semibold opacity-60">
                    {live.innings === 1 ? 'Yet to bat' : `${scoreB} runs`}
                  </div>
                )}
              </div>
            )}
            {isVolleyball && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF4D3D]/15 border border-[#FF4D3D]/30 text-[#FF4D3D]">
                  Sets: {live.setsWon?.teamB ?? 0}
                </span>
              </div>
            )}
            {isRacquet && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF4D3D]/15 border border-[#FF4D3D]/30 text-[#FF4D3D]">
                  Games: {live.gamesWon?.teamB ?? live.setsWon?.teamB ?? 0}
                </span>
              </div>
            )}
            {isCounterStrike && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  T · {scoreB} Rds
                </span>
              </div>
            )}
            {isSmashKarts && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF4D3D]/15 border border-[#FF4D3D]/30 text-[#FF4D3D]">
                  {scoreB} Elims
                </span>
              </div>
            )}
            {isFootball && penalties && (
              <div className="mt-1.5 sm:mt-2 text-center">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Pens: {penalties.teamB ?? 0}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cricket Additional Context (Target / Result / Batsmen) */}
        {isCricket && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            )}
            {!live.resultText && live.innings === 2 && live.targetRuns && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-wider">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  Target: {String(live.targetRuns)}
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Need {String(live.requiredRuns ?? Math.max(0, live.targetRuns - scoreB))} runs in {String(live.ballsRemaining ?? 0)} balls
                </span>
              </div>
            )}
            {(live.strikerName || live.currentBowlerName) && (
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300 bg-white/5 py-2 px-4 rounded-xl border border-white/10">
                {live.strikerName && (
                  <span>🏏 {String(live.strikerName)}* <span className="text-amber-400">{String(live.strikerRuns ?? 0)}</span>({String(live.strikerBalls ?? 0)})</span>
                )}
                {live.nonStrikerName && (
                  <span>{String(live.nonStrikerName)} <span className="text-slate-300">{String(live.nonStrikerRuns ?? 0)}</span>({String(live.nonStrikerBalls ?? 0)})</span>
                )}
                {live.currentBowlerName && (
                  <span>🎯 Bowler: {String(live.currentBowlerName)} <span className="text-red-400">{String(live.bowlerWickets ?? 0)}/{String(live.bowlerRunsConceded ?? 0)}</span></span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Volleyball Additional Context (Sets Ticker, Completed Sets & Final Result) */}
        {isVolleyball && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-wider">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Sets: {teamA} {String(live.setsWon?.teamA ?? 0)} — {String(live.setsWon?.teamB ?? 0)} {teamB}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                Current Set: {String(live.currentSetScore?.teamA ?? scoreA)} — {String(live.currentSetScore?.teamB ?? scoreB)}
              </span>
            </div>
            {Array.isArray(live.completedSets) && live.completedSets.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {live.completedSets.map((s, idx) => (
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

        {/* Racquet Sports Additional Context (Badminton & Table Tennis) */}
        {isRacquet && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-wider">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Games: {teamA} {String(live.gamesWon?.teamA ?? live.setsWon?.teamA ?? 0)} — {String(live.gamesWon?.teamB ?? live.setsWon?.teamB ?? 0)} {teamB}
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                Current Game: {String(live.currentSetScore?.teamA ?? scoreA)} — {String(live.currentSetScore?.teamB ?? scoreB)}
              </span>
            </div>
            {Array.isArray(live.completedSets) && live.completedSets.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {live.completedSets.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300"
                  >
                    Game {s.set}: <strong className="text-white">{s.teamA}–{s.teamB}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Counter-Strike Context */}
        {isCounterStrike && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText ? (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold tracking-wider">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  Counter-Terrorists: {scoreA}
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Terrorists: {scoreB}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Carrom Context */}
        {isCarrom && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            )}
          </div>
        )}

        {/* Smash Karts Context */}
        {isSmashKarts && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            )}
            {live.mvp && (
              <div className="flex items-center justify-center">
                <span className="px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs sm:text-sm tracking-wider">
                  ⭐ MVP: {String(live.mvp)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Chess Context */}
        {isChess && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                ♔ {String(live.resultText)}
              </div>
            )}
          </div>
        )}

        {/* Football Additional Context (Shootout status, Result) */}
        {isFootball && (
          <div className="w-full max-w-2xl mt-6 space-y-3">
            {live.resultText && (
              <div className="py-2.5 px-4 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#D9A441] font-black text-sm sm:text-base uppercase tracking-wider text-center shadow-lg">
                🏆 {String(live.resultText)}
              </div>
            )}
            {penalties && (
              <div className={cn(
                "p-4 rounded-2xl border backdrop-blur-md shadow-xl",
                isDay
                  ? "bg-white/80 border-[#071426]/10 text-[#071426]"
                  : "bg-black/50 border-white/10 text-white"
              )}>
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                    ⚽ Penalty Shootout {live.isShootout ? '(LIVE)' : '(Final)'}
                  </span>
                  <span className="text-xs font-mono font-black">
                    {penalties.teamA ?? 0} – {penalties.teamB ?? 0}
                  </span>
                </div>
                {/* Visual kick dots for both teams */}
                {Array.isArray(penalties.kicks) && penalties.kicks.length > 0 && (
                  <div className="space-y-2 text-xs">
                    {(['teamA', 'teamB'] as const).map((tKey) => {
                      const tName = tKey === 'teamA' ? teamA : teamB;
                      const teamKicks = (penalties.kicks || []).filter((k) => k.team === tKey);
                      return (
                        <div key={tKey} className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "font-bold truncate w-28 sm:w-36 text-left",
                            isDay ? "text-slate-700" : "text-slate-300"
                          )}>
                            {tName}
                          </span>
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            {Array.from({ length: Math.max(5, teamKicks.length) }).map((_, idx) => {
                              const kick = teamKicks[idx];
                              if (!kick) {
                                return (
                                  <span
                                    key={idx}
                                    className={cn(
                                      "w-4 h-4 rounded-full border inline-block",
                                      isDay ? "border-slate-300 bg-slate-100" : "border-white/20 bg-white/5"
                                    )}
                                    title={`Kick ${idx + 1}: Pending`}
                                  />
                                );
                              }
                              return (
                                <span
                                  key={idx}
                                  className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                                    kick.scored ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500 shadow-sm shadow-rose-500/50"
                                  )}
                                  title={`${kick.playerName || 'Player'}: ${kick.scored ? 'Scored' : 'Missed'}`}
                                >
                                  {kick.scored ? '✓' : '✗'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
