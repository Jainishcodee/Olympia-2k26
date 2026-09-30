import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { getTeamLogo } from '@/utils/teamLogos';
import type { Match, Team } from '@/types';

/** Two-digit pad with a vertical roll on every value change. */
const Roll: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const digits = String(Math.max(0, value)).padStart(2, '0').split('');

  return (
    <span className={`inline-flex overflow-hidden tabular-nums ${className}`}>
      {digits.map((d, i) => (
        <span key={`${i}-${d}`} className="relative inline-block overflow-hidden" style={{ width: '0.62em', height: '1em' }}>
          <AnimatePresence initial={false}>
            <motion.span
              key={d}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {d}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
};

export const LiveScoreHUD: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const matches = useCollection<Match>('matches');
  const teams = useCollection<Team>('teams');
  const [index, setIndex] = useState(0);

  const teamById = React.useMemo(
    () => new Map(teams.data.map((t) => [t.id, t])),
    [teams.data]
  );

  const liveMatches = React.useMemo(
    () => matches.data.filter((m) => m.status === 'live'),
    [matches.data]
  );

  useEffect(() => {
    if (liveMatches.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % liveMatches.length), 6000);
    return () => clearInterval(id);
  }, [liveMatches.length]);

  // If there are no live matches in Firestore, do not render fake simulated feed
  if (matches.isLoading || liveMatches.length === 0) {
    return null;
  }

  const match = liveMatches[index % liveMatches.length];
  const teamA = match.participantA?.name || teamById.get(match.teamAId)?.name || 'Team A';
  const teamB = match.participantB?.name || teamById.get(match.teamBId)?.name || 'Team B';
  const logoA = teamById.get(match.teamAId)?.logo || getTeamLogo(teamA) || getTeamLogo(match.teamAId);
  const logoB = teamById.get(match.teamBId)?.logo || getTeamLogo(teamB) || getTeamLogo(match.teamBId);
  const score = match.score as unknown as Record<string, unknown> | undefined;
  const scoreA = Number(score?.teamA ?? 0);
  const scoreB = Number(score?.teamB ?? 0);
  const clock = match.liveState?.clock || 'LIVE';

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div
        className={`relative overflow-hidden border backdrop-blur-xl rounded-xl transition-colors duration-300 ${
          isDay
            ? 'border-[#071426]/15 bg-white/85 shadow-[0_20px_50px_-20px_rgba(7,20,38,0.25)] text-[#071426]'
            : 'border-[#D9A441]/40 bg-[#071426]/90 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] text-white'
        }`}
      >
        {/* diagonal broadcast texture */}
        <div
          aria-hidden
          className={`absolute inset-0 ${isDay ? 'opacity-[0.06]' : 'opacity-[0.16]'}`}
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(217,164,65,0.5) 0px, rgba(217,164,65,0.5) 1px, transparent 1px, transparent 9px)',
          }}
        />

        <div className="relative px-5 pt-3.5 pb-4">
          <div className="flex items-center justify-between gap-6 mb-2.5">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FF4D3D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D3D] shadow-[0_0_10px_2px_rgba(255,77,61,0.85)] animate-ping" />
              LIVE TELEMETRY
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
              }`}
            >
              {match.sportId}
            </span>
          </div>

          <div
            className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-between ${
              isDay ? 'text-[#071426]/60' : 'text-white/50'
            }`}
          >
            <span>Match #{match.matchNumber ?? 1}</span>
            <span className="text-[#D9A441] font-mono tabular-nums">{clock}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 flex items-center gap-2.5">
              {logoA && (
                <img src={logoA} alt={teamA} className="w-8 h-8 rounded-lg object-cover border border-black/10 dark:border-white/10 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[10px] font-black uppercase tracking-[0.14em] ${
                    isDay ? 'text-[#071426]/50' : 'text-white/40'
                  }`}
                >
                  TEAM A
                </div>
                <div
                  className={`truncate font-black uppercase tracking-tight text-sm sm:text-base ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}
                >
                  {teamA}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-black tracking-tighter text-[#D9A441] text-3xl sm:text-4xl leading-none shrink-0 px-1">
              <Roll value={scoreA} />
              <span className={isDay ? 'text-[#071426]/30 text-xl' : 'text-white/30 text-xl'}>:</span>
              <Roll value={scoreB} className={isDay ? 'text-[#071426]' : 'text-white'} />
            </div>

            <div className="min-w-0 flex-1 flex items-center justify-end gap-2.5 text-right">
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[10px] font-black uppercase tracking-[0.14em] ${
                    isDay ? 'text-[#071426]/50' : 'text-white/40'
                  }`}
                >
                  TEAM B
                </div>
                <div
                  className={`truncate font-black uppercase tracking-tight text-sm sm:text-base ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}
                >
                  {teamB}
                </div>
              </div>
              {logoB && (
                <img src={logoB} alt={teamB} className="w-8 h-8 rounded-lg object-cover border border-black/10 dark:border-white/10 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* progress hairline */}
        <motion.div
          key={match.id}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 6, ease: 'linear' }}
          className="h-[2px] origin-left bg-gradient-to-r from-[#D9A441] via-[#FFD21F] to-[#1264FF]"
        />
      </div>
    </div>
  );
};

export default LiveScoreHUD;
