import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';

// Dummy hooks for implementation
const useTeams = () => ({ 
  teams: [
    { id: '1', name: 'Thunderbolts', shortName: 'THN', sportId: '1', sportName: 'Basketball', captain: 'John Doe', players: 12, wins: 5, losses: 2, draws: 0 },
    { id: '2', name: 'Firebirds', shortName: 'FIR', sportId: '2', sportName: 'Football', captain: 'Jane Smith', players: 22, wins: 3, losses: 4, draws: 1 },
  ], 
  loading: false 
});
const useSports = () => ({ sports: [{ id: '1', name: 'Basketball' }, { id: '2', name: 'Football' }] });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const Teams: React.FC = () => {
  const { teams, loading } = useTeams();
  const { sports } = useSports();
  const [selectedSport, setSelectedSport] = useState<string>('All');

  const filteredTeams = selectedSport === 'All' 
    ? teams 
    : teams.filter(t => t.sportId === selectedSport);

  return (
    <div className="min-h-screen bg-navy text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2">
              Teams <span className="text-gold">.</span>
            </h1>
            <p className="text-white/60">Discover and track all participating teams</p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter size={18} className="text-white/40 mr-2" />
            <button
              onClick={() => setSelectedSport('All')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedSport === 'All' ? "bg-electric-blue text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
              )}
            >
              All Sports
            </button>
            {sports.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedSport === sport.id ? "bg-electric-blue text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredTeams.map(team => (
                <motion.div key={team.id} variants={cardVariants} layout>
                  <Link to={`/teams/${team.id}`} className="block h-full group">
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full transition-all duration-300 group-hover:bg-white/5 group-hover:border-electric-blue/50 group-hover:shadow-[0_8px_30px_rgba(18,100,255,0.15)] relative overflow-hidden">
                      {/* Decorative gradient */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-electric-blue/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50"></div>
                      
                      <div className="flex items-start gap-4 mb-6 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 flex items-center justify-center text-xl font-black text-white shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {team.shortName}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-electric-blue transition-colors line-clamp-1">{team.name}</h3>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium text-white/80">
                            {team.sportName}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                          <div className="text-xs text-white/50 mb-1">Captain</div>
                          <div className="text-sm font-medium text-white/90 truncate">{team.captain}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50 mb-1">Record (W-L-D)</div>
                          <div className="text-sm font-medium text-white/90">{team.wins}-{team.losses}-{team.draws}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-white/50">
                        <Users size={14} />
                        <span>{team.players} Players</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl border border-white/10">
            <Users size={48} className="text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No teams found</h3>
            <p className="text-white/60">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
