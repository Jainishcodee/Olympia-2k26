import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { ScoreDisplay } from '@/components/matches/ScoreDisplay';
import { MatchTimeline } from '@/components/matches/MatchTimeline';
import { MatchStats, deriveFootballStats, deriveCricketStats, deriveVolleyballStats } from '@/components/matches/MatchStats';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { VotingPanel } from '@/components/voting/VotingPanel';
import { Footer } from '@/components/arena/Footer';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useMatch } from '@/hooks/useMatch';
import { useMatchClock } from '@/hooks/useMatchClock';
import { ArrowLeft, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LiveMoment {
  icon: string;
  title: string;
  subtitle: string;
}

export const MatchDetail: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { match: liveMatch, events: liveEvents } = useMatch(matchId || '');

  const [moment, setMoment] = useState<LiveMoment | null>(null);
  const seenSeqRef = useRef<number>(0);

  const { formattedTime: liveClock } = useMatchClock({
    startedAt: liveMatch?.startedAt,
    pausedAt: liveMatch?.pausedAt,
    pausedDurationMs: Number((liveMatch?.liveState as Record<string, unknown>)?.pausedDurationMs || 0),
    status: liveMatch?.status || 'scheduled',
  });

  const teamAName = liveMatch?.participantA?.name || liveMatch?.teamAId || 'Team A';
  const teamBName = liveMatch?.participantB?.name || liveMatch?.teamBId || 'Team B';
  const sportName = liveMatch?.sportId ? (liveMatch.sportId.charAt(0).toUpperCase() + liveMatch.sportId.slice(1)) : 'Sport';
  const venueName = liveMatch?.venueId || 'Olympia Arena';
  const status = liveMatch?.status || 'scheduled';
  const scoreA = Number(liveMatch?.score?.teamA ?? 0);
  const scoreB = Number(liveMatch?.score?.teamB ?? 0);

  const isFootball = (liveMatch?.sportId || '').toLowerCase().includes('football') || (liveMatch?.sportId || '').toLowerCase().includes('soccer');
  const isCricket = (liveMatch?.sportId || '').toLowerCase().includes('cricket');
  const sId = (liveMatch?.sportId || '').toLowerCase();
  const isVolleyball = sId.includes('volleyball');
  const isBadminton = sId.includes('badminton');
  const isTableTennis = sId.includes('table-tennis') || sId.includes('table_tennis');
  const isRacquet = isBadminton || isTableTennis;
  const isHalfTime = Boolean((liveMatch?.liveState as Record<string, unknown>)?.isHalfTime);

  // Spectator experience: Live moments triggered automatically by canonical events
  useEffect(() => {
    if (!liveEvents || liveEvents.length === 0) return;
    const active = liveEvents.filter((e) => !e.undone);
    if (active.length === 0) return;
    const latest = active[active.length - 1];
    if (latest.sequence && latest.sequence > seenSeqRef.current) {
      const isInitial = seenSeqRef.current === 0;
      seenSeqRef.current = latest.sequence;
      if (!isInitial) {
        if (latest.type === 'goal') {
          const sideName = latest.teamName || (latest.team === 'teamB' ? teamBName : teamAName);
          setMoment({
            icon: '⚽',
            title: 'GOAL!',
            subtitle: `${sideName} scored!`,
          });
        } else if (latest.type === 'point' || latest.type === 'carrom_coin') {
          const sideName = latest.teamName || (latest.team === 'teamB' ? teamBName : teamAName);
          const scoreTxt = latest.snapshot?.score ? `${latest.snapshot.score.teamA ?? 0} — ${latest.snapshot.score.teamB ?? 0}` : '';
          const sEmoji = sId.includes('badminton') ? '🏸' : sId.includes('table-tennis') ? '🏓' : sId.includes('smash') ? '🏎️' : sId.includes('carrom') ? '⚪' : '🏐';
          setMoment({
            icon: sEmoji,
            title: sId.includes('smash') ? 'ELIMINATION!' : 'POINT!',
            subtitle: `${sideName}${scoreTxt ? ` · ${scoreTxt}` : ''}`,
          });
        } else if (latest.type === 'queen_pocketed' || latest.type === 'queen') {
          setMoment({
            icon: '👑',
            title: 'QUEEN COVERED!',
            subtitle: latest.description,
          });
        } else if (latest.type === 'round_win' || latest.type === 'round_won') {
          setMoment({
            icon: '🔫',
            title: 'ROUND WON!',
            subtitle: latest.description,
          });
        } else if (latest.type === 'set_completed' || latest.type === 'set_won' || latest.type === 'game_won') {
          setMoment({
            icon: '🏆',
            title: isRacquet ? 'GAME WON!' : 'SET COMPLETE',
            subtitle: latest.description,
          });
        } else if (latest.type === 'chess_result' || latest.type === 'match_end' || liveMatch?.status === 'completed') {
          setMoment({
            icon: '🏆',
            title: 'MATCH COMPLETE',
            subtitle: (liveMatch?.liveState as any)?.resultText || `${teamAName} vs ${teamBName}`,
          });
        }
      }
    }
  }, [liveEvents, sId, isRacquet, teamAName, teamBName, liveMatch?.status, liveMatch?.liveState]);

  useEffect(() => {
    if (moment) {
      const timer = setTimeout(() => setMoment(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [moment]);

  let displayTime = liveClock || '00:00';
  if (status === 'paused') {
    displayTime = isCricket ? 'INNINGS BREAK' : isHalfTime ? 'HALF TIME' : 'PAUSED';
  } else if (status === 'completed') {
    displayTime = 'FINAL';
  } else if (status === 'scheduled') {
    displayTime = 'SCHEDULED';
  } else if (status === 'live') {
    displayTime = liveClock || (liveMatch?.liveState as Record<string, unknown>)?.clock as string || '00:00';
  }

  const mappedEvents = liveEvents
    .filter((e) => !e.undone)
    .map((e) => ({
      id: e.id,
      sequence: e.sequence,
      time: e.positioningText || e.matchTime || (e.positioning?.period ? `P${e.positioning.period}` : 'LIVE'),
      description: e.description || (e as any).detail || 'Match play update',
      team: (e.team as string) === 'teamA' || (e.team as string) === 'A' ? ('A' as const) : (e.team as string) === 'teamB' || (e.team as string) === 'B' ? ('B' as const) : undefined,
      teamName: e.teamName,
      type: e.type,
      playerName: (e.data as any)?.playerName || e.playerName || undefined,
      scoreText: e.snapshot?.score ? `${e.snapshot.score.teamA ?? 0} - ${e.snapshot.score.teamB ?? 0}` : undefined,
      isCorrection: e.isCorrection,
    }));

  const stats = isFootball 
    ? deriveFootballStats(liveEvents) 
    : isCricket 
      ? deriveCricketStats(liveEvents, liveMatch || undefined)
      : isVolleyball || isRacquet
        ? deriveVolleyballStats(liveEvents, liveMatch || undefined)
        : [];

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
          time={displayTime}
          sportId={liveMatch?.sportId}
          liveState={liveMatch?.liveState}
        />

        <Container className="py-10 sm:py-16 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <VotingPanel teamA={teamAName} teamB={teamBName} />
              <MatchTimeline events={mappedEvents} />
            </div>
            <div className="space-y-6 sm:space-y-8">
              <MatchStats stats={stats} />
            </div>
          </div>
        </Container>
      </div>

      {/* Real-time Spectator Live Moment Overlay */}
      <AnimatePresence>
        {moment && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#071426]/95 border border-[#D9A441]/40 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl text-white">
              <span className="text-2xl sm:text-3xl">{moment.icon}</span>
              <div>
                <div className="text-xs sm:text-sm font-black tracking-widest uppercase text-[#D9A441]">
                  {moment.title}
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {moment.subtitle}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default MatchDetail;

