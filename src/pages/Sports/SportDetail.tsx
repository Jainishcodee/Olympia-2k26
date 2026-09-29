import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
// Assuming hooks and types are correctly placed
// import { useSports, useMatches, useTeams } from '@/hooks';

// Dummy hooks for implementation
const useSports = () => ({ sports: [{ id: '1', slug: 'basketball', name: 'Basketball', description: 'Hoops action', icon: '🏀', hasTeams: true }], loading: false });
const useMatches = (filter: any) => ({ matches: [], loading: false });
const useTeams = (filter: any) => ({ teams: [], loading: false });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export const SportDetail: React.FC = () => {
  const { sportSlug } = useParams<{ sportSlug: string }>();
  const { sports, loading: sportsLoading } = useSports();
  
  const sport = sports.find(s => s.slug === sportSlug);
  
  const { matches: liveMatches } = useMatches({ sportId: sport?.id, status: 'LIVE' });
  const { matches: upcomingMatches } = useMatches({ sportId: sport?.id, status: 'UPCOMING' });
  const { matches: completedMatches } = useMatches({ sportId: sport?.id, status: 'COMPLETED' });
  const { teams } = useTeams({ sportId: sport?.id });

  if (sportsLoading) {
    return <div className="flex h-screen items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div></div>;
  }

  if (!sport) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-white">
        <h2 className="text-3xl font-bold text-coral mb-4">Sport Not Found</h2>
        <Link to="/sports" className="text-electric-blue hover:text-royal-blue transition-colors flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Sports
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white pb-20">
      {/* Header */}
      <div className="relative bg-black/50 py-16 border-b border-white/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-electric-blue/10 blur-[120px] rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/sports" className="inline-flex items-center text-white/60 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Sports
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(18,100,255,0.2)]">
              {sport.icon}
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white uppercase">{sport.name}</h1>
              <p className="mt-2 text-white/70 max-w-2xl text-lg">{sport.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Live Matches */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Live Matches</h2>
            </div>
            {liveMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Map live matches */}
                {liveMatches.map((m: any) => <div key={m.id} className="bg-white/5 p-6 rounded-xl border border-white/10">Match {m.id}</div>)}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">
                No live matches at the moment.
              </div>
            )}
          </motion.section>

          {/* Upcoming Matches */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-electric-blue" size={24} />
              <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Upcoming Matches</h2>
            </div>
            {upcomingMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMatches.map((m: any) => <div key={m.id} className="bg-white/5 p-6 rounded-xl border border-white/10">Match {m.id}</div>)}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">
                No upcoming matches scheduled.
              </div>
            )}
          </motion.section>

          {/* Results */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-gold" size={24} />
              <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Results</h2>
            </div>
            {completedMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedMatches.map((m: any) => <div key={m.id} className="bg-white/5 p-6 rounded-xl border border-white/10">Match {m.id}</div>)}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">
                No completed matches yet.
              </div>
            )}
          </motion.section>

          {/* Teams */}
          {sport.hasTeams && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-royal-blue" size={24} />
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Teams</h2>
              </div>
              {teams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {teams.map((t: any) => (
                    <Link key={t.id} to={`/teams/${t.id}`} className="block group">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center transition-all duration-300 group-hover:bg-white/10 group-hover:-translate-y-1">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-electric-blue to-royal-blue rounded-full flex items-center justify-center text-xl font-bold mb-4">
                          {t.shortName}
                        </div>
                        <h3 className="font-bold text-lg text-white">{t.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">
                  No teams registered for this sport.
                </div>
              )}
            </motion.section>
          )}

          {/* Leaderboard */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-gold" size={24} />
              <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Leaderboard</h2>
            </div>
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">
              Leaderboard coming soon...
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
};

export default SportDetail;
