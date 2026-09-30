import React, { useMemo } from 'react';
import { motion, MotionValue, useMotionValue, useTransform } from 'framer-motion';
import { ACCENTS, BRAND, IDENTITY, useImageSrc } from './BrandAssets';

/* ------------------------------------------------------------------ */
/*  Metallic fallback — Olympia 2K26 Championship Badge               */
/* ------------------------------------------------------------------ */
const MetallicDisc: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Olympia 2K26">
    <defs>
      <linearGradient id="ol-gold-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE9A8" />
        <stop offset="25%" stopColor="#FFD21F" />
        <stop offset="60%" stopColor="#D9A441" />
        <stop offset="100%" stopColor="#8A5A12" />
      </linearGradient>
      <radialGradient id="ol-inner-deep" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#1264FF" stopOpacity="0.8" />
        <stop offset="45%" stopColor="#071426" />
        <stop offset="100%" stopColor="#03080F" />
      </radialGradient>
      <radialGradient id="ol-core-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFD21F" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#D9A441" stopOpacity="0" />
      </radialGradient>
    </defs>

    <circle cx="100" cy="100" r="96" fill="url(#ol-inner-deep)" />
    <circle cx="100" cy="100" r="96" fill="url(#ol-core-glow)" />
    <circle cx="100" cy="100" r="95" fill="none" stroke="url(#ol-gold-ring)" strokeWidth="3" />
    <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255, 210, 31, 0.4)" strokeWidth="1" strokeDasharray="4 6" />

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
      fill="#FFD21F"
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
 * The hero object. A metallic, orbiting, pointer-reactive Olympia mark.
 * Everything is driven by MotionValues so pointer movement never re-renders.
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
  const logoSrc = BRAND.logo || '/olympia.png';

  const zero = useMotionValue(0);
  const px = mx ?? zero;
  const py = my ?? zero;

  const rotateX = useTransform(py, [-1, 1], [-tilt, tilt]);
  const rotateY = useTransform(px, [-1, 1], [-tilt, tilt]);
  const shiftX = useTransform(px, [-1, 1], [-depth, depth]);
  const shiftY = useTransform(py, [-1, 1], [-depth, depth]);

  const marks = useMemo(
    () => ({
      glow: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(214,229,241,0.7) 28%, rgba(143,175,206,0.3) 58%, rgba(95,130,181,0) 80%)',
      sheen:
        'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.55) 28deg, rgba(255,255,255,0) 70deg, rgba(255,255,255,0) 180deg, rgba(255,210,31,0.5) 214deg, rgba(255,255,255,0) 258deg, rgba(255,255,255,0) 360deg)',
    }),
    [],
  );

  return (
    <div className={`relative aspect-square ${className}`}>
      {/* --- atmospheric luminous bloom --------------------------- */}
      <div
        aria-hidden
        className="absolute -inset-[24%] rounded-full pointer-events-none opacity-90 ol-bloom"
        style={{ background: marks.glow }}
      />

      {/* --- orbit system with revolving light ball -------------- */}
      {orbits && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {/* Equatorial gold ring */}
          <div className="absolute inset-[-6%] rounded-full border border-[#D9A441]/50 ol-spin" style={{ animationDuration: '24s' }} />
          <div className="absolute inset-[-6%] rounded-full border border-transparent border-t-[#FFD21F] ol-spin" style={{ animationDuration: '8s' }} />

          {/* Primary Revolving Light Ball (smooth continuous 360° celestial orbit) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-[-6%] rounded-full pointer-events-none z-20"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              {/* Brilliant core light ball */}
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_14px_4px_#FFD21F,0_0_24px_8px_rgba(255,210,31,0.7),0_0_35px_12px_rgba(255,255,255,0.9)]" />
              {/* Soft luminous corona aura */}
              <div className="absolute w-8 h-8 rounded-full bg-[#FFD21F]/25 blur-xs pointer-events-none" />
            </div>
          </motion.div>

          {/* Tilted planetary ring — gold with secondary orbiting satellite */}
          <div className="absolute inset-[-18%] rounded-full border border-[#D9A441]/60 ol-tilt-a" style={{ animationDuration: '28s' }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-[#FFD21F] shadow-[0_0_16px_4px_#FFD21F,0_0_28px_6px_rgba(255,255,255,0.9)]" />
              <span className="absolute w-6 h-6 rounded-full bg-[#D9A441]/35 blur-[2px]" />
            </div>
          </div>

          {/* Tilted dashed ring — electric blue with twilight satellite */}
          <div
            className="absolute inset-[-28%] rounded-full border border-dashed border-[#1264FF]/45 ol-tilt-b"
            style={{ animationDuration: '40s' }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1264FF] shadow-[0_0_14px_4px_#1264FF,0_0_22px_6px_rgba(255,255,255,0.8)]" />
            </div>
          </div>

          {/* Static subtle hairline */}
          <div className="absolute inset-[6%] rounded-full border border-[#071426]/10" />
        </div>
      )}

      {/* --- the mark ------------------------------------------- */}
      <motion.div
        className="relative h-full w-full"
        style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 1400 }}
        animate={breathe ? { scale: [1, 1.028, 1] } : undefined}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full shadow-[0_25px_60px_-15px_rgba(11,27,51,0.35),0_0_40px_rgba(255,255,255,0.5)] bg-[#071426] flex items-center justify-center">
          {variant === 'logo' ? (
            <img
              src={logoSrc}
              alt="Olympia 2K26"
              draggable={false}
              className="h-full w-full object-contain p-2 select-none"
            />
          ) : (
            <MetallicDisc className="h-full w-full select-none" />
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
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -18px 40px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(217,164,65,0.65)',
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
        style={{ background: 'radial-gradient(ellipse, rgba(73,107,153,0.35), rgba(73,107,153,0) 70%)' }}
      />

      {/* accent corona (environmental only — never on the mark itself) */}
      <div
        aria-hidden
        className="absolute -right-[8%] -top-[6%] h-[16%] w-[16%] rounded-full blur-md pointer-events-none"
        style={{ background: `radial-gradient(circle, ${ACCENTS.blue}, rgba(18,100,255,0) 70%)`, opacity: 0.4 }}
      />
    </div>
  );
};

export default OlympiaEmblem;
