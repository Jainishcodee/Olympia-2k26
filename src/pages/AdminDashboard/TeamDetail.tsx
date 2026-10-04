import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection, useDoc } from '@/hooks/useCollection';
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
  SubLine,
  TBody,
  Td,
  THead,
  Th,
  TableLink,
  TableShell,
  TRow,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { getTeamLogo } from '@/utils/teamLogos';
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

const TeamMark: React.FC<{ name: string; logo?: string; large?: boolean; teamId?: string }> = ({ name, logo, large, teamId }) => {
  const finalLogo = logo || getTeamLogo(name) || (teamId ? getTeamLogo(teamId) : undefined);
  return finalLogo ? (
    <img
      src={finalLogo}
      alt={name}
      className={cn(
        'shrink-0 rounded-md border border-line bg-surface-2 object-cover',
        large ? 'h-14 w-14' : 'h-8 w-8',
      )}
    />
  ) : (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 font-bold tracking-wide text-gold-ink',
        large ? 'h-14 w-14 text-lg' : 'h-8 w-8 text-[11px]',
      )}
    >
      {initialsOf(name)}
    </span>
  );
};

const ResultBadge: React.FC<{ outcome: 'W' | 'D' | 'L' }> = ({ outcome }) => {
  const tone =
    outcome === 'W'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : outcome === 'L'
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300'
        : 'border-line bg-surface-soft-2 text-ink-muted';
  const label = outcome === 'W' ? 'Won' : outcome === 'L' ? 'Lost' : 'Draw';
  return (
    <span
      className={cn(
        'inline-flex min-w-[54px] items-center justify-center rounded-md border px-2 py-[3px] text-[10px] font-black uppercase tracking-[0.12em]',
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
              <TeamMark name={team.name} logo={team.logo} large teamId={team.id} />
              <div className="min-w-0">
                <h2 className="truncate font-display text-[15px] font-bold tracking-tight text-ink">{team.name}</h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {sportName(team.sportId)} · Short name{' '}
                  <span className="font-mono font-bold uppercase text-gold-ink">{team.shortName || '—'}</span>
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
            <p className="text-[13px] text-ink-muted">
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
              <TableShell minW={900}>
                <THead>
                  <tr>
                    {['Player', 'Jersey', 'Role', 'Position', 'Status', ''].map((heading) => (
                      <Th key={heading}>{heading}</Th>
                    ))}
                  </tr>
                </THead>
                <TBody>
                  {roster.map((player) => {
                    const isCaptain = team.captainId === player.id;
                    const isVice = team.viceCaptainId === player.id;
                    return (
                      <TRow key={player.id}>
                        <Td className="min-w-[200px]">
                          <div className="flex items-center gap-2.5">
                            {player.photo ? (
                              <img
                                src={player.photo}
                                alt={player.name}
                                className="h-8 w-8 shrink-0 rounded-md border border-line bg-surface-2 object-cover"
                              />
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-[11px] font-bold text-gold-ink">
                                {initialsOf(player.name)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <TableLink to={`/admin/players/${player.id}`}>{player.name}</TableLink>
                              {isCaptain && (
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gold-ink">
                                  Captain
                                </span>
                              )}
                              {isVice && (
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-faint">
                                  Vice captain
                                </span>
                              )}
                            </div>
                          </div>
                        </Td>
                        <Td numeric>{player.jerseyNumber ?? '—'}</Td>
                        <Td className="whitespace-nowrap">
                          {String(player.role ?? 'player').replace('_', ' ')}
                        </Td>
                        <Td className="whitespace-nowrap">{player.position || '—'}</Td>
                        <Td>
                          <StatusPill value={player.active !== false ? 'active' : 'inactive'} />
                        </Td>
                        <Td className="whitespace-nowrap text-right">
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
                        </Td>
                      </TRow>
                    );
                  })}
                </TBody>
              </TableShell>
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
            <TableShell minW={900}>
              <THead>
                <tr>
                  {['Match', 'Date', 'Score', 'Status', ''].map((heading) => (
                    <Th key={heading}>{heading}</Th>
                  ))}
                </tr>
              </THead>
              <TBody>
                {teamMatches.map((match) => (
                  <TRow key={match.id}>
                    <Td strong className="min-w-[200px]">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        vs {opponentOf(match)}
                      </span>
                      <SubLine>
                        {match.matchNumber ? `Match #${match.matchNumber} · ` : ''}
                        {sportName(match.sportId)}
                      </SubLine>
                    </Td>
                    <Td className="whitespace-nowrap">{cellDate(match.scheduledAt)}</Td>
                    <Td numeric>{scoreOf(match)}</Td>
                    <Td>
                      <StatusPill value={match.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Btn
                        to={`/admin/matches/${match.id}/scoring`}
                        size="xs"
                        variant="primary"
                        icon={<FiPlay className="h-3 w-3" />}
                      >
                        Open scoring
                      </Btn>
                    </Td>
                  </TRow>
                ))}
              </TBody>
            </TableShell>
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
            <TableShell minW={760}>
              <THead>
                <tr>
                  {['Result', 'Opponent', 'Date', 'Score', 'Sport'].map((heading) => (
                    <Th key={heading}>{heading}</Th>
                  ))}
                </tr>
              </THead>
              <TBody>
                {results.map((match) => (
                  <TRow key={match.id}>
                    <Td>
                      <ResultBadge outcome={outcomeOf(match)} />
                    </Td>
                    <Td strong className="max-w-[240px] truncate">
                      {opponentOf(match)}
                    </Td>
                    <Td className="whitespace-nowrap">{cellDate(match.scheduledAt)}</Td>
                    <Td numeric>{scoreOf(match)}</Td>
                    <Td className="whitespace-nowrap">{sportName(match.sportId)}</Td>
                  </TRow>
                ))}
              </TBody>
            </TableShell>
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
              <TableShell minW={720}>
                <THead>
                  <tr>
                    {['Sport', 'Played', 'Won', 'Drawn', 'Lost', 'GF', 'GA', 'GD'].map((heading) => (
                      <Th key={heading}>{heading}</Th>
                    ))}
                  </tr>
                </THead>
                <TBody>
                  {stats.bySport.map(([sportId, tally]) => (
                    <TRow key={sportId}>
                      <Td strong className="whitespace-nowrap">
                        {sportName(sportId)}
                      </Td>
                      <Td numeric>{tally.played}</Td>
                      <Td numeric className="text-emerald-600 dark:text-emerald-400">
                        {tally.won}
                      </Td>
                      <Td numeric>{tally.drawn}</Td>
                      <Td numeric className="text-rose-600 dark:text-rose-400">
                        {tally.lost}
                      </Td>
                      <Td numeric>{tally.gf}</Td>
                      <Td numeric>{tally.ga}</Td>
                      <Td numeric>
                        {tally.gf - tally.ga > 0 ? '+' : ''}
                        {tally.gf - tally.ga}
                      </Td>
                    </TRow>
                  ))}
                </TBody>
              </TableShell>
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
