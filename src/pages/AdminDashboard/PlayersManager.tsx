import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { deletePlayer } from '@/services/players/playerService';
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
  TBody,
  Td,
  THead,
  Th,
  TableLink,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import type { Player, Sport, Team } from '@/types';
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const roleLabel = (role?: string): string =>
  (role || 'player').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const PlayersManager: React.FC = () => {
  const navigate = useNavigate();
  const { log } = useAuditLog();
  const [searchParams, setSearchParams] = useSearchParams();

  // Arriving from a roster (`/admin/players?teamId=…`) locks the team filter.
  const teamParam = searchParams.get('teamId') ?? '';

  const players = useCollection<Player>('players', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState(teamParam);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const sportNames = useMemo(() => {
    const map = new Map(sports.data.map((sport) => [sport.id, sport.name]));
    return (id?: string) => (id ? (map.get(id) ?? '—') : '—');
  }, [sports.data]);

  const teamById = useMemo(() => new Map(teams.data.map((team) => [team.id, team])), [teams.data]);
  const teamName = (id?: string) => (id ? (teamById.get(id)?.name ?? '—') : '—');

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return players.data.filter((player) => {
      if (sportFilter) {
        const sportId = player.sportId || teamById.get(player.teamId)?.sportId || '';
        if (sportId !== sportFilter) return false;
      }
      if (teamFilter && player.teamId !== teamFilter) return false;
      if (roleFilter && player.role !== roleFilter) return false;
      if (statusFilter === 'active' && player.active === false) return false;
      if (statusFilter === 'inactive' && player.active !== false) return false;
      if (term) {
        const haystack = `${player.name} ${player.jerseyNumber ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [players.data, teamById, search, sportFilter, teamFilter, roleFilter, statusFilter]);

  const isLoading = players.isLoading || teams.isLoading || sports.isLoading;
  const error = players.error ?? teams.error ?? sports.error;

  const handleDelete = async (player: Player) => {
    try {
      await deletePlayer(player.id);
      await log('PLAYER_DELETED', 'player', player.id, { label: player.name });
      toast.success(`${player.name} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const sportOptions = useMemo(
    () => [
      { value: '', label: 'All sports' },
      ...sports.data.map((sport) => ({ value: sport.id, label: sport.name })),
    ],
    [sports.data],
  );

  const teamOptions = useMemo(
    () => [
      { value: '', label: 'All teams' },
      ...teams.data.map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams.data],
  );

  const roleOptions = [
    { value: '', label: 'Any role' },
    { value: 'captain', label: 'Captain' },
    { value: 'vice_captain', label: 'Vice captain' },
    { value: 'player', label: 'Player' },
  ];

  const statusOptions = [
    { value: '', label: 'Any status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive / archived' },
  ];

  const lockedTeamName = teamFilter ? teamName(teamFilter) : '';
  const createHref = teamFilter
    ? `/admin/players/create?teamId=${teamFilter}`
    : '/admin/players/create';

  return (
    <>
      <AdminHeader
        title="Players"
        subtitle="Every registered athlete across all tournament disciplines."
        actions={
          <Btn to={createHref} variant="primary" icon={<FiPlus className="h-4 w-4" />}>
            Add player
          </Btn>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name or jersey number…"
          className="w-full sm:w-72"
        />
        <FilterSelect value={sportFilter} onChange={setSportFilter} options={sportOptions} />
        {teamParam ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#1264FF]/25 bg-[#1264FF]/10 pl-2.5 pr-1.5 text-[12px] font-bold text-[#1264FF]">
            {lockedTeamName || 'Filtered team'}
            <button
              type="button"
              title="Clear team filter"
              aria-label="Clear team filter"
              onClick={() => {
                setSearchParams({}, { replace: true });
                setTeamFilter('');
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-inherit transition-colors hover:bg-[#1264FF]/20 cursor-pointer"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <FilterSelect value={teamFilter} onChange={setTeamFilter} options={teamOptions} />
        )}
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {players.data.length}
        </span>
      </Toolbar>

      <Card flush>
        {isLoading ? (
          <LoadingRows rows={7} cols={8} />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={players.data.length === 0 ? 'No players yet' : 'No players match these filters'}
            message={
              players.data.length === 0
                ? 'Add the first player to start building rosters.'
                : 'Try clearing the search box or the filters above.'
            }
            action={
              players.data.length === 0 ? (
                <Btn to={createHref} variant="primary">
                  Add player
                </Btn>
              ) : undefined
            }
          />
        ) : (
          <TableShell minW={1180}>
            <THead>
              <tr>
                {['Photo', 'Name', 'Jersey', 'Sport', 'Team', 'Role', 'Position', 'Status', ''].map((heading) => (
                  <Th key={heading}>{heading}</Th>
                ))}
              </tr>
            </THead>
            <TBody>
              {rows.map((player) => (
                <TRow key={player.id}>
                  <Td>
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="h-8 w-8 shrink-0 rounded-lg border border-line bg-surface-2 object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-[11px] font-black text-ink-muted">
                        {initialsOf(player.name)}
                      </span>
                    )}
                  </Td>
                  <Td strong className="max-w-[200px] truncate">
                    <TableLink to={`/admin/players/${player.id}`}>{player.name}</TableLink>
                  </Td>
                  <Td numeric>{player.jerseyNumber ?? '—'}</Td>
                  <Td className="whitespace-nowrap font-semibold text-ink">
                    {sportNames(player.sportId || teamById.get(player.teamId)?.sportId || '')}
                  </Td>
                  <Td className="max-w-[180px] truncate">
                    {player.teamId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/teams/${player.teamId}/roster`)}
                        className="cursor-pointer truncate text-left font-semibold text-[#1264FF] transition-colors hover:underline"
                      >
                        {teamName(player.teamId)}
                      </button>
                    ) : (
                      <span className="text-ink-faint">Free agent</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">{roleLabel(player.role)}</Td>
                  <Td className="whitespace-nowrap">{player.position || '—'}</Td>
                  <Td>
                    <StatusPill value={player.active !== false ? 'active' : 'inactive'} />
                  </Td>
                  <Td className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionIcon label="View" onClick={() => navigate(`/admin/players/${player.id}`)}>
                        <FiEye className="h-3.5 w-3.5" />
                      </ActionIcon>
                      <ActionIcon label="Edit" onClick={() => navigate(`/admin/players/${player.id}/edit`)}>
                        <FiEdit2 className="h-3.5 w-3.5" />
                      </ActionIcon>
                      <ActionIcon
                        label="Delete"
                        danger
                        onClick={() => handleDelete(player)}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </ActionIcon>
                    </div>
                  </Td>
                </TRow>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>
    </>
  );
};

export default PlayersManager;
