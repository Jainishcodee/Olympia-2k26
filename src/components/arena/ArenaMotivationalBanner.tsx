import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { OlympiaEmblem } from './OlympiaEmblem';
import { Magnetic, SplitText } from '@/components/motion';

export const ArenaMotivationalBanner: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-16">
      <div
        className={`relative rounded-3xl overflow-hidden border p-8 sm:p-12 md:p-16 transition-all duration-500 shadow-2xl ${
          isDay
            ? 'bg-gradient-to-br from-[#1264FF] via-[#1056E0] to-[#0A3EB0] border-[#1264FF]/40 text-white shadow-[0_25px_60px_rgba(18,100,255,0.35)]'
            : 'bg-gradient-to-br from-[#0B2559] via-[#071638] to-[#040B1A] border-[#1264FF]/30 text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Large Olympia 2K26 Emblem Watermark on Right Side */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 sm:right-6 top-1/2 -translate-y-1/2 w-[320px] sm:w-[480px] md:w-[560px] h-[320px] sm:h-[480px] md:h-[560px] opacity-25 md:opacity-35 select-none"
        >
          <OlympiaEmblem orbits={true} breathe={true} depth={15} tilt={8} />
        </div>

        {/* Top Metadata Line */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/80">
          <span>THIS IS JUST THE BEGINNING</span>
          <span>OLYMPIA 2K26</span>
        </div>

        {/* Hero Editorial Kinetic Typography */}
        <div className="relative z-10 my-10 sm:my-14">
          <h2 className="text-[clamp(3.4rem,10.5vw,9.5rem)] font-black leading-[0.85] tracking-[-0.05em] uppercase text-white drop-shadow-md">
            <span>THE GAME</span>
            <br />
            <span>ISN'T </span>
            <span className="text-[#FFD21F] drop-shadow-[0_0_35px_rgba(255,210,31,0.6)]">
              OVER.
            </span>
          </h2>
        </div>

        {/* Bottom Metadata & Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/20 pt-6 gap-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-white/80">
          {/* Next Match link */}
          <Magnetic strength={0.3} radius={80}>
            <Link
              to="/matches"
              className="inline-flex items-center gap-2 text-white hover:text-[#FFD21F] transition-colors group"
            >
              <span>NEXT MATCH</span>
              <span className="text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5">
                ↗
              </span>
            </Link>
          </Magnetic>

          {/* Slogan */}
          <span className="hidden md:inline-block text-white/70">
            PLAY HARD. PLAY FAIR. PLAY TO WIN.
          </span>

          {/* Back to top */}
          <Magnetic strength={0.3} radius={80}>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 text-white hover:text-[#FFD21F] transition-colors group text-left sm:text-right"
            >
              <span>BACK TO TOP</span>
              <span className="text-sm transition-transform group-hover:-translate-y-1">
                ↑
              </span>
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
};

export default ArenaMotivationalBanner;
