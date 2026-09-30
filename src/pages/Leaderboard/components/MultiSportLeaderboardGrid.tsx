import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore } from '@/components/motion';
import { OlympiaEmblem } from '@/components/arena/OlympiaEmblem';

interface DisciplineLeader {
  sportId: string;
  sportName: string;
  emoji: string;
  winnerName: string;
  team: string;
  points: number;
  record: string;
  status: 'champion' | 'live' | 'leading';
  photo?: string;
}

const DISCIPLINE_LEADERS: DisciplineLeader[] = [
  {
    sportId: 'football',
    sportName: 'Football',
    emoji: '⚽',
    winnerName: 'Arjun Mehta',
    team: 'Thunderbolts FC',
    points: 1420,
    record: '12W - 2L',
    status: 'leading',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  },
  {
    sportId: 'cricket',
    sportName: 'Cricket',
    emoji: '🏏',
    winnerName: 'Rahul Dravid Jr',
    team: 'Storm Breakers XI',
    points: 1340,
    record: '11W - 2L',
    status: 'leading',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  },
  {
    sportId: 'volleyball',
    sportName: 'Volleyball',
    emoji: '🏐',
    winnerName: 'Akash Reddy',
    team: 'Spike Masters',
    points: 1280,
    record: '11W - 4L',
    status: 'leading',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
  },
  {
    sportId: 'lan-games',
    sportName: 'LAN Games',
    emoji: '🎮',
    winnerName: 'CyberX',
    team: 'Cyber Phantoms',
    points: 1290,
    record: '12W - 3L',
    status: 'leading',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
  },
  {
    sportId: 'hand-tennis',
    sportName: 'Hand Tennis',
    emoji: '✋',
    winnerName: 'Dev Patel',
    team: 'Thunderbolts FC',
    points: 1140,
    record: '9W - 2L',
    status: 'leading',
    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80',
  },
  {
    sportId: 'badminton',
    sportName: 'Badminton',
    emoji: '🏸',
    winnerName: 'Saurav Gupta',
    team: 'Phoenix United',
    points: 1090,
    record: '8W - 2L',
    status: 'leading',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
  },
];

export const MultiSportLeaderboardGrid: React.FC<{
  onSelectDiscipline?: (sportId: string) => void;
}> = ({ onSelectDiscipline }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <section className="my-24 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-2">
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-[0.3em] ${
              isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
            }`}
          >
            DISCIPLINE SUMMIT
          </span>
          <h3
            className={`text-3xl md:text-4xl font-black uppercase tracking-tight ${
              isDay ? 'text-[#071426]' : 'text-white'
            }`}
          >
            ALL DISCIPLINES · LEADERS & TITLE HOLDERS
          </h3>
        </div>
        <p
          className={`text-xs font-bold uppercase tracking-widest ${
            isDay ? 'text-[#071426]/60' : 'text-white/50'
          }`}
        >
          Top Crown Holders per Sport
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DISCIPLINE_LEADERS.map((item, i) => (
          <motion.div
            key={item.sportId}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
          >
            <TiltCard
              tiltAngle={7}
              glowColor="rgba(217, 164, 65, 0.2)"
              cursorLabel="DISCIPLINE"
              onClick={() => onSelectDiscipline?.(item.sportId)}
            >
              <div
                className={`relative rounded-3xl p-6 sm:p-7 border overflow-hidden transition-all duration-300 group cursor-pointer ${
                  isDay
                    ? 'bg-gradient-to-b from-white to-[#F7F6F1] border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.05)] hover:border-[#155EEF]/50 hover:shadow-[0_15px_40px_rgba(21,94,239,0.1)]'
                    : 'bg-gradient-to-b from-[#0B1A30] to-[#040B17] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#D9A441]/50 hover:shadow-[0_15px_40px_rgba(217,164,65,0.2)]'
                }`}
              >
                {/* Top Header: Game emoji/type on top-left + Olympia Logo on top-right */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {item.sportName}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#D9A441]/40 shadow-sm">
                    <OlympiaEmblem orbits={false} breathe={false} depth={0} tilt={0} />
                  </div>
                </div>

                {/* Champion Cutout & Name */}
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#D9A441] shadow-md bg-black/10">
                    <img
                      src={item.photo}
                      alt={item.winnerName}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-[#D9A441] text-[#071426] text-[8px] font-black text-center py-0.5 uppercase">
                      #01
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D9A441] flex items-center gap-1">
                      <span>👑</span> Current #1 Leader
                    </span>
                    <h4
                      className={`text-lg font-black uppercase tracking-tight truncate ${
                        isDay ? 'text-[#071426]' : 'text-white'
                      }`}
                    >
                      {item.winnerName}
                    </h4>
                    <p
                      className={`text-xs font-bold truncate ${
                        isDay ? 'text-[#071426]/50' : 'text-white/50'
                      }`}
                    >
                      {item.team}
                    </p>
                  </div>
                </div>

                {/* Stat Matrix */}
                <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs relative z-10">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isDay ? 'text-[#071426]/50' : 'text-white/50'
                      }`}
                    >
                      Record
                    </span>
                    <span
                      className={`font-black ${
                        isDay ? 'text-[#071426]' : 'text-white'
                      }`}
                    >
                      {item.record}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isDay ? 'text-[#071426]/50' : 'text-white/50'
                      }`}
                    >
                      Points
                    </span>
                    <div className="text-lg font-black text-[#D9A441] tabular-nums">
                      <RollingScore value={item.points} suffix=" PTS" />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default MultiSportLeaderboardGrid;
