import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { cn } from '@/utils/cn';
import { getTeamLogo } from '@/utils/teamLogos';
import toast from 'react-hot-toast';
import {
  recordMatchEvent,
  undoLastActiveEvent,
  correctMatchEvent,
  subscribeToMatchEvents,
  formatSportPositioning,
} from '@/services/scoring/scoringService';
import { updateMatchStatus } from '@/services/matches/matchService';
import type { EventType, Match, MatchEvent, MatchStatus, Sport, SportPositioning, Team } from '@/types';

import { RollingScore, RollingLabel } from '@/components/scoring/RollingScore';
import {
  CountdownOverlay,
  FinalOverlay,
  ScoreFXLayer,
  useScoreFX,
  type FXKind,
} from '@/components/scoring/ScoreFX';
import { StandingsTicker, type ScorerRow } from '@/components/scoring/StandingsTicker';
import { FiCornerDownLeft, FiEdit3, FiX, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

/* ============================================================================
 *  Visual Tone Styles for Tactile Scoring Pads
 * ==========================================================================*/

type Tone =
  | 'blue'
  | 'coral'
  | 'gold'
  | 'red'
  | 'yellow'
  | 'slate'
  | 'green'
  | 'violet';

const TONES: Record<Tone, string> = {
  blue: 'bg-[#1264FF] border-[#4B90FF] text-[#FFFFFF] hover:bg-[#2A75FF] shadow-[0_14px_34px_-18px_rgba(18,100,255,1)]',
  coral: 'bg-[#FF4D3D] border-[#FF8478] text-[#FFFFFF] hover:bg-[#FF6553] shadow-[0_14px_34px_-18px_rgba(255,77,61,1)]',
  gold: 'bg-[#D9A441] border-[#F0C778] text-[#080A0F] hover:bg-[#E7B455] shadow-[0_14px_34px_-18px_rgba(217,164,65,1)]',
  red: 'bg-[#C0142B] border-[#F04357] text-[#FFFFFF] hover:bg-[#DC1B34] shadow-[0_14px_34px_-18px_rgba(192,20,43,1)]',
  yellow: 'bg-[#FFD21F] border-[#FFE87A] text-[#080A0F] hover:bg-[#FFDB48]',
  slate: 'bg-[#101A2E] border-[#1E2A45] text-[#C7D2E4] hover:bg-[#17233C] hover:border-[#31426B]',
  green: 'bg-[#0E9F6E] border-[#34D3A0] text-[#FFFFFF] hover:bg-[#12B680]',
  violet: 'bg-[#6D28D9] border-[#9061F9] text-[#FFFFFF] hover:bg-[#7C3AED]',
};

const Pad: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: Tone;
    sub?: string;
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ tone = 'slate', sub, size = 'md', className, children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={cn(
      'relative flex flex-col items-center justify-center overflow-hidden rounded-lg border text-center font-black uppercase leading-tight tracking-[0.14em] transition-all duration-150 active:scale-[0.955] disabled:pointer-events-none disabled:opacity-40',
      size === 'lg'
        ? 'min-h-[80px] px-3 py-3 text-[15px]'
        : size === 'sm'
          ? 'min-h-[46px] px-2 py-2 text-[11px]'
          : 'min-h-[62px] px-3 py-3 text-[13px]',
      TONES[tone],
      className,
    )}
  >
    <span className="relative z-10">{children}</span>
    {sub && (
      <span className="relative z-10 mt-1 text-[10px] font-bold tracking-[0.2em] opacity-80">
        {sub}
      </span>
    )}
    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#FFFFFF]/35" />
  </button>
);

const PanelLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div className="mb-3 flex items-baseline gap-3">
    <h4 className="text-[10px] font-black uppercase tracking-[0.34em] text-[#D9A441]">{children}</h4>
    <span className="h-px flex-1 bg-[#1A2440]" />
    {hint && <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#4C5B75]">{hint}</span>}
  </div>
);

/* ============================================================================
 *  Scoring Console Component — Single Source of Truth via Firestore
 * ==========================================================================*/

const ScoringConsole: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { fx, fire, clear } = useScoreFX();
  const { user } = useAuth();
  const { log } = useAuditLog();

  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<MatchEvent | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionDelta, setCorrectionDelta] = useState<number>(0);

  const sports = useCollection<Sport>('sports');
  const teams = useCollection<Team>('teams');

  // Real-time Firestore subscription to the Match document (Single Source of Truth)
  useEffect(() => {
    if (!db || !matchId) {
      setIsLoading(false);
      return;
    }
    const matchRef = doc(db, 'matches', matchId);
    const unsubMatch = onSnapshot(matchRef, (snap) => {
      if (snap.exists()) {
        setLiveMatch({ id: snap.id, ...snap.data() } as Match);
      }
      setIsLoading(false);
    });

    const unsubEvents = subscribeToMatchEvents(matchId, (items) => {
      setEvents(items);
    });

    return () => {
      unsubMatch();
      unsubEvents();
    };
  }, [matchId]);

  /* ---------------------------------------------------------------- clock */

  const [seconds, setSeconds] = useState(0);
  const isMatchLive = liveMatch?.status === 'live';
  const isPaused = liveMatch?.status === 'paused';

  useEffect(() => {
    if (!isMatchLive || isPaused) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isMatchLive, isPaused]);

  const elapsedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [seconds]);

  /* ------------------------------------------------------------- metadata */

  const sportObj = useMemo(() => {
    if (!liveMatch?.sportId) return undefined;
    return sports.data.find(
      (s) => s.id === liveMatch.sportId || s.slug === liveMatch.sportId || s.name.toLowerCase() === liveMatch.sportId.toLowerCase()
    );
  }, [sports.data, liveMatch?.sportId]);

  const teamAInfo = useMemo(() => {
    const fromParticipant = liveMatch?.participantA;
    if (fromParticipant?.name) {
      return {
        id: fromParticipant.id,
        name: fromParticipant.name,
        shortName: fromParticipant.name.substring(0, 3).toUpperCase(),
        logo: fromParticipant.logo,
      };
    }
    const team = teams.data.find((t) => t.id === liveMatch?.teamAId);
    return {
      id: liveMatch?.teamAId || 'teamA',
      name: team?.name || 'Team A',
      shortName: (team?.name || 'TEA').substring(0, 3).toUpperCase(),
      logo: team?.logo,
    };
  }, [liveMatch, teams.data]);

  const teamBInfo = useMemo(() => {
    const fromParticipant = liveMatch?.participantB;
    if (fromParticipant?.name) {
      return {
        id: fromParticipant.id,
        name: fromParticipant.name,
        shortName: fromParticipant.name.substring(0, 3).toUpperCase(),
        logo: fromParticipant.logo,
      };
    }
    const team = teams.data.find((t) => t.id === liveMatch?.teamBId);
    return {
      id: liveMatch?.teamBId || 'teamB',
      name: team?.name || 'Team B',
      shortName: (team?.name || 'TEB').substring(0, 3).toUpperCase(),
      logo: team?.logo,
    };
  }, [liveMatch, teams.data]);

  const sportName = sportObj?.name || liveMatch?.sportId?.toUpperCase() || 'Sport';

  /* --------------------------------------------------- leaderboard credit */

  const [cursor, setCursor] = useState({ teamA: 0, teamB: 0 });
  const [highlight, setHighlight] = useState<string | null>(null);
  const [scorers, setScorers] = useState<ScorerRow[]>([
    { id: 'p1', name: 'A. Vega', teamShort: 'TEA', teamKey: 'teamA', value: 3 },
    { id: 'p2', name: 'R. Okoye', teamShort: 'TEA', teamKey: 'teamA', value: 2 },
    { id: 'p3', name: 'M. Silva', teamShort: 'TEB', teamKey: 'teamB', value: 2 },
    { id: 'p4', name: 'K. Ito', teamShort: 'TEB', teamKey: 'teamB', value: 1 },
  ]);

  const creditTeam = (teamKey: 'teamA' | 'teamB'): string | null => {
    const pool = scorers.filter((s) => s.teamKey === teamKey);
    if (pool.length === 0) return null;
    const pick = pool[cursor[teamKey] % pool.length];
    setCursor((prev) => ({ ...prev, [teamKey]: prev[teamKey] + 1 }));
    setScorers((prev) => prev.map((r) => (r.id === pick.id ? { ...r, value: r.value + 1 } : r)));
    setHighlight(pick.id);
    window.setTimeout(() => setHighlight((h) => (h === pick.id ? null : h)), 1600);
    return pick.id;
  };

  const debitPlayer = (id: string | null) => {
    if (!id) return;
    setScorers((prev) => prev.map((r) => (r.id === id ? { ...r, value: Math.max(0, r.value - 1) } : r)));
  };

  const rankedScorers = useMemo(
    () => [...scorers].sort((a, b) => b.value - a.value),
    [scorers],
  );

  /* ------------------------------------------------- EVENT SOURCING WRITES */

  const recordEvent = useCallback(
    async ({
      type,
      team,
      teamName,
      description,
      newScore,
      newLiveState,
      positioning,
      fxKind,
      fxTitle,
      fxSub,
      accent,
    }: {
      type: EventType;
      team?: 'teamA' | 'teamB' | '';
      teamName?: string;
      description: string;
      newScore: Record<string, unknown>;
      newLiveState?: Record<string, unknown>;
      positioning?: SportPositioning;
      fxKind?: FXKind;
      fxTitle?: string;
      fxSub?: string;
      accent?: string;
    }) => {
      if (!matchId || !liveMatch) return;
      setIsBusy(true);
      try {
        const result = await recordMatchEvent({
          matchId,
          sportId: liveMatch.sportId,
          type,
          team: team || '',
          teamName: teamName || '',
          description,
          matchTime: elapsedTime,
          positioning,
          newScore,
          newLiveState,
          createdBy: user?.uid || 'admin',
        });

        if (fxKind && fxTitle) {
          fire({
            kind: fxKind,
            title: fxTitle,
            sub: fxSub,
            accent,
            team: team || undefined,
          });
        }

        await log('EVENT_ADDED', 'match', matchId, {
          label: `#${result.sequence} · ${description}`,
          metadata: { sequence: result.sequence, type, positioning },
        });

        toast.success(`Event #${result.sequence} recorded`, { duration: 1200 });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to record event');
      } finally {
        setIsBusy(false);
      }
    },
    [matchId, liveMatch, elapsedTime, user, fire, log]
  );

  /* ---------------------------------------------------- UNDO & CORRECTION */

  const handleUndo = async () => {
    if (!matchId) return;
    setIsBusy(true);
    try {
      const result = await undoLastActiveEvent(matchId, user?.uid || 'admin');
      await log('EVENT_UNDONE', 'match', matchId, {
        label: `Undone sequence #${result.undoneEvent.sequence}: ${result.undoneEvent.description}`,
      });
      toast(`Undone #${result.undoneEvent.sequence}: ${result.undoneEvent.description}`, {
        icon: '↩️',
        duration: 2000,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nothing to undo');
    } finally {
      setIsBusy(false);
    }
  };

  const handleApplyCorrection = async () => {
    if (!matchId || !correctionTarget) return;
    if (!correctionReason.trim()) {
      toast.error('Please enter an audit reason for this correction.');
      return;
    }
    setIsBusy(true);
    try {
      const isCricket = (liveMatch?.sportId || '').toLowerCase().includes('cricket');
      const currentScore = (liveMatch?.score || {}) as Record<string, unknown>;
      let correctedScore = { ...currentScore };

      if (isCricket) {
        const runs = Number(currentScore.teamA || 0) + correctionDelta;
        correctedScore = {
          ...currentScore,
          teamA: Math.max(0, runs),
          details: { ...((currentScore.details as Record<string, unknown>) || {}), runs: Math.max(0, runs) },
        };
      }

      const note = `${correctionReason.trim()} (Delta: ${correctionDelta >= 0 ? '+' : ''}${correctionDelta})`;
      const result = await correctMatchEvent({
        matchId,
        sportId: liveMatch?.sportId || 'cricket',
        originalEventId: correctionTarget.id,
        correctionNote: note,
        newType: 'correction',
        newDescription: `Correction for #${correctionTarget.sequence}: ${correctionTarget.description} [${note}]`,
        correctedScore,
        correctedLiveState: liveMatch?.liveState as Record<string, unknown>,
        correctedBy: user?.uid || 'admin',
      });

      await log('EVENT_EDITED', 'match', matchId, {
        label: `Event #${correctionTarget.sequence} corrected: ${note}`,
        metadata: { originalSequence: correctionTarget.sequence, newSequence: result.sequence },
      });

      toast.success(`Correction applied (Audit Seq #${result.sequence})`);
      setCorrectionTarget(null);
      setCorrectionReason('');
      setCorrectionDelta(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Correction failed');
    } finally {
      setIsBusy(false);
    }
  };

  /* ---------------------------------------------------- MATCH LIFECYCLE */

  const beginPlay = async () => {
    if (!matchId) return;
    try {
      await updateMatchStatus(matchId, 'live');
      setCountdown(false);
      await recordEvent({
        type: 'match_start',
        description: 'Match started and live clock running',
        newScore: (liveMatch?.score || { teamA: 0, teamB: 0 }) as Record<string, unknown>,
        fxKind: 'neutral',
        fxTitle: 'MATCH STARTED',
        fxSub: `${teamAInfo.shortName} vs ${teamBInfo.shortName}`,
        accent: '#D9A441',
      });
      toast.success('Match is now LIVE!');
    } catch (err) {
      toast.error('Failed to start match');
    }
  };

  const handleStartMatch = () => {
    clear();
    setSeconds(0);
    setCountdown(true);
  };

  const handlePauseMatch = async () => {
    if (!matchId) return;
    try {
      await updateMatchStatus(matchId, 'paused');
      await recordEvent({
        type: 'match_pause',
        description: `Match paused at ${elapsedTime}`,
        newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      });
      toast('Match paused', { icon: '⏸️' });
    } catch (err) {
      toast.error('Failed to pause match');
    }
  };

  const handleResumeMatch = async () => {
    if (!matchId) return;
    try {
      await updateMatchStatus(matchId, 'live');
      await recordEvent({
        type: 'match_resume',
        description: `Match resumed at ${elapsedTime}`,
        newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      });
      toast.success('Match resumed');
    } catch (err) {
      toast.error('Failed to resume match');
    }
  };

  const handleEndMatch = async () => {
    if (!matchId) return;
    try {
      await updateMatchStatus(matchId, 'completed');
      setShowConfirm(null);
      setShowFinal(true);
      await recordEvent({
        type: 'match_end',
        description: `Full Time / Match Completed (${elapsedTime})`,
        newScore: (liveMatch?.score || {}) as Record<string, unknown>,
        fxKind: 'neutral',
        fxTitle: 'MATCH CONCLUDED',
        accent: '#D9A441',
      });
      toast.success('Match officially completed!');
    } catch (err) {
      toast.error('Failed to end match');
    }
  };

  /* ======================================================== SPORT HANDLERS */

  /* 1. Football */
  const handleFootballGoal = (team: 'teamA' | 'teamB') => {
    const currentScore = (liveMatch?.score || { teamA: 0, teamB: 0 }) as Record<string, unknown>;
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const opponent = team === 'teamA' ? teamBInfo : teamAInfo;
    const newTeamScore = Number(currentScore[team] || 0) + 1;
    const newScore = { ...currentScore, [team]: newTeamScore };

    const period = Number(liveMatch?.liveState?.period || 1);
    const positioning: SportPositioning = { period, matchSecond: seconds };

    creditTeam(team);
    recordEvent({
      type: 'goal',
      team,
      teamName: side.name,
      description: `⚽ GOAL! ${side.name} score! (${newScore.teamA} - ${newScore.teamB})`,
      newScore,
      newLiveState: { ...liveMatch?.liveState, clock: elapsedTime, period },
      positioning,
      fxKind: 'goal',
      fxTitle: 'GOAL!',
      fxSub: side.name,
    });
  };

  const handleFootballRemoveGoal = (team: 'teamA' | 'teamB') => {
    const currentScore = (liveMatch?.score || { teamA: 0, teamB: 0 }) as Record<string, unknown>;
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const newTeamScore = Math.max(0, Number(currentScore[team] || 0) - 1);
    const newScore = { ...currentScore, [team]: newTeamScore };

    recordEvent({
      type: 'goal_removed',
      team,
      teamName: side.name,
      description: `VAR / Goal Cancelled for ${side.name} (${newScore.teamA} - ${newScore.teamB})`,
      newScore,
      fxKind: 'neutral',
      fxTitle: 'GOAL RULED OUT',
      fxSub: side.name,
    });
  };

  /* 2. Cricket */
  const currentCricket = useMemo(() => {
    const score = (liveMatch?.score || {}) as Record<string, unknown>;
    const details = (score.details || {}) as Record<string, unknown>;
    const live = liveMatch?.liveState || {};
    return {
      runs: Number(score.teamA ?? details.runs ?? 0),
      wickets: Number(live.wickets ?? details.wickets ?? 0),
      overs: Number(live.over ?? details.overs ?? 0),
      balls: Number(live.ball ?? details.balls ?? 0),
      innings: Number(live.innings ?? details.innings ?? 1),
      extras: Number(live.extras ?? details.extras ?? 0),
    };
  }, [liveMatch]);

  const handleCricketRuns = (runsDelta: number, type: string) => {
    const illegal = type === 'wide' || type === 'no_ball';
    const isBoundary = runsDelta === 6 || runsDelta === 4 || runsDelta === 10;
    const isTen = runsDelta === 10;
    const isSix = runsDelta === 6;

    let nextBalls = currentCricket.balls;
    let nextOvers = currentCricket.overs;

    if (!illegal) {
      if (nextBalls + 1 >= 6) {
        nextBalls = 0;
        nextOvers += 1;
      } else {
        nextBalls += 1;
      }
    }

    const nextRuns = currentCricket.runs + runsDelta;
    const nextExtras = illegal ? currentCricket.extras + 1 : currentCricket.extras;

    const positioning: SportPositioning = {
      innings: currentCricket.innings,
      over: currentCricket.overs,
      ball: illegal ? currentCricket.balls : (currentCricket.balls + 1),
    };

    const newScore = {
      ...(liveMatch?.score || {}),
      teamA: nextRuns,
      details: {
        runs: nextRuns,
        wickets: currentCricket.wickets,
        overs: nextOvers,
        balls: nextBalls,
        innings: currentCricket.innings,
        extras: nextExtras,
      },
    };

    const newLiveState = {
      ...liveMatch?.liveState,
      innings: currentCricket.innings,
      over: nextOvers,
      ball: nextBalls,
      wickets: currentCricket.wickets,
      extras: nextExtras,
    };

    const title = isTen ? '10 RUNS (BONUS)' : isSix ? 'SIX!' : runsDelta === 4 ? 'FOUR!' : runsDelta === 0 ? 'DOT BALL' : `+${runsDelta} RUNS`;

    recordEvent({
      type: isTen ? 'ten' : isSix ? 'six' : runsDelta === 4 ? 'four' : type,
      team: 'teamA',
      teamName: teamAInfo.name,
      description: `🏏 ${title} · Over ${currentCricket.overs}.${illegal ? currentCricket.balls : (currentCricket.balls + 1)} (Inn ${currentCricket.innings})`,
      newScore,
      newLiveState,
      positioning,
      fxKind: isTen || isSix ? 'six' : runsDelta === 4 ? 'four' : 'point',
      fxTitle: isTen ? '10' : isSix ? '6' : runsDelta === 4 ? 'FOUR' : runsDelta === 0 ? 'DOT' : `+${runsDelta}`,
      fxSub: `${type.toUpperCase()} · ${teamAInfo.shortName}`,
      accent: isTen || isSix ? '#FFD21F' : runsDelta === 4 ? '#1264FF' : undefined,
    });
  };

  const handleCricketWicket = () => {
    let nextBalls = currentCricket.balls + 1;
    let nextOvers = currentCricket.overs;
    if (nextBalls >= 6) {
      nextBalls = 0;
      nextOvers += 1;
    }

    const nextWickets = currentCricket.wickets + 1;
    const positioning: SportPositioning = {
      innings: currentCricket.innings,
      over: currentCricket.overs,
      ball: currentCricket.balls + 1,
    };

    const newScore = {
      ...(liveMatch?.score || {}),
      details: {
        runs: currentCricket.runs,
        wickets: nextWickets,
        overs: nextOvers,
        balls: nextBalls,
        innings: currentCricket.innings,
        extras: currentCricket.extras,
      },
    };

    const newLiveState = {
      ...liveMatch?.liveState,
      over: nextOvers,
      ball: nextBalls,
      wickets: nextWickets,
      innings: currentCricket.innings,
    };

    recordEvent({
      type: 'wicket',
      team: 'teamA',
      teamName: teamAInfo.name,
      description: `🏏 OUT! Wicket #${nextWickets} falls · Over ${currentCricket.overs}.${currentCricket.balls + 1}`,
      newScore,
      newLiveState,
      positioning,
      fxKind: 'wicket',
      fxTitle: 'OUT!',
      fxSub: `WICKET · ${teamAInfo.shortName}`,
    });
  };

  /* 3. Sets & Points (Volleyball, Badminton, TT, Hand Tennis) */
  const handleAddPoint = (team: 'teamA' | 'teamB') => {
    const currentScore = (liveMatch?.score || {}) as Record<string, unknown>;
    const details = (currentScore.details || {}) as Record<string, unknown>;
    const currentSets = (details.sets as Array<{ teamA: number; teamB: number }>) || [{ teamA: 0, teamB: 0 }];
    const currentSetIndex = Math.max(0, Number(liveMatch?.liveState?.set ?? 0));

    const updatedSets = [...currentSets];
    if (!updatedSets[currentSetIndex]) {
      updatedSets[currentSetIndex] = { teamA: 0, teamB: 0 };
    }
    updatedSets[currentSetIndex] = {
      ...updatedSets[currentSetIndex],
      [team]: (updatedSets[currentSetIndex][team] || 0) + 1,
    };

    const totalPoints = updatedSets[currentSetIndex].teamA + updatedSets[currentSetIndex].teamB;
    const positioning: SportPositioning = {
      set: currentSetIndex + 1,
      rally: totalPoints,
    };

    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    creditTeam(team);

    recordEvent({
      type: 'point',
      team,
      teamName: side.name,
      description: `Point for ${side.name} (${updatedSets[currentSetIndex].teamA} - ${updatedSets[currentSetIndex].teamB})`,
      newScore: { ...currentScore, details: { ...details, sets: updatedSets, currentSet: currentSetIndex } },
      newLiveState: { ...liveMatch?.liveState, set: currentSetIndex, rally: totalPoints },
      positioning,
      fxKind: 'point',
      fxTitle: 'POINT',
      fxSub: side.name,
    });
  };

  const handleEndSet = () => {
    const currentScore = (liveMatch?.score || {}) as Record<string, unknown>;
    const details = (currentScore.details || {}) as Record<string, unknown>;
    const currentSets = (details.sets as Array<{ teamA: number; teamB: number }>) || [{ teamA: 0, teamB: 0 }];
    const currentSetIndex = Math.max(0, Number(liveMatch?.liveState?.set ?? 0));
    const activeSet = currentSets[currentSetIndex] || { teamA: 0, teamB: 0 };

    const winnerKey = activeSet.teamA > activeSet.teamB ? 'teamA' : 'teamB';
    const winnerSide = winnerKey === 'teamA' ? teamAInfo : teamBInfo;

    const teamASets = Number(currentScore.teamA || 0) + (winnerKey === 'teamA' ? 1 : 0);
    const teamBSets = Number(currentScore.teamB || 0) + (winnerKey === 'teamB' ? 1 : 0);

    const nextSets = [...currentSets, { teamA: 0, teamB: 0 }];
    const nextSetIndex = currentSetIndex + 1;

    recordEvent({
      type: 'set_won',
      team: winnerKey,
      teamName: winnerSide.name,
      description: `Set ${currentSetIndex + 1} Won by ${winnerSide.name} (${activeSet.teamA} - ${activeSet.teamB})`,
      newScore: {
        ...currentScore,
        teamA: teamASets,
        teamB: teamBSets,
        details: { ...details, sets: nextSets, currentSet: nextSetIndex },
      },
      newLiveState: { ...liveMatch?.liveState, set: nextSetIndex, rally: 0 },
      positioning: { set: currentSetIndex + 1 },
      fxKind: 'set',
      fxTitle: 'SET WON!',
      fxSub: winnerSide.name,
    });
  };

  /* 4. Chess */
  const handleChessResult = (result: 'white_wins' | 'draw' | 'black_wins') => {
    const map = {
      white_wins: { label: 'WHITE WINS', desc: '1 – 0', team: 'teamA' as const },
      draw: { label: 'DRAW', desc: '½ – ½', team: undefined },
      black_wins: { label: 'BLACK WINS', desc: '0 – 1', team: 'teamB' as const },
    };
    const sel = map[result];
    recordEvent({
      type: 'match_end',
      team: sel.team,
      description: `Chess match concluded: ${sel.label} (${sel.desc})`,
      newScore: { ...(liveMatch?.score || {}), result },
      fxKind: 'neutral',
      fxTitle: sel.label,
      fxSub: sel.desc,
      accent: '#FFD21F',
    });
  };

  /* 5. Generic Points (Carrom, LAN, etc.) */
  const handleSimplePoint = (team: 'teamA' | 'teamB', delta: number) => {
    const currentScore = (liveMatch?.score || { teamA: 0, teamB: 0 }) as Record<string, unknown>;
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const newTeamScore = Math.max(0, Number(currentScore[team] || 0) + delta);
    const newScore = { ...currentScore, [team]: newTeamScore };

    if (delta > 0) creditTeam(team);

    recordEvent({
      type: delta > 0 ? 'point' : 'point_removed',
      team,
      teamName: side.name,
      description: `${delta > 0 ? '+ Point' : '− Point'} for ${side.name} (${newScore.teamA} - ${newScore.teamB})`,
      newScore,
      fxKind: delta > 0 ? 'point' : 'neutral',
      fxTitle: delta > 0 ? 'POINT' : 'POINT REMOVED',
      fxSub: side.name,
    });
  };

  /* ======================================================= UI PANELS */

  const renderScoringButtons = () => {
    const s = (liveMatch?.sportId || '').toLowerCase();

    if (s.includes('cricket')) {
      return (
        <div className="space-y-5">
          <div>
            <PanelLabel hint="delivery telemetry">Runs</PanelLabel>
            <div className="grid grid-cols-7 gap-2">
              <Pad size="md" onClick={() => handleCricketRuns(0, 'dot')} disabled={isBusy}>Dot</Pad>
              <Pad tone="blue" size="md" onClick={() => handleCricketRuns(1, 'single')} disabled={isBusy}>+1</Pad>
              <Pad tone="blue" size="md" onClick={() => handleCricketRuns(2, 'double')} disabled={isBusy}>+2</Pad>
              <Pad tone="blue" size="md" onClick={() => handleCricketRuns(3, 'triple')} disabled={isBusy}>+3</Pad>
              <Pad tone="green" size="md" onClick={() => handleCricketRuns(4, 'four')} disabled={isBusy}>Four</Pad>
              <Pad tone="violet" size="md" onClick={() => handleCricketRuns(6, 'six')} disabled={isBusy}>Six</Pad>
              <Pad tone="gold" size="md" sub="BONUS" onClick={() => handleCricketRuns(10, 'ten')} disabled={isBusy}>+10</Pad>
            </div>
          </div>

          <div>
            <PanelLabel hint="dismissal + extras">Wickets & Extras</PanelLabel>
            <div className="grid grid-cols-5 gap-2">
              <Pad tone="red" size="md" onClick={handleCricketWicket} disabled={isBusy}>Wicket</Pad>
              <Pad tone="yellow" size="sm" onClick={() => handleCricketRuns(1, 'wide')} disabled={isBusy}>Wide</Pad>
              <Pad tone="yellow" size="sm" onClick={() => handleCricketRuns(1, 'no_ball')} disabled={isBusy}>No ball</Pad>
              <Pad size="sm" onClick={() => handleCricketRuns(1, 'bye')} disabled={isBusy}>Bye</Pad>
              <Pad size="sm" onClick={() => handleCricketRuns(1, 'leg_bye')} disabled={isBusy}>Leg bye</Pad>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Pad
              tone="violet"
              disabled={isBusy}
              onClick={() => {
                recordEvent({
                  type: 'period_start',
                  description: `Innings ${currentCricket.innings + 1} begins`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  newLiveState: { ...liveMatch?.liveState, innings: currentCricket.innings + 1, over: 0, ball: 0 },
                });
              }}
            >
              New Innings
            </Pad>
            <Pad
              disabled={isBusy}
              onClick={() => {
                recordEvent({
                  type: 'period_end',
                  description: `End of Over ${currentCricket.overs}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                });
              }}
            >
              End Over
            </Pad>
          </div>
        </div>
      );
    }

    if (s.includes('football') || s.includes('soccer')) {
      return (
        <div className="space-y-5">
          <div>
            <PanelLabel hint="tap to score">Goals</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad tone="blue" size="lg" onClick={() => handleFootballGoal('teamA')} disabled={isBusy}>
                + GOAL <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad tone="coral" size="lg" onClick={() => handleFootballGoal('teamB')} disabled={isBusy}>
                + GOAL <span className="opacity-70">{teamBInfo.shortName}</span>
              </Pad>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Pad tone="slate" size="sm" onClick={() => handleFootballRemoveGoal('teamA')} disabled={isBusy}>
                − GOAL {teamAInfo.shortName}
              </Pad>
              <Pad tone="slate" size="sm" onClick={() => handleFootballRemoveGoal('teamB')} disabled={isBusy}>
                − GOAL {teamBInfo.shortName}
              </Pad>
            </div>
          </div>

          <div>
            <PanelLabel>Disciplinary & Play</PanelLabel>
            <div className="grid grid-cols-4 gap-2">
              <Pad
                tone="yellow"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  recordEvent({
                    type: 'yellow_card',
                    team: 'teamA',
                    teamName: teamAInfo.name,
                    description: `🟨 Yellow Card · ${teamAInfo.shortName}`,
                    newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  })
                }
              >
                🟨 {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="yellow"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  recordEvent({
                    type: 'yellow_card',
                    team: 'teamB',
                    teamName: teamBInfo.name,
                    description: `🟨 Yellow Card · ${teamBInfo.shortName}`,
                    newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  })
                }
              >
                🟨 {teamBInfo.shortName}
              </Pad>
              <Pad
                tone="red"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  recordEvent({
                    type: 'red_card',
                    team: 'teamA',
                    teamName: teamAInfo.name,
                    description: `🟥 Red Card · ${teamAInfo.shortName}`,
                    newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  })
                }
              >
                🟥 {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="red"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  recordEvent({
                    type: 'red_card',
                    team: 'teamB',
                    teamName: teamBInfo.name,
                    description: `🟥 Red Card · ${teamBInfo.shortName}`,
                    newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  })
                }
              >
                🟥 {teamBInfo.shortName}
              </Pad>
            </div>
          </div>
        </div>
      );
    }

    if (s.includes('volleyball') || s.includes('badminton') || s.includes('table-tennis') || s.includes('hand-tennis')) {
      return (
        <div className="space-y-5">
          <div>
            <PanelLabel hint="rallies & points">Sets & Points</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad tone="blue" size="lg" onClick={() => handleAddPoint('teamA')} disabled={isBusy}>
                + Point <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad tone="coral" size="lg" onClick={() => handleAddPoint('teamB')} disabled={isBusy}>
                + Point <span className="opacity-70">{teamBInfo.shortName}</span>
              </Pad>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Pad tone="gold" onClick={handleEndSet} disabled={isBusy}>
              End Set
            </Pad>
            <Pad
              tone="yellow"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                recordEvent({
                  type: 'timeout',
                  team: 'teamA',
                  teamName: teamAInfo.name,
                  description: `Timeout taken by ${teamAInfo.shortName}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                })
              }
            >
              TO {teamAInfo.shortName}
            </Pad>
            <Pad
              tone="yellow"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                recordEvent({
                  type: 'timeout',
                  team: 'teamB',
                  teamName: teamBInfo.name,
                  description: `Timeout taken by ${teamBInfo.shortName}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                })
              }
            >
              TO {teamBInfo.shortName}
            </Pad>
          </div>
        </div>
      );
    }

    if (s.includes('chess')) {
      return (
        <div className="space-y-5">
          <PanelLabel hint="board adjudication">Result</PanelLabel>
          <div className="grid grid-cols-3 gap-3">
            <Pad size="lg" onClick={() => handleChessResult('white_wins')} style={{ background: '#EEF2F7', color: '#080A0F' }}>
              ♔ White wins
            </Pad>
            <Pad tone="slate" size="lg" onClick={() => handleChessResult('draw')}>
              Draw ½–½
            </Pad>
            <Pad size="lg" onClick={() => handleChessResult('black_wins')} style={{ background: '#111827', color: '#EEF2F7' }}>
              ♚ Black wins
            </Pad>
          </div>
        </div>
      );
    }

    // Generic points (Carrom, LAN, etc.)
    return (
      <div className="space-y-5">
        <PanelLabel hint="points tally">Score</PanelLabel>
        <div className="grid grid-cols-2 gap-3">
          <Pad tone="blue" size="lg" onClick={() => handleSimplePoint('teamA', 1)} disabled={isBusy}>
            + Point <span className="opacity-70">{teamAInfo.shortName}</span>
          </Pad>
          <Pad tone="coral" size="lg" onClick={() => handleSimplePoint('teamB', 1)} disabled={isBusy}>
            + Point <span className="opacity-70">{teamBInfo.shortName}</span>
          </Pad>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Pad size="sm" onClick={() => handleSimplePoint('teamA', -1)} disabled={isBusy}>
            − Point {teamAInfo.shortName}
          </Pad>
          <Pad size="sm" onClick={() => handleSimplePoint('teamB', -1)} disabled={isBusy}>
            − Point {teamBInfo.shortName}
          </Pad>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------- RENDER */

  const isLive = isMatchLive && !isPaused;
  const isCricket = (liveMatch?.sportId || '').toLowerCase().includes('cricket');

  const primaryScore = isCricket ? currentCricket.runs : Number(liveMatch?.score?.teamA ?? 0);
  const secondaryScore = isCricket ? currentCricket.wickets : Number(liveMatch?.score?.teamB ?? 0);

  const statusLabel = isPaused
    ? 'PAUSED'
    : liveMatch?.status === 'live'
      ? 'LIVE'
      : liveMatch?.status === 'completed'
        ? 'FINAL'
        : 'SCHEDULED';

  const runRate =
    currentCricket.overs + currentCricket.balls / 6 > 0
      ? (currentCricket.runs / (currentCricket.overs + currentCricket.balls / 6)).toFixed(2)
      : '0.00';

  const activeEventsCount = events.filter((e) => !e.undone).length;

  return (
    <>
      <ScoreFXLayer event={fx} />

      <AnimatePresence>
        {countdown && (
          <CountdownOverlay
            key="countdown"
            onDone={beginPlay}
            teamA={teamAInfo.shortName}
            teamB={teamBInfo.shortName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinal && (
          <FinalOverlay
            key="final"
            teamA={teamAInfo.name}
            teamB={teamBInfo.name}
            scoreA={isCricket ? `${primaryScore}/${secondaryScore}` : primaryScore}
            scoreB={isCricket ? `${currentCricket.overs}.${currentCricket.balls} ov` : secondaryScore}
            subtitle={`${sportName} · ${elapsedTime}`}
            onClose={() => setShowFinal(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={
          fx?.kind === 'wicket'
            ? { x: [0, -11, 9, -6, 4, 0], y: [0, 5, -4, 3, -1, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.42, ease: 'easeOut' }}
        className="min-h-[calc(100vh-4rem)] bg-[#05070C] text-[#EEF2F7]"
      >
        {/* Header Telemetry */}
        <header className="sticky top-0 z-30 border-b border-[#1A2440] bg-[#070B14]/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => navigate('/admin/live')}
              className="text-[11px] font-black uppercase tracking-[0.24em] text-[#5E6E86] transition-colors hover:text-[#D9A441]"
            >
              ← Back
            </button>

            <span className="border border-[#1E2A45] bg-[#101A2E] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#8FA0BC]">
              {sportName}
            </span>

            <span className="flex items-center gap-2 border border-[#1E2A45] px-2.5 py-1">
              <motion.span
                className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-[#FF3B3B]' : 'bg-[#4C5B75]')}
                animate={isLive ? { opacity: [1, 0.25, 1] } : { opacity: 0.5 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#EEF2F7]">
                <RollingLabel value={statusLabel} />
              </span>
            </span>

            <span className="text-[10px] font-bold text-slate-400 font-mono">
              Seq #{liveMatch?.lastSequence ?? events[0]?.sequence ?? 0}
            </span>

            <button
              type="button"
              onClick={() => window.open('/admin/scoring-simulator', '_blank')}
              className="border border-[#D9A441]/40 bg-[#D9A441]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#D9A441] transition-colors hover:bg-[#D9A441]/20 ml-auto sm:ml-0"
              title="Test & verify formulas in simulator"
            >
              Formula Sandbox →
            </button>

            <div className="ml-auto flex flex-wrap gap-2">
              {liveMatch?.status === 'scheduled' && (
                <Pad tone="green" size="sm" onClick={handleStartMatch} className="px-4">
                  ▶ Start match
                </Pad>
              )}
              {isMatchLive && !isPaused && (
                <Pad tone="yellow" size="sm" onClick={handlePauseMatch} className="px-4">
                  ⏸ Pause
                </Pad>
              )}
              {isMatchLive && isPaused && (
                <Pad tone="green" size="sm" onClick={handleResumeMatch} className="px-4">
                  ▶ Resume
                </Pad>
              )}
              {isMatchLive && (
                <Pad tone="red" size="sm" onClick={() => setShowConfirm('end')} className="px-4">
                  ⏹ End match
                </Pad>
              )}
            </div>
          </div>

          {/* Score Plate */}
          <div className="relative overflow-hidden border-t border-[#1A2440] bg-[#0B1220]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 140% at 50% 130%, rgba(18,100,255,0.22) 0%, rgba(11,18,32,0) 65%)',
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #D9A441, transparent)' }}
            />

            <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 sm:px-8 sm:py-6">
              <TeamPlate team={teamAInfo} side="left" />

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 text-[clamp(2.2rem,6vw,4.2rem)] font-black leading-none tracking-tight">
                  {isCricket ? (
                    <span className="text-[#EEF2F7]">
                      <RollingScore value={`${primaryScore}/${secondaryScore}`} />
                    </span>
                  ) : (
                    <>
                      <span className="text-[#EEF2F7]">
                        <RollingScore value={primaryScore} />
                      </span>
                      <span className="text-[0.5em] text-[#2C3A58]">–</span>
                      <span className="text-[#EEF2F7]">
                        <RollingScore value={secondaryScore} />
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 font-mono text-[15px] font-bold tabular-nums text-[#8FA0BC] flex items-center gap-1.5">
                    <FiClock className="h-3.5 w-3.5 text-amber-400" />
                    {elapsedTime}
                  </span>
                  {isCricket && (
                    <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#8FA0BC]">
                      {currentCricket.overs}.{currentCricket.balls} OV · RR {runRate}
                    </span>
                  )}
                </div>
              </div>

              <TeamPlate team={teamBInfo} side="right" />
            </div>
          </div>
        </header>

        {/* Workspace */}
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-6">
          {/* Scoring Controls */}
          <section className="min-w-0 border border-[#1A2440] bg-[#0B1220] p-5">
            <div className="mb-5 flex items-baseline justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.34em] text-[#EEF2F7]">
                Live Scoring Console (Single Source of Truth)
              </h3>
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#4C5B75]">
                {sportName}
              </span>
            </div>

            <div className="flex-1">{renderScoringButtons()}</div>

            {/* UNDO BUTTON */}
            <div className="mt-7 border-t border-[#1A2440] pt-4">
              <Pad
                onClick={handleUndo}
                disabled={activeEventsCount === 0 || isBusy}
                style={{
                  background: '#1A0F14',
                  color: '#FF8478',
                  borderColor: 'rgba(255,77,61,0.6)',
                }}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  <FiCornerDownLeft className="h-4 w-4" />
                  ↩ Undo Last Action (Roll Back to Previous Event)
                </span>
              </Pad>
            </div>
          </section>

          {/* Timeline & Audit Correction Feed */}
          <aside className="flex min-w-0 flex-col gap-4">
            <div className="flex min-h-[380px] flex-col border border-[#1A2440] bg-[#0B1220]">
              <div className="flex items-center justify-between border-b border-[#1A2440] px-4 py-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D9A441]">
                  Event Stream & Audit Log
                </h3>
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#5E6E86]">
                  {activeEventsCount} active / {events.length} total
                </span>
              </div>

              <div className="max-h-[55vh] flex-1 space-y-2 overflow-y-auto p-3 hide-scrollbar">
                <AnimatePresence initial={false}>
                  {events.length === 0 && (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-10 text-center text-[11px] font-black uppercase tracking-[0.26em] text-[#3B4763]"
                    >
                      Awaiting first scored event
                    </motion.p>
                  )}
                  {events.map((ev) => (
                    <motion.article
                      key={ev.id}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        'relative overflow-hidden rounded border border-white/5 bg-[#101A2E] px-3 py-2.5 transition-colors',
                        ev.undone && 'opacity-40 bg-[#0c1322]',
                        ev.isCorrection && 'border-amber-500/40 bg-amber-500/5'
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#FFD21F]">
                            #{ev.sequence}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#EEF2F7]">
                            {ev.type}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] tabular-nums text-amber-400 font-bold">
                          {ev.positioningText || ev.matchTime || 'LIVE'}
                        </span>
                      </div>

                      <div className="mt-1 text-[11px] text-[#C7D2E4] font-medium">
                        {ev.description}
                      </div>

                      {ev.isCorrection && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                          <span>⚠️ Correction (Replaces #{ev.replacesSequence})</span>
                        </div>
                      )}

                      {ev.undone && (
                        <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-red-400">
                          [UNDONE / ROLLED BACK] {ev.correctionNote ? `— ${ev.correctionNote}` : ''}
                        </div>
                      )}

                      {!ev.undone && (
                        <div className="mt-2 flex items-center justify-end gap-2 border-t border-white/5 pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectionTarget(ev);
                              setCorrectionReason('');
                              setCorrectionDelta(0);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            <FiEdit3 className="h-3 w-3" /> Correct Event
                          </button>
                        </div>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <StandingsTicker
              rows={rankedScorers}
              title="Top performers"
              unit="points"
              highlightId={highlight}
            />
          </aside>
        </div>
      </motion.div>

      {/* Audit Correction Modal */}
      <AnimatePresence>
        {correctionTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg border border-[#1E2A45] bg-[#0B1220] p-6 rounded-xl shadow-2xl text-[#EEF2F7]"
            >
              <div className="flex items-center justify-between border-b border-[#1A2440] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#FFD21F]">
                    Correct Event #{correctionTarget.sequence}
                  </h3>
                </div>
                <button
                  onClick={() => setCorrectionTarget(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 rounded bg-[#101A2E] border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Original Event</span>
                  <p className="font-semibold text-white">{correctionTarget.description}</p>
                  <span className="text-amber-400 font-mono text-[10px]">{correctionTarget.positioningText}</span>
                </div>

                {isCricket && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-2">
                      Score Delta Adjustment (Runs)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[-4, -2, -1, +1, +2].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => setCorrectionDelta(delta)}
                          className={cn(
                            'py-2 rounded font-mono font-bold text-xs border transition-colors',
                            correctionDelta === delta
                              ? 'bg-amber-400 text-black border-amber-300'
                              : 'bg-[#101A2E] border-white/10 text-slate-300 hover:bg-white/10'
                          )}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Audit Note / Correction Reason (Required)
                  </label>
                  <input
                    type="text"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Umpire review overturned 4 to 2 runs; Scorer entry typo"
                    className="w-full rounded bg-[#101A2E] border border-[#1E2A45] p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#1A2440]">
                  <button
                    type="button"
                    onClick={() => setCorrectionTarget(null)}
                    className="px-4 py-2 rounded text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCorrection}
                    disabled={isBusy || !correctionReason.trim()}
                    className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FiCheck className="h-4 w-4" /> Apply Correction
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-[98] flex items-center justify-center bg-[#05070C]/85 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-md border border-[#1E2A45] bg-[#0B1220] p-6 rounded-xl"
            >
              <h3 className="text-lg font-black uppercase tracking-[0.14em] text-[#EEF2F7]">
                End match?
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[#8FA0BC]">
                The final score will be locked in Firestore and public broadcast marked Final.
              </p>
              <div className="mt-7 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="border border-[#1E2A45] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  Cancel
                </button>
                <Pad tone="red" size="sm" onClick={handleEndMatch} className="min-h-[42px] px-5">
                  Confirm End Match
                </Pad>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* -------------------------------------------------------------------------- */

const TeamPlate: React.FC<{
  team: { name: string; shortName: string; logo?: string };
  side: 'left' | 'right';
}> = ({ team, side }) => {
  const logo = team.logo || getTeamLogo(team.name);
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3',
        side === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[12px] font-black tracking-tight sm:h-14 sm:w-14 sm:text-sm overflow-hidden border border-white/20"
        style={{
          background:
            side === 'left'
              ? 'linear-gradient(140deg, #1264FF, #0A3AA8)'
              : 'linear-gradient(140deg, #FF4D3D, #A61E14)',
          boxShadow: `0 14px 34px -18px ${side === 'left' ? 'rgba(18,100,255,1)' : 'rgba(255,77,61,1)'}`,
        }}
      >
        {logo ? (
          <img src={logo} alt={team.name} className="w-full h-full object-cover" />
        ) : (
          team.shortName
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-black uppercase tracking-[0.16em] text-[#EEF2F7] sm:text-base">
          {team.name}
        </span>
        <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-[#4C5B75]">
          {side === 'left' ? 'Home' : 'Away'}
        </span>
      </span>
    </div>
  );
};

export default ScoringConsole;
