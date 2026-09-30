import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eq, useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AdminHeader,
  AdminTabs,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FormGrid,
  LoadingRows,
  MetaRow,
  PageLoading,
  StatTile,
  StatusPill,
  Toggle,
} from '@/components/admin/kit';
import FormField from '@/components/admin/FormField';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAuditLog } from '@/hooks/useAuditLog';
import { deleteSport, updateSport } from '@/services/sports/sportService';
import type { Match, Player, ScoringType, Sport, Team, Venue } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiLock, FiTrash2 } from 'react-icons/fi';

/* ============================================================================
 *  Sport detail — identity, the on/off switch, and every piece of data that
 *  hangs off this discipline: matches, teams, players and the venues they
 *  actually played in.
 * ==========================================================================*/

const SCORING_TYPES: ScoringType[] = [
  'goals',
  'runs',
  'sets_points',
  'games_points',
  'rounds',
  'race',
  'result',
  'configurable',
];

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

const dateOf = (value: unknown) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const SportDetail: React.FC = () => {
  const { sportId } = useParams<{ sportId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();
  const [tab, setTab] = useState('matches');
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const sport = useDoc<Sport>('sports', sportId);
  const matches = useCollection<Match>('matches', {
    constraints: eq('sportId', sportId),
    enabled: Boolean(sportId),
    sortBy: 'scheduledAt',
    direction: 'desc',
  });
  const teams = useCollection<Team>('teams', {
    constraints: eq('sportId', sportId),
    enabled: Boolean(sportId),
    sortBy: 'name',
  });
  const players = useCollection<Player>('players', {
    constraints: eq('sportId', sportId),
    enabled: Boolean(sportId),
    sortBy: 'name',
  });
  const venues = useCollection<Venue>('venues', { sortBy: 'name' });

  const teamNames = useMemo(() => new Map(teams.data.map((row) => [row.id, row.name])), [teams.data]);

  const venuesInUse = useMemo(() => {
    const counts = new Map<string, number>();
    matches.data.forEach((match) => {
      if (match.venueId) counts.set(match.venueId, (counts.get(match.venueId) ?? 0) + 1);
    });
    return venues.data
      .filter((venue) => counts.has(venue.id))
      .map((venue) => ({ venue, count: counts.get(venue.id) ?? 0 }));
  }, [matches.data, venues.data]);

  const writeActive = async (next: boolean, target: Sport) => {
    setBusy(true);
    try {
      await updateSport(target.id, { active: next });
      await log(next ? 'SPORT_UPDATED' : 'SPORT_DISABLED', 'sport', target.id, {
        label: target.name,
        metadata: { active: next },
      });
      toast.success(next ? `${target.name} enabled` : `${target.name} disabled`);
      setConfirmDisable(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (target: Sport) => {
    setBusy(true);
    try {
      await deleteSport(target.id);
      await log('SPORT_DELETED', 'sport', target.id, {
        label: `Deleted sport ${target.name}`,
      });
      toast.success(`Deleted ${target.name}`);
      navigate('/admin/sports');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const onToggle = (next: boolean, target: Sport) => {
    if (next) {
      void writeActive(true, target);
      return;
    }
    setConfirmDisable(true);
  };

  const error = sport.error ?? matches.error ?? teams.error ?? players.error ?? venues.error;

  if (sport.isLoading) return <PageLoading label="Loading sport…" />;

  if (sport.error)
    return (
      <>
        <AdminHeader
          title="Sport"
          breadcrumbs={[{ label: 'Sports', to: '/admin/sports' }, { label: 'Detail' }]}
          actions={<Btn to="/admin/sports">All sports</Btn>}
        />
        <ErrorNotice message={sport.error} />
      </>
    );

  if (!sport.data)
    return (
      <>
        <AdminHeader
          title="Sport"
          breadcrumbs={[{ label: 'Sports', to: '/admin/sports' }, { label: 'Detail' }]}
          actions={<Btn to="/admin/sports">All sports</Btn>}
        />
        <Card>
          <EmptyNotice
            title="Sport not found"
            message="This discipline may have been removed from the registry."
            action={
              <Btn to="/admin/sports" variant="primary">
                Back to sports
              </Btn>
            }
          />
        </Card>
      </>
    );

  const row = sport.data;
  const icon = row.icon ?? '';
  const isImage = /^(https?:|data:)/.test(icon);

  const tabs = [
    { id: 'matches', label: 'Matches', count: matches.data.length },
    { id: 'teams', label: 'Teams', count: teams.data.length },
    { id: 'players', label: 'Players', count: players.data.length },
    { id: 'venues', label: 'Venues in use', count: venuesInUse.length },
  ];

  const renderMatches = () =>
    matches.isLoading ? (
      <LoadingRows rows={5} cols={5} />
    ) : matches.data.length === 0 ? (
      <EmptyNotice
        title="No matches for this sport"
        message="Matches assigned to this discipline appear here with their schedule and status."
        action={<Btn to="/admin/matches/create">Create match</Btn>}
      />
    ) : (
      <Card title="Matches" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]')}>
                {['Match', 'Teams / Players', 'Date', 'Status', ''].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      'whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider',
                      isDay ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
              {matches.data.map((match) => (
                <tr key={match.id} className={cn('transition-colors', isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]')}>
                  <td className={cn('px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums', isDay ? 'text-slate-700' : 'text-slate-300')}>
                    #{match.matchNumber ?? '—'}
                  </td>
                  <td className={cn('max-w-[300px] truncate px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-slate-100')}>
                    {match.participantA?.name ?? match.teamAId ?? 'TBD'} vs{' '}
                    {match.participantB?.name ?? match.teamBId ?? 'TBD'}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {dateOf(match.scheduledAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusPill value={match.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Btn size="xs" to={`/admin/matches/${match.id}`}>
                        View
                      </Btn>
                      <Btn size="xs" variant="primary" to={`/admin/matches/${match.id}/scoring`}>
                        Scoring
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

  const renderTeams = () =>
    teams.isLoading ? (
      <LoadingRows rows={5} cols={5} />
    ) : teams.data.length === 0 ? (
      <EmptyNotice
        title="No teams for this sport"
        message="Teams registered against this discipline appear here."
        action={<Btn to="/admin/teams">Open teams</Btn>}
      />
    ) : (
      <Card title="Teams" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]')}>
                {['Team', 'Short name', 'Players', 'Status', ''].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      'whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider',
                      isDay ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
              {teams.data.map((team) => (
                <tr key={team.id} className={cn('transition-colors', isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]')}>
                  <td className={cn('px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-slate-100')}>
                    {team.name}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {team.shortName || '—'}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {team.playerIds?.length ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusPill value={team.active ? 'active' : 'inactive'} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <Btn size="xs" to={`/admin/teams/${team.id}`}>
                      View
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

  const renderPlayers = () =>
    players.isLoading ? (
      <LoadingRows rows={5} cols={5} />
    ) : players.data.length === 0 ? (
      <EmptyNotice
        title="No players for this sport"
        message="Players are scoped by sport through their team registration."
        action={<Btn to="/admin/players">Open players</Btn>}
      />
    ) : (
      <Card title="Players" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]')}>
                {['Player', '#', 'Team', 'Role', ''].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      'whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider',
                      isDay ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
              {players.data.map((player) => (
                <tr key={player.id} className={cn('transition-colors', isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]')}>
                  <td className={cn('px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-slate-100')}>
                    {player.name}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {player.jerseyNumber || '—'}
                  </td>
                  <td className={cn('max-w-[200px] truncate px-3 py-2.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {teamNames.get(player.teamId) ?? player.teamId ?? '—'}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 text-[13px] capitalize', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {player.role?.replace('_', ' ') ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <Btn size="xs" to={`/admin/players/${player.id}`}>
                      View
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

  const renderVenues = () =>
    venues.isLoading || matches.isLoading ? (
      <LoadingRows rows={5} cols={4} />
    ) : venuesInUse.length === 0 ? (
      <EmptyNotice
        title="No venues in use"
        message="Venues show up here once a match in this sport is scheduled at them."
        action={<Btn to="/admin/venues">Open venues</Btn>}
      />
    ) : (
      <Card title="Venues in use" hint="Derived from the venue of every match in this sport" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]')}>
                {['Venue', 'Location', 'Capacity', 'Matches here', ''].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      'whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider',
                      isDay ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
              {venuesInUse.map(({ venue, count }) => (
                <tr key={venue.id} className={cn('transition-colors', isDay ? 'hover:bg-slate-50/70' : 'hover:bg-white/[0.03]')}>
                  <td className={cn('px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-slate-100')}>
                    {venue.name}
                  </td>
                  <td className={cn('max-w-[220px] truncate px-3 py-2.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {venue.location || '—'}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-600' : 'text-slate-400')}>
                    {venue.capacity ?? '—'}
                  </td>
                  <td className={cn('whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums', isDay ? 'text-slate-700' : 'text-amber-400')}>
                    {count}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <Btn size="xs" to={`/admin/venues/${venue.id}`}>
                      View
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

  const renderTab = () => {
    switch (tab) {
      case 'teams':
        return renderTeams();
      case 'players':
        return renderPlayers();
      case 'venues':
        return renderVenues();
      default:
        return renderMatches();
    }
  };

  return (
    <>
      <AdminHeader
        title={row.name}
        subtitle={row.description || 'Discipline record, roster scope and the matches it has produced.'}
        breadcrumbs={[{ label: 'Sports', to: '/admin/sports' }, { label: row.name }]}
        badge={<StatusPill value={row.active ? 'active' : 'disabled'} />}
        actions={
          <>
            <Btn to="/admin/sports">All sports</Btn>
            <Btn variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Btn>
            {row.active ? (
              <Btn variant="secondary" onClick={() => setConfirmDisable(true)} icon={<FiLock className="h-4 w-4" />}>
                Disable
              </Btn>
            ) : (
              <Btn variant="secondary" onClick={() => writeActive(true, row)} disabled={busy}>
                Enable
              </Btn>
            )}
            <Btn
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              icon={<FiTrash2 className="h-4 w-4" />}
            >
              Delete
            </Btn>
          </>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Discipline" className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border text-3xl',
                isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]'
              )}
            >
              {isImage ? <img src={icon} alt="" className="h-full w-full rounded-lg object-cover" /> : icon || '•'}
            </span>
            <div className="min-w-0">
              <p className={cn('text-lg font-bold', isDay ? 'text-slate-900' : 'text-white')}>{row.name}</p>
              <p className={cn('mt-1 text-[13px] leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>
                {row.description || 'No description yet.'}
              </p>
            </div>
          </div>

          <dl className="mt-4">
            <MetaRow label="Scoring type">{String(row.scoringType ?? '—').replace(/_/g, ' ')}</MetaRow>
            <MetaRow label="Team based">{row.teamBased ? 'Yes' : 'No'}</MetaRow>
            <MetaRow label="Players per team">
              {row.minPlayersPerTeam ?? '—'} – {row.maxPlayersPerTeam ?? '—'}
            </MetaRow>
            <MetaRow label="Slug">{row.slug}</MetaRow>
            <MetaRow label="Sport id">{row.id}</MetaRow>
          </dl>

          <div className={cn('mt-3 border-t', isDay ? 'border-slate-100' : 'border-white/5')}>
            <Toggle
              checked={Boolean(row.active)}
              onChange={(next) => onToggle(next, row)}
              label="Sport active"
              hint="Active sports are offered when matches, teams and players are created."
              disabled={busy}
            />
          </div>
        </Card>

        <Card title="Status">
          <div className={cn('rounded-lg border px-4 py-4 text-center', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]')}>
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Currently
            </span>
            <span className="mt-2 block">
              <StatusPill value={row.active ? 'active' : 'disabled'} />
            </span>
          </div>
          {matches.data.length > 0 && (
            <div className={cn(
              'mt-3 flex items-start gap-2 rounded-lg border px-3 py-3 text-[12px] leading-relaxed',
              isDay ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-amber-500/20 bg-amber-950/20 text-amber-300'
            )}>
              <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                {matches.data.length} recorded{' '}
                {matches.data.length === 1 ? 'match' : 'matches'} depend on this sport.
              </span>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Matches"
          value={matches.data.length}
          accent="blue"
          isLoading={matches.isLoading}
        />
        <StatTile label="Teams" value={teams.data.length} accent="gold" isLoading={teams.isLoading} />
        <StatTile
          label="Players"
          value={players.data.length}
          accent="slate"
          isLoading={players.isLoading}
        />
        <StatTile
          label="Venues in use"
          value={venuesInUse.length}
          accent="green"
          isLoading={venues.isLoading || matches.isLoading}
        />
      </div>

      <div className="mt-5">
        <AdminTabs items={tabs} active={tab} onChange={setTab} layoutPrefix="sport-tab" />
        {renderTab()}
      </div>

      <ConfirmDialog
        isOpen={confirmDisable}
        title="Disable this sport?"
        message={`${row.name} will be hidden from new match creation. ${
          matches.data.length
        } recorded match(es), teams and players stay in Firestore untouched — nothing is deleted, and you can re-enable at any time.`}
        confirmText={busy ? 'Disabling…' : 'Disable sport'}
        isDestructive
        onConfirm={() => writeActive(false, row)}
        onCancel={() => setConfirmDisable(false)}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        title={`Delete sport "${row.name}"?`}
        message={`This will permanently delete this sport from Firestore in real-time.${matches.data.length > 0 ? ` Note: ${matches.data.length} existing matches reference this sport.` : ''}`}
        confirmText={busy ? 'Deleting…' : 'Delete sport'}
        isDestructive
        onConfirm={() => handleDelete(row)}
        onCancel={() => setConfirmDelete(false)}
      />

      {editing && (
        <SportEditModal
          sport={row}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </>
  );
};

/* --------------------------------------------------------------- edit modal */

const SportEditModal: React.FC<{
  sport: Sport;
  onClose: () => void;
  onSaved: () => void;
}> = ({ sport, onClose, onSaved }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();
  const [name, setName] = useState(sport.name);
  const [icon, setIcon] = useState(sport.icon ?? '');
  const [description, setDescription] = useState(sport.description ?? '');
  const [scoringType, setScoringType] = useState<ScoringType>(sport.scoringType);
  const [teamBased, setTeamBased] = useState(sport.teamBased);
  const [minPlayers, setMinPlayers] = useState(String(sport.minPlayersPerTeam ?? 1));
  const [maxPlayers, setMaxPlayers] = useState(String(sport.maxPlayersPerTeam ?? 11));
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const save = async () => {
    setSubmitted(true);
    if (!name.trim()) {
      toast.error('Sport name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateSport(sport.id, {
        name: name.trim(),
        icon: icon.trim(),
        description,
        scoringType,
        teamBased,
        minPlayersPerTeam: Number(minPlayers) || 0,
        maxPlayersPerTeam: Number(maxPlayers) || 0,
      });
      await log('SPORT_UPDATED', 'sport', sport.id, { label: name.trim() });
      toast.success('Sport updated');
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
        <div className="fixed inset-0 bg-slate-900/60" aria-hidden="true" onClick={onClose} />
        <div className={cn(
          'relative w-full max-w-xl rounded-lg text-left shadow-xl border',
          isDay ? 'bg-white border-slate-200' : 'bg-[#0B1528] border-white/10 text-white'
        )}>
          <header className={cn('flex items-center justify-between gap-3 border-b px-5 py-3', isDay ? 'border-slate-200' : 'border-white/10')}>
            <div className="min-w-0">
              <h3 className={cn('truncate text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>Edit sport</h3>
              <p className="truncate text-[11px] text-slate-400">
                {sport.slug} · id {sport.id}
              </p>
            </div>
            <Btn size="xs" variant="ghost" onClick={onClose}>
              Close
            </Btn>
          </header>

          <div className="px-5 py-4">
            <FormGrid cols={2}>
              <FormField
                label="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={submitted && !name.trim() ? 'Sport name is required.' : undefined}
              />
              <FormField
                label="Icon"
                placeholder="Emoji or image URL"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                helpText="Emoji for tiles, or a full image URL."
              />
              <FormField
                as="select"
                label="Scoring type"
                value={scoringType}
                onChange={(e) => setScoringType(e.target.value as ScoringType)}
                options={SCORING_TYPES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
              />
              <FormField
                label="Min players"
                type="number"
                min={1}
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
              />
              <FormField
                label="Max players"
                type="number"
                min={1}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
              />
            </FormGrid>

            <FormField
              as="textarea"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className={cn('border-t pt-3', isDay ? 'border-slate-100' : 'border-white/5')}>
              <Toggle
                checked={teamBased}
                onChange={setTeamBased}
                label="Team based"
                hint="Off means individuals compete (chess, carrom, racing)."
              />
            </div>
          </div>

          <footer className={cn('flex items-center justify-end gap-2 border-t px-5 py-3', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]')}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Btn>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SportDetail;
