import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { deleteTeam } from '@/services/teams/teamService';
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
  TableLink,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import type { Match, Player, Sport, Team } from '@/types';
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { getTeamLogo } from '@/utils/teamLogos';

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const isActive = (team: Team): boolean => team.active !== false;

const Avatar: React.FC<{ name: string; logo?: string }> = ({ name, logo }) => {
  const finalLogo = logo || getTeamLogo(name);
  return finalLogo ? (
    <img
      src={finalLogo}
      alt={name}
      className="h-8 w-8 shrink-0 rounded-lg border border-line bg-surface-2 object-cover"
    />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-[11px] font-black tracking-wide text-gold-ink">
      {initialsOf(name)}
    </span>
  );
};

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
        subtitle="Every registered squad. Real-time rosters and match counts linked to each squad."
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
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
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
          <TableShell minW={1120}>
            <THead>
              <tr>
                {['Logo', 'Team', 'Sport', 'Captain', 'Vice captain', 'Players', 'Matches', 'Status', ''].map(
                  (heading) => (
                    <Th key={heading}>{heading}</Th>
                  ),
                )}
              </tr>
            </THead>
            <TBody>
              {rows.map((team) => (
                <TRow key={team.id}>
                  <Td>
                    <Avatar name={team.name} logo={team.logo} />
                  </Td>
                  <Td strong className="min-w-[200px]">
                    <TableLink to={`/admin/teams/${team.id}`}>{team.name}</TableLink>
                    <SubLine>{team.shortName || '—'}</SubLine>
                  </Td>
                  <Td className="whitespace-nowrap font-semibold text-ink">{sportNames(team.sportId)}</Td>
                  <Td className="max-w-[160px] truncate">{playerNames(team.captainId)}</Td>
                  <Td className="max-w-[160px] truncate">{playerNames(team.viceCaptainId)}</Td>
                  <Td numeric>{playerCounts.get(team.id) ?? 0}</Td>
                  <Td numeric>{matchCounts.get(team.id) ?? 0}</Td>
                  <Td>
                    <StatusPill value={isActive(team) ? 'active' : 'inactive'} />
                  </Td>
                  <Td className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
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
                        danger
                        onClick={() => handleDelete(team)}
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

export default TeamsManager;
