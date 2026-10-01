import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

export interface TimelineEvent {
  id: string;
  sequence?: number;
  time: string;
  description: string;
  team?: 'A' | 'B';
  teamName?: string;
  type: string;
  playerName?: string;
  scoreText?: string;
  isCorrection?: boolean;
}

const getEventBadge = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'goal') {
    return { icon: '⚽', label: 'GOAL', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  }
  if (t === 'goal_removed') {
    return { icon: '❌', label: 'GOAL CANCELLED', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
  }
  if (t === 'yellow_card') {
    return { icon: '🟨', label: 'YELLOW CARD', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  if (t === 'red_card') {
    return { icon: '🟥', label: 'RED CARD', color: 'text-red-400 bg-red-500/15 border-red-500/30' };
  }
  if (t === 'substitution' || t === 'sub') {
    return { icon: '🔄', label: 'SUBSTITUTION', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
  }
  if (t === 'half_time') {
    return { icon: '⏱️', label: 'HALF TIME', color: 'text-[#D9A441] bg-[#D9A441]/15 border-[#D9A441]/30' };
  }
  if (t === 'second_half') {
    return { icon: '⏱️', label: '2ND HALF', color: 'text-[#D9A441] bg-[#D9A441]/15 border-[#D9A441]/30' };
  }
  if (t === 'match_start') {
    return { icon: '🟢', label: 'MATCH START', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  }
  if (t === 'match_end' || t === 'full_time') {
    return { icon: '🏁', label: 'FULL TIME', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
  }
  // Cricket
  if (t === 'four') {
    return { icon: '🏏', label: 'FOUR', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  if (t === 'six') {
    return { icon: '🔥', label: 'SIX', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
  }
  if (t === 'ten') {
    return { icon: '⭐', label: 'TEN', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' };
  }
  if (t === 'wicket') {
    return { icon: '🎯', label: 'WICKET', color: 'text-red-400 bg-red-500/15 border-red-500/30' };
  }
  if (t === 'dot') {
    return { icon: '⚪', label: 'DOT BALL', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' };
  }
  if (t === 'single' || t === 'double' || t === 'triple' || t === 'run' || t === 'ball') {
    return { icon: '🏏', label: 'RUNS', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
  }
  if (t === 'wide' || t === 'no_ball' || t === 'bye' || t === 'leg_bye') {
    return { icon: '⚠️', label: 'EXTRA', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
  }
  if (t === 'over_completed') {
    return { icon: '⏱️', label: 'OVER END', color: 'text-[#D9A441] bg-[#D9A441]/15 border-[#D9A441]/30' };
  }
  if (t === 'innings_start') {
    return { icon: '🏏', label: 'INNINGS START', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  }
  if (t === 'innings_end' || t === 'innings_completed') {
    return { icon: '🏁', label: 'INNINGS END', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  if (t === 'drinks_break' || t === 'break') {
    return { icon: '🥤', label: 'DRINKS BREAK', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
  }
  // Court, Combat & Board Events
  if (t === 'point') {
    return { icon: '🎯', label: 'POINT', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  if (t === 'point_removed') {
    return { icon: '❌', label: 'POINT CANCELLED', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
  }
  if (t === 'set_started') {
    return { icon: '🏐', label: 'SET START', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
  }
  if (t === 'set_completed' || t === 'set_won') {
    return { icon: '🏆', label: 'SET COMPLETE', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
  }
  if (t === 'game_won') {
    return { icon: '🏸', label: 'GAME WON', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
  }
  if (t === 'round_win' || t === 'round_won') {
    return { icon: '🔫', label: 'ROUND WON', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  }
  if (t === 'round_removed') {
    return { icon: '❌', label: 'ROUND CANCELLED', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
  }
  if (t === 'carrom_coin') {
    return { icon: '⚪', label: 'COIN POCKETED', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  if (t === 'queen_pocketed' || t === 'queen') {
    return { icon: '👑', label: 'QUEEN COVERED', color: 'text-pink-400 bg-pink-500/15 border-pink-500/30' };
  }
  if (t === 'board_completed') {
    return { icon: '🎯', label: 'BOARD COMPLETE', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  }
  if (t === 'chess_move') {
    return { icon: '♟️', label: 'CHESS MOVE', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
  }
  if (t === 'chess_result') {
    return { icon: '♔', label: 'CHESS RESULT', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' };
  }
  if (t === 'timeout') {
    return { icon: '⏱️', label: 'TIMEOUT', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' };
  }
  return { icon: '•', label: 'MATCH EVENT', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' };
};

export const MatchTimeline: React.FC<{ events?: TimelineEvent[]; className?: string }> = ({ 
  events = [], 
  className 
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border flex flex-col h-[420px] backdrop-blur-xl transition-all shadow-xl",
        isDay
          ? "bg-white/80 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
          : "bg-[#071426]/90 border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
        <h3
          className={cn(
            "text-lg font-black uppercase tracking-widest flex items-center gap-2",
            isDay ? "text-[#071426]" : "text-white"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-[#155EEF]" />
          Match Timeline
        </h3>
        <span className={cn("text-xs font-bold uppercase tracking-wider", isDay ? "text-[#071426]/50" : "text-white/40")}>
          Authoritative Feed
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar smooth-scroll-y">
        {events.length === 0 ? (
          <div className={cn("flex flex-col items-center justify-center h-full text-sm font-medium", isDay ? "text-[#071426]/40" : "text-white/40")}>
            <span className="text-xl mb-1">⏱️</span>
            No events recorded yet.
          </div>
        ) : (
          events.map((event, i) => {
            const badge = getEventBadge(event.type);
            const isNeutral = !event.team;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "flex items-start gap-2.5",
                  isNeutral 
                    ? "justify-center" 
                    : event.team === 'A' 
                      ? "flex-row" 
                      : "flex-row-reverse"
                )}
              >
                {!isNeutral && (
                  <div
                    className={cn(
                      "w-2.5 h-2.5 mt-3.5 rounded-full shrink-0 shadow-sm",
                      event.team === 'A' ? "bg-[#1264FF]" : "bg-[#FF4D3D]"
                    )}
                  />
                )}

                <div
                  className={cn(
                    "p-3.5 rounded-xl border transition-colors shadow-sm",
                    isNeutral
                      ? "max-w-[90%] text-center border-dashed"
                      : "max-w-[85%]",
                    isDay
                      ? isNeutral ? "bg-[#FAF7EE] border-[#071426]/15" : "bg-[#F7F6F1] border-[#071426]/10 text-left"
                      : isNeutral ? "bg-white/[0.03] border-white/10" : "bg-white/5 border-white/10 text-left"
                  )}
                >
                  <div className={cn("flex items-center gap-1.5 flex-wrap mb-1.5", isNeutral && "justify-center")}>
                    {event.sequence !== undefined && (
                      <span className="font-mono text-[9px] text-[#FFD21F] bg-black/50 px-1.5 py-0.5 rounded font-bold">
                        #{event.sequence}
                      </span>
                    )}

                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1", badge.color)}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[#D9A441] font-black text-xs tabular-nums">
                      {event.time}
                    </span>

                    {event.isCorrection && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                        Correction
                      </span>
                    )}
                  </div>

                  <p className={cn("text-xs sm:text-sm font-semibold leading-relaxed", isDay ? "text-[#071426]" : "text-white")}>
                    {event.description}
                  </p>

                  {event.scoreText && (
                    <div className="mt-1.5 text-[11px] font-mono font-bold text-[#D9A441]">
                      Score: {event.scoreText}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
