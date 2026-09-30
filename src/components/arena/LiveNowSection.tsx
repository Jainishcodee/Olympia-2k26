import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore, SplitText, Magnetic } from '@/components/motion';
import type { Match, Team } from '@/types';

export const LiveNowSection: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

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

  if (!matches.isLoading && liveMatches.length === 0) {
    return null;
  }

  const getTeamName = (id?: string, participantName?: string) => {
    if (participantName) return participantName;
    if (!id) return 'Team';
    return teamById.get(id)?.name || id;
  };

  const getScoreA = (match: Match) => {
    const score = match.score as unknown as Record<string, unknown> | undefined;
    return Number(score?.teamA ?? 0);
  };

  const getScoreB = (match: Match) => {
    const score = match.score as unknown as Record<string, unknown> | undefined;
    return Number(score?.teamB ?? 0);
  };

  return (
    <section className={`py-20 relative overflow-hidden backdrop-blur-md transition-colors duration-500 border-t ${
      isDay 
        ? 'bg-gradient-to-b from-white/85 via-[#F3F8FE]/80 to-white/85 border-[#071426]/10 text-[#071426]' 
        : 'bg-[#080A0D]/90 border-white/5 text-white'
    }`}>
      {/* Radar ambient glow */}
      <div 
        aria-hidden 
        className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF4D3D]/10 rounded-full blur-[140px] pointer-events-none" 
      />
      
      <Container>
        <div className="flex items-end justify-between mb-10">
          <SectionTitle 
            title={
              <div className="flex items-center">
                <SplitText 
                  text="LIVE ARENA" 
                  charClassName={isDay ? 'text-[#071426]' : 'text-white'}
                />
                <span className="relative flex h-3.5 w-3.5 md:h-4 md:w-4 ml-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D3D] opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 md:h-4 md:w-4 rounded-full bg-[#FF4D3D] shadow-[0_0_15px_#FF4D3D]" />
                </span>
              </div>
            } 
            subtitle="Real-time broadcast action directly from the tournament floor" 
            className="mb-0"
          />
          
          <Magnetic strength={0.3} radius={90}>
            <Link 
              to="/live" 
              className={`hidden md:inline-flex items-center gap-2 font-black tracking-widest uppercase text-xs px-4 py-2 rounded-full border transition-all ${
                isDay
                  ? 'border-[#155EEF]/30 text-[#155EEF] hover:bg-[#155EEF] hover:text-white'
                  : 'border-[#1264FF]/30 text-[#1264FF] hover:border-[#FFD21F] hover:text-[#FFD21F]'
              }`}
            >
              <span>View All Live Arena</span>
              <span>→</span>
            </Link>
          </Magnetic>
        </div>

        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 space-x-6 hide-scrollbar">
          {liveMatches.map((match, i) => {
            const teamA = getTeamName(match.teamAId, match.participantA?.name);
            const teamB = getTeamName(match.teamBId, match.participantB?.name);
            const scoreA = getScoreA(match);
            const scoreB = getScoreB(match);
            const clock = match.liveState?.clock || 'LIVE';

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 w-[320px] md:w-[420px]"
              >
                <TiltCard
                  tiltAngle={8}
                  glowColor="rgba(255, 77, 61, 0.15)"
                  cursorLabel="LIVE"
                >
                  <Link to={`/match/${match.id}`} className="block group h-full">
                    <div className={`p-6 rounded-2xl relative overflow-hidden transition-all duration-300 border ${
                      isDay
                        ? 'bg-white/90 border-[#FF4D3D]/30 shadow-[0_10px_30px_rgba(255,77,61,0.06)] hover:border-[#FF4D3D] hover:shadow-[0_16px_40px_rgba(255,77,61,0.18)]'
                        : 'bg-[#071426]/90 border-[#FF4D3D]/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#D9A441] hover:shadow-[0_10px_30px_rgba(217,164,65,0.25)]'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D3D]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-center mb-6">
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                          isDay ? 'text-[#071426]/60' : 'text-white/60'
                        }`}>
                          {match.sportId}
                        </span>
                        
                        <span className="text-[10px] font-black text-[#FF4D3D] uppercase tracking-widest bg-[#FF4D3D]/15 border border-[#FF4D3D]/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,77,61,0.3)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D3D] animate-ping" />
                          {clock}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center gap-4">
                        <div className="text-center flex-1 min-w-0">
                          <h3 className={`font-black uppercase truncate text-sm md:text-base tracking-wide ${
                            isDay ? 'text-[#071426]' : 'text-white'
                          }`}>
                            {teamA}
                          </h3>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-xl border text-center shadow-inner ${
                          isDay
                            ? 'bg-[#F7F6F1] border-[#071426]/10'
                            : 'bg-[#0B1A30] border-white/10'
                        }`}>
                          <div className={`text-2xl md:text-3xl font-black tracking-tight tabular-nums ${
                            isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'
                          }`}>
                            <RollingScore value={scoreA} />
                            <span className="mx-1 text-black/30 dark:text-white/30">-</span>
                            <RollingScore value={scoreB} />
                          </div>
                        </div>
                        
                        <div className="text-center flex-1 min-w-0">
                          <h3 className={`font-black uppercase truncate text-sm md:text-base tracking-wide ${
                            isDay ? 'text-[#071426]' : 'text-white'
                          }`}>
                            {teamB}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold">
                        <span className={isDay ? 'text-[#071426]/50' : 'text-white/40'}>Score Hub Telemetry</span>
                        <span className="text-[#FF4D3D] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Live Stream <span>→</span>
                        </span>
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

export default LiveNowSection;
