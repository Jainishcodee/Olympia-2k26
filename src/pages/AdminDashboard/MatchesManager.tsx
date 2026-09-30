import React, { useMemo, useState } from 'react';
import { useCollection, useDoc } from '@/hooks/useCollection';
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
import { useAuditLog } from '@/hooks/useAuditLog';
import { useTheme } from '@/contexts/ThemeContext';
import {
  createMatch,
  deleteMatch,
  updateMatch,
} from '@/services/matches/matchService';
import { saveSettings } from '@/services/settings/settingsService';
import { DEFAULT_SETTINGS, type Match, type MatchStatus, type Sport, type SystemSettings, type Team, type Tournament, type Venue } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiPlay, FiCopy, FiSlash, FiEye, FiEyeOff, FiExternalLink, FiGlobe, FiTrash2 } from 'react-icons/fi';

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

const MatchesManager: React.FC = () => {
  const navigate = useNavigate();
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

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
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const settingsDoc = useDoc<SystemSettings>('settings', 'default');
  const [showArchived, setShowArchived] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
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
      if (!showArchived && isArchived) return false;
      if (showArchived && !isArchived) return false;
      if (sportFilter && match.sportId !== sportFilter) return false;
      if (tournamentFilter && match.tournamentId !== tournamentFilter) return false;
      if (statusFilter && match.status !== statusFilter) return false;
      if (featuredFilter === 'featured' && !match.featured) return false;
      if (featuredFilter === 'not' && match.featured) return false;
      if (visibilityFilter === 'visible' && match.isHidden) return false;
      if (visibilityFilter === 'hidden' && !match.isHidden) return false;
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
    visibilityFilter,
    dateFilter,
    showArchived,
    lookups,
  ]);

  const handleToggleVisibility = async (match: Match) => {
    const next = !match.isHidden;
    try {
      await updateMatch(match.id, { isHidden: next });
      await log('MATCH_UPDATED', 'match', match.id, {
        label: `${label(match)} marked as ${next ? 'hidden' : 'visible'}`,
      });
      toast.success(next ? 'Match hidden from public' : 'Match visible to public');
    } catch (err) {
      toast.error('Failed to change match visibility');
    }
  };

  const handleToggleMasterVisibility = async () => {
    const current = settingsDoc.data?.publicMatchesVisible !== false;
    const next = !current;
    try {
      await saveSettings({
        ...(settingsDoc.data || DEFAULT_SETTINGS),
        publicMatchesVisible: next,
      });
      await log('SETTINGS_UPDATED', 'settings', 'default', {
        label: `Public matches visibility changed to ${next ? 'visible' : 'hidden'}`,
      });
      toast.success(next ? 'Public matches enabled for normal users' : 'All public matches hidden from normal users');
    } catch (err) {
      toast.error('Failed to update system settings');
    }
  };

  const handleBulkSetVisibility = async (hide: boolean) => {
    if (rows.length === 0) return;
    const targets = rows.filter((m) => Boolean(m.isHidden) !== hide);
    if (targets.length === 0) {
      toast.success(hide ? 'All filtered matches are already hidden' : 'All filtered matches are already visible');
      return;
    }
    setBusy(true);
    try {
      await Promise.all(
        targets.map((m) => updateMatch(m.id, { isHidden: hide }))
      );
      toast.success(`${targets.length} matches marked as ${hide ? 'hidden' : 'visible'}`);
    } catch (err) {
      toast.error('Failed to update matches');
    } finally {
      setBusy(false);
    }
  };

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

  const handleDelete = async (match: Match) => {
    try {
      await deleteMatch(match.id);
      await log('MATCH_DELETED', 'match', match.id, { label: label(match) });
      toast.success('Match deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleCancel = async (match: Match) => {
    try {
      await updateMatch(match.id, { status: 'cancelled' as MatchStatus });
      await log('MATCH_CANCELLED', 'match', match.id, { label: label(match) });
      toast.success('Match cancelled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cancel failed');
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

  const visibilityOptions = [
    { value: '', label: 'All visibility' },
    { value: 'visible', label: 'Visible only' },
    { value: 'hidden', label: 'Hidden only' },
  ];

  const shown = rows.slice(0, visible);

  return (
    <>
      <AdminHeader
        title="Matches"
        subtitle="Every scheduled, live and completed match. Filters apply instantly to the live Firestore stream."
        actions={
          <div className="flex items-center gap-2.5">
            <Btn
              variant={settingsDoc.data?.publicMatchesVisible !== false ? 'secondary' : 'primary'}
              onClick={handleToggleMasterVisibility}
              className={cn(
                'flex items-center gap-1.5',
                settingsDoc.data?.publicMatchesVisible === false && 'bg-amber-600 text-white hover:bg-amber-700'
              )}
              title="Toggle global public visibility of all matches for normal users"
            >
              {settingsDoc.data?.publicMatchesVisible !== false ? (
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
            <Btn to="/admin/live" variant="secondary">Live control room</Btn>
            <Btn to="/admin/matches/create" variant="primary">+ Create match</Btn>
          </div>
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
        <FilterSelect
          value={visibilityFilter}
          onChange={setVisibilityFilter}
          options={visibilityOptions}
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={cn(
            'h-10 rounded-lg px-3 text-xs font-bold outline-none backdrop-blur-md transition-all',
            isDay
              ? 'border border-slate-200 bg-white text-slate-800 shadow-xs focus:border-[#1264FF]'
              : 'border border-white/15 bg-[#0B1A30]/90 text-white focus:border-[#D9A441]',
          )}
          aria-label="Filter by date"
        />
        <div className="flex items-center gap-1">
          <Btn size="xs" variant="ghost" onClick={() => handleBulkSetVisibility(true)} title="Hide all currently filtered matches from normal users">
            <FiEyeOff className="h-3 w-3 text-amber-500" />
            <span className="hidden xl:inline">Hide Filtered</span>
          </Btn>
          <Btn size="xs" variant="ghost" onClick={() => handleBulkSetVisibility(false)} title="Make all currently filtered matches visible to normal users">
            <FiEye className="h-3 w-3 text-emerald-500" />
            <span className="hidden xl:inline">Show Filtered</span>
          </Btn>
        </div>
        <Btn
          variant={showArchived ? 'primary' : 'ghost'}
          size="xs"
          onClick={() => setShowArchived(!showArchived)}
          className="gap-1.5"
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
        <span className={cn('ml-auto text-[12px] tabular-nums font-bold', isDay ? 'text-slate-500' : 'text-slate-400')}>
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
                <tr className={cn(
                  'border-b transition-colors',
                  isDay ? 'border-slate-200 bg-slate-50/90 text-slate-600' : 'border-white/10 bg-[#0B1A30]/60 text-slate-400'
                )}>
                  {['Match', 'Sport', 'Tournament', 'Teams / Players', 'Date', 'Time', 'Venue', 'Status', 'Featured', 'Display', ''].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3.5 text-[10px] font-black uppercase tracking-wider"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDay ? 'divide-slate-100 bg-white' : 'divide-white/5 bg-transparent')}>
                {shown.map((match) => {
                  const when = cellDate(match.scheduledAt);
                  return (
                    <tr
                      key={match.id}
                      className={cn(
                        'transition-colors',
                        isDay ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <span className={cn('block text-[13px] font-black', isDay ? 'text-slate-900' : 'text-white')}>
                          #{match.matchNumber ?? '—'}
                        </span>
                        <span className={cn('block text-[11px] font-mono', isDay ? 'text-slate-400' : 'text-slate-500')}>
                          {match.id.slice(0, 10)}
                        </span>
                      </td>
                      <td className={cn('whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold', isDay ? 'text-slate-700' : 'text-slate-300')}>
                        {lookups.sport(match.sportId)}
                      </td>
                      <td className={cn('max-w-[150px] truncate px-4 py-3.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                        {lookups.tournament(match.tournamentId)}
                      </td>
                      <td className="max-w-[240px] px-4 py-3.5">
                        <span className={cn('block truncate text-[13px] font-bold', isDay ? 'text-slate-900' : 'text-white')}>
                          {label(match)}
                        </span>
                      </td>
                      <td className={cn('whitespace-nowrap px-4 py-3.5 text-[12px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                        {when.date}
                      </td>
                      <td className={cn('whitespace-nowrap px-4 py-3.5 font-mono text-[12px] font-bold tabular-nums', isDay ? 'text-[#1264FF]' : 'text-[#D9A441]')}>
                        {when.time}
                      </td>
                      <td className={cn('max-w-[150px] truncate px-4 py-3.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                        {lookups.venue(match.venueId)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusPill value={match.status} />
                          {match.isHidden && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <FiEyeOff className="h-3 w-3" /> Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {match.featured ? (
                          <span className={cn(
                            'inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase',
                            isDay
                              ? 'border-[#D9A441]/50 bg-[#FFF7E6] text-[#A9761B]'
                              : 'border-[#D9A441]/40 bg-[#D9A441]/15 text-[#FFD21F]',
                          )}>
                            Featured
                          </span>
                        ) : (
                          <span className={isDay ? 'text-slate-300' : 'text-slate-600'}>—</span>
                        )}
                      </td>
                      <td className={cn('whitespace-nowrap px-4 py-3.5 text-[11px]', isDay ? 'text-slate-500' : 'text-slate-400')}>
                        {match.displayMode === 'dual_portrait' ? 'Dual portrait' : 'Single landscape'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionIcon
                            label={match.isHidden ? 'Hidden from public. Click to make visible.' : 'Visible to public. Click to hide.'}
                            onClick={() => handleToggleVisibility(match)}
                          >
                            {match.isHidden ? (
                              <FiEyeOff className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <FiEye className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </ActionIcon>
                          <ActionIcon label="View" onClick={() => navigate(`/admin/matches/${match.id}`)}>
                            <FiExternalLink className="h-3.5 w-3.5" />
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
                            onClick={() => handleCancel(match)}
                          >
                            <FiSlash className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon
                            label="Delete"
                            danger
                            onClick={() => handleDelete(match)}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
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
    </>
  );
};

export default MatchesManager;
