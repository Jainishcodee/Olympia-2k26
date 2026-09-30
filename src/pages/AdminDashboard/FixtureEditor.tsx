import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FormGrid,
  FormSection,
  PageLoading,
} from '@/components/admin/kit';
import FormField from '@/components/admin/FormField';
import { useAuditLog } from '@/hooks/useAuditLog';
import { createFixture, updateFixture } from '@/services/fixtures/fixtureService';
import type { Fixture, Match, Team, Tournament, Venue } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Fixture editor — one screen, two modes: link the fixture to an existing
 *  match, or pick the two participants directly. Nothing is written until the
 *  form validates.
 * ==========================================================================*/

interface FixtureForm {
  tournamentId: string;
  round: string;
  mode: 'match' | 'teams';
  matchId: string;
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venueId: string;
  status: string;
  order: string;
}

const EMPTY: FixtureForm = {
  tournamentId: '',
  round: '',
  mode: 'teams',
  matchId: '',
  teamAId: '',
  teamBId: '',
  date: '',
  time: '10:00',
  venueId: '',
  status: 'scheduled',
  order: '1',
};

const toInputDate = (value: unknown): { date: string; time: string } => {
  if (!value) return { date: '', time: '10:00' };
  const date =
    value instanceof Date
      ? value
      : typeof (value as { toDate?: () => Date }).toDate === 'function'
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return { date: '', time: '10:00' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

const STATUS_OPTIONS = ['scheduled', 'upcoming', 'live', 'completed', 'cancelled'];

const FixtureEditor: React.FC = () => {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const isEdit = Boolean(fixtureId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();

  const tournaments = useCollection<Tournament>('tournaments', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const venues = useCollection<Venue>('venues', { sortBy: 'name' });
  const matches = useCollection<Match>('matches', { sortBy: 'matchNumber' });
  const existing = useDoc<Fixture>('fixtures', fixtureId);

  const [form, setForm] = useState<FixtureForm>(() => ({
    ...EMPTY,
    tournamentId: searchParams.get('tournament') ?? '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing.data) return;
    const fixture = existing.data;
    const when = toInputDate(fixture.scheduledAt);
    setForm({
      tournamentId: fixture.tournamentId ?? '',
      round: fixture.round ?? '',
      mode: fixture.matchId ? 'match' : 'teams',
      matchId: fixture.matchId ?? '',
      teamAId: fixture.teamAId ?? '',
      teamBId: fixture.teamBId ?? '',
      date: when.date,
      time: when.time,
      venueId: fixture.venueId ?? '',
      status: fixture.status ?? 'scheduled',
      order: String(fixture.order ?? 1),
    });
  }, [existing.data]);

  const set = <K extends keyof FixtureForm>(key: K, value: FixtureForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const linkedMatch = useMemo(
    () => matches.data.find((match) => match.id === form.matchId),
    [matches.data, form.matchId],
  );

  const errors = useMemo(() => {
    const found: Record<string, string> = {};
    if (!form.tournamentId) found.tournamentId = 'Select a tournament.';
    if (form.mode === 'match') {
      if (!form.matchId) found.participants = 'Select the linked match.';
    } else if (!form.teamAId || !form.teamBId) {
      found.participants = 'Select both participants.';
    } else if (form.teamAId === form.teamBId) {
      found.participants = 'Both participants must be different.';
    }
    if (!form.date) {
      found.date = 'Pick a scheduled date.';
    } else {
      const parsed = new Date(`${form.date}T${form.time || '00:00'}`);
      if (Number.isNaN(parsed.getTime())) found.date = 'That date is not valid.';
    }
    return found;
  }, [form]);

  const save = async () => {
    setSubmitted(true);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }
    setSaving(true);
    try {
      const when = Timestamp.fromDate(new Date(`${form.date}T${form.time || '00:00'}`));
      const shared = {
        tournamentId: form.tournamentId,
        round: form.round.trim(),
        matchId: form.mode === 'match' ? form.matchId : '',
        order: Number(form.order) || 0,
        teamAId: linkedMatch?.teamAId || form.teamAId,
        teamBId: linkedMatch?.teamBId || form.teamBId,
        scheduledAt: when,
        venueId: form.venueId,
        status: form.status || 'scheduled',
      };
      const summary = `${shared.round || 'Fixture'} · ${new Date(
        `${form.date}T${form.time || '00:00'}`,
      ).toLocaleDateString([], { day: '2-digit', month: 'short' })}`;

      if (isEdit && fixtureId) {
        await updateFixture(fixtureId, shared);
        await log('FIXTURE_UPDATED', 'fixture', fixtureId, { label: summary });
        toast.success('Fixture updated');
        navigate('/admin/fixtures');
      } else {
        const newId = await createFixture({ ...shared, createdAt: Timestamp.now() });
        await log('FIXTURE_CREATED', 'fixture', newId, { label: summary });
        toast.success('Fixture created');
        navigate('/admin/fixtures');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && existing.isLoading) return <PageLoading label="Loading fixture…" />;
  if (isEdit && existing.error)
    return (
      <div className="py-10">
        <ErrorNotice message={existing.error} />
        <div className="mt-4">
          <Btn to="/admin/fixtures">Back to fixtures</Btn>
        </div>
      </div>
    );
  if (isEdit && !existing.data)
    return (
      <div className="py-10">
        <EmptyNotice
          title="Fixture not found"
          message={`No fixture exists with id "${fixtureId}".`}
          action={
            <Btn to="/admin/fixtures" variant="primary">
              Back to fixtures
            </Btn>
          }
        />
      </div>
    );

  const tournament = tournaments.data.find((row) => row.id === form.tournamentId);

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Edit fixture' : 'Create fixture'}
        subtitle={
          isEdit
            ? 'Change the round, participants, schedule or venue. Order can be nudged from the fixtures board.'
            : 'Place a match in the public schedule. A fixture can be linked to a real match or to two teams directly.'
        }
        breadcrumbs={[{ label: 'Fixtures', to: '/admin/fixtures' }, { label: isEdit ? 'Edit' : 'Create' }]}
        actions={<Btn to="/admin/fixtures">Cancel</Btn>}
      />

      <Card flush>
        <FormSection
          step="1"
          title="Competition"
          description="Where this fixture sits in the event structure."
        >
          <FormGrid cols={2}>
            <FormField
              as="select"
              label="Tournament"
              required
              value={form.tournamentId}
              onChange={(e) => set('tournamentId', e.target.value)}
              error={submitted ? errors.tournamentId : undefined}
              options={[
                { value: '', label: 'Select a tournament' },
                ...tournaments.data.map((row) => ({ value: row.id, label: row.name })),
              ]}
            />
            <FormField
              label="Round"
              placeholder="e.g. Semifinal, Group A, League round 4"
              value={form.round}
              onChange={(e) => set('round', e.target.value)}
              helpText="Fixtures are grouped and ordered by round on the board."
            />
          </FormGrid>
        </FormSection>

        <FormSection
          step="2"
          title="Participants"
          description="Link the fixture to a match, or pick the two sides yourself."
        >
          <div className={cn(
            'mb-4 inline-flex rounded-md border p-0.5',
            isDay ? 'border-slate-300 bg-slate-50' : 'border-white/10 bg-white/[0.04]'
          )}>
            {(
              [
                { id: 'match', label: 'Linked match' },
                { id: 'teams', label: 'Two teams' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set('mode', option.id)}
                className={cn(
                  'h-8 rounded px-3 text-[11px] font-bold uppercase tracking-wider transition-colors',
                  form.mode === option.id
                    ? isDay ? 'bg-slate-900 text-amber-300' : 'bg-[#071426] text-[#FFD21F] border border-amber-500/30'
                    : isDay ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {form.mode === 'match' ? (
            <FormGrid cols={1}>
              <FormField
                as="select"
                label="Linked match"
                required
                value={form.matchId}
                onChange={(e) => set('matchId', e.target.value)}
                error={submitted ? errors.participants : undefined}
                helpText="The match supplies both participants, the venue and the kick-off time."
                options={[
                  { value: '', label: 'Select a match' },
                  ...matches.data.map((match) => ({
                    value: match.id,
                    label: `#${match.matchNumber ?? '—'} · ${
                      match.participantA?.name ?? (match.teamAId || 'TBD')
                    } vs ${match.participantB?.name ?? (match.teamBId || 'TBD')}`,
                  })),
                ]}
              />
            </FormGrid>
          ) : (
            <FormGrid cols={2}>
              <FormField
                as="select"
                label="Team A"
                required
                value={form.teamAId}
                onChange={(e) => set('teamAId', e.target.value)}
                error={submitted ? errors.participants : undefined}
                options={[
                  { value: '', label: 'Select a team' },
                  ...teams.data.map((team) => ({ value: team.id, label: team.name })),
                ]}
              />
              <FormField
                as="select"
                label="Team B"
                required
                value={form.teamBId}
                onChange={(e) => set('teamBId', e.target.value)}
                options={[
                  { value: '', label: 'Select a team' },
                  ...teams.data.map((team) => ({ value: team.id, label: team.name })),
                ]}
              />
            </FormGrid>
          )}
        </FormSection>

        <FormSection
          step="3"
          title="Schedule & venue"
          description="Local time on event day."
        >
          <FormGrid cols={3}>
            <FormField
              type="date"
              label="Date"
              required
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              error={submitted ? errors.date : undefined}
            />
            <FormField
              type="time"
              label="Time"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
            />
            <FormField
              as="select"
              label="Venue"
              value={form.venueId}
              onChange={(e) => set('venueId', e.target.value)}
              options={[
                { value: '', label: 'No venue yet' },
                ...venues.data.map((venue) => ({ value: venue.id, label: venue.name })),
              ]}
            />
          </FormGrid>
        </FormSection>

        <FormSection step="4" title="Status & order" description="Board presentation.">
          <FormGrid cols={3}>
            <FormField
              as="select"
              label="Status"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              options={STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1),
              }))}
            />
            <FormField
              type="number"
              label="Order"
              min={0}
              value={form.order}
              onChange={(e) => set('order', e.target.value)}
              helpText="Sort position inside its round."
            />
          </FormGrid>

          {submitted && Object.keys(errors).length > 0 && (
            <ErrorNotice message={Object.values(errors)[0] ?? 'Fix the highlighted fields.'} />
          )}
        </FormSection>
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] text-slate-400">
          {tournament ? `Tournament: ${tournament.name}` : 'Select a tournament to continue.'}
        </span>
        <div className="flex items-center gap-2">
          <Btn to="/admin/fixtures">Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create fixture'}
          </Btn>
        </div>
      </div>
    </>
  );
};

export default FixtureEditor;
