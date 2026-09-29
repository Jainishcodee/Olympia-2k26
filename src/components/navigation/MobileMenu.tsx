import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface MobileMenuProps {
  items: { label: string; href: string; }[];
  onClose: () => void;
  currentPath: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ items, onClose, currentPath }) => {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'circle(0% at 100% 0)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 100% 0)' }}
      exit={{ opacity: 0, clipPath: 'circle(0% at 100% 0)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-40 bg-[#080A0D] flex flex-col justify-center px-8"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#071426]/50 to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col space-y-6">
        {items.map((item, i) => {
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
            >
              <Link
                to={item.href}
                onClick={onClose}
                className={cn(
                  "text-4xl font-black uppercase tracking-tighter transition-colors block",
                  isActive ? "text-[#D9A441]" : "text-white hover:text-[#1264FF]"
                )}
              >
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-12 left-8 text-white/30 text-xs font-bold tracking-widest uppercase"
      >
        Olympia Digital Arena 2K26
      </motion.div>
    </motion.div>
  );
};
