import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { ScoreDisplay } from '@/components/matches/ScoreDisplay';
import { MatchTimeline } from '@/components/matches/MatchTimeline';
import { MatchStats } from '@/components/matches/MatchStats';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { VotingPanel } from '@/components/voting/VotingPanel';
import { Footer } from '@/components/arena/Footer';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useMatch } from '@/hooks/useMatch';
import { ArrowLeft, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/utils/cn';

export const MatchDetail: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { match: liveMatch, events: liveEvents, isLoading } = useMatch(matchId || '');

  // Fallback match data if no firestore match or still loading
  const match = liveMatch || {
    id: matchId || '1',
    teamA: 'Thunderbolts',
    teamB: 'Iron Titans',
    sport: 'Basketball',
    venue: 'Olympia Grand Coliseum',
    status: 'live' as const,
    time: "3rd Quarter",
    score: { teamA: 64, teamB: 58 },
  };

  const scoreA = match.score?.teamA ?? 0;
  const scoreB = match.score?.teamB ?? 0;

  return (
    <div
      className={cn(
        "min-h-screen pt-24 transition-colors flex flex-col justify-between",
        isDay ? "bg-[#F7F6F1] text-[#071426]" : "bg-[#080A0D] text-white"
      )}
    >
      <div>
        <Container className="mb-6 px-4">
          <Link
            to="/matches"
            className={cn(
              "inline-flex items-center text-xs font-black uppercase tracking-wider mb-6 transition-colors group",
              isDay ? "text-[#071426]/60 hover:text-[#155EEF]" : "text-white/60 hover:text-[#FFD21F]"
            )}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Match Central
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge sport>{match.sport || 'Match'}</Badge>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-60">
                  <MapPin size={13} />
                  <span>{match.venue || 'Coliseum'}</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter">
                {match.teamA} <span className="text-[#D9A441]">vs</span> {match.teamB}
              </h1>
            </div>

            <div className="w-full md:w-auto flex justify-start md:justify-end">
              <ReactionBar />
            </div>
          </div>
        </Container>

        <ScoreDisplay
          teamA={match.teamA}
          teamB={match.teamB}
          scoreA={scoreA}
          scoreB={scoreB}
          status={match.status || 'live'}
          time={match.time}
        />

        <Container className="py-10 sm:py-16 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <VotingPanel teamA={match.teamA} teamB={match.teamB} />
              <MatchTimeline events={liveEvents.length > 0 ? liveEvents : undefined} />
            </div>
            <div className="space-y-6 sm:space-y-8">
              <MatchStats />
            </div>
          </div>
        </Container>
      </div>

      <Footer />
    </div>
  );
};

export default MatchDetail;

