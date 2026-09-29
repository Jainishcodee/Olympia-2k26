import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Fixture {
  sport: string;
  stage: string;
  venue: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  clock: string;
}

const FIXTURES: Fixture[] = [
  { sport: 'FOOTBALL', stage: 'SEMIFINAL', venue: 'MAIN ARENA', teamA: 'NORTH WING', teamB: 'SOUTH SIDE', scoreA: 2, scoreB: 1, clock: "78'" },
  { sport: 'BADMINTON', stage: 'QUARTER FINAL', venue: 'COURT 03', teamA: 'FALCONS', teamB: 'VIPERS', scoreA: 1, scoreB: 1, clock: 'GAME 3' },
  { sport: 'CRICKET', stage: 'GROUP STAGE', venue: 'OVAL A', teamA: 'TITANS', teamB: 'MAVERICKS', scoreA: 184, scoreB: 167, clock: 'OV 18.2' },
];

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

/**
 * Broadcast-style live bug. Cycles through fixtures with a cross-fade so the
 * hero always has a pulse of real score activity without any data layer.
 */
export const LiveScoreHUD: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [index, setIndex] = useState(0);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % FIXTURES.length), 5200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setMinute((m) => (m + 1) % 60), 1000);
    return () => clearInterval(id);
  }, []);

  const fixture = FIXTURES[index];

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div className="relative overflow-hidden border border-[#D9A441]/35 bg-[#071426]/85 backdrop-blur-md shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
        {/* diagonal broadcast texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(217,164,65,0.5) 0px, rgba(217,164,65,0.5) 1px, transparent 1px, transparent 9px)',
          }}
        />
        {/* corner sweep */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/2 opacity-60"
          style={{ background: 'linear-gradient(90deg, rgba(18,100,255,0) 0%, rgba(18,100,255,0.22) 100%)' }}
        />

        <div className="relative px-4 pt-3 pb-3 sm:px-5">
          <div className="flex items-center justify-between gap-6 mb-2.5">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FF4D3D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D3D] shadow-[0_0_10px_2px_rgba(255,77,61,0.85)] ol-pulse" />
              LIVE
              <span className="text-white/45 font-bold tracking-[0.18em]">/ DEMO</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D9A441]">
              {fixture.venue}
            </span>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 mb-3">
            {fixture.sport} <span className="text-white/25">/</span> {fixture.stage}
            <span className="float-right text-white/40 tabular-nums">{fixture.clock}</span>
          </div>

          <div className="flex items-center justify-between gap-3 sm:gap-5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] text-white/45">
                HOME
              </div>
              <div className="truncate font-black uppercase tracking-tight text-white text-base sm:text-xl">
                {fixture.teamA}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 font-black tracking-tighter text-[#FFD21F] text-3xl sm:text-5xl leading-none">
              <Roll value={fixture.scoreA} />
              <span className="text-white/30 text-xl sm:text-3xl">:</span>
              <Roll value={fixture.scoreB} className="text-white" />
            </div>

            <div className="min-w-0 flex-1 text-right">
              <div className="truncate text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] text-white/45">
                AWAY
              </div>
              <div className="truncate font-black uppercase tracking-tight text-white text-base sm:text-xl">
                {fixture.teamB}
              </div>
            </div>
          </div>
        </div>

        {/* progress hairline — constant low-level motion */}
        <motion.div
          key={index}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 5.2, ease: 'linear' }}
          className="h-[2px] origin-left bg-gradient-to-r from-[#D9A441] via-[#FFD21F] to-[#1264FF]"
        />
      </div>

      {/* live tick — the score nudges whenever the clock advances */}
      <div className="mt-2 flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/25">
        <span>SIMULATED FEED</span>
        <span className="tabular-nums text-[#D9A441]/70">SYNC {String(minute).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};

export default LiveScoreHUD;
