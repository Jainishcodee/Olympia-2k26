import React, { useMemo, useState } from 'react';
import { useCollection } from '@/hooks/useCollection';
import {
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
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  createMatch,
  deleteMatch,
  updateMatch,
} from '@/services/matches/matchService';
import type { Match, MatchStatus, Sport, Team, Tournament, Venue } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlay, FiCopy, FiSlash, FiArchive, FiEye, FiRotateCcw } from 'react-icons/fi';

const PAGE_SIZE = 40;

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in (value as Date)) return (value as { toDate: () => Date }).toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const cellDate = (value: unknown) => {
  const date = toDate(value);
  if (!date) return { date: '—', time: '—' };
  return {
    date: date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

type PendingAction =
  | { kind: 'cancel' | 'archive' | 'restore' | 'delete'; match: Match }
  | null;

const MatchesManager: React.FC = () => {
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const sports = useCollection<Sport>('sports');
  const tournaments = useCollection<Tournament>('tournaments');
  const venues = useCollection<Venue>('venues');
  const teams = useCollection<Team>('teams');

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [autoShowArchived, setAutoShowArchived] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const lookups = useMemo(() => {
    const name = <T extends { id: string; name: string }>(rows: T[]) => {
      const map = new Map(rows.map((row) => [row.id, row.name]));
      return (id?: string) => (id ? (map.get(id) ?? id) : '—');
    };
    return {
      sport: name(sports.data),
      tournament: name(tournaments.data),
      venue: name(venues.data),
      team: name(teams.data),
    };
  }, [sports.data, tournaments.data, venues.data, teams.data]);

  const label = (match: Match) =>
    match.participantA?.name || match.participantB?.name
      ? `${match.participantA?.name ?? 'TBD'} vs ${match.participantB?.name ?? 'TBD'}`
      : `${lookups.team(match.teamAId)} vs ${lookups.team(match.teamBId)}`;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return matches.data.filter((match) => {
      const isArchived = (match as Match & { archived?: boolean }).archived;
      // Show archived only when checkbox is checked, hide when unchecked
      if (!showArchived && isArchived) return false;
      if (showArchived && !isArchived) return false;
      if (sportFilter && match.sportId !== sportFilter) return false;
      if (tournamentFilter && match.tournamentId !== tournamentFilter) return false;
      if (statusFilter && match.status !== statusFilter) return false;
      if (featuredFilter === 'featured' && !match.featured) return false;
      if (featuredFilter === 'not' && match.featured) return false;
      if (dateFilter) {
        const date = toDate(match.scheduledAt);
        if (!date) return false;
        const iso = date.toISOString().slice(0, 10);
        if (iso !== dateFilter) return false;
      }
      if (term) {
        const haystack = [
          label(match),
          lookups.sport(match.sportId),
          lookups.tournament(match.tournamentId),
          lookups.venue(match.venueId),
          String(match.matchNumber ?? ''),
          match.status,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    matches.data,
    search,
    sportFilter,
    tournamentFilter,
    statusFilter,
    featuredFilter,
    dateFilter,
    showArchived,
    lookups,
  ]);

  const duplicate = async (match: Match) => {
    setBusy(true);
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = match as Match & { archived?: boolean };
      const newId = await createMatch({
        ...rest,
        matchNumber: (match.matchNumber ?? 0) + 1,
        status: 'scheduled' as MatchStatus,
        featured: false,
      } as Omit<Match, 'id'>);
      await log('MATCH_DUPLICATED', 'match', newId, { label: label(match), metadata: { sourceId: match.id } });
      toast.success('Match duplicated');
      navigate(`/admin/matches/${newId}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Duplicate failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    const { kind, match } = pending;
    setBusy(true);
    try {
      if (kind === 'delete') {
        await deleteMatch(match.id);
        await log('MATCH_ARCHIVED', 'match', match.id, { label: label(match), metadata: { hardDelete: true } });
        toast.success('Match deleted');
      } else if (kind === 'cancel') {
        await updateMatch(match.id, { status: 'cancelled' as MatchStatus });
        await log('MATCH_CANCELLED', 'match', match.id, { label: label(match) });
        toast.success('Match cancelled');
      } else if (kind === 'archive') {
        await updateMatch(match.id, { archived: true } as Partial<Match>);
        await log('MATCH_ARCHIVED', 'match', match.id, { label: label(match) });
        toast.success('Match archived. Check "Archived" to view.', { duration: 4000 });
        setShowArchived(true);
      } else if (kind === 'restore') {
        await updateMatch(match.id, { archived: false } as Partial<Match>);
        await log('MATCH_RESTORED', 'match', match.id, { label: label(match) });
        toast.success('Match restored');
      }
      setPending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const sportOptions = useMemo(
    () => [
      { value: '', label: 'All sports' },
      ...sports.data.map((s) => ({ value: s.id, label: s.name })),
    ],
    [sports.data],
  );
  const tournamentOptions = useMemo(
    () => [
      { value: '', label: 'All tournaments' },
      ...tournaments.data.map((t) => ({ value: t.id, label: t.name })),
    ],
    [tournaments.data],
  );
  const statusOptions = [
    { value: '', label: 'Any status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const shown = rows.slice(0, visible);

  return (
    <>
      <AdminHeader
        title="Matches"
        subtitle="Every scheduled, live and completed match. Filters apply instantly to the live Firestore stream."
        actions={
          <>
            <Btn to="/admin/live" variant="secondary">Live control room</Btn>
            <Btn to="/admin/matches/create" variant="primary">Create match</Btn>
          </>
        }
      />

      {matches.error && <ErrorNotice message={matches.error} className="mb-4" />}

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search match, team, player, venue…" className="w-full sm:w-72" />
        <FilterSelect value={sportFilter} onChange={setSportFilter} options={sportOptions} />
        <FilterSelect value={tournamentFilter} onChange={setTournamentFilter} options={tournamentOptions} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <FilterSelect
          value={featuredFilter}
          onChange={setFeaturedFilter}
          options={[
            { value: '', label: 'Any feature' },
            { value: 'featured', label: 'Featured only' },
            { value: 'not', label: 'Non-featured' },
          ]}
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] text-slate-700 outline-none focus:border-[#1264FF]"
          aria-label="Filter by date"
        />
        <Btn
            variant={showArchived ? 'primary' : 'ghost'}
            size="xs"
            onClick={() => setShowArchived(!showArchived)}
            className="gap-1"
          >
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="sr-only"
            />
            Archived
            {showArchived && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-white/20 text-white">
                {matches.data.filter((m) => (m as Match & { archived?: boolean }).archived).length}
              </span>
            )}
          </Btn>
        <span className="ml-auto text-[12px] tabular-nums text-slate-400">
          {rows.length} of {matches.data.length}
        </span>
      </Toolbar>

      <Card flush>
        {matches.isLoading ? (
          <LoadingRows rows={7} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={matches.data.length === 0 ? 'No matches in Firestore' : 'No matches match these filters'}
            message={
              matches.data.length === 0
                ? 'Run npm run seed to populate the collections, or create your first match.'
                : 'Try clearing the search box or the filters above.'
            }
            action={<Btn to="/admin/matches/create" variant="primary">Create match</Btn>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Match', 'Sport', 'Tournament', 'Teams / Players', 'Date', 'Time', 'Venue', 'Status', 'Featured', 'Display', ''].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((match) => {
                  const when = cellDate(match.scheduledAt);
                  const isArchived = (match as Match & { archived?: boolean }).archived;
                  return (
                    <tr key={match.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-3 py-2.5">
                        <span className="block text-[13px] font-bold text-slate-800">
                          #{match.matchNumber ?? '—'}
                        </span>
                        <span className="block text-[11px] text-slate-400">{match.id.slice(0, 10)}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-slate-600">
                        {lookups.sport(match.sportId)}
                      </td>
                      <td className="max-w-[150px] truncate px-3 py-2.5 text-[13px] text-slate-600">
                        {lookups.tournament(match.tournamentId)}
                      </td>
                      <td className="max-w-[240px] px-3 py-2.5">
                        <span className="block truncate text-[13px] font-semibold text-slate-800">
                          {label(match)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-slate-600">{when.date}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] tabular-nums text-slate-600">
                        {when.time}
                      </td>
                      <td className="max-w-[150px] truncate px-3 py-2.5 text-[13px] text-slate-600">
                        {lookups.venue(match.venueId)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusPill value={match.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        {match.featured ? (
                          <span className="inline-block rounded border border-[#F0DFB8] bg-[#FFF7E6] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#A9761B]">
                            Featured
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-slate-500">
                        {match.displayMode === 'dual_portrait' ? 'Dual portrait' : 'Single landscape'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <ActionIcon label="View" onClick={() => navigate(`/admin/matches/${match.id}`)}>
                            <FiEye className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon label="Edit" onClick={() => navigate(`/admin/matches/${match.id}/edit`)}>
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon
                            label="Open scoring"
                            primary
                            onClick={() => navigate(`/admin/matches/${match.id}/scoring`)}
                          >
                            <FiPlay className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon label="Duplicate" onClick={() => duplicate(match)} disabled={busy}>
                            <FiCopy className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon
                            label="Cancel"
                            disabled={match.status === 'cancelled'}
                            onClick={() => setPending({ kind: 'cancel', match })}
                          >
                            <FiSlash className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon
                            label={isArchived ? 'Restore' : 'Archive'}
                            onClick={() => setPending({ kind: isArchived ? 'restore' : 'archive', match })}
                          >
                            {isArchived ? <FiRotateCcw className="h-3.5 w-3.5" /> : <FiArchive className="h-3.5 w-3.5" />}
                          </ActionIcon>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {rows.length > visible && (
        <div className="mt-4 flex justify-center">
          <Btn onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, rows.length - visible)} more
          </Btn>
        </div>
      )}

      <ConfirmDialog
        isOpen={pending !== null}
        title={
          pending?.kind === 'cancel'
            ? 'Cancel this match?'
            : pending?.kind === 'delete'
              ? 'Delete this match permanently?'
              : pending?.kind === 'restore'
                ? 'Restore this match?'
                : 'Archive this match?'
        }
        message={
          pending
            ? pending.kind === 'cancel'
              ? `${label(pending.match)} will be marked cancelled and removed from active lists.`
              : pending.kind === 'delete'
                ? 'This removes the match document permanently. Prefer archiving — the match has a history.'
                : pending.kind === 'restore'
                  ? 'The match will be restored and visible in active lists again.'
                  : 'The match is hidden from active lists but fully recoverable.'
            : ''
        }
        confirmText={
          pending?.kind === 'delete'
            ? 'Delete'
            : pending?.kind === 'restore'
              ? 'Restore'
              : 'Confirm'
        }
        isDestructive
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

const ActionIcon: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
}> = ({ label, onClick, children, primary, disabled }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'flex h-7 w-7 items-center justify-center rounded border transition-colors disabled:opacity-40',
      primary
        ? 'border-[#1264FF] bg-[#1264FF] text-white hover:bg-[#0B4FD1]'
        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900',
    )}
  >
    {children}
  </button>
);

export default MatchesManager;
