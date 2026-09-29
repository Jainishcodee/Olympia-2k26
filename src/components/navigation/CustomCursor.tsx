import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type CursorMode = 'default' | 'hover' | 'label';

/**
 * Three concentric layers travelling at three different spring rates.
 * The velocity spread is what makes the cursor feel like it has mass
 * instead of being glued to the pointer.
 *
 * Any element carrying `data-cursor-label` switches the ring into label mode.
 */
export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(true);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);

  const dotX = useSpring(x, { stiffness: 1400, damping: 70, mass: 0.25 });
  const dotY = useSpring(y, { stiffness: 1400, damping: 70, mass: 0.25 });
  const ringX = useSpring(x, { stiffness: 240, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 240, damping: 26, mass: 0.6 });
  const haloX = useSpring(x, { stiffness: 90, damping: 20, mass: 1 });
  const haloY = useSpring(y, { stiffness: 90, damping: 20, mass: 1 });

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

  const ringSize = mode === 'label' ? 86 : mode === 'hover' ? 58 : 34;

  return (
    <>
      {/* halo — slowest, reads as depth */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[98] rounded-full border border-[#D9A441]/25"
        style={{ x: haloX, y: haloY, width: 66, height: 66, marginLeft: -33, marginTop: -33 }}
        animate={{ opacity: visible ? (mode === 'default' ? 0.55 : 0.25) : 0, scale: mode === 'label' ? 1.25 : 1 }}
        transition={{ duration: 0.35 }}
      />

      {/* ring — medium */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full border border-[#D9A441] bg-[#D9A441]/10 backdrop-blur-[1px]"
        style={{ x: ringX, y: ringY }}
        animate={{
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          opacity: visible ? 1 : 0,
          scale: mode === 'hover' ? 1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {mode === 'label' && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="text-[9px] font-black uppercase tracking-[0.18em] text-[#D9A441]"
          >
            {label}
          </motion.span>
        )}
      </motion.div>

      {/* dot — fastest, inverts against whatever it is over */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[101] h-1.5 w-1.5 rounded-full bg-[#FFD21F]"
        style={{ x: dotX, y: dotY, marginLeft: -3, marginTop: -3 }}
        animate={{
          opacity: visible && mode !== 'label' ? 1 : 0,
          scale: mode === 'hover' ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </>
  );
};

export default CustomCursor;
