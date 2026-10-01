import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

interface TimelineEvent {
  id: string;
  sequence?: number;
  time: string;
  description: string;
  team?: 'A' | 'B';
  type: 'goal' | 'card' | 'sub' | 'info' | string;
  isCorrection?: boolean;
}

const mockEvents: TimelineEvent[] = [
  { id: '1', time: '12\'', description: 'Match started', type: 'info' },
  { id: '2', time: '24\'', description: 'Goal by Player 7', team: 'A', type: 'goal' },
  { id: '3', time: '45\'', description: 'Yellow card for Player 3', team: 'B', type: 'card' },
];

export const MatchTimeline: React.FC<{ events?: TimelineEvent[]; className?: string }> = ({ 
  events = mockEvents, 
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
        "p-6 rounded-2xl border flex flex-col h-[380px] backdrop-blur-xl transition-all shadow-xl",
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
          Live Feed
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar smooth-scroll-y">
        {events.length === 0 ? (
          <div className={cn("flex items-center justify-center h-full text-sm font-medium", isDay ? "text-[#071426]/40" : "text-white/40")}>
            No events recorded yet.
          </div>
        ) : (
          events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: event.team === 'A' ? -20 : event.team === 'B' ? 20 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start ${
                event.team === 'A' ? 'flex-row' : event.team === 'B' ? 'flex-row-reverse' : 'flex-row justify-center'
              }`}
            >
              {event.team && (
                <div
                  className={`w-2.5 h-2.5 mt-2 rounded-full shrink-0 ${
                    event.team === 'A' ? 'bg-[#1264FF] mr-3' : 'bg-[#FF4D3D] ml-3'
                  }`}
                />
              )}
              <div
                className={cn(
                  "p-3 rounded-xl max-w-[85%] border transition-colors",
                  isDay
                    ? "bg-[#F7F6F1] border-[#071426]/5"
                    : "bg-white/5 border-white/5",
                  event.team === 'A' ? 'text-left' : event.team === 'B' ? 'text-right' : 'text-center w-full'
                )}
              >
                {event.sequence !== undefined && (
                  <span className="font-mono text-[10px] text-[#FFD21F] bg-black/40 px-1.5 py-0.5 rounded mr-1.5 font-bold">
                    #{event.sequence}
                  </span>
                )}
                <span className="text-[#D9A441] font-black text-xs mr-2">{event.time}</span>
                <span className={cn("text-xs sm:text-sm font-semibold", isDay ? "text-[#071426]" : "text-white")}>
                  {event.description}
                </span>
                {event.isCorrection && (
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                    Audit Correction
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
