import React, { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  tiltAngle?: number;
  perspective?: number;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  cursorLabel?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  tiltAngle = 12,
  perspective = 1000,
  className = '',
  glowColor = 'rgba(217, 164, 65, 0.15)',
  onClick,
  cursorLabel,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 25, mass: 0.6 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [tiltAngle, -tiltAngle]), springConfig);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-tiltAngle, tiltAngle]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    rawX.set(x);
    rawY.set(y);
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [rawX, rawY, mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className={`relative ${className}`}
      data-cursor-label={cursorLabel}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full w-full transition-shadow duration-300"
      >
        {children}

        {/* Dynamic Specular Lighting Sheen */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) =>
                `radial-gradient(circle 240px at ${x}px ${y}px, ${glowColor}, transparent 80%)`,
            ),
          }}
        />
      </motion.div>
    </div>
  );
};

export default TiltCard;
