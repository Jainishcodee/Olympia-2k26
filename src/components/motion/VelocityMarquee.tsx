import React, { useRef, useEffect } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion';

interface VelocityMarqueeProps {
  children: React.ReactNode;
  baseVelocity?: number;
  className?: string;
  skewEffect?: boolean;
}

export const VelocityMarquee: React.FC<VelocityMarqueeProps> = ({
  children,
  baseVelocity = 1.2,
  className = '',
  skewEffect = true,
}) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const skew = useTransform(smoothVelocity, [-1200, 1200], [-8, 8]);

  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className={`overflow-hidden whitespace-nowrap flex flex-nowrap ${className}`}>
      <motion.div
        className="flex whitespace-nowrap flex-nowrap text-inherit select-none font-black"
        style={{ x, skewX: skewEffect ? skew : 0 }}
      >
        <span className="inline-flex items-center gap-8 px-4">{children}</span>
        <span className="inline-flex items-center gap-8 px-4">{children}</span>
        <span className="inline-flex items-center gap-8 px-4">{children}</span>
        <span className="inline-flex items-center gap-8 px-4">{children}</span>
      </motion.div>
    </div>
  );
};

function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

export default VelocityMarquee;
