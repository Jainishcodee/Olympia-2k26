import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
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
  Toolbar,
} from '@/components/admin/kit';
import { cn } from '@/utils/cn';
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
  const { theme } = useTheme();
  const isDay = theme === 'day';
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
          <span className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg border pl-2.5 pr-1.5 text-[12px] font-bold',
            isDay ? 'border-[#1264FF]/30 bg-[#1264FF]/10 text-[#1264FF]' : 'border-[#1264FF]/40 bg-[#1264FF]/20 text-blue-300',
          )}>
            {lockedTeamName || 'Filtered team'}
            <button
              type="button"
              title="Clear team filter"
              aria-label="Clear team filter"
              onClick={() => {
                setSearchParams({}, { replace: true });
                setTeamFilter('');
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-inherit transition-colors hover:bg-black/10 cursor-pointer"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <FilterSelect value={teamFilter} onChange={setTeamFilter} options={teamOptions} />
        )}
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <span className={cn('ml-auto text-[12px] tabular-nums font-bold', isDay ? 'text-slate-500' : 'text-slate-400')}>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead>
                <tr className={cn(
                  'border-b transition-colors',
                  isDay ? 'border-slate-200 bg-slate-50/90 text-slate-600' : 'border-white/10 bg-[#0B1A30]/60 text-slate-400'
                )}>
                  {['Photo', 'Name', 'Jersey', 'Sport', 'Team', 'Role', 'Position', 'Status', ''].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3.5 text-[10px] font-black uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDay ? 'divide-slate-100 bg-white' : 'divide-white/5 bg-transparent')}>
                {rows.map((player) => (
                  <tr
                    key={player.id}
                    className={cn(
                      'transition-colors',
                      isDay ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <td className="px-4 py-3.5">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className={cn(
                            'h-8 w-8 shrink-0 rounded-lg border object-cover',
                            isDay ? 'border-slate-200 bg-white' : 'border-white/15 bg-[#0B1A30]',
                          )}
                        />
                      ) : (
                        <span className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black border',
                          isDay ? 'bg-slate-100 border-slate-200 text-[#A9761B]' : 'bg-[#071426] border-white/10 text-[#D9A441]',
                        )}>
                          {initialsOf(player.name)}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5">
                      <Link
                        to={`/admin/players/${player.id}`}
                        className={cn(
                          'block truncate text-[13px] font-black transition-colors',
                          isDay ? 'text-slate-900 hover:text-[#1264FF]' : 'text-white hover:text-[#D9A441]',
                        )}
                      >
                        {player.name}
                      </Link>
                    </td>
                    <td className={cn('whitespace-nowrap px-4 py-3.5 font-mono text-[13px] font-black tabular-nums', isDay ? 'text-slate-800' : 'text-slate-200')}>
                      {player.jerseyNumber ?? '—'}
                    </td>
                    <td className={cn('whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold', isDay ? 'text-slate-700' : 'text-slate-300')}>
                      {sportNames(player.sportId || teamById.get(player.teamId)?.sportId || '')}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3.5 text-[13px]">
                      {player.teamId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/teams/${player.teamId}/roster`)}
                          className={cn('truncate text-left font-bold transition-colors cursor-pointer', isDay ? 'text-[#1264FF] hover:underline' : 'text-blue-300 hover:text-white')}
                        >
                          {teamName(player.teamId)}
                        </button>
                      ) : (
                        <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>Free agent</span>
                      )}
                    </td>
                    <td className={cn('whitespace-nowrap px-4 py-3.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                      {roleLabel(player.role)}
                    </td>
                    <td className={cn('whitespace-nowrap px-4 py-3.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                      {player.position || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusPill value={player.active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};

export default PlayersManager;
