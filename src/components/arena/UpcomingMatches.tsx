import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, Magnetic, SplitText } from '@/components/motion';
import type { Match, Team } from '@/types';

export const UpcomingMatches: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

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
    <section className={`py-24 relative transition-colors duration-500 border-t ${
      isDay 
        ? 'bg-gradient-to-b from-transparent via-white/50 to-transparent border-[#071426]/10 text-[#071426]' 
        : 'bg-[#080A0D]/90 border-white/5 text-white'
    }`}>
      {/* Environmental subtle accent bloom */}
      <div 
        aria-hidden 
        className={`absolute right-10 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-40 ${
          isDay ? 'bg-[#155EEF]/10' : 'bg-[#D9A441]/10'
        }`} 
      />

      <Container className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <SectionTitle 
            eyebrow="03 / BATTLE SCHEDULE"
            tagline="NEXT ON THE ROSTER"
            title="UPCOMING"
            highlightTitle="FIXTURES."
            subtitle="Prepare for the next scheduled arena encounters" 
            className="mb-0"
          />
          <span className={`text-[10px] font-black uppercase tracking-[0.25em] mt-3 md:mt-0 ${
            isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
          }`}>
            0{upcomingMatches.length} Fixtures Queued
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingMatches.map((match, i) => {
            const teamA = getTeamName(match.teamAId, match.participantA?.name);
            const teamB = getTeamName(match.teamBId, match.participantB?.name);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
              >
                <TiltCard
                  tiltAngle={8}
                  glowColor={isDay ? 'rgba(21, 94, 239, 0.12)' : 'rgba(217, 164, 65, 0.2)'}
                  cursorLabel="MATCH"
                >
                  <Link to={`/match/${match.id}`} className="block h-full">
                    <div className={`p-6 rounded-2xl transition-all duration-300 flex justify-between items-center group backdrop-blur-md border ${
                      isDay
                        ? 'bg-white/80 border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.04)] hover:border-[#155EEF]/50 hover:shadow-[0_16px_40px_rgba(21,94,239,0.12)]'
                        : 'bg-[#071426]/90 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#D9A441]/50 hover:shadow-[0_16px_40px_rgba(217,164,65,0.15)]'
                    }`}>
                      <div className="flex flex-col min-w-0 flex-1 pr-4">
                        <span className={`text-xs font-black uppercase tracking-widest mb-2 ${
                          isDay ? 'text-[#155EEF]' : 'text-[#1264FF]'
                        }`}>
                          {match.sportId}
                        </span>
                        
                        <div className="flex items-center space-x-3 truncate">
                          <span className={`text-base md:text-lg font-black uppercase truncate ${
                            isDay ? 'text-[#071426]' : 'text-white'
                          }`}>
                            {teamA}
                          </span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${
                            isDay 
                              ? 'bg-[#071426]/5 text-[#D9A441]' 
                              : 'bg-white/5 text-[#FFD21F]'
                          }`}>
                            VS
                          </span>
                          <span className={`text-base md:text-lg font-black uppercase truncate ${
                            isDay ? 'text-[#071426]' : 'text-white'
                          }`}>
                            {teamB}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className={`block text-xs font-bold ${
                          isDay ? 'text-[#071426]/60' : 'text-white/70'
                        }`}>
                          {formatSchedule(match.scheduledAt)}
                        </span>
                        
                        <Magnetic strength={0.25} radius={80}>
                          <span className={`text-[11px] font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full inline-flex items-center gap-1 transition-transform group-hover:translate-x-1 ${
                            isDay
                              ? 'bg-[#155EEF]/10 text-[#155EEF] group-hover:bg-[#155EEF] group-hover:text-white'
                              : 'bg-[#D9A441]/10 text-[#D9A441] group-hover:bg-[#D9A441] group-hover:text-[#071426]'
                          }`}>
                            Details →
                          </span>
                        </Magnetic>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default UpcomingMatches;
