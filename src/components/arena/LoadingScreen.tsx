import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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

export const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const startedAt = useRef(performance.now());
  const navigate = useNavigate();

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
    if (leaving) return;
    setLeaving(true);
    onComplete();
    navigate('/');
  };

  const goToAdmin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (leaving) return;
    setLeaving(true);
    onComplete();
    navigate('/admin/login');
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: '#D6E5F1',
        backgroundImage:
          'linear-gradient(180deg, #5F82B5 0%, #7FA2C7 20%, #8FAFCE 38%, #B5CCE1 58%, #D6E5F1 78%, #F5F8FA 100%)',
      }}
    >
      {/* --- Soft Atmospheric Corner Depth (Edges remain around #496B99 - #5F82B5, never dark navy) --- */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 38%, rgba(127, 162, 199, 0.22) 72%, rgba(73, 107, 153, 0.32) 100%)',
        }}
      />

      {/* --- Atmospheric Horizon Sunlight Glow (Soft blue + warm white dawn blend) --- */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[10%] h-[50%] pointer-events-none blur-[80px]"
        style={{
          background:
            'radial-gradient(ellipse 120% 70% at 50% 100%, rgba(255, 255, 255, 0.92) 0%, rgba(255, 248, 232, 0.5) 30%, rgba(214, 229, 241, 0.4) 62%, transparent 88%)',
        }}
      />

      {/* --- Soft Luminous Environment Behind the Olympia Logo --- */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full blur-[85px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(245, 248, 250, 0.7) 35%, rgba(169, 196, 223, 0.35) 65%, transparent 85%)',
        }}
      />

      {/* --- Very Subtle Atmospheric Micro-Grain --- */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* --- Gentle Sunlight Sweep --- */}
      <motion.div
        aria-hidden
        initial={{ x: '-40%', opacity: 0 }}
        animate={{ x: '140%', opacity: [0, 0.35, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -top-1/4 h-[150%] w-[40%] blur-3xl pointer-events-none"
        style={{
          background:
            'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* --- Corner Framing & Header Details (Olympia Navy & Gold) --- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute left-8 top-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#071426]"
        >
          <span className="w-6 h-px bg-[#D9A441]" />
          OLYMPIA 2K26
        </motion.div>
        <motion.button
          type="button"
          onClick={goToAdmin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="absolute right-8 top-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#071426]/60 hover:text-[#1264FF] transition-colors pointer-events-auto cursor-pointer"
        >
          SPORTS SECRETARY ↗
        </motion.button>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 1.4, ease: EASE_OUT }}
          className="absolute left-8 top-16 h-px w-24 origin-left bg-[#071426]/15"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 1.4, ease: EASE_OUT }}
          className="absolute right-8 top-16 h-px w-24 origin-right bg-[#071426]/15"
        />
      </div>

      {/* --- Centre Stage ----------------------------------------- */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative flex h-[300px] w-[300px] items-center justify-center sm:h-[340px] sm:w-[340px]">
          {/* Progress ring with clean light track and Olympia brand gradient */}
          <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(7, 20, 38, 0.12)" strokeWidth="1.5" />
            <motion.circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke="url(#ol-ring-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              style={{ strokeDashoffset: offset }}
            />
            <defs>
              <linearGradient id="ol-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1264FF" />
                <stop offset="45%" stopColor="#071426" />
                <stop offset="75%" stopColor="#D9A441" />
                <stop offset="100%" stopColor="#FFD21F" />
              </linearGradient>
            </defs>
          </svg>

          {/* Counter-rotating subtle gold dashed ring */}
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
              stroke="rgba(217, 164, 65, 0.55)"
              strokeWidth="1"
              strokeDasharray="2 14"
            />
          </motion.svg>

          {/* The emblem blooms in at 100% */}
          <AnimatePresence>
            {isReady && (
              <motion.div
                key="emblem"
                initial={{ opacity: 0, scale: 0.55, filter: 'blur(14px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: EASE_OUT }}
                className="absolute flex items-center justify-center"
              >
                <div className="w-[175px] sm:w-[200px]">
                  <OlympiaEmblem orbits breathe={false} depth={0} tilt={0} />
                </div>
                {/* Luminous light sweep across the reveal */}
                <motion.span
                  initial={{ x: '-130%', opacity: 0 }}
                  animate={{ x: '130%', opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.1, delay: 0.35, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-[-10%] w-[45%] skew-x-[-18deg]"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
                    mixBlendMode: 'overlay',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Percentage readout */}
          <AnimatePresence mode="wait">
            {!isReady && (
              <motion.div
                key="pct"
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-start font-black leading-none tracking-tighter text-[#071426]">
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
                      className="text-[10px] font-black uppercase tracking-[0.28em] text-[#071426]/75 whitespace-nowrap"
                    >
                      {status}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- 2 Action Buttons (Enter Arena & Sports Secretary) --- */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                {/* Button 1: Enter Arena (Player / Fan Entry) */}
                <button
                  onClick={enter}
                  data-cursor-label="ARENA"
                  className="group relative overflow-hidden px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl border border-[#D9A441] bg-gradient-to-r from-[#FFD21F] via-[#FFE27A] to-[#D9A441] text-[#071426] font-black tracking-[0.22em] uppercase text-xs transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_25px_rgba(217,164,65,0.35)] hover:shadow-[0_12px_32px_rgba(217,164,65,0.55)] focus:outline-none"
                >
                  <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-[#FFD21F] to-[#FFFFFF] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
                  <span className="relative z-10 flex items-center gap-2.5 font-black text-[#071426]">
                    <span>ENTER THE ARENA</span>
                    <span className="text-sm transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>

                {/* Button 2: Sports Secretary (Admin Login Portal) */}
                <button
                  onClick={goToAdmin}
                  data-cursor-label="ADMIN"
                  className="group relative overflow-hidden px-7 py-3.5 sm:px-9 sm:py-4 rounded-xl border border-[#071426]/20 bg-[#071426] text-white font-black tracking-[0.2em] uppercase text-xs transition-all duration-300 hover:border-[#1264FF] hover:bg-[#1264FF] hover:scale-[1.02] shadow-[0_8px_25px_rgba(7,20,38,0.2)] hover:shadow-[0_10px_30px_rgba(18,100,255,0.35)] focus:outline-none"
                >
                  <span className="absolute inset-0 origin-left scale-x-0 bg-[#1264FF] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
                  <span className="relative z-10 flex items-center gap-2">
                    <span>SPORTS SECRETARY</span>
                    <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">↗</span>
                  </span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 py-4"
              >
                <span className="block h-px w-44 overflow-hidden bg-[#071426]/12 sm:w-60">
                  <motion.span
                    className="block h-full origin-left bg-gradient-to-r from-[#1264FF] via-[#071426] to-[#D9A441]"
                    style={{ scaleX: ringProgress }}
                  />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#071426]/50">LOADING</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Bottom Rail ------------------------------------------ */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-10">
        <div className="flex items-end justify-between text-[9px] font-black uppercase tracking-[0.28em] text-[#071426]/55">
          <span>THE DIGITAL ARENA</span>
          <span className="hidden sm:inline">ONE FESTIVAL. EVERY SPORT. ALL HEART.</span>
          <span className="tabular-nums text-[#071426]/80 font-black">{String(Math.floor(progress)).padStart(3, '0')} / 100</span>
        </div>
        <div className="mt-3 h-px w-full bg-[#071426]/12">
          <motion.div
            className="h-full origin-left"
            style={{ scaleX: ringProgress }}
          >
            <div className="h-full w-full bg-gradient-to-r from-[#1264FF] via-[#071426] to-[#D9A441]" />
          </motion.div>
        </div>
      </div>

      {/* Radiant golden-white edge that leads the curtain as it lifts */}
      {leaving && (
        <motion.div
          initial={{ bottom: '0%' }}
          animate={{ bottom: '100%' }}
          transition={{ duration: 0.9, ease: EASE_IN_OUT }}
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD21F] to-transparent shadow-[0_0_12px_#FFD21F]"
        />
      )}
    </motion.div>
  );
};

export default LoadingScreen;
