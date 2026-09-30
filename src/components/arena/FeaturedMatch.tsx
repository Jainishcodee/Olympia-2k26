import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { useCollection } from '@/hooks/useCollection';
import type { Match, Team } from '@/types';

export const FeaturedMatch: React.FC = () => {
  const matches = useCollection<Match>('matches');
  const teams = useCollection<Team>('teams');

  const teamById = React.useMemo(
    () => new Map(teams.data.map((t) => [t.id, t])),
    [teams.data]
  );

  const featured = React.useMemo(() => {
    return matches.data.find((m) => m.featured) || matches.data.find((m) => m.status === 'live') || matches.data[0];
  }, [matches.data]);

  if (!matches.isLoading && !featured) {
    return null;
  }

  if (!featured) return null;

  const teamA = featured.participantA?.name || teamById.get(featured.teamAId)?.name || 'Team A';
  const teamB = featured.participantB?.name || teamById.get(featured.teamBId)?.name || 'Team B';
  const isLive = featured.status === 'live';

  const formatSchedule = (scheduledAt: any) => {
    if (!scheduledAt) return 'Scheduled';
    const date = typeof scheduledAt.toDate === 'function' ? scheduledAt.toDate() : new Date(scheduledAt);
    return Number.isNaN(date.getTime()) 
      ? 'Scheduled' 
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="py-20 bg-[#080A0D]/90 border-t border-white/5">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full rounded-2xl bg-[#071426] border border-[#D9A441]/40 overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1747B8]/30 via-[#071426] to-[#D9A441]/20 opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative flex flex-col items-center justify-center p-8 md:p-12 z-10 text-center">
            <span className="text-[#D9A441] text-xs md:text-sm font-black tracking-[0.25em] uppercase mb-6 flex items-center gap-2">
              {isLive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  LIVE MAIN ARENA CLASH
                </>
              ) : (
                'FEATURED ARENA CLASH'
              )}
            </span>
            
            <div className="flex items-center justify-center w-full max-w-4xl gap-4 md:gap-12 my-2">
              <div className="flex-1 flex flex-col items-end">
                <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter text-right drop-shadow-md">
                  {teamA}
                </h3>
              </div>
              
              <div className="flex flex-col items-center justify-center px-4 shrink-0">
                <span className="text-3xl md:text-5xl font-black text-[#D9A441] tracking-wider mb-1">VS</span>
                <span className="text-[11px] md:text-xs text-white/60 font-bold uppercase tracking-widest text-center">
                  {isLive ? (featured.liveState?.clock || 'LIVE') : formatSchedule(featured.scheduledAt)}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col items-start">
                <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter text-left drop-shadow-md">
                  {teamB}
                </h3>
              </div>
            </div>
            
            <motion.div 
              className="mt-8 md:mt-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={`/match/${featured.id}`} className="inline-block rounded-xl bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] font-black uppercase tracking-widest px-8 py-3.5 md:px-10 md:py-4 text-xs md:text-sm hover:brightness-110 transition-all shadow-[0_0_25px_rgba(217,164,65,0.4)]">
                {isLive ? 'Follow Live Broadcast →' : 'View Match Details →'}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default FeaturedMatch;
