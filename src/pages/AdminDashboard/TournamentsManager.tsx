import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  SubLine,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import { useCollection } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { deleteTournament, updateTournament } from '@/services/tournaments/tournamentService';
import type { Match, Sport, Team, Tournament, TournamentFormat } from '@/types';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';

type ArchivedTournament = Tournament & { archived?: boolean };

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

const cellDate = (value: unknown) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const FORMAT_LABEL: Record<TournamentFormat, string> = {
  knockout: 'Knockout',
  league: 'League',
  round_robin: 'Round robin',
  group_stage: 'Group stage',
  custom: 'Custom',
};

const TournamentsManager: React.FC = () => {
  const { log } = useAuditLog();
  const navigate = useNavigate();

  const tournaments = useCollection<Tournament>('tournaments');
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const teams = useCollection<Team>('teams');
  const matches = useCollection<Match>('matches');

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const error = tournaments.error ?? sports.error ?? teams.error ?? matches.error;

  const sportName = useMemo(() => {
    const map = new Map(sports.data.map((row) => [row.id, row.name]));
    return (id?: string) => (id ? (map.get(id) ?? id) : '—');
  }, [sports.data]);

  /** Teams and matches counted by their `tournamentId` link. */
  const counts = useMemo(() => {
    const teamCounts = new Map<string, number>();
    teams.data.forEach((team) => {
      const tournamentId = (team as Team & { tournamentId?: string }).tournamentId;
      if (tournamentId) teamCounts.set(tournamentId, (teamCounts.get(tournamentId) ?? 0) + 1);
    });
    const matchCounts = new Map<string, number>();
    matches.data.forEach((match) => {
      if (match.tournamentId) {
        matchCounts.set(match.tournamentId, (matchCounts.get(match.tournamentId) ?? 0) + 1);
      }
    });
    return { teamCounts, matchCounts };
  }, [teams.data, matches.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (tournaments.data as ArchivedTournament[])
      .filter((tournament) => {
        if (Boolean(tournament.archived) !== showArchived) return false;
        if (sportFilter && tournament.sportId !== sportFilter) return false;
        if (formatFilter && tournament.format !== formatFilter) return false;
        if (statusFilter && tournament.status !== statusFilter) return false;
        if (term && !tournament.name.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => {
        const left = toDate(a.startDate)?.getTime();
        const right = toDate(b.startDate)?.getTime();
        if (left === undefined && right === undefined) return 0;
        if (left === undefined) return 1;
        if (right === undefined) return -1;
        return left - right;
      });
  }, [tournaments.data, search, sportFilter, formatFilter, statusFilter, showArchived]);

  const handleDelete = async (tournament: Tournament) => {
    try {
      await deleteTournament(tournament.id);
      await log('TOURNAMENT_DELETED', 'tournament', tournament.id, { label: tournament.name });
      toast.success('Tournament deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const options = {
    sport: [
      { value: '', label: 'All sports' },
      ...sports.data.map((row) => ({ value: row.id, label: row.name })),
    ],
    format: [
      { value: '', label: 'All formats' },
      ...(Object.keys(FORMAT_LABEL) as TournamentFormat[]).map((format) => ({
        value: format,
        label: FORMAT_LABEL[format],
      })),
    ],
    status: [
      { value: '', label: 'Any status' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'ongoing', label: 'Ongoing' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  };

  return (
    <>
      <AdminHeader
        title="Tournaments"
        subtitle="Every competition in OLYMPIA 2K26. Team and match counts are read live from Firestore."
        actions={
          <div className="flex items-center gap-2.5">
            <Btn to="/admin/fixtures" variant="secondary">
              Fixtures
            </Btn>
            <Btn to="/admin/tournaments/create" variant="primary">
              + Create tournament
            </Btn>
          </div>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tournament name…"
          className="w-full sm:w-72"
        />
        <FilterSelect value={sportFilter} onChange={setSportFilter} options={options.sport} />
        <FilterSelect value={formatFilter} onChange={setFormatFilter} options={options.format} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={options.status} />
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
        </Btn>
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {tournaments.data.length}
        </span>
      </Toolbar>

      <Card flush>
        {tournaments.isLoading ? (
          <LoadingRows rows={6} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={
              tournaments.data.length === 0
                ? 'No tournaments in Firestore'
                : 'No tournaments match these filters'
            }
            message={
              tournaments.data.length === 0
                ? 'Create the first competition to start grouping matches, fixtures and standings.'
                : 'Try clearing the search box or the filters above.'
            }
            action={
              <Btn to="/admin/tournaments/create" variant="primary">
                Create tournament
              </Btn>
            }
          />
        ) : (
          <TableShell minW={1080}>
            <THead>
              <tr>
                {['Name', 'Sport', 'Format', 'Start Date', 'End Date', 'Status', 'Teams', 'Matches'].map(
                  (heading) => (
                    <Th key={heading}>{heading}</Th>
                  ),
                )}
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {rows.map((tournament) => {
                const archived = Boolean(tournament.archived);
                return (
                  <TRow key={tournament.id}>
                    <Td strong className="max-w-[240px]">
                      <span
                        className={
                          archived ? 'block truncate font-bold text-ink-faint' : 'block truncate font-bold text-ink'
                        }
                      >
                        {tournament.name}
                      </span>
                      <SubLine>{tournament.venue || 'Venue TBC'}</SubLine>
                    </Td>
                    <Td className="whitespace-nowrap font-semibold text-ink">
                      {sportName(tournament.sportId)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {FORMAT_LABEL[tournament.format] ?? tournament.format ?? '—'}
                    </Td>
                    <Td className="whitespace-nowrap">{cellDate(tournament.startDate)}</Td>
                    <Td className="whitespace-nowrap">{cellDate(tournament.endDate)}</Td>
                    <Td>
                      <StatusPill value={archived ? 'archived' : tournament.status} />
                    </Td>
                    <Td numeric>{counts.teamCounts.get(tournament.id) ?? 0}</Td>
                    <Td numeric>{counts.matchCounts.get(tournament.id) ?? 0}</Td>
                    <Td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionIcon
                          label="View"
                          onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                        >
                          <FiEye className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label="Edit"
                          onClick={() => navigate(`/admin/tournaments/${tournament.id}/edit`)}
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label="Delete"
                          danger
                          onClick={() => handleDelete(tournament)}
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </ActionIcon>
                      </div>
                    </Td>
                  </TRow>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Card>
    </>
  );
};

export default TournamentsManager;
