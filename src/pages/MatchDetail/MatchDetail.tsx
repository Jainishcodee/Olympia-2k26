import React from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { ScoreDisplay } from '@/components/matches/ScoreDisplay';
import { MatchTimeline } from '@/components/matches/MatchTimeline';
import { MatchStats } from '@/components/matches/MatchStats';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { VotingPanel } from '@/components/voting/VotingPanel';
import { Footer } from '@/components/arena/Footer';
import { Badge } from '@/components/ui/Badge';

export const MatchDetail: React.FC = () => {
  const { matchId } = useParams();
  
  // Mock data for MatchDetail
  const match = {
    teamA: 'Titans',
    teamB: 'Fury',
    scoreA: 2,
    scoreB: 1,
    status: 'live',
    sport: 'Football',
    time: '78\'',
    venue: 'Olympia Main Stadium'
  };

  return (
    <div className="min-h-screen bg-[#080A0D] pt-24 text-white">
      <Container className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Badge sport>{match.sport}</Badge>
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">{match.venue}</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">
              {match.teamA} vs {match.teamB}
            </h1>
          </div>
          <div className="mt-4 md:mt-0">
            <ReactionBar />
          </div>
        </div>
      </Container>
      
      <ScoreDisplay 
        teamA={match.teamA} 
        teamB={match.teamB} 
        scoreA={match.scoreA} 
        scoreB={match.scoreB} 
        status={match.status} 
        time={match.time} 
      />
      
      <Container className="py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <VotingPanel teamA={match.teamA} teamB={match.teamB} />
            <MatchTimeline />
          </div>
          <div className="space-y-8">
            <MatchStats />
          </div>
        </div>
      </Container>
      
      <Footer />
    </div>
  );
};
