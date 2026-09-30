import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useCollection } from '@/hooks/useCollection';
import type { Match, Team } from '@/types';

export const UpcomingMatches: React.FC = () => {
  const matches = useCollection<Match>('matches');
  const teams = useCollection<Team>('teams');

  const teamById = React.useMemo(
    () => new Map(teams.data.map((t) => [t.id, t])),
    [teams.data]
  );

  const upcomingMatches = React.useMemo(
    () => matches.data.filter((m) => m.status === 'upcoming' || m.status === 'scheduled').slice(0, 4),
    [matches.data]
  );

  if (!matches.isLoading && upcomingMatches.length === 0) {
    return null;
  }

  const getTeamName = (id?: string, participantName?: string) => {
    if (participantName) return participantName;
    if (!id) return 'Team';
    return teamById.get(id)?.name || id;
  };

  const formatSchedule = (scheduledAt: any) => {
    if (!scheduledAt) return 'Upcoming';
    const date = typeof scheduledAt.toDate === 'function' ? scheduledAt.toDate() : new Date(scheduledAt);
    return Number.isNaN(date.getTime()) 
      ? 'Upcoming' 
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="py-24 bg-[#080A0D]/80 border-t border-white/5">
      <Container>
        <SectionTitle title="UPCOMING BATTLES" subtitle="Prepare for the next scheduled arena encounters" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingMatches.map((match, i) => {
            const teamA = getTeamName(match.teamAId, match.participantA?.name);
            const teamB = getTeamName(match.teamBId, match.participantB?.name);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/match/${match.id}`}>
                  <div className="bg-[#071426]/90 border border-white/10 p-6 rounded-xl hover:border-[#1264FF]/50 transition-all duration-300 flex justify-between items-center group backdrop-blur-md">
                    <div className="flex flex-col min-w-0 flex-1 pr-4">
                      <span className="text-xs text-[#1264FF] font-black uppercase tracking-widest mb-2">{match.sportId}</span>
                      <div className="flex items-center space-x-3 truncate">
                        <span className="text-base md:text-lg font-black text-white uppercase truncate">{teamA}</span>
                        <span className="text-xs font-black text-[#D9A441]">VS</span>
                        <span className="text-base md:text-lg font-black text-white uppercase truncate">{teamB}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-bold text-white/70">{formatSchedule(match.scheduledAt)}</span>
                      <span className="text-[11px] text-[#D9A441] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 block">
                        Details →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default UpcomingMatches;
