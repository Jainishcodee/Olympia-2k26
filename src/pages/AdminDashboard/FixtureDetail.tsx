import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { deleteFixture } from '@/services/fixtures/fixtureService';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  MetaRow,
  PageLoading,
  StatusPill,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Fixture, Match, Team, Tournament, Venue } from '@/types';
import { FiTrash2 } from 'react-icons/fi';

/* ============================================================================
 *  Fixture detail — read-only record of one scheduled slot: who plays, when,
 *  where, and which match document it is bound to.
 * ==========================================================================*/

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

const renderScore = (match: Match) => {
  const score: { teamA?: number; teamB?: number } | undefined = match.score;
  if (!score) return '—';
  const a = score.teamA;
  const b = score.teamB;
  if (a === undefined && b === undefined) return '—';
  return `${a ?? 0} – ${b ?? 0}`;
};

const FixtureDetail: React.FC = () => {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const fixture = useDoc<Fixture>('fixtures', fixtureId);
  const tournaments = useCollection<Tournament>('tournaments', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const venues = useCollection<Venue>('venues', { sortBy: 'name' });
  const matches = useCollection<Match>('matches');

  const teamName = (id?: string) => {
    if (!id) return '—';
    return teams.data.find((team) => team.id === id)?.name ?? id;
  };
  const tournamentName = (id?: string) =>
    id ? (tournaments.data.find((row) => row.id === id)?.name ?? id) : '—';
  const venueName = (id?: string) =>
    id ? (venues.data.find((row) => row.id === id)?.name ?? id) : '—';

  const handleDelete = async () => {
    if (!fixtureId || busy) return;
    setBusy(true);
    try {
      await deleteFixture(fixtureId);
      await log('FIXTURE_DELETED', 'fixture', fixtureId, {
        label: `Deleted fixture ${fixtureId}`,
      });
      toast.success('Fixture deleted');
      navigate('/admin/fixtures');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  if (fixture.isLoading) return <PageLoading label="Loading fixture…" />;

  if (fixture.error)
    return (
      <>
        <AdminHeader
          title="Fixture"
          breadcrumbs={[{ label: 'Fixtures', to: '/admin/fixtures' }, { label: 'Detail' }]}
          actions={<Btn to="/admin/fixtures">All fixtures</Btn>}
        />
        <ErrorNotice message={fixture.error} />
      </>
    );

  if (!fixture.data)
    return (
      <>
        <AdminHeader
          title="Fixture"
          breadcrumbs={[{ label: 'Fixtures', to: '/admin/fixtures' }, { label: 'Detail' }]}
          actions={<Btn to="/admin/fixtures">All fixtures</Btn>}
        />
        <Card>
          <EmptyNotice
            title="Fixture not found"
            message="This fixture may have been deleted. Return to the board to pick another one."
            action={
              <Btn to="/admin/fixtures" variant="primary">
                Back to fixtures
              </Btn>
            }
          />
        </Card>
      </>
    );

  const row = fixture.data;
  const when = toDate(row.scheduledAt);
  const match = row.matchId
    ? (matches.data.find((candidate) => candidate.id === row.matchId) ?? null)
    : null;
  const sideA = teamName(row.teamAId) !== '—' ? teamName(row.teamAId) : match?.participantA?.name ?? 'TBD';
  const sideB = teamName(row.teamBId) !== '—' ? teamName(row.teamBId) : match?.participantB?.name ?? 'TBD';

  return (
    <>
      <AdminHeader
        title={`${sideA} vs ${sideB}`}
        subtitle={row.round || 'Fixture'}
        breadcrumbs={[
          { label: 'Fixtures', to: '/admin/fixtures' },
          { label: row.round || 'Fixture' },
        ]}
        badge={<StatusPill value={row.status ?? 'scheduled'} />}
        actions={
          <>
            <Btn to="/admin/fixtures">Board</Btn>
            <Btn to={`/admin/fixtures/${row.id}/edit`} variant="secondary">
              Edit
            </Btn>
            {row.matchId && (
              <Btn to={`/admin/matches/${row.matchId}/scoring`} variant="primary">
                Open scoring
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

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Schedule" className="lg:col-span-2">
          <dl>
            <MetaRow label="Tournament">{tournamentName(row.tournamentId)}</MetaRow>
            <MetaRow label="Round">{row.round || '—'}</MetaRow>
            <MetaRow label="Scheduled date">
              {when
                ? when.toLocaleDateString([], {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </MetaRow>
            <MetaRow label="Scheduled time">
              {when
                ? when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </MetaRow>
            <MetaRow label="Venue">{venueName(row.venueId)}</MetaRow>
            <MetaRow label="Order">{row.order ?? '—'}</MetaRow>
            <MetaRow label="Status">{row.status ?? 'scheduled'}</MetaRow>
          </dl>
        </Card>

        <Card title="Participants">
          <dl>
            <MetaRow label="Team A">{sideA}</MetaRow>
            <MetaRow label="Team B">{sideB}</MetaRow>
            <MetaRow label="Team A id">{row.teamAId || '—'}</MetaRow>
            <MetaRow label="Team B id">{row.teamBId || '—'}</MetaRow>
          </dl>
          <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-line bg-surface-soft px-4 py-4">
            <span className="min-w-0 flex-1 truncate text-right text-[13px] font-semibold text-ink">
              {sideA}
            </span>
            <span className="rounded-md border border-[#D9A441]/30 bg-[#D9A441]/12 px-2.5 py-1 font-mono text-[12.5px] font-bold text-gold-ink">
              VS
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
              {sideB}
            </span>
          </div>
        </Card>
      </div>

      <Card title="Linked match" className="mt-5">
        {row.matchId ? (
          match ? (
            <dl>
              <MetaRow label="Match">#{match.matchNumber ?? '—'}</MetaRow>
              <MetaRow label="Match status">{match.status}</MetaRow>
              <MetaRow label="Final score">{renderScore(match)}</MetaRow>
              <MetaRow label="Match id">{match.id}</MetaRow>
            </dl>
          ) : (
            <EmptyNotice
              title="Linked match is missing"
              message={`No match document exists with id "${row.matchId}".`}
            />
          )
        ) : (
          <EmptyNotice
            title="No match linked"
            message="This fixture is a scheduling slot only. Edit it to bind it to a match."
          />
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {row.matchId && match && (
            <Btn to={`/admin/matches/${match.id}`} variant="secondary">
              Match detail
            </Btn>
          )}
          {row.matchId && (
            <Btn to={`/admin/matches/${row.matchId}/scoring`} variant="primary">
              Open scoring console
            </Btn>
          )}
        </div>
      </Card>

      <Card title="Record" className="mt-5">
        <dl>
          <MetaRow label="Fixture id">{row.id}</MetaRow>
          <MetaRow label="Tournament id">{row.tournamentId || '—'}</MetaRow>
          <MetaRow label="Venue id">{row.venueId || '—'}</MetaRow>
          <MetaRow label="Created">
            {toDate(row.createdAt)
              ? toDate(row.createdAt)?.toLocaleString([], {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </MetaRow>
        </dl>
      </Card>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this fixture?"
        message="This will permanently delete this fixture schedule entry from Firestore in real-time."
        confirmText="Delete fixture"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};

export default FixtureDetail;
