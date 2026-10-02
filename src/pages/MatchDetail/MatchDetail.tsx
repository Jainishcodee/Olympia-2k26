import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { ScoreDisplay } from '@/components/matches/ScoreDisplay';
import { MatchTimeline } from '@/components/matches/MatchTimeline';
import { MatchStats, deriveFootballStats, deriveCricketStats, deriveVolleyballStats } from '@/components/matches/MatchStats';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { VotingPanel } from '@/components/voting/VotingPanel';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { PlayerRatingCard } from '@/components/ratings/PlayerRatingCard';
import { Footer } from '@/components/arena/Footer';
import { Badge } from '@/components/ui/Badge';
import { useScoreFX, ScoreFXLayer, CountdownOverlay, FinalOverlay } from '@/components/scoring/ScoreFX';
import { useTheme } from '@/contexts/ThemeContext';
import { useMatch } from '@/hooks/useMatch';
import { useMatchClock } from '@/hooks/useMatchClock';
import { useCollection } from '@/hooks/useCollection';
import type { Player } from '@/types/player';
import { ArrowLeft, MapPin, Zap, Trophy, Sparkles, Radio } from 'lucide-react';
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

  const { fx, fire: fireFX } = useScoreFX();
  const [showCountdown, setShowCountdown] = useState(false);
  const [showFinalCelebration, setShowFinalCelebration] = useState(false);

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

  const allPlayers = useCollection<Player>('players');
  const matchPlayers = useMemo(() => {
    if (!liveMatch) return [];
    const fromTeams = allPlayers.data.filter(
      (p) => (liveMatch.teamAId && p.teamId === liveMatch.teamAId) || (liveMatch.teamBId && p.teamId === liveMatch.teamBId)
    );
    if (fromTeams.length > 0) return fromTeams.slice(0, 6);

    // Fallback to participant entries so visitors can rate match athletes directly
    return [
      {
        id: liveMatch.participantA?.id || liveMatch.teamAId || 'athlete_a',
        name: teamAName,
        photo: (liveMatch.participantA as any)?.photo || '',
        teamId: liveMatch.teamAId || 'teamA',
      },
      {
        id: liveMatch.participantB?.id || liveMatch.teamBId || 'athlete_b',
        name: teamBName,
        photo: (liveMatch.participantB as any)?.photo || '',
        teamId: liveMatch.teamBId || 'teamB',
      },
    ];
  }, [allPlayers.data, liveMatch, teamAName, teamBName]);

  // Spectator experience: Live broadcast ScoreFX + moments triggered automatically by canonical events
  useEffect(() => {
    if (!liveEvents || liveEvents.length === 0) return;
    const active = liveEvents.filter((e) => !e.undone);
    if (active.length === 0) return;
    const sortedActive = [...active].sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0));
    const latest = sortedActive[0];
    if (latest.sequence && latest.sequence > seenSeqRef.current) {
      const isInitial = seenSeqRef.current === 0;
      seenSeqRef.current = latest.sequence;
      if (!isInitial) {
        const sideName = latest.teamName || (latest.team === 'teamB' ? teamBName : teamAName);
        const teamKey: 'teamA' | 'teamB' = latest.team === 'teamB' ? 'teamB' : 'teamA';
        const scoreTxt = latest.snapshot?.score
          ? `${latest.snapshot.score.teamA ?? scoreA} — ${latest.snapshot.score.teamB ?? scoreB}`
          : `${scoreA} — ${scoreB}`;

        if (latest.type === 'goal') {
          fireFX({
            kind: 'goal',
            title: 'GOAL!',
            sub: latest.description || `${sideName} scored!`,
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '⚽',
            title: 'GOAL!',
            subtitle: `${sideName} scored!`,
          });
        } else if (latest.type === 'six' || (latest.type === 'run' && (latest.data as Record<string, unknown>)?.runs === 6)) {
          fireFX({
            kind: 'six',
            title: 'SIX!',
            sub: latest.description || `${sideName} hit a 6!`,
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '💥',
            title: 'SIX!',
            subtitle: `${sideName} maximum!`,
          });
        } else if (latest.type === 'four' || (latest.type === 'run' && (latest.data as Record<string, unknown>)?.runs === 4)) {
          fireFX({
            kind: 'four',
            title: 'FOUR!',
            sub: latest.description || `${sideName} hit a 4!`,
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '🏏',
            title: 'FOUR!',
            subtitle: `${sideName} boundary!`,
          });
        } else if (latest.type === 'run' && (latest.data as Record<string, unknown>)?.runs === 10) {
          fireFX({
            kind: 'six',
            title: '10 RUNS!',
            kicker: 'DECIDER',
            sub: latest.description || `${sideName} 10 runs hit!`,
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '🔥',
            title: '10 RUNS!',
            subtitle: `${sideName} hit a 10!`,
          });
        } else if (latest.type === 'wicket' || latest.type === 'out') {
          fireFX({
            kind: 'wicket',
            title: 'OUT!',
            sub: latest.description || 'Wicket fell!',
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '☝️',
            title: 'WICKET!',
            subtitle: latest.description || `${sideName} wicket fallen`,
          });
        } else if (latest.type === 'point' || latest.type === 'carrom_coin') {
          const sEmoji = sId.includes('badminton') ? '🏸' : sId.includes('table-tennis') ? '🏓' : sId.includes('smash') ? '🏎️' : sId.includes('carrom') ? '⚪' : '🏐';
          fireFX({
            kind: 'point',
            title: sId.includes('smash') ? 'ELIMINATION!' : 'POINT!',
            sub: latest.description || `${sideName} scored!`,
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: sEmoji,
            title: sId.includes('smash') ? 'ELIMINATION!' : 'POINT!',
            subtitle: `${sideName}${scoreTxt ? ` · ${scoreTxt}` : ''}`,
          });
        } else if (latest.type === 'queen_pocketed' || latest.type === 'queen') {
          fireFX({
            kind: 'set',
            title: 'QUEEN!',
            kicker: 'CARROM',
            sub: latest.description || 'Queen Pocketed + Covered',
            score: scoreTxt,
            accent: '#FFD21F',
          });
          setMoment({
            icon: '👑',
            title: 'QUEEN COVERED!',
            subtitle: latest.description,
          });
        } else if (latest.type === 'round_win' || latest.type === 'round_won') {
          fireFX({
            kind: 'round',
            title: 'ROUND WON!',
            sub: latest.description || `${sideName} secured round`,
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '🔫',
            title: 'ROUND WON!',
            subtitle: latest.description,
          });
        } else if (latest.type === 'set_completed' || latest.type === 'set_won' || latest.type === 'game_won') {
          fireFX({
            kind: 'set',
            title: isRacquet ? 'GAME WON!' : 'SET WON!',
            sub: latest.description || 'Set Concluded',
            score: scoreTxt,
            team: teamKey,
          });
          setMoment({
            icon: '🏆',
            title: isRacquet ? 'GAME WON!' : 'SET COMPLETE',
            subtitle: latest.description,
          });
        } else if (latest.type === 'chess_result' || latest.type === 'checkmate') {
          fireFX({
            kind: 'set',
            title: 'CHECKMATE!',
            kicker: 'CHESS',
            sub: latest.description || 'King Checkmated',
            score: scoreTxt,
            accent: '#FFD21F',
          });
          setMoment({
            icon: '♔',
            title: 'CHECKMATE!',
            subtitle: (liveMatch?.liveState as Record<string, unknown>)?.resultText as string || `${teamAName} vs ${teamBName}`,
          });
        } else if (latest.type === 'red_card' || latest.type === 'yellow_card') {
          fireFX({
            kind: 'card',
            title: latest.type === 'red_card' ? 'RED CARD' : 'YELLOW CARD',
            sub: latest.description || 'Disciplinary card',
            accent: latest.type === 'red_card' ? '#FF4D3D' : '#FFD21F',
          });
        } else if (latest.type === 'penalty_shootout_start') {
          fireFX({
            kind: 'set',
            title: 'PENALTY SHOOTOUT!',
            sub: 'Scores tied at full time — deciding on penalties!',
            accent: '#D9A441',
          });
          setMoment({
            icon: '⚽',
            title: 'PENALTY SHOOTOUT',
            subtitle: 'Sudden death penalty kicks!',
          });
        } else if (latest.type === 'penalty_scored') {
          fireFX({
            kind: 'goal',
            title: 'PENALTY SCORED!',
            sub: latest.description || `${sideName} penalty converted!`,
            score: scoreTxt,
            team: teamKey,
            accent: '#10B981',
          });
          setMoment({
            icon: '🟢',
            title: 'PENALTY SCORED!',
            subtitle: latest.description || `${sideName} scored!`,
          });
        } else if (latest.type === 'penalty_missed') {
          fireFX({
            kind: 'card',
            title: 'PENALTY MISSED!',
            sub: latest.description || `${sideName} penalty saved / missed!`,
            score: scoreTxt,
            team: teamKey,
            accent: '#EF4444',
          });
          setMoment({
            icon: '🔴',
            title: 'PENALTY MISSED / SAVED!',
            subtitle: latest.description || `${sideName} missed!`,
          });
        } else if (latest.type === 'penalty_shootout_end') {
          setShowFinalCelebration(true);
          setMoment({
            icon: '🏆',
            title: 'SHOOTOUT VICTORY!',
            subtitle: (liveMatch?.liveState as Record<string, unknown>)?.resultText as string || `${teamAName} vs ${teamBName}`,
          });
        } else if (latest.type === 'match_start') {
          setShowCountdown(true);
        } else if (latest.type === 'match_end' || liveMatch?.status === 'completed') {
          setShowFinalCelebration(true);
          setMoment({
            icon: '🏆',
            title: 'MATCH COMPLETE',
            subtitle: (liveMatch?.liveState as Record<string, unknown>)?.resultText as string || `${teamAName} vs ${teamBName}`,
          });
        }
      }
    }
  }, [liveEvents, sId, isRacquet, teamAName, teamBName, scoreA, scoreB, liveMatch?.status, liveMatch?.liveState, fireFX]);

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
    if ((liveMatch?.liveState as Record<string, unknown>)?.isShootout) {
      displayTime = 'PENALTIES';
    } else {
      displayTime = liveClock || (liveMatch?.liveState as Record<string, unknown>)?.clock as string || '00:00';
    }
  }

  const mappedEvents = useMemo(() => {
    return liveEvents
      .filter((e) => !e.undone)
      .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))
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
  }, [liveEvents]);

  const stats = isFootball 
    ? deriveFootballStats(liveEvents, liveMatch || undefined) 
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
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <Badge sport>{sportName}</Badge>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-60">
                  <MapPin size={13} />
                  <span>{venueName}</span>
                </div>
                {(status === 'live' || status === 'paused') && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    status === 'paused'
                      ? "bg-amber-500/15 border-amber-500/35 text-amber-500"
                      : "bg-red-500/15 border-red-500/30 text-red-500 animate-pulse"
                  )}>
                    <Radio size={11} className={status === 'live' ? "animate-pulse" : ""} />
                    <span>{status === 'paused' ? 'Live Break' : 'Live Sync'}</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter">
                {teamAName} <span className="text-[#D9A441]">vs</span> {teamBName}
              </h1>

              {/* Broadcast Action Controls for Spectators */}
              <div className="flex flex-wrap items-center gap-2 mt-3.5">
                <button
                  type="button"
                  onClick={() => setShowCountdown(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95",
                    isDay
                      ? "bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#966C15] hover:bg-[#D9A441]/25"
                      : "bg-[#D9A441]/20 border border-[#D9A441]/40 text-[#FFD21F] hover:bg-[#D9A441]/30"
                  )}
                  title="Experience the full-screen 3-2-1 match kickoff intro"
                >
                  <Zap size={13} className="text-[#D9A441]" />
                  <span>3-2-1 Kickoff Intro</span>
                </button>

                {status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => setShowFinalCelebration(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-sm active:scale-95"
                    title="Replay the trophy confetti celebration and final result"
                  >
                    <Trophy size={13} />
                    <span>Trophy Celebration</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (isFootball) {
                      fireFX({
                        kind: 'goal',
                        title: 'GOAL!',
                        sub: `${teamAName} scored!`,
                        score: `${scoreA + 1} - ${scoreB}`,
                        team: 'teamA',
                      });
                    } else if (isCricket) {
                      fireFX({
                        kind: 'six',
                        title: 'SIX!',
                        sub: `${teamAName} maximum!`,
                        score: `${scoreA + 6} - ${scoreB}`,
                        team: 'teamA',
                      });
                    } else {
                      fireFX({
                        kind: 'point',
                        title: 'POINT!',
                        sub: `${teamAName} scored!`,
                        score: `${scoreA + 1} - ${scoreB}`,
                        team: 'teamA',
                      });
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95",
                    isDay
                      ? "bg-blue-500/10 border border-blue-500/25 text-[#155EEF] hover:bg-blue-500/20"
                      : "bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
                  )}
                  title="Preview the real-time broadcast score FX animation"
                >
                  <Sparkles size={13} />
                  <span>FX Preview</span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto flex justify-start md:justify-end">
              <ReactionBar matchId={matchId} />
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
              <VotingPanel
                matchId={matchId}
                teamA={teamAName}
                teamB={teamBName}
                teamAId={liveMatch?.teamAId}
                teamBId={liveMatch?.teamBId}
                allowVoting={liveMatch?.allowVoting !== false}
              />
              <MatchTimeline events={mappedEvents} matchId={matchId} />
            </div>
            <div className="space-y-6 sm:space-y-8">
              <MatchStats stats={stats} />

              {/* Player Ratings */}
              {matchId && matchPlayers.length > 0 && (
                <div
                  className={cn(
                    "p-5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all space-y-4",
                    isDay
                      ? "bg-white/80 border-[#071426]/10 text-[#071426]"
                      : "bg-[#071426]/90 border-white/10 text-white"
                  )}
                >
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
                    <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D9A441]" />
                      Player Ratings
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                      Spectator Poll
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {matchPlayers.map((p) => (
                      <PlayerRatingCard
                        key={p.id}
                        matchId={matchId}
                        playerId={p.id}
                        playerName={p.name}
                        playerPhoto={p.photo}
                        teamColor={p.teamId === liveMatch?.teamAId ? '#1264FF' : '#FF4D3D'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Match Reviews */}
          {matchId && (
            <div className="mt-10 sm:mt-14 border-t pt-8" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
              <ReviewSection matchId={matchId} />
            </div>
          )}
        </Container>
      </div>

      {/* Real-time Broadcast Score FX Fullscreen Layer */}
      <ScoreFXLayer event={fx} />

      {/* 3-2-1 Kickoff Countdown Overlay */}
      <AnimatePresence>
        {showCountdown && (
          <CountdownOverlay
            teamA={teamAName}
            teamB={teamBName}
            onDone={() => setShowCountdown(false)}
          />
        )}
      </AnimatePresence>

      {/* Fullscreen Victory Trophy Celebration Overlay */}
      <AnimatePresence>
        {showFinalCelebration && (
          <FinalOverlay
            teamA={teamAName}
            teamB={teamBName}
            scoreA={scoreA}
            scoreB={scoreB}
            subtitle={
              ((liveMatch?.liveState as Record<string, unknown>)?.resultText as string) ||
              `${sportName} Championship Final`
            }
            onClose={() => setShowFinalCelebration(false)}
          />
        )}
      </AnimatePresence>

      {/* Real-time Spectator Live Moment Toast */}
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

