import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

// Dummy hooks
const usePlayers = () => ({
  players: [
    { id: '1', name: 'John Doe', number: 23, teamName: 'Thunderbolts', sport: 'Basketball', role: 'captain' },
    { id: '2', name: 'Jane Smith', number: 11, teamName: 'Firebirds', sport: 'Football', role: 'vice-captain' },
    { id: '3', name: 'Alice Bob', number: 15, teamName: 'Thunderbolts', sport: 'Basketball', role: 'player' },
  ],
  loading: false
});
const useSports = () => ({ sports: [{ id: '1', name: 'Basketball' }, { id: '2', name: 'Football' }] });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export const Players: React.FC = () => {
  const { players, loading } = usePlayers();
  const { sports } = useSports();
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filteredPlayers = players.filter(p => {
    const matchesSport = selectedSport === 'All' || p.sport === sports.find(s => s.id === selectedSport)?.name;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-navy text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
            Players <span className="text-electric-blue">.</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/50 transition-all"
              />
            </div>
            
            {/* Sport Filter */}
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue/50 transition-all appearance-none min-w-[160px]"
            >
              <option value="All">All Sports</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : filteredPlayers.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredPlayers.map(player => (
                <motion.div key={player.id} variants={cardVariants} layout>
                  <Link to={`/players/${player.id}`} className="block group h-full">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center h-full hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                      {/* Role indicator */}
                      {player.role !== 'player' && (
                        <div className={cn(
                          "absolute top-3 right-3 p-1.5 rounded-lg shadow-lg",
                          player.role === 'captain' ? "bg-gold/20 text-gold" : "bg-gray-300/20 text-gray-300"
                        )} title={player.role === 'captain' ? "Captain" : "Vice Captain"}>
                          <Shield size={14} />
                        </div>
                      )}
                      
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center border-2 border-white/10 mb-4 group-hover:border-electric-blue/50 transition-colors relative">
                        <span className="text-xl font-bold">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </span>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-electric-blue flex items-center justify-center text-xs font-bold border-2 border-navy">
                          {player.number}
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-lg text-white mb-1 truncate">{player.name}</h3>
                      <div className="text-sm text-white/60 truncate">{player.teamName}</div>
                      <div className="mt-3 inline-block px-2 py-1 rounded-md bg-white/5 text-xs text-white/40 border border-white/5">
                        {player.sport}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-20 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10">
            No players found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
