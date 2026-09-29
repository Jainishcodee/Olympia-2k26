import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Users, Trophy, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

// Dummy hook
const useTeam = (teamId: string) => ({
  team: {
    id: teamId, name: 'Thunderbolts', shortName: 'THN', sportName: 'Basketball', sportId: '1',
    stats: { wins: 12, losses: 3, draws: 0, points: 36 },
    captain: { id: 'c1', name: 'John Doe', role: 'captain', position: 'Forward', number: 23 },
    viceCaptain: { id: 'vc1', name: 'Jane Smith', role: 'vice-captain', position: 'Guard', number: 11 },
    roster: [
      { id: 'p1', name: 'Alice Bob', role: 'player', position: 'Center', number: 15 },
      { id: 'p2', name: 'Charlie Dave', role: 'player', position: 'Guard', number: 4 }
    ],
    upcomingMatches: [],
    recentResults: []
  },
  loading: false
});

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { team, loading } = useTeam(teamId || '');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-navy"><div className="w-12 h-12 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-4">Team not found</h2>
        <Link to="/teams" className="text-electric-blue hover:underline">Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white pb-20">
      {/* Header */}
      <div className="relative bg-black/50 pt-24 pb-12 border-b border-white/10">
        <div className="container mx-auto px-4">
          <Link to="/teams" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Teams
          </Link>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-white/10 flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl shrink-0">
              {team.shortName}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-sm font-medium text-white/80 mb-4 border border-white/5">
                {team.sportName}
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6">{team.name}</h1>
              
              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 flex flex-col items-center">
                  <span className="text-2xl font-bold text-electric-blue">{team.stats.wins}</span>
                  <span className="text-xs text-white/50 uppercase tracking-wider">Wins</span>
                </div>
                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 flex flex-col items-center">
                  <span className="text-2xl font-bold text-coral">{team.stats.losses}</span>
                  <span className="text-xs text-white/50 uppercase tracking-wider">Losses</span>
                </div>
                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 flex flex-col items-center">
                  <span className="text-2xl font-bold text-white/80">{team.stats.draws}</span>
                  <span className="text-xs text-white/50 uppercase tracking-wider">Draws</span>
                </div>
                <div className="bg-white/5 px-6 py-3 rounded-xl border border-gold/30 flex flex-col items-center">
                  <span className="text-2xl font-bold text-gold">{team.stats.points}</span>
                  <span className="text-xs text-white/50 uppercase tracking-wider">Points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Leadership */}
        <section>
          <h2 className="text-2xl font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
            <Trophy className="text-gold" /> Leadership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {team.captain && (
              <div className="bg-white/5 border border-gold/50 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-bl-full pointer-events-none"></div>
                <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gold flex items-center justify-center font-bold text-xl">
                  {team.captain.number}
                </div>
                <div>
                  <div className="text-gold text-xs font-bold tracking-widest uppercase mb-1">Captain</div>
                  <div className="text-xl font-bold">{team.captain.name}</div>
                  <div className="text-white/60 text-sm">{team.captain.position}</div>
                </div>
              </div>
            )}
            {team.viceCaptain && (
              <div className="bg-white/5 border border-white/30 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none"></div>
                <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/50 flex items-center justify-center font-bold text-xl">
                  {team.viceCaptain.number}
                </div>
                <div>
                  <div className="text-white/70 text-xs font-bold tracking-widest uppercase mb-1">Vice Captain</div>
                  <div className="text-xl font-bold">{team.viceCaptain.name}</div>
                  <div className="text-white/60 text-sm">{team.viceCaptain.position}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Roster */}
        <section>
          <h2 className="text-2xl font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
            <Users className="text-electric-blue" /> Roster
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.roster.map(player => (
              <Link key={player.id} to={`/players/${player.id}`}>
                <motion.div 
                  variants={fadeUpVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold text-electric-blue border border-white/10">
                    {player.number}
                  </div>
                  <div>
                    <div className="font-bold">{player.name}</div>
                    <div className="text-white/50 text-sm">{player.position}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeamDetail;
