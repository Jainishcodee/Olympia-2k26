import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface DisplayAreaProps {
  displayMode: 'dual_portrait' | 'single_landscape';
  participantA: { id: string; name: string; };
  participantB: { id: string; name: string; };
  sportId?: string;
  isLive?: boolean;
}

export const DisplayArea: React.FC<DisplayAreaProps> = ({ displayMode, participantA, participantB, isLive }) => {
  if (displayMode === 'single_landscape') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full aspect-video bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden relative flex items-center justify-between px-12 md:px-24"
      >
        {/* Gradients */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-electric-blue/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-coral/20 to-transparent pointer-events-none" />
        
        {isLive && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
          </div>
        )}

        <div className="text-4xl md:text-6xl font-black text-white relative z-10 w-1/3 text-center truncate">
          {participantA.name}
        </div>
        
        <div className="text-3xl font-bold text-white/30 italic">VS</div>
        
        <div className="text-4xl md:text-6xl font-black text-white relative z-10 w-1/3 text-center truncate">
          {participantB.name}
        </div>
      </motion.div>
    );
  }

  // dual_portrait mode
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row gap-4 w-full h-[600px] md:h-[700px] relative"
    >
      {isLive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 text-white shadow-lg shadow-red-500/20 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
        </div>
      )}

      {/* Participant A */}
      <div className="flex-1 bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-8 group">
        <div className="absolute inset-0 bg-gradient-to-b from-electric-blue/20 to-transparent opacity-50" />
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl font-black text-white/50 mb-8 relative z-10">
          {participantA.name.substring(0, 3).toUpperCase()}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white text-center relative z-10 line-clamp-2">
          {participantA.name}
        </h2>
      </div>

      <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-navy border border-white/20 rounded-full items-center justify-center text-white/50 font-bold italic shadow-xl">
        VS
      </div>

      {/* Participant B */}
      <div className="flex-1 bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-8 group">
        <div className="absolute inset-0 bg-gradient-to-b from-coral/20 to-transparent opacity-50" />
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl font-black text-white/50 mb-8 relative z-10">
          {participantB.name.substring(0, 3).toUpperCase()}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white text-center relative z-10 line-clamp-2">
          {participantB.name}
        </h2>
      </div>
    </motion.div>
  );
};

export default DisplayArea;
