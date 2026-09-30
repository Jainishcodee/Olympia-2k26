import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

interface ScoreDisplayProps {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  time?: string;
  className?: string;
}

const NumberColumn: React.FC<{ value: number }> = ({ value }) => (
  <div className="relative h-[1em] overflow-hidden leading-none px-1 sm:px-2">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={value}
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {value}
      </motion.div>
    </AnimatePresence>
    {/* Invisible placeholder to maintain width */}
    <div className="invisible">{value}</div>
  </div>
);

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ teamA, teamB, scoreA, scoreB, status, time, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={cn(
        "w-full border-y py-8 sm:py-12 md:py-20 relative overflow-hidden transition-colors",
        isDay
          ? "bg-gradient-to-b from-[#F0ECE1] to-[#E5DEC9] border-[#071426]/10 text-[#071426]"
          : "bg-[#071426] border-white/10 text-white",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1747B8]/15 via-transparent to-transparent opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center">
        {status === 'live' && (
          <div className="flex items-center space-x-2 mb-6 sm:mb-8 bg-[#FF4D3D]/10 border border-[#FF4D3D]/30 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#FF4D3D] animate-pulse" />
            <span className="text-[#FF4D3D] font-black text-xs sm:text-sm tracking-widest uppercase">
              {time || 'LIVE BROADCAST'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between w-full max-w-4xl">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0 px-2">
            <div
              className={cn(
                "w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full mb-3 sm:mb-5 flex items-center justify-center text-2xl sm:text-4xl font-black border shadow-lg transition-transform hover:scale-105",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#155EEF] shadow-sm"
                  : "bg-white/5 border-white/10 text-[#FFD21F] shadow-2xl"
              )}
            >
              {teamA.charAt(0)}
            </div>
            <h2
              className={cn(
                "text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tight truncate max-w-full",
                isDay ? "text-[#071426]" : "text-white"
              )}
            >
              {teamA}
            </h2>
          </div>

          {/* Central Score */}
          <div className="flex items-center justify-center px-2 sm:px-6 md:px-10 shrink-0">
            <div
              className={cn(
                "text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter flex items-center p-3 sm:p-6 md:p-8 rounded-2xl border shadow-2xl tabular-nums",
                isDay
                  ? "bg-white/90 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.08)]"
                  : "bg-black/60 border-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
              )}
            >
              <NumberColumn value={scoreA} />
              <span className={cn("mx-1 sm:mx-3 md:mx-4 -translate-y-1 sm:-translate-y-2", isDay ? "text-[#071426]/30" : "text-white/30")}>
                -
              </span>
              <NumberColumn value={scoreB} />
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0 px-2">
            <div
              className={cn(
                "w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full mb-3 sm:mb-5 flex items-center justify-center text-2xl sm:text-4xl font-black border shadow-lg transition-transform hover:scale-105",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#FF4D3D] shadow-sm"
                  : "bg-white/5 border-white/10 text-[#FF4D3D] shadow-2xl"
              )}
            >
              {teamB.charAt(0)}
            </div>
            <h2
              className={cn(
                "text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tight truncate max-w-full",
                isDay ? "text-[#071426]" : "text-white"
              )}
            >
              {teamB}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};
