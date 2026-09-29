import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { OlympiaEmblem } from './OlympiaEmblem';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.76, 0, 0.24, 1];

const STAGES = [
  { at: 0, label: 'ESTABLISHING SECURE LINK' },
  { at: 26, label: 'SYNCING LIVE SCOREFEED' },
  { at: 52, label: 'LOADING 10 DISCIPLINES' },
  { at: 76, label: 'CALIBRATING ARENA LIGHTS' },
  { at: 100, label: 'ARENA READY' },
] as const;

const WORD = 'OLYMPIA'.split('');
const CODE = '2K26'.split('');

/**
 * Opening cinematic — the first ~3 seconds.
 *
 * 1. hairline ring draws against a live percentage
 * 2. status ticker steps through the boot sequence
 * 3. at 100% the mark blooms in with a metallic sweep and the wordmark
 *    resolves letter by letter
 * 4. "ENTER THE ARENA" arms itself; clicking wipes the curtain upward
 */
export const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const startedAt = useRef(performance.now());

  // Stepped, slightly irregular progress so it reads as real work.
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          return 100;
        }
        const elapsed = performance.now() - startedAt.current;
        const ceiling = elapsed > 1500 ? 100 : 92;
        const next = p + Math.round(Math.random() * 11) + 5;
        return Math.min(next, ceiling);
      });
    }, 130);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress < 100) return;
    const t = window.setTimeout(() => setIsReady(true), 460);
    return () => window.clearTimeout(t);
  }, [progress]);

  const enter = () => {
    if (!isReady || leaving) return;
    setLeaving(true);
    window.setTimeout(onComplete, 900);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const status = useMemo(
    () => [...STAGES].reverse().find((s) => progress >= s.at)?.label ?? STAGES[0].label,
    [progress],
  );

  // Ring geometry
  const R = 132;
  const CIRC = 2 * Math.PI * R;
  const dash = useMotionValue(0);
  const offset = useTransform(dash, (v: number) => CIRC - (CIRC * v) / 100);

  useEffect(() => {
    dash.set(progress);
  }, [progress, dash]);

  const ringProgress = useTransform(dash, [0, 100], [0, 100]);

  return (
    <motion.div
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 0.9, ease: EASE_IN_OUT }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#040B17]"
    >
      {/* --- stage ------------------------------------------------ */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(18,100,255,0.28) 0%, rgba(7,20,38,0.6) 45%, rgba(4,11,23,1) 78%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />
      {/* light sweep */}
      <motion.div
        aria-hidden
        initial={{ x: '-40%', opacity: 0 }}
        animate={{ x: '140%', opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute -top-1/4 h-[150%] w-[45%] blur-3xl"
        style={{
          background:
            'linear-gradient(100deg, rgba(217,164,65,0) 0%, rgba(217,164,65,0.16) 45%, rgba(255,210,31,0.22) 55%, rgba(217,164,65,0) 100%)',
        }}
      />

      {/* --- corner framing --------------------------------------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute left-8 top-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D9A441]"
        >
          <span className="w-6 h-px bg-[#D9A441]/60" />
          OLYMPIA 2K26
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="absolute right-8 top-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/35"
        >
          SYSTEM / ARENA LINK
        </motion.div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 1.4, ease: EASE_OUT }}
          className="absolute left-8 top-16 h-px w-24 origin-left bg-[#D9A441]/50"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 1.4, ease: EASE_OUT }}
          className="absolute right-8 top-16 h-px w-24 origin-right bg-[#D9A441]/50"
        />
      </div>

      {/* --- centre stage ----------------------------------------- */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative flex h-[300px] w-[300px] items-center justify-center sm:h-[340px] sm:w-[340px]">
          {/* progress ring */}
          <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
            <motion.circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke="url(#ol-ring-grad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              style={{ strokeDashoffset: offset }}
            />
            <defs>
              <linearGradient id="ol-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1264FF" />
                <stop offset="45%" stopColor="#D9A441" />
                <stop offset="100%" stopColor="#FFD21F" />
              </linearGradient>
            </defs>
          </svg>

          {/* counter-rotating dashed ring */}
          <motion.svg
            viewBox="0 0 300 300"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 h-full w-full"
          >
            <circle
              cx="150"
              cy="150"
              r="112"
              fill="none"
              stroke="rgba(217,164,65,0.35)"
              strokeWidth="1"
              strokeDasharray="2 14"
            />
          </motion.svg>

          {/* the mark blooms in at 100% */}
          <AnimatePresence>
            {isReady && (
              <motion.div
                key="emblem"
                initial={{ opacity: 0, scale: 0.55, filter: 'blur(14px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: EASE_OUT }}
                className="absolute flex items-center justify-center"
              >
                <div className="w-[168px] sm:w-[190px]">
                  <OlympiaEmblem orbits breathe={false} depth={0} tilt={0} />
                </div>
                {/* metallic sweep across the reveal */}
                <motion.span
                  initial={{ x: '-130%', opacity: 0 }}
                  animate={{ x: '130%', opacity: [0, 1, 0] }}
                  transition={{ duration: 1.1, delay: 0.35, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-[-10%] w-[45%] skew-x-[-18deg]"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
                    mixBlendMode: 'overlay',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* percentage */}
          <AnimatePresence mode="wait">
            {!isReady && (
              <motion.div
                key="pct"
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-start font-black leading-none tracking-tighter text-white">
                  <motion.span
                    key={Math.floor(progress)}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-6xl sm:text-7xl tabular-nums"
                  >
                    {Math.floor(progress)}
                  </motion.span>
                  <span className="ml-1 mt-1 text-lg font-bold text-[#D9A441]">%</span>
                </div>
                <div className="mt-3 h-4 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={status}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D9A441]/85 whitespace-nowrap"
                    >
                      {status}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- wordmark ------------------------------------------- */}
        <div className="mt-8 flex flex-col items-center">
          <div className="flex overflow-hidden pb-1">
            {WORD.map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                initial={{ y: '110%', opacity: 0 }}
                animate={isReady ? { y: '0%', opacity: 1 } : { y: '110%', opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: EASE_OUT }}
                className="text-4xl sm:text-6xl font-black leading-none tracking-[-0.04em] text-white"
                style={{ textShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isReady ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-2 flex items-center gap-3"
          >
            <span className="h-px w-8 bg-[#D9A441]/50" />
            <span
              className="text-lg sm:text-2xl font-black tracking-[0.42em] text-[#D9A441] pr-[0.42em]"
              style={{
                background: 'linear-gradient(100deg, #9A6A18 0%, #FFD21F 45%, #D9A441 70%, #FFF0BC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {CODE.join('')}
            </span>
            <span className="h-px w-8 bg-[#D9A441]/50" />
          </motion.div>
        </div>

        {/* --- CTA ------------------------------------------------- */}
        <div className="mt-10 h-14">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.button
                key="enter"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                onClick={enter}
                data-cursor-label="ENTER"
                className="group relative overflow-hidden px-9 py-4 focus:outline-none"
              >
                <span className="absolute inset-0 border border-[#D9A441]/70" />
                <span className="absolute inset-0 origin-left scale-x-0 bg-[#D9A441] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
                <span className="relative z-10 flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-[#D9A441] transition-colors duration-300 group-hover:text-[#040B17]">
                  ENTER THE ARENA
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </span>
                <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#FFD21F] to-transparent opacity-70" />
              </motion.button>
            ) : (
              <motion.div
                key="bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <span className="block h-px w-40 overflow-hidden bg-white/10 sm:w-56">
                  <motion.span
                    className="block h-full origin-left bg-gradient-to-r from-[#1264FF] via-[#D9A441] to-[#FFD21F]"
                    style={{ scaleX: ringProgress }}
                  />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">LOADING</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- bottom rail ------------------------------------------ */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-10">
        <div className="flex items-end justify-between text-[9px] font-black uppercase tracking-[0.28em] text-white/25">
          <span>THE DIGITAL ARENA</span>
          <span className="hidden sm:inline">ONE FESTIVAL. EVERY SPORT. ALL HEART.</span>
          <span className="tabular-nums text-[#D9A441]/70">{String(Math.floor(progress)).padStart(3, '0')} / 100</span>
        </div>
        <div className="mt-3 h-px w-full bg-white/8">
          <motion.div
            className="h-full origin-left"
            style={{ scaleX: ringProgress }}
          >
            <div className="h-full w-full bg-gradient-to-r from-[#1264FF] via-[#D9A441] to-[#FFD21F]" />
          </motion.div>
        </div>
      </div>

      {/* gold edge that leads the curtain as it lifts */}
      {leaving && (
        <motion.div
          initial={{ bottom: '0%' }}
          animate={{ bottom: '100%' }}
          transition={{ duration: 0.9, ease: EASE_IN_OUT }}
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD21F] to-transparent"
        />
      )}
    </motion.div>
  );
};

export default LoadingScreen;
