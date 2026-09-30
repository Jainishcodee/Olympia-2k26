import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard } from '@/components/motion';

interface ChampionRecord {
  year: string;
  sport: string;
  title: string;
  winner: string;
  tagline: string;
  image: string;
}

const HISTORICAL_CHAMPIONS: ChampionRecord[] = [
  {
    year: '2026',
    sport: 'Football',
    title: 'Olympia Grand Series',
    winner: 'Thunderbolts FC',
    tagline: 'Undefeated Cup Run · 18 Goals',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
  },
  {
    year: '2026',
    sport: 'Cricket',
    title: 'Titan Super League',
    winner: 'Storm Breakers XI',
    tagline: 'Record NRR · 340 Run Margin',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  },
  {
    year: '2026',
    sport: 'Volleyball',
    title: 'Spike Championship',
    winner: 'Spike Masters',
    tagline: 'Flawless 5-Set Finals Victor',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80',
  },
];

export const ChampionsArchive: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HISTORICAL_CHAMPIONS.map((champ, i) => (
          <motion.div
            key={champ.sport}
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
                className={`relative rounded-3xl overflow-hidden border p-6 md:p-8 flex flex-col justify-between min-h-[340px] group ${
                  isDay
                    ? 'bg-gradient-to-b from-white to-[#F7F6F1] border-[#071426]/12 shadow-[0_10px_30px_rgba(7,20,38,0.06)]'
                    : 'bg-gradient-to-b from-[#111C2E] to-[#040B17] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
                }`}
              >
                {/* Image Backdrop with Gradient */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={champ.image}
                    alt={champ.winner}
                    className="h-full w-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className={`absolute inset-0 ${isDay ? 'bg-gradient-to-t from-white via-white/80 to-transparent' : 'bg-gradient-to-t from-[#040B17] via-[#040B17]/80 to-transparent'}`} />
                </div>

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#D9A441] text-[#071426] font-black text-xs uppercase tracking-widest shadow-sm">
                    {champ.year} CHAMPION
                  </span>
                  <span className={`text-xs font-black uppercase tracking-wider ${isDay ? 'text-[#071426]/60' : 'text-white/60'}`}>
                    {champ.sport}
                  </span>
                </div>

                {/* Bottom Details */}
                <div className="relative z-10 mt-12">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'}`}>
                    {champ.title}
                  </span>
                  <h4 className={`text-2xl font-black uppercase tracking-tight mt-1 mb-2 ${isDay ? 'text-[#071426]' : 'text-white'}`}>
                    {champ.winner}
                  </h4>
                  <p className={`text-xs font-medium ${isDay ? 'text-[#071426]/70' : 'text-white/70'}`}>
                    {champ.tagline}
                  </p>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
