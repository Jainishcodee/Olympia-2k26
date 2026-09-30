import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { MatchCard } from '@/components/matches/MatchCard';
import { Footer } from '@/components/arena/Footer';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { Link } from 'react-router-dom';
import type { Match, Team } from '@/types';
import { FiRadio, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import arenaImg from '@/assets/arena.jpeg';

export const Live: React.FC = () => {
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

  const getTeamName = (id?: string, participantName?: string) => {
    if (participantName) return participantName;
    if (!id) return 'Team';
    return teamById.get(id)?.name || id;
  };

  const getScore = (match: Match) => {
    const s = match.score as unknown as Record<string, unknown> | undefined;
    return {
      scoreA: Number(s?.teamA ?? 0),
      scoreB: Number(s?.teamB ?? 0),
    };
  };

  return (
    <div
      className={cn(
        'min-h-screen pt-28 sm:pt-32 flex flex-col justify-between transition-colors duration-300 relative overflow-hidden',
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white'
      )}
    >
      {/* Cinematic Premium Arena Stadium Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <motion.div
          initial={{ scale: 1.04 }}
          animate={{ scale: [1.04, 1.07, 1.04] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
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
              ? 'bg-gradient-to-b from-[#F7F6F1] via-[#F7F6F1]/60 to-[#F7F6F1]'
              : 'bg-gradient-to-b from-[#080A0D] via-[#040B17]/70 to-[#080A0D]'
          }`}
        />

        {/* Stadium Floodlight Radial Spotlight */}
        <div
          aria-hidden
          className={`absolute inset-0 ${
            isDay
              ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(18,100,255,0.08),transparent_70%)]'
              : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(18,100,255,0.22),transparent_75%)]'
          }`}
        />

        {/* Ambient Warm Pitch Accent Bloom */}
        <div
          aria-hidden
          className={`absolute top-20 right-1/4 w-[500px] h-[350px] rounded-full blur-[140px] opacity-40 ${
            isDay ? 'bg-[#D9A441]/15' : 'bg-[#D9A441]/20'
          }`}
        />

        {/* Live Broadcast Signal Beacon */}
        <div 
          aria-hidden 
          className="absolute top-28 left-8 w-96 h-96 bg-[#FF4D3D]/12 rounded-full blur-[140px]" 
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

      <Container className="pb-24 flex-1 relative z-10">
        <SectionTitle 
          eyebrow="01 / LIVE BROADCAST TELEMETRY"
          tagline="REAL-TIME ARENA CLASHES"
          title="LIVE"
          highlightTitle="ARENA."
          subtitle="Real-time broadcast telemetry across all active disciplines" 
        />
        
        {matches.isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#D9A441] inline-block mb-3" />
            <p className="text-xs uppercase tracking-widest font-black text-[#D9A441]">Connecting to Live Arena Feed…</p>
          </div>
        ) : liveMatches.length === 0 ? (
          <div
            className={cn(
              'py-16 sm:py-20 px-5 sm:px-6 rounded-3xl border backdrop-blur-xl text-center max-w-2xl mx-auto my-6 sm:my-8 shadow-xl',
              isDay
                ? 'bg-white/80 border-[#071426]/10 text-slate-800'
                : 'bg-[#071426]/60 border-white/10 text-white'
            )}
          >
            <div
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border',
                isDay
                  ? 'bg-blue-50 border-blue-200 text-[#1264FF]'
                  : 'bg-white/5 border-white/10 text-[#D9A441] shadow-[0_0_20px_rgba(217,164,65,0.15)]'
              )}
            >
              <FiRadio className="h-7 w-7 opacity-80" />
            </div>
            <h3
              className={cn(
                'text-lg sm:text-xl font-black uppercase tracking-wide mb-2',
                isDay ? 'text-slate-900' : 'text-white'
              )}
            >
              No Arena Matches Live Right Now
            </h3>
            <p
              className={cn(
                'text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed font-medium',
                isDay ? 'text-slate-600' : 'text-slate-400'
              )}
            >
              Matches will stream live as soon as the competition administrator starts the next fixture in the scoring console.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link 
                to="/matches" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] px-6 py-3 font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(217,164,65,0.4)] active:scale-95"
              >
                <FiCalendar className="h-4 w-4" />
                View All Fixtures
              </Link>
              <Link 
                to="/sports" 
                className={cn(
                  'w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all active:scale-95',
                  isDay
                    ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-sm'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                )}
              >
                Explore Disciplines
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {liveMatches.map((match) => {
              const { scoreA, scoreB } = getScore(match);
              return (
                <MatchCard 
                  key={match.id}
                  id={match.id} 
                  sport={match.sportId} 
                  teamA={getTeamName(match.teamAId, match.participantA?.name)} 
                  teamB={getTeamName(match.teamBId, match.participantB?.name)} 
                  scoreA={scoreA} 
                  scoreB={scoreB} 
                  status="live" 
                  time={match.liveState?.clock || 'LIVE'} 
                />
              );
            })}
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default Live;
