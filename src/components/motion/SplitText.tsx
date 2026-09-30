import React from 'react';
import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  charClassName?: string;
  delay?: number;
  stagger?: number;
  type?: 'chars' | 'words';
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  charClassName = '',
  delay = 0,
  stagger = 0.035,
  type = 'chars',
}) => {
  const items = type === 'chars' ? text.split('') : text.split(' ');

  return (
    <span className={`inline-flex flex-wrap overflow-hidden ${className}`}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-block overflow-hidden">
          <motion.span
            initial={{ y: '110%', rotateX: -60, opacity: 0 }}
            whileInView={{ y: '0%', rotateX: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.65,
              delay: delay + i * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`inline-block ${charClassName}`}
          >
            {item === ' ' ? '\u00A0' : item}
            {type === 'words' && i < items.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export default SplitText;
