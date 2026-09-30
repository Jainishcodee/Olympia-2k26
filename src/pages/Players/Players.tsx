import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Shield, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';
import type { Player, Team, Sport } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 25 } },
};

export const Players: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const playersCol = useCollection<Player>('players', { sortBy: 'name' });
  const teamsCol = useCollection<Team>('teams');
  const sportsCol = useCollection<Sport>('sports');

  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [search, setSearch] = useState('');

  const teamById = useMemo(() => {
    return new Map(teamsCol.data.map((t) => [t.id, t]));
  }, [teamsCol.data]);

  const sportsMap = useMemo(() => {
    return new Map(sportsCol.data.map((s) => [s.id, s.name]));
  }, [sportsCol.data]);

  const filteredPlayers = useMemo(() => {
    return playersCol.data.filter((p) => {
      const team = teamById.get(p.teamId);
      const sportId = p.sportId || team?.sportId || '';
      const matchesSport = selectedSport === 'All' || sportId === selectedSport;
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (team?.name && team.name.toLowerCase().includes(search.toLowerCase()));
      return matchesSport && matchesSearch;
    });
  }, [playersCol.data, teamById, selectedSport, search]);

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
              title="ALL ATHLETES"
              subtitle="Squad contenders, captains, and performance ratings"
              className="mb-0"
            />
          </div>

          {/* Search bar designed for mobile thumbs with safe font size */}
          <div className="relative w-full md:w-80">
            <Search
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none',
                isDay ? 'text-slate-400' : 'text-white/40',
              )}
              size={18}
            />
            <input
              type="text"
              placeholder="Search athlete or team…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full rounded-2xl py-3 pl-11 pr-4 text-sm font-medium border outline-none transition-all',
                isDay
                  ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1264FF] shadow-xs'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D9A441]',
              )}
            />
          </div>
        </div>

        {/* Sport filters with horizontal momentum scrolling */}
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
            All Disciplines
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

        {playersCol.isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#D9A441] inline-block mb-3" />
            <p className="text-xs uppercase tracking-widest font-black text-[#D9A441]">Loading Athletes…</p>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <AnimatePresence>
              {filteredPlayers.map((player) => {
                const team = teamById.get(player.teamId);
                const sportName = sportsMap.get(player.sportId || team?.sportId || '') || 'Discipline';
                const isCaptain = player.role === 'captain';

                return (
                  <motion.div key={player.id} variants={cardVariants} layout>
                    <Link to={`/players/${player.id}`} className="block group h-full">
                      <div
                        className={cn(
                          'rounded-3xl p-4 sm:p-5 text-center h-full transition-all duration-300 border flex flex-col justify-between relative overflow-hidden backdrop-blur-md active:scale-95',
                          isDay
                            ? 'bg-white/90 border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.04)] hover:border-[#1264FF]/50 hover:shadow-lg'
                            : 'bg-[#071426]/80 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#D9A441]/50 hover:bg-[#071426]',
                        )}
                      >
                        {/* Captain Badge */}
                        {isCaptain && (
                          <div
                            className={cn(
                              'absolute top-3 right-3 p-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm',
                              isDay ? 'bg-amber-100 text-amber-800' : 'bg-[#D9A441]/20 text-[#FFD21F]',
                            )}
                            title="Team Captain"
                          >
                            <Shield size={12} />
                            <span className="hidden sm:inline">CAPTAIN</span>
                          </div>
                        )}

                        {/* Player Avatar */}
                        <div className="relative my-2 sm:my-3">
                          <div
                            className={cn(
                              'w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center border-2 transition-transform duration-300 group-hover:scale-105 overflow-hidden',
                              isDay
                                ? 'bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
                                : 'bg-gradient-to-br from-gray-700 to-gray-900 border-white/15 text-white',
                            )}
                          >
                            {player.photo ? (
                              <img src={player.photo} alt={player.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <span className="text-lg sm:text-xl font-black">
                                {player.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          {player.jerseyNumber !== undefined && (
                            <span
                              className={cn(
                                'absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider shadow-sm border',
                                isDay
                                  ? 'bg-[#1264FF] text-white border-white'
                                  : 'bg-[#D9A441] text-[#071426] border-[#080A0D]',
                              )}
                            >
                              #{player.jerseyNumber}
                            </span>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="mt-2">
                          <h3
                            className={cn(
                              'font-black text-sm sm:text-base uppercase tracking-tight truncate group-hover:text-[#1264FF] dark:group-hover:text-[#D9A441] transition-colors',
                              isDay ? 'text-slate-900' : 'text-white',
                            )}
                          >
                            {player.name}
                          </h3>
                          <div className={cn('text-xs font-semibold truncate mt-0.5', isDay ? 'text-slate-500' : 'text-white/60')}>
                            {team?.name || 'Assigned Squad'}
                          </div>

                          <div className="mt-3">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
                                isDay ? 'bg-slate-100 text-[#1264FF]' : 'bg-white/5 text-[#D9A441]',
                              )}
                            >
                              {sportName}
                            </span>
                          </div>
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
            <User size={40} className={cn('mb-3', isDay ? 'text-slate-400' : 'text-white/30')} />
            <h3 className={cn('text-lg font-black uppercase mb-1', isDay ? 'text-slate-900' : 'text-white')}>
              No athletes found
            </h3>
            <p className={cn('text-xs leading-relaxed max-w-xs', isDay ? 'text-slate-500' : 'text-white/60')}>
              Try adjusting your sport discipline filter or search query.
            </p>
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default Players;
