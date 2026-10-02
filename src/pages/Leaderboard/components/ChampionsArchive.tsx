import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard } from '@/components/motion';
import { Tournament } from '@/types';

export interface ChampionRecord {
  year: string;
  sport: string;
  title: string;
  winner: string;
  tagline: string;
  image?: string;
}

export const ChampionsArchive: React.FC<{
  tournaments?: Tournament[];
}> = ({ tournaments = [] }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // Only real completed tournaments become historical champions
  const completedTournaments = (tournaments || []).filter((t) => t.status === 'completed');

  return (
    <section className="my-24 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-2">
        <div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}`}>
            PANTHEON ARCHIVE
          </span>
          <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tight ${isDay ? 'text-[#071426]' : 'text-white'}`}>
            OLYMPIA CHAMPIONS
          </h3>
        </div>
        <p className={`text-xs font-bold uppercase tracking-widest ${isDay ? 'text-[#071426]/60' : 'text-white/50'}`}>
          Immortalized Title Holders
        </p>
      </div>

      {completedTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {completedTournaments.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <TiltCard
                tiltAngle={7}
                glowColor="rgba(217, 164, 65, 0.2)"
                cursorLabel="ARCHIVE"
              >
                <div
                  className={`relative rounded-3xl overflow-hidden border p-6 md:p-8 flex flex-col justify-between min-h-[300px] group ${
                    isDay
                      ? 'bg-gradient-to-b from-white to-[#F7F6F1] border-[#071426]/12 shadow-[0_10px_30px_rgba(7,20,38,0.06)]'
                      : 'bg-gradient-to-b from-[#111C2E] to-[#040B17] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#D9A441] text-[#071426] font-black text-xs uppercase tracking-widest shadow-sm">
                      2026 CHAMPION
                    </span>
                    <span className={`text-xs font-black uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                      {t.sportId}
                    </span>
                  </div>

                  {/* Bottom Details */}
                  <div className="relative z-10 mt-12">
                    <span className={`text-xs font-bold uppercase tracking-wider block ${isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}`}>
                      {t.name}
                    </span>
                    <h4 className={`text-2xl font-black uppercase tracking-tight mt-1 mb-2 ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                      Tournament Finalist
                    </h4>
                    <p className={`text-xs font-medium ${isDay ? 'text-[#071426]/70' : 'text-white/70'}`}>
                      Official tournament concluded at {t.venue || 'Olympia Arena'}.
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <div
          className={`p-8 sm:p-12 rounded-3xl border text-center transition-all ${
            isDay
              ? 'bg-white/80 border-[#071426]/10 text-[#071426]'
              : 'bg-[#071426]/80 border-white/10 text-white'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center justify-center text-3xl">
            🏆
          </div>
          <h4 className="text-lg sm:text-xl font-black uppercase tracking-wider mb-2">
            Olympia 2K26 In Progress
          </h4>
          <p className={`max-w-md mx-auto text-xs sm:text-sm font-medium ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
            Official championship title holders and podium crowns will be permanently enshrined in the Pantheon Archive as tournament finals conclude.
          </p>
        </div>
      )}
    </section>
  );
};

export default ChampionsArchive;
