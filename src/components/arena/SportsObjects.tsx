import React from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { ACCENTS, useImageSrc } from './BrandAssets';

interface OrbSpec {
  id: string;
  /** Diameter as a fraction of the hero's smaller axis (vmin). */
  size: number;
  /** Resting position, percentage of the hero box. */
  top: number;
  left: number;
  /** Pointer parallax multiplier — bigger means nearer the viewer. */
  depth: number;
  /** Scroll rate in px — negatives drift upward as you scroll. */
  scroll: number;
  float: number;
  delay: number;
  body: string;
  glow: string;
  asset?: string;
}

const ORBS: OrbSpec[] = [
  {
    id: 'yellow',
    size: 0.085,
    top: 68,
    left: 15,
    depth: 46,
    scroll: -170,
    float: 9,
    delay: 0,
    body: 'radial-gradient(circle at 32% 26%, #FFFBE0 0%, #FFEE7A 14%, #FFD21F 46%, #C99300 82%, #7A5800 100%)',
    glow: 'rgba(255,210,31,0.55)',
    asset: '/images/sports/ball-volleyball.png',
  },
  {
    id: 'orange',
    size: 0.055,
    top: 26,
    left: 75,
    depth: 74,
    scroll: -280,
    float: 7,
    delay: 1.1,
    body: 'radial-gradient(circle at 32% 26%, #FFD9BC 0%, #FFA463 16%, #FF6A00 48%, #B24400 84%, #5E2400 100%)',
    glow: 'rgba(255,106,0,0.55)',
    asset: '/images/sports/ball-badminton.png',
  },
  {
    id: 'blue',
    size: 0.042,
    top: 78,
    left: 80,
    depth: 104,
    scroll: -360,
    float: 11,
    delay: 0.5,
    body: 'radial-gradient(circle at 32% 26%, #D6E6FF 0%, #6FA0FF 16%, #1264FF 48%, #0A3CA1 84%, #061F52 100%)',
    glow: 'rgba(18,100,255,0.6)',
    asset: '/images/sports/ball-football.png',
  },
  {
    id: 'ember',
    size: 0.028,
    top: 42,
    left: 7,
    depth: 132,
    scroll: -430,
    float: 13,
    delay: 1.9,
    body: 'radial-gradient(circle at 34% 28%, #FFF6DE 0%, #FFE08A 18%, #FFC93D 50%, #C98A0A 86%, #6E4C00 100%)',
    glow: 'rgba(255,210,31,0.4)',
  },
  {
    id: 'drop',
    size: 0.02,
    top: 15,
    left: 32,
    depth: 156,
    scroll: -500,
    float: 8.5,
    delay: 2.6,
    body: 'radial-gradient(circle at 34% 28%, #EAF2FF 0%, #7FB0FF 20%, #2E77FF 52%, #0B3EA8 88%, #061F52 100%)',
    glow: 'rgba(18,100,255,0.45)',
  },
];

/** One sphere — real shading, a specular cap and a coloured bloom. */
const Sphere: React.FC<{ orb: OrbSpec }> = ({ orb }) => {
  const supplied = useImageSrc(orb.asset ?? '');

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0 rounded-full bg-cover bg-center"
        style={{
          backgroundImage: supplied ? `url(${supplied})` : orb.body,
          boxShadow: [
            'inset -8px -12px 22px rgba(0,0,0,0.45)',
            'inset 6px 8px 16px rgba(255,255,255,0.20)',
            `0 18px 44px -14px ${orb.glow}`,
          ].join(', '),
        }}
      />

      {!supplied && (
        <span
          className="absolute left-[22%] top-[15%] h-[26%] w-[30%] rounded-full blur-[2px]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 72%)' }}
        />
      )}
    </div>
  );
};

/** A single drifting object. Hooks live here so the count never varies. */
const Orb: React.FC<{
  orb: OrbSpec;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scrollY: MotionValue<number>;
  intensity: number;
}> = ({ orb, mx, my, scrollY, intensity }) => {
  const x = useTransform(mx, [-1, 1], [-orb.depth, orb.depth]);
  const pointerY = useTransform(my, [-1, 1], [-orb.depth * 0.7, orb.depth * 0.7]);
  const scrollOffset = useTransform(scrollY, [0, 900], [0, orb.scroll * intensity]);
  const y = useTransform([pointerY, scrollOffset], ([py, sy]: number[]) => py + sy);
  const opacity = useTransform(scrollY, [0, 760], [1, 0.12]);

  const px = `${orb.size * 100}vmin`;

  return (
    <motion.div
      className="absolute"
      style={{
        top: `${orb.top}%`,
        left: `${orb.left}%`,
        width: px,
        height: px,
        marginLeft: `calc(${px} / -2)`,
        marginTop: `calc(${px} / -2)`,
        x,
        y,
        opacity,
      }}
    >
      <div
        className="h-full w-full"
        style={{ animation: `ol-float ${orb.float}s ease-in-out ${orb.delay}s infinite` }}
      >
        <Sphere orb={orb} />
      </div>
    </motion.div>
  );
};

export interface SportsObjectsProps {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scrollY: MotionValue<number>;
  /** Global dial for scroll travel (used to soften small screens). */
  intensity?: number;
  className?: string;
}

/**
 * Environmental sports objects. Every orb has its own size, float cadence,
 * pointer depth and scroll rate — that spread of velocities is what reads as
 * physical depth instead of a flat parallax stack.
 */
export const SportsObjects: React.FC<SportsObjectsProps> = ({
  mx,
  my,
  scrollY,
  intensity = 1,
  className = '',
}) => (
  <div aria-hidden className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
    {ORBS.map((orb) => (
      <Orb key={orb.id} orb={orb} mx={mx} my={my} scrollY={scrollY} intensity={intensity} />
    ))}

    {/* atmospheric haze so the orbs sit in air rather than on glass */}
    <div
      className="absolute left-[10%] top-[60%] h-[38vmin] w-[38vmin] rounded-full blur-3xl"
      style={{ background: `radial-gradient(circle, ${ACCENTS.yellow}1f, rgba(255,210,31,0) 70%)` }}
    />
    <div
      className="absolute right-[6%] top-[16%] h-[34vmin] w-[34vmin] rounded-full blur-3xl"
      style={{ background: `radial-gradient(circle, ${ACCENTS.blue}22, rgba(18,100,255,0) 70%)` }}
    />
  </div>
);

export default SportsObjects;
