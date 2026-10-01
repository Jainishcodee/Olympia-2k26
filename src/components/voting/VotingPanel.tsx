import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoting } from '@/hooks/useVoting';

interface VotingPanelProps {
  matchId?: string;
  teamA: string;
  teamB: string;
  teamAId?: string;
  teamBId?: string;
  allowVoting?: boolean;
  className?: string;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  matchId,
  teamA,
  teamB,
  teamAId = 'A',
  teamBId = 'B',
  allowVoting = true,
  className,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // Real-time hook for canonical match voting
  const { aggregates, userVote, castVote, isLoading } = useVoting(
    matchId || '',
    teamAId,
    teamBId
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // If matchId is not provided, fall back gracefully to local dummy counts
  const total = aggregates.total;
  const countA = aggregates.teamACounts;
  const countB = aggregates.teamBCounts;
  const pctA = aggregates.pctA;
  const pctB = aggregates.pctB;

  const handleVote = async (option: 'A' | 'B') => {
    if (!allowVoting || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await castVote(option);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVoted = Boolean(userVote);
  const votedTeamA = userVote === 'A' || userVote === 'teamA' || userVote === teamAId;
  const votedTeamB = userVote === 'B' || userVote === 'teamB' || userVote === teamBId;

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

      {!allowVoting ? (
        <div className="py-4 text-sm font-semibold opacity-60">
          Voting is currently closed for this match.
        </div>
      ) : !hasVoted ? (
        <div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={isSubmitting || isLoading}
              onClick={() => handleVote('A')}
              className={cn(
                "w-full sm:w-1/2 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm border transition-all shadow-md active:scale-95 disabled:opacity-50",
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
              disabled={isSubmitting || isLoading}
              onClick={() => handleVote('B')}
              className={cn(
                "w-full sm:w-1/2 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm border transition-all shadow-md active:scale-95 disabled:opacity-50",
                isDay
                  ? "bg-[#FF4D3D]/10 border-[#FF4D3D] text-[#FF4D3D] hover:bg-[#FF4D3D] hover:text-white"
                  : "bg-[#FF4D3D]/10 border-[#FF4D3D] text-[#FF4D3D] hover:bg-[#FF4D3D] hover:text-white"
              )}
            >
              Vote {teamB}
            </motion.button>
          </div>

          {total === 0 ? (
            <p className={cn("mt-4 text-xs font-semibold", isDay ? "text-[#071426]/50" : "text-white/40")}>
              Be the first to predict.
            </p>
          ) : (
            <p className={cn("mt-4 text-xs font-semibold", isDay ? "text-[#071426]/50" : "text-white/40")}>
              {total} fan {total === 1 ? 'prediction' : 'predictions'} recorded so far
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          {total === 0 ? (
            <p className={cn("text-xs font-semibold mb-2", isDay ? "text-[#071426]/50" : "text-white/40")}>
              Be the first to predict.
            </p>
          ) : null}

          <div className="flex justify-between items-end mb-1">
            <span className={cn("font-black uppercase text-sm flex items-center gap-1.5", votedTeamA ? "text-[#1264FF] font-black" : isDay ? "text-[#071426]" : "text-white")}>
              {teamA} ({pctA}%)
              {votedTeamA && <span className="text-xs bg-[#1264FF]/20 text-[#1264FF] px-1.5 py-0.5 rounded font-bold">Your Pick</span>}
            </span>
            <span className={cn("text-xs font-bold", isDay ? "text-[#071426]/60" : "text-white/50")}>
              {countA.toLocaleString()} {countA === 1 ? 'vote' : 'votes'}
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
            <span className={cn("font-black uppercase text-sm flex items-center gap-1.5", votedTeamB ? "text-[#FF4D3D] font-black" : isDay ? "text-[#071426]" : "text-white")}>
              {teamB} ({pctB}%)
              {votedTeamB && <span className="text-xs bg-[#FF4D3D]/20 text-[#FF4D3D] px-1.5 py-0.5 rounded font-bold">Your Pick</span>}
            </span>
            <span className={cn("text-xs font-bold", isDay ? "text-[#071426]/60" : "text-white/50")}>
              {countB.toLocaleString()} {countB === 1 ? 'vote' : 'votes'}
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

          <div className="flex items-center justify-between pt-2">
            <p className="text-[#D9A441] text-xs font-bold uppercase tracking-widest">
              ✓ Prediction saved ({total} total)
            </p>
            <button
              type="button"
              onClick={() => handleVote(votedTeamA ? 'B' : 'A')}
              disabled={isSubmitting}
              className={cn("text-xs underline font-semibold transition-colors disabled:opacity-50", isDay ? "text-[#071426]/60 hover:text-[#071426]" : "text-white/60 hover:text-white")}
            >
              Switch to {votedTeamA ? teamB : teamA}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default VotingPanel;
