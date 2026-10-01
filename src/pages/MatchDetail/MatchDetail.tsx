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
  const { match: liveMatch, events: liveEvents } = useMatch(matchId || '');

  const teamAName = liveMatch?.participantA?.name || liveMatch?.teamAId || 'Team A';
  const teamBName = liveMatch?.participantB?.name || liveMatch?.teamBId || 'Team B';
  const sportName = liveMatch?.sportId ? (liveMatch.sportId.charAt(0).toUpperCase() + liveMatch.sportId.slice(1)) : 'Sport';
  const venueName = liveMatch?.venueId || 'Olympia Arena';
  const status = liveMatch?.status || 'scheduled';
  const timeStr = liveMatch?.liveState?.clock || 'Live';
  const scoreA = Number(liveMatch?.score?.teamA ?? 0);
  const scoreB = Number(liveMatch?.score?.teamB ?? 0);

  const mappedEvents = liveEvents.length > 0 ? liveEvents.filter(e => !e.undone).map(e => ({
    id: e.id,
    sequence: e.sequence,
    time: e.positioningText || e.matchTime || (e.period ? `P${e.period}` : 'LIVE'),
    description: e.description || (e as any).detail || 'Match play update',
    team: e.team === 'teamA' ? 'A' as const : e.team === 'teamB' ? 'B' as const : undefined,
    type: (e.type === 'goal' ? 'goal' : e.type.includes('card') ? 'card' : 'info') as any,
    isCorrection: e.isCorrection,
  })) : undefined;

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
                <Badge sport>{sportName}</Badge>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-60">
                  <MapPin size={13} />
                  <span>{venueName}</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter">
                {teamAName} <span className="text-[#D9A441]">vs</span> {teamBName}
              </h1>
            </div>

            <div className="w-full md:w-auto flex justify-start md:justify-end">
              <ReactionBar />
            </div>
          </div>
        </Container>

        <ScoreDisplay
          teamA={teamAName}
          teamB={teamBName}
          scoreA={scoreA}
          scoreB={scoreB}
          status={status}
          time={timeStr}
        />

        <Container className="py-10 sm:py-16 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <VotingPanel teamA={teamAName} teamB={teamBName} />
              <MatchTimeline events={mappedEvents} />
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

