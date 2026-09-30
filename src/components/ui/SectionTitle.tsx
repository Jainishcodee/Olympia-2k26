import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface SectionTitleProps {
  eyebrow?: string; // e.g. "05 / THE LINEUP"
  tagline?: string; // e.g. "ALL THE WAYS TO PLAY"
  title: React.ReactNode; // e.g. "WHAT'S"
  highlightTitle?: React.ReactNode; // e.g. "HAPPENING?" in electric blue
  subtitle?: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  eyebrow,
  tagline,
  title,
  highlightTitle,
  subtitle,
  className,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div className={cn("mb-10 sm:mb-14", className)}>
      {/* Inspirational Eyebrow Header Bar matching user reference */}
      {(eyebrow || tagline) && (
        <div className="mb-6 sm:mb-8">
          <div
            className={cn(
              "flex items-center justify-between pb-3 text-xs sm:text-sm font-black uppercase tracking-[0.24em] border-b transition-colors",
              isDay ? "text-[#071426]/60 border-[#071426]/15" : "text-white/60 border-white/15"
            )}
          >
            <span>{eyebrow || "OLYMPIA 2K26"}</span>
            <span className={isDay ? "text-[#1264FF]" : "text-[#D9A441]"}>
              {tagline || "ALL THE WAYS TO PLAY"}
            </span>
          </div>
        </div>
      )}

      {/* Main Punchy Typography */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-1"
      >
        <h2
          className={cn(
            "text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[-0.05em] leading-[0.88] transition-colors",
            isDay ? "text-[#071426]" : "text-white"
          )}
        >
          {title}
        </h2>
        {highlightTitle && (
          <h2
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[-0.05em] leading-[0.88] text-[#1264FF]"
          >
            {highlightTitle}
          </h2>
        )}
      </motion.div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            "mt-4 text-xs sm:text-sm md:text-base font-medium tracking-wide max-w-xl transition-colors",
            isDay ? "text-[#071426]/60" : "text-slate-400"
          )}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

export default SectionTitle;
