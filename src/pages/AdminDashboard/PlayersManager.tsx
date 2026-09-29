import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { updatePlayer } from '@/services/players/playerService';
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
import { cn } from '@/utils/cn';
import type { Player, Sport, Team } from '@/types';
import { FiArchive, FiEdit2, FiEye, FiPlus, FiX } from 'react-icons/fi';

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const roleLabel = (role?: string): string =>
  (role || 'player').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [pending, setPending] = useState<Player | null>(null);
  const [busy, setBusy] = useState(false);

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

  const archive = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await updatePlayer(pending.id, { active: false });
      await log('PLAYER_ARCHIVED', 'player', pending.id, { label: pending.name });
      toast.success(`${pending.name} archived`);
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Archive failed');
    } finally {
      setBusy(false);
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
        subtitle="Every registered athlete. Archiving hides a player without touching their record."
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
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[#1264FF]/30 bg-[#1264FF]/5 pl-2.5 pr-1.5 text-[12px] font-semibold text-[#1264FF]">
            {lockedTeamName || 'Filtered team'}
            <button
              type="button"
              title="Clear team filter"
              aria-label="Clear team filter"
              onClick={() => {
                setSearchParams({}, { replace: true });
                setTeamFilter('');
              }}
              className="flex h-5 w-5 items-center justify-center rounded text-[#1264FF] transition-colors hover:bg-[#1264FF]/15"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <FilterSelect value={teamFilter} onChange={setTeamFilter} options={teamOptions} />
        )}
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <span className="ml-auto text-[12px] tabular-nums text-slate-400">
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
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Photo', 'Name', 'Jersey', 'Sport', 'Team', 'Role', 'Position', 'Status', ''].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((player) => (
                  <tr key={player.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#071426] text-[11px] font-bold text-[#D9A441]">
                          {initialsOf(player.name)}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5">
                      <Link
                        to={`/admin/players/${player.id}`}
                        className="block truncate text-[13px] font-bold text-slate-800 transition-colors hover:text-[#1264FF]"
                      >
                        {player.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums text-slate-700">
                      {player.jerseyNumber ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-slate-600">
                      {sportNames(player.sportId || teamById.get(player.teamId)?.sportId || '')}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 text-[13px] text-slate-600">
                      {player.teamId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/teams/${player.teamId}/roster`)}
                          className="truncate text-left transition-colors hover:text-[#1264FF]"
                        >
                          {teamName(player.teamId)}
                        </button>
                      ) : (
                        <span className="text-slate-400">Free agent</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-slate-600">
                      {roleLabel(player.role)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-slate-600">
                      {player.position || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusPill value={player.active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIcon label="View" onClick={() => navigate(`/admin/players/${player.id}`)}>
                          <FiEye className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon label="Edit" onClick={() => navigate(`/admin/players/${player.id}/edit`)}>
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label="Archive"
                          disabled={player.active === false}
                          onClick={() => setPending(player)}
                        >
                          <FiArchive className="h-3.5 w-3.5" />
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

      <ConfirmDialog
        isOpen={pending !== null}
        title="Archive this player?"
        message={
          pending
            ? `${pending.name} will be hidden from active lists and removed from public view. Nothing is deleted — the record and their statistics are preserved.`
            : ''
        }
        confirmText="Archive"
        isDestructive
        onConfirm={archive}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

export default PlayersManager;
