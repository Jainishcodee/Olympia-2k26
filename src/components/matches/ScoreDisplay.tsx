import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreDisplayProps {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  time?: string;
}

const NumberColumn: React.FC<{ value: number }> = ({ value }) => (
  <div className="relative h-[1em] overflow-hidden leading-none px-2">
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

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ teamA, teamB, scoreA, scoreB, status, time }) => {
  return (
    <div className="w-full bg-[#071426] border-y border-white/10 py-12 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1747B8]/20 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center">
        {status === 'live' && (
          <div className="flex items-center space-x-2 mb-8 bg-[#FF4D3D]/10 border border-[#FF4D3D]/30 px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4D3D] animate-pulse" />
            <span className="text-[#FF4D3D] font-bold text-sm tracking-widest uppercase">{time || 'LIVE'}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-white/5 mb-6 flex items-center justify-center text-4xl font-black text-white/20">A</div>
            <h2 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter text-center">{teamA}</h2>
          </div>
          
          <div className="flex items-center justify-center px-4 md:px-12">
            <div className="text-6xl md:text-[120px] font-black text-white tracking-tighter flex items-center bg-black/40 p-4 md:p-8 rounded-xl border border-white/5 shadow-2xl">
              <NumberColumn value={scoreA} />
              <span className="text-white/30 mx-2 md:mx-6 -translate-y-2">-</span>
              <NumberColumn value={scoreB} />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-white/5 mb-6 flex items-center justify-center text-4xl font-black text-white/20">B</div>
            <h2 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter text-center">{teamB}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};
