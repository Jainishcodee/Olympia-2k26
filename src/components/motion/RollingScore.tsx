import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RollingDigitProps {
  digit: string;
  className?: string;
}

const RollingDigit: React.FC<RollingDigitProps> = ({ digit, className = '' }) => {
  const isNumber = !isNaN(Number(digit));

  if (!isNumber) {
    return <span className={className}>{digit}</span>;
  }

  const num = Number(digit);

  return (
    <div className={`relative inline-block overflow-hidden h-[1.15em] leading-none ${className}`}>
      <motion.div
        key={num}
        initial={{ y: '100%', filter: 'blur(2px)' }}
        animate={{ y: '0%', filter: 'blur(0px)' }}
        exit={{ y: '-100%', filter: 'blur(2px)' }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
          mass: 0.8,
        }}
        className="inline-block"
      >
        {num}
      </motion.div>
    </div>
  );
};

interface RollingScoreProps {
  value: number | string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const RollingScore: React.FC<RollingScoreProps> = ({
  value,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const str = String(value);

  return (
    <div className={`inline-flex items-center tabular-nums ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <AnimatePresence mode="popLayout" initial={false}>
        {str.split('').map((char, index) => (
          <RollingDigit key={`${index}-${char}`} digit={char} />
        ))}
      </AnimatePresence>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </div>
  );
};

export default RollingScore;
