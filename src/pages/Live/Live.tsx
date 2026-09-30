import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { MatchCard } from '@/components/matches/MatchCard';
import { Footer } from '@/components/arena/Footer';
import { useCollection } from '@/hooks/useCollection';
import { Link } from 'react-router-dom';
import type { Match, Team } from '@/types';
import { FiRadio, FiCalendar, FiArrowRight } from 'react-icons/fi';

export const Live: React.FC = () => {
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
    <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col justify-between">
      <Container className="pb-24 flex-1">
        <SectionTitle 
          title={
            <div className="flex items-center">
              <span>LIVE ARENA</span>
              {liveMatches.length > 0 && (
                <span className="relative flex h-3.5 w-3.5 ml-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D3D] opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#FF4D3D] shadow-[0_0_15px_#FF4D3D]" />
                </span>
              )}
            </div>
          } 
          subtitle="Real-time broadcast telemetry across all disciplines" 
        />
        
        {matches.isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#D9A441] inline-block mb-3" />
            <p className="text-xs uppercase tracking-widest font-black text-[#D9A441]">Connecting to Live Arena Feed…</p>
          </div>
        ) : liveMatches.length === 0 ? (
          <div className="py-20 px-6 rounded-2xl border border-white/10 bg-[#071426]/60 backdrop-blur-xl text-center max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 text-[#D9A441] shadow-[0_0_20px_rgba(217,164,65,0.15)]">
              <FiRadio className="h-7 w-7 opacity-75" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-wide text-white mb-2">No Arena Matches Live Right Now</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed font-medium">
              Matches will stream live as soon as the tournament administrator starts the next fixture in the scoring console.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link 
                to="/matches" 
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#FFD21F] text-[#071426] px-6 py-3 font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(217,164,65,0.4)]"
              >
                <FiCalendar className="h-4 w-4" />
                View All Fixtures
              </Link>
              <Link 
                to="/sports" 
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-bold text-xs uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Explore Disciplines
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
