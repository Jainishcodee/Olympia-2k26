import React, { useCallback, useEffect } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { OlympiaEmblem } from './OlympiaEmblem';
import { SportsObjects } from './SportsObjects';
import { LiveScoreHUD } from './LiveScoreHUD';
import { BRAND, useImageSrc } from './BrandAssets';
import { useTheme } from '@/contexts/ThemeContext';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const WORD = 'OLYMPIA'.split('');
const CODE = '2K26'.split('');

/** Letter-by-letter mask reveal used by the wordmark and the code. */
const RevealText: React.FC<{
  text: string[];
  className?: string;
  delay?: number;
  step?: number;
  style?: React.CSSProperties;
  letterClassName?: string;
}> = ({ text, className = '', delay = 0, step = 0.055, style, letterClassName = '' }) => (
  <span className={`flex overflow-hidden ${className}`} style={style}>
    {text.map((ch, i) => (
      <motion.span
        key={`${ch}-${i}`}
        initial={{ y: '115%', opacity: 0, rotate: 3 }}
        animate={{ y: '0%', opacity: 1, rotate: 0 }}
        transition={{ duration: 0.9, delay: delay + i * step, ease: EASE_OUT }}
        className={letterClassName}
      >
        {ch}
      </motion.span>
    ))}
  </span>
);

export const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const { theme } = useTheme();
  const nightBackdrop = useImageSrc(BRAND.heroBackdrop);
  const backdrop = theme === 'day' ? BRAND.arena : nightBackdrop;

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
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#040B17]">
      {/* ============ L0 — environment (slowest, drifts against the pointer) ============ */}
      <motion.div style={{ y: backdropY, scale: backdropScale, opacity: backdropOpacity }} className="absolute inset-0">
        <motion.div style={{ x: backdropX, y: backdropMY }} className="absolute inset-0">
        {backdrop ? (
          <img src={backdrop} alt="" draggable={false} className="h-full w-full object-cover opacity-[0.42]" />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(ellipse 120% 80% at 50% 118%, rgba(18,100,255,0.42) 0%, rgba(7,20,38,0.9) 46%, #040B17 78%)',
            }}
          />
        )}
        {/* stadium floor haze */}
        <div
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: 'linear-gradient(0deg, #040B17 4%, rgba(4,11,23,0.55) 45%, rgba(4,11,23,0) 100%)' }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[32%]"
          style={{ background: 'linear-gradient(180deg, #040B17 0%, rgba(4,11,23,0.6) 45%, rgba(4,11,23,0) 100%)' }}
        />
        </motion.div>
      </motion.div>

      {/* ============ L1 — atmosphere (slow) ============ */}
      <motion.div style={{ y: atmosphereY, opacity: atmosphereOpacity }} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-[18%] h-[70vmin] w-[70vmin] -translate-x-1/2 rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(18,100,255,0.35) 0%, rgba(18,100,255,0) 70%)' }}
        />
        <div
          className="absolute -left-[10%] bottom-[6%] h-[55vmin] w-[55vmin] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(255,210,31,0.22) 0%, rgba(255,210,31,0) 70%)' }}
        />
        <div
          className="absolute -right-[8%] top-[34%] h-[45vmin] w-[45vmin] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(255,106,0,0.18) 0%, rgba(255,106,0,0) 70%)' }}
        />
        {/* horizon line */}
        <div className="absolute inset-x-0 top-[64%] h-px bg-gradient-to-r from-transparent via-[#D9A441]/25 to-transparent" />
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
        className="pointer-events-none absolute left-1/2 top-[31%] z-10 w-[min(48vh,68vw,460px)] -translate-x-1/2 -translate-y-1/2"
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
        className="relative z-20 flex h-full w-full flex-col items-center justify-center px-5 pb-[17vh] pt-[10vh] text-center"
      >
        {/* legibility scrim so the mark never fights the type */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[240%] w-[140%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'radial-gradient(ellipse 50% 46% at 50% 50%, rgba(4,11,23,0.94) 0%, rgba(4,11,23,0.78) 42%, rgba(4,11,23,0) 76%)',
          }}
        />

        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE_OUT }}
          className="relative mb-4 flex items-center gap-3 sm:gap-4"
        >
          <span className="h-px w-6 sm:w-14 bg-[#D9A441]/60" />
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.42em] text-[#D9A441] sm:tracking-[0.5em]">
            THE STAGE IS SET / 2026
          </span>
          <span className="h-px w-6 sm:w-14 bg-[#D9A441]/60" />
        </motion.div>

        {/* wordmark */}
        <div className="relative">
          <RevealText
            text={WORD}
            delay={0.85}
            className="justify-center"
            letterClassName="text-[clamp(3.4rem,15vw,11.5rem)] font-black leading-[0.86] tracking-[-0.055em] text-white"
            style={{ textShadow: '0 18px 60px rgba(0,0,0,0.75)' }}
          />
          <motion.div
            initial={{ opacity: 0, letterSpacing: '1.4em' }}
            animate={{ opacity: 1, letterSpacing: '0.24em' }}
            transition={{ duration: 1.1, delay: 1.35, ease: EASE_OUT }}
            className="mt-1 flex items-center justify-center gap-3 sm:gap-5"
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D9A441]/70" />
            <span
              className="pr-[0.24em] text-[clamp(1.1rem,3.6vw,2.6rem)] font-black leading-none"
              style={{
                background: 'linear-gradient(100deg, #8C5F14 0%, #FFD21F 38%, #D9A441 62%, #FFF3C9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 6px 24px rgba(217,164,65,0.35))',
              }}
            >
              {CODE.join('')}
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#D9A441]/70" />
          </motion.div>
        </div>

        {/* tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: EASE_OUT }}
          className="relative mt-6 max-w-xl"
        >
          <p className="text-[11px] sm:text-sm font-black uppercase tracking-[0.26em] text-white/70">
            One festival. Every sport. All heart.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-white/45">
            The arena is alive. Make your moment count.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8, ease: EASE_OUT }}
          className="relative mt-8"
        >
          <Link
            to="/live"
            data-cursor-label="ENTER"
            className="group relative inline-flex items-center gap-3 overflow-hidden border border-[#D9A441]/70 px-8 py-4 backdrop-blur-sm focus:outline-none"
          >
            <span className="absolute inset-0 origin-left scale-x-0 bg-[#D9A441] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
            <span className="absolute inset-0 bg-[#040B17]/40" />
            <span className="relative z-10 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-[#D9A441] transition-colors duration-300 group-hover:text-[#040B17]">
              EXPLORE LIVE SCORES
            </span>
            <motion.span
              className="relative z-10 text-[#D9A441] transition-colors duration-300 group-hover:text-[#040B17]"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              ↓
            </motion.span>
          </Link>
        </motion.div>
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
        <span className="mb-3 text-[9px] font-black uppercase tracking-[0.34em] text-white/35">Scroll</span>
        <span className="relative block h-14 w-px overflow-hidden bg-white/10">
          <motion.span
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-0 h-full bg-gradient-to-b from-transparent via-[#D9A441] to-transparent"
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
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D9A441]/80">10 DISCIPLINES</div>
        <div className="mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/25">01 / THE ARENA</div>
      </motion.div>

      {/* ============ grade & grain (static) ============ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          background:
            'radial-gradient(ellipse 82% 70% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
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
