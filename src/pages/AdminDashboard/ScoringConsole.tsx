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
  type ScoreDelta,
} from '@/services/scoring/scoringService';
import { updateMatchStatus, updateMatch } from '@/services/matches/matchService';
import type { EventType, Match, MatchEvent, MatchStatus, Player, Sport, SportPositioning, Team } from '@/types';

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
  blue: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/60 shadow-xs font-semibold',
  coral: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500/60 shadow-xs font-semibold',
  gold: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/60 shadow-xs font-semibold',
  red: 'bg-rose-700 hover:bg-rose-600 text-white border-rose-600/60 shadow-xs font-semibold',
  yellow: 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400/60 shadow-xs font-semibold',
  slate: 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700/80 shadow-xs font-medium',
  green: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/60 shadow-xs font-semibold',
  violet: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/60 shadow-xs font-semibold',
};

const Pad: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: Tone;
    sub?: string;
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ tone = 'slate', sub, size = 'md', className, children, ...rest }) => (
  <motion.button
    type="button"
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.96 }}
    {...(rest as any)}
    className={cn(
      'relative flex flex-col items-center justify-center overflow-hidden rounded-lg border text-center font-bold uppercase leading-tight tracking-wider transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none',
      size === 'lg'
        ? 'min-h-[72px] sm:min-h-[80px] px-3 py-2.5 sm:py-3 text-sm sm:text-[15px]'
        : size === 'sm'
          ? 'min-h-[42px] sm:min-h-[46px] px-2.5 py-2 text-xs sm:text-[11px]'
          : 'min-h-[56px] sm:min-h-[62px] px-3 py-2.5 sm:py-3 text-xs sm:text-[13px]',
      TONES[tone],
      className,
    )}
  >
    <span className="relative z-10">{children}</span>
    {sub && (
      <span className="relative z-10 mt-0.5 text-[9px] sm:text-[10px] font-medium tracking-wider opacity-80">
        {sub}
      </span>
    )}
  </motion.button>
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
  const players = useCollection<Player>('players');

  // Football-specific state
  const [footballModal, setFootballModal] = useState<{
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
    team: 'teamA' | 'teamB';
  } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [assistPlayer, setAssistPlayer] = useState('');
  const [subPlayerOff, setSubPlayerOff] = useState('');
  const [subPlayerOn, setSubPlayerOn] = useState('');
  const [footballAddedTime, setFootballAddedTime] = useState<number>(0);
  const [volleyballPlayerA, setVolleyballPlayerA] = useState('');
  const [volleyballPlayerB, setVolleyballPlayerB] = useState('');

  const teamAPlayers = useMemo(() => {
    return players.data.filter((p) => p.teamId === liveMatch?.teamAId);
  }, [players.data, liveMatch?.teamAId]);

  const teamBPlayers = useMemo(() => {
    return players.data.filter((p) => p.teamId === liveMatch?.teamBId);
  }, [players.data, liveMatch?.teamBId]);

  const matchMaxOvers = useMemo(() => {
    return Number(
      liveMatch?.liveState?.maxOvers ??
      (liveMatch as any)?.maxOvers ??
      0
    );
  }, [liveMatch]);

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

  // Derive elapsed time from Firestore timestamps so refresh doesn't reset the clock
  useEffect(() => {
    if (!liveMatch?.startedAt) {
      setSeconds(0);
      return;
    }

    const startMs = typeof liveMatch.startedAt.toMillis === 'function'
      ? liveMatch.startedAt.toMillis()
      : Date.now();

    // Calculate initial elapsed, accounting for any paused duration stored in liveState
    const pausedDuration = Number((liveMatch.liveState as Record<string, unknown>)?.pausedDurationMs || 0);

    const calcElapsed = () => {
      if (isPaused && liveMatch.pausedAt) {
        const pausedAtMs = typeof liveMatch.pausedAt.toMillis === 'function'
          ? liveMatch.pausedAt.toMillis()
          : Date.now();
        return Math.floor((pausedAtMs - startMs - pausedDuration) / 1000);
      }
      return Math.floor((Date.now() - startMs - pausedDuration) / 1000);
    };

    setSeconds(Math.max(0, calcElapsed()));

    if (!isMatchLive || isPaused) return;

    const interval = setInterval(() => {
      setSeconds(Math.max(0, calcElapsed()));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMatchLive, isPaused, liveMatch?.startedAt, liveMatch?.pausedAt, liveMatch?.liveState]);

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
  const [scorers, setScorers] = useState<ScorerRow[]>([]);

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
      playerId,
      playerName,
      data,
      description,
      newScore,
      scoreDelta,
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
      playerId?: string;
      playerName?: string;
      data?: Record<string, unknown>;
      description: string;
      newScore?: Record<string, unknown>;
      scoreDelta?: ScoreDelta;
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
          playerId,
          playerName,
          data,
          description,
          matchTime: elapsedTime,
          positioning,
          newScore,
          scoreDelta,
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
        data: isCricket && matchMaxOvers > 0 ? { maxOvers: matchMaxOvers } : undefined,
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
  const handleOpenFootballModal = (
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution',
    team: 'teamA' | 'teamB'
  ) => {
    setSelectedPlayer('');
    setAssistPlayer('');
    setSubPlayerOff('');
    setSubPlayerOn('');
    setFootballModal({ type, team });
  };

  const handleConfirmFootballAction = async () => {
    if (!footballModal) return;
    const { type, team } = footballModal;
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const period = Number(liveMatch?.liveState?.period || 1);
    const positioning: SportPositioning = {
      period,
      matchSecond: seconds,
      addedTime: footballAddedTime > 0 ? footballAddedTime : undefined,
    };

    if (type === 'goal') {
      const currentScore = (liveMatch?.score || { teamA: 0, teamB: 0 }) as Record<string, unknown>;
      const newTeamScore = Number(currentScore[team] || 0) + 1;
      const newScore = { ...currentScore, [team]: newTeamScore };
      creditTeam(team);

      const scorerText = selectedPlayer ? ` (${selectedPlayer})` : '';
      const assistText = assistPlayer ? ` [Assist: ${assistPlayer}]` : '';

      await recordEvent({
        type: 'goal',
        team,
        teamName: side.name,
        playerName: selectedPlayer || undefined,
        data: {
          scorer: selectedPlayer || undefined,
          assist: assistPlayer || undefined,
        },
        description: `⚽ GOAL! ${side.name}${scorerText}${assistText}`,
        scoreDelta: { [team]: 1 },
        newScore,
        newLiveState: { ...liveMatch?.liveState, clock: elapsedTime, period },
        positioning,
        fxKind: 'goal',
        fxTitle: 'GOAL!',
        fxSub: selectedPlayer ? `${selectedPlayer} · ${side.shortName}` : side.name,
      });
    } else if (type === 'yellow_card') {
      const playerText = selectedPlayer ? ` · ${selectedPlayer}` : '';
      await recordEvent({
        type: 'yellow_card',
        team,
        teamName: side.name,
        playerName: selectedPlayer || undefined,
        data: { player: selectedPlayer || undefined },
        description: `🟨 Yellow Card · ${side.shortName}${playerText}`,
        positioning,
        newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      });
    } else if (type === 'red_card') {
      const playerText = selectedPlayer ? ` · ${selectedPlayer}` : '';
      await recordEvent({
        type: 'red_card',
        team,
        teamName: side.name,
        playerName: selectedPlayer || undefined,
        data: { player: selectedPlayer || undefined },
        description: `🟥 Red Card · ${side.shortName}${playerText}`,
        positioning,
        newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      });
    } else if (type === 'substitution') {
      const offText = subPlayerOff || 'Player Off';
      const onText = subPlayerOn || 'Player On';
      await recordEvent({
        type: 'substitution',
        team,
        teamName: side.name,
        data: { playerOff: offText, playerOn: onText },
        description: `🔄 SUB (${side.shortName}): ${onText} ON ⇄ ${offText} OFF`,
        positioning,
        newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      });
    }

    setFootballModal(null);
  };

  const handleFootballHalfTime = async () => {
    if (!matchId) return;
    const positioning: SportPositioning = {
      period: 1,
      matchSecond: seconds,
      addedTime: footballAddedTime > 0 ? footballAddedTime : undefined,
    };
    await recordEvent({
      type: 'half_time',
      description: `⏱️ Half Time reached (${elapsedTime})`,
      positioning,
      newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      fxKind: 'neutral',
      fxTitle: 'HALF TIME',
      fxSub: `${teamAInfo.shortName} vs ${teamBInfo.shortName}`,
      accent: '#D9A441',
    });
    toast('Half Time called', { icon: '⏱️' });
  };

  const handleFootballSecondHalf = async () => {
    if (!matchId) return;
    const positioning: SportPositioning = {
      period: 2,
      matchSecond: seconds,
    };
    await recordEvent({
      type: 'second_half',
      description: `⏱️ 2nd Half kicked off`,
      positioning,
      newScore: (liveMatch?.score || {}) as Record<string, unknown>,
      fxKind: 'neutral',
      fxTitle: '2ND HALF',
      fxSub: `${teamAInfo.shortName} vs ${teamBInfo.shortName}`,
      accent: '#1264FF',
    });
    toast.success('Second half underway');
  };

  const handleFootballGoal = (team: 'teamA' | 'teamB') => {
    handleOpenFootballModal('goal', team);
  };

  const handleFootballRemoveGoal = (team: 'teamA' | 'teamB') => {
    const currentScore = (liveMatch?.score || { teamA: 0, teamB: 0 }) as Record<string, unknown>;
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const newTeamScore = Math.max(0, Number(currentScore[team] || 0) - 1);
    const newScore = { ...currentScore, [team]: newTeamScore };
    const period = Number(liveMatch?.liveState?.period || 1);

    recordEvent({
      type: 'goal_removed',
      team,
      teamName: side.name,
      description: `VAR / Goal Cancelled for ${side.name} (${newScore.teamA} - ${newScore.teamB})`,
      scoreDelta: { [team]: -1 },
      newScore,
      positioning: { period, matchSecond: seconds, addedTime: footballAddedTime > 0 ? footballAddedTime : undefined },
      fxKind: 'neutral',
      fxTitle: 'GOAL RULED OUT',
      fxSub: side.name,
    });
  };

  /* 2. Cricket Engine */
  const battingTeamKey = (liveMatch?.liveState?.battingTeam || 'teamA') as 'teamA' | 'teamB';
  const bowlingTeamKey = battingTeamKey === 'teamB' ? 'teamA' : 'teamB';
  const battingTeamInfo = battingTeamKey === 'teamB' ? teamBInfo : teamAInfo;
  const bowlingTeamInfo = battingTeamKey === 'teamB' ? teamAInfo : teamBInfo;
  const battingPlayers = battingTeamKey === 'teamB' ? teamBPlayers : teamAPlayers;
  const bowlingPlayers = battingTeamKey === 'teamB' ? teamAPlayers : teamBPlayers;

  const currentCricket = useMemo(() => {
    const score = (liveMatch?.score || {}) as Record<string, unknown>;
    const details = (score.details || {}) as Record<string, unknown>;
    const live = liveMatch?.liveState || {};
    const bKey = (live.battingTeam || 'teamA') as 'teamA' | 'teamB';
    return {
      runs: Number(live.totalRuns ?? (bKey === 'teamB' ? score.teamB : score.teamA) ?? details.runs ?? 0),
      wickets: Number(live.wickets ?? details.wickets ?? 0),
      overs: Number(live.overs ?? live.over ?? details.overs ?? 0),
      balls: Number(live.legalBalls ?? live.ball ?? details.balls ?? 0),
      innings: Number(live.innings ?? details.innings ?? 1),
      extras: Number(live.extras ?? details.extras ?? 0),
      targetRuns: live.targetRuns as number | undefined,
      requiredRuns: live.requiredRuns as number | undefined,
      ballsRemaining: live.ballsRemaining as number | undefined,
      strikerName: (live.strikerName as string) || '',
      strikerRuns: Number(live.strikerRuns || 0),
      strikerBalls: Number(live.strikerBalls || 0),
      nonStrikerName: (live.nonStrikerName as string) || '',
      nonStrikerRuns: Number(live.nonStrikerRuns || 0),
      nonStrikerBalls: Number(live.nonStrikerBalls || 0),
      currentBowlerName: (live.currentBowlerName as string) || '',
      bowlerRunsConceded: Number(live.bowlerRunsConceded || 0),
      bowlerWickets: Number(live.bowlerWickets || 0),
      bowlerOvers: Number(live.bowlerOvers || 0),
      bowlerBalls: Number(live.bowlerBalls || 0),
      firstInnings: live.firstInnings as any,
      resultText: live.resultText as string | undefined,
      inningsStatus: live.inningsStatus as string | undefined,
    };
  }, [liveMatch]);

  // Cricket dialog states
  const [cricketWicketModal, setCricketWicketModal] = useState(false);
  const [wicketDismissalType, setWicketDismissalType] = useState<
    'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket'
  >('caught');
  const [wicketOutBatsman, setWicketOutBatsman] = useState<'striker' | 'nonStriker'>('striker');
  const [wicketNextBatsman, setWicketNextBatsman] = useState('');
  const [wicketFielder, setWicketFielder] = useState('');
  const [lineupModal, setLineupModal] = useState(false);
  const [lineupStriker, setLineupStriker] = useState('');
  const [lineupNonStriker, setLineupNonStriker] = useState('');
  const [lineupBowler, setLineupBowler] = useState('');

  const handleCricketRuns = (runsDelta: number, type: string) => {
    const illegal = type === 'wide' || type === 'no_ball';
    const isTen = runsDelta === 10;
    const isSix = runsDelta === 6;

    const ballNum = illegal ? currentCricket.balls : (currentCricket.balls + 1);
    const positioning: SportPositioning = {
      innings: currentCricket.innings,
      over: currentCricket.overs,
      ball: ballNum,
    };

    const title = isTen
      ? '10 RUNS (BONUS)'
      : isSix
        ? 'SIX!'
        : runsDelta === 4
          ? 'FOUR!'
          : runsDelta === 0
            ? 'DOT BALL'
            : `+${runsDelta} RUNS`;

    recordEvent({
      type: isTen ? 'ten' : isSix ? 'six' : runsDelta === 4 ? 'four' : (type as EventType),
      team: battingTeamKey,
      teamName: battingTeamInfo.name,
      description: `🏏 ${title} · Over ${currentCricket.overs}.${ballNum} (${battingTeamInfo.shortName} Inn ${currentCricket.innings})`,
      scoreDelta: {
        runs: runsDelta,
        balls: illegal ? 0 : 1,
        extras: illegal ? 1 : (type === 'bye' || type === 'leg_bye' ? runsDelta : 0),
      },
      positioning,
      fxKind: isTen || isSix ? 'six' : runsDelta === 4 ? 'four' : 'point',
      fxTitle: isTen ? '10' : isSix ? '6' : runsDelta === 4 ? 'FOUR' : runsDelta === 0 ? 'DOT' : `+${runsDelta}`,
      fxSub: `${type.toUpperCase()} · ${battingTeamInfo.shortName}`,
      accent: isTen || isSix ? '#FFD21F' : runsDelta === 4 ? '#1264FF' : undefined,
    });
  };

  const handleConfirmWicket = () => {
    const ballNum = currentCricket.balls + 1;
    const positioning: SportPositioning = {
      innings: currentCricket.innings,
      over: currentCricket.overs,
      ball: ballNum,
    };

    const outName = wicketOutBatsman === 'nonStriker' 
      ? (currentCricket.nonStrikerName || 'Non-striker') 
      : (currentCricket.strikerName || 'Striker');
    const dismissalLabel = wicketDismissalType === 'bowled'
      ? `b. ${currentCricket.currentBowlerName || 'Bowler'}`
      : wicketDismissalType === 'caught'
        ? `c. ${wicketFielder || 'Fielder'} b. ${currentCricket.currentBowlerName || 'Bowler'}`
        : wicketDismissalType === 'lbw'
          ? `lbw b. ${currentCricket.currentBowlerName || 'Bowler'}`
          : wicketDismissalType === 'run_out'
            ? `run out (${wicketFielder || 'Fielding team'})`
            : wicketDismissalType === 'stumped'
              ? `st. ${wicketFielder || 'Keeper'} b. ${currentCricket.currentBowlerName || 'Bowler'}`
              : `hit wicket b. ${currentCricket.currentBowlerName || 'Bowler'}`;

    recordEvent({
      type: 'wicket',
      team: battingTeamKey,
      teamName: battingTeamInfo.name,
      description: `🎯 OUT! ${outName} ${dismissalLabel} · Over ${currentCricket.overs}.${ballNum}`,
      scoreDelta: {
        wickets: 1,
        balls: 1,
      },
      data: {
        dismissalType: wicketDismissalType,
        outBatsman: wicketOutBatsman,
        dismissedPlayer: outName,
        fielder: wicketFielder || undefined,
        newBatsman: wicketNextBatsman || undefined,
      },
      positioning,
      fxKind: 'wicket',
      fxTitle: 'OUT!',
      fxSub: `WICKET · ${battingTeamInfo.shortName}`,
      accent: '#EF4444',
    });

    setCricketWicketModal(false);
    setWicketNextBatsman('');
    setWicketFielder('');
  };

  const handleSwapStrike = () => {
    recordEvent({
      type: 'ball',
      team: battingTeamKey,
      teamName: battingTeamInfo.name,
      description: '⇄ Strike rotated between batsmen',
      data: { swapStriker: true },
    });
  };

  const handleEndInnings = () => {
    recordEvent({
      type: 'innings_end',
      team: battingTeamKey,
      teamName: battingTeamInfo.name,
      description: `🏁 End of Innings ${currentCricket.innings}: ${battingTeamInfo.name} ${currentCricket.runs}/${currentCricket.wickets} in ${currentCricket.overs}.${currentCricket.balls} ov`,
      fxKind: 'neutral',
      fxTitle: 'INNINGS COMPLETED',
      fxSub: `Target: ${currentCricket.runs + 1}`,
      accent: '#D9A441',
    });
  };

  const handleStartSecondInnings = () => {
    recordEvent({
      type: 'innings_start',
      team: bowlingTeamKey,
      teamName: bowlingTeamInfo.name,
      description: `🏏 2nd Innings began: ${bowlingTeamInfo.name} batting, chasing target of ${currentCricket.targetRuns ?? (currentCricket.runs + 1)}`,
      data: { innings: 2 },
      fxKind: 'neutral',
      fxTitle: '2ND INNINGS',
      fxSub: `Target: ${currentCricket.targetRuns ?? (currentCricket.runs + 1)}`,
      accent: '#1264FF',
    });
  };

  const handleSaveLineup = () => {
    const updates: Record<string, unknown> = {};
    if (lineupStriker) updates.strikerName = lineupStriker;
    if (lineupNonStriker) updates.nonStrikerName = lineupNonStriker;
    if (lineupBowler) updates.currentBowlerName = lineupBowler;

    recordEvent({
      type: 'ball',
      team: battingTeamKey,
      teamName: battingTeamInfo.name,
      description: `Active players set: Striker: ${lineupStriker || currentCricket.strikerName || '—'}, Non-striker: ${lineupNonStriker || currentCricket.nonStrikerName || '—'}, Bowler: ${lineupBowler || currentCricket.currentBowlerName || '—'}`,
      newLiveState: updates,
    });
    setLineupModal(false);
  };

  const handleUpdateCricketOvers = async (newOvers: number) => {
    if (!matchId) return;
    try {
      await updateMatch(matchId, {
        maxOvers: newOvers,
        liveState: {
          ...(liveMatch?.liveState || {}),
          maxOvers: newOvers,
          ballsRemaining: Math.max(0, newOvers * 6 - (currentCricket.overs * 6 + currentCricket.balls)),
        },
      } as any);
      await recordEvent({
        type: 'ball',
        description: `Cricket overs quota updated to ${newOvers} Overs`,
        newLiveState: {
          maxOvers: newOvers,
          ballsRemaining: Math.max(0, newOvers * 6 - (currentCricket.overs * 6 + currentCricket.balls)),
        },
      });
      toast.success(`Match overs updated to ${newOvers} OV in Firestore!`);
    } catch (err) {
      toast.error('Failed to update match overs');
    }
  };

  /* 3. Volleyball Live Scoring Engine */
  const handleVolleyballPoint = async (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const player = team === 'teamA' ? volleyballPlayerA : volleyballPlayerB;

    const currentSet = Number(liveMatch?.liveState?.currentSet || liveMatch?.liveState?.set || 1);
    const curA = Number(liveMatch?.liveState?.currentSetScore?.teamA ?? liveMatch?.score?.teamA ?? 0);
    const curB = Number(liveMatch?.liveState?.currentSetScore?.teamB ?? liveMatch?.score?.teamB ?? 0);
    const currentTotalRallies = curA + curB;

    creditTeam(team);

    const playerDesc = player ? ` (${player})` : '';
    await recordEvent({
      type: 'point',
      team,
      teamName: side.name,
      playerName: player || undefined,
      description: `🏐 Point for ${side.shortName}${playerDesc}`,
      scoreDelta: { [team]: 1, points: 1 },
      positioning: {
        set: currentSet,
        rally: currentTotalRallies + 1,
      },
      fxKind: 'point',
      fxTitle: 'POINT!',
      fxSub: player ? `${player} · ${side.shortName}` : side.name,
    });
  };

  const handleVolleyballRemovePoint = async (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const currentSet = Number(liveMatch?.liveState?.currentSet || liveMatch?.liveState?.set || 1);
    await recordEvent({
      type: 'point_removed',
      team,
      teamName: side.name,
      description: `Point removed from ${side.shortName}`,
      scoreDelta: { [team]: -1, points: 1 },
      positioning: {
        set: currentSet,
      },
    });
  };

  const handleVolleyballEndSet = async () => {
    const currentSet = Number(liveMatch?.liveState?.currentSet || 1);
    const curA = Number(liveMatch?.liveState?.currentSetScore?.teamA ?? liveMatch?.score?.teamA ?? 0);
    const curB = Number(liveMatch?.liveState?.currentSetScore?.teamB ?? liveMatch?.score?.teamB ?? 0);
    const winnerKey = curA > curB ? 'teamA' : 'teamB';
    const side = winnerKey === 'teamA' ? teamAInfo : teamBInfo;

    await recordEvent({
      type: 'set_completed',
      team: winnerKey,
      teamName: side.name,
      description: `🏆 Set ${currentSet} Completed · Won by ${side.name} (${curA} - ${curB})`,
      positioning: { set: currentSet },
      fxKind: 'set',
      fxTitle: 'SET COMPLETE',
      fxSub: side.name,
    });
  };

  /* 4. Other Racquet & Net Sports (Badminton, TT, Hand Tennis) */
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
      scoreDelta: {
        [team]: 1,
        details: { sets: updatedSets, currentSet: currentSetIndex },
      },
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
      scoreDelta: {
        [winnerKey]: 1,
        details: { sets: nextSets, currentSet: nextSetIndex },
      },
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

  /* 4. Racquet Sports (Badminton & Table Tennis) */
  const handleRacquetPoint = (team: 'teamA' | 'teamB', emoji: string = '🏸') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const currentSet = Number(liveMatch?.liveState?.currentSet || liveMatch?.liveState?.game || 1);
    creditTeam(team);
    recordEvent({
      type: 'point',
      team,
      teamName: side.name,
      description: `${emoji} Point for ${side.shortName}`,
      scoreDelta: { [team]: 1, points: 1 },
      positioning: { game: currentSet },
      fxKind: 'point',
      fxTitle: 'POINT!',
      fxSub: side.name,
    });
  };

  const handleRacquetRemovePoint = (team: 'teamA' | 'teamB', emoji: string = '🏸') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const currentSet = Number(liveMatch?.liveState?.currentSet || liveMatch?.liveState?.game || 1);
    recordEvent({
      type: 'point_removed',
      team,
      teamName: side.name,
      description: `${emoji} Point removed from ${side.shortName}`,
      scoreDelta: { [team]: -1, points: 1 },
      positioning: { game: currentSet },
    });
  };

  const handleRacquetEndGame = (emoji: string = '🏸') => {
    const currentSet = Number(liveMatch?.liveState?.currentSet || liveMatch?.liveState?.game || 1);
    const curA = Number(liveMatch?.liveState?.currentSetScore?.teamA ?? liveMatch?.score?.teamA ?? 0);
    const curB = Number(liveMatch?.liveState?.currentSetScore?.teamB ?? liveMatch?.score?.teamB ?? 0);
    const winnerKey = curA > curB ? 'teamA' : 'teamB';
    const side = winnerKey === 'teamA' ? teamAInfo : teamBInfo;

    recordEvent({
      type: 'game_won',
      team: winnerKey,
      teamName: side.name,
      description: `${emoji} Game ${currentSet} Won by ${side.name} (${curA} - ${curB})`,
      positioning: { game: currentSet },
      fxKind: 'set',
      fxTitle: 'GAME WON!',
      fxSub: side.name,
    });
  };

  /* 5. Counter-Strike (MR12) */
  const handleCSRoundWin = (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const curRound = Number(liveMatch?.liveState?.round || (Number(liveMatch?.score?.teamA || 0) + Number(liveMatch?.score?.teamB || 0) + 1));
    creditTeam(team);
    recordEvent({
      type: 'round_win',
      team,
      teamName: side.name,
      description: `🔫 Round ${curRound} Won by ${side.name}`,
      scoreDelta: { [team]: 1 },
      positioning: { round: curRound },
      fxKind: 'goal',
      fxTitle: 'ROUND WON!',
      fxSub: side.name,
      accent: '#FF5722',
    });
  };

  const handleCSRemoveRound = (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const curRound = Number(liveMatch?.liveState?.round || 1);
    recordEvent({
      type: 'round_removed',
      team,
      teamName: side.name,
      description: `Round removed from ${side.name}`,
      scoreDelta: { [team]: -1 },
      positioning: { round: curRound },
    });
  };

  const handleCSSwapSides = () => {
    recordEvent({
      type: 'half_time',
      description: `Sides Swapped (CT ⇄ T)`,
      fxKind: 'neutral',
      fxTitle: 'SIDES SWAPPED',
      fxSub: 'Half-time intermission',
    });
  };

  /* 6. Carrom */
  const handleCarromScore = (team: 'teamA' | 'teamB', delta: number) => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const curBoard = Number(liveMatch?.liveState?.board || 1);
    if (delta > 0) creditTeam(team);
    const eventType = delta === 3 ? 'queen_pocketed' : delta > 0 ? 'carrom_coin' : 'point_removed';
    recordEvent({
      type: eventType,
      team,
      teamName: side.name,
      description: delta === 3
        ? `👑 Queen Pocketed (+3) by ${side.name}`
        : delta > 0
          ? `⚪ Coin Pocketed (+1) by ${side.name}`
          : `❌ Foul / Penalty (-1) on ${side.name}`,
      scoreDelta: { [team]: delta, points: Math.abs(delta) },
      positioning: { board: curBoard },
      fxKind: delta > 0 ? 'point' : 'neutral',
      fxTitle: delta === 3 ? 'QUEEN COVERED!' : delta > 0 ? 'COIN POCKETED' : 'PENALTY',
      fxSub: side.name,
    });
  };

  const handleCarromEndBoard = () => {
    const curBoard = Number(liveMatch?.liveState?.board || 1);
    recordEvent({
      type: 'board_completed',
      description: `🎯 Board ${curBoard} Completed`,
      positioning: { board: curBoard },
      fxKind: 'neutral',
      fxTitle: 'BOARD COMPLETED',
      fxSub: `Board ${curBoard}`,
    });
  };

  /* 7. Smash Karts (Arena Battle) */
  const [kartPlayerA, setKartPlayerA] = useState('');
  const [kartPlayerB, setKartPlayerB] = useState('');

  const handleSmashKartsPoint = (team: 'teamA' | 'teamB', delta: number) => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    const player = team === 'teamA' ? kartPlayerA.trim() : kartPlayerB.trim();
    if (delta > 0) creditTeam(team);
    recordEvent({
      type: delta > 0 ? 'point' : 'point_removed',
      team,
      teamName: side.name,
      playerName: player || undefined,
      data: player ? { player } : undefined,
      description: delta > 0
        ? `🏎️ Elimination (+1) by ${player ? `${player} · ` : ''}${side.name}`
        : `−1 Point for ${side.name}`,
      scoreDelta: { [team]: delta, points: Math.abs(delta) },
      fxKind: delta > 0 ? 'point' : 'neutral',
      fxTitle: delta > 0 ? 'ELIMINATION!' : 'POINT REMOVED',
      fxSub: player ? `${player} · ${side.shortName}` : side.name,
    });
  };

  const handleSmashKartsDeclareWinner = (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? teamAInfo : teamBInfo;
    recordEvent({
      type: 'match_end',
      team,
      teamName: side.name,
      description: `🏆 ${side.name} won the Smash Karts Arena Battle!`,
      fxKind: 'goal',
      fxTitle: 'VICTORY!',
      fxSub: side.name,
    });
  };

  /* 8. Chess */
  const [chessMoveText, setChessMoveText] = useState('');
  const handleChessMove = () => {
    const curMove = Number(liveMatch?.liveState?.move || 1);
    const notation = chessMoveText.trim() || `Move ${curMove}`;
    recordEvent({
      type: 'chess_move',
      description: `♟ Move ${curMove}: ${notation}`,
      data: { pgnMove: notation },
      positioning: { move: curMove },
      fxKind: 'neutral',
      fxTitle: 'MOVE PLAYED',
      fxSub: notation,
    });
    setChessMoveText('');
  };

  const handleChessResult = (result: 'white_wins' | 'draw' | 'black_wins') => {
    const map = {
      white_wins: { label: 'WHITE WINS', desc: '1 – 0', team: 'teamA' as const, delta: { teamA: 1, teamB: 0 } },
      draw: { label: 'DRAW', desc: '½ – ½', team: undefined, delta: { teamA: 0.5, teamB: 0.5 } },
      black_wins: { label: 'BLACK WINS', desc: '0 – 1', team: 'teamB' as const, delta: { teamA: 0, teamB: 1 } },
    };
    const sel = map[result];
    recordEvent({
      type: 'chess_result',
      team: sel.team,
      data: { result: result === 'white_wins' ? '1-0' : result === 'black_wins' ? '0-1' : '0.5-0.5' },
      description: `♔ Chess match concluded: ${sel.label} (${sel.desc})`,
      scoreDelta: sel.delta,
      fxKind: 'neutral',
      fxTitle: sel.label,
      fxSub: sel.desc,
      accent: '#FFD21F',
    });
  };

  /* 9. Generic Points Fallback */
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
      scoreDelta: { [team]: delta },
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
      const isInn1 = currentCricket.innings === 1;
      const isInn2 = currentCricket.innings === 2;
      const isInnCompleted = currentCricket.inningsStatus === 'completed';

      return (
        <div className="space-y-6">
          {/* Batting Team & Innings Progression Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[#1E2A45] bg-[#101A2E]/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8FA0BC] block">
                {isInn2 ? '2nd Innings Batting' : '1st Innings Batting'}
              </span>
              <span className="text-sm font-black uppercase text-[#EEF2F7]">
                🏏 {battingTeamInfo.name} ({battingTeamInfo.shortName})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isInn1 && !isInnCompleted && (
                <Pad tone="yellow" size="sm" onClick={handleEndInnings} disabled={isBusy}>
                  🏁 End 1st Innings
                </Pad>
              )}
              {isInn1 && isInnCompleted && (
                <Pad tone="green" size="sm" onClick={handleStartSecondInnings} disabled={isBusy}>
                  ▶ Start 2nd Innings
                </Pad>
              )}
              {isInn2 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block">
                    Target: {currentCricket.targetRuns ?? '—'}
                  </span>
                  <span className="text-xs font-black text-slate-300">
                    Need {currentCricket.requiredRuns ?? '—'} in {currentCricket.ballsRemaining ?? '—'}b
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Active Batsmen & Bowler Crease Telemetry */}
          <div className="p-3.5 rounded-lg border border-[#1E2A45] bg-[#070B14]">
            <div className="flex items-center justify-between mb-3 border-b border-[#1E2A45] pb-2">
              <PanelLabel hint="on-field telemetry">Crease & Bowling Attack</PanelLabel>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSwapStrike}
                  disabled={isBusy}
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-[#4B90FF]/40 bg-[#1264FF]/15 text-[#4B90FF] hover:bg-[#1264FF]/30 transition-colors"
                >
                  ⇄ Swap Strike
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLineupStriker(currentCricket.strikerName || '');
                    setLineupNonStriker(currentCricket.nonStrikerName || '');
                    setLineupBowler(currentCricket.currentBowlerName || '');
                    setLineupModal(true);
                  }}
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  ✎ Set Lineup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded bg-[#101A2E] border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">Striker *</span>
                <span className="font-black text-sm text-white truncate block">
                  {currentCricket.strikerName ? `${currentCricket.strikerName}*` : 'Not assigned'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentCricket.strikerRuns} ({currentCricket.strikerBalls}b)
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#101A2E] border border-white/10">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Non-Striker</span>
                <span className="font-black text-sm text-white truncate block">
                  {currentCricket.nonStrikerName || 'Not assigned'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentCricket.nonStrikerRuns} ({currentCricket.nonStrikerBalls}b)
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#101A2E] border border-rose-500/30">
                <span className="text-[10px] font-bold uppercase text-rose-400 block">Current Bowler</span>
                <span className="font-black text-sm text-white truncate block">
                  {currentCricket.currentBowlerName || 'Not assigned'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentCricket.bowlerWickets}/{currentCricket.bowlerRunsConceded} ({currentCricket.bowlerOvers}.{currentCricket.bowlerBalls} ov)
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Runs (Fast Action) */}
          <div>
            <PanelLabel hint="delivery telemetry">Delivery Runs</PanelLabel>
            <div className="grid grid-cols-7 gap-2">
              <Pad size="md" onClick={() => handleCricketRuns(0, 'dot')} disabled={isBusy}>Dot 0</Pad>
              <Pad tone="blue" size="md" onClick={() => handleCricketRuns(1, 'single')} disabled={isBusy}>+1</Pad>
              <Pad tone="blue" size="md" onClick={() => handleCricketRuns(2, 'double')} disabled={isBusy}>+2</Pad>
              <Pad tone="blue" size="md" onClick={() => handleCricketRuns(3, 'triple')} disabled={isBusy}>+3</Pad>
              <Pad tone="green" size="md" onClick={() => handleCricketRuns(4, 'four')} disabled={isBusy}>Four 4</Pad>
              <Pad tone="violet" size="md" onClick={() => handleCricketRuns(6, 'six')} disabled={isBusy}>Six 6</Pad>
              <Pad tone="gold" size="md" sub="SUPER" onClick={() => handleCricketRuns(10, 'ten')} disabled={isBusy}>+10</Pad>
            </div>
          </div>

          {/* Dismissals & Extras */}
          <div>
            <PanelLabel hint="dismissal + extras">Wickets & Extras</PanelLabel>
            <div className="grid grid-cols-5 gap-2">
              <Pad tone="red" size="md" onClick={() => setCricketWicketModal(true)} disabled={isBusy}>
                🎯 Wicket
              </Pad>
              <Pad tone="yellow" size="sm" onClick={() => handleCricketRuns(1, 'wide')} disabled={isBusy}>
                Wide +1
              </Pad>
              <Pad tone="yellow" size="sm" onClick={() => handleCricketRuns(1, 'no_ball')} disabled={isBusy}>
                No ball +1
              </Pad>
              <Pad size="sm" onClick={() => handleCricketRuns(1, 'bye')} disabled={isBusy}>
                Bye +1
              </Pad>
              <Pad size="sm" onClick={() => handleCricketRuns(1, 'leg_bye')} disabled={isBusy}>
                Leg bye +1
              </Pad>
            </div>
          </div>

          {/* Over & Break Control */}
          <div className="grid grid-cols-2 gap-2">
            <Pad
              tone="slate"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                recordEvent({
                  type: 'over_completed',
                  team: battingTeamKey,
                  teamName: battingTeamInfo.name,
                  description: `⏱️ End of Over ${currentCricket.overs} (${battingTeamInfo.shortName}: ${currentCricket.runs}/${currentCricket.wickets})`,
                });
              }}
            >
              ⏱️ End Over ({currentCricket.overs}.{currentCricket.balls})
            </Pad>
            <Pad
              tone="slate"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                recordEvent({
                  type: 'drinks_break',
                  description: `🥤 Drinks Break called (${currentCricket.overs}.${currentCricket.balls} ov)`,
                });
              }}
            >
              🥤 Drinks Break
            </Pad>
          </div>

          {/* Custom Overs Quota Control */}
          <div className="flex flex-wrap items-center justify-between gap-2 border border-[#1A2440] bg-[#050B14] p-3 rounded-lg">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8FA0BC] block">
                Match Overs Quota
              </span>
              <span className="text-xs font-mono font-bold text-[#D9A441]">
                {matchMaxOvers > 0 ? `${matchMaxOvers} Overs` : 'Open / Unlimited Overs'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {[2, 5, 10, 15, 20].map((ov) => (
                <button
                  key={ov}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleUpdateCricketOvers(ov)}
                  className={cn(
                    'px-2 py-1 text-[11px] font-bold rounded border transition-colors',
                    matchMaxOvers === ov
                      ? 'border-[#D9A441] bg-[#D9A441]/20 text-[#D9A441] font-black'
                      : 'border-[#1E2A45] bg-[#101A2E] text-slate-300 hover:bg-[#1E2A45]'
                  )}
                >
                  {ov} ov
                </button>
              ))}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  const input = window.prompt('Enter custom match overs (e.g. 2, 15, 30, 50):', String(matchMaxOvers || 20));
                  if (input) {
                    const parsed = parseInt(input, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      handleUpdateCricketOvers(parsed);
                    }
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded border border-[#1E2A45] bg-[#101A2E] text-slate-300 hover:bg-[#1E2A45]"
              >
                ✎ Custom
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (s.includes('football') || s.includes('soccer')) {
      const isPeriod1 = (liveMatch?.liveState?.period || 1) === 1;
      const isPeriod2 = (liveMatch?.liveState?.period || 1) === 2;
      const isHT = Boolean(liveMatch?.liveState?.isHalfTime);

      return (
        <div className="space-y-6">
          {/* Match Halves & Lifecycle */}
          <div>
            <PanelLabel hint="match halves">Period & Halves</PanelLabel>
            <div className="grid grid-cols-3 gap-2">
              {isPeriod1 && !isHT && isMatchLive && !isPaused ? (
                <Pad tone="yellow" onClick={handleFootballHalfTime} disabled={isBusy}>
                  ⏱️ Half Time
                </Pad>
              ) : isHT || (isPaused && isPeriod1) ? (
                <Pad tone="green" onClick={handleFootballSecondHalf} disabled={isBusy}>
                  ▶ Start 2nd Half
                </Pad>
              ) : (
                <Pad tone="slate" disabled className="opacity-50">
                  {isPeriod2 ? '2nd Half Active' : '1st Half'}
                </Pad>
              )}

              <Pad
                tone="red"
                onClick={() => setShowConfirm('end')}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                🏁 Full Time
              </Pad>

              <div className="flex items-center justify-center border border-[#1E2A45] bg-[#101A2E] text-[11px] font-black uppercase tracking-wider text-[#8FA0BC] px-3 py-2">
                {isHT ? 'Half Time' : isPeriod2 ? '2nd Half (2H)' : '1st Half (1H)'}
              </div>
            </div>
          </div>

          {/* Stoppage / Added Time */}
          <div>
            <PanelLabel hint="stoppage time">Added Time (Stoppage)</PanelLabel>
            <div className="flex items-center gap-2 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setFootballAddedTime(mins)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-mono font-bold rounded border transition-colors",
                    footballAddedTime === mins
                      ? "bg-[#D9A441] text-[#05070C] border-[#D9A441] shadow-sm"
                      : "bg-[#101A2E] text-[#8FA0BC] border-[#1E2A45] hover:text-white hover:border-[#4B90FF]"
                  )}
                >
                  {mins === 0 ? '+0' : `+${mins}'`}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <PanelLabel hint="tap to record goal with scorer">Goals</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad tone="blue" size="lg" onClick={() => handleOpenFootballModal('goal', 'teamA')} disabled={isBusy}>
                + GOAL <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad tone="coral" size="lg" onClick={() => handleOpenFootballModal('goal', 'teamB')} disabled={isBusy}>
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

          {/* Disciplinary & Lineup */}
          <div>
            <PanelLabel hint="cards & subs">Disciplinary & Lineup</PanelLabel>
            <div className="grid grid-cols-3 gap-2">
              <Pad
                tone="yellow"
                size="sm"
                disabled={isBusy}
                onClick={() => handleOpenFootballModal('yellow_card', 'teamA')}
              >
                🟨 Card {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="red"
                size="sm"
                disabled={isBusy}
                onClick={() => handleOpenFootballModal('red_card', 'teamA')}
              >
                🟥 Card {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="blue"
                size="sm"
                disabled={isBusy}
                onClick={() => handleOpenFootballModal('substitution', 'teamA')}
              >
                🔄 Sub {teamAInfo.shortName}
              </Pad>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Pad
                tone="yellow"
                size="sm"
                disabled={isBusy}
                onClick={() => handleOpenFootballModal('yellow_card', 'teamB')}
              >
                🟨 Card {teamBInfo.shortName}
              </Pad>
              <Pad
                tone="red"
                size="sm"
                disabled={isBusy}
                onClick={() => handleOpenFootballModal('red_card', 'teamB')}
              >
                🟥 Card {teamBInfo.shortName}
              </Pad>
              <Pad
                tone="coral"
                size="sm"
                disabled={isBusy}
                onClick={() => handleOpenFootballModal('substitution', 'teamB')}
              >
                🔄 Sub {teamBInfo.shortName}
              </Pad>
            </div>
          </div>
        </div>
      );
    }

    if (s.includes('volleyball')) {
      const currentSet = Number(liveMatch?.liveState?.currentSet || 1);
      const targetPoints = Number(liveMatch?.liveState?.targetPoints || 25);
      const bestOf = Number(liveMatch?.liveState?.bestOf || 3);
      const isDeciding = currentSet >= bestOf;
      const setsWonA = Number(liveMatch?.liveState?.setsWon?.teamA ?? 0);
      const setsWonB = Number(liveMatch?.liveState?.setsWon?.teamB ?? 0);
      const curPtsA = Number(liveMatch?.liveState?.currentSetScore?.teamA ?? liveMatch?.score?.teamA ?? 0);
      const curPtsB = Number(liveMatch?.liveState?.currentSetScore?.teamB ?? liveMatch?.score?.teamB ?? 0);
      const completedSets = (liveMatch?.liveState?.completedSets as Array<{ set: number; teamA: number; teamB: number; winner: string }>) || [];

      return (
        <div className="space-y-5">
          {/* Volleyball Match HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-[#D9A441] text-sm uppercase">
                SET {currentSet} {isDeciding && '(Deciding Set)'}
              </span>
              <span className="text-[#8FA0BC]">· Target: {targetPoints} pts (Win by 2)</span>
            </div>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-blue-400">{teamAInfo.shortName}: {setsWonA} sets</span>
              <span className="text-[#5E6E86]">—</span>
              <span className="text-[#FF4D3D]">{teamBInfo.shortName}: {setsWonB} sets</span>
            </div>
          </div>

          {/* Current Set Big Score Readout */}
          <div className="flex items-center justify-center gap-6 rounded-xl border border-[#1A2440] bg-[#070D18] py-4">
            <div className="text-center">
              <span className="block text-xs font-black uppercase tracking-wider text-blue-400">{teamAInfo.shortName}</span>
              <span className="text-4xl font-mono font-black text-white tabular-nums">{curPtsA}</span>
            </div>
            <span className="text-2xl font-black text-[#3B4D6B]">:</span>
            <div className="text-center">
              <span className="block text-xs font-black uppercase tracking-wider text-[#FF4D3D]">{teamBInfo.shortName}</span>
              <span className="text-4xl font-mono font-black text-white tabular-nums">{curPtsB}</span>
            </div>
          </div>

          {/* 1-Tap Scoring Pads */}
          <div>
            <PanelLabel hint="single tap scores point">Rally Winner (+ Point)</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad
                tone="blue"
                size="lg"
                onClick={() => handleVolleyballPoint('teamA')}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                + POINT <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad
                tone="coral"
                size="lg"
                onClick={() => handleVolleyballPoint('teamB')}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                + POINT <span className="opacity-70">{teamBInfo.shortName}</span>
              </Pad>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleVolleyballRemovePoint('teamA')}
                disabled={isBusy || curPtsA === 0 || liveMatch?.status === 'completed'}
              >
                − Point {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleVolleyballRemovePoint('teamB')}
                disabled={isBusy || curPtsB === 0 || liveMatch?.status === 'completed'}
              >
                − Point {teamBInfo.shortName}
              </Pad>
            </div>
          </div>

          {/* Optional Player Attribution (Non-blocking) */}
          <div className="rounded-lg border border-[#1A2440] bg-[#0E1726]/60 p-3">
            <PanelLabel hint="optional — point can be recorded without player">Player Attribution (Optional)</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder={`${teamAInfo.shortName} Player (Optional)`}
                  value={volleyballPlayerA}
                  onChange={(e) => setVolleyballPlayerA(e.target.value)}
                  className="w-full rounded border border-[#1E2A45] bg-[#101A2E] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder={`${teamBInfo.shortName} Player (Optional)`}
                  value={volleyballPlayerB}
                  onChange={(e) => setVolleyballPlayerB(e.target.value)}
                  className="w-full rounded border border-[#1E2A45] bg-[#101A2E] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#FF4D3D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Utility Actions (Timeouts & Manual End Set) */}
          <div>
            <PanelLabel hint="timeouts and set controls">Match Controls</PanelLabel>
            <div className="grid grid-cols-3 gap-2">
              <Pad
                tone="gold"
                onClick={handleVolleyballEndSet}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                🏆 End Set
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
                    description: `Timeout called by ${teamAInfo.shortName}`,
                    newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  })
                }
              >
                ⏱️ TO {teamAInfo.shortName}
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
                    description: `Timeout called by ${teamBInfo.shortName}`,
                    newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                  })
                }
              >
                ⏱️ TO {teamBInfo.shortName}
              </Pad>
            </div>
          </div>

          {/* Completed Sets History Pills */}
          {completedSets.length > 0 && (
            <div className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#8FA0BC] mb-2">
                Completed Sets History
              </span>
              <div className="flex flex-wrap gap-2">
                {completedSets.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-[#070D18] border border-[#1A2440] font-mono text-xs text-slate-300"
                  >
                    Set {s.set}: <strong className="text-white">{s.teamA}–{s.teamB}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (s.includes('badminton') || s.includes('table-tennis') || s.includes('table_tennis')) {
      const isBadminton = s.includes('badminton');
      const emoji = isBadminton ? '🏸' : '🏓';
      const defaultTarget = isBadminton ? 21 : 11;
      const ls = (liveMatch?.liveState || {}) as Record<string, any>;
      const currentSet = Number(ls.currentSet || ls.game || 1);
      const targetPoints = Number(ls.targetPoints || defaultTarget);
      const gamesWonA = Number(ls.gamesWon?.teamA ?? ls.setsWon?.teamA ?? 0);
      const gamesWonB = Number(ls.gamesWon?.teamB ?? ls.setsWon?.teamB ?? 0);
      const curPtsA = Number(ls.currentSetScore?.teamA ?? liveMatch?.score?.teamA ?? 0);
      const curPtsB = Number(ls.currentSetScore?.teamB ?? liveMatch?.score?.teamB ?? 0);
      const completedGames = (ls.completedSets as Array<{ set: number; teamA: number; teamB: number; winner: string }>) || [];

      return (
        <div className="space-y-5">
          {/* HUD Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-[#D9A441] text-sm uppercase">
                {emoji} GAME {currentSet}
              </span>
              <span className="text-[#8FA0BC]">· Target: {targetPoints} pts (Win by 2)</span>
            </div>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-blue-400">{teamAInfo.shortName}: {gamesWonA} games</span>
              <span className="text-[#5E6E86]">—</span>
              <span className="text-[#FF4D3D]">{teamBInfo.shortName}: {gamesWonB} games</span>
            </div>
          </div>

          {/* Current Game Score Readout */}
          <div className="flex items-center justify-center gap-6 rounded-xl border border-[#1A2440] bg-[#070D18] py-4">
            <div className="text-center">
              <span className="block text-xs font-black uppercase tracking-wider text-blue-400">{teamAInfo.shortName}</span>
              <span className="text-4xl font-mono font-black text-white tabular-nums">{curPtsA}</span>
            </div>
            <span className="text-2xl font-black text-[#3B4D6B]">:</span>
            <div className="text-center">
              <span className="block text-xs font-black uppercase tracking-wider text-[#FF4D3D]">{teamBInfo.shortName}</span>
              <span className="text-4xl font-mono font-black text-white tabular-nums">{curPtsB}</span>
            </div>
          </div>

          {/* 1-Tap Scoring Pads */}
          <div>
            <PanelLabel hint="single tap scores point">Rally Winner (+ Point)</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad
                tone="blue"
                size="lg"
                onClick={() => handleRacquetPoint('teamA', emoji)}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                + POINT <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad
                tone="coral"
                size="lg"
                onClick={() => handleRacquetPoint('teamB', emoji)}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                + POINT <span className="opacity-70">{teamBInfo.shortName}</span>
              </Pad>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleRacquetRemovePoint('teamA', emoji)}
                disabled={isBusy || curPtsA === 0 || liveMatch?.status === 'completed'}
              >
                − Point {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleRacquetRemovePoint('teamB', emoji)}
                disabled={isBusy || curPtsB === 0 || liveMatch?.status === 'completed'}
              >
                − Point {teamBInfo.shortName}
              </Pad>
            </div>
          </div>

          {/* Game Controls */}
          <div className="grid grid-cols-3 gap-2">
            <Pad
              tone="gold"
              onClick={() => handleRacquetEndGame(emoji)}
              disabled={isBusy || liveMatch?.status === 'completed'}
            >
              🏆 End Game
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
                  description: `Timeout called by ${teamAInfo.shortName}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                })
              }
            >
              ⏱️ TO {teamAInfo.shortName}
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
                  description: `Timeout called by ${teamBInfo.shortName}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                })
              }
            >
              ⏱️ TO {teamBInfo.shortName}
            </Pad>
          </div>

          {/* Completed Games History */}
          {completedGames.length > 0 && (
            <div className="rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#8FA0BC] mb-2">
                Completed Games
              </span>
              <div className="flex flex-wrap gap-2">
                {completedGames.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-[#070D18] border border-[#1A2440] font-mono text-xs text-slate-300"
                  >
                    Game {g.set}: <strong className="text-white">{g.teamA}–{g.teamB}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (s.includes('counter') || s.includes('cs') || s.includes('strike')) {
      const curRound = Number(liveMatch?.liveState?.round || (Number(liveMatch?.score?.teamA || 0) + Number(liveMatch?.score?.teamB || 0) + 1));
      const targetRounds = Number(liveMatch?.liveState?.roundsRequiredToWin || 13);
      const roundsA = Number(liveMatch?.score?.teamA ?? 0);
      const roundsB = Number(liveMatch?.score?.teamB ?? 0);

      return (
        <div className="space-y-5">
          {/* CS Match HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-orange-400 text-sm uppercase">
                🔫 ROUND {curRound} / 24
              </span>
              <span className="text-[#8FA0BC]">· MR12 (Target: {targetRounds} Rounds)</span>
            </div>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-blue-400">{teamAInfo.shortName}: {roundsA}</span>
              <span className="text-[#5E6E86]">—</span>
              <span className="text-amber-400">{teamBInfo.shortName}: {roundsB}</span>
            </div>
          </div>

          {/* Big Rounds Readout */}
          <div className="flex items-center justify-center gap-6 rounded-xl border border-[#1A2440] bg-[#070D18] py-4">
            <div className="text-center">
              <span className="block text-xs font-black uppercase tracking-wider text-blue-400">{teamAInfo.shortName} (CT)</span>
              <span className="text-4xl font-mono font-black text-white tabular-nums">{roundsA}</span>
            </div>
            <span className="text-2xl font-black text-[#3B4D6B]">:</span>
            <div className="text-center">
              <span className="block text-xs font-black uppercase tracking-wider text-amber-400">{teamBInfo.shortName} (T)</span>
              <span className="text-4xl font-mono font-black text-white tabular-nums">{roundsB}</span>
            </div>
          </div>

          {/* 1-Tap Round Wins */}
          <div>
            <PanelLabel hint="single tap awards round win">Round Winner</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad
                tone="blue"
                size="lg"
                onClick={() => handleCSRoundWin('teamA')}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                🔫 + ROUND <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad
                tone="coral"
                size="lg"
                onClick={() => handleCSRoundWin('teamB')}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                🔫 + ROUND <span className="opacity-70">{teamBInfo.shortName}</span>
              </Pad>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleCSRemoveRound('teamA')}
                disabled={isBusy || roundsA === 0 || liveMatch?.status === 'completed'}
              >
                − Round {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleCSRemoveRound('teamB')}
                disabled={isBusy || roundsB === 0 || liveMatch?.status === 'completed'}
              >
                − Round {teamBInfo.shortName}
              </Pad>
            </div>
          </div>

          {/* Side Swap & Tactical Timeouts */}
          <div className="grid grid-cols-3 gap-2">
            <Pad
              tone="gold"
              onClick={handleCSSwapSides}
              disabled={isBusy || liveMatch?.status === 'completed'}
            >
              ⇄ Swap Sides
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
                  description: `Tac Timeout called by ${teamAInfo.shortName}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                })
              }
            >
              ⏱️ TO {teamAInfo.shortName}
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
                  description: `Tac Timeout called by ${teamBInfo.shortName}`,
                  newScore: (liveMatch?.score || {}) as Record<string, unknown>,
                })
              }
            >
              ⏱️ TO {teamBInfo.shortName}
            </Pad>
          </div>
        </div>
      );
    }

    if (s.includes('carrom')) {
      const curBoard = Number(liveMatch?.liveState?.board || 1);
      const targetPoints = Number(liveMatch?.liveState?.targetPoints || 25);
      const scoreA = Number(liveMatch?.score?.teamA ?? 0);
      const scoreB = Number(liveMatch?.score?.teamB ?? 0);

      return (
        <div className="space-y-5">
          {/* Carrom HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-sm uppercase">
                🎯 BOARD {curBoard}
              </span>
              <span className="text-[#8FA0BC]">· First to {targetPoints} points wins</span>
            </div>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-blue-400">{teamAInfo.shortName}: {scoreA} pts</span>
              <span className="text-[#5E6E86]">—</span>
              <span className="text-[#FF4D3D]">{teamBInfo.shortName}: {scoreB} pts</span>
            </div>
          </div>

          {/* Team A Scoring Controls */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-400">{teamAInfo.name} ({scoreA} pts)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Pad tone="blue" size="md" onClick={() => handleCarromScore('teamA', 1)} disabled={isBusy}>
                ⚪ +1 Coin
              </Pad>
              <Pad tone="gold" size="md" onClick={() => handleCarromScore('teamA', 3)} disabled={isBusy}>
                👑 +3 Queen
              </Pad>
              <Pad tone="slate" size="md" onClick={() => handleCarromScore('teamA', -1)} disabled={isBusy || scoreA === 0}>
                ❌ −1 Foul
              </Pad>
            </div>
          </div>

          {/* Team B Scoring Controls */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-rose-400">{teamBInfo.name} ({scoreB} pts)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Pad tone="coral" size="md" onClick={() => handleCarromScore('teamB', 1)} disabled={isBusy}>
                ⚪ +1 Coin
              </Pad>
              <Pad tone="gold" size="md" onClick={() => handleCarromScore('teamB', 3)} disabled={isBusy}>
                👑 +3 Queen
              </Pad>
              <Pad tone="slate" size="md" onClick={() => handleCarromScore('teamB', -1)} disabled={isBusy || scoreB === 0}>
                ❌ −1 Foul
              </Pad>
            </div>
          </div>

          {/* Board Progression */}
          <Pad tone="gold" onClick={handleCarromEndBoard} disabled={isBusy || liveMatch?.status === 'completed'}>
            🎯 Complete Board {curBoard}
          </Pad>
        </div>
      );
    }

    if (s.includes('smash') || s.includes('kart')) {
      const targetPoints = Number(liveMatch?.liveState?.targetPoints ?? liveMatch?.liveState?.targetKills ?? 20);
      const scoreA = Number(liveMatch?.score?.teamA ?? 0);
      const scoreB = Number(liveMatch?.score?.teamB ?? 0);
      const mvp = (liveMatch?.liveState as any)?.mvp;

      return (
        <div className="space-y-5">
          {/* Smash Karts Arena HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-cyan-400 text-sm uppercase">
                🏎️ ARENA BATTLE
              </span>
              <span className="text-[#8FA0BC]">· Target: {targetPoints} Elims to Win</span>
            </div>
            {mvp && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-[11px]">
                ⭐ MVP: {mvp}
              </span>
            )}
          </div>

          {/* Optional Player Attribution */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-blue-400 block mb-1">
                {teamAInfo.shortName} Player (Optional for MVP)
              </label>
              <input
                type="text"
                value={kartPlayerA}
                onChange={(e) => setKartPlayerA(e.target.value)}
                placeholder="Player tag..."
                className="w-full rounded border border-[#1E2A45] bg-[#101A2E] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                {teamBInfo.shortName} Player (Optional for MVP)
              </label>
              <input
                type="text"
                value={kartPlayerB}
                onChange={(e) => setKartPlayerB(e.target.value)}
                placeholder="Player tag..."
                className="w-full rounded border border-[#1E2A45] bg-[#101A2E] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 1-Tap Elimination Scoring */}
          <div>
            <PanelLabel hint="tap to record elimination">Eliminations (+1 Point)</PanelLabel>
            <div className="grid grid-cols-2 gap-3">
              <Pad
                tone="blue"
                size="lg"
                onClick={() => handleSmashKartsPoint('teamA', 1)}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                🏎️ + ELIM <span className="opacity-70">{teamAInfo.shortName}</span>
              </Pad>
              <Pad
                tone="coral"
                size="lg"
                onClick={() => handleSmashKartsPoint('teamB', 1)}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                🏎️ + ELIM <span className="opacity-70">{teamBInfo.shortName}</span>
              </Pad>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleSmashKartsPoint('teamA', -1)}
                disabled={isBusy || scoreA === 0 || liveMatch?.status === 'completed'}
              >
                − Point {teamAInfo.shortName}
              </Pad>
              <Pad
                tone="slate"
                size="sm"
                onClick={() => handleSmashKartsPoint('teamB', -1)}
                disabled={isBusy || scoreB === 0 || liveMatch?.status === 'completed'}
              >
                − Point {teamBInfo.shortName}
              </Pad>
            </div>
          </div>

          {/* Quick Victory Confirmation */}
          <div className="grid grid-cols-2 gap-2">
            <Pad
              tone="gold"
              size="sm"
              onClick={() => handleSmashKartsDeclareWinner('teamA')}
              disabled={isBusy || liveMatch?.status === 'completed'}
            >
              🏆 {teamAInfo.shortName} Wins
            </Pad>
            <Pad
              tone="gold"
              size="sm"
              onClick={() => handleSmashKartsDeclareWinner('teamB')}
              disabled={isBusy || liveMatch?.status === 'completed'}
            >
              🏆 {teamBInfo.shortName} Wins
            </Pad>
          </div>
        </div>
      );
    }

    if (s.includes('chess')) {
      const curMove = Number(liveMatch?.liveState?.move || 1);
      const lastMove = (liveMatch?.liveState as any)?.lastMove;

      return (
        <div className="space-y-5">
          {/* Chess HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2A45] bg-[#101A2E] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-[#D9A441] text-sm uppercase">
                ♔ MOVE {curMove}
              </span>
              {lastMove && <span className="text-[#8FA0BC]">· Last: {lastMove}</span>}
            </div>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-white">White: {teamAInfo.name}</span>
              <span className="text-[#5E6E86]">vs</span>
              <span className="text-slate-400">Black: {teamBInfo.name}</span>
            </div>
          </div>

          {/* Fast Result 1-Tap Adjudication */}
          <div>
            <PanelLabel hint="tap to complete match with official score">Adjudication / Result</PanelLabel>
            <div className="grid grid-cols-3 gap-3">
              <Pad
                size="lg"
                onClick={() => handleChessResult('white_wins')}
                disabled={isBusy || liveMatch?.status === 'completed'}
                style={{ background: '#EEF2F7', color: '#080A0F' }}
              >
                ♔ White wins (1–0)
              </Pad>
              <Pad
                tone="slate"
                size="lg"
                onClick={() => handleChessResult('draw')}
                disabled={isBusy || liveMatch?.status === 'completed'}
              >
                ½ Draw (½–½)
              </Pad>
              <Pad
                size="lg"
                onClick={() => handleChessResult('black_wins')}
                disabled={isBusy || liveMatch?.status === 'completed'}
                style={{ background: '#111827', color: '#EEF2F7', border: '1px solid #374151' }}
              >
                ♚ Black wins (0–1)
              </Pad>
            </div>
          </div>

          {/* Optional Quick Move Tracker */}
          <div className="rounded-xl border border-[#1A2440] bg-[#070D18] p-3 space-y-2">
            <PanelLabel hint="optional move notation tracker">Move Telemetry</PanelLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={chessMoveText}
                onChange={(e) => setChessMoveText(e.target.value)}
                placeholder={`e.g. e4, Nf3, O-O (Move ${curMove})`}
                className="flex-1 rounded border border-[#1E2A45] bg-[#101A2E] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <Pad tone="gold" size="sm" onClick={handleChessMove} disabled={isBusy}>
                ♟ Record Move
              </Pad>
            </div>
          </div>
        </div>
      );
    }

    // Generic points (Hand Tennis, etc.)
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
  const sId = (liveMatch?.sportId || '').toLowerCase();
  const isCricket = sId.includes('cricket');
  const isSetSport = sId.includes('volleyball') || sId.includes('badminton') || sId.includes('table-tennis') || sId.includes('table_tennis');

  const matchLive = (liveMatch?.liveState || {}) as Record<string, any>;

  const primaryScore = isCricket
    ? currentCricket.runs
    : isSetSport && matchLive.currentSetScore?.teamA !== undefined
      ? Number(matchLive.currentSetScore.teamA)
      : Number(liveMatch?.score?.teamA ?? 0);

  const secondaryScore = isCricket
    ? currentCricket.wickets
    : isSetSport && matchLive.currentSetScore?.teamB !== undefined
      ? Number(matchLive.currentSetScore.teamB)
      : Number(liveMatch?.score?.teamB ?? 0);

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
                <Pad tone="blue" size="sm" onClick={handleStartMatch} className="px-3.5 sm:px-4">
                  ▶ Start match
                </Pad>
              )}
              {isMatchLive && !isPaused && (
                <Pad tone="slate" size="sm" onClick={handlePauseMatch} className="px-3.5 sm:px-4">
                  ⏸ Pause
                </Pad>
              )}
              {isMatchLive && isPaused && (
                <Pad tone="blue" size="sm" onClick={handleResumeMatch} className="px-3.5 sm:px-4">
                  ▶ Resume
                </Pad>
              )}
              {isMatchLive && (
                <Pad tone="red" size="sm" onClick={() => setShowConfirm('end')} className="px-3.5 sm:px-4">
                  ⏹ End match
                </Pad>
              )}
            </div>
          </div>
        </header>

        {/* Score Plate / Point Card (Scrollable with page) */}
        <div className="relative overflow-hidden border-b border-[#1A2440] bg-[#0B1220]">
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
                    {currentCricket.overs}.{currentCricket.balls}{matchMaxOvers > 0 ? ` / ${matchMaxOvers}` : ''} OV · RR {runRate}
                  </span>
                )}
                {isSetSport && (
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#D9A441]">
                    {sId.includes('volleyball') ? 'SET' : 'GAME'} {String(matchLive.currentSet || matchLive.game || 1)} · {teamAInfo.shortName} {String(matchLive.gamesWon?.teamA ?? matchLive.setsWon?.teamA ?? 0)}–{String(matchLive.gamesWon?.teamB ?? matchLive.setsWon?.teamB ?? 0)} {teamBInfo.shortName}
                  </span>
                )}
                {(sId.includes('counter') || sId.includes('cs') || sId.includes('strike')) && (
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-orange-400">
                    ROUND {String(matchLive.round || (Number(liveMatch?.score?.teamA || 0) + Number(liveMatch?.score?.teamB || 0) + 1))} / 24 (MR12)
                  </span>
                )}
                {sId.includes('carrom') && (
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-amber-400">
                    BOARD {String(matchLive.board || 1)} · TARGET 25
                  </span>
                )}
                {(sId.includes('smash') || sId.includes('kart')) && (
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-cyan-400">
                    ARENA BATTLE{matchLive.mvp ? ` · ${String(matchLive.mvp)}` : ''}
                  </span>
                )}
                {sId.includes('chess') && (
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-yellow-400">
                    MOVE {String(matchLive.move || 1)}
                  </span>
                )}
              </div>
            </div>

            <TeamPlate team={teamBInfo} side="right" />
          </div>
        </div>

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

      {/* Football Action Dialog */}
      <AnimatePresence>
        {footballModal && (
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
              className="w-full max-w-md border border-[#1E2A45] bg-[#0B1220] p-6 rounded-xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E2A45] pb-3">
                <h3 className="text-base font-black uppercase tracking-[0.14em] text-[#EEF2F7]">
                  {footballModal.type === 'goal' && `⚽ Record Goal · ${footballModal.team === 'teamA' ? teamAInfo.name : teamBInfo.name}`}
                  {footballModal.type === 'yellow_card' && `🟨 Yellow Card · ${footballModal.team === 'teamA' ? teamAInfo.name : teamBInfo.name}`}
                  {footballModal.type === 'red_card' && `🟥 Red Card · ${footballModal.team === 'teamA' ? teamAInfo.name : teamBInfo.name}`}
                  {footballModal.type === 'substitution' && `🔄 Substitution · ${footballModal.team === 'teamA' ? teamAInfo.name : teamBInfo.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setFootballModal(null)}
                  className="text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {footballModal.type === 'goal' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                      Scorer (Optional)
                    </label>
                    {(footballModal.team === 'teamA' ? teamAPlayers : teamBPlayers).length > 0 ? (
                      <select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none"
                      >
                        <option value="">-- Select or type below --</option>
                        {(footballModal.team === 'teamA' ? teamAPlayers : teamBPlayers).map((p) => (
                          <option key={p.id} value={p.name}>
                            #{p.jerseyNumber} {p.name} ({p.position})
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <input
                      type="text"
                      placeholder="Type player name..."
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="mt-1.5 w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none placeholder-[#5E6E86]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                      Assist (Optional)
                    </label>
                    {(footballModal.team === 'teamA' ? teamAPlayers : teamBPlayers).length > 0 ? (
                      <select
                        value={assistPlayer}
                        onChange={(e) => setAssistPlayer(e.target.value)}
                        className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none"
                      >
                        <option value="">-- Select or type below --</option>
                        {(footballModal.team === 'teamA' ? teamAPlayers : teamBPlayers).map((p) => (
                          <option key={p.id} value={p.name}>
                            #{p.jerseyNumber} {p.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <input
                      type="text"
                      placeholder="Type assist player name..."
                      value={assistPlayer}
                      onChange={(e) => setAssistPlayer(e.target.value)}
                      className="mt-1.5 w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none placeholder-[#5E6E86]"
                    />
                  </div>
                </div>
              )}

              {(footballModal.type === 'yellow_card' || footballModal.type === 'red_card') && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                    Carded Player
                  </label>
                  {(footballModal.team === 'teamA' ? teamAPlayers : teamBPlayers).length > 0 ? (
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none"
                    >
                      <option value="">-- Select or type below --</option>
                      {(footballModal.team === 'teamA' ? teamAPlayers : teamBPlayers).map((p) => (
                        <option key={p.id} value={p.name}>
                          #{p.jerseyNumber} {p.name} ({p.position})
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <input
                    type="text"
                    placeholder="Type player name..."
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="mt-1.5 w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none placeholder-[#5E6E86]"
                  />
                </div>
              )}

              {footballModal.type === 'substitution' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                      Player Leaving Pitch (OFF)
                    </label>
                    <input
                      type="text"
                      placeholder="Player OFF name..."
                      value={subPlayerOff}
                      onChange={(e) => setSubPlayerOff(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none placeholder-[#5E6E86]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                      Player Entering Pitch (ON)
                    </label>
                    <input
                      type="text"
                      placeholder="Player ON name..."
                      value={subPlayerOn}
                      onChange={(e) => setSubPlayerOn(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2.5 rounded focus:border-[#4B90FF] outline-none placeholder-[#5E6E86]"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setFootballModal(null)}
                  className="border border-[#1E2A45] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  Cancel
                </button>
                <Pad
                  tone={footballModal.team === 'teamA' ? 'blue' : 'coral'}
                  size="sm"
                  onClick={handleConfirmFootballAction}
                  disabled={isBusy}
                  className="px-5 min-h-[38px]"
                >
                  Confirm Event
                </Pad>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cricket Wicket Modal */}
      <AnimatePresence>
        {cricketWicketModal && (
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
              className="w-full max-w-md border border-[#1E2A45] bg-[#0B1220] p-6 rounded-xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E2A45] pb-3">
                <h3 className="text-base font-black uppercase tracking-[0.14em] text-red-400 flex items-center gap-2">
                  🎯 Record Wicket (#{currentCricket.wickets + 1})
                </h3>
                <button
                  type="button"
                  onClick={() => setCricketWicketModal(false)}
                  className="text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Dismissed Batsman Selection */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1.5">
                    Batsman Dismissed
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWicketOutBatsman('striker')}
                      className={cn(
                        "p-2.5 rounded text-xs font-bold border transition-colors text-left",
                        wicketOutBatsman === 'striker'
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-[#101A2E] border-[#1E2A45] text-slate-300"
                      )}
                    >
                      <span className="text-[10px] block opacity-70">STRIKER *</span>
                      <span className="truncate block">{currentCricket.strikerName || 'Striker'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWicketOutBatsman('nonStriker')}
                      className={cn(
                        "p-2.5 rounded text-xs font-bold border transition-colors text-left",
                        wicketOutBatsman === 'nonStriker'
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-[#101A2E] border-[#1E2A45] text-slate-300"
                      )}
                    >
                      <span className="text-[10px] block opacity-70">NON-STRIKER</span>
                      <span className="truncate block">{currentCricket.nonStrikerName || 'Non-striker'}</span>
                    </button>
                  </div>
                </div>

                {/* Dismissal Mode */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1.5">
                    Dismissal Type
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'caught', label: 'Caught' },
                      { id: 'bowled', label: 'Bowled' },
                      { id: 'lbw', label: 'LBW' },
                      { id: 'run_out', label: 'Run Out' },
                      { id: 'stumped', label: 'Stumped' },
                      { id: 'hit_wicket', label: 'Hit Wicket' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setWicketDismissalType(mode.id as any)}
                        className={cn(
                          "py-2 px-1 text-[11px] font-bold uppercase rounded border transition-colors text-center",
                          wicketDismissalType === mode.id
                            ? "bg-amber-400 text-black border-amber-300 shadow-sm"
                            : "bg-[#101A2E] border-[#1E2A45] text-slate-300 hover:bg-white/5"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fielder Input (for Caught, Run out, Stumped) */}
                {(wicketDismissalType === 'caught' || wicketDismissalType === 'run_out' || wicketDismissalType === 'stumped') && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                      {wicketDismissalType === 'caught' ? 'Catcher / Fielder' : wicketDismissalType === 'stumped' ? 'Wicketkeeper' : 'Fielder (Throw / Run out)'}
                    </label>
                    {bowlingPlayers.length > 0 && (
                      <select
                        value={wicketFielder}
                        onChange={(e) => setWicketFielder(e.target.value)}
                        className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded mb-1 outline-none"
                      >
                        <option value="">-- Select from fielding squad --</option>
                        {bowlingPlayers.map((p) => (
                          <option key={p.id} value={p.name}>#{p.jerseyNumber} {p.name}</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder="Type fielder name..."
                      value={wicketFielder}
                      onChange={(e) => setWicketFielder(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded outline-none placeholder-[#5E6E86]"
                    />
                  </div>
                )}

                {/* Incoming Batsman */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8FA0BC] mb-1">
                    Next Batsman In (Optional)
                  </label>
                  {battingPlayers.length > 0 && (
                    <select
                      value={wicketNextBatsman}
                      onChange={(e) => setWicketNextBatsman(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded mb-1 outline-none"
                    >
                      <option value="">-- Select next batsman --</option>
                      {battingPlayers
                        .filter((p) => p.name !== currentCricket.strikerName && p.name !== currentCricket.nonStrikerName)
                        .map((p) => (
                          <option key={p.id} value={p.name}>#{p.jerseyNumber} {p.name}</option>
                        ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Type incoming batsman name..."
                    value={wicketNextBatsman}
                    onChange={(e) => setWicketNextBatsman(e.target.value)}
                    className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded outline-none placeholder-[#5E6E86]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setCricketWicketModal(false)}
                  className="border border-[#1E2A45] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  Cancel
                </button>
                <Pad
                  tone="red"
                  size="sm"
                  onClick={handleConfirmWicket}
                  disabled={isBusy}
                  className="px-5 min-h-[38px]"
                >
                  Confirm Wicket
                </Pad>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cricket Lineup Modal */}
      <AnimatePresence>
        {lineupModal && (
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
              className="w-full max-w-md border border-[#1E2A45] bg-[#0B1220] p-6 rounded-xl shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E2A45] pb-3">
                <h3 className="text-base font-black uppercase tracking-[0.14em] text-[#EEF2F7]">
                  ✎ Set Crease & Bowling Lineup
                </h3>
                <button
                  type="button"
                  onClick={() => setLineupModal(false)}
                  className="text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                    Striker (Facing Delivery)
                  </label>
                  {battingPlayers.length > 0 && (
                    <select
                      value={lineupStriker}
                      onChange={(e) => setLineupStriker(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded mb-1 outline-none"
                    >
                      <option value="">-- Select Striker --</option>
                      {battingPlayers.map((p) => (
                        <option key={p.id} value={p.name}>#{p.jerseyNumber} {p.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Striker name..."
                    value={lineupStriker}
                    onChange={(e) => setLineupStriker(e.target.value)}
                    className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded outline-none placeholder-[#5E6E86]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Non-Striker (Runner's End)
                  </label>
                  {battingPlayers.length > 0 && (
                    <select
                      value={lineupNonStriker}
                      onChange={(e) => setLineupNonStriker(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded mb-1 outline-none"
                    >
                      <option value="">-- Select Non-Striker --</option>
                      {battingPlayers.map((p) => (
                        <option key={p.id} value={p.name}>#{p.jerseyNumber} {p.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Non-striker name..."
                    value={lineupNonStriker}
                    onChange={(e) => setLineupNonStriker(e.target.value)}
                    className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded outline-none placeholder-[#5E6E86]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                    Current Bowler
                  </label>
                  {bowlingPlayers.length > 0 && (
                    <select
                      value={lineupBowler}
                      onChange={(e) => setLineupBowler(e.target.value)}
                      className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded mb-1 outline-none"
                    >
                      <option value="">-- Select Bowler --</option>
                      {bowlingPlayers.map((p) => (
                        <option key={p.id} value={p.name}>#{p.jerseyNumber} {p.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Bowler name..."
                    value={lineupBowler}
                    onChange={(e) => setLineupBowler(e.target.value)}
                    className="w-full bg-[#101A2E] border border-[#1E2A45] text-[#EEF2F7] text-xs p-2 rounded outline-none placeholder-[#5E6E86]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#1E2A45]">
                <button
                  type="button"
                  onClick={() => setLineupModal(false)}
                  className="border border-[#1E2A45] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8FA0BC] hover:text-[#EEF2F7]"
                >
                  Cancel
                </button>
                <Pad
                  tone="blue"
                  size="sm"
                  onClick={handleSaveLineup}
                  disabled={isBusy}
                  className="px-5 min-h-[38px]"
                >
                  Save Lineup
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-tight sm:h-13 sm:w-13 sm:text-sm overflow-hidden border border-white/20"
        style={{
          background:
            side === 'left'
              ? 'linear-gradient(140deg, #2563EB, #1D4ED8)'
              : 'linear-gradient(140deg, #E11D48, #BE123C)',
        }}
      >
        {logo ? (
          <img src={logo} alt={team.name} className="w-full h-full object-cover" />
        ) : (
          team.shortName
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs sm:text-sm md:text-base font-bold uppercase tracking-wide text-[#EEF2F7]">
          {team.name}
        </span>
        <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          {side === 'left' ? 'Home' : 'Away'}
        </span>
      </span>
    </div>
  );
};

export default ScoringConsole;
