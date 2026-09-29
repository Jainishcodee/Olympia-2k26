import React, { useMemo } from 'react';
import { motion, MotionValue, useMotionValue, useTransform } from 'framer-motion';
import { ACCENTS, BRAND, IDENTITY, useImageSrc } from './BrandAssets';

/* ------------------------------------------------------------------ */
/*  Vector fallback — the Olympia flame mark, matching                 */
/*  /public/olympia-icon.svg but rendered with metallic depth.         */
/* ------------------------------------------------------------------ */
const FlameMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Olympia 2K26">
    <defs>
      <linearGradient id="ol-gold" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#FFE9A8" />
        <stop offset="28%" stopColor="#FFD21F" />
        <stop offset="62%" stopColor="#D9A441" />
        <stop offset="100%" stopColor="#9A6A18" />
      </linearGradient>
      <linearGradient id="ol-flame" x1="30%" y1="0%" x2="70%" y2="100%">
        <stop offset="0%" stopColor="#FFF3CE" />
        <stop offset="35%" stopColor="#FFD21F" />
        <stop offset="100%" stopColor="#E08A18" />
      </linearGradient>
      <radialGradient id="ol-disc" cx="34%" cy="26%" r="82%">
        <stop offset="0%" stopColor="#123564" />
        <stop offset="55%" stopColor="#071426" />
        <stop offset="100%" stopColor="#03080F" />
      </radialGradient>
      <radialGradient id="ol-spec" cx="30%" cy="22%" r="34%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>

    <circle cx="100" cy="100" r="96" fill="url(#ol-disc)" />
    <circle cx="100" cy="100" r="96" fill="url(#ol-spec)" />
    <circle cx="100" cy="100" r="95" fill="none" stroke="url(#ol-gold)" strokeWidth="2.5" />
    <circle cx="100" cy="100" r="87" fill="none" stroke={IDENTITY.gold} strokeOpacity="0.35" strokeWidth="1" />

    {/* Flame — outer gold body */}
    <path
      d="M100 30 C 62 74, 44 108, 66 138 C 80 158, 120 158, 134 138 C 156 108, 138 74, 100 30 Z"
      fill="url(#ol-gold)"
    />
    {/* Flame — inner light */}
    <path
      d="M100 70 C 80 96, 72 116, 84 134 C 92 146, 108 146, 116 134 C 128 116, 120 96, 100 70 Z"
      fill="url(#ol-flame)"
    />
    {/* Flame — core */}
    <path
      d="M100 100 C 93 113, 90 124, 96 133 C 100 139, 104 139, 108 133 C 114 124, 107 113, 100 100 Z"
      fill="#FFF8E0"
      fillOpacity="0.92"
    />
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
  /** `logo` uses the supplied PNG when present; `mark` always uses the vector flame. */
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
  const suppliedLogo = useImageSrc(variant === 'logo' ? BRAND.logo : BRAND.logoSvg);

  const zero = useMotionValue(0);
  const px = mx ?? zero;
  const py = my ?? zero;

  const rotateX = useTransform(py, [-1, 1], [-tilt, tilt]);
  const rotateY = useTransform(px, [-1, 1], [-tilt, tilt]);
  const shiftX = useTransform(px, [-1, 1], [-depth, depth]);
  const shiftY = useTransform(py, [-1, 1], [-depth, depth]);

  const marks = useMemo(
    () => ({
      glow: 'radial-gradient(circle at 50% 50%, rgba(217,164,65,0.42) 0%, rgba(217,164,65,0.14) 38%, rgba(18,100,255,0.10) 62%, rgba(0,0,0,0) 78%)',
      sheen:
        'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.55) 28deg, rgba(255,255,255,0) 70deg, rgba(255,255,255,0) 180deg, rgba(255,210,31,0.5) 214deg, rgba(255,255,255,0) 258deg, rgba(255,255,255,0) 360deg)',
    }),
    [],
  );

  return (
    <div className={`relative aspect-square ${className}`}>
      {/* --- ambient bloom -------------------------------------- */}
      <div
        aria-hidden
        className="absolute -inset-[22%] rounded-full pointer-events-none opacity-80 ol-bloom"
        style={{ background: marks.glow }}
      />

      {/* --- orbit system --------------------------------------- */}
      {orbits && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {/* equatorial gold ring */}
          <div className="absolute inset-[-6%] rounded-full border border-[#D9A441]/45 ol-spin" style={{ animationDuration: '26s' }} />
          <div className="absolute inset-[-6%] rounded-full border border-transparent border-t-[#FFD21F] ol-spin" style={{ animationDuration: '7s' }} />

          {/* tilted planetary ring — gold */}
          <div className="absolute inset-[-16%] rounded-full border border-[#D9A441]/60 ol-tilt-a" style={{ animationDuration: '34s' }}>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FFD21F] shadow-[0_0_12px_3px_rgba(255,210,31,0.8)]" />
          </div>

          {/* tilted dashed ring — electric blue */}
          <div
            className="absolute inset-[-26%] rounded-full border border-dashed border-[#1264FF]/45 ol-tilt-b"
            style={{ animationDuration: '48s' }}
          />

          {/* static hairline */}
          <div className="absolute inset-[6%] rounded-full border border-white/10" />
        </div>
      )}

      {/* --- the mark ------------------------------------------- */}
      <motion.div
        className="relative h-full w-full"
        style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 1400 }}
        animate={breathe ? { scale: [1, 1.028, 1] } : undefined}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
          {suppliedLogo ? (
            <img
              src={suppliedLogo}
              alt="Olympia 2K26"
              draggable={false}
              className="h-full w-full object-cover select-none"
            />
          ) : (
            <FlameMark className="h-full w-full select-none" />
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
                'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -18px 40px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(217,164,65,0.55)',
            }}
          />
        </div>

        {/* specular hotspot */}
        <div
          aria-hidden
          className="absolute left-[16%] top-[10%] h-[26%] w-[34%] rounded-full blur-xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), rgba(255,255,255,0) 70%)' }}
        />
      </motion.div>

      {/* --- contact shadow ------------------------------------- */}
      <div
        aria-hidden
        className="absolute left-1/2 -bottom-[14%] h-[10%] w-[70%] -translate-x-1/2 rounded-[50%] blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.75), rgba(0,0,0,0) 70%)' }}
      />

      {/* accent corona (environmental only — never on the mark itself) */}
      <div
        aria-hidden
        className="absolute -right-[8%] -top-[6%] h-[16%] w-[16%] rounded-full blur-md pointer-events-none"
        style={{ background: `radial-gradient(circle, ${ACCENTS.blue}, rgba(18,100,255,0) 70%)`, opacity: 0.55 }}
      />
    </div>
  );
};

export default OlympiaEmblem;
