import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useCollection } from '@/hooks/useCollection';
import type { Match, Team } from '@/types';

export const LiveNowSection: React.FC = () => {
  const matches = useCollection<Match>('matches');
  const teams = useCollection<Team>('teams');

  const teamById = React.useMemo(
    () => new Map(teams.data.map((t) => [t.id, t])),
    [teams.data]
  );

  const liveMatches = React.useMemo(
    () => matches.data.filter((m) => m.status === 'live'),
    [matches.data]
  );

  // If loading or no live matches in the database, don't show fake live matches
  if (!matches.isLoading && liveMatches.length === 0) {
    return null;
  }

  const getTeamName = (id?: string, participantName?: string) => {
    if (participantName) return participantName;
    if (!id) return 'Team';
    return teamById.get(id)?.name || id;
  };

  const renderScore = (match: Match) => {
    const score = match.score as unknown as Record<string, unknown> | undefined;
    if (!score) return '0 - 0';
    return `${score.teamA ?? 0} - ${score.teamB ?? 0}`;
  };

  return (
    <section className="py-20 bg-[#080A0D]/90 border-t border-white/5 relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF4D3D]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Container>
        <div className="flex items-end justify-between mb-10">
          <SectionTitle 
            title={
              <div className="flex items-center">
                <span>LIVE ARENA</span>
                <span className="relative flex h-3 w-3 md:h-4 md:w-4 ml-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D3D] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 md:h-4 md:w-4 rounded-full bg-[#FF4D3D] shadow-[0_0_15px_#FF4D3D]" />
                </span>
              </div>
            } 
            subtitle="Real-time broadcast action directly from the tournament floor" 
            className="mb-0"
          />
          <Link to="/live" className="hidden md:inline-flex text-[#1264FF] font-black tracking-widest uppercase text-xs hover:text-[#FFD21F] transition-colors">
            View All Live Arena →
          </Link>
        </div>

        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 space-x-6 hide-scrollbar">
          {liveMatches.map((match, i) => {
            const teamA = getTeamName(match.teamAId, match.participantA?.name);
            const teamB = getTeamName(match.teamBId, match.participantB?.name);
            const clock = match.liveState?.clock || 'LIVE';

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex-shrink-0 w-[320px] md:w-[420px]"
              >
                <Link to={`/match/${match.id}`} className="block group">
                  <div className="bg-[#071426]/90 border border-[#FF4D3D]/30 p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-[#D9A441] hover:shadow-[0_10px_30px_rgba(217,164,65,0.2)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D3D]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">{match.sportId}</span>
                      <span className="text-[10px] font-black text-[#FF4D3D] uppercase tracking-widest bg-[#FF4D3D]/15 border border-[#FF4D3D]/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,77,61,0.3)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D3D] animate-ping" />
                        {clock}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-4">
                      <div className="text-center flex-1 min-w-0">
                        <h3 className="font-black text-white uppercase truncate text-sm md:text-base tracking-wide">{teamA}</h3>
                      </div>
                      
                      <div className="px-3 py-1.5 rounded-lg bg-[#0B1A30] border border-white/10 text-center shadow-inner">
                        <div className="text-2xl md:text-3xl font-black text-[#FFD21F] tracking-tighter tabular-nums">
                          {renderScore(match)}
                        </div>
                      </div>
                      
                      <div className="text-center flex-1 min-w-0">
                        <h3 className="font-black text-white uppercase truncate text-sm md:text-base tracking-wide">{teamB}</h3>
                      </div>
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

export default LiveNowSection;
