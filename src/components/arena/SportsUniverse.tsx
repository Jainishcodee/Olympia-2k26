import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useTheme } from '@/contexts/ThemeContext';
import { Sport } from '@/types';
import { EmptyNotice } from '@/components/admin/kit';
import { Magnetic } from '@/components/motion';
import { SportBallArt } from './SportBallArt';

interface SportsUniverseProps {
  sports: Sport[];
}

interface SportRowProps {
  sport: Sport;
  index: number;
  total: number;
  isDay: boolean;
}

const SportRow: React.FC<SportRowProps> = ({ sport, index, total, isDay }) => {
  if (!sport) return null;

  const navigate = useNavigate();
  const [isRolling, setIsRolling] = useState(false);
  const sportSlug = sport.slug || (sport.id as any) || 'sport';
  const customImage = (sport as any).bannerUrl || (sport as any).imageUrl || (sport as any).image;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRolling) return;
    setIsRolling(true);
    // Tactile physical rollout animation before navigation (~650ms)
    setTimeout(() => {
      navigate(`/sports/${sportSlug}`);
    }, 650);
  };

  const isVehicle = sportSlug.includes('kart') || sportSlug.includes('smash');
  const isWeapon = sportSlug.includes('counter') || sportSlug.includes('cs') || sportSlug.includes('lan');
  const isBoard = sportSlug.includes('carrom') || sportSlug.includes('chess');

  const rollMotion = isRolling
    ? isVehicle
      ? { x: [0, 45, 160], y: [0, -6, -14], scale: [1, 1.18, 0.85], opacity: [1, 1, 0] }
      : isWeapon
      ? { x: [0, 30, 140], rotate: [0, -6, 10], scale: [1, 1.15, 0.8], opacity: [1, 1, 0] }
      : isBoard
      ? { x: [0, 30, 120], scale: [1, 1.15, 0.85], opacity: [1, 1, 0] }
      : { x: [0, 40, 140], rotate: [0, 180, 360], scale: [1, 1.25, 0.85], opacity: [1, 1, 0] }
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.045, 0.28), ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden transition-all duration-300 ${
        isDay
          ? 'bg-white border-b border-[#071426]/12 md:odd:border-r md:odd:border-r-[#071426]/12'
          : 'bg-[#080A0D] border-b border-white/10 md:odd:border-r md:odd:border-r-white/10'
      }`}
    >
      <a
        href={`/sports/${sportSlug}`}
        onClick={handleClick}
        className="relative z-10 flex flex-col justify-between min-h-[175px] sm:min-h-[200px] md:min-h-[220px] p-6 sm:p-8 md:p-9 select-none group h-full cursor-pointer overflow-hidden block"
      >
        {/* ============ Blue Highlight Banner that Sweeps in from Behind on Hover ============ */}
        <span
          aria-hidden
          className={`absolute inset-0 -z-10 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 ${
            isDay
              ? 'bg-gradient-to-r from-[#1264FF] via-[#1056E0] to-[#0A3EB0] shadow-[0_15px_45px_rgba(18,100,255,0.3)]'
              : 'bg-gradient-to-r from-[#1264FF] via-[#155EEF] to-[#092252] shadow-[0_15px_45px_rgba(18,100,255,0.45)]'
          }`}
        />

        {/* ============ 3D Sport Artwork in Background (Top Right Area) ============ */}
        <motion.div
          animate={rollMotion}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute right-2 sm:right-6 md:right-8 top-2 sm:top-4 md:top-6 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDay ? 'opacity-85 group-hover:opacity-100' : 'opacity-70 group-hover:opacity-95'
          } group-hover:scale-110 ${isVehicle ? '' : 'group-hover:rotate-12'} group-hover:translate-x-2`}
        >
          <SportBallArt sportSlug={sportSlug} customImageUrl={customImage} />
        </motion.div>

        {/* Top Header Row: Index Number & Disciplines (e.g. 02 / OLY) */}
        <div className="relative z-10 flex items-center justify-between">
          <span
            className={`text-xs sm:text-sm font-black tracking-[0.24em] uppercase transition-colors duration-300 ${
              isDay ? 'text-[#071426]/50 group-hover:text-white/80' : 'text-white/40 group-hover:text-white/80'
            }`}
          >
            {String(index + 1).padStart(2, '0')} / OLY
          </span>

          {/* Explore Arrow */}
          <div className="flex items-center gap-1.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            <span
              className={`text-lg sm:text-xl font-black transition-colors duration-300 ${
                isDay ? 'text-[#1264FF] group-hover:text-[#FFD21F]' : 'text-[#D9A441] group-hover:text-[#FFD21F]'
              }`}
            >
              ↗
            </span>
          </div>
        </div>

        {/* Bottom Area: Large Bold Sport Name */}
        <div className="relative z-10 mt-auto pt-6 sm:pt-8 pr-16 sm:pr-24">
          <h3
            className={`font-black uppercase tracking-[-0.04em] text-[clamp(1.85rem,3.2vw,3.8rem)] leading-[0.9] transition-colors duration-300 break-words ${
              isDay ? 'text-[#071426] group-hover:text-white' : 'text-white group-hover:text-white'
            }`}
          >
            {sport.name || 'Sport'}
          </h3>
        </div>
      </a>
    </motion.div>
  );
};

export const SportsUniverse: React.FC<SportsUniverseProps> = ({ sports }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const activeSports = sports.filter((s) => s.active);

  if (activeSports.length === 0) {
    return (
      <section className={`py-24 ${isDay ? 'bg-white' : 'bg-[#080A0D]'}`}>
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
    <section className={`relative overflow-hidden py-24 ${isDay ? 'bg-white' : 'bg-[#080A0D]'}`}>
      {/* Editorial digital field grid lines */}
      {isDay && <div aria-hidden className="pointer-events-none absolute inset-0 ol-day-field opacity-30" />}
      {!isDay && <div aria-hidden className="pointer-events-none absolute inset-0 ol-night-field opacity-40" />}

      <Container>
        {/* Inspirational Section Eyebrow Header Bar matching user reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle
            eyebrow="05 / THE LINEUP"
            tagline="ALL THE WAYS TO PLAY"
            title="WHAT'S"
            highlightTitle="HAPPENING?"
            subtitle="Ten disciplines. One arena. Make your move."
            className="mb-12"
          />
        </motion.div>

        {/* Sports 2-column editorial grid for both day and night */}
        <div className={`relative grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border ${isDay ? 'border-[#071426]/12 shadow-sm' : 'border-white/10'}`}>
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

        {/* CTA for all sports — Explicit White Font in Day & Night Mode */}
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
              style={{ color: '#FFFFFF' }}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-black uppercase tracking-wider text-sm transition-all duration-300 group !text-white shadow-xl ${
                isDay
                  ? 'bg-gradient-to-r from-[#071426] via-[#0B1B33] to-[#071426] hover:bg-[#1264FF] shadow-[0_10px_35px_rgba(7,20,38,0.3)] hover:scale-105'
                  : 'bg-gradient-to-r from-[#1264FF] to-[#1747B8] shadow-[0_10px_40px_rgba(18,100,255,0.4)] hover:brightness-110 hover:scale-105'
              }`}
            >
              <span style={{ color: '#FFFFFF' }} className="!text-white font-black">
                View All Sports
              </span>
              <motion.span
                style={{ color: '#FFFFFF' }}
                className="!text-white font-black text-base"
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
