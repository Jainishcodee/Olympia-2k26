import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useTheme } from '@/contexts/ThemeContext';
import { Sport } from '@/types';
import { EmptyNotice } from '@/components/admin/kit';
import { SplitText, Magnetic } from '@/components/motion';

interface SportsUniverseProps {
  sports: Sport[];
}

const SPORT_DISPLAY_CONFIG: Record<string, { gradient: string[]; accent: string; icon: string }> = {
  football: { gradient: ['#1B4F72', '#0D2B4A'], accent: '#1264FF', icon: '⚽' },
  cricket: { gradient: ['#2D6A2D', '#163D16'], accent: '#22C55E', icon: '🏏' },
  volleyball: { gradient: ['#7C2D12', '#431407'], accent: '#F97316', icon: '🏐' },
  'hand-tennis': { gradient: ['#4C1D95', '#2E1065'], accent: '#A855F7', icon: '✋' },
  'table-tennis': { gradient: ['#7C2D12', '#431407'], accent: '#F97316', icon: '🏓' },
  badminton: { gradient: ['#4C1D95', '#2E1065'], accent: '#A855F7', icon: '🏸' },
  chess: { gradient: ['#111827', '#030712'], accent: '#FFD21F', icon: '♚' },
  carrom: { gradient: ['#7C2D12', '#431407'], accent: '#F97316', icon: '🎯' },
  'smash-karts': { gradient: ['#1B4F72', '#0D2B4A'], accent: '#1264FF', icon: '🏎️' },
  'lan-games': { gradient: ['#111827', '#030712'], accent: '#FFD21F', icon: '🎮' },
  'counter-strike': { gradient: ['#111827', '#030712'], accent: '#FFD21F', icon: '🎮' },
};

const defaultConfig = { gradient: ['#071426', '#0B1B33'], accent: '#1264FF', icon: '🏆' };

const getDisplayConfig = (slug: string) => SPORT_DISPLAY_CONFIG[slug] || defaultConfig;

interface SportRowProps {
  sport: Sport;
  index: number;
  total: number;
  isDay: boolean;
}

const SportRow: React.FC<SportRowProps> = ({ sport, index, total, isDay }) => {
  if (!sport) return null;

  const sportSlug = sport.slug || (sport.id as any) || 'sport';
  const displayConfig = getDisplayConfig(sportSlug);
  const icon = sport.icon || displayConfig.icon || '🏆';
  const sportImage = (sport as any).bannerUrl || (sport as any).imageUrl || (sport as any).image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.045, 0.28), ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden transition-all duration-300 ${
        isDay
          ? 'border-b border-[#071426]/15 md:odd:border-r md:odd:border-r-[#071426]/15'
          : 'border-b border-white/10 md:odd:border-r md:odd:border-r-white/10'
      }`}
    >
      <Link
        to={`/sports/${sportSlug}`}
        className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between min-h-[145px] md:min-h-[160px] px-5 py-5 sm:px-7 sm:py-6 md:px-8 md:py-7 gap-4 select-none group h-full"
      >
        {/* ============ Blue Highlight Banner that Sweeps in from Behind ============ */}
        <span
          aria-hidden
          className={`absolute inset-0 -z-10 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 ${
            isDay
              ? 'bg-gradient-to-r from-[#1264FF] via-[#1056E0] to-[#0A3EB0] shadow-[0_15px_45px_rgba(18,100,255,0.3)]'
              : 'bg-gradient-to-r from-[#1264FF] via-[#155EEF] to-[#092252] shadow-[0_15px_45px_rgba(18,100,255,0.45)]'
          }`}
        />

        {/* Ambient subtle light sheen on hover */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-black/20 via-transparent to-white/15 pointer-events-none"
        />

        {/* Left Side: Numbering & Sport Name */}
        <div className="flex items-baseline sm:items-center gap-3.5 sm:gap-5 min-w-0">
          <span
            className={`text-[10px] sm:text-xs font-black tracking-[0.24em] uppercase transition-colors duration-300 shrink-0 ${
              isDay ? 'text-[#071426]/45 group-hover:text-white/80' : 'text-white/40 group-hover:text-white/80'
            }`}
          >
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>

          <h3
            className={`font-black uppercase tracking-[-0.05em] text-[clamp(1.75rem,2.8vw,3.4rem)] leading-[0.9] transition-colors duration-300 truncate ${
              isDay ? 'text-[#071426] group-hover:text-white' : 'text-white group-hover:text-white'
            }`}
          >
            {sport.name || 'Sport'}
          </h3>
        </div>

        {/* Right Side: Image / Artwork Slot + Explore CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 shrink-0">
          {/* ============ Hover Revealed Image / Artwork Slot ============ */}
          <div className="relative overflow-hidden rounded-xl border border-white/20 shadow-xl opacity-0 scale-90 -translate-x-3 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-24 h-14 sm:w-28 sm:h-16 md:w-36 md:h-20 shrink-0 bg-black/40 backdrop-blur-md">
            {sportImage ? (
              <img
                src={sportImage}
                alt={sport.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${displayConfig.gradient[0]}, ${displayConfig.gradient[1]})`,
                }}
              >
                <div
                  aria-hidden
                  className="absolute -right-2 -bottom-2 text-4xl sm:text-5xl opacity-30 select-none group-hover:scale-125 transition-transform duration-700"
                >
                  {icon}
                </div>
                <div className="relative z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/15">
                  <span className="text-base sm:text-lg">{icon}</span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white truncate max-w-[70px]">
                    {sport.name}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 pointer-events-none" />
          </div>

          {/* Explore Arrow & Button */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 hidden xl:inline ${
                isDay
                  ? 'text-[#155EEF] group-hover:text-white'
                  : 'text-[#D9A441] group-hover:text-white'
              }`}
            >
              Explore
            </span>
            <motion.span
              className={`text-lg sm:text-xl transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 ${
                isDay
                  ? 'text-[#155EEF] group-hover:text-[#FFD21F]'
                  : 'text-[#D9A441] group-hover:text-[#FFD21F]'
              }`}
            >
              ↗
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const SportsUniverse: React.FC<SportsUniverseProps> = ({ sports }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const activeSports = sports.filter((s) => s.active);

  if (activeSports.length === 0) {
    return (
      <section className={`py-24 ${isDay ? 'bg-transparent' : 'bg-[#080A0D]'}`}>
        <Container>
          <div className="text-center py-20">
            <EmptyNotice
              title="No Active Sports"
              message="Sports will appear here once they're activated in the admin panel."
            />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className={`relative overflow-hidden py-24 ${isDay ? 'bg-transparent' : 'bg-[#080A0D]'}`}>
      {isDay && <div aria-hidden className="pointer-events-none absolute inset-0 ol-day-field opacity-40" />}
      {!isDay && <div aria-hidden className="pointer-events-none absolute inset-0 ol-night-field opacity-40" />}

      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle
            title={
              <SplitText
                text="CHOOSE YOUR PLAY."
                charClassName={isDay ? 'text-[#071426]' : 'text-white'}
              />
            }
            subtitle="Ten disciplines. One arena. Make your move."
            className="mb-12"
          />
        </motion.div>

        {/* Sports 2-column editorial grid for both day and night */}
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          {activeSports.map((sport, index) => (
            <SportRow
              key={sport.id}
              sport={sport}
              index={index}
              total={activeSports.length}
              isDay={isDay}
            />
          ))}
        </div>

        {/* CTA for all sports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <Magnetic strength={0.3} radius={80}>
            <Link
              to="/sports"
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-300 group ${
                isDay
                  ? 'bg-gradient-to-r from-[#071426] to-[#0B1B33] text-white shadow-[0_10px_40px_rgba(7,20,38,0.25)] hover:bg-[#1264FF]'
                  : 'bg-gradient-to-r from-[#1264FF] to-[#1747B8] text-white shadow-[0_10px_40px_rgba(18,100,255,0.4)] hover:brightness-110'
              }`}
            >
              <span>View All Sports</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Link>
          </Magnetic>
        </motion.div>
      </Container>
    </section>
  );
};

export default SportsUniverse;
