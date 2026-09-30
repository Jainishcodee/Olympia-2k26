import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useTheme } from '@/contexts/ThemeContext';
import { Sport } from '@/types';
import { PageLoading, ErrorNotice, EmptyNotice } from '@/components/admin/kit';

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

interface SportCardProps {
  sport: Sport;
  index: number;
  isDay: boolean;
}

const SportCard: React.FC<SportCardProps> = ({ sport, index, isDay }) => {
  if (!sport) return null;

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, delay: index * 0.08, type: 'spring', stiffness: 80, damping: 20 }
    },
    hover: { 
      y: -8, 
      scale: 1.02,
      transition: { duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }
    },
    tap: { scale: 0.98 }
  };

  const sportSlug = sport.slug || (sport.id as any) || 'sport';
  const displayConfig = getDisplayConfig(sportSlug);
  const gradientColors = displayConfig.gradient || defaultConfig.gradient;
  const accentColor = displayConfig.accent || defaultConfig.accent;
  const icon = sport.icon || displayConfig.icon || '🏆';
  const scoringTypeLabel = (sport.scoringType ? String(sport.scoringType).replace(/_/g, ' ') : 'Standard');
  const teamTypeLabel = sport.teamBased ? 'Team' : 'Individual';

  const cardStyle = isDay ? {
    background: `linear-gradient(145deg, ${gradientColors[0]}20, ${gradientColors[1]}20)`,
    borderColor: `${accentColor}40`
  } : {
    background: `linear-gradient(145deg, ${gradientColors[0]}, ${gradientColors[1]})`,
    borderColor: `${accentColor}30`
  };

  if (isDay) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, delay: Math.min(index * 0.045, 0.28), ease: [0.16, 1, 0.3, 1] }}
        className={`group relative border-b border-[#071426]/15 ${index === 0 ? 'md:col-span-2' : ''}`}
      >
        <Link to={`/sports/${sportSlug}`} className="ol-sport-link">
          <span className="text-[10px] font-black tracking-[0.22em] text-[#071426]/45">{String(index + 1).padStart(2, '0')} / 10</span>
          <span className="ol-sport-name">{sport.name || 'Sport'}</span>
          <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#155EEF]">Explore <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">↗</span></span>
          <span aria-hidden className="absolute inset-0 -z-10 origin-left scale-x-0 bg-[#155EEF] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={sport.id || index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      className="group relative"
    >
      <Link to={`/sports/${sportSlug}`} className="block h-full">
        <div 
          className="relative overflow-hidden rounded-2xl p-6 h-full flex flex-col transition-all duration-500"
          style={cardStyle as React.CSSProperties}
        >
          {/* Ambient glow */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(ellipse at center, ${accentColor}20 0%, transparent 70%)` }}
          />
          
          {/* Top accent bar */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
            style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
          />
          
          {/* Sport icon with glow */}
          <div className="relative z-10 mb-6">
            <motion.div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                boxShadow: `0 0 40px ${accentColor}40, inset 0 0 20px ${accentColor}20`
              }}
            >
              <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{icon}</span>
            </motion.div>
            
            {/* Active badge */}
            {sport.active && (
              <motion.div
                className="absolute -top-2 -left-2 right-0 w-24 h-24 mx-auto rounded-2xl border-2"
                style={{ borderColor: accentColor }}
                animate={{ 
                  scale: [1, 1.15, 1], 
                  opacity: [0.6, 0.3, 0.6] 
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>

          {/* Sport info */}
          <div className="relative z-10 flex-1 flex flex-col items-center text-center">
            <h3 className="text-xl font-black uppercase tracking-wider mb-2 text-white group-hover:text-white">
              {sport.name || 'Sport'}
            </h3>
            {sport.description && (
              <p className="text-sm text-white/50 mb-4 max-w-xs leading-relaxed">
                {sport.description}
              </p>
            )}
            
            {/* Status badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span 
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${sport.active 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}
              >
                {sport.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {/* Scoring type */}
            <div className="text-xs text-white/40 uppercase tracking-wider font-medium">
              {scoringTypeLabel} · {teamTypeLabel}
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            className="relative z-10 mt-6 pt-4 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            style={{ borderTopColor: `${accentColor}30` }}
          >
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
              Explore
            </span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              →
            </motion.span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

export const SportsUniverse: React.FC<SportsUniverseProps> = ({ sports }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const activeSports = sports.filter(s => s.active);

  if (activeSports.length === 0) {
    return (
      <section className={`py-24 ${isDay ? 'bg-[#FAF6EC]' : 'bg-[#080A0D]'}`}>
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
    <section className={`relative overflow-hidden py-24 ${isDay ? 'bg-[#F7F6F1]' : 'bg-[#080A0D]'}`}>
      {isDay && <div aria-hidden className="pointer-events-none absolute inset-0 ol-day-field opacity-40" />}
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle 
            title={isDay ? 'CHOOSE YOUR PLAY.' : 'SPORTS UNIVERSE'}
            subtitle={isDay ? 'Ten disciplines. One arena. Make your move.' : 'Explore all disciplines · Live matches · Upcoming fixtures · Teams'}
            className="mb-12"
          />
        </motion.div>

        {/* Sports grid */}
        <div className={isDay ? 'relative grid grid-cols-1 md:grid-cols-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}>
          {activeSports.map((sport, index) => (
            <SportCard key={sport.id} sport={sport} index={index} isDay={isDay} />
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
          <Link 
            to="/sports" 
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-300 group"
            style={{ 
              background: isDay ? 'linear-gradient(135deg, #071426, #0B1B33)' : 'linear-gradient(135deg, #1264FF, #1747B8)',
              color: isDay ? '#FFFFFF' : '#071426',
              boxShadow: isDay ? '0 10px 40px #07142640' : '0 10px 40px #1264FF40'
            }}
          >
            <span>View All Sports</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
};

export default SportsUniverse;
