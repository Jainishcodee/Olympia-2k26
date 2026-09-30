import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SEED_MATCHES, SEED_SPORTS } from '@/data/seedData';
import { getTeamLogo } from '@/utils/teamLogos';
import toast from 'react-hot-toast';

import { RollingScore, RollingLabel } from '@/components/scoring/RollingScore';
import {
  CountdownOverlay,
  FinalOverlay,
  ScoreFXLayer,
  useScoreFX,
  type FXKind,
} from '@/components/scoring/ScoreFX';
import { StandingsTicker, type ScorerRow } from '@/components/scoring/StandingsTicker';

/* ============================================================================
 *  Types
 * ==========================================================================*/

interface MatchEvent {
  id: string;
  time: string;
  type: string;
  team: string;
  desc: string;
  undone?: boolean;
  /** Accent used by the timeline row */
  tone?: 'goal' | 'six' | 'four' | 'wicket' | 'point' | 'set' | 'card' | 'neutral';
  /** Reverses the score / leaderboard side-effect when the event is undone */
  revert?: () => void;
}

interface MatchState {
  id: string;
  sportId: string;
  sportName: string;
  teamA: { id: string; name: string; shortName: string };
  teamB: { id: string; name: string; shortName: string };
  score: Record<string, number | string | object>;
  status: string;
  elapsedTime: string;
}

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

/* ============================================================================
 *  Pad — the tactile scoring button
 * ==========================================================================*/

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
 *  Console
 * ==========================================================================*/

const ScoringConsole: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { fx, fire, clear } = useScoreFX();

  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  const seedMatch = SEED_MATCHES.find((m) => m.id === matchId);
  const sport = SEED_SPORTS.find((s) => s.id === seedMatch?.sportId);

  const [match, setMatch] = useState<MatchState>(() => {
    if (seedMatch) {
      return {
        id: seedMatch.id,
        sportId: seedMatch.sportId,
        sportName: sport?.name || seedMatch.sportId,
        teamA: {
          id: seedMatch.participantA.id,
          name: seedMatch.participantA.name,
          shortName: seedMatch.participantA.name.substring(0, 3).toUpperCase(),
        },
        teamB: {
          id: seedMatch.participantB.id,
          name: seedMatch.participantB.name,
          shortName: seedMatch.participantB.name.substring(0, 3).toUpperCase(),
        },
        score: seedMatch.score as Record<string, number | string | object>,
        // The console owns the lifecycle: every visit starts pre-match so the
        // countdown → LIVE transition is always reachable.
        status: 'scheduled',
        elapsedTime: '00:00',
      };
    }
    return {
      id: matchId || '0',
      sportId: 'football',
      sportName: 'Football',
      teamA: { id: 't1', name: 'Team A', shortName: 'TEA' },
      teamB: { id: 't2', name: 'Team B', shortName: 'TEB' },
      score: { teamA: 0, teamB: 0 },
      status: 'scheduled',
      elapsedTime: '00:00',
    };
  });

  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  /* ---------------------------------------------------------------- clock */

  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (match.status !== 'live' || isPaused) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [match.status, isPaused]);

  useEffect(() => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    setMatch((prev) => ({ ...prev, elapsedTime: `${mins}:${secs}` }));
  }, [seconds]);

  /* ------------------------------------------------------- score plumbing */

  const getScore = (key: string): number => {
    const val = (match.score as Record<string, unknown>)[key];
    return typeof val === 'number' ? val : 0;
  };

  const bumpScore = useCallback((key: 'teamA' | 'teamB', delta: number) => {
    setMatch((prev) => {
      const current = Number((prev.score as Record<string, unknown>)[key] ?? 0);
      return { ...prev, score: { ...prev.score, [key]: Math.max(0, current + delta) } };
    });
  }, []);

  /* --------------------------------------------------- leaderboard credit */

  const seedScorers = useCallback(
    (): ScorerRow[] => [
      { id: 'p1', name: 'A. Vega', teamShort: match.teamA.shortName, teamKey: 'teamA', value: 3 },
      { id: 'p2', name: 'R. Okoye', teamShort: match.teamA.shortName, teamKey: 'teamA', value: 2 },
      { id: 'p3', name: 'M. Silva', teamShort: match.teamB.shortName, teamKey: 'teamB', value: 2 },
      { id: 'p4', name: 'K. Ito', teamShort: match.teamB.shortName, teamKey: 'teamB', value: 1 },
      { id: 'p5', name: 'D. Novak', teamShort: match.teamA.shortName, teamKey: 'teamA', value: 1 },
      { id: 'p6', name: 'S. Haddad', teamShort: match.teamB.shortName, teamKey: 'teamB', value: 0 },
    ],
    [match.teamA.shortName, match.teamB.shortName],
  );

  const [scorers, setScorers] = useState<ScorerRow[]>(seedScorers);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ teamA: 0, teamB: 0 });

  /** Credits the next player on that side; the ticker re-sorts and the row travels. */
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

  /* ------------------------------------------------------------- timeline */

  const addEvent = (
    type: string,
    team: string,
    desc: string = '',
    opts: { tone?: MatchEvent['tone']; revert?: () => void } = {},
  ) => {
    const event: MatchEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: match.elapsedTime,
      type,
      team,
      desc: desc || type,
      tone: opts.tone,
      revert: opts.revert,
    };
    setEvents((prev) => [event, ...prev]);
    toast.success(`${type} recorded`, { duration: 1200 });
  };

  const handleUndo = () => {
    const last = events[0];
    if (!last) {
      toast.error('No events to undo');
      return;
    }
    if (last.undone) {
      toast.error('Last event was already undone');
      return;
    }
    setEvents((prev) => prev.map((e, i) => (i === 0 ? { ...e, undone: true } : e)));
    last.revert?.();
    toast(`Undone: ${last.type}`, { icon: '↩️', duration: 1400 });
  };

  /* ------------------------------------------------------- match lifecycle */

  const beginPlay = () => {
    setMatch((prev) => ({ ...prev, status: 'live' }));
    setIsPaused(false);
    setCountdown(false);
    addEvent('Match Start', '', 'The match is under way', { tone: 'neutral' });
    fire({
      kind: 'neutral',
      title: 'KICK OFF',
      sub: `${match.teamA.shortName} vs ${match.teamB.shortName}`,
      accent: '#D9A441',
    });
  };

  const handleStartMatch = () => {
    clear();
    setSeconds(0);
    setCountdown(true);
  };

  const handlePauseMatch = () => {
    setIsPaused(true);
    addEvent('Pause', '', 'Match paused', { tone: 'neutral' });
    toast('Match paused', { icon: '⏸️' });
  };

  const handleResumeMatch = () => {
    setIsPaused(false);
    addEvent('Resume', '', 'Match resumed', { tone: 'neutral' });
    toast.success('Match resumed');
  };

  const handleEndMatch = () => {
    setMatch((prev) => ({ ...prev, status: 'completed' }));
    setIsPaused(true);
    setShowConfirm(null);
    addEvent('Match End', '', 'Full time', { tone: 'neutral' });
    setShowFinal(true);
  };

  /* ======================================================= SCORING ACTIONS */

  const goal = (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? match.teamA : match.teamB;
    bumpScore(team, +1);
    const credited = creditTeam(team);
    const line = `${getScore('teamA') + (team === 'teamA' ? 1 : 0)} – ${
      getScore('teamB') + (team === 'teamB' ? 1 : 0)
    }`;
    fire({ kind: 'goal', title: 'GOAL', sub: side.name, score: line, team });
    addEvent('Goal', side.name, `⚽ Goal for ${side.shortName}`, {
      tone: 'goal',
      revert: () => {
        bumpScore(team, -1);
        debitPlayer(credited);
      },
    });
  };

  const removeGoal = (team: 'teamA' | 'teamB') => {
    const side = team === 'teamA' ? match.teamA : match.teamB;
    bumpScore(team, -1);
    fire({ kind: 'neutral', title: 'GOAL RULLED OUT', sub: side.name, team });
    addEvent('Goal Removed', side.name, `Score adjusted for ${side.shortName}`, {
      tone: 'neutral',
      revert: () => bumpScore(team, +1),
    });
  };

  /* ---------------------------------------------------------- cricket */

  const [cricketState, setCricketState] = useState({
    runs: 184,
    wickets: 4,
    overs: 32,
    balls: 4,
    extras: 0,
    innings: 1,
  });

  const advanceBall = (illegal: boolean) => (prev: typeof cricketState) => {
    if (illegal) return { ...prev, extras: prev.extras + 1 };
    const nextBalls = prev.balls + 1;
    const over = nextBalls >= 6 ? prev.overs + 1 : prev.overs;
    return { ...prev, balls: nextBalls >= 6 ? 0 : nextBalls, overs: over };
  };

  const rewindBall = (prev: typeof cricketState) => {
    let balls = prev.balls - 1;
    let overs = prev.overs;
    if (balls < 0) {
      balls = 5;
      overs = Math.max(0, overs - 1);
    }
    return { ...prev, balls, overs };
  };

  const addCricketRuns = (runs: number, type: string) => {
    const illegal = type === 'wide' || type === 'no_ball';
    const isBoundary = runs === 6 || runs === 4;
    setCricketState((prev) => {
      const withRuns = { ...prev, runs: prev.runs + runs };
      return { ...advanceBall(illegal)(withRuns) };
    });

    const side = match.teamA;
    const isSix = runs === 6;
    const kind: FXKind = isSix ? 'six' : runs === 4 ? 'four' : 'point';
    const title = isSix ? '6' : runs === 4 ? 'FOUR' : runs === 0 ? 'DOT' : `+${runs}`;
    const kicker = isSix ? 'SIX' : runs === 4 ? 'FOUR' : undefined;

    fire({
      kind,
      title,
      kicker,
      bugLabel: isSix ? 'SIX' : runs === 4 ? 'FOUR' : runs === 0 ? 'DOT BALL' : `+${runs}`,
      sub: `${type.replace(/_/g, ' ').toUpperCase()} · ${side.shortName}`,
      score: `${cricketState.runs + runs}/${cricketState.wickets}`,
      team: 'teamA',
      accent: isSix ? '#FFD21F' : runs === 4 ? '#1264FF' : undefined,
    });

    addEvent(title, side.name, isBoundary ? `🏏 ${title}!` : `🏏 +${runs}`, {
      tone: runs === 6 ? 'six' : runs === 4 ? 'four' : 'point',
      revert: () =>
        setCricketState((prev) => {
          const stepped = rewindBall(prev);
          return { ...stepped, runs: Math.max(0, stepped.runs - runs) };
        }),
    });
  };

  const addWicket = () => {
    setCricketState((prev) => {
      const stepped = advanceBall(false)(prev);
      return { ...stepped, wickets: stepped.wickets + 1 };
    });
    fire({
      kind: 'wicket',
      title: 'OUT',
      sub: `WICKET · ${match.teamA.shortName}`,
      score: `${cricketState.runs}/${cricketState.wickets + 1}`,
      team: 'teamA',
    });
    addEvent('Wicket', match.teamA.name, '🏏 OUT!', {
      tone: 'wicket',
      revert: () =>
        setCricketState((prev) => {
          const stepped = rewindBall(prev);
          return { ...stepped, wickets: Math.max(0, stepped.wickets - 1) };
        }),
    });
  };

  /* ------------------------------------------------------------- sets */

  const [setsState, setSetsState] = useState({
    sets: [{ teamA: 0, teamB: 0 }],
    currentSet: 0,
    teamASets: 0,
    teamBSets: 0,
  });

  const addPoint = (team: 'teamA' | 'teamB') => {
    setSetsState((prev) => {
      const newSets = [...prev.sets];
      newSets[prev.currentSet] = {
        ...newSets[prev.currentSet],
        [team]: newSets[prev.currentSet][team] + 1,
      };
      return { ...prev, sets: newSets };
    });
    const side = team === 'teamA' ? match.teamA : match.teamB;
    const credited = creditTeam(team);
    fire({ kind: 'point', title: 'POINT', sub: side.name, team });
    addEvent('Point', side.name, `${side.shortName} scores`, {
      tone: 'point',
      revert: () => {
        setSetsState((prev) => {
          const newSets = [...prev.sets];
          newSets[prev.currentSet] = {
            ...newSets[prev.currentSet],
            [team]: Math.max(0, newSets[prev.currentSet][team] - 1),
          };
          return { ...prev, sets: newSets };
        });
        debitPlayer(credited);
      },
    });
  };

  const endSet = () => {
    const current = setsState.sets[setsState.currentSet];
    const winner = current.teamA > current.teamB ? 'teamA' : 'teamB';
    setSetsState((prev) => ({
      ...prev,
      teamASets: winner === 'teamA' ? prev.teamASets + 1 : prev.teamASets,
      teamBSets: winner === 'teamB' ? prev.teamBSets + 1 : prev.teamBSets,
      sets: [...prev.sets, { teamA: 0, teamB: 0 }],
      currentSet: prev.currentSet + 1,
    }));
    const side = winner === 'teamA' ? match.teamA : match.teamB;
    fire({ kind: 'set', title: 'SET WON', sub: side.name, team: winner });
    addEvent('Set Won', side.name, `${side.shortName} takes the set`, { tone: 'set' });
  };

  /* -------------------------------------------------------------- chess */

  const chessResult = (result: 'white_wins' | 'draw' | 'black_wins') => {
    const map = {
      white_wins: { label: 'WHITE WINS', side: match.teamA, team: 'teamA' as const, desc: '1 – 0' },
      draw: { label: 'DRAW', side: match.teamA, team: undefined, desc: '½ – ½' },
      black_wins: { label: 'BLACK WINS', side: match.teamB, team: 'teamB' as const, desc: '0 – 1' },
    } as const;
    const entry = map[result];
    setMatch((prev) => ({ ...prev, score: { ...prev.score, result } }));
    fire({ kind: 'neutral', title: entry.label, sub: entry.desc, accent: '#FFD21F', team: entry.team });
    addEvent(entry.label, entry.team ? entry.side.name : '', entry.desc, { tone: 'neutral' });
  };

  /* ------------------------------------------------------ counter-strike */

  const [csState, setCsState] = useState({
    teamARounds: 0,
    teamBRounds: 0,
    mapName: 'Dust II',
    maps: [] as { name: string; teamA: number; teamB: number }[],
  });

  const addRound = (team: 'teamA' | 'teamB') => {
    setCsState((prev) => ({
      ...prev,
      teamARounds: team === 'teamA' ? prev.teamARounds + 1 : prev.teamARounds,
      teamBRounds: team === 'teamB' ? prev.teamBRounds + 1 : prev.teamBRounds,
    }));
    const side = team === 'teamA' ? match.teamA : match.teamB;
    const credited = creditTeam(team);
    fire({ kind: 'round', title: 'ROUND', sub: side.name, team });
    addEvent('Round Won', side.name, `${side.shortName} take the round`, {
      tone: 'point',
      revert: () => {
        setCsState((prev) => ({
          ...prev,
          teamARounds: team === 'teamA' ? Math.max(0, prev.teamARounds - 1) : prev.teamARounds,
          teamBRounds: team === 'teamB' ? Math.max(0, prev.teamBRounds - 1) : prev.teamBRounds,
        }));
        debitPlayer(credited);
      },
    });
  };

  /* ============================================================ PANELS === */

  const renderFootballButtons = () => (
    <div className="space-y-5">
      <div>
        <PanelLabel hint="tap to score">Goals</PanelLabel>
        <div className="grid grid-cols-2 gap-3">
          <Pad tone="blue" size="lg" onClick={() => goal('teamA')}>
            + GOAL <span className="opacity-70">{match.teamA.shortName}</span>
          </Pad>
          <Pad tone="coral" size="lg" onClick={() => goal('teamB')}>
            + GOAL <span className="opacity-70">{match.teamB.shortName}</span>
          </Pad>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Pad tone="slate" size="sm" onClick={() => removeGoal('teamA')}>
            − GOAL {match.teamA.shortName}
          </Pad>
          <Pad tone="slate" size="sm" onClick={() => removeGoal('teamB')}>
            − GOAL {match.teamB.shortName}
          </Pad>
        </div>
      </div>

      <div>
        <PanelLabel>Cards</PanelLabel>
        <div className="grid grid-cols-4 gap-2">
          <Pad tone="yellow" size="sm" onClick={() => addEvent('Yellow Card', match.teamA.name, `🟨 ${match.teamA.shortName}`, { tone: 'card', revert: () => {} })}>
            🟨 {match.teamA.shortName}
          </Pad>
          <Pad tone="yellow" size="sm" onClick={() => addEvent('Yellow Card', match.teamB.name, `🟨 ${match.teamB.shortName}`, { tone: 'card', revert: () => {} })}>
            🟨 {match.teamB.shortName}
          </Pad>
          <Pad tone="red" size="sm" onClick={() => addEvent('Red Card', match.teamA.name, `🟥 ${match.teamA.shortName}`, { tone: 'card', revert: () => {} })}>
            🟥 {match.teamA.shortName}
          </Pad>
          <Pad tone="red" size="sm" onClick={() => addEvent('Red Card', match.teamB.name, `🟥 ${match.teamB.shortName}`, { tone: 'card', revert: () => {} })}>
            🟥 {match.teamB.shortName}
          </Pad>
        </div>
      </div>

      <div>
        <PanelLabel>Match events</PanelLabel>
        <div className="grid grid-cols-3 gap-2">
          <Pad size="sm" onClick={() => addEvent('Substitution', '', '🔄 Substitution', { tone: 'neutral', revert: () => {} })}>
            Substitution
          </Pad>
          <Pad size="sm" onClick={() => addEvent('Corner', match.teamA.name, match.teamA.shortName, { tone: 'neutral', revert: () => {} })}>
            Corner {match.teamA.shortName}
          </Pad>
          <Pad size="sm" onClick={() => addEvent('Corner', match.teamB.name, match.teamB.shortName, { tone: 'neutral', revert: () => {} })}>
            Corner {match.teamB.shortName}
          </Pad>
          <Pad size="sm" onClick={() => addEvent('Shot', match.teamA.name, match.teamA.shortName, { tone: 'neutral', revert: () => {} })}>
            Shot {match.teamA.shortName}
          </Pad>
          <Pad size="sm" onClick={() => addEvent('Shot', match.teamB.name, match.teamB.shortName, { tone: 'neutral', revert: () => {} })}>
            Shot {match.teamB.shortName}
          </Pad>
          <Pad tone="red" size="sm" onClick={() => addEvent('Foul', '', '⚠️ Foul', { tone: 'card', revert: () => {} })}>
            Foul
          </Pad>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Pad tone="slate" size="sm" onClick={() => addEvent('Half Time', '', 'End of first half', { tone: 'neutral', revert: () => {} })}>
            Half time
          </Pad>
          <Pad tone="blue" size="sm" onClick={() => addEvent('Full Time', '', 'End of match', { tone: 'neutral', revert: () => {} })}>
            Full time
          </Pad>
        </div>
      </div>
    </div>
  );

  const renderCricketButtons = () => (
    <div className="space-y-5">
      <div>
        <PanelLabel hint="delivery by delivery">Runs</PanelLabel>
        <div className="grid grid-cols-6 gap-2">
          <Pad size="md" onClick={() => addCricketRuns(0, 'dot')}>Dot</Pad>
          <Pad tone="blue" size="md" onClick={() => addCricketRuns(1, 'single')}>+1</Pad>
          <Pad tone="blue" size="md" onClick={() => addCricketRuns(2, 'double')}>+2</Pad>
          <Pad tone="blue" size="md" onClick={() => addCricketRuns(3, 'triple')}>+3</Pad>
          <Pad tone="green" size="md" onClick={() => addCricketRuns(4, 'four')}>Four</Pad>
          <Pad tone="violet" size="md" onClick={() => addCricketRuns(6, 'six')}>Six</Pad>
        </div>
      </div>

      <div>
        <PanelLabel hint="wicket + extras">Dismissals</PanelLabel>
        <div className="grid grid-cols-5 gap-2">
          <Pad tone="red" size="md" onClick={addWicket}>Wicket</Pad>
          <Pad tone="yellow" size="sm" onClick={() => addCricketRuns(1, 'wide')}>Wide</Pad>
          <Pad tone="yellow" size="sm" onClick={() => addCricketRuns(1, 'no_ball')}>No ball</Pad>
          <Pad size="sm" onClick={() => addCricketRuns(1, 'bye')}>Bye</Pad>
          <Pad size="sm" onClick={() => addCricketRuns(1, 'leg_bye')}>Leg bye</Pad>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Pad
          tone="violet"
          onClick={() => {
            setCricketState((prev) => ({
              ...prev,
              innings: prev.innings + 1,
              runs: 0,
              wickets: 0,
              overs: 0,
              balls: 0,
            }));
            fire({ kind: 'neutral', title: 'NEW INNINGS', accent: '#1264FF' });
            addEvent('New Innings', '', `Innings ${cricketState.innings + 1}`, { tone: 'neutral' });
          }}
        >
          New innings
        </Pad>
        <Pad onClick={() => addEvent('End of Over', '', `Over ${cricketState.overs}`, { tone: 'neutral' })}>
          End over
        </Pad>
      </div>
    </div>
  );

  const setPanel = (label: string) => (
    <div className="space-y-5">
      <div>
        <PanelLabel hint={`Sets ${setsState.teamASets} – ${setsState.teamBSets}`}>{label}</PanelLabel>
        <div className="grid grid-cols-2 gap-3">
          <Pad tone="blue" size="lg" onClick={() => addPoint('teamA')}>
            + Point <span className="opacity-70">{match.teamA.shortName}</span>
          </Pad>
          <Pad tone="coral" size="lg" onClick={() => addPoint('teamB')}>
            + Point <span className="opacity-70">{match.teamB.shortName}</span>
          </Pad>
        </div>
        {setsState.sets.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4C5B75]">
            {setsState.sets.slice(0, -1).map((s, i) => (
              <span key={i}>
                Set {i + 1}: {s.teamA}–{s.teamB}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Pad tone="gold" onClick={endSet}>End set</Pad>
        <Pad tone="yellow" size="sm" onClick={() => addEvent('Timeout', match.teamA.name, match.teamA.shortName, { tone: 'neutral' })}>
          TO {match.teamA.shortName}
        </Pad>
        <Pad tone="yellow" size="sm" onClick={() => addEvent('Timeout', match.teamB.name, match.teamB.shortName, { tone: 'neutral' })}>
          TO {match.teamB.shortName}
        </Pad>
      </div>
    </div>
  );

  const renderChessButtons = () => (
    <div className="space-y-5">
      <div>
        <PanelLabel hint="select the result">Result</PanelLabel>
        <div className="grid grid-cols-3 gap-3">
          <Pad
            size="lg"
            onClick={() => chessResult('white_wins')}
            style={{ background: '#EEF2F7', color: '#080A0F', borderColor: '#FFFFFF' }}
          >
            ♔ White wins
          </Pad>
          <Pad tone="slate" size="lg" onClick={() => chessResult('draw')}>Draw ½–½</Pad>
          <Pad
            size="lg"
            onClick={() => chessResult('black_wins')}
            style={{ background: '#111827', color: '#EEF2F7', borderColor: '#374151' }}
          >
            ♚ Black wins
          </Pad>
        </div>
      </div>
    </div>
  );

  const renderCounterStrikeButtons = () => (
    <div className="space-y-5">
      <div>
        <PanelLabel hint={`Map · ${csState.mapName}`}>Rounds</PanelLabel>
        <div className="grid grid-cols-2 gap-3">
          <Pad tone="blue" size="lg" onClick={() => addRound('teamA')}>
            + Round <span className="opacity-70">{match.teamA.shortName}</span>
          </Pad>
          <Pad tone="coral" size="lg" onClick={() => addRound('teamB')}>
            + Round <span className="opacity-70">{match.teamB.shortName}</span>
          </Pad>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <Pad
            tone="violet"
            onClick={() => {
              setCsState((p) => ({
                ...p,
                maps: [...p.maps, { name: p.mapName, teamA: p.teamARounds, teamB: p.teamBRounds }],
                teamARounds: 0,
                teamBRounds: 0,
              }));
              fire({ kind: 'neutral', title: 'MAP OVER', accent: '#6D28D9' });
              addEvent('Map Ended', '', csState.mapName, { tone: 'neutral' });
            }}
          >
            End map
          </Pad>
          <input
            value={csState.mapName}
            onChange={(e) => setCsState((p) => ({ ...p, mapName: e.target.value }))}
            className="h-full rounded-lg border border-[#1E2A45] bg-[#101A2E] px-4 text-center text-[13px] font-bold text-[#EEF2F7] outline-none focus:border-[#1264FF]"
            placeholder="Map name"
          />
        </div>
      </div>
    </div>
  );

  /** Carrom / Smash Karts — plain score buttons that still get full feedback. */
  const simplePoint = (team: 'teamA' | 'teamB') => {
    bumpScore(team, +1);
    const side = team === 'teamA' ? match.teamA : match.teamB;
    const credited = creditTeam(team);
    fire({ kind: 'point', title: 'POINT', sub: side.name, team });
    addEvent('Points', side.name, `${side.shortName} scores`, {
      tone: 'point',
      revert: () => {
        bumpScore(team, -1);
        debitPlayer(credited);
      },
    });
  };

  const pointPanel = (title: string, blurb: string) => (
    <div className="space-y-5">
      <div>
        <PanelLabel hint={blurb}>{title}</PanelLabel>
        <div className="grid grid-cols-2 gap-3">
          <Pad tone="blue" size="lg" onClick={() => simplePoint('teamA')}>
            + Point <span className="opacity-70">{match.teamA.shortName}</span>
          </Pad>
          <Pad tone="coral" size="lg" onClick={() => simplePoint('teamB')}>
            + Point <span className="opacity-70">{match.teamB.shortName}</span>
          </Pad>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Pad size="sm" onClick={() => bumpScore('teamA', -1)}>− Point {match.teamA.shortName}</Pad>
          <Pad size="sm" onClick={() => bumpScore('teamB', -1)}>− Point {match.teamB.shortName}</Pad>
        </div>
      </div>
    </div>
  );

  const renderScoringPanel = () => {
    switch (match.sportId) {
      case 'football':
        return renderFootballButtons();
      case 'cricket':
        return renderCricketButtons();
      case 'volleyball':
        return setPanel('Volleyball');
      case 'badminton':
        return setPanel('Badminton');
      case 'table-tennis':
        return setPanel('Table tennis');
      case 'hand-tennis':
        return setPanel('Hand tennis');
      case 'chess':
        return renderChessButtons();
      case 'counter-strike':
        return renderCounterStrikeButtons();
      case 'carrom':
        return pointPanel('Carrom', 'points');
      case 'smash-karts':
        return pointPanel('Smash Karts', 'kills');
      default:
        return <p className="p-4 text-[13px] text-[#5E6E86]">No scoring panel configured for this sport.</p>;
    }
  };

  /* ============================================================ RENDER === */

  const isLive = match.status === 'live' && !isPaused;
  const primaryScore = match.sportId === 'cricket' ? cricketState.runs : getScore('teamA');
  const secondaryScore = match.sportId === 'cricket' ? cricketState.wickets : getScore('teamB');

  const statusLabel = isPaused
    ? 'PAUSED'
    : match.status === 'live'
      ? 'LIVE'
      : match.status === 'completed'
        ? 'FINAL'
        : 'SCHEDULED';

  const runRate =
    cricketState.overs + cricketState.balls / 6 > 0
      ? (cricketState.runs / (cricketState.overs + cricketState.balls / 6)).toFixed(2)
      : '0.00';

  return (
    <>
      {/* ---- full-screen feedback layers (outside the shaking root) -------- */}
      <ScoreFXLayer event={fx} />

      <AnimatePresence>
        {countdown && (
          <CountdownOverlay
            key="countdown"
            onDone={beginPlay}
            teamA={match.teamA.shortName}
            teamB={match.teamB.shortName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinal && (
          <FinalOverlay
            key="final"
            teamA={match.teamA.name}
            teamB={match.teamB.name}
            scoreA={match.sportId === 'cricket' ? `${primaryScore}/${secondaryScore}` : primaryScore}
            scoreB={match.sportId === 'cricket' ? `${cricketState.overs}.${cricketState.balls} ov` : secondaryScore}
            subtitle={`${match.sportName} · ${match.elapsedTime}`}
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
        {/* ------------------------------------------------ broadcast bug */}
        <header className="sticky top-0 z-30 border-b border-[#1A2440] bg-[#070B14]/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => navigate('/admin/live')}
              className="text-[11px] font-black uppercase tracking-[0.24em] text-[#5E6E86] transition-colors hover:text-[#D9A441]"
            >
              ← Back
            </button>

            <span className="border border-[#1E2A45] bg-[#101A2E] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#8FA0BC]">
              {match.sportName}
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

            <button
              type="button"
              onClick={() => window.open('/admin/scoring-simulator', '_blank')}
              className="border border-[#D9A441]/40 bg-[#D9A441]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#D9A441] transition-colors hover:bg-[#D9A441]/20"
              title="Test & verify Net Run Rate (NRR) and Net Score formula math in the Admin Sandbox"
            >
              NRR sandbox →
            </button>

            <div className="ml-auto flex flex-wrap gap-2">
              {match.status === 'scheduled' && (
                <Pad tone="green" size="sm" onClick={handleStartMatch} className="px-4">
                  ▶ Start match
                </Pad>
              )}
              {match.status === 'live' && !isPaused && (
                <Pad tone="yellow" size="sm" onClick={handlePauseMatch} className="px-4">
                  ⏸ Pause
                </Pad>
              )}
              {match.status === 'live' && isPaused && (
                <Pad tone="green" size="sm" onClick={handleResumeMatch} className="px-4">
                  ▶ Resume
                </Pad>
              )}
              {match.status === 'live' && (
                <Pad tone="red" size="sm" onClick={() => setShowConfirm('end')} className="px-4">
                  ⏹ End match
                </Pad>
              )}
            </div>
          </div>

          {/* score plate */}
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
              <TeamPlate team={match.teamA} side="left" />

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 text-[clamp(2.2rem,6vw,4.2rem)] font-black leading-none tracking-tight">
                  {match.sportId === 'cricket' ? (
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
                  <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 font-mono text-[15px] font-bold tabular-nums text-[#8FA0BC]">
                    {match.elapsedTime}
                  </span>
                  {match.sportId === 'cricket' && (
                    <span className="border border-[#1E2A45] bg-[#101A2E] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#8FA0BC]">
                      {cricketState.overs}.{cricketState.balls} OV · RR {runRate}
                    </span>
                  )}
                </div>
              </div>

              <TeamPlate team={match.teamB} side="right" />
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------ workspace */}
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-6">
          {/* scoring controls */}
          <section className="min-w-0 border border-[#1A2440] bg-[#0B1220] p-5">
            <div className="mb-5 flex items-baseline justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.34em] text-[#EEF2F7]">
                Scoring console
              </h3>
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#4C5B75]">
                {match.sportName}
              </span>
            </div>

            <div className="flex-1">{renderScoringPanel()}</div>

            <div className="mt-7 border-t border-[#1A2440] pt-4">
              <Pad
                onClick={handleUndo}
                disabled={events.length === 0 || events[0]?.undone}
                style={{
                  background: '#1A0F14',
                  color: '#FF8478',
                  borderColor: 'rgba(255,77,61,0.6)',
                }}
                className="w-full"
              >
                ↩ Undo last action
              </Pad>
            </div>
          </section>

          {/* timeline + leaderboard */}
          <aside className="flex min-w-0 flex-col gap-4">
            <div className="flex min-h-[320px] flex-col border border-[#1A2440] bg-[#0B1220]">
              <div className="flex items-center justify-between border-b border-[#1A2440] px-4 py-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D9A441]">
                  Match timeline
                </h3>
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#5E6E86]">
                  {events.filter((e) => !e.undone).length} events
                </span>
              </div>

              <div className="max-h-[46vh] flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                <AnimatePresence initial={false}>
                  {events.length === 0 && (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-10 text-center text-[11px] font-black uppercase tracking-[0.26em] text-[#3B4763]"
                    >
                      Awaiting first event
                    </motion.p>
                  )}
                  {events.map((ev) => (
                    <motion.article
                      key={ev.id}
                      layout
                      initial={{ opacity: 0, y: -26, scaleY: 0.7 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      style={{ originY: 0 }}
                      className={cn(
                        'relative overflow-hidden border-l-[3px] bg-[#101A2E] px-3 py-2.5',
                        ev.undone && 'opacity-40',
                      )}
                      data-tone={ev.tone}
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-[3px]"
                        style={{ backgroundColor: toneColor(ev.tone) }}
                      />
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#EEF2F7]">
                          {ev.type}
                        </span>
                        <span className="font-mono text-[10px] tabular-nums text-[#4C5B75]">
                          {ev.time}
                        </span>
                      </div>
                      {ev.team && (
                        <div className="mt-0.5 text-[11px] text-[#8FA0BC]">{ev.team}</div>
                      )}
                      <div className="mt-0.5 text-[11px] text-[#5E6E86]">{ev.desc}</div>
                      {ev.undone && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8478]">
                          Undone
                        </span>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <StandingsTicker
              rows={rankedScorers}
              title="Top scorers"
              unit="goals"
              highlightId={highlight}
            />
          </aside>
        </div>
      </motion.div>

      {/* ------------------------------------------------ confirm dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-[98] flex items-center justify-center bg-[#05070C]/85 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md border border-[#1E2A45] bg-[#0B1220] p-6"
            >
              <h3 className="text-lg font-black uppercase tracking-[0.14em] text-[#EEF2F7]">
                End match?
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[#8FA0BC]">
                The final score locks into place and the result animation plays. This cannot be
                undone.
              </p>
              <div className="mt-7 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="border border-[#1E2A45] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#8FA0BC] transition-colors hover:border-[#31426B] hover:text-[#EEF2F7]"
                >
                  Cancel
                </button>
                <Pad tone="red" size="sm" onClick={handleEndMatch} className="min-h-[42px] px-5">
                  End match
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

const toneColor = (tone?: MatchEvent['tone']): string => {
  switch (tone) {
    case 'goal':
      return '#FFD21F';
    case 'six':
      return '#FFD21F';
    case 'four':
      return '#1264FF';
    case 'wicket':
      return '#FF4D3D';
    case 'point':
      return '#D9A441';
    case 'set':
      return '#D9A441';
    case 'card':
      return '#FFC53D';
    default:
      return '#31426B';
  }
};

const TeamPlate: React.FC<{
  team: { name: string; shortName: string };
  side: 'left' | 'right';
}> = ({ team, side }) => {
  const logo = getTeamLogo(team.name);
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
