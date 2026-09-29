import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Page-position hairline. Spring-smoothed so it lags the scroll slightly —
 * the same velocity trick used by the cursor, applied to navigation.
 */
export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[2px] origin-left"
    >
      <div
        className="h-full w-full"
        style={{ background: 'linear-gradient(90deg, #1264FF 0%, #D9A441 55%, #FFD21F 100%)' }}
      />
    </motion.div>
  );
};

export default ScrollProgress;
