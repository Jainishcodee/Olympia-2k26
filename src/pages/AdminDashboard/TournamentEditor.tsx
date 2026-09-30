import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { createTournament, updateTournament } from '@/services/tournaments/tournamentService';
import type { Round, Sport, Tournament, TournamentFormat, TournamentStatus } from '@/types';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Tournament editor — identity, window, format and the round ladder that the
 *  bracket view renders. All writes go through the tournament service.
 * ==========================================================================*/

interface TournamentForm {
  name: string;
  sportId: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  format: TournamentFormat;
  status: TournamentStatus;
}

const EMPTY: TournamentForm = {
  name: '',
  sportId: '',
  description: '',
  startDate: '',
  endDate: '',
  venue: '',
  format: 'knockout',
  status: 'upcoming',
};

const FORMATS: { value: TournamentFormat; label: string }[] = [
  { value: 'knockout', label: 'Knockout' },
  { value: 'league', label: 'League' },
  { value: 'round_robin', label: 'Round robin' },
  { value: 'group_stage', label: 'Group stage' },
  { value: 'custom', label: 'Custom' },
];

const STATUSES: { value: TournamentStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const toInputDate = (value: unknown): string => {
  if (!value) return '';
  const date =
    value instanceof Date
      ? value
      : typeof (value as { toDate?: () => Date }).toDate === 'function'
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const TournamentEditor: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const isEdit = Boolean(tournamentId);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();

  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const existing = useDoc<Tournament>('tournaments', tournamentId);

  const [form, setForm] = useState<TournamentForm>(EMPTY);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing.data) return;
    const tournament = existing.data;
    setForm({
      name: tournament.name ?? '',
      sportId: tournament.sportId ?? '',
      description: tournament.description ?? '',
      startDate: toInputDate(tournament.startDate),
      endDate: toInputDate(tournament.endDate),
      venue: tournament.venue ?? '',
      format: tournament.format ?? 'knockout',
      status: tournament.status ?? 'upcoming',
    });
    setRounds(
      (tournament.rounds ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((round, index) => ({ ...round, order: index + 1 })),
    );
  }, [existing.data]);

  const set = <K extends keyof TournamentForm>(key: K, value: TournamentForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Tournament name is required.';
  if (!form.startDate) errors.startDate = 'Pick a start date.';
  if (!form.endDate) errors.endDate = 'Pick an end date.';
  if (form.startDate && form.endDate && form.endDate < form.startDate)
    errors.endDate = 'End date must be on or after the start date.';

  const addRound = () =>
    setRounds((prev) => [...prev, { id: uid('round'), name: `Round ${prev.length + 1}`, order: prev.length + 1, matchIds: [] }]);

  const renameRound = (id: string, name: string) =>
    setRounds((prev) => prev.map((round) => (round.id === id ? { ...round, name } : round)));

  const removeRound = (id: string) =>
    setRounds((prev) => prev.filter((round) => round.id !== id));

  const save = async () => {
    setSubmitted(true);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }
    setSaving(true);
    try {
      const shared = {
        name: form.name.trim(),
        sportId: form.sportId,
        description: form.description,
        startDate: Timestamp.fromDate(new Date(`${form.startDate}T00:00`)),
        endDate: Timestamp.fromDate(new Date(`${form.endDate}T00:00`)),
        venue: form.venue,
        format: form.format,
        status: form.status,
        rounds: rounds.map((round, index) => ({ ...round, order: index + 1 })),
      };

      if (isEdit && tournamentId) {
        await updateTournament(tournamentId, shared);
        await log('TOURNAMENT_UPDATED', 'tournament', tournamentId, { label: shared.name });
        toast.success('Tournament updated');
        navigate('/admin/tournaments');
      } else {
        const newId = await createTournament({
          ...shared,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        await log('TOURNAMENT_CREATED', 'tournament', newId, { label: shared.name });
        toast.success('Tournament created');
        navigate('/admin/tournaments');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && existing.isLoading) return <PageLoading label="Loading tournament…" />;
  if (isEdit && existing.error)
    return (
      <div className="py-10">
        <ErrorNotice message={existing.error} />
        <div className="mt-4">
          <Btn to="/admin/tournaments">Back to tournaments</Btn>
        </div>
      </div>
    );
  if (isEdit && !existing.data)
    return (
      <div className="py-10">
        <EmptyNotice
          title="Tournament not found"
          message={`No tournament exists with id "${tournamentId}".`}
          action={
            <Btn to="/admin/tournaments" variant="primary">
              Back to tournaments
            </Btn>
          }
        />
      </div>
    );

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Edit tournament' : 'Create tournament'}
        subtitle={
          isEdit
            ? 'Update the competition record. Matches and fixtures already linked keep their references.'
            : 'Name the competition, set its window, then list the rounds the bracket should show.'
        }
        breadcrumbs={[
          { label: 'Tournaments', to: '/admin/tournaments' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
        actions={<Btn to="/admin/tournaments">Cancel</Btn>}
      />

      <Card flush>
        <FormSection step="1" title="Identity" description="How the tournament appears everywhere.">
          <FormGrid cols={2}>
            <FormField
              label="Name"
              required
              placeholder="e.g. Olympia Football Cup"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={submitted ? errors.name : undefined}
            />
            <FormField
              as="select"
              label="Sport"
              value={form.sportId}
              onChange={(e) => set('sportId', e.target.value)}
              options={[
                { value: '', label: 'Select a sport' },
                ...sports.data.map((sport) => ({
                  value: sport.id,
                  label: `${sport.icon ?? ''} ${sport.name}`.trim(),
                })),
              ]}
            />
            <div className="sm:col-span-2">
              <FormField
                as="textarea"
                label="Description"
                placeholder="Short brief shown on public pages."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection step="2" title="Window & venue" description="Dates the competition runs between.">
          <FormGrid cols={3}>
            <FormField
              type="date"
              label="Start date"
              required
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              error={submitted ? errors.startDate : undefined}
            />
            <FormField
              type="date"
              label="End date"
              required
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
              error={submitted ? errors.endDate : undefined}
            />
            <FormField
              label="Venue"
              placeholder="e.g. Main Ground"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              helpText="Free text — used when a fixture has no venue of its own."
            />
          </FormGrid>
        </FormSection>

        <FormSection step="3" title="Format & status" description="Drives how fixtures and standings read.">
          <FormGrid cols={2}>
            <FormField
              as="select"
              label="Format"
              value={form.format}
              onChange={(e) => set('format', e.target.value as TournamentFormat)}
              options={FORMATS}
            />
            <FormField
              as="select"
              label="Status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as TournamentStatus)}
              options={STATUSES}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          step="4"
          title="Rounds"
          description="The bracket view renders these columns in order. Match ids attach automatically as fixtures are created."
        >
          {rounds.length === 0 ? (
            <p className={cn(
              'mb-4 rounded-lg border border-dashed px-4 py-3 text-[13px]',
              isDay ? 'border-slate-300 bg-slate-50 text-slate-600' : 'border-white/10 bg-white/[0.02] text-slate-400'
            )}>
              No rounds yet. Add at least one — for a knockout cup that would be{' '}
              <span className={cn('font-semibold', isDay ? 'text-slate-800' : 'text-slate-200')}>Round of 16</span>,{' '}
              <span className={cn('font-semibold', isDay ? 'text-slate-800' : 'text-slate-200')}>Quarterfinal</span>,{' '}
              <span className={cn('font-semibold', isDay ? 'text-slate-800' : 'text-slate-200')}>Semifinal</span>,{' '}
              <span className={cn('font-semibold', isDay ? 'text-slate-800' : 'text-slate-200')}>Final</span>.
            </p>
          ) : (
            <ul className={cn('mb-4 divide-y rounded-lg border', isDay ? 'divide-slate-100 border-slate-200 bg-white' : 'divide-white/5 border-white/10 bg-white/[0.02]')}>
              {rounds.map((round, index) => (
                <li key={round.id} className="flex items-center gap-3 px-3 py-2">
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    isDay ? 'bg-slate-900 text-amber-300' : 'bg-[#071426] text-[#FFD21F]'
                  )}>
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) => renameRound(round.id, e.target.value)}
                    aria-label={`Round ${index + 1} name`}
                    className={cn(
                      'h-8 min-w-0 flex-1 rounded-md border px-2.5 text-[13px] outline-none transition-colors focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/15',
                      isDay ? 'border-slate-300 bg-white text-slate-800' : 'border-white/10 bg-white/[0.04] text-white'
                    )}
                  />
                  <span className={cn('hidden text-[11px] tabular-nums sm:block', isDay ? 'text-slate-400' : 'text-slate-500')}>
                    {round.matchIds?.length ?? 0} matches
                  </span>
                  <button
                    type="button"
                    title="Remove round"
                    aria-label={`Remove round ${index + 1}`}
                    onClick={() => removeRound(round.id)}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded border transition-colors',
                      isDay ? 'border-red-200 bg-white text-red-500 hover:border-red-300 hover:text-red-700' : 'border-red-500/30 bg-red-950/20 text-red-400 hover:border-red-500/50 hover:text-red-300'
                    )}
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Btn onClick={addRound} icon={<FiPlus className="h-4 w-4" />}>
            Add round
          </Btn>

          {submitted && Object.keys(errors).length > 0 && (
            <ErrorNotice message={Object.values(errors)[0] ?? 'Fix the highlighted fields.'} className="mt-4" />
          )}
        </FormSection>
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className={cn('text-[12px]', isDay ? 'text-slate-400' : 'text-slate-500')}>
          {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'} · {form.format.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-2">
          <Btn to="/admin/tournaments">Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create tournament'}
          </Btn>
        </div>
      </div>
    </>
  );
};

export default TournamentEditor;
