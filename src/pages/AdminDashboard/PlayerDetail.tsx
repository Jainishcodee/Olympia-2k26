import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection, useDoc, eq } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { deletePlayer } from '@/services/players/playerService';
import {
  AdminHeader,
  AdminTabs,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  MetaRow,
  PageLoading,
  StatTile,
  StatusPill,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { cn } from '@/utils/cn';
import type { Match, Player, PlayerStats, Rating, Sport, Team } from '@/types';
import { FiEdit2, FiPlay, FiTrash2, FiUsers } from 'react-icons/fi';

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const roleLabel = (role?: string): string =>
  (role || 'player').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const EMPTY_STATS: PlayerStats = {
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
  runs: 0,
  wickets: 0,
  points: 0,
  wins: 0,
  losses: 0,
  rating: 0,
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

const PlayerDetail: React.FC = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const playerDoc = useDoc<Player>('players', playerId);
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const players = useCollection<Player>('players', { sortBy: 'name' });
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const ratings = useCollection<Rating>('ratings', {
    constraints: eq('playerId', playerId),
    enabled: Boolean(playerId),
  });

  const [tab, setTab] = useState<string>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const player = playerDoc.data;

  const handleDelete = async () => {
    if (!playerId || !player || busy) return;
    setBusy(true);
    try {
      await deletePlayer(playerId);
      await log('PLAYER_DELETED', 'player', playerId, { label: player.name });
      toast.success(`${player.name} deleted`);
      setShowDeleteConfirm(false);
      navigate('/admin/players');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const teamById = useMemo(() => new Map(teams.data.map((team) => [team.id, team])), [teams.data]);
  const sportNames = useMemo(() => {
    const map = new Map(sports.data.map((sport) => [sport.id, sport.name]));
    return (id?: string) => (id ? (map.get(id) ?? '—') : '—');
  }, [sports.data]);

  const team = player ? teamById.get(player.teamId) : undefined;
  const sportId = player?.sportId || team?.sportId || '';

  const squadMates = useMemo(
    () =>
      player && player.teamId
        ? players.data.filter((row) => row.teamId === player.teamId && row.id !== player.id)
        : [],
    [players.data, player],
  );

  const teamMatches = useMemo(
    () =>
      player && player.teamId
        ? matches.data.filter(
            (match) => match.teamAId === player.teamId || match.teamBId === player.teamId,
          )
        : [],
    [matches.data, player],
  );

  const opponentOf = (match: Match): string => {
    if (!player) return '—';
    const isHome = match.teamAId === player.teamId;
    const named = isHome ? match.participantB?.name : match.participantA?.name;
    if (named) return named;
    const otherId = isHome ? match.teamBId : match.teamAId;
    return (otherId && teamById.get(otherId)?.name) || otherId || '—';
  };

  const scoreOf = (match: Match): string =>
    `${Number(match.score?.teamA ?? 0)} – ${Number(match.score?.teamB ?? 0)}`;

  const ratingSummary = useMemo(() => {
    const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    ratings.data.forEach((row) => {
      const raw = Number(row.score ?? 0);
      if (!Number.isFinite(raw)) return;
      sum += raw;
      const bucket = Math.min(5, Math.max(1, Math.round(raw)));
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    });
    const count = ratings.data.length;
    return { buckets, count, average: count > 0 ? sum / count : 0 };
  }, [ratings.data]);

  /* ------------------------------------------------------------- guards */

  if (!playerDoc.isReady) return <PageLoading label="Loading player…" />;

  if (playerDoc.error) {
    return (
      <>
        <AdminHeader title="Player" breadcrumbs={[{ label: 'Players', to: '/admin/players' }]} />
        <ErrorNotice message={playerDoc.error} />
      </>
    );
  }

  if (!playerId || !player) {
    return (
      <>
        <AdminHeader title="Player" breadcrumbs={[{ label: 'Players', to: '/admin/players' }]} />
        <EmptyNotice
          title="Player not found"
          message="This player document no longer exists in Firestore."
          action={<Btn to="/admin/players">Back to players</Btn>}
        />
      </>
    );
  }

  const stats = { ...EMPTY_STATS, ...(player.stats ?? {}) };
  const archived = player.active === false;

  const tabItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'team', label: 'Team' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'matches', label: 'Matches', count: teamMatches.length },
    { id: 'ratings', label: 'Ratings', count: ratings.data.length },
  ];

  return (
    <>
      <AdminHeader
        title={player.name}
        subtitle={`${team?.name ?? 'Free agent'} · ${sportNames(sportId)} · ${roleLabel(player.role)}`}
        breadcrumbs={[{ label: 'Players', to: '/admin/players' }, { label: player.name }]}
        badge={<StatusPill value={archived ? 'inactive' : 'active'} />}
        actions={
          <>
            <Btn to={`/admin/players/${playerId}/edit`} icon={<FiEdit2 className="h-4 w-4" />}>
              Edit
            </Btn>
            {player.teamId && (
              <Btn to={`/admin/teams/${player.teamId}/roster`} icon={<FiUsers className="h-4 w-4" />}>
                Team roster
              </Btn>
            )}
            <Btn
              variant="danger"
              icon={<FiTrash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Btn>
          </>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-4">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className={cn('h-16 w-16 shrink-0 rounded-xl border object-cover', isDay ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-800/40')}
            />
          ) : (
            <span className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-bold border', isDay ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-800 bg-slate-800/80 text-slate-200')}>
              {initialsOf(player.name)}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={cn('flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-mono text-sm font-bold tabular-nums border', isDay ? 'border-slate-200 bg-slate-100 text-slate-800' : 'border-slate-800 bg-slate-800 text-slate-100')}>
                {player.jerseyNumber ?? '—'}
              </span>
              <h2 className={cn('truncate text-lg font-bold', isDay ? 'text-slate-900' : 'text-white')}>{player.name}</h2>
            </div>
            <p className={cn('mt-1 text-[13px]', isDay ? 'text-slate-500' : 'text-white/60')}>
              {team ? (
                <Link
                  to={`/admin/teams/${team.id}`}
                  className={cn('font-semibold transition-colors hover:text-blue-600', isDay ? 'text-slate-700' : 'text-white/80')}
                >
                  {team.name}
                </Link>
              ) : (
                <span className={cn('font-semibold', isDay ? 'text-slate-400' : 'text-white/40')}>Free agent</span>
              )}
              <span className={cn('mx-1.5', isDay ? 'text-slate-300' : 'text-white/20')}>·</span>
              {sportNames(sportId)}
              <span className={cn('mx-1.5', isDay ? 'text-slate-300' : 'text-white/20')}>·</span>
              {roleLabel(player.role)}
            </p>
          </div>
          <div className="ml-auto">
            <StatusPill value={archived ? 'inactive' : 'active'} />
          </div>
        </div>
      </Card>

      <AdminTabs items={tabItems} active={tab} onChange={setTab} layoutPrefix="player-tab" />

      {tab === 'profile' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Profile">
            <dl>
              <MetaRow label="Name">{player.name}</MetaRow>
              <MetaRow label="Jersey number">{player.jerseyNumber ?? '—'}</MetaRow>
              <MetaRow label="Gender">{player.gender || '—'}</MetaRow>
              <MetaRow label="Role">{roleLabel(player.role)}</MetaRow>
              <MetaRow label="Position">{player.position || '—'}</MetaRow>
              <MetaRow label="Active">{archived ? 'No — archived' : 'Yes'}</MetaRow>
            </dl>
          </Card>
          <Card title="Team & bio">
            <dl>
              <MetaRow label="Team">{team?.name ?? 'Not assigned'}</MetaRow>
              <MetaRow label="Sport">{sportNames(sportId)}</MetaRow>
              <MetaRow label="Bio">{player.bio || '—'}</MetaRow>
            </dl>
          </Card>
        </div>
      )}

      {tab === 'team' && (
        <div className="space-y-5">
          {team ? (
            <Card title="Current team">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/admin/teams/${team.id}`}
                    className={cn('block text-[15px] font-bold transition-colors hover:text-[#1264FF]', isDay ? 'text-slate-900' : 'text-white')}
                  >
                    {team.name}
                  </Link>
                  <p className={cn('mt-0.5 text-[13px]', isDay ? 'text-slate-500' : 'text-white/60')}>
                    {sportNames(team.sportId)} · {team.shortName || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={team.active !== false ? 'active' : 'inactive'} />
                  <Btn to={`/admin/teams/${team.id}`} variant="primary">
                    Open team
                  </Btn>
                </div>
              </div>
            </Card>
          ) : (
            <Card flush>
              <EmptyNotice
                title="No team assigned"
                message="This player is not on any roster yet."
                action={
                  <Btn to={`/admin/players/${playerId}/edit`} variant="primary">
                    Assign a team
                  </Btn>
                }
              />
            </Card>
          )}

          <Card title="Squad-mates" hint={team ? `${squadMates.length} other players` : undefined} flush>
            {players.isLoading ? (
              <LoadingRows rows={5} cols={4} />
            ) : squadMates.length === 0 ? (
              <EmptyNotice title="No squad-mates" message="Nobody else is on this roster yet." />
            ) : (
              <ul className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
                {squadMates.map((mate) => (
                  <li key={mate.id} className={cn('flex items-center gap-3 px-4 py-2.5 transition-colors', isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]')}>
                    {mate.photo ? (
                      <img
                        src={mate.photo}
                        alt={mate.name}
                        className={cn('h-7 w-7 shrink-0 rounded-md border object-cover', isDay ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.05]')}
                      />
                    ) : (
                      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold border', isDay ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-800 bg-slate-800 text-slate-300')}>
                        {initialsOf(mate.name)}
                      </span>
                    )}
                    <Link
                      to={`/admin/players/${mate.id}`}
                      className={cn('min-w-0 flex-1 truncate text-[13px] font-semibold transition-colors hover:text-blue-600', isDay ? 'text-slate-800' : 'text-white')}
                    >
                      {mate.name}
                    </Link>
                    <span className={cn('font-mono text-[12px] tabular-nums', isDay ? 'text-slate-400' : 'text-white/40')}>
                      {mate.jerseyNumber ?? '—'}
                    </span>
                    <span className={cn('w-24 truncate text-right text-[12px]', isDay ? 'text-slate-500' : 'text-white/60')}>
                      {mate.position || roleLabel(mate.role)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'statistics' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Matches played" value={stats.matchesPlayed} accent="blue" />
          <StatTile label="Goals" value={stats.goals} accent="gold" />
          <StatTile label="Assists" value={stats.assists} />
          <StatTile label="Runs" value={stats.runs} />
          <StatTile label="Wickets" value={stats.wickets} />
          <StatTile label="Points" value={stats.points} />
          <StatTile label="Wins" value={stats.wins} accent="green" />
          <StatTile label="Losses" value={stats.losses} accent="red" />
          <StatTile
            label="Rating"
            value={
              typeof stats.rating === 'number' && Number.isFinite(stats.rating)
                ? stats.rating.toFixed(1)
                : '—'
            }
            accent="gold"
          />
        </div>
      )}

      {tab === 'matches' && (
        <Card flush>
          {!player.teamId ? (
            <EmptyNotice
              title="No team, no matches"
              message="Matches appear here once this player belongs to a team."
              action={
                <Btn to={`/admin/players/${playerId}/edit`} variant="primary">
                  Assign a team
                </Btn>
              }
            />
          ) : matches.isLoading ? (
            <LoadingRows rows={5} cols={5} />
          ) : teamMatches.length === 0 ? (
            <EmptyNotice
              title="No matches for this team"
              message="Fixtures appear here as soon as the team is added to a match."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
                    {['Opponent', 'Date', 'Score', 'Status', ''].map((heading) => (
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
                      <td className={cn('px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-white')}>
                        vs {opponentOf(match)}
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

      {tab === 'ratings' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <StatTile
              label="Average rating"
              value={ratingSummary.average.toFixed(1)}
              accent="gold"
              hint="out of 5.0"
              isLoading={ratings.isLoading}
            />
            <StatTile
              label="Total ratings"
              value={ratingSummary.count}
              hint={ratingSummary.count === 1 ? '1 response' : `${ratingSummary.count} responses`}
              isLoading={ratings.isLoading}
            />
          </div>

          <Card title="Distribution" className="lg:col-span-2" flush>
            {ratings.isLoading ? (
              <LoadingRows rows={5} cols={3} />
            ) : ratings.error ? (
              <div className="p-4">
                <ErrorNotice message={ratings.error} />
              </div>
            ) : ratingSummary.count === 0 ? (
              <EmptyNotice
                title="No ratings yet"
                message="Public ratings for this player will appear here once fans start rating."
              />
            ) : (
              <div className="space-y-3 p-4">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingSummary.buckets[star] ?? 0;
                  const pct = ratingSummary.count > 0 ? Math.round((count / ratingSummary.count) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className={cn('w-8 shrink-0 text-right text-[11px] font-bold tabular-nums', isDay ? 'text-slate-500' : 'text-white/60')}>
                        {star}★
                      </span>
                      <div className={cn('h-3 flex-1 overflow-hidden rounded-sm', isDay ? 'bg-slate-100' : 'bg-white/10')}>
                        <div
                          className={cn(
                            'h-3 rounded-sm transition-colors',
                            star >= 4 ? 'bg-[#D9A441]' : star === 3 ? 'bg-slate-400' : 'bg-red-400',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={cn('w-20 shrink-0 text-right text-[11px] tabular-nums', isDay ? 'text-slate-400' : 'text-white/40')}>
                        {count} · {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this player?"
        message={
          player
            ? `Are you sure you want to permanently delete "${player.name}"? This action removes the player document from Firestore in real-time.`
            : ''
        }
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

export default PlayerDetail;
