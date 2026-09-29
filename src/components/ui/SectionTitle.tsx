import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface SectionTitleProps {
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className }) => {
  return (
    <div className={cn("mb-12", className)}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "40px" }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-1 bg-[#D9A441] mb-4"
      />
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-gray-400 mt-2 font-medium tracking-wide"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};
