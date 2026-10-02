import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore } from '@/components/motion';
import { BRAND } from '@/components/arena/BrandAssets';

export interface DisciplineLeader {
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

export const MultiSportLeaderboardGrid: React.FC<{
  leaders?: DisciplineLeader[];
  onSelectDiscipline?: (sportId: string) => void;
}> = ({ leaders = [], onSelectDiscipline }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  if (!leaders || leaders.length === 0) {
    return null;
  }

  return (
    <section className="my-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-2">
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-[0.3em] ${
              isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
            }`}
          >
            DISCIPLINE SUMMIT
          </span>
          <h3
            className={`text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight ${
              isDay ? 'text-[#071426]' : 'text-white'
            }`}
          >
            ALL DISCIPLINES · TITLE LEADERS
          </h3>
        </div>
        <p
          className={`text-xs font-bold uppercase tracking-widest ${
            isDay ? 'text-[#071426]/60' : 'text-white/50'
          }`}
        >
          Click Any Card to View Discipline Standings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {leaders.map((item, i) => (
          <motion.div
            key={item.sportId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <TiltCard
              tiltAngle={6}
              glowColor="rgba(217, 164, 65, 0.2)"
              cursorLabel="DISCIPLINE"
              onClick={() => onSelectDiscipline?.(item.sportId)}
            >
              <div
                className={`relative rounded-3xl p-5 sm:p-6 border overflow-hidden transition-all duration-300 group cursor-pointer ${
                  isDay
                    ? 'bg-gradient-to-b from-white to-[#F7F6F1] border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.05)] hover:border-[#155EEF]/50 hover:shadow-[0_15px_40px_rgba(21,94,239,0.1)]'
                    : 'bg-gradient-to-b from-[#0B1A30] to-[#040B17] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#D9A441]/50 hover:shadow-[0_15px_40px_rgba(217,164,65,0.2)]'
                }`}
              >
                {/* Top Header: Game emoji + Olympia Logo */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {item.sportName}
                    </span>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center border shadow-sm transition-all duration-300 ${
                      isDay
                        ? 'border-[#D9A441]/40 bg-black/5'
                        : 'border-[#38BDF8]/40 bg-white/5 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                    }`}
                  >
                    <img
                      src={isDay ? BRAND.logo : BRAND.olympiaDark}
                      alt="Olympia"
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                </div>

                {/* Champion Cutout & Name */}
                <div className="flex items-center gap-3.5 mb-4 relative z-10">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#D9A441] shadow-md bg-black/10 flex items-center justify-center">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.winnerName}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-xl">🏆</span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-[#D9A441] text-[#071426] text-[7px] font-black text-center py-0.5 uppercase">
                      #01
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D9A441] flex items-center gap-1">
                      <span>👑</span> Current #1
                    </span>
                    <h4
                      className={`text-base font-black uppercase tracking-tight truncate ${
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
                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs relative z-10">
                  <div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isDay ? 'text-[#071426]/50' : 'text-white/50'
                      }`}
                    >
                      Record
                    </span>
                    <span
                      className={`font-black text-xs ${
                        isDay ? 'text-[#071426]' : 'text-white'
                      }`}
                    >
                      {item.record}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isDay ? 'text-[#071426]/50' : 'text-white/50'
                      }`}
                    >
                      Points
                    </span>
                    <div className="text-base font-black text-[#D9A441] tabular-nums">
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
