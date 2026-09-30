import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Magnetic, SplitText } from '@/components/motion';
import { Link } from 'react-router-dom';
import { OlympiaEmblem } from '@/components/arena/OlympiaEmblem';

export const LeaderboardCTA: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <section className={`my-24 rounded-3xl p-10 md:p-16 border relative overflow-hidden text-center ${
      isDay
        ? 'bg-gradient-to-b from-white via-[#FAF6EC] to-[#F7F6F1] border-[#071426]/12 shadow-[0_20px_50px_rgba(7,20,38,0.06)]'
        : 'bg-gradient-to-b from-[#0B1729] to-[#040B17] border-[#D9A441]/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
    }`}>
      {/* Background Olympia Metallic Emblem Floating */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-15 pointer-events-none">
        <OlympiaEmblem orbits={false} breathe={true} depth={10} tilt={6} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        <span className={`text-[10px] font-black uppercase tracking-[0.35em] mb-4 ${
          isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
        }`}>
          WHO'S NEXT? · OLYMPIA 2K26
        </span>

        <h3 className={`text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4 ${
          isDay ? 'text-[#071426]' : 'text-white'
        }`}>
          <SplitText text="THE NEXT CHAMPION" charClassName={isDay ? 'text-[#071426]' : 'text-white'} />
          <br />
          <span className={isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'}>
            <SplitText text="STARTS HERE." delay={0.2} />
          </span>
        </h3>

        <p className={`text-sm md:text-base leading-relaxed mb-8 ${
          isDay ? 'text-[#071426]/70' : 'text-white/70'
        }`}>
          Every point, set, and victory reverberates across the arena ranking wall.
          Join the spectator broadcasts and witness history in the making.
        </p>

        <Magnetic strength={0.4} radius={120}>
          <Link
            to="/live"
            className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl hover:scale-105 ${
              isDay
                ? 'bg-[#071426] text-white hover:bg-[#155EEF]'
                : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] hover:brightness-110 shadow-[0_0_30px_rgba(217,164,65,0.4)]'
            }`}
          >
            <span>View Live Arena Encounters</span>
            <span className="text-lg">→</span>
          </Link>
        </Magnetic>
      </div>
    </section>
  );
};
