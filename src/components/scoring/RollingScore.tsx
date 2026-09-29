import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * Broadcast-style rolling numerals.
 *
 * Every digit lives in a fixed-width, overflow-hidden cell. When the value
 * changes the outgoing glyph slides out the bottom while the incoming glyph
 * drops in from the top — the classic score-bug roll.
 */

const ROLL_SPRING = { type: 'spring', stiffness: 340, damping: 30, mass: 0.7 } as const;

/** Column widths are per-glyph so `184/4` and `3 – 1` keep their rhythm. */
const widthFor = (char: string): string => {
  if (/[0-9]/.test(char)) return '0.62em';
  if (char === '/') return '0.42em';
  if (char === '-' || char === '\u2013' || char === '\u2014') return '0.55em';
  if (char === ':') return '0.36em';
  if (char === '.') return '0.3em';
  if (char === '\u00bd') return '0.6em';
  return '0.5em';
};

const RollingCell: React.FC<{ char: string }> = ({ char }) => (
  <span
    className="relative inline-block overflow-hidden align-baseline"
    style={{ width: widthFor(char), height: '1.06em' }}
  >
    <AnimatePresence initial={false}>
      <motion.span
        key={char}
        initial={{ y: '-115%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        exit={{ y: '115%', opacity: 0 }}
        transition={ROLL_SPRING}
        className="absolute inset-0 flex items-center justify-center leading-none"
      >
        {char}
      </motion.span>
    </AnimatePresence>
  </span>
);

export const RollingScore: React.FC<{ value: number | string; className?: string }> = ({
  value,
  className,
}) => {
  const chars = String(value).split('');
  return (
    <span className={cn('inline-flex items-center justify-center tabular-nums', className)}>
      {chars.map((char, index) => (
        <RollingCell key={index} char={char} />
      ))}
    </span>
  );
};

/**
 * Same roll, but the whole string cross-fades — used for status words
 * (`SCHEDULED` → `LIVE` → `FINAL`) where a per-glyph roll is too busy.
 */
export const RollingLabel: React.FC<{ value: string; className?: string }> = ({ value, className }) => (
  <span className={cn('relative inline-block overflow-hidden align-bottom', className)}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ y: '110%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        exit={{ y: '-110%', opacity: 0 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        className="block whitespace-nowrap"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

export default RollingScore;
