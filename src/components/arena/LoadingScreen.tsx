import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OlympiaEmblem } from './OlympiaEmblem';
import { BRAND } from './BrandAssets';
import { useTheme } from '@/contexts/ThemeContext';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_BLAST: [number, number, number, number] = [0.12, 0.95, 0.28, 1];

const STAGES = [
  { at: 0, label: 'ESTABLISHING SECURE LINK' },
  { at: 26, label: 'SYNCING LIVE SCOREFEED' },
  { at: 52, label: 'LOADING 10 DISCIPLINES' },
  { at: 76, label: 'CALIBRATING ARENA LIGHTS' },
  { at: 100, label: 'ARENA READY' },
] as const;

/* ------------------------------------------------------------------ */
/*  28 Realistic Faceted Mirror Shards for Atom Burst Explosion       */
/* ------------------------------------------------------------------ */
interface ShardDef {
  id: number;
  clipPath: string;
  angle: number; // degrees
  distance: number; // px
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}

const MIRROR_SHARDS: ShardDef[] = [
  // Inner nucleus shards (8 wedges)
  { id: 0, clipPath: 'polygon(50% 50%, 50% 25%, 68% 32%)', angle: -70, distance: 980, rotX: 450, rotY: -280, rotZ: 210, scale: 0.85 },
  { id: 1, clipPath: 'polygon(50% 50%, 68% 32%, 75% 50%)', angle: -25, distance: 1040, rotX: -360, rotY: 340, rotZ: -190, scale: 0.9 },
  { id: 2, clipPath: 'polygon(50% 50%, 75% 50%, 68% 68%)', angle: 25, distance: 990, rotX: 320, rotY: -400, rotZ: 240, scale: 0.8 },
  { id: 3, clipPath: 'polygon(50% 50%, 68% 68%, 50% 75%)', angle: 70, distance: 1060, rotX: -460, rotY: 260, rotZ: -280, scale: 0.85 },
  { id: 4, clipPath: 'polygon(50% 50%, 50% 75%, 32% 68%)', angle: 110, distance: 1010, rotX: 380, rotY: -320, rotZ: 310, scale: 0.75 },
  { id: 5, clipPath: 'polygon(50% 50%, 32% 68%, 25% 50%)', angle: 155, distance: 1120, rotX: -340, rotY: 420, rotZ: -220, scale: 0.9 },
  { id: 6, clipPath: 'polygon(50% 50%, 25% 50%, 32% 32%)', angle: -155, distance: 970, rotX: 490, rotY: -300, rotZ: 260, scale: 0.85 },
  { id: 7, clipPath: 'polygon(50% 50%, 32% 32%, 50% 25%)', angle: -110, distance: 1050, rotX: -410, rotY: 360, rotZ: -320, scale: 0.8 },

  // Middle ring shards (8 faceted polygons)
  { id: 8, clipPath: 'polygon(50% 25%, 68% 32%, 82% 18%, 50% 8%)', angle: -55, distance: 890, rotX: 280, rotY: -220, rotZ: 160, scale: 1.1 },
  { id: 9, clipPath: 'polygon(68% 32%, 75% 50%, 92% 50%, 82% 18%)', angle: -10, distance: 930, rotX: -310, rotY: 270, rotZ: -140, scale: 1.05 },
  { id: 10, clipPath: 'polygon(75% 50%, 68% 68%, 82% 82%, 92% 50%)', angle: 35, distance: 900, rotX: 260, rotY: -300, rotZ: 190, scale: 1.0 },
  { id: 11, clipPath: 'polygon(68% 68%, 50% 75%, 50% 92%, 82% 82%)', angle: 80, distance: 950, rotX: -290, rotY: 240, rotZ: -170, scale: 1.1 },
  { id: 12, clipPath: 'polygon(50% 75%, 32% 68%, 18% 82%, 50% 92%)', angle: 125, distance: 880, rotX: 330, rotY: -260, rotZ: 210, scale: 1.05 },
  { id: 13, clipPath: 'polygon(32% 68%, 25% 50%, 8% 50%, 18% 82%)', angle: 170, distance: 940, rotX: -270, rotY: 310, rotZ: -180, scale: 1.0 },
  { id: 14, clipPath: 'polygon(25% 50%, 32% 32%, 18% 18%, 8% 50%)', angle: -145, distance: 870, rotX: 310, rotY: -250, rotZ: 150, scale: 1.15 },
  { id: 15, clipPath: 'polygon(32% 32%, 50% 25%, 50% 8%, 18% 18%)', angle: -100, distance: 920, rotX: -340, rotY: 280, rotZ: -200, scale: 1.0 },

  // Outer perimeter shards (8 faceted edge pieces)
  { id: 16, clipPath: 'polygon(50% 8%, 82% 18%, 100% 0%, 50% 0%)', angle: -65, distance: 810, rotX: 200, rotY: -180, rotZ: 120, scale: 1.2 },
  { id: 17, clipPath: 'polygon(82% 18%, 92% 50%, 100% 50%, 100% 0%)', angle: -20, distance: 840, rotX: -220, rotY: 210, rotZ: -110, scale: 1.15 },
  { id: 18, clipPath: 'polygon(92% 50%, 82% 82%, 100% 100%, 100% 50%)', angle: 25, distance: 820, rotX: 190, rotY: -230, rotZ: 140, scale: 1.2 },
  { id: 19, clipPath: 'polygon(82% 82%, 50% 92%, 50% 100%, 100% 100%)', angle: 70, distance: 850, rotX: -210, rotY: 190, rotZ: -130, scale: 1.1 },
  { id: 20, clipPath: 'polygon(50% 92%, 18% 82%, 0% 100%, 50% 100%)', angle: 115, distance: 790, rotX: 240, rotY: -170, rotZ: 150, scale: 1.25 },
  { id: 21, clipPath: 'polygon(18% 82%, 8% 50%, 0% 50%, 0% 100%)', angle: 160, distance: 830, rotX: -180, rotY: 220, rotZ: -120, scale: 1.15 },
  { id: 22, clipPath: 'polygon(8% 50%, 18% 18%, 0% 0%, 0% 50%)', angle: -155, distance: 800, rotX: 210, rotY: -200, rotZ: 130, scale: 1.2 },
  { id: 23, clipPath: 'polygon(18% 18%, 50% 8%, 50% 0%, 0% 0%)', angle: -115, distance: 860, rotX: -230, rotY: 190, rotZ: -140, scale: 1.15 },

  // Crystalline needle slivers (4 micro shards)
  { id: 24, clipPath: 'polygon(50% 50%, 58% 28%, 52% 26%)', angle: -78, distance: 1280, rotX: 560, rotY: -430, rotZ: 390, scale: 0.6 },
  { id: 25, clipPath: 'polygon(50% 50%, 72% 42%, 70% 48%)', angle: -12, distance: 1330, rotX: -500, rotY: 520, rotZ: -370, scale: 0.55 },
  { id: 26, clipPath: 'polygon(50% 50%, 62% 72%, 56% 70%)', angle: 65, distance: 1240, rotX: 530, rotY: -470, rotZ: 420, scale: 0.6 },
  { id: 27, clipPath: 'polygon(50% 50%, 28% 58%, 30% 52%)', angle: 168, distance: 1300, rotX: -550, rotY: 490, rotZ: -400, scale: 0.5 },
];

/**
 * Spectacular Atom Burst & Mirror Break Animation Component:
 * - Central quantum singularity ignition and detonation
 * - Radiant concentric shockwaves (white plasma, gold corona, electric blue wave)
 * - 360° quantum particle beams
 * - Branching crystalline fracture cracks
 * - 28 faceted mirror shards scattering with 3D rotation and specular reflection
 */
const AtomBurstMirrorBlast: React.FC<{ isDay?: boolean }> = ({ isDay = true }) => {
  const logoSrc = isDay ? (BRAND.logo || '/olympia.png') : (BRAND.olympiaDark || '/olympia-dark.png');

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: 1200 }}>
      {/* 1. Blinding atomic core flash across full viewport */}
      <motion.div
        aria-hidden
        className="fixed inset-0 z-50 pointer-events-none bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.92, 0.45, 0] }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      />

      {/* 2. Quantum Singularity Core (Surges then violently expands) */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none z-40"
        style={{
          background: isDay
            ? 'radial-gradient(circle, #FFFFFF 0%, #FFE9A8 30%, #FFD21F 55%, #1264FF 80%, transparent 100%)'
            : 'radial-gradient(circle, #FFFFFF 0%, #BAE6FD 30%, #38BDF8 55%, #1264FF 80%, transparent 100%)',
          boxShadow: isDay
            ? '0 0 100px 30px #FFFFFF, 0 0 180px 60px #FFD21F'
            : '0 0 100px 30px #FFFFFF, 0 0 180px 60px #38BDF8, 0 0 250px 80px #1264FF',
        }}
        initial={{ width: 16, height: 16, scale: 0.2, opacity: 0 }}
        animate={{
          scale: [0.2, 1.4, 9, 16],
          opacity: [0, 1, 0.9, 0],
        }}
        transition={{ duration: 1.25, delay: 0.12, ease: EASE_OUT }}
      />

      {/* 3. Concentric Shockwave Rings (White-Hot Plasma, Gold/Cyan Corona, and Electric Blue) */}
      {/* Shockwave A: Primary White Plasma Wave */}
      <motion.div
        aria-hidden
        className="absolute rounded-full border-4 border-white pointer-events-none z-30"
        style={{
          boxShadow:
            '0 0 50px 15px rgba(255, 255, 255, 0.95), 0 0 90px 35px rgba(18, 100, 255, 0.85), inset 0 0 35px rgba(255, 210, 31, 0.7)',
        }}
        initial={{ width: 10, height: 10, scale: 0.1, opacity: 0 }}
        animate={{
          width: ['10px', '2200px'],
          height: ['10px', '2200px'],
          opacity: [0, 1, 0.8, 0],
          scale: [0.1, 1],
        }}
        transition={{ duration: 1.25, delay: 0.15, ease: [0.14, 0.96, 0.25, 1] }}
      />

      {/* Shockwave B: Golden Corona Blast Wave in Day / Cyan Starlight Wave in Night */}
      <motion.div
        aria-hidden
        className={`absolute rounded-full border-2 pointer-events-none z-30 ${
          isDay ? 'border-[#FFD21F]' : 'border-[#38BDF8]'
        }`}
        style={{
          boxShadow: isDay
            ? '0 0 65px 22px rgba(255, 210, 31, 0.9), inset 0 0 25px rgba(217, 164, 65, 0.6)'
            : '0 0 65px 22px rgba(56, 189, 248, 0.95), inset 0 0 25px rgba(18, 100, 255, 0.7)',
        }}
        initial={{ width: 10, height: 10, opacity: 0 }}
        animate={{
          width: ['10px', '1800px'],
          height: ['10px', '1800px'],
          opacity: [0, 1, 0.65, 0],
        }}
        transition={{ duration: 1.35, delay: 0.2, ease: EASE_OUT }}
      />

      {/* Shockwave C: Electric Blue Quantum Wave */}
      <motion.div
        aria-hidden
        className="absolute rounded-full border border-[#1264FF]/90 pointer-events-none z-20"
        style={{
          boxShadow: '0 0 80px 25px rgba(18, 100, 255, 0.7)',
        }}
        initial={{ width: 10, height: 10, opacity: 0 }}
        animate={{
          width: ['10px', '2500px'],
          height: ['10px', '2500px'],
          opacity: [0, 0.85, 0],
        }}
        transition={{ duration: 1.45, delay: 0.24, ease: [0.18, 1, 0.32, 1] }}
      />

      {/* 4. Radial Quantum Particle Beams (360° Particle Jet Streaks) */}
      {Array.from({ length: 24 }).map((_, i) => {
        const rot = (i * 360) / 24;
        const length = 450 + (i % 6) * 110;
        return (
          <motion.div
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[3px] origin-left pointer-events-none z-25"
            style={{
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              width: `${length}px`,
              background:
                'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,210,31,0.9) 25%, rgba(18,100,255,0.6) 65%, transparent 100%)',
              boxShadow: '0 0 10px rgba(255,210,31,0.85)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: [0, 1.8, 2.6],
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: 1.15,
              delay: 0.15 + (i % 3) * 0.02,
              ease: EASE_OUT,
            }}
          />
        );
      })}

      {/* 5. Crystalline Mirror Fracture Web (Cracks appearing at detonation) */}
      <motion.svg
        viewBox="0 0 400 400"
        aria-hidden
        className="absolute w-[440px] h-[440px] pointer-events-none z-35"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: [0, 1, 0.85, 0],
          scale: [0.95, 1, 1.35, 1.9],
        }}
        transition={{ duration: 0.8, delay: 0.14, ease: EASE_OUT }}
      >
        <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" filter="url(#crack-filter)">
          <path d="M200 200 L210 160 L195 120 L230 80 L200 20" />
          <path d="M200 200 L245 185 L280 165 L320 180 L370 150" />
          <path d="M200 200 L250 220 L290 235 L335 210 L380 260" />
          <path d="M200 200 L220 250 L235 295 L210 340 L230 390" />
          <path d="M200 200 L180 255 L160 290 L180 345 L150 390" />
          <path d="M200 200 L155 220 L115 245 L75 225 L20 260" />
          <path d="M200 200 L150 180 L110 160 L80 180 L25 140" />
          <path d="M200 200 L175 155 L165 115 L180 75 L160 20" />
          {/* Secondary micro cracks */}
          <path d="M210 160 L240 140 L260 150" strokeWidth="1.5" />
          <path d="M245 185 L270 205 L295 195" strokeWidth="1.5" />
          <path d="M220 250 L255 270 L280 260" strokeWidth="1.5" />
          <path d="M180 255 L150 270 L140 300" strokeWidth="1.5" />
          <path d="M155 220 L130 200 L105 210" strokeWidth="1.5" />
          <path d="M175 155 L145 140 L130 155" strokeWidth="1.5" />
        </g>
        <defs>
          <filter id="crack-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={isDay ? "#FFD21F" : "#38BDF8"} floodOpacity="0.9" />
          </filter>
        </defs>
      </motion.svg>

      {/* 6. The 28 Faceted Mirror Shards (Logo Shattering in 3D) */}
      <div className="relative w-[175px] h-[175px] sm:w-[200px] sm:h-[200px] z-30" style={{ transformStyle: 'preserve-3d' }}>
        {MIRROR_SHARDS.map((shard) => {
          const rad = (shard.angle * Math.PI) / 180;
          const targetX = Math.cos(rad) * shard.distance;
          const targetY = Math.sin(rad) * shard.distance;

          return (
            <motion.div
              key={shard.id}
              className="absolute inset-0 pointer-events-none will-change-transform"
              style={{
                clipPath: shard.clipPath,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                filter: isDay
                  ? 'drop-shadow(0 0 10px rgba(255, 210, 31, 0.75))'
                  : 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.85))',
              }}
              initial={{
                x: 0,
                y: 0,
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: [0, targetX * 0.15, targetX],
                y: [0, targetY * 0.15, targetY],
                rotateX: [0, shard.rotX * 0.4, shard.rotX],
                rotateY: [0, shard.rotY * 0.4, shard.rotY],
                rotateZ: [0, shard.rotZ * 0.5, shard.rotZ],
                scale: [1, shard.scale * 1.15, shard.scale * 0.35],
                opacity: [1, 1, 0.85, 0],
              }}
              transition={{
                duration: 1.35,
                delay: 0.15,
                ease: EASE_BLAST,
              }}
            >
              {/* Emblem content within shard */}
              <div
                className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center border transition-all ${
                  isDay
                    ? 'bg-[#071426] border-[#D9A441]'
                    : 'bg-[#040B17] border-[#38BDF8] shadow-[0_0_14px_rgba(56,189,248,0.6)]'
                }`}
              >
                <img
                  src={logoSrc}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain p-2 select-none"
                />
                {/* Chromatic Mirror Sheen reflection */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isDay
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.05) 45%, rgba(255,210,31,0.55) 75%, rgba(18,100,255,0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(226,232,240,0.1) 45%, rgba(56,189,248,0.65) 75%, rgba(18,100,255,0.5) 100%)',
                    mixBlendMode: 'overlay',
                  }}
                />
                {/* Mirror glass faceted highlight border */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none border border-white/70"
                  style={{
                    boxShadow: isDay
                      ? 'inset 0 0 12px rgba(255,255,255,0.85), 0 0 8px rgba(255,210,31,0.7)'
                      : 'inset 0 0 14px rgba(255,255,255,0.95), 0 0 12px rgba(56,189,248,0.85)',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isBlasting, setIsBlasting] = useState(false);
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
    if (leaving || isBlasting) return;
    setIsBlasting(true);
    setLeaving(true);
    // Smooth 1.5s atom burst and mirror break animation, then reveal Arena
    window.setTimeout(() => {
      onComplete();
      navigate('/');
    }, 1500);
  };

  const goToAdmin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (leaving || isBlasting) return;
    setLeaving(true);
    onComplete();
    navigate('/admin/login');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && isReady && !isBlasting) {
        enter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isReady, isBlasting]);

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
      initial={{ opacity: 1 }}
      animate={isBlasting ? { scale: [1, 1.04, 1.08], opacity: [1, 1, 0.85, 0] } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={isBlasting ? { duration: 1.5, ease: EASE_OUT } : { duration: 0.35 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: isDay ? '#D6E5F1' : '#040B17',
        backgroundImage: isDay
          ? 'linear-gradient(180deg, #5F82B5 0%, #7FA2C7 20%, #8FAFCE 38%, #B5CCE1 58%, #D6E5F1 78%, #F5F8FA 100%)'
          : 'radial-gradient(ellipse 100% 80% at 50% 10%, rgba(18,100,255,0.18) 0%, rgba(7,20,38,0.92) 50%, #040B17 100%)',
      }}
    >
      {/* --- Soft Atmospheric Corner Depth --- */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDay
            ? 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 38%, rgba(127, 162, 199, 0.22) 72%, rgba(73, 107, 153, 0.32) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 38%, rgba(18, 100, 255, 0.15) 72%, rgba(4, 11, 23, 0.7) 100%)',
        }}
      />

      {/* --- Atmospheric Horizon Sunlight Glow --- */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[10%] h-[50%] pointer-events-none blur-[80px]"
        style={{
          background: isDay
            ? 'radial-gradient(ellipse 120% 70% at 50% 100%, rgba(255, 255, 255, 0.92) 0%, rgba(255, 248, 232, 0.5) 30%, rgba(214, 229, 241, 0.4) 62%, transparent 88%)'
            : 'radial-gradient(ellipse 120% 70% at 50% 100%, rgba(56, 189, 248, 0.4) 0%, rgba(18, 100, 255, 0.25) 30%, rgba(4, 11, 23, 0.6) 62%, transparent 88%)',
        }}
      />

      {/* --- Soft Luminous Environment Behind the Olympia Logo --- */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full blur-[85px] pointer-events-none"
        style={{
          background: isDay
            ? 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(245, 248, 250, 0.7) 35%, rgba(169, 196, 223, 0.35) 65%, transparent 85%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(56, 189, 248, 0.45) 30%, rgba(18, 100, 255, 0.22) 60%, transparent 85%)',
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

      {/* --- Gentle Sunlight / Starlight Sweep --- */}
      <motion.div
        aria-hidden
        initial={{ x: '-40%', opacity: 0 }}
        animate={{ x: '140%', opacity: [0, 0.35, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -top-1/4 h-[150%] w-[40%] blur-3xl pointer-events-none"
        style={{
          background: isDay
            ? 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(100deg, rgba(56,189,248,0) 0%, rgba(255,255,255,0.3) 50%, rgba(56,189,248,0) 100%)',
        }}
      />

      {/* --- Corner Framing & Header Details --- */}
      <motion.div
        aria-hidden
        animate={isBlasting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className={`absolute left-8 top-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] ${
            isDay ? 'text-[#071426]' : 'text-white'
          }`}
        >
          <span className={`w-6 h-px ${isDay ? 'bg-[#D9A441]' : 'bg-[#38BDF8]'}`} />
          OLYMPIA 2K26
        </motion.div>
        <motion.button
          type="button"
          onClick={goToAdmin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className={`absolute right-8 top-8 text-[10px] font-black uppercase tracking-[0.3em] transition-colors pointer-events-auto cursor-pointer ${
            isDay ? 'text-[#071426]/60 hover:text-[#1264FF]' : 'text-white/60 hover:text-[#38BDF8]'
          }`}
        >
          SPORTS SECRETARY ↗
        </motion.button>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 1.4, ease: EASE_OUT }}
          className={`absolute left-8 top-16 h-px w-24 origin-left ${isDay ? 'bg-[#071426]/15' : 'bg-white/15'}`}
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 1.4, ease: EASE_OUT }}
          className={`absolute right-8 top-16 h-px w-24 origin-right ${isDay ? 'bg-[#071426]/15' : 'bg-white/15'}`}
        />
      </motion.div>

      {/* --- Centre Stage ----------------------------------------- */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative flex h-[300px] w-[300px] items-center justify-center sm:h-[340px] sm:w-[340px]">
          {/* Progress ring with clean light track and Olympia brand gradient */}
          <motion.svg
            animate={isBlasting ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
            viewBox="0 0 300 300"
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke={isDay ? "rgba(7, 20, 38, 0.12)" : "rgba(255, 255, 255, 0.12)"}
              strokeWidth="1.5"
            />
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
                {isDay ? (
                  <>
                    <stop offset="0%" stopColor="#1264FF" />
                    <stop offset="45%" stopColor="#071426" />
                    <stop offset="75%" stopColor="#D9A441" />
                    <stop offset="100%" stopColor="#FFD21F" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#1264FF" />
                    <stop offset="40%" stopColor="#040B17" />
                    <stop offset="75%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </>
                )}
              </linearGradient>
            </defs>
          </motion.svg>

          {/* Counter-rotating dashed ring */}
          <motion.svg
            viewBox="0 0 300 300"
            animate={isBlasting ? { opacity: 0, scale: 0.9 } : { rotate: -360 }}
            transition={isBlasting ? { duration: 0.2 } : { duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 h-full w-full"
          >
            <circle
              cx="150"
              cy="150"
              r="112"
              fill="none"
              stroke={isDay ? "rgba(217, 164, 65, 0.55)" : "rgba(56, 189, 248, 0.65)"}
              strokeWidth="1"
              strokeDasharray="2 14"
            />
          </motion.svg>

          {/* The emblem blooms in at 100% (or triggers Atom Burst on Enter) */}
          <AnimatePresence>
            {!isBlasting && isReady && (
              <motion.div
                key="emblem"
                initial={{ opacity: 0, scale: 0.55, filter: 'blur(14px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
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

          {/* The Atom Burst & Mirror Break Sequence (Smooth 1.5s explosion) */}
          {isBlasting && <AtomBurstMirrorBlast isDay={isDay} />}

          {/* Percentage readout */}
          <AnimatePresence mode="wait">
            {!isReady && (
              <motion.div
                key="pct"
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className={`flex items-start font-black leading-none tracking-tighter ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                  <motion.span
                    key={Math.floor(progress)}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-6xl sm:text-7xl tabular-nums"
                  >
                    {Math.floor(progress)}
                  </motion.span>
                  <span className={`ml-1 mt-1 text-lg font-bold ${isDay ? 'text-[#D9A441]' : 'text-[#38BDF8]'}`}>%</span>
                </div>
                <div className="mt-3 h-4 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={status}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`text-[10px] font-black uppercase tracking-[0.28em] whitespace-nowrap ${
                        isDay ? 'text-[#071426]/75' : 'text-white/80'
                      }`}
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
        <motion.div
          animate={isBlasting ? { opacity: 0, scale: 0.9, y: 10 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-8"
        >
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
                  disabled={isBlasting}
                  data-cursor-label="ARENA"
                  className={`group relative overflow-hidden px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl border font-black tracking-[0.22em] uppercase text-xs transition-all duration-300 hover:scale-[1.02] focus:outline-none ${
                    isDay
                      ? 'border-[#D9A441] bg-gradient-to-r from-[#FFD21F] via-[#FFE27A] to-[#D9A441] text-[#071426] shadow-[0_8px_25px_rgba(217,164,65,0.35)] hover:shadow-[0_12px_32px_rgba(217,164,65,0.55)]'
                      : 'border-[#38BDF8] bg-gradient-to-r from-[#38BDF8] via-[#FFFFFF] to-[#1264FF] text-[#040B17] shadow-[0_8px_30px_rgba(56,189,248,0.45)] hover:shadow-[0_12px_36px_rgba(56,189,248,0.65)]'
                  }`}
                >
                  <span className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100 ${
                    isDay ? 'bg-gradient-to-r from-[#FFD21F] to-[#FFFFFF]' : 'bg-gradient-to-r from-white to-[#BAE6FD]'
                  }`} />
                  <span className="relative z-10 flex items-center gap-2.5 font-black">
                    <span>ENTER THE ARENA</span>
                    <span className="text-sm transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>

                {/* Button 2: Sports Secretary (Admin Login Portal) */}
                <button
                  onClick={goToAdmin}
                  disabled={isBlasting}
                  data-cursor-label="ADMIN"
                  className="group relative overflow-hidden px-7 py-3.5 sm:px-9 sm:py-4 rounded-xl border border-slate-300/80 bg-[#F1F5F9] text-slate-800 font-black tracking-[0.2em] uppercase text-xs transition-all duration-300 hover:border-[#1264FF] hover:bg-[#1264FF] hover:scale-[1.02] shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_rgba(18,100,255,0.45)] focus:outline-none"
                >
                  <span className="absolute inset-0 origin-left scale-x-0 bg-[#1264FF] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
                  <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-white">
                    <span>SPORTS SECRETARY</span>
                    <span className="text-sm transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">↗</span>
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
        </motion.div>
      </div>

      {/* --- Bottom Rail ------------------------------------------ */}
      <motion.div
        animate={isBlasting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-10"
      >
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
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
