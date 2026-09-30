import React from 'react';
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

  return (
    <span className={`relative inline-flex overflow-hidden h-[1.15em] leading-none justify-center items-center ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
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
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
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
    <span className={`inline-flex items-center tabular-nums ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {str.split('').map((char, index) => (
        <RollingDigit key={`${index}-${char}`} digit={char} />
      ))}
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
};

export default RollingScore;

