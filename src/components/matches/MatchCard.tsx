import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { cn } from '@/utils/cn';

interface MatchCardProps {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  status: 'live' | 'upcoming' | 'completed' | 'cancelled';
  time: string;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ id, sport, teamA, teamB, scoreA, scoreB, status, time, className }) => {
  return (
    <Link to={`/match/${id}`} className={cn("block group", className)}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className={cn(
          "bg-[#071426] border p-6 relative overflow-hidden transition-colors",
          status === 'live' ? "border-[#FF4D3D]/50 hover:border-[#FF4D3D]" : "border-white/10 hover:border-[#1264FF]/50"
        )}
      >
        {status === 'live' && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D3D]/5 to-transparent pointer-events-none" />
        )}
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{sport}</span>
          <Badge status={status}>{status === 'live' ? 'LIVE' : time}</Badge>
        </div>
        
        <div className="flex justify-between items-center relative z-10">
          <div className="text-center flex-1">
            <h3 className="font-black text-white uppercase text-lg">{teamA}</h3>
          </div>
          
          <div className="px-4 text-center">
            {status === 'upcoming' ? (
              <span className="text-xl font-black text-[#D9A441] tracking-tighter">VS</span>
            ) : (
              <div className="flex items-center space-x-2">
                <span className={cn("text-3xl font-black tracking-tighter", (scoreA ?? 0) >= (scoreB ?? 0) ? "text-white" : "text-white/50")}>
                  {scoreA ?? 0}
                </span>
                <span className="text-white/30">-</span>
                <span className={cn("text-3xl font-black tracking-tighter", (scoreB ?? 0) >= (scoreA ?? 0) ? "text-white" : "text-white/50")}>
                  {scoreB ?? 0}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center flex-1">
            <h3 className="font-black text-white uppercase text-lg">{teamB}</h3>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-bold text-[#D9A441] uppercase tracking-widest">
            {status === 'live' ? 'Enter Match →' : 'View Details →'}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};
