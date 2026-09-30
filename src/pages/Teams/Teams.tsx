import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';
import { getTeamLogo } from '@/utils/teamLogos';
import type { Team, Sport } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export const Teams: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const teamsCol = useCollection<Team>('teams', { sortBy: 'name' });
  const sportsCol = useCollection<Sport>('sports', { sortBy: 'name' });
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [search, setSearch] = useState('');

  const sportsMap = useMemo(() => {
    return new Map(sportsCol.data.map((s) => [s.id, s.name]));
  }, [sportsCol.data]);

  const filteredTeams = useMemo(() => {
    return teamsCol.data.filter((t) => {
      const matchesSport = selectedSport === 'All' || t.sportId === selectedSport;
      const matchesSearch =
        !search.trim() ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.shortName && t.shortName.toLowerCase().includes(search.toLowerCase()));
      return matchesSport && matchesSearch;
    });
  }, [teamsCol.data, selectedSport, search]);

  return (
    <div
      className={cn(
        'min-h-screen pt-28 sm:pt-32 flex flex-col justify-between transition-colors duration-300',
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white',
      )}
    >
      <Container className="flex-1 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <SectionTitle
              title="ALL TEAMS"
              subtitle="Squad rosters, captaincy and tournament performance metrics"
              className="mb-0"
            />
          </div>

          {/* Search input for mobile & desktop */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search team or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all',
                isDay
                  ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1264FF] shadow-xs'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9A441]',
              )}
            />
          </div>
        </div>

        {/* Sports filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-8">
          <Filter size={16} className={cn('shrink-0 mr-1', isDay ? 'text-slate-400' : 'text-white/40')} />
          <button
            onClick={() => setSelectedSport('All')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95 border',
              selectedSport === 'All'
                ? isDay
                  ? 'bg-[#1264FF] border-[#1264FF] text-white shadow-sm'
                  : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] border-[#FFD21F] text-[#071426] shadow-[0_0_15px_rgba(217,164,65,0.35)]'
                : isDay
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10',
            )}
          >
            All Sports
          </button>
          {sportsCol.data.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95 border',
                selectedSport === sport.id
                  ? isDay
                    ? 'bg-[#1264FF] border-[#1264FF] text-white shadow-sm'
                    : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] border-[#FFD21F] text-[#071426] shadow-[0_0_15px_rgba(217,164,65,0.35)]'
                  : isDay
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10',
              )}
            >
              {sport.name}
            </button>
          ))}
        </div>

        {teamsCol.isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#D9A441] inline-block mb-3" />
            <p className="text-xs uppercase tracking-widest font-black text-[#D9A441]">Loading Teams…</p>
          </div>
        ) : filteredTeams.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            <AnimatePresence>
              {filteredTeams.map((team) => {
                const sportName = sportsMap.get(team.sportId) || team.sportId || 'Sport';
                const wins = team.wins ?? 0;
                const losses = team.losses ?? 0;
                const draws = team.draws ?? 0;
                const memberCount = Array.isArray(team.playerIds) ? team.playerIds.length : 0;

                return (
                  <motion.div key={team.id} variants={cardVariants} layout>
                    <Link to={`/teams/${team.id}`} className="block h-full group">
                      <div
                        className={cn(
                          'rounded-3xl p-6 h-full transition-all duration-300 border flex flex-col justify-between relative overflow-hidden backdrop-blur-md active:scale-98',
                          isDay
                            ? 'bg-white/90 border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.04)] hover:border-[#1264FF]/50 hover:shadow-lg'
                            : 'bg-[#071426]/80 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#D9A441]/50 hover:bg-[#071426]',
                        )}
                      >
                        <div className="flex items-start gap-4 mb-5 relative z-10">
                          <div
                            className={cn(
                              'w-14 h-14 rounded-2xl border flex items-center justify-center text-lg font-black shrink-0 transition-transform duration-300 group-hover:scale-105',
                              isDay
                                ? 'bg-slate-100 border-slate-200 text-slate-900 shadow-sm'
                                : 'bg-gradient-to-br from-gray-800 to-gray-900 border-white/20 text-white',
                            )}
                          >
                            {(team.logo || getTeamLogo(team.name) || getTeamLogo(team.id)) ? (
                              <img
                                src={team.logo || getTeamLogo(team.name) || getTeamLogo(team.id)}
                                alt={team.name}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              (team.shortName || team.name.slice(0, 3)).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              className={cn(
                                'text-lg sm:text-xl font-black uppercase tracking-tight truncate group-hover:text-[#1264FF] dark:group-hover:text-[#D9A441] transition-colors',
                                isDay ? 'text-slate-900' : 'text-white',
                              )}
                            >
                              {team.name}
                            </h3>
                            <span
                              className={cn(
                                'inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider',
                                isDay ? 'bg-slate-100 text-[#1264FF]' : 'bg-white/10 text-[#D9A441]',
                              )}
                            >
                              {sportName}
                            </span>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'grid grid-cols-2 gap-3 pt-4 border-t text-xs',
                            isDay ? 'border-slate-100' : 'border-white/10',
                          )}
                        >
                          <div>
                            <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-0.5', isDay ? 'text-slate-400' : 'text-white/40')}>
                              Coach / Leader
                            </div>
                            <div className={cn('font-bold truncate text-xs', isDay ? 'text-slate-800' : 'text-white/90')}>
                              {team.coach || team.captainId || 'Assigned in Arena'}
                            </div>
                          </div>
                          <div>
                            <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-0.5', isDay ? 'text-slate-400' : 'text-white/40')}>
                              Record (W-L-D)
                            </div>
                            <div className={cn('font-black text-xs', isDay ? 'text-slate-800' : 'text-white/90')}>
                              {wins}W - {losses}L {draws > 0 ? `- ${draws}D` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                          <span className={cn('inline-flex items-center gap-1.5 font-bold text-[11px]', isDay ? 'text-slate-500' : 'text-white/50')}>
                            <Users size={13} />
                            <span>{memberCount} Roster Athletes</span>
                          </span>
                          <span className={cn('font-black text-[11px] uppercase tracking-wider group-hover:translate-x-1 transition-transform', isDay ? 'text-[#1264FF]' : 'text-[#D9A441]')}>
                            Squad Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center py-20 text-center rounded-3xl border max-w-md mx-auto shadow-xl',
              isDay ? 'bg-white/80 border-[#071426]/10' : 'bg-[#071426]/60 border-white/10',
            )}
          >
            <Users size={40} className={cn('mb-3', isDay ? 'text-slate-400' : 'text-white/30')} />
            <h3 className={cn('text-lg font-black uppercase mb-1', isDay ? 'text-slate-900' : 'text-white')}>
              No teams found
            </h3>
            <p className={cn('text-xs leading-relaxed max-w-xs', isDay ? 'text-slate-500' : 'text-white/60')}>
              Try adjusting your sport filter or search query to explore tournament squads.
            </p>
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default Teams;
