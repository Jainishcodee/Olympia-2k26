import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface VotingPanelProps {
  teamA: string;
  teamB: string;
  className?: string;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({ teamA, teamB, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const [votedFor, setVotedFor] = useState<'A' | 'B' | null>(null);
  const [votes, setVotes] = useState({ A: 0, B: 0 });

  const total = votes.A + votes.B;
  const pctA = total === 0 ? 50 : Math.round((votes.A / total) * 100);
  const pctB = total === 0 ? 50 : 100 - pctA;

  const handleVote = (team: 'A' | 'B') => {
    if (votedFor) return;
    setVotedFor(team);
    setVotes(prev => ({ ...prev, [team]: prev[team] + 1 }));
  };

  return (
    <div
      className={cn(
        "p-6 sm:p-8 rounded-2xl text-center relative overflow-hidden border backdrop-blur-xl transition-all shadow-xl",
        isDay
          ? "bg-white/80 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
          : "bg-[#071426]/90 border-[#1747B8]/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
        <h3
          className={cn(
            "text-xl sm:text-2xl font-black uppercase tracking-tight",
            isDay ? "text-[#071426]" : "text-white"
          )}
        >
          Match Prediction
        </h3>
      </div>

      {!votedFor ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleVote('A')}
            className={cn(
              "w-full sm:w-1/2 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm border transition-all shadow-md active:scale-95",
              isDay
                ? "bg-[#155EEF]/10 border-[#155EEF] text-[#155EEF] hover:bg-[#155EEF] hover:text-white"
                : "bg-[#1264FF]/10 border-[#1264FF] text-[#1264FF] hover:bg-[#1264FF] hover:text-white"
            )}
          >
            Vote {teamA}
          </motion.button>

          <span className={cn("text-xs font-black uppercase tracking-widest my-1 sm:my-0", isDay ? "text-[#071426]/40" : "text-white/30")}>
            VS
          </span>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleVote('B')}
            className={cn(
              "w-full sm:w-1/2 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm border transition-all shadow-md active:scale-95",
              isDay
                ? "bg-[#FF4D3D]/10 border-[#FF4D3D] text-[#FF4D3D] hover:bg-[#FF4D3D] hover:text-white"
                : "bg-[#FF4D3D]/10 border-[#FF4D3D] text-[#FF4D3D] hover:bg-[#FF4D3D] hover:text-white"
            )}
          >
            Vote {teamB}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="flex justify-between items-end mb-1">
            <span className={cn("font-black uppercase text-sm", votedFor === 'A' ? "text-[#1264FF] font-black" : isDay ? "text-[#071426]" : "text-white")}>
              {teamA} ({pctA}%)
            </span>
            <span className={cn("text-xs font-bold", isDay ? "text-[#071426]/60" : "text-white/50")}>
              {votes.A.toLocaleString()} votes
            </span>
          </div>
          <div className={cn("w-full h-3 rounded-full overflow-hidden mb-4", isDay ? "bg-[#071426]/10" : "bg-white/10")}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[#1264FF] rounded-full"
            />
          </div>

          <div className="flex justify-between items-end mb-1">
            <span className={cn("font-black uppercase text-sm", votedFor === 'B' ? "text-[#FF4D3D] font-black" : isDay ? "text-[#071426]" : "text-white")}>
              {teamB} ({pctB}%)
            </span>
            <span className={cn("text-xs font-bold", isDay ? "text-[#071426]/60" : "text-white/50")}>
              {votes.B.toLocaleString()} votes
            </span>
          </div>
          <div className={cn("w-full h-3 rounded-full overflow-hidden", isDay ? "bg-[#071426]/10" : "bg-white/10")}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[#FF4D3D] rounded-full"
            />
          </div>

          <p className="text-[#D9A441] text-xs font-bold uppercase tracking-widest mt-6">
            ✓ Vote recorded. The arena acknowledges.
          </p>
        </div>
      )}
    </div>
  );
};
