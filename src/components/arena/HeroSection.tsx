import React, { useCallback, useEffect } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { OlympiaEmblem } from './OlympiaEmblem';
import { SportsObjects } from './SportsObjects';
import { LiveScoreHUD } from './LiveScoreHUD';
import { BRAND, useImageSrc } from './BrandAssets';
import { useTheme } from '@/contexts/ThemeContext';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const nightBackdrop = useImageSrc(BRAND.heroBackdrop);
  const backdrop = isDay ? BRAND.arena : nightBackdrop;

  /* ---- pointer: raw values are written imperatively so the hero
         never re-renders on mousemove. Springs do the smoothing. --- */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 55, damping: 20, mass: 0.7 });
  const my = useSpring(rawY, { stiffness: 55, damping: 20, mass: 0.7 });

  const onPointerMove = useCallback(
    (e: MouseEvent) => {
      if ((e as PointerEvent).pointerType === 'touch') return;
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    },
    [rawX, rawY],
  );

  useEffect(() => {
    window.addEventListener('mousemove', onPointerMove);
    return () => window.removeEventListener('mousemove', onPointerMove);
  }, [onPointerMove]);

  /* ---- scroll: one shared scroll value, many different rates ------- */
  const backdropY = useTransform(scrollY, [0, 900], [0, 150]);
  const backdropScale = useTransform(scrollY, [0, 900], [1.08, 1.2]);
  const backdropOpacity = useTransform(scrollY, [0, 720], [1, 0.15]);
  // opposite sign to the emblem: the far layer recoils from the pointer
  const backdropX = useTransform(mx, [-1, 1], [16, -16]);
  const backdropMY = useTransform(my, [-1, 1], [10, -10]);

  const atmosphereY = useTransform(scrollY, [0, 900], [0, 70]);
  const atmosphereOpacity = useTransform(scrollY, [0, 620], [1, 0]);

  const emblemY = useTransform(scrollY, [0, 900], [0, 300]);
  const emblemScale = useTransform(scrollY, [0, 900], [1, 0.76]);
  const emblemRotate = useTransform(scrollY, [0, 900], [0, -9]);
  const emblemOpacity = useTransform(scrollY, [0, 640], [1, 0]);
  const emblemBlur = useTransform(scrollY, (v: number) => {
    const t = Math.min(1, Math.max(0, (v - 240) / 400));
    return `blur(${(t * 9).toFixed(2)}px)`;
  });

  const copyY = useTransform(scrollY, [0, 900], [0, 470]);
  const copyOpacity = useTransform(scrollY, [0, 430], [1, 0]);

  const hudY = useTransform(scrollY, [0, 900], [0, 560]);
  const hudOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0]);

  return (
    <section
      className={`relative h-[100svh] min-h-[640px] w-full overflow-hidden transition-colors duration-500 ${
        isDay ? 'bg-gradient-to-b from-[#7FA2C7] via-[#A9C4DF] via-35% via-[#D6E5F1] via-70% to-[#F5F8FA] text-[#071426]' : 'bg-[#040B17] text-white'
      }`}
    >
      {/* ============ L0 — environment (slowest, drifts against the pointer) ============ */}
      <motion.div style={{ y: backdropY, scale: backdropScale, opacity: backdropOpacity }} className="absolute inset-0">
        <motion.div style={{ x: backdropX, y: backdropMY }} className="absolute inset-0">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              draggable={false}
              className={`h-full w-full object-cover ${isDay ? 'opacity-[0.32] mix-blend-multiply' : 'opacity-[0.42]'}`}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: isDay
                  ? 'radial-gradient(ellipse 130% 90% at 50% 100%, rgba(255, 255, 255, 0.95) 0%, rgba(245, 248, 250, 0.7) 35%, rgba(214, 229, 241, 0.5) 65%, #A9C4DF 100%)'
                  : 'radial-gradient(ellipse 120% 80% at 50% 118%, rgba(18,100,255,0.42) 0%, rgba(7,20,38,0.9) 46%, #040B17 78%)',
              }}
            />
          )}

          {/* stadium floor haze & soft blue-hour horizon blend */}
          <div
            className="absolute inset-x-0 bottom-0 h-[48%]"
            style={{
              background: isDay
                ? 'linear-gradient(0deg, rgba(245,248,250,0.98) 5%, rgba(245,248,250,0.65) 45%, rgba(245,248,250,0) 100%)'
                : 'linear-gradient(0deg, #040B17 4%, rgba(4,11,23,0.55) 45%, rgba(4,11,23,0) 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[36%]"
            style={{
              background: isDay
                ? 'linear-gradient(180deg, rgba(95,130,181,0.5) 0%, rgba(127,162,199,0.25) 45%, rgba(214,229,241,0) 100%)'
                : 'linear-gradient(180deg, #040B17 0%, rgba(4,11,23,0.6) 45%, rgba(4,11,23,0) 100%)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* ============ L1 — atmosphere (Blue Hour Sky + Soft Sunlight Diffusion) ============ */}
      <motion.div style={{ y: atmosphereY, opacity: atmosphereOpacity }} className="absolute inset-0 pointer-events-none">
        {/* Luminous Sunlight Core */}
        <div
          className="absolute left-1/2 top-[24%] h-[75vmin] w-[75vmin] -translate-x-1/2 rounded-full blur-[85px]"
          style={{
            background: isDay
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(245, 248, 250, 0.65) 40%, rgba(214, 229, 241, 0) 75%)'
              : 'radial-gradient(circle, rgba(18,100,255,0.35) 0%, rgba(18,100,255,0) 70%)',
          }}
        />
        {/* Soft Twilight Blue Haze */}
        <div
          className="absolute -left-[10%] bottom-[8%] h-[60vmin] w-[60vmin] rounded-full blur-[100px]"
          style={{
            background: isDay
              ? 'radial-gradient(circle, rgba(169, 196, 223, 0.35) 0%, rgba(214, 229, 241, 0.2) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(255,210,31,0.22) 0%, rgba(255,210,31,0) 70%)',
          }}
        />
        {/* Subtle Warm Horizon Ambient */}
        <div
          className="absolute -right-[8%] top-[28%] h-[50vmin] w-[50vmin] rounded-full blur-[100px]"
          style={{
            background: isDay
              ? 'radial-gradient(circle, rgba(255, 248, 232, 0.45) 0%, rgba(245, 248, 250, 0.25) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(255,106,0,0.18) 0%, rgba(255,106,0,0) 70%)',
          }}
        />
        {/* Horizon Line */}
        <div
          className={`absolute inset-x-0 top-[64%] h-px ${
            isDay
              ? 'bg-gradient-to-r from-transparent via-[#D9A441]/40 to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#D9A441]/25 to-transparent'
          }`}
        />
      </motion.div>

      {/* ============ L2 — sports objects (mid) ============ */}
      <SportsObjects mx={mx} my={my} scrollY={scrollY} />

      {/* ============ L3 — the emblem (hero object) ============ */}
      <motion.div
        style={{
          y: emblemY,
          scale: emblemScale,
          rotate: emblemRotate,
          opacity: emblemOpacity,
          filter: emblemBlur,
        }}
        className="pointer-events-none absolute left-1/2 top-[42%] z-10 w-[min(54vh,74vw,490px)] -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.82, filter: 'blur(18px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, delay: 0.15, ease: EASE_OUT }}
          className="interactive"
          data-cursor-label="OLYMPIA"
        >
          <OlympiaEmblem mx={mx} my={my} depth={34} tilt={14} />
        </motion.div>
      </motion.div>

      {/* ============ L4 — typography (fastest) ============ */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-20 flex h-full w-full flex-col items-center justify-between px-5 pb-[8vh] pt-[12vh] text-center pointer-events-none"
      >
        {/* eyebrow at top */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE_OUT }}
          className="relative mb-4 flex items-center gap-3 sm:gap-4 pointer-events-auto"
        >
          <span className={`h-px w-6 sm:w-14 ${isDay ? 'bg-[#071426]/30' : 'bg-[#D9A441]/60'}`} />
          <span
            className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.42em] sm:tracking-[0.5em] ${
              isDay ? 'text-[#071426]' : 'text-[#D9A441]'
            }`}
          >
            THE STAGE IS SET / 2026
          </span>
          <span className={`h-px w-6 sm:w-14 ${isDay ? 'bg-[#071426]/30' : 'bg-[#D9A441]/60'}`} />
        </motion.div>

        {/* Center spacer so emblem breathes in the center */}
        <div className="flex-1" />

        {/* bottom info & CTA */}
        <div className="relative flex flex-col items-center pointer-events-auto">
          {/* tagline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: EASE_OUT }}
            className="relative max-w-xl"
          >
            <p
              className={`text-[11px] sm:text-sm font-black uppercase tracking-[0.26em] ${
                isDay ? 'text-[#071426]' : 'text-white/80'
              }`}
            >
              One festival. Every sport. All heart.
            </p>
            <p className={`mt-1 text-xs sm:text-sm ${isDay ? 'text-[#071426]/70' : 'text-white/50'}`}>
              The arena is alive. Make your moment count.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.5, ease: EASE_OUT }}
            className="relative mt-6"
          >
            <Link
              to="/live"
              data-cursor-label="ENTER"
              className={`group relative inline-flex items-center gap-3 overflow-hidden px-8 py-4 backdrop-blur-md focus:outline-none transition-all duration-300 ${
                isDay
                  ? 'border border-[#071426]/20 bg-white/75 shadow-[0_12px_35px_rgba(7,20,38,0.12)] hover:shadow-[0_16px_45px_rgba(18,100,255,0.22)]'
                  : 'border border-[#D9A441]/70 bg-[#040B17]/40 shadow-[0_12px_35px_rgba(0,0,0,0.6)]'
              }`}
            >
              <span
                className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100 ${
                  isDay ? 'bg-[#071426]' : 'bg-[#D9A441]'
                }`}
              />
              <span
                className={`relative z-10 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] transition-colors duration-300 ${
                  isDay
                    ? 'text-[#071426] group-hover:text-[#FFD21F]'
                    : 'text-[#D9A441] group-hover:text-[#040B17]'
                }`}
              >
                EXPLORE LIVE SCORES
              </span>
              <motion.span
                className={`relative z-10 transition-colors duration-300 ${
                  isDay
                    ? 'text-[#155EEF] group-hover:text-[#FFD21F]'
                    : 'text-[#D9A441] group-hover:text-[#040B17]'
                }`}
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                ↓
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ============ L5 — broadcast HUD ============ */}
      <motion.div
        style={{ y: hudY, opacity: hudOpacity }}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 2, ease: EASE_OUT }}
        className="absolute bottom-8 left-5 z-30 hidden w-[330px] sm:block lg:bottom-12 lg:left-10 lg:w-[380px]"
      >
        <LiveScoreHUD />
      </motion.div>

      {/* ============ scroll cue ============ */}
      <motion.div
        style={{ opacity: cueOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center md:flex"
      >
        <span
          className={`mb-3 text-[9px] font-black uppercase tracking-[0.34em] ${
            isDay ? 'text-[#071426]/50' : 'text-white/35'
          }`}
        >
          Scroll
        </span>
        <span
          className={`relative block h-14 w-px overflow-hidden ${
            isDay ? 'bg-[#071426]/15' : 'bg-white/10'
          }`}
        >
          <motion.span
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-x-0 h-full bg-gradient-to-b from-transparent ${
              isDay ? 'via-[#155EEF]' : 'via-[#D9A441]'
            } to-transparent`}
          />
        </span>
      </motion.div>

      {/* ============ edge meta ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="pointer-events-none absolute bottom-8 right-5 z-30 hidden text-right lg:block lg:right-10"
      >
        <div
          className={`text-[9px] font-black uppercase tracking-[0.3em] ${
            isDay ? 'text-[#155EEF]' : 'text-[#D9A441]/80'
          }`}
        >
          10 DISCIPLINES
        </div>
        <div
          className={`mt-1 text-[9px] font-black uppercase tracking-[0.3em] ${
            isDay ? 'text-[#071426]/40' : 'text-white/25'
          }`}
        >
          01 / THE ARENA
        </div>
      </motion.div>

      {/* ============ grade & grain (static) ============ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          background: isDay
            ? 'radial-gradient(ellipse 82% 70% at 50% 50%, rgba(255,255,255,0) 40%, rgba(200,222,246,0.3) 100%)'
            : 'radial-gradient(ellipse 82% 70% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 opacity-[0.045] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />
    </section>
  );
};

export default HeroSection;
