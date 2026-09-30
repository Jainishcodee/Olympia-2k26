import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { deleteTeam } from '@/services/teams/teamService';
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
import { cn } from '@/utils/cn';
import type { Match, Player, Sport, Team } from '@/types';
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const isActive = (team: Team): boolean => team.active !== false;

const Avatar: React.FC<{ name: string; logo?: string }> = ({ name, logo }) =>
  logo ? (
    <img
      src={logo}
      alt={name}
      className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
    />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#071426] text-[11px] font-bold tracking-wide text-[#D9A441]">
      {initialsOf(name)}
    </span>
  );

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

const TeamsManager: React.FC = () => {
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const players = useCollection<Player>('players');
  const matches = useCollection<Match>('matches');

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const sportNames = useMemo(() => {
    const map = new Map(sports.data.map((sport) => [sport.id, sport.name]));
    return (id?: string) => (id ? (map.get(id) ?? '—') : '—');
  }, [sports.data]);

  const playerNames = useMemo(() => {
    const map = new Map(players.data.map((player) => [player.id, player.name]));
    return (id?: string) => (id ? (map.get(id) ?? '—') : '—');
  }, [players.data]);

  const playerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    players.data.forEach((player) => {
      if (!player.teamId) return;
      counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
    });
    return counts;
  }, [players.data]);

  const matchCounts = useMemo(() => {
    const counts = new Map<string, number>();
    matches.data.forEach((match) => {
      [match.teamAId, match.teamBId].forEach((id) => {
        if (!id) return;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });
    return counts;
  }, [matches.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return teams.data.filter((team) => {
      if (sportFilter && team.sportId !== sportFilter) return false;
      if (statusFilter === 'active' && !isActive(team)) return false;
      if (statusFilter === 'inactive' && isActive(team)) return false;
      if (term) {
        const haystack = `${team.name} ${team.shortName ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [teams.data, search, sportFilter, statusFilter]);

  const isLoading = teams.isLoading || sports.isLoading || players.isLoading || matches.isLoading;
  const error = teams.error ?? sports.error ?? players.error ?? matches.error;

  const handleDelete = async (team: Team) => {
    try {
      await deleteTeam(team.id);
      await log('TEAM_DELETED', 'team', team.id, { label: team.name });
      toast.success(`${team.name} deleted`);
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

  const statusOptions = [
    { value: '', label: 'Any status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive / archived' },
  ];

  return (
    <>
      <AdminHeader
        title="Teams"
        subtitle="Every registered squad. Archiving keeps the record and its match history intact."
        actions={
          <Btn to="/admin/teams/create" variant="primary" icon={<FiPlus className="h-4 w-4" />}>
            Create team
          </Btn>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search team or short name…"
          className="w-full sm:w-72"
        />
        <FilterSelect value={sportFilter} onChange={setSportFilter} options={sportOptions} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <span className="ml-auto text-[12px] tabular-nums text-slate-400">
          {rows.length} of {teams.data.length}
        </span>
      </Toolbar>

      <Card flush>
        {isLoading ? (
          <LoadingRows rows={7} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={teams.data.length === 0 ? 'No teams yet' : 'No teams match these filters'}
            message={
              teams.data.length === 0
                ? 'Create the first squad to start building rosters and fixtures.'
                : 'Try clearing the search box or the filters above.'
            }
            action={
              teams.data.length === 0 ? (
                <Btn to="/admin/teams/create" variant="primary">
                  Create team
                </Btn>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Logo', 'Team', 'Sport', 'Captain', 'Vice captain', 'Players', 'Matches', 'Status', ''].map(
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
                {rows.map((team) => (
                  <tr key={team.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      <Avatar name={team.name} logo={team.logo} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/admin/teams/${team.id}`}
                        className="block text-[13px] font-bold text-slate-800 transition-colors hover:text-[#1264FF]"
                      >
                        {team.name}
                      </Link>
                      <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                        {team.shortName || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-slate-600">
                      {sportNames(team.sportId)}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[13px] text-slate-600">
                      {playerNames(team.captainId)}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[13px] text-slate-600">
                      {playerNames(team.viceCaptainId)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-700">
                      {playerCounts.get(team.id) ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-700">
                      {matchCounts.get(team.id) ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusPill value={isActive(team) ? 'active' : 'inactive'} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIcon label="View" onClick={() => navigate(`/admin/teams/${team.id}`)}>
                          <FiEye className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label="Roster"
                          primary
                          onClick={() => navigate(`/admin/teams/${team.id}/roster`)}
                        >
                          <FiUsers className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon label="Edit" onClick={() => navigate(`/admin/teams/${team.id}/edit`)}>
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label="Delete"
                          onClick={() => handleDelete(team)}
                        >
                          <FiTrash2 className="h-3.5 w-3.5 text-rose-500" />
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

export default TeamsManager;
