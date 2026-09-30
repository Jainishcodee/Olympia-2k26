import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore, SplitText, Magnetic } from '@/components/motion';
import type { Match, Team } from '@/types';
import arenaImg from '@/assets/arena.jpeg';

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
    <section className={`py-24 relative overflow-hidden transition-colors duration-500 border-t ${
      isDay 
        ? 'bg-[#F7F6F1] border-[#071426]/10 text-[#071426]' 
        : 'bg-[#080A0D] border-white/5 text-white'
    }`}>
      {/* Cinematic Premium Arena Stadium Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: [1.05, 1.08, 1.05] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${arenaImg})`,
            opacity: isDay ? 0.15 : 0.28,
            filter: isDay ? 'saturate(1.1) contrast(1.05)' : 'brightness(0.85) contrast(1.2) saturate(1.15)',
          }}
        />

        {/* Atmospheric Top & Bottom Fade */}
        <div
          aria-hidden
          className={`absolute inset-0 ${
            isDay
              ? 'bg-gradient-to-b from-[#F7F6F1] via-[#F7F6F1]/55 to-[#F7F6F1]'
              : 'bg-gradient-to-b from-[#080A0D] via-[#040B17]/65 to-[#080A0D]'
          }`}
        />

        {/* Stadium Floodlight Radial Spotlight */}
        <div
          aria-hidden
          className={`absolute inset-0 ${
            isDay
              ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(18,100,255,0.08),transparent_70%)]'
              : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(18,100,255,0.22),transparent_75%)]'
          }`}
        />

        {/* Pitch Warm Illumination Glow */}
        <div
          aria-hidden
          className={`absolute top-0 right-1/4 w-[500px] h-[350px] rounded-full blur-[130px] opacity-40 ${
            isDay ? 'bg-[#D9A441]/15' : 'bg-[#D9A441]/20'
          }`}
        />

        {/* Live Broadcast Signal Radar Beacon */}
        <div 
          aria-hidden 
          className="absolute top-0 left-10 w-96 h-96 bg-[#FF4D3D]/12 rounded-full blur-[140px]" 
        />

        {/* Fine Architectural Grid Lines */}
        <div
          aria-hidden
          className={`absolute inset-0 opacity-[0.035] ${
            isDay
              ? 'bg-[linear-gradient(to_right,#071426_1px,transparent_1px),linear-gradient(to_bottom,#071426_1px,transparent_1px)] bg-[size:4rem_4rem]'
              : 'bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]'
          }`}
        />
      </div>

      <Container className="relative z-10">
        <div className="flex items-end justify-between mb-10">
          <SectionTitle 
            eyebrow="01 / LIVE BROADCAST"
            tagline="REAL-TIME ARENA TELEMETRY"
            title="THE ARENA"
            highlightTitle="IS LIVE."
            subtitle="Real-time broadcast action directly from the championship floor" 
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
