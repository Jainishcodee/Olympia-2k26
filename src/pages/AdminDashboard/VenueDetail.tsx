import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { eq, useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { deleteVenue, updateVenue } from '@/services/venues/venueService';
import {
  AdminHeader,
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
import type { Match, Sport, Team, Venue } from '@/types';
import { FiEdit2, FiPlay, FiPower, FiTrash2 } from 'react-icons/fi';
import { cn } from '@/utils/cn';

/** Availability lives on the document as an optional extra field — see VenuesManager. */
type VenueRecord = Venue & { available?: boolean };

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
  if (!date) return '—';
  return `${date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const UPCOMING_STATUSES = ['scheduled', 'upcoming'];

const VenueDetail: React.FC = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();

  const venueDoc = useDoc<VenueRecord>('venues', venueId);
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const matches = useCollection<Match>('matches', {
    constraints: eq('venueId', venueId),
    enabled: Boolean(venueId),
    sortBy: 'scheduledAt',
    direction: 'desc',
  });

  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const venue = venueDoc.data;

  const teamById = useMemo(() => new Map(teams.data.map((team) => [team.id, team])), [teams.data]);

  const sportName = useMemo(() => {
    const map = new Map(sports.data.map((sport) => [sport.id, sport.name]));
    return (id?: string) => (id ? (map.get(id) ?? '—') : '—');
  }, [sports.data]);

  const hostedCount = matches.data.length;
  const upcomingCount = useMemo(
    () => matches.data.filter((match) => UPCOMING_STATUSES.includes(match.status)).length,
    [matches.data],
  );
  const sportCount = useMemo(
    () => new Set(matches.data.map((match) => match.sportId).filter(Boolean)).size,
    [matches.data],
  );

  const teamName = (id?: string) => (id ? (teamById.get(id)?.name ?? id) : '—');
  const teamsLabel = (match: Match): string => {
    const a = match.participantA?.name || teamName(match.teamAId);
    const b = match.participantB?.name || teamName(match.teamBId);
    return `${a} vs ${b}`;
  };

  const setEnabled = async (enabled: boolean) => {
    if (!venueId || !venue || busy) return;
    setBusy(true);
    try {
      const patch: Partial<VenueRecord> = { active: enabled };
      await updateVenue(venueId, patch);
      await log('VENUE_UPDATED', 'venue', venueId, {
        label: `${venue.name} ${enabled ? 'enabled' : 'disabled'}`,
      });
      toast.success(`${venue.name} ${enabled ? 'enabled' : 'disabled'}`);
      setConfirmDisable(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!venueId || !venue || busy) return;
    setBusy(true);
    try {
      await deleteVenue(venueId);
      await log('VENUE_DELETED', 'venue', venueId, {
        label: `Deleted venue ${venue.name}`,
      });
      toast.success(`Deleted ${venue.name}`);
      navigate('/admin/venues');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  /* ------------------------------------------------------------- guards */

  if (!venueDoc.isReady) return <PageLoading label="Loading venue…" />;

  if (venueDoc.error) {
    return (
      <>
        <AdminHeader title="Venue" breadcrumbs={[{ label: 'Venues', to: '/admin/venues' }]} />
        <ErrorNotice message={venueDoc.error} />
      </>
    );
  }

  if (!venueId || !venue) {
    return (
      <>
        <AdminHeader title="Venue" breadcrumbs={[{ label: 'Venues', to: '/admin/venues' }]} />
        <EmptyNotice
          title="Venue not found"
          message="This venue document no longer exists in Firestore."
          action={<Btn to="/admin/venues">Back to venues</Btn>}
        />
      </>
    );
  }

  const active = venue.active !== false;
  const available = venue.available !== false;

  return (
    <>
      <AdminHeader
        title={venue.name}
        subtitle={venue.location || 'Location not set'}
        breadcrumbs={[{ label: 'Venues', to: '/admin/venues' }, { label: venue.name }]}
        badge={<StatusPill value={active ? 'active' : 'disabled'} />}
        actions={
          <>
            <Btn to={`/admin/venues/${venueId}/edit`} icon={<FiEdit2 className="h-4 w-4" />}>
              Edit
            </Btn>
            {active ? (
              <Btn
                variant="secondary"
                icon={<FiPower className="h-4 w-4" />}
                disabled={busy}
                onClick={() => setConfirmDisable(true)}
              >
                Disable
              </Btn>
            ) : (
              <Btn
                variant="secondary"
                icon={<FiPower className="h-4 w-4" />}
                disabled={busy}
                onClick={() => setEnabled(true)}
              >
                Enable
              </Btn>
            )}
            <Btn
              variant="danger"
              icon={<FiTrash2 className="h-4 w-4" />}
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Btn>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Capacity"
          value={Number(venue.capacity ?? 0).toLocaleString()}
          accent="blue"
        />
        <StatTile
          label="Matches hosted"
          value={hostedCount}
          isLoading={matches.isLoading}
        />
        <StatTile
          label="Upcoming matches"
          value={upcomingCount}
          accent="gold"
          isLoading={matches.isLoading}
        />
        <StatTile
          label="Sports played here"
          value={sportCount}
          isLoading={matches.isLoading}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Venue details" className="lg:col-span-1">
          <dl>
            <MetaRow label="Location">{venue.location || '—'}</MetaRow>
            <MetaRow label="Capacity">{Number(venue.capacity ?? 0).toLocaleString()}</MetaRow>
            <MetaRow label="Available">{available ? 'Yes' : 'No — unavailable'}</MetaRow>
            <MetaRow label="Enabled">{active ? 'Yes' : 'No — disabled'}</MetaRow>
            <MetaRow label="Description">{venue.description || '—'}</MetaRow>
          </dl>
          {venue.image && (
            <img
              src={venue.image}
              alt={venue.name}
              className={cn('mt-4 h-40 w-full rounded-md border object-cover', isDay ? 'border-slate-200' : 'border-white/10')}
            />
          )}
        </Card>

        <Card title="Matches at this venue" hint={`${hostedCount} scheduled or played`} className="lg:col-span-2" flush>
          {matches.isLoading ? (
            <LoadingRows rows={5} cols={5} />
          ) : matches.error ? (
            <div className="p-4">
              <ErrorNotice message={matches.error} />
            </div>
          ) : matches.data.length === 0 ? (
            <EmptyNotice
              title="No matches at this venue"
              message="Pick this venue when creating a match and it will show up here."
              action={<Btn to="/admin/matches/create">Create match</Btn>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]')}>
                    {['Date', 'Sport', 'Teams', 'Status', ''].map((heading) => (
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
                      <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                        {cellDate(match.scheduledAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <Link
                          to={`/admin/matches/${match.id}`}
                          className={cn('block text-[13px] font-medium transition-colors hover:text-[#1264FF]', isDay ? 'text-slate-700' : 'text-slate-200')}
                        >
                          {sportName(match.sportId)}
                        </Link>
                        <span className={cn('block font-mono text-[11px]', isDay ? 'text-slate-400' : 'text-slate-500')}>
                          {match.matchNumber ? `#${match.matchNumber}` : '—'}
                        </span>
                      </td>
                      <td className={cn('max-w-[260px] truncate px-3 py-2.5 text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-slate-100')}>
                        {teamsLabel(match)}
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
      </div>

      <ConfirmDialog
        isOpen={confirmDisable}
        title="Disable this venue?"
        message={`${venue.name} will be hidden from scheduling. Nothing is deleted — matches already scheduled here keep their venue.`}
        confirmText="Disable"
        isDestructive
        onConfirm={() => setEnabled(false)}
        onCancel={() => setConfirmDisable(false)}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        title={`Delete venue "${venue.name}"?`}
        message="This will permanently delete this venue record from Firestore in real-time."
        confirmText="Delete venue"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};

export default VenueDetail;
