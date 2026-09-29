import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface VotingPanelProps {
  teamA: string;
  teamB: string;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({ teamA, teamB }) => {
  const [votedFor, setVotedFor] = useState<'A' | 'B' | null>(null);
  const [votes, setVotes] = useState({ A: 1240, B: 850 });

  const total = votes.A + votes.B;
  const pctA = (votes.A / total) * 100;
  const pctB = (votes.B / total) * 100;

  const handleVote = (team: 'A' | 'B') => {
    if (votedFor) return;
    setVotedFor(team);
    setVotes(prev => ({ ...prev, [team]: prev[team] + 1 }));
  };

  return (
    <div className="bg-[#071426] border border-[#1747B8]/30 p-8 text-center relative overflow-hidden">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Who will win?</h3>
      
      {!votedFor ? (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote('A')}
            className="w-full md:w-auto px-8 py-4 bg-[#1264FF]/10 border border-[#1264FF] text-[#1264FF] font-black uppercase tracking-widest hover:bg-[#1264FF] hover:text-white transition-colors"
          >
            {teamA}
          </motion.button>
          
          <span className="text-white/30 font-bold uppercase mx-4">OR</span>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote('B')}
            className="w-full md:w-auto px-8 py-4 bg-[#FF4D3D]/10 border border-[#FF4D3D] text-[#FF4D3D] font-black uppercase tracking-widest hover:bg-[#FF4D3D] hover:text-white transition-colors"
          >
            {teamB}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2">
            <span className={cn("font-black uppercase", votedFor === 'A' ? "text-[#1264FF]" : "text-white")}>{teamA}</span>
            <span className="text-white/50 text-sm font-bold">{votes.A.toLocaleString()} votes</span>
          </div>
          <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-[#1264FF]"
            />
          </div>
          
          <div className="flex justify-between items-end mb-2">
            <span className={cn("font-black uppercase", votedFor === 'B' ? "text-[#FF4D3D]" : "text-white")}>{teamB}</span>
            <span className="text-white/50 text-sm font-bold">{votes.B.toLocaleString()} votes</span>
          </div>
          <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-[#FF4D3D]"
            />
          </div>
          
          <p className="text-[#D9A441] text-xs font-bold uppercase tracking-widest mt-6">Vote recorded. The arena acknowledges.</p>
        </div>
      )}
    </div>
  );
};
