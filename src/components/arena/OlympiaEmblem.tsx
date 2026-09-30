import React, { useMemo } from 'react';
import { motion, MotionValue, useMotionValue, useTransform } from 'framer-motion';
import { ACCENTS, BRAND, IDENTITY, useImageSrc } from './BrandAssets';
import { SportBallArt } from './SportBallArt';
import { useTheme } from '@/contexts/ThemeContext';

/* ------------------------------------------------------------------ */
/*  Metallic fallback — Olympia 2K26 Championship Badge               */
/* ------------------------------------------------------------------ */
const MetallicDisc: React.FC<{ className?: string; isDay?: boolean }> = ({ className, isDay = true }) => (
  <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Olympia 2K26">
    <defs>
      <linearGradient id="ol-gold-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        {isDay ? (
          <>
            <stop offset="0%" stopColor="#FFE9A8" />
            <stop offset="25%" stopColor="#FFD21F" />
            <stop offset="60%" stopColor="#D9A441" />
            <stop offset="100%" stopColor="#8A5A12" />
          </>
        ) : (
          <>
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#BAE6FD" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#38BDF8" />
          </>
        )}
      </linearGradient>
      <radialGradient id="ol-inner-deep" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor={isDay ? "#1264FF" : "#38BDF8"} stopOpacity={isDay ? "0.8" : "0.5"} />
        <stop offset="45%" stopColor="#071426" />
        <stop offset="100%" stopColor="#03080F" />
      </radialGradient>
      <radialGradient id="ol-core-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={isDay ? "#FFD21F" : "#38BDF8"} stopOpacity={isDay ? "0.4" : "0.5"} />
        <stop offset="100%" stopColor={isDay ? "#D9A441" : "#1264FF"} stopOpacity="0" />
      </radialGradient>
    </defs>

    <circle cx="100" cy="100" r="96" fill="url(#ol-inner-deep)" />
    <circle cx="100" cy="100" r="96" fill="url(#ol-core-glow)" />
    <circle cx="100" cy="100" r="95" fill="none" stroke="url(#ol-gold-ring)" strokeWidth="3" />
    <circle cx="100" cy="100" r="88" fill="none" stroke={isDay ? "rgba(255, 210, 31, 0.4)" : "rgba(56, 189, 248, 0.5)"} strokeWidth="1" strokeDasharray="4 6" />

    {/* Center Monogram Typography */}
    <text
      x="100"
      y="98"
      textAnchor="middle"
      dominantBaseline="central"
      fill="url(#ol-gold-ring)"
      fontSize="42"
      fontWeight="900"
      letterSpacing="2"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      OLYMPIA
    </text>
    <text
      x="100"
      y="136"
      textAnchor="middle"
      dominantBaseline="central"
      fill={isDay ? "#FFD21F" : "#BAE6FD"}
      fontSize="20"
      fontWeight="800"
      letterSpacing="8"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      2K26
    </text>
  </svg>
);

/* ------------------------------------------------------------------ */

export interface OlympiaEmblemProps {
  /** Shared pointer motion values (normalised -1..1). Parallax is skipped when absent. */
  mx?: MotionValue<number>;
  my?: MotionValue<number>;
  /** Parallax strength in px at full deflection. */
  depth?: number;
  /** Tilt strength in degrees at full deflection. */
  tilt?: number;
  /** Render the orbiting rings around the mark. */
  orbits?: boolean;
  /** Apply the slow "breathing" loop. */
  breathe?: boolean;
  className?: string;
  /** `logo` uses the supplied PNG when present; `mark` uses the metallic badge. */
  variant?: 'logo' | 'mark';
}

/**
 * The hero object. A metallic, orbiting, pointer-reactive Olympia mark
 * surrounded by celestial orbiting sports balls (football, tennis, volleyball, badminton, cricket).
 */
export const OlympiaEmblem: React.FC<OlympiaEmblemProps> = ({
  mx,
  my,
  depth = 26,
  tilt = 12,
  orbits = true,
  breathe = true,
  className = '',
  variant = 'logo',
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const logoSrc = isDay ? (BRAND.logo || '/olympia.png') : (BRAND.olympiaDark || '/olympia-dark.png');

  const zero = useMotionValue(0);
  const px = mx ?? zero;
  const py = my ?? zero;

  const rotateX = useTransform(py, [-1, 1], [-tilt, tilt]);
  const rotateY = useTransform(px, [-1, 1], [-tilt, tilt]);
  const shiftX = useTransform(px, [-1, 1], [-depth, depth]);
  const shiftY = useTransform(py, [-1, 1], [-depth, depth]);

  const marks = useMemo(
    () => {
      if (isDay) {
        return {
          glow: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,235,170,0.7) 28%, rgba(217,164,65,0.3) 58%, rgba(18,100,255,0) 80%)',
          sheen:
            'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.55) 28deg, rgba(255,255,255,0) 70deg, rgba(255,255,255,0) 180deg, rgba(255,210,31,0.5) 214deg, rgba(255,255,255,0) 258deg, rgba(255,255,255,0) 360deg)',
        };
      }
      return {
        glow: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(186,230,253,0.7) 26%, rgba(56,189,248,0.4) 52%, rgba(18,100,255,0.2) 75%, transparent 88%)',
        sheen:
          'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.75) 30deg, rgba(226,232,240,0.25) 80deg, rgba(255,255,255,0.85) 180deg, rgba(56,189,248,0.5) 220deg, rgba(255,255,255,0.9) 270deg, rgba(255,255,255,0) 360deg)',
      };
    },
    [isDay],
  );

  return (
    <div className={`relative aspect-square ${className}`}>
      {/* --- atmospheric luminous bloom --------------------------- */}
      <div
        aria-hidden
        className="absolute -inset-[24%] rounded-full pointer-events-none opacity-90 ol-bloom transition-all duration-500"
        style={{ background: marks.glow }}
      />

      {/* --- Orbit System with Revolving Sports Balls & Equipment -------------- */}
      {orbits && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {/* Equatorial orbit ring */}
          <div
            className={`absolute inset-[-6%] rounded-full border ol-spin transition-colors duration-500 ${
              isDay ? 'border-[#D9A441]/40' : 'border-[#E2E8F0]/35 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
            }`}
            style={{ animationDuration: '24s' }}
          />
          <div
            className={`absolute inset-[-6%] rounded-full border border-transparent ol-spin transition-colors duration-500 ${
              isDay ? 'border-t-[#FFD21F]' : 'border-t-[#38BDF8] drop-shadow-[0_0_8px_#38BDF8]'
            }`}
            style={{ animationDuration: '8s' }}
          />

          {/* Primary Revolving Orbit 1: Football ⚽ & Tennis Ball 🎾 (360° celestial rotation) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-8%] rounded-full pointer-events-none z-20"
          >
            {/* Top: Revolving Football */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-7 sm:h-7 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition-transform hover:scale-125">
                <SportBallArt sportSlug="football" />
              </div>
            </div>

            {/* Bottom: Revolving Tennis Ball */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
              <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform hover:scale-125">
                <SportBallArt sportSlug="tennis" />
              </div>
            </div>
          </motion.div>

          {/* Orbit 2: Tilted Planetary Ring — Cricket Ball 🏏 & Volleyball 🏐 */}
          <div
            className={`absolute inset-[-18%] rounded-full border ol-tilt-a transition-colors duration-500 ${
              isDay ? 'border-[#D9A441]/55' : 'border-[#93C5FD]/45 shadow-[0_0_20px_rgba(18,100,255,0.25)]'
            }`}
            style={{ animationDuration: '26s' }}
          >
            {/* Top-Left: Revolving Cricket Ball */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 filter drop-shadow-[0_2px_10px_rgba(217,30,24,0.45)]">
                <SportBallArt sportSlug="cricket" />
              </div>
            </div>
            {/* Bottom-Right: Revolving Volleyball */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-7 sm:h-7 filter drop-shadow-[0_2px_10px_rgba(18,100,255,0.45)]">
                <SportBallArt sportSlug="volleyball" />
              </div>
            </div>
          </div>

          {/* Orbit 3: Tilted Dashed Ring — Badminton Shuttlecock 🏸 & Table Tennis 🏓 */}
          <div
            className={`absolute inset-[-28%] rounded-full border border-dashed ol-tilt-b transition-colors duration-500 ${
              isDay ? 'border-[#1264FF]/40' : 'border-[#38BDF8]/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
            }`}
            style={{ animationDuration: '36s' }}
          >
            {/* Right: Revolving Badminton Shuttlecock */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
              <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.85)]">
                <SportBallArt sportSlug="badminton" />
              </div>
            </div>
            {/* Left: Revolving Table Tennis Paddle/Ball */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 filter drop-shadow-[0_2px_10px_rgba(255,167,38,0.45)]">
                <SportBallArt sportSlug="table-tennis" />
              </div>
            </div>
          </div>

          {/* Static subtle hairline */}
          <div className={`absolute inset-[6%] rounded-full border ${isDay ? 'border-[#071426]/10' : 'border-white/10'}`} />
        </div>
      )}

      {/* --- the mark ------------------------------------------- */}
      <motion.div
        className="relative h-full w-full"
        style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 1400 }}
        animate={breathe ? { scale: [1, 1.028, 1] } : undefined}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-full flex items-center justify-center transition-all duration-500 ${
            isDay
              ? 'bg-[#071426] shadow-[0_25px_60px_-15px_rgba(11,27,51,0.35),0_0_40px_rgba(255,255,255,0.5)]'
              : 'bg-[#040B17] shadow-[0_25px_80px_-10px_rgba(0,0,0,0.95),0_0_50px_rgba(56,189,248,0.35),0_0_80px_rgba(18,100,255,0.25)]'
          }`}
        >
          {variant === 'logo' ? (
            <img
              src={logoSrc}
              alt="Olympia 2K26"
              draggable={false}
              className="h-full w-full object-contain p-2 select-none"
            />
          ) : (
            <MetallicDisc isDay={isDay} className="h-full w-full select-none" />
          )}

          {/* metallic sweep across the surface */}
          <div
            aria-hidden
            className="absolute inset-0 ol-sheen pointer-events-none"
            style={{ backgroundImage: marks.sheen, mixBlendMode: 'overlay' }}
          />
          {/* rim light */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500"
            style={{
              boxShadow: isDay
                ? 'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -18px 40px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(217,164,65,0.65)'
                : 'inset 0 2px 2px rgba(255,255,255,0.85), inset 0 -18px 40px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(226,232,240,0.65), 0 0 35px rgba(56,189,248,0.35)',
            }}
          />
        </div>

        {/* specular hotspot */}
        <div
          aria-hidden
          className="absolute left-[16%] top-[10%] h-[26%] w-[34%] rounded-full blur-xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)' }}
        />
      </motion.div>

      {/* --- contact shadow ------------------------------------- */}
      <div
        aria-hidden
        className="absolute left-1/2 -bottom-[14%] h-[10%] w-[70%] -translate-x-1/2 rounded-[50%] blur-2xl pointer-events-none"
        style={{
          background: isDay
            ? 'radial-gradient(ellipse, rgba(73,107,153,0.35), rgba(73,107,153,0) 70%)'
            : 'radial-gradient(ellipse, rgba(18,100,255,0.4), rgba(0,0,0,0.8) 70%)',
        }}
      />

      {/* accent corona (environmental only — never on the mark itself) */}
      <div
        aria-hidden
        className="absolute -right-[8%] -top-[6%] h-[16%] w-[16%] rounded-full blur-md pointer-events-none transition-all duration-500"
        style={{
          background: isDay
            ? `radial-gradient(circle, ${ACCENTS.blue}, rgba(18,100,255,0) 70%)`
            : 'radial-gradient(circle, #38BDF8, rgba(56,189,248,0) 70%)',
          opacity: isDay ? 0.4 : 0.65,
        }}
      />
    </div>
  );
};

export default OlympiaEmblem;
