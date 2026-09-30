import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, Magnetic, RollingScore } from '@/components/motion';
import type { Match, Team } from '@/types';

export const FeaturedMatch: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

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
  const scoreObj = featured.score as any;
  const scoreA = Number(scoreObj?.teamA ?? 0);
  const scoreB = Number(scoreObj?.teamB ?? 0);

  const formatSchedule = (scheduledAt: any) => {
    if (!scheduledAt) return 'Scheduled';
    const date = typeof scheduledAt.toDate === 'function' ? scheduledAt.toDate() : new Date(scheduledAt);
    return Number.isNaN(date.getTime()) 
      ? 'Scheduled' 
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className={`py-20 relative transition-colors duration-500 border-t ${
      isDay 
        ? 'bg-gradient-to-b from-transparent via-white/40 to-transparent border-[#071426]/10' 
        : 'bg-[#080A0D]/90 border-white/5'
    }`}>
      <Container>
        <TiltCard
          tiltAngle={6}
          glowColor={isDay ? 'rgba(21, 94, 239, 0.15)' : 'rgba(217, 164, 65, 0.25)'}
          cursorLabel="CLASH"
        >
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full rounded-3xl border overflow-hidden group transition-all duration-500 ${
              isDay
                ? 'bg-gradient-to-br from-white/95 via-[#FDF9F3] to-[#EAF2FA] border-[#071426]/12 shadow-[0_20px_60px_rgba(7,20,38,0.07)]'
                : 'bg-gradient-to-b from-[#0B1E3B] to-[#040B17] border-[#D9A441]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
            }`}
          >
            {/* Ambient Animated Energy Wave */}
            <motion.div 
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className={`absolute inset-0 opacity-40 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none ${
                isDay
                  ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#155EEF]/15 via-transparent to-[#D9A441]/10'
                  : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1747B8]/40 via-[#071426] to-[#D9A441]/25'
              }`}
            />
            
            <div className="relative flex flex-col items-center justify-center p-8 md:p-14 z-10 text-center">
              <span className={`text-xs md:text-sm font-black tracking-[0.28em] uppercase mb-8 flex items-center gap-2.5 px-4 py-1.5 rounded-full ${
                isDay
                  ? 'bg-[#071426]/5 text-[#155EEF] border border-[#155EEF]/20'
                  : 'bg-[#D9A441]/10 text-[#D9A441] border border-[#D9A441]/30'
              }`}>
                {isLive ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                    LIVE MAIN ARENA CLASH
                  </>
                ) : (
                  'FEATURED ARENA CLASH'
                )}
              </span>
              
              <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl gap-6 md:gap-12 my-2">
                {/* Team A */}
                <motion.div 
                  whileHover={{ scale: 1.03, x: -4 }}
                  className="flex-1 flex flex-col items-center md:items-end text-center md:text-right"
                >
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                    isDay ? 'text-[#071426]/50' : 'text-white/50'
                  }`}>
                    CONTENDER A
                  </span>
                  <h3 className={`text-2xl md:text-5xl font-black uppercase tracking-tight drop-shadow-md ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}>
                    {teamA}
                  </h3>
                  {isLive && (
                    <div className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
                      <RollingScore 
                        value={scoreA} 
                        className={isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'} 
                      />
                    </div>
                  )}
                </motion.div>
                
                {/* Center VS & Telemetry */}
                <div className="flex flex-col items-center justify-center px-6 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0">
                  <motion.span 
                    animate={{ scale: isLive ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className={`text-3xl md:text-5xl font-black tracking-wider mb-1 ${
                      isDay ? 'text-[#D9A441]' : 'text-[#FFD21F]'
                    }`}
                  >
                    VS
                  </motion.span>
                  <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                    isDay ? 'text-[#071426]/60' : 'text-white/60'
                  }`}>
                    {isLive ? (featured.liveState?.clock || 'LIVE BROADCAST') : formatSchedule(featured.scheduledAt)}
                  </span>
                </div>
                
                {/* Team B */}
                <motion.div 
                  whileHover={{ scale: 1.03, x: 4 }}
                  className="flex-1 flex flex-col items-center md:items-start text-center md:text-left"
                >
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                    isDay ? 'text-[#071426]/50' : 'text-white/50'
                  }`}>
                    CONTENDER B
                  </span>
                  <h3 className={`text-2xl md:text-5xl font-black uppercase tracking-tight drop-shadow-md ${
                    isDay ? 'text-[#071426]' : 'text-white'
                  }`}>
                    {teamB}
                  </h3>
                  {isLive && (
                    <div className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
                      <RollingScore 
                        value={scoreB} 
                        className={isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'} 
                      />
                    </div>
                  )}
                </motion.div>
              </div>
              
              <div className="mt-10">
                <Magnetic strength={0.4} radius={140}>
                  <Link 
                    to={`/match/${featured.id}`} 
                    className={`inline-flex items-center gap-3 rounded-2xl font-black uppercase tracking-widest px-9 py-4 text-xs md:text-sm transition-all shadow-lg hover:scale-105 ${
                      isDay
                        ? 'bg-[#071426] text-white hover:bg-[#155EEF] shadow-[0_10px_30px_rgba(7,20,38,0.2)]'
                        : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] hover:brightness-110 shadow-[0_0_35px_rgba(217,164,65,0.45)]'
                    }`}
                  >
                    <span>{isLive ? 'Enter Live Broadcast Arena' : 'View Match Telemetry'}</span>
                    <span className="text-lg">→</span>
                  </Link>
                </Magnetic>
              </div>
            </div>
          </motion.div>
        </TiltCard>
      </Container>
    </section>
  );
};

export default FeaturedMatch;
