import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import {
  addPlayerToTeam,
  deleteTeam,
  removePlayerFromTeam,
  setCaptain,
  setViceCaptain,
  updateTeam,
} from '@/services/teams/teamService';
import { updatePlayer } from '@/services/players/playerService';
import {
  AdminHeader,
  AdminTabs,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FilterSelect,
  LoadingRows,
  MetaRow,
  PageLoading,
  StatTile,
  StatusPill,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { cn } from '@/utils/cn';
import type { Match, Player, Sport, Team } from '@/types';
import { FiArchive, FiEdit2, FiPlay, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

/* ------------------------------------------------------------- helpers */

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

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

const cellDate = (value: unknown): string => {
  const date = toDate(value);
  return date ? date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};

const TeamMark: React.FC<{ name: string; logo?: string; large?: boolean }> = ({ name, logo, large }) =>
  logo ? (
    <img
      src={logo}
      alt={name}
      className={cn(
        'shrink-0 rounded-md border border-slate-200 bg-white object-cover',
        large ? 'h-14 w-14' : 'h-8 w-8',
      )}
    />
  ) : (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-[#071426] font-bold tracking-wide text-[#D9A441]',
        large ? 'h-14 w-14 text-lg' : 'h-8 w-8 text-[11px]',
      )}
    >
      {initialsOf(name)}
    </span>
  );

const ResultBadge: React.FC<{ outcome: 'W' | 'D' | 'L' }> = ({ outcome }) => {
  const tone =
    outcome === 'W'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : outcome === 'L'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-slate-200 bg-slate-100 text-slate-600';
  const label = outcome === 'W' ? 'Won' : outcome === 'L' ? 'Lost' : 'Draw';
  return (
    <span
      className={cn(
        'inline-flex min-w-[54px] items-center justify-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        tone,
      )}
    >
      {label}
    </span>
  );
};

interface Tally {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
}

const emptyTally = (): Tally => ({ played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 });

/* ------------------------------------------------------------- page */

const TeamDetail: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // `/admin/teams/:id/roster` opens straight on the roster tab.
  const [tab, setTab] = useState<string>(location.pathname.endsWith('/roster') ? 'roster' : 'overview');
  useEffect(() => {
    setTab(location.pathname.endsWith('/roster') ? 'roster' : 'overview');
  }, [location.pathname]);

  const teamDoc = useDoc<Team>('teams', teamId);
  const players = useCollection<Player>('players', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });

  const [confirm, setConfirm] = useState<{ kind: 'delete' } | { kind: 'remove'; player: Player } | null>(null);
  const [assignId, setAssignId] = useState('');
  const [busy, setBusy] = useState(false);

  const team = teamDoc.data;

  const sportName = useMemo(() => {
    const map = new Map(sports.data.map((sport) => [sport.id, sport.name]));
    return (id?: string) => (id ? (map.get(id) ?? '—') : '—');
  }, [sports.data]);

  const teamNameOf = useMemo(() => {
    const map = new Map(teams.data.map((row) => [row.id, row.name]));
    return (id?: string) => (id ? (map.get(id) ?? id) : '—');
  }, [teams.data]);

  const playerById = useMemo(() => new Map(players.data.map((row) => [row.id, row])), [players.data]);
  const playerName = (id?: string) => (id ? (playerById.get(id)?.name ?? '—') : '—');

  const roster = useMemo(
    () => (teamId ? players.data.filter((player) => player.teamId === teamId) : []),
    [players.data, teamId],
  );

  const freeAgents = useMemo(() => players.data.filter((player) => !player.teamId), [players.data]);

  const teamMatches = useMemo(
    () =>
      teamId
        ? matches.data.filter((match) => match.teamAId === teamId || match.teamBId === teamId)
        : [],
    [matches.data, teamId],
  );

  const results = useMemo(
    () => teamMatches.filter((match) => match.status === 'completed'),
    [teamMatches],
  );

  const stats = useMemo(() => {
    const total = emptyTally();
    const bySport = new Map<string, Tally>();
    results.forEach((match) => {
      const a = Number(match.score?.teamA ?? 0);
      const b = Number(match.score?.teamB ?? 0);
      const isHome = match.teamAId === teamId;
      const gf = isHome ? a : b;
      const ga = isHome ? b : a;
      const row = bySport.get(match.sportId) ?? emptyTally();
      [total, row].forEach((tally) => {
        tally.played += 1;
        tally.gf += gf;
        tally.ga += ga;
        if (gf > ga) tally.won += 1;
        else if (gf < ga) tally.lost += 1;
        else tally.drawn += 1;
      });
      bySport.set(match.sportId, row);
    });
    return { total, bySport: Array.from(bySport.entries()) };
  }, [results, teamId]);

  const outcomeOf = (match: Match): 'W' | 'D' | 'L' => {
    const a = Number(match.score?.teamA ?? 0);
    const b = Number(match.score?.teamB ?? 0);
    const gf = match.teamAId === teamId ? a : b;
    const ga = match.teamAId === teamId ? b : a;
    if (gf > ga) return 'W';
    if (gf < ga) return 'L';
    return 'D';
  };

  const opponentOf = (match: Match): string => {
    const isHome = match.teamAId === teamId;
    const named = isHome ? match.participantB?.name : match.participantA?.name;
    return named || teamNameOf(isHome ? match.teamBId : match.teamAId);
  };

  const scoreOf = (match: Match): string =>
    `${Number(match.score?.teamA ?? 0)} – ${Number(match.score?.teamB ?? 0)}`;

  /* --------------------------------------------------------- guards */

  if (!teamDoc.isReady) return <PageLoading label="Loading team…" />;

  if (teamDoc.error) {
    return (
      <>
        <AdminHeader title="Team" breadcrumbs={[{ label: 'Teams', to: '/admin/teams' }]} />
        <ErrorNotice message={teamDoc.error} />
      </>
    );
  }

  if (!teamId || !team) {
    return (
      <>
        <AdminHeader title="Team" breadcrumbs={[{ label: 'Teams', to: '/admin/teams' }]} />
        <EmptyNotice
          title="Team not found"
          message="This team document no longer exists in Firestore."
          action={<Btn to="/admin/teams">Back to teams</Btn>}
        />
      </>
    );
  }

  /* --------------------------------------------------- write actions */

  // Narrowed copies captured for the async handlers below.
  const id: string = teamId;
  const record: Team = team;

  const run = async (action: () => Promise<void>, success: string): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    try {
      await action();
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const makeCaptain = (player: Player) =>
    run(async () => {
      await setCaptain(id, player.id);
      await log('ROSTER_CHANGED', 'team', id, {
        label: `${player.name} set as captain of ${record.name}`,
      });
    }, `${player.name} is now captain`);

  const makeViceCaptain = (player: Player) =>
    run(async () => {
      await setViceCaptain(id, player.id);
      await log('ROSTER_CHANGED', 'team', id, {
        label: `${player.name} set as vice captain of ${record.name}`,
      });
    }, `${player.name} is now vice captain`);

  const assignExisting = async () => {
    const player = players.data.find((row) => row.id === assignId);
    if (!player) return;
    const ok = await run(async () => {
      await addPlayerToTeam(id, player.id);
      await updatePlayer(player.id, { teamId: id });
      await log('ROSTER_CHANGED', 'team', id, {
        label: `${player.name} assigned to ${record.name}`,
      });
    }, `${player.name} added to the roster`);
    if (ok) setAssignId('');
  };

  const confirmRemoval = async () => {
    if (confirm?.kind !== 'remove') return;
    const player = confirm.player;
    const ok = await run(async () => {
      await removePlayerFromTeam(id, player.id);
      await updatePlayer(player.id, { teamId: '' });
      const patch: Partial<Team> = {};
      if (record.captainId === player.id) patch.captainId = '';
      if (record.viceCaptainId === player.id) patch.viceCaptainId = '';
      if (Object.keys(patch).length > 0) await updateTeam(id, patch);
      await log('ROSTER_CHANGED', 'team', id, {
        label: `${player.name} removed from ${record.name}`,
      });
    }, `${player.name} removed from the roster`);
    if (ok) setConfirm(null);
  };

  const deleteTeamAction = async () => {
    const ok = await run(async () => {
      await deleteTeam(teamId!);
      await log('TEAM_DELETED', 'team', teamId!, { label: team.name });
    }, `${team.name} deleted`);
    if (ok) {
      setConfirm(null);
      navigate('/admin/teams');
    }
  };

  const archived = team.active === false;
  const addPlayerTo = `/admin/players/create?teamId=${teamId}`;
  const agentOptions = [
    { value: '', label: 'Select a player…' },
    ...freeAgents.map((player) => ({
      value: player.id,
      label: player.jerseyNumber ? `${player.name} · #${player.jerseyNumber}` : player.name,
    })),
  ];

  const tabItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'roster', label: 'Roster', count: roster.length },
    { id: 'matches', label: 'Matches', count: teamMatches.length },
    { id: 'results', label: 'Results', count: results.length },
    { id: 'statistics', label: 'Statistics' },
  ];

  return (
    <>
      <AdminHeader
        title={team.name}
        subtitle={`${sportName(team.sportId)} · ${roster.length} players · ${teamMatches.length} matches played or scheduled`}
        breadcrumbs={[{ label: 'Teams', to: '/admin/teams' }, { label: team.name }]}
        badge={<StatusPill value={archived ? 'inactive' : 'active'} />}
        actions={
          <>
            <Btn to={`/admin/teams/${teamId}/edit`} icon={<FiEdit2 className="h-4 w-4" />}>
              Edit
            </Btn>
            <Btn to={`/admin/teams/${teamId}/roster`} icon={<FiUsers className="h-4 w-4" />}>
              Roster
            </Btn>
            <Btn
              variant="danger"
              icon={<FiTrash2 className="h-4 w-4" />}
              onClick={() => setConfirm({ kind: 'delete' })}
            >
              Delete
            </Btn>
          </>
        }
      />

      <AdminTabs items={tabItems} active={tab} onChange={setTab} layoutPrefix="team-tab" />

      {tab === 'overview' && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <TeamMark name={team.name} logo={team.logo} large />
              <div className="min-w-0">
                <h2 className={cn('truncate text-lg font-bold', isDay ? 'text-slate-900' : 'text-white')}>{team.name}</h2>
                <p className={cn('mt-1 text-[13px]', isDay ? 'text-slate-500' : 'text-white/60')}>
                  {sportName(team.sportId)} · Short name{' '}
                  <span className={cn('font-mono font-bold uppercase', isDay ? 'text-slate-700' : 'text-[#D9A441]')}>{team.shortName || '—'}</span>
                </p>
              </div>
              <div className="ml-auto">
                <StatusPill value={archived ? 'inactive' : 'active'} />
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="Players" value={roster.length} accent="blue" />
            <StatTile label="Matches" value={teamMatches.length} />
            <StatTile label="Won" value={team.wins ?? 0} accent="green" />
            <StatTile label="Lost" value={team.losses ?? 0} accent="red" />
            <StatTile label="Points" value={team.points ?? 0} accent="gold" />
          </div>

          <Card title="Team record">
            <dl>
              <MetaRow label="Captain">{playerName(team.captainId)}</MetaRow>
              <MetaRow label="Vice captain">{playerName(team.viceCaptainId)}</MetaRow>
              <MetaRow label="Coach">{team.coach || '—'}</MetaRow>
              <MetaRow label="Short name">{team.shortName || '—'}</MetaRow>
              <MetaRow label="Description">{team.description || '—'}</MetaRow>
              <MetaRow label="Active">{archived ? 'No — archived' : 'Yes'}</MetaRow>
            </dl>
          </Card>
        </div>
      )}

      {tab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn('text-[13px]', isDay ? 'text-slate-600' : 'text-white/60')}>
              {roster.length} registered {roster.length === 1 ? 'player' : 'players'}
            </p>
            <Btn to={addPlayerTo} variant="primary" icon={<FiPlus className="h-4 w-4" />}>
              Add player
            </Btn>
          </div>

          <Card
            title="Add existing player"
            hint={
              freeAgents.length > 0
                ? 'Players who are not currently assigned to any team.'
                : 'No unassigned players — add a new one instead.'
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="Player" value={assignId} onChange={setAssignId} options={agentOptions} />
              <Btn variant="primary" disabled={!assignId || busy} onClick={assignExisting}>
                Assign
              </Btn>
            </div>
          </Card>

          <Card flush>
            {players.isLoading ? (
              <LoadingRows rows={6} cols={6} />
            ) : roster.length === 0 ? (
              <EmptyNotice
                title="No players on this roster"
                message="Add a brand-new player, or assign an existing player who is not on any team."
                action={
                  <Btn to={addPlayerTo} variant="primary">
                    Add player
                  </Btn>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
                      {['Player', 'Jersey', 'Role', 'Position', 'Status', ''].map((heading) => (
                        <th
                          key={heading}
                          className={cn('whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-white/60')}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
                    {roster.map((player) => {
                      const isCaptain = team.captainId === player.id;
                      const isVice = team.viceCaptainId === player.id;
                      return (
                        <tr key={player.id} className={isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]'}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {player.photo ? (
                                <img
                                  src={player.photo}
                                  alt={player.name}
                                  className={cn('h-8 w-8 shrink-0 rounded-md border object-cover', isDay ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.05]')}
                                />
                              ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#071426] text-[11px] font-bold text-[#D9A441]">
                                  {initialsOf(player.name)}
                                </span>
                              )}
                              <div className="min-w-0">
                                <Link
                                  to={`/admin/players/${player.id}`}
                                  className={cn('block truncate text-[13px] font-bold transition-colors hover:text-[#1264FF]', isDay ? 'text-slate-800' : 'text-white')}
                                >
                                  {player.name}
                                </Link>
                                {isCaptain && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9A441]">
                                    Captain
                                  </span>
                                )}
                                {isVice && (
                                  <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-400' : 'text-white/40')}>
                                    Vice captain
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-700' : 'text-white/80')}>
                            {player.jerseyNumber ?? '—'}
                          </td>
                          <td className={cn('whitespace-nowrap px-3 py-2.5 text-[13px]', isDay ? 'text-slate-600' : 'text-white/70')}>
                            {String(player.role ?? 'player').replace('_', ' ')}
                          </td>
                          <td className={cn('whitespace-nowrap px-3 py-2.5 text-[13px]', isDay ? 'text-slate-600' : 'text-white/70')}>
                            {player.position || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <StatusPill value={player.active !== false ? 'active' : 'inactive'} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Btn
                                size="xs"
                                disabled={isCaptain || busy}
                                onClick={() => makeCaptain(player)}
                              >
                                Captain
                              </Btn>
                              <Btn
                                size="xs"
                                disabled={isVice || busy}
                                onClick={() => makeViceCaptain(player)}
                              >
                                Vice
                              </Btn>
                              <Btn to={`/admin/players/${player.id}`} size="xs">
                                Edit
                              </Btn>
                              <Btn
                                size="xs"
                                variant="danger"
                                disabled={busy}
                                onClick={() => setConfirm({ kind: 'remove', player })}
                                icon={<FiTrash2 className="h-3 w-3" />}
                              >
                                Remove
                              </Btn>
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
        </div>
      )}

      {tab === 'matches' && (
        <Card flush>
          {matches.isLoading ? (
            <LoadingRows rows={6} cols={6} />
          ) : teamMatches.length === 0 ? (
            <EmptyNotice
              title="No matches for this team"
              message="Fixtures appear here as soon as this team is added to a match."
              action={<Btn to="/admin/matches/create">Create match</Btn>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
                    {['Match', 'Date', 'Score', 'Status', ''].map((heading) => (
                      <th
                        key={heading}
                        className={cn('whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-white/60')}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
                  {teamMatches.map((match) => (
                    <tr key={match.id} className={isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]'}>
                      <td className="px-3 py-2.5">
                        <span className={cn('block text-[13px] font-bold', isDay ? 'text-slate-800' : 'text-white')}>
                          vs {opponentOf(match)}
                        </span>
                        <span className={cn('block text-[11px]', isDay ? 'text-slate-400' : 'text-white/40')}>
                          {match.matchNumber ? `Match #${match.matchNumber} · ` : ''}
                          {sportName(match.sportId)}
                        </span>
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-600' : 'text-white/70')}>
                        {cellDate(match.scheduledAt)}
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums', isDay ? 'text-slate-800' : 'text-white')}>
                        {scoreOf(match)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusPill value={match.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <Btn
                          to={`/admin/matches/${match.id}/scoring`}
                          size="xs"
                          variant="primary"
                          icon={<FiPlay className="h-3 w-3" />}
                        >
                          Open scoring
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'results' && (
        <Card flush>
          {matches.isLoading ? (
            <LoadingRows rows={6} cols={5} />
          ) : results.length === 0 ? (
            <EmptyNotice
              title="No completed results yet"
              message="Once a match involving this team is completed it lands here with a win, draw or loss badge."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
                    {['Result', 'Opponent', 'Date', 'Score', 'Sport'].map((heading) => (
                      <th
                        key={heading}
                        className={cn('whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-white/60')}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
                  {results.map((match) => (
                    <tr key={match.id} className={isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]'}>
                      <td className="px-3 py-2.5">
                        <ResultBadge outcome={outcomeOf(match)} />
                      </td>
                      <td className={cn('max-w-[240px] truncate px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-white')}>
                        {opponentOf(match)}
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-600' : 'text-white/70')}>
                        {cellDate(match.scheduledAt)}
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums', isDay ? 'text-slate-800' : 'text-white')}>
                        {scoreOf(match)}
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 text-[13px]', isDay ? 'text-slate-600' : 'text-white/70')}>
                        {sportName(match.sportId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'statistics' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Played" value={stats.total.played} accent="blue" />
            <StatTile label="Won" value={stats.total.won} accent="green" />
            <StatTile label="Drawn" value={stats.total.drawn} />
            <StatTile label="Lost" value={stats.total.lost} accent="red" />
            <StatTile label="Goals for" value={stats.total.gf} accent="gold" />
            <StatTile label="Goals against" value={stats.total.ga} />
            <StatTile
              label="Goal difference"
              value={`${stats.total.gf - stats.total.ga > 0 ? '+' : ''}${stats.total.gf - stats.total.ga}`}
              accent={stats.total.gf - stats.total.ga >= 0 ? 'green' : 'red'}
            />
            <StatTile
              label="Points"
              value={stats.total.won * 3 + stats.total.drawn}
              accent="gold"
              hint="3 per win · 1 per draw"
            />
          </div>

          <Card title="Breakdown by sport" hint="Computed from completed matches only." flush>
            {results.length === 0 ? (
              <EmptyNotice
                title="No completed matches"
                message="Statistics fill in as soon as this team finishes a match."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
                      {['Sport', 'Played', 'Won', 'Drawn', 'Lost', 'GF', 'GA', 'GD'].map((heading) => (
                        <th
                          key={heading}
                          className={cn('whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-white/60')}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
                    {stats.bySport.map(([sportId, tally]) => (
                      <tr key={sportId} className={isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]'}>
                        <td className={cn('px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-white')}>
                          {sportName(sportId)}
                        </td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-700' : 'text-white/80')}>{tally.played}</td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-emerald-700' : 'text-emerald-400')}>{tally.won}</td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-600' : 'text-white/60')}>{tally.drawn}</td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-red-600' : 'text-rose-400')}>{tally.lost}</td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-700' : 'text-white/80')}>{tally.gf}</td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-700' : 'text-white/80')}>{tally.ga}</td>
                        <td className={cn('px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums', isDay ? 'text-slate-800' : 'text-white')}>
                          {tally.gf - tally.ga > 0 ? '+' : ''}
                          {tally.gf - tally.ga}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm !== null}
        title={confirm?.kind === 'delete' ? 'Delete this team?' : 'Remove from roster?'}
        message={
          confirm?.kind === 'delete'
            ? `Are you sure you want to permanently delete "${team.name}"? This action removes the team document from Firestore in real-time.`
            : confirm?.kind === 'remove'
              ? `${confirm.player.name} will be detached from ${team.name}. The player record itself is kept.`
              : ''
        }
        confirmText={confirm?.kind === 'delete' ? 'Delete' : 'Remove'}
        isDestructive
        onConfirm={() => {
          if (confirm?.kind === 'delete') deleteTeamAction();
          else if (confirm?.kind === 'remove') confirmRemoval();
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default TeamDetail;
