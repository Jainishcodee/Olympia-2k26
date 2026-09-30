import React, { useCallback, useEffect } from 'react';
import { motion, MotionValue, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { OlympiaEmblem } from './OlympiaEmblem';
import { useTheme } from '@/contexts/ThemeContext';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const RevealText: React.FC<{
  text: string[];
  delay?: number;
  className?: string;
  letterClassName?: string;
}> = ({ text, delay = 0, className = '', letterClassName = '' }) => (
  <span className={`inline-flex flex-wrap ${className}`}>
    {text.map((char, i) => (
      <motion.span
        key={i}
        initial={{ y: '108%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{
          duration: 0.85,
          delay: delay + i * 0.04,
          ease: EASE_OUT,
        }}
        className={`inline-block overflow-hidden ${letterClassName}`}
      >
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    ))}
  </span>
);

export const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  /* ---- pointer motion smoothing ---------------------------------- */
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

  /* ---- scroll animations ----------------------------------------- */
  const copyY = useTransform(scrollY, [0, 800], [0, 220]);
  const copyOpacity = useTransform(scrollY, [0, 480], [1, 0]);
  const emblemY = useTransform(scrollY, [0, 800], [0, 160]);
  const emblemRotate = useTransform(scrollY, [0, 800], [0, -7]);
  const ringX = useTransform(mx, [-1, 1], [-18, 18]);
  const ringY = useTransform(my, [-1, 1], [-12, 12]);

  return (
    <section
      className={`relative h-[100svh] min-h-[720px] overflow-hidden transition-colors duration-500 ${
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#040B17] text-white'
      }`}
    >
      {/* Background field lines */}
      <div
        aria-hidden
        className={`absolute inset-0 pointer-events-none ${
          isDay ? 'opacity-70 ol-day-field' : 'opacity-40 ol-night-field'
        }`}
      />

      {/* Subtle orbital atmosphere rings (clean, zero random stones) */}
      <motion.div
        style={{ x: ringX, y: ringY }}
        aria-hidden
        className={`absolute rounded-full border pointer-events-none transition-all duration-500
          left-1/2 -translate-x-1/2 top-[16%] h-[320px] w-[320px] sm:h-[420px] sm:w-[420px]
          lg:left-auto lg:translate-x-0 lg:-right-[16vw] lg:top-[8%] lg:h-[62vw] lg:w-[62vw] lg:max-h-[820px] lg:max-w-[820px] ${
          isDay ? 'border-[#155EEF]/15' : 'border-[#1264FF]/20'
        }`}
      />
      <div
        aria-hidden
        className={`absolute rounded-full border border-dashed pointer-events-none transition-all duration-500
          left-1/2 -translate-x-1/2 top-[20%] h-[240px] w-[240px] sm:h-[320px] sm:w-[320px]
          lg:left-auto lg:translate-x-0 lg:right-[7%] lg:top-[18%] lg:h-[44vw] lg:w-[44vw] lg:max-h-[570px] lg:max-w-[570px] ${
          isDay ? 'border-[#155EEF]/20' : 'border-[#D9A441]/25'
        }`}
      />

      {/* Olympia Emblem: Positioned in the MIDDLE on mobile (< lg), and on the SIDE on desktop (lg:) */}
      <motion.div
        style={{ y: emblemY, rotate: emblemRotate }}
        className="pointer-events-none absolute z-10 transition-all duration-500
          left-1/2 -translate-x-1/2 top-[21%] sm:top-[23%] w-[240px] sm:w-[310px] opacity-100
          lg:left-auto lg:right-[4%] lg:top-[24%] lg:translate-x-0 lg:w-[min(48vw,560px)] lg:z-20"
      >
        <OlympiaEmblem mx={mx} my={my} depth={22} tilt={10} />
      </motion.div>

      {/* Main Editorial Content */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-20 flex h-full flex-col justify-between px-5 pb-8 pt-24 sm:px-10 lg:px-14 lg:pt-32"
      >
        {/* Top Eyebrow Header Line */}
        <div
          className={`flex items-center justify-between border-y py-3 text-[9px] font-black uppercase tracking-[0.26em] sm:text-[10px] ${
            isDay ? 'border-[#071426]/15 text-[#071426]' : 'border-white/15 text-white/80'
          }`}
        >
          <span>OLYMPIA 2K26 / ANNUAL SPORTS FESTIVAL</span>
          <span className="hidden sm:block">SWIPE / SELECT / EXPLORE ↗</span>
        </div>

        {/* Main Headline & Information */}
        <div className="relative flex flex-1 flex-col justify-end lg:justify-center items-center lg:items-start text-center lg:text-left lg:max-w-[65%] pb-4 lg:pb-0">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, ease: EASE_OUT }}
            className={`mb-3 lg:mb-5 text-[10px] font-black uppercase tracking-[0.32em] sm:text-xs ${
              isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
            }`}
          >
            The stage is set / 2026
          </motion.p>

          <div className="relative z-10 text-[clamp(3.4rem,10.5vw,14rem)] font-black leading-[0.8] tracking-[-0.08em] flex flex-col items-center lg:items-start">
            <RevealText
              text={'YOUR'.split('')}
              delay={0.45}
              className="justify-center lg:justify-start"
              letterClassName={isDay ? 'text-[#155EEF]' : 'text-[#1264FF]'}
            />
            <RevealText
              text={'PLAY.'.split('')}
              delay={0.7}
              className="justify-center lg:justify-start"
              letterClassName={isDay ? 'text-[#071426]' : 'text-white'}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, ease: EASE_OUT }}
            className="mt-6 sm:mt-8 lg:mt-10 flex flex-col lg:flex-row items-center lg:items-end gap-y-4 gap-x-10"
          >
            <p
              className={`max-w-[280px] sm:max-w-[340px] text-xs sm:text-sm leading-relaxed ${
                isDay ? 'text-[#071426]/70' : 'text-white/70'
              }`}
            >
              One festival. Every sport. Live scores, rivalry, and the moments that matter.
            </p>
            <Link
              to="/live"
              className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg ${
                isDay
                  ? 'bg-[#071426] text-white hover:bg-[#1264FF] shadow-[0_10px_30px_rgba(7,20,38,0.25)] hover:scale-105'
                  : 'bg-gradient-to-r from-[#1264FF] to-[#1747B8] text-white shadow-[0_10px_35px_rgba(18,100,255,0.4)] hover:brightness-110 hover:scale-105'
              }`}
            >
              <span>Enter the arena</span>
              <span>↘</span>
            </Link>
          </motion.div>
        </div>

        {/* Bottom Status Bar */}
        <div
          className={`relative z-10 flex items-end justify-between border-t pt-4 text-[9px] font-black uppercase tracking-[0.24em] sm:text-[10px] ${
            isDay ? 'border-[#071426]/15' : 'border-white/15'
          }`}
        >
          <span>01 / 10 DISCIPLINES</span>
          <span className={isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}>Live scoring / Real time</span>
          <span className="hidden sm:block">Scroll to enter ↓</span>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
