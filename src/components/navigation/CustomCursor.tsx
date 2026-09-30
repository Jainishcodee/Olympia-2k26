import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

type CursorMode = 'default' | 'hover' | 'label' | 'magnetic';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(true);
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);

  // Velocity tracking for cursor stretch
  const vx = useVelocity(x);
  const vy = useVelocity(y);

  const dotX = useSpring(x, { stiffness: 1500, damping: 70, mass: 0.2 });
  const dotY = useSpring(y, { stiffness: 1500, damping: 70, mass: 0.2 });
  const ringX = useSpring(x, { stiffness: 280, damping: 24, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 280, damping: 24, mass: 0.5 });
  const haloX = useSpring(x, { stiffness: 110, damping: 18, mass: 0.9 });
  const haloY = useSpring(y, { stiffness: 110, damping: 18, mass: 0.9 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        'a, button, [data-cursor-label], .interactive',
      ) as HTMLElement | null;

      if (!target) {
        setMode('default');
        setLabel('');
        return;
      }

      const custom = target.getAttribute('data-cursor-label');
      if (custom) {
        setMode('label');
        setLabel(custom);
      } else {
        setMode('hover');
        setLabel('');
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, [x, y]);

  if (!enabled) return null;

  const ringSize = mode === 'label' ? 88 : mode === 'hover' ? 56 : 32;
  const accentColor = isDay ? '#155EEF' : '#D9A441';
  const highlightColor = isDay ? '#D9A441' : '#FFD21F';

  return (
    <>
      {/* Halo — deepest layer with lag and glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[98] rounded-full"
        style={{
          x: haloX,
          y: haloY,
          width: 72,
          height: 72,
          marginLeft: -36,
          marginTop: -36,
          borderColor: isDay ? 'rgba(21, 94, 239, 0.25)' : 'rgba(217, 164, 65, 0.25)',
          borderWidth: 1,
        }}
        animate={{
          opacity: visible ? (mode === 'default' ? 0.6 : 0.2) : 0,
          scale: mode === 'label' ? 1.3 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Ring — medium responsiveness with label pill */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full backdrop-blur-[2px]"
        style={{
          x: ringX,
          y: ringY,
          borderColor: accentColor,
          borderWidth: 1.5,
          backgroundColor: isDay ? 'rgba(21, 94, 239, 0.08)' : 'rgba(217, 164, 65, 0.12)',
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          opacity: visible ? 1 : 0,
          scale: mode === 'hover' ? 1.15 : 1,
        }}
        transition={{ type: 'spring', stiffness: 360, damping: 25 }}
      >
        {mode === 'label' && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ color: isDay ? '#071426' : '#FFD21F' }}
          >
            {label}
          </motion.span>
        )}
      </motion.div>

      {/* Dot — fastest, pinpoint target */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[101] h-1.5 w-1.5 rounded-full"
        style={{
          x: dotX,
          y: dotY,
          marginLeft: -3,
          marginTop: -3,
          backgroundColor: highlightColor,
          boxShadow: `0 0 10px ${highlightColor}`,
        }}
        animate={{
          opacity: visible && mode !== 'label' ? 1 : 0,
          scale: mode === 'hover' ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      />
    </>
  );
};

export default CustomCursor;
