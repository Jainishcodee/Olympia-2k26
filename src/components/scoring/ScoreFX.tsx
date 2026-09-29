import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Score FX — the broadcast layer
 *
 *  Every scoring action fires one `ScoreFXEvent`. The layer answers with a
 *  screen-wide ripple, a flash, a typographic burst and a score bug, so a
 *  single click is acknowledged by the whole interface rather than only the
 *  number that changed.
 * ==========================================================================*/

export type FXKind =
  | 'goal'
  | 'six'
  | 'four'
  | 'wicket'
  | 'point'
  | 'set'
  | 'round'
  | 'card'
  | 'neutral';

export interface ScoreFXEvent {
  id: string;
  kind: FXKind;
  /** Big word in the centre: GOAL / SIX / OUT / POINT */
  title: string;
  /** Small kicker printed above the big glyph — used when `title` is a numeral */
  kicker?: string;
  /** Small line under it — team, description */
  sub?: string;
  /** Live score shown in the top bug, e.g. `2 – 1` */
  score?: string;
  team?: 'teamA' | 'teamB';
  /** Overrides the derived accent colour */
  accent?: string;
  /** Label shown in the top bug — defaults to `title` */
  bugLabel?: string;
}

const LIFETIME: Record<FXKind, number> = {
  goal: 2100,
  six: 2100,
  wicket: 1800,
  four: 1700,
  set: 2000,
  point: 1300,
  round: 1400,
  card: 1500,
  neutral: 1200,
};

const TEAM_A = '#1264FF';
const TEAM_B = '#FF4D3D';

const accentFor = (event: ScoreFXEvent): string => {
  if (event.accent) return event.accent;
  if (event.team === 'teamA') return TEAM_A;
  if (event.team === 'teamB') return TEAM_B;
  switch (event.kind) {
    case 'wicket':
      return TEAM_B;
    case 'six':
    case 'set':
      return '#FFD21F';
    default:
      return '#D9A441';
  }
};

/** How many concentric shockwaves each event throws. */
const RIPPLES: Record<FXKind, number> = {
  goal: 3,
  six: 3,
  wicket: 3,
  four: 2,
  set: 3,
  point: 1,
  round: 2,
  card: 1,
  neutral: 0,
};

export const useScoreFX = () => {
  const [event, setEvent] = useState<ScoreFXEvent | null>(null);
  const timer = useRef<number | null>(null);

  const fire = useCallback((next: Omit<ScoreFXEvent, 'id'>) => {
    const payload: ScoreFXEvent = {
      ...next,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setEvent(payload);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setEvent(null), LIFETIME[next.kind] ?? 1400);
  }, []);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setEvent(null);
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return { fx: event, fire, clear };
};

/* -------------------------------------------------------------------------- */
/*  Ball trajectory — quadratic arc sampled into keyframes                     */
/* -------------------------------------------------------------------------- */

const P0 = { x: 70, y: 440 };
const P1 = { x: 500, y: 30 };
const P2 = { x: 930, y: 440 };

const arcPoint = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
};

const BALL_X: number[] = [];
const BALL_Y: number[] = [];
const BALL_T: number[] = [];
for (let i = 0; i <= 24; i += 1) {
  const t = i / 24;
  const p = arcPoint(t);
  BALL_X.push(p.x);
  BALL_Y.push(p.y);
  BALL_T.push(t);
}

const ARC_D = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

/* -------------------------------------------------------------------------- */
/*  Sequence                                                                   */
/* -------------------------------------------------------------------------- */

const FXSequence: React.FC<{ event: ScoreFXEvent }> = ({ event }) => {
  const accent = accentFor(event);
  const showTrajectory = event.kind === 'six';
  const showFlash = event.kind === 'goal' || event.kind === 'six' || event.kind === 'wicket';
  const flashColor = event.kind === 'wicket' ? '#FFFFFF' : accent;
  const rippleCount = RIPPLES[event.kind] ?? 0;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --- screen flash ---------------------------------------------- */}
      {showFlash && (
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: flashColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, event.kind === 'wicket' ? 0.3 : 0.16, 0] }}
          transition={{ duration: event.kind === 'wicket' ? 0.34 : 0.5, times: [0, 0.16, 1] }}
        />
      )}

      {/* --- shockwaves ------------------------------------------------- */}
      {Array.from({ length: rippleCount }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: '78vmax',
            height: '78vmax',
            x: '-50%',
            y: '-50%',
            border: `2px solid ${accent}`,
            boxShadow: `inset 0 0 80px ${accent}33`,
          }}
          initial={{ scale: 0.04, opacity: 0 }}
          animate={{ scale: [0.04, 1], opacity: [0.6, 0] }}
          transition={{ duration: 1.25, delay: i * 0.13, ease: 'easeOut' }}
        />
      ))}

      {/* --- ball trajectory -------------------------------------------- */}
      {showTrajectory && (
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <motion.path
            d={ARC_D}
            fill="none"
            stroke="#FFD21F"
            strokeWidth={5}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{
              pathLength: { duration: 0.78, ease: 'easeOut' },
              opacity: { duration: 1.7, times: [0, 0.46, 1] },
            }}
          />
          <motion.circle
            r={13}
            fill="#FFD21F"
            stroke="#05070C"
            strokeWidth={3}
            initial={{ cx: BALL_X[0], cy: BALL_Y[0], opacity: 1 }}
            animate={{ cx: BALL_X, cy: BALL_Y, opacity: [1, 1, 0] }}
            transition={{
              cx: { duration: 0.78, ease: 'easeOut', times: BALL_T },
              cy: { duration: 0.78, ease: 'easeOut', times: BALL_T },
              opacity: { duration: 1.6, times: [0, 0.5, 1] },
            }}
          />
        </svg>
      )}

      {/* --- centre burst ------------------------------------------------ */}
      <motion.div
        className="absolute inset-x-0 top-[14vh] flex flex-col items-center px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
      >
        {event.kicker && (
          <motion.span
            className="mb-1 text-[clamp(0.8rem,2.4vw,1.4rem)] font-black uppercase tracking-[0.5em] text-[#D9A441]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {event.kicker}
          </motion.span>
        )}
        <motion.h2
          className="text-[clamp(3.5rem,17vw,12rem)] font-black uppercase leading-[0.82] tracking-[-0.03em]"
          style={{
            color: accent,
            textShadow: `0 0 60px ${accent}66, 0 8px 40px rgba(0,0,0,0.55)`,
          }}
          initial={{ scale: 0.3, opacity: 0, letterSpacing: '0.5em' }}
          animate={{ scale: [0.3, 1.22, 1], opacity: 1, letterSpacing: '-0.03em' }}
          transition={{ duration: 0.62, times: [0, 0.55, 1], ease: [0.16, 1, 0.3, 1] }}
        >
          {event.title}
        </motion.h2>

        {event.sub && (
          <motion.div
            className="mt-4 flex items-center gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="h-px w-8 bg-[#D9A441]" />
            <span className="text-[11px] font-black uppercase tracking-[0.34em] text-[#D9A441]">
              {event.sub}
            </span>
            <span className="h-px w-8 bg-[#D9A441]" />
          </motion.div>
        )}
      </motion.div>

      {/* --- top score bug ---------------------------------------------- */}
      {event.score && (
        <motion.div
          className="absolute left-1/2 top-[7vh] flex items-center gap-4 border border-[#24324F] bg-[#0B1220]/95 px-5 py-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur"
          initial={{ x: '-50%', y: -70, opacity: 0 }}
          animate={{ x: '-50%', y: 0, opacity: 1 }}
          exit={{ x: '-50%', y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <span className="h-8 w-1" style={{ backgroundColor: accent }} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8FA0BC]">
            {event.bugLabel ?? event.title}
          </span>
          <span className="text-2xl font-black tabular-nums text-[#EEF2F7]">{event.score}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export const ScoreFXLayer: React.FC<{ event: ScoreFXEvent | null }> = ({ event }) => (
  <div aria-hidden className="pointer-events-none fixed inset-0 z-[95] overflow-hidden">
    <AnimatePresence mode="wait">{event && <FXSequence key={event.id} event={event} />}</AnimatePresence>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Countdown → LIVE                                                            */
/* -------------------------------------------------------------------------- */

export const CountdownOverlay: React.FC<{
  onDone: () => void;
  teamA?: string;
  teamB?: string;
}> = ({ onDone, teamA, teamB }) => {
  const [step, setStep] = useState(0); // 0,1,2 -> "3","2","1"   3 -> "LIVE"

  // Keep the callback in a ref so a re-rendering parent can't restart the
  // countdown timer on every commit.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (step > 2) {
      const t = window.setTimeout(() => doneRef.current(), 850);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 780);
    return () => window.clearTimeout(t);
  }, [step]);

  const label = step > 2 ? 'LIVE' : String(3 - step);
  const isLive = step > 2;

  return (
    <motion.div
      className="fixed inset-0 z-[96] flex flex-col items-center justify-center bg-[#05070C]/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 text-center text-[11px] font-black uppercase tracking-[0.5em] text-[#5E6E86]">
        {teamA} <span className="text-[#D9A441]">vs</span> {teamB}
      </div>

      <div className="relative flex h-[46vmin] w-[46vmin] items-center justify-center">
        {!isLive &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={`${label}-${i}`}
              className="absolute inset-0 rounded-full border border-[#D9A441]/50"
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.24, ease: 'easeOut' }}
            />
          ))}

        <AnimatePresence mode="popLayout">
          <motion.span
            key={label}
            className={cn(
              'absolute font-black tabular-nums leading-none',
              isLive ? 'text-[#FFD21F]' : 'text-[#EEF2F7]',
            )}
            style={{
              fontSize: isLive ? 'clamp(3rem,14vmin,9rem)' : 'clamp(5rem,26vmin,17rem)',
              textShadow: isLive ? '0 0 70px rgba(255,210,31,0.55)' : '0 0 50px rgba(18,100,255,0.4)',
            }}
            initial={{ scale: 2.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.55, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-8 text-[11px] font-black uppercase tracking-[0.42em] text-[#D9A441]">
        {isLive ? 'Match is under way' : 'Get ready'}
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Full time                                                                   */
/* -------------------------------------------------------------------------- */

const CONFETTI_COLORS = ['#FFD21F', '#D9A441', '#1264FF', '#FF4D3D', '#EEF2F7'];

export const FinalOverlay: React.FC<{
  teamA: string;
  teamB: string;
  scoreA: number | string;
  scoreB: number | string;
  subtitle?: string;
  onClose: () => void;
}> = ({ teamA, teamB, scoreA, scoreB, subtitle, onClose }) => {
  const a = Number(scoreA);
  const b = Number(scoreB);
  const hasWinner = Number.isFinite(a) && Number.isFinite(b) && a !== b;
  const winner = !hasWinner ? null : a > b ? teamA : teamB;
  const margin = hasWinner ? Math.abs(a - b) : 0;

  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 0.9,
        duration: 1.7 + Math.random() * 1.5,
        spin: 360 + Math.random() * 900,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 9,
        skew: Math.random() * 60 - 30,
      })),
    [],
  );

  return (
    <motion.div
      className="fixed inset-0 z-[97] flex items-center justify-center overflow-hidden bg-[#05070C]/94 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0">
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className="absolute top-0 block"
            style={{
              left: p.left,
              width: p.size,
              height: p.size * 1.7,
              backgroundColor: p.color,
            }}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: p.spin, x: p.skew }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: Infinity, repeatDelay: 0.6 }}
          />
        ))}
      </div>

      <motion.div
        className="relative w-full max-w-3xl px-6 text-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* stamp */}
        <motion.div
          className="mx-auto mb-8 inline-block border-4 border-[#FF4D3D] px-6 py-2"
          initial={{ scale: 3, opacity: 0, rotate: -22 }}
          animate={{ scale: [3, 0.94, 1], opacity: 1, rotate: [-22, -6, -6] }}
          transition={{ duration: 0.55, times: [0, 0.7, 1], ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-lg font-black uppercase tracking-[0.4em] text-[#FF4D3D] sm:text-2xl">
            Final
          </span>
        </motion.div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <TeamLock name={teamA} score={scoreA} align="right" />
          <span className="text-3xl font-black text-[#5E6E86] sm:text-5xl">–</span>
          <TeamLock name={teamB} score={scoreB} align="left" />
        </div>

        <div className="mt-9 flex justify-center">
          <motion.div
            className="relative overflow-hidden px-7 py-3"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          >
            <span className="absolute inset-0 bg-[#D9A441]" />
            <span className="absolute inset-0 ol-sheen bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.75)_50%,transparent_75%)]" />
            <span className="relative text-sm font-black uppercase tracking-[0.3em] text-[#05070C]">
              {winner ? `${winner} win` : 'Draw'}
              {winner ? ` · by ${margin}` : ''}
            </span>
          </motion.div>
        </div>

        {subtitle && (
          <div className="mt-5 text-[11px] font-black uppercase tracking-[0.3em] text-[#5E6E86]">
            {subtitle}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-10 border border-[#24324F] px-8 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#8FA0BC] transition-colors hover:border-[#D9A441] hover:text-[#D9A441]"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

/** One side of the final scoreboard — the numeral locks with a snap. */
const TeamLock: React.FC<{
  name: string;
  score: number | string;
  align: 'left' | 'right';
}> = ({ name, score, align }) => (
  <div className={align === 'right' ? 'text-right' : 'text-left'}>
    <div className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#8FA0BC]">
      {name}
    </div>
    <motion.div
      className="text-[clamp(3.5rem,13vw,7.5rem)] font-black leading-none tabular-nums text-[#EEF2F7]"
      initial={{ scale: 1.4, opacity: 0, filter: 'blur(8px)' }}
      animate={{ scale: [1.4, 0.96, 1], opacity: 1, filter: 'blur(0px)' }}
      transition={{ delay: 0.3, duration: 0.6, times: [0, 0.7, 1], ease: [0.16, 1, 0.3, 1] }}
    >
      {score}
    </motion.div>
  </div>
);
