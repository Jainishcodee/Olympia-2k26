import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ActionIcon,
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FilterSelect,
  LoadingRows,
  SearchInput,
  StatusPill,
  Toolbar,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useTheme } from '@/contexts/ThemeContext';
import { deleteFixture, reorderFixtures, updateFixture } from '@/services/fixtures/fixtureService';
import { createMatch } from '@/services/matches/matchService';
import { saveSettings } from '@/services/settings/settingsService';
import { Timestamp } from 'firebase/firestore';
import { DEFAULT_SETTINGS, type Fixture, type Match, type MatchStatus, type SystemSettings, type Team, type Tournament, type Venue } from '@/types';
import { cn } from '@/utils/cn';
import {
  FiArrowDown,
  FiArrowUp,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiExternalLink,
  FiGlobe,
  FiPlay,
  FiTrash2,
} from 'react-icons/fi';

/* ============================================================================
 *  Fixtures — the schedule board. Three real views over the same filtered set:
 *  a vertical timeline grouped by day, a month grid, and a dense table with
 *  inline reordering. Every write goes to Firestore.
 * ==========================================================================*/

type View = 'timeline' | 'calendar' | 'table';

const VIEW_TABS: { id: View; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'table', label: 'Table' },
];

const BASE_STATUSES = ['scheduled', 'upcoming', 'live', 'completed', 'cancelled'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const stamp = value as { toDate?: () => Date; seconds?: number };
  if (typeof stamp.toDate === 'function') return stamp.toDate();
  if (typeof stamp.seconds === 'number') return new Date(stamp.seconds * 1000);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const pad = (value: number) => String(value).padStart(2, '0');

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const timeOf = (value: unknown) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
};

const dateOf = (value: unknown) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const chipTone = (status?: string) => {
  const key = (status ?? 'scheduled').toLowerCase();
  if (key === 'live') return 'border-red-200 bg-red-50 text-red-700';
  if (key === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (key === 'cancelled') return 'border-slate-200 bg-slate-100 text-slate-500';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};

const FixturesManager: React.FC = () => {
  const { isDay } = useTheme();
  const { log } = useAuditLog();
  const navigate = useNavigate();

  const fixtures = useCollection<Fixture>('fixtures');
  const tournaments = useCollection<Tournament>('tournaments', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const venues = useCollection<Venue>('venues', { sortBy: 'name' });
  const matches = useCollection<Match>('matches');

  const [view, setView] = useState<View>('timeline');
  const [search, setSearch] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const settingsDoc = useDoc<SystemSettings>('settings', 'default');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [pending, setPending] = useState<Fixture | null>(null);
  const [busy, setBusy] = useState(false);

  const error =
    fixtures.error ?? tournaments.error ?? teams.error ?? venues.error ?? matches.error;

  const lookups = useMemo(() => {
    const nameOf = <T extends { id: string; name: string }>(rows: T[]) => {
      const map = new Map(rows.map((row) => [row.id, row.name]));
      return (id?: string) => (id ? (map.get(id) ?? id) : '—');
    };
    const teamNames = new Map(teams.data.map((row) => [row.id, row.name]));
    const matchMap = new Map(matches.data.map((row) => [row.id, row]));
    return {
      tournament: nameOf(tournaments.data),
      venue: nameOf(venues.data),
      teamNames,
      match: (id?: string) => (id ? matchMap.get(id) : undefined),
    };
  }, [tournaments.data, venues.data, teams.data, matches.data]);

  const participant = (fixture: Fixture, side: 'A' | 'B'): string => {
    const teamId = side === 'A' ? fixture.teamAId : fixture.teamBId;
    const fromTeam = teamId ? lookups.teamNames.get(teamId) : undefined;
    if (fromTeam) return fromTeam;
    const match = lookups.match(fixture.matchId);
    const fromMatch = (side === 'A' ? match?.participantA : match?.participantB)?.name;
    if (fromMatch) return fromMatch;
    return teamId || 'TBD';
  };

  const label = (fixture: Fixture) =>
    `${participant(fixture, 'A')} vs ${participant(fixture, 'B')}`;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fixtures.data
      .filter((fixture) => {
        if (tournamentFilter && fixture.tournamentId !== tournamentFilter) return false;
        if (roundFilter && (fixture.round ?? '') !== roundFilter) return false;
        if (statusFilter && (fixture.status ?? 'scheduled') !== statusFilter) return false;
        if (venueFilter && fixture.venueId !== venueFilter) return false;
        if (visibilityFilter === 'visible' && fixture.isHidden) return false;
        if (visibilityFilter === 'hidden' && !fixture.isHidden) return false;
        if (term && !label(fixture).toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => {
        const left = toDate(a.scheduledAt)?.getTime();
        const right = toDate(b.scheduledAt)?.getTime();
        if (left === undefined && right === undefined)
          return (a.order ?? 0) - (b.order ?? 0);
        if (left === undefined) return 1;
        if (right === undefined) return -1;
        if (left !== right) return left - right;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fixtures.data,
    search,
    tournamentFilter,
    roundFilter,
    statusFilter,
    venueFilter,
    lookups,
  ]);

  const days = useMemo(() => {
    const buckets = new Map<string, { key: string; label: string; items: Fixture[] }>();
    rows.forEach((fixture) => {
      const date = toDate(fixture.scheduledAt);
      const key = date ? dayKey(date) : 'unscheduled';
      const dayLabel = date
        ? date.toLocaleDateString([], {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Unscheduled';
      const bucket = buckets.get(key);
      if (bucket) bucket.items.push(fixture);
      else buckets.set(key, { key, label: dayLabel, items: [fixture] });
    });
    return Array.from(buckets.values());
  }, [rows]);

  const byDay = useMemo(() => {
    const map = new Map<string, Fixture[]>();
    rows.forEach((fixture) => {
      const date = toDate(fixture.scheduledAt);
      const key = date ? dayKey(date) : 'unscheduled';
      const bucket = map.get(key);
      if (bucket) bucket.push(fixture);
      else map.set(key, [fixture]);
    });
    return map;
  }, [rows]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const offset = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index): Date | null => {
      const day = index - offset + 1;
      return day >= 1 && day <= daysInMonth ? new Date(year, monthIndex, day) : null;
    });
  }, [month]);

  const options = useMemo(() => {
    const rounds = new Set<string>();
    const statuses = new Set<string>(BASE_STATUSES);
    fixtures.data.forEach((fixture) => {
      if (fixture.round) rounds.add(fixture.round);
      if (fixture.status) statuses.add(fixture.status);
    });
    return {
      tournament: [
        { value: '', label: 'All tournaments' },
        ...tournaments.data.map((t) => ({ value: t.id, label: t.name })),
      ],
      round: [
        { value: '', label: 'All rounds' },
        ...Array.from(rounds)
          .sort()
          .map((round) => ({ value: round, label: round })),
      ],
      status: [
        { value: '', label: 'Any status' },
        ...Array.from(statuses).map((status) => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        })),
      ],
      venue: [
        { value: '', label: 'All venues' },
        ...venues.data.map((venue) => ({ value: venue.id, label: venue.name })),
      ],
      visibility: [
        { value: '', label: 'All visibility' },
        { value: 'visible', label: 'Visible to public' },
        { value: 'hidden', label: 'Hidden from public' },
      ],
    };
  }, [fixtures.data, tournaments.data, venues.data]);

  /* ------------------------------------------------------------- actions */

  const groupOf = (fixture: Fixture): Fixture[] =>
    fixtures.data
      .filter(
        (row) =>
          row.tournamentId === fixture.tournamentId &&
          (row.round ?? '') === (fixture.round ?? ''),
      )
      .sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (toDate(a.scheduledAt)?.getTime() ?? 0) - (toDate(b.scheduledAt)?.getTime() ?? 0),
      );

  const move = async (fixture: Fixture, delta: number) => {
    const group = groupOf(fixture);
    const index = group.findIndex((row) => row.id === fixture.id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= group.length) return;
    const current = group[index];
    const neighbour = group[target];
    try {
      await reorderFixtures([
        { id: current.id, order: neighbour.order ?? target + 1 },
        { id: neighbour.id, order: current.order ?? index + 1 },
      ]);
      await log('FIXTURE_UPDATED', 'fixture', current.id, {
        label: `${label(current)} reordered to position ${target + 1}`,
        metadata: { from: index + 1, to: target + 1, round: fixture.round ?? '' },
      });
      toast.success('Fixture order saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reorder fixtures');
    }
  };

  const handleToggleVisibility = async (fixture: Fixture) => {
    const next = !fixture.isHidden;
    try {
      await updateFixture(fixture.id, { isHidden: next });
      await log('FIXTURE_UPDATED', 'fixture', fixture.id, {
        label: `${label(fixture)} marked as ${next ? 'hidden' : 'visible'}`,
      });
      toast.success(next ? 'Fixture hidden from public' : 'Fixture visible to public');
    } catch (err) {
      toast.error('Failed to change visibility');
    }
  };

  const handleToggleMasterVisibility = async () => {
    const current = settingsDoc.data?.publicFixturesVisible !== false;
    const next = !current;
    try {
      await saveSettings({
        ...(settingsDoc.data || DEFAULT_SETTINGS),
        publicFixturesVisible: next,
      });
      await log('SETTINGS_UPDATED', 'settings', 'default', {
        label: `Public fixtures visibility changed to ${next ? 'visible' : 'hidden'}`,
      });
      toast.success(next ? 'Public fixtures enabled for normal users' : 'All public fixtures hidden from normal users');
    } catch (err) {
      toast.error('Failed to update system settings');
    }
  };

  const handleBulkSetVisibility = async (hide: boolean) => {
    if (rows.length === 0) return;
    const targetFixtures = rows.filter((f) => Boolean(f.isHidden) !== hide);
    if (targetFixtures.length === 0) {
      toast.success(hide ? 'All filtered fixtures are already hidden' : 'All filtered fixtures are already visible');
      return;
    }
    setBusy(true);
    try {
      await Promise.all(
        targetFixtures.map((f) => updateFixture(f.id, { isHidden: hide }))
      );
      toast.success(`${targetFixtures.length} fixtures marked as ${hide ? 'hidden' : 'visible'}`);
    } catch (err) {
      toast.error('Failed to update fixtures');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteFixture(pending.id);
      await log('FIXTURE_DELETED', 'fixture', pending.id, { label: label(pending) });
      toast.success('Fixture deleted');
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const handleLaunchMatch = async (fixture: Fixture) => {
    if (fixture.matchId) {
      navigate(`/admin/scoring/${fixture.matchId}`);
      return;
    }
    setBusy(true);
    try {
      const tourney = tournaments.data.find((t) => t.id === fixture.tournamentId);
      const teamA = teams.data.find((t) => t.id === fixture.teamAId);
      const teamB = teams.data.find((t) => t.id === fixture.teamBId);
      const sportId = fixture.sportId || tourney?.sportId || teamA?.sportId || 'cricket';

      const newMatchId = await createMatch({
        sportId,
        tournamentId: fixture.tournamentId || '',
        matchNumber: matches.data.length + 1,
        teamAId: fixture.teamAId || '',
        teamBId: fixture.teamBId || '',
        participantA: {
          id: fixture.teamAId || 'teamA',
          name: teamA?.name || 'Team A',
          logo: teamA?.logo || '',
          type: 'team',
        },
        participantB: {
          id: fixture.teamBId || 'teamB',
          name: teamB?.name || 'Team B',
          logo: teamB?.logo || '',
          type: 'team',
        },
        venueId: fixture.venueId || '',
        scheduledAt: fixture.scheduledAt || Timestamp.now(),
        startedAt: null,
        pausedAt: null,
        endedAt: null,
        status: (fixture.status as MatchStatus) || 'scheduled',
        score: { teamA: 0, teamB: 0, details: {} },
        liveState: {},
        displayMode: 'dual_portrait',
        featured: false,
        featuredPriority: 0,
        allowReactions: true,
        allowVoting: true,
        allowRatings: true,
        allowReviews: true,
        archived: false,
        createdBy: 'admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await updateFixture(fixture.id, { matchId: newMatchId });
      await log('MATCH_CREATED', 'match', newMatchId, {
        label: `Created from fixture: ${teamA?.name ?? 'Team A'} vs ${teamB?.name ?? 'Team B'}`,
      });
      toast.success('Live match created from fixture! Launching Scoring Console...');
      navigate(`/admin/scoring/${newMatchId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to launch match from fixture');
    } finally {
      setBusy(false);
    }
  };

  const rowActions = (fixture: Fixture, withReorder: boolean) => {
    const group = groupOf(fixture);
    const index = group.findIndex((row) => row.id === fixture.id);
    return (
      <div className="flex items-center justify-end gap-1">
        {withReorder && (
          <>
            <ActionIcon
              label="Move up"
              disabled={busy || index <= 0}
              onClick={() => move(fixture, -1)}
            >
              <FiArrowUp className="h-3.5 w-3.5" />
            </ActionIcon>
            <ActionIcon
              label="Move down"
              disabled={busy || index < 0 || index >= group.length - 1}
              onClick={() => move(fixture, 1)}
            >
              <FiArrowDown className="h-3.5 w-3.5" />
            </ActionIcon>
          </>
        )}
        <ActionIcon
          label={fixture.isHidden ? 'Hidden from public. Click to make visible.' : 'Visible to public. Click to hide.'}
          onClick={() => handleToggleVisibility(fixture)}
        >
          {fixture.isHidden ? (
            <FiEyeOff className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <FiEye className="h-3.5 w-3.5 text-emerald-500" />
          )}
        </ActionIcon>
        <ActionIcon
          label={fixture.matchId ? 'Open Live Scoring Console' : 'Start Match & Open Scoring Console'}
          onClick={() => handleLaunchMatch(fixture)}
        >
          <FiPlay className={cn('h-3.5 w-3.5', fixture.matchId ? 'text-amber-500' : 'text-emerald-500')} />
        </ActionIcon>
        <ActionIcon label="View" onClick={() => navigate(`/admin/fixtures/${fixture.id}`)}>
          <FiExternalLink className="h-3.5 w-3.5" />
        </ActionIcon>
        <ActionIcon
          label="Edit"
          onClick={() => navigate(`/admin/fixtures/${fixture.id}/edit`)}
        >
          <FiEdit2 className="h-3.5 w-3.5" />
        </ActionIcon>
        <ActionIcon label="Delete" danger onClick={() => setPending(fixture)}>
          <FiTrash2 className="h-3.5 w-3.5" />
        </ActionIcon>
      </div>
    );
  };

  /* -------------------------------------------------------------- views */

  const renderTimeline = () => (
    <div className={cn('divide-y', isDay ? 'divide-slate-200' : 'divide-white/10')}>
      {days.map((day) => (
        <div key={day.key}>
          <div className={cn(
            'flex items-center justify-between gap-3 px-4 py-2',
            isDay ? 'bg-slate-100/80' : 'bg-white/[0.04]'
          )}>
            <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDay ? 'text-slate-700' : 'text-slate-300')}>
              {day.label}
            </span>
            <span className={cn('text-[11px] tabular-nums', isDay ? 'text-slate-500' : 'text-slate-400')}>
              {day.items.length} {day.items.length === 1 ? 'fixture' : 'fixtures'}
            </span>
          </div>
          <ul className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
            {day.items.map((fixture) => (
              <li key={fixture.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 transition-colors', isDay ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')}>
                <span className={cn('w-12 shrink-0 font-mono text-[12px] font-bold tabular-nums', isDay ? 'text-slate-800' : 'text-slate-200')}>
                  {timeOf(fixture.scheduledAt)}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#1264FF]" />
                <span className="min-w-[180px] flex-1">
                  <span className={cn('block truncate text-[13px] font-semibold', isDay ? 'text-slate-900' : 'text-white')}>
                    {label(fixture)}
                  </span>
                  <span className={cn('block truncate text-[11px]', isDay ? 'text-slate-500' : 'text-slate-400')}>
                    {fixture.round || 'Fixture'} · {lookups.tournament(fixture.tournamentId)} ·{' '}
                    {lookups.venue(fixture.venueId)}
                  </span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusPill value={fixture.status ?? 'scheduled'} />
                  {fixture.isHidden && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <FiEyeOff className="h-3 w-3" /> Hidden
                    </span>
                  )}
                </div>
                {rowActions(fixture, false)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const renderCalendar = () => {
    const today = new Date();
    return (
      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ActionIcon
              label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <FiChevronLeft className="h-3.5 w-3.5" />
            </ActionIcon>
            <ActionIcon
              label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <FiChevronRight className="h-3.5 w-3.5" />
            </ActionIcon>
            <span className={cn('ml-2 text-[13px] font-bold', isDay ? 'text-slate-900' : 'text-white')}>
              {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <Btn size="xs" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </Btn>
        </div>

        <div className={cn('grid grid-cols-7 border-b', isDay ? 'border-slate-200' : 'border-white/10')}>
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={cn('px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-500' : 'text-slate-400')}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`blank-${index}`}
                  className={cn('min-h-[92px] border-b border-r', isDay ? 'border-slate-100 bg-slate-50/60' : 'border-white/5 bg-white/[0.01]')}
                />
              );
            }
            const key = dayKey(date);
            const items = byDay.get(key) ?? [];
            const isToday = dayKey(today) === key;
            return (
              <div key={key} className={cn('min-h-[92px] border-b border-r p-1.5', isDay ? 'border-slate-100' : 'border-white/5')}>
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                    isToday
                      ? isDay ? 'bg-[#071426] text-[#FFD21F]' : 'bg-[#1264FF] text-white shadow-[0_0_8px_rgba(18,100,255,0.6)]'
                      : isDay ? 'text-slate-600' : 'text-slate-400',
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 3).map((fixture) => (
                    <Link
                      key={fixture.id}
                      to={`/admin/fixtures/${fixture.id}`}
                      title={label(fixture)}
                      className={cn(
                        'block truncate rounded border px-1.5 py-1 text-[11px] font-semibold transition-colors',
                        chipTone(fixture.status),
                      )}
                    >
                      {timeOf(fixture.scheduledAt)} · {label(fixture)}
                    </Link>
                  ))}
                  {items.length > 3 && (
                    <span className={cn('block text-[10px] font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>
                      +{items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left">
        <thead>
          <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
            {['Round', 'Tournament', 'Teams', 'Date', 'Time', 'Venue', 'Status'].map((heading) => (
              <th
                key={heading}
                className={cn('whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-slate-400')}
              >
                {heading}
              </th>
            ))}
            <th className={cn('whitespace-nowrap px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-slate-400')}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
          {rows.map((fixture) => (
            <tr key={fixture.id} className={cn('transition-colors', isDay ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.02]')}>
              <td className="px-3 py-2.5">
                <span className={cn('block text-[13px] font-bold', isDay ? 'text-slate-900' : 'text-white')}>
                  {fixture.round || '—'}
                </span>
                <span className={cn('block text-[11px]', isDay ? 'text-slate-500' : 'text-slate-400')}>
                  Order {fixture.order ?? '—'}
                </span>
              </td>
              <td className={cn('max-w-[160px] truncate px-3 py-2.5 text-[13px]', isDay ? 'text-slate-700' : 'text-slate-300')}>
                {lookups.tournament(fixture.tournamentId)}
              </td>
              <td className="max-w-[260px] px-3 py-2.5">
                <span className={cn('block truncate text-[13px] font-semibold', isDay ? 'text-slate-900' : 'text-white')}>
                  {label(fixture)}
                </span>
                {fixture.matchId && (
                  <span className={cn('block truncate text-[11px]', isDay ? 'text-slate-500' : 'text-slate-400')}>
                    Linked match {fixture.matchId}
                  </span>
                )}
              </td>
              <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-700' : 'text-slate-300')}>
                {dateOf(fixture.scheduledAt)}
              </td>
              <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[12px] tabular-nums', isDay ? 'text-slate-800' : 'text-slate-300')}>
                {timeOf(fixture.scheduledAt)}
              </td>
              <td className={cn('max-w-[150px] truncate px-3 py-2.5 text-[13px]', isDay ? 'text-slate-700' : 'text-slate-300')}>
                {lookups.venue(fixture.venueId)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusPill value={fixture.status ?? 'scheduled'} />
                  {fixture.isHidden && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <FiEyeOff className="h-3 w-3" /> Hidden
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{rowActions(fixture, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* --------------------------------------------------------------- view */

  return (
    <>
      <AdminHeader
        title="Fixtures"
        subtitle="The full competition schedule. Switch views, filter down to a round, and reorder with the arrows — every change is written back to Firestore."
        actions={
          <>
            <Btn
              variant={settingsDoc.data?.publicFixturesVisible !== false ? 'secondary' : 'primary'}
              onClick={handleToggleMasterVisibility}
              className={cn(
                'flex items-center gap-1.5',
                settingsDoc.data?.publicFixturesVisible === false && 'bg-amber-600 text-white hover:bg-amber-700'
              )}
              title="Toggle global public visibility of all fixtures for normal users"
            >
              {settingsDoc.data?.publicFixturesVisible !== false ? (
                <>
                  <FiGlobe className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Public: Visible</span>
                </>
              ) : (
                <>
                  <FiEyeOff className="h-3.5 w-3.5 text-amber-200" />
                  <span>Public: All Hidden</span>
                </>
              )}
            </Btn>
            <Btn to="/admin/matches" variant="secondary">
              Matches
            </Btn>
            <Btn to="/admin/fixtures/create" variant="primary">
              Create fixture
            </Btn>
          </>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search team names…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={tournamentFilter}
          onChange={setTournamentFilter}
          options={options.tournament}
        />
        <FilterSelect value={roundFilter} onChange={setRoundFilter} options={options.round} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={options.status} />
        <FilterSelect value={venueFilter} onChange={setVenueFilter} options={options.venue} />
        <FilterSelect value={visibilityFilter} onChange={setVisibilityFilter} options={options.visibility} />
        <div className="flex items-center gap-1">
          <Btn size="xs" variant="ghost" onClick={() => handleBulkSetVisibility(true)} title="Hide all currently filtered fixtures from normal users">
            <FiEyeOff className="h-3 w-3 text-amber-500" />
            <span className="hidden xl:inline">Hide Filtered</span>
          </Btn>
          <Btn size="xs" variant="ghost" onClick={() => handleBulkSetVisibility(false)} title="Make all currently filtered fixtures visible to normal users">
            <FiEye className="h-3 w-3 text-emerald-500" />
            <span className="hidden xl:inline">Show Filtered</span>
          </Btn>
        </div>
        <span className={cn('ml-auto text-[12px] tabular-nums', isDay ? 'text-slate-500' : 'text-slate-400')}>
          {rows.length} of {fixtures.data.length}
        </span>
        <div className={cn('inline-flex rounded-md p-0.5 border', isDay ? 'border-slate-300 bg-slate-100' : 'border-white/10 bg-white/[0.04]')}>
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn(
                'h-8 rounded px-3 text-[11px] font-bold uppercase tracking-wider transition-colors',
                view === tab.id
                  ? isDay
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-[#1264FF] text-white shadow-[0_0_10px_rgba(18,100,255,0.4)]'
                  : isDay
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Toolbar>

      <Card flush>
        {fixtures.isLoading ? (
          <LoadingRows rows={8} cols={6} />
        ) : fixtures.data.length === 0 ? (
          <EmptyNotice
            title="No fixtures yet"
            message="Fixtures are the public schedule — create the first one to start building the event calendar."
            action={
              <Btn to="/admin/fixtures/create" variant="primary">
                Create fixture
              </Btn>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title="No fixtures match these filters"
            message="Try clearing the search box or the filters above."
          />
        ) : view === 'timeline' ? (
          renderTimeline()
        ) : view === 'calendar' ? (
          renderCalendar()
        ) : (
          renderTable()
        )}
      </Card>

      <ConfirmDialog
        isOpen={pending !== null}
        title="Delete this fixture?"
        message={
          pending
            ? `${label(pending)} will be removed permanently. Linked matches and their scores are not affected.`
            : ''
        }
        confirmText={busy ? 'Deleting…' : 'Delete fixture'}
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

export default FixturesManager;
