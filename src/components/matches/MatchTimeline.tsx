import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  id: string;
  time: string;
  description: string;
  team?: 'A' | 'B';
  type: 'goal' | 'card' | 'sub' | 'info';
}

const mockEvents: TimelineEvent[] = [
  { id: '1', time: '12\'', description: 'Match started', type: 'info' },
  { id: '2', time: '24\'', description: 'Goal by Player 7', team: 'A', type: 'goal' },
  { id: '3', time: '45\'', description: 'Yellow card for Player 3', team: 'B', type: 'card' },
];

export const MatchTimeline: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="bg-[#071426] border border-white/10 p-6 flex flex-col h-[400px]">
      <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Timeline</h3>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 space-y-6 hide-scrollbar">
        {mockEvents.map((event, i) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, x: event.team === 'A' ? -20 : event.team === 'B' ? 20 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-start ${event.team === 'A' ? 'flex-row' : event.team === 'B' ? 'flex-row-reverse' : 'flex-row justify-center'}`}
          >
            {event.team && (
              <div className={`w-2 h-2 mt-2 rounded-full ${event.team === 'A' ? 'bg-[#1264FF] mr-4' : 'bg-[#FF4D3D] ml-4'}`} />
            )}
            <div className={`bg-white/5 rounded-sm p-3 ${event.team === 'A' ? 'text-left' : event.team === 'B' ? 'text-right' : 'text-center w-full'} max-w-[80%]`}>
              <span className="text-[#D9A441] font-bold text-xs mr-2">{event.time}</span>
              <span className="text-white text-sm font-medium">{event.description}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
