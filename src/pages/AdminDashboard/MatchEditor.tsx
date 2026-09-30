import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AdminHeader,
  Btn,
  Card,
  ErrorNotice,
  FormGrid,
  FormSection,
  PageLoading,
  Toggle,
} from '@/components/admin/kit';
import FormField from '@/components/admin/FormField';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { createMatch, updateMatch } from '@/services/matches/matchService';
import type { DisplayMode, Match, MatchStatus, Player, Sport, Team, Tournament, Venue } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { FiCheck } from 'react-icons/fi';

const STEPS = [
  { id: 'basic', label: 'Basic information' },
  { id: 'participants', label: 'Participants' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'display', label: 'Display' },
  { id: 'interaction', label: 'Public interaction' },
  { id: 'featured', label: 'Featured' },
  { id: 'save', label: 'Save' },
] as const;

interface MatchForm {
  sportId: string;
  tournamentId: string;
  round: string;
  matchNumber: string;
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venueId: string;
  displayMode: DisplayMode;
  allowReactions: boolean;
  allowRatings: boolean;
  allowReviews: boolean;
  allowVoting: boolean;
  featured: boolean;
  featuredPriority: string;
}

const EMPTY: MatchForm = {
  sportId: '',
  tournamentId: '',
  round: '',
  matchNumber: '1',
  teamAId: '',
  teamBId: '',
  date: '',
  time: '10:00',
  venueId: '',
  displayMode: 'single_landscape',
  allowReactions: true,
  allowRatings: true,
  allowReviews: true,
  allowVoting: true,
  featured: false,
  featuredPriority: '1',
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

const MatchEditor: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const isEdit = Boolean(matchId);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { user } = useAuth();
  const { log } = useAuditLog();

  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const tournaments = useCollection<Tournament>('tournaments', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const players = useCollection<Player>('players', { sortBy: 'name' });
  const venues = useCollection<Venue>('venues', { sortBy: 'name' });
  const existing = useDoc<Match>('matches', matchId);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MatchForm>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Prefill when editing.
  useEffect(() => {
    if (!existing.data) return;
    const match = existing.data;
    const when = toInputDate(match.scheduledAt);
    setForm({
      sportId: match.sportId ?? '',
      tournamentId: match.tournamentId ?? '',
      round: '',
      matchNumber: String(match.matchNumber ?? 1),
      teamAId: match.teamAId ?? '',
      teamBId: match.teamBId ?? '',
      date: when.date,
      time: when.time,
      venueId: match.venueId ?? '',
      displayMode: match.displayMode ?? 'single_landscape',
      allowReactions: match.allowReactions ?? true,
      allowRatings: match.allowRatings ?? true,
      allowReviews: match.allowReviews ?? true,
      allowVoting: match.allowVoting ?? true,
      featured: match.featured ?? false,
      featuredPriority: String(match.featuredPriority ?? 1),
    });
  }, [existing.data]);

  const set = <K extends keyof MatchForm>(key: K, value: MatchForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const sport = useMemo(
    () => sports.data.find((s) => s.id === form.sportId),
    [sports.data, form.sportId],
  );
  const teamBased = sport?.teamBased ?? true;

  const teamOptions = useMemo(
    () => [
      { value: '', label: 'Select a team' },
      ...teams.data
        .filter((team) => !form.sportId || team.sportId === form.sportId)
        .map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams.data, form.sportId],
  );

  const playerOptions = useMemo(
    () => [
      { value: '', label: 'Select a player' },
      ...players.data
        .filter((player) => !form.sportId || player.sportId === form.sportId)
        .map((player) => ({
          value: player.id,
          label: `${player.name}${player.jerseyNumber ? ` · #${player.jerseyNumber}` : ''}`,
        })),
    ],
    [players.data, form.sportId],
  );

  /** Validation for the current step only — blocks advancing past errors. */
  const stepErrors = useMemo(() => {
    const errors: Record<number, string> = {};
    if (step === 0 || submitted) {
      if (!form.sportId) errors[0] = 'Select a sport.';
      else if (!form.matchNumber || Number(form.matchNumber) < 1)
        errors[0] = 'Match number must be a positive integer.';
      else if (form.tournamentId === '' && step === 0 && submitted)
        errors[0] = 'Select a tournament.';
    }
    if (step === 1 || submitted) {
      if (!form.teamAId) errors[1] = `Select ${teamBased ? 'Team A' : 'Player A'}.`;
      else if (!form.teamBId) errors[1] = `Select ${teamBased ? 'Team B' : 'Player B'}.`;
      else if (form.teamAId === form.teamBId) errors[1] = 'Both participants must be different.';
    }
    if (step === 2 || submitted) {
      if (!form.date) errors[2] = 'Pick a date.';
      else if (!form.time) errors[2] = 'Pick a start time.';
    }
    return errors;
  }, [step, submitted, form, teamBased]);

  const currentError = stepErrors[step];

  const participantLabel = (id: string, fallbackType: 'team' | 'player') => {
    if (fallbackType === 'team') {
      const row = teams.data.find((t) => t.id === id);
      return { id, name: row?.name ?? id, logo: row?.logo ?? '', type: 'team' as const };
    }
    const row = players.data.find((p) => p.id === id);
    return { id, name: row?.name ?? id, logo: row?.photo ?? '', type: 'player' as const };
  };

  const save = async () => {
    setSubmitted(true);
    const blocking = [0, 1, 2].find((index) => stepErrors[index]);
    if (blocking !== undefined) {
      setStep(blocking);
      toast.error(stepErrors[blocking]);
      return;
    }
    setSaving(true);
    try {
      const scheduled = new Date(`${form.date}T${form.time || '00:00'}`);
      const payload = {
        sportId: form.sportId,
        tournamentId: form.tournamentId,
        matchNumber: Number(form.matchNumber),
        round: form.round,
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        participantA: participantLabel(form.teamAId, teamBased ? 'team' : 'player'),
        participantB: participantLabel(form.teamBId, teamBased ? 'team' : 'player'),
        venueId: form.venueId,
        scheduledAt: Timestamp.fromDate(scheduled),
        startedAt: null,
        pausedAt: null,
        endedAt: null,
        status: 'scheduled' as MatchStatus,
        score: { teamA: 0, teamB: 0, details: {} },
        liveState: {},
        displayMode: form.displayMode,
        featured: form.featured,
        featuredPriority: Number(form.featuredPriority) || 0,
        allowReactions: form.allowReactions,
        allowVoting: form.allowVoting,
        allowRatings: form.allowRatings,
        allowReviews: form.allowReviews,
        createdBy: user?.uid ?? 'unknown',
      };

      if (isEdit && matchId) {
        await updateMatch(matchId, payload as Partial<Match>);
        await log('MATCH_UPDATED', 'match', matchId, { metadata: { step: 'editor' } });
        toast.success('Match updated');
        navigate(`/admin/matches/${matchId}`);
      } else {
        const newId = await createMatch(payload as unknown as Omit<Match, 'id'>);
        await log('MATCH_CREATED', 'match', newId, { metadata: { sportId: form.sportId } });
        toast.success('Match created');
        navigate(`/admin/matches/${newId}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && existing.isLoading) return <PageLoading label="Loading match…" />;
  if (isEdit && existing.error) return <div className="py-10"><ErrorNotice message={existing.error} /></div>;
  if (isEdit && !existing.data)
    return (
      <div className="py-10">
        <ErrorNotice message={`No match found with id "${matchId}".`} />
        <div className="mt-4"><Btn to="/admin/matches">Back to matches</Btn></div>
      </div>
    );

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Edit match' : 'Create match'}
        subtitle={
          isEdit
            ? 'Update the match definition. Score and status are changed from the scoring console.'
            : 'Seven short steps. Everything is validated before anything is written to Firestore.'
        }
        breadcrumbs={[{ label: 'Matches', to: '/admin/matches' }, { label: isEdit ? 'Edit' : 'Create' }]}
        actions={<Btn to="/admin/matches" variant="secondary">Cancel</Btn>}
      />

      {/* ------------------------------------------------- step rail */}
      <div className={cn(
        'mb-5 overflow-x-auto rounded-lg border px-3 py-3',
        isDay ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#0B1528]'
      )}>
        <ol className="flex min-w-max items-center">
          {STEPS.map((item, index) => {
            const done = index < step;
            const active = index === step;
            const blocked = index > step && (stepErrors[index] !== undefined || index > step + 1);
            return (
              <li key={item.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-bold transition-colors',
                    active && (isDay ? 'bg-slate-900 text-amber-300' : 'bg-[#071426] text-[#FFD21F] border border-amber-500/30'),
                    done && 'text-blue-500',
                    !active && !done && (isDay ? 'text-slate-400' : 'text-slate-500'),
                    index <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black',
                      active && (isDay ? 'bg-amber-300 text-slate-900' : 'bg-[#FFD21F] text-[#071426]'),
                      done && 'bg-blue-600 text-white',
                      !active && !done && (isDay ? 'bg-slate-100 text-slate-400' : 'bg-white/10 text-slate-400'),
                    )}
                  >
                    {done ? <FiCheck className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <span className={cn('mx-1 h-px w-5 sm:mx-2 sm:w-8', isDay ? 'bg-slate-200' : 'bg-white/10')} />
                )}
                {blocked && <span className="ml-1 text-[10px] font-bold text-red-500">!</span>}
              </li>
            );
          })}
        </ol>
      </div>

      <Card flush>
        {/* ------------------------------------------- 1 · basic info */}
        {step === 0 && (
          <FormSection
            step="1"
            title="Basic information"
            description="What kind of match is this, and where does it sit in the competition?"
          >
            <FormGrid cols={2}>
              <FormField
                as="select"
                label="Sport"
                required
                value={form.sportId}
                onChange={(e) => set('sportId', e.target.value)}
                options={[
                  { value: '', label: 'Select a sport' },
                  ...sports.data.map((s) => ({ value: s.id, label: `${s.icon ?? ''} ${s.name}`.trim() })),
                ]}
              />
              <FormField
                as="select"
                label="Tournament"
                required
                value={form.tournamentId}
                onChange={(e) => set('tournamentId', e.target.value)}
                options={[
                  { value: '', label: 'Select a tournament' },
                  ...tournaments.data.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
              <FormField
                label="Round"
                placeholder="e.g. Semifinal, Group A, League round 4"
                value={form.round}
                onChange={(e) => set('round', e.target.value)}
              />
              <FormField
                label="Match number"
                type="number"
                min={1}
                required
                value={form.matchNumber}
                onChange={(e) => set('matchNumber', e.target.value)}
                helpText="Unique within the tournament."
              />
            </FormGrid>
          </FormSection>
        )}

        {/* ------------------------------------------- 2 · participants */}
        {step === 1 && (
          <FormSection
            step="2"
            title="Participants"
            description={
              teamBased
                ? 'Pick the two teams taking the field.'
                : sport
                  ? `${sport.name} is an individual sport — pick the two players.`
                  : 'Select a sport first to choose between teams and players.'
            }
          >
            <FormGrid cols={2}>
              <FormField
                as="select"
                label={teamBased ? 'Team A' : 'Player A'}
                required
                value={form.teamAId}
                onChange={(e) => set('teamAId', e.target.value)}
                options={teamBased ? teamOptions : playerOptions}
              />
              <FormField
                as="select"
                label={teamBased ? 'Team B' : 'Player B'}
                required
                value={form.teamBId}
                onChange={(e) => set('teamBId', e.target.value)}
                options={teamBased ? teamOptions : playerOptions}
              />
            </FormGrid>
            <p className={cn('mt-3 text-[12px]', isDay ? 'text-slate-500' : 'text-slate-400')}>
              Participants are read from the Teams/Players collections — create them first if they are missing.
            </p>
          </FormSection>
        )}

        {/* ---------------------------------------------- 3 · schedule */}
        {step === 2 && (
          <FormSection step="3" title="Schedule" description="When and where the match happens.">
            <FormGrid cols={3}>
              <FormField
                label="Date"
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
              />
              <FormField
                label="Start time"
                type="time"
                required
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
              />
              <FormField
                as="select"
                label="Venue"
                value={form.venueId}
                onChange={(e) => set('venueId', e.target.value)}
                options={[
                  { value: '', label: 'Select a venue' },
                  ...venues.data.map((v) => ({ value: v.id, label: `${v.name} · ${v.location}` })),
                ]}
              />
            </FormGrid>
          </FormSection>
        )}

        {/* ----------------------------------------------- 4 · display */}
        {step === 3 && (
          <FormSection step="4" title="Display" description="How the scoreboard renders on the big screen.">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: 'dual_portrait' as DisplayMode,
                    title: 'Dual portrait',
                    copy: 'Two stacked team panels — best for a tall LED or a vertical stream.',
                  },
                  {
                    value: 'single_landscape' as DisplayMode,
                    title: 'Single landscape',
                    copy: 'Teams either side of a centred score — the standard broadcast layout.',
                  },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set('displayMode', option.value)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    form.displayMode === option.value
                      ? isDay
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/20'
                      : isDay
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-3.5 w-3.5 rounded-full border-2',
                        form.displayMode === option.value
                          ? 'border-blue-600 bg-blue-600'
                          : isDay ? 'border-slate-300' : 'border-white/30',
                      )}
                    />
                    <span className={cn('text-[13px] font-bold', isDay ? 'text-slate-800' : 'text-slate-100')}>{option.title}</span>
                  </span>
                  <span className={cn('mt-2 block text-[12px] leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>{option.copy}</span>
                </button>
              ))}
            </div>
          </FormSection>
        )}

        {/* ------------------------------------------- 5 · interaction */}
        {step === 4 && (
          <FormSection
            step="5"
            title="Public interaction"
            description="What spectators are allowed to do while this match is on."
          >
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Toggle checked={form.allowReactions} onChange={(v) => set('allowReactions', v)} label="Enable reactions" hint="Live emoji bursts on the display." />
              <Toggle checked={form.allowRatings} onChange={(v) => set('allowRatings', v)} label="Enable ratings" hint="Spectators rate players after the match." />
              <Toggle checked={form.allowReviews} onChange={(v) => set('allowReviews', v)} label="Enable reviews" hint="Written reviews, moderated from /admin/reviews." />
              <Toggle checked={form.allowVoting} onChange={(v) => set('allowVoting', v)} label="Enable voting" hint="Man-of-the-match / who-wins polls." />
            </div>
          </FormSection>
        )}

        {/* ---------------------------------------------- 6 · featured */}
        {step === 5 && (
          <FormSection step="6" title="Featured" description="Whether this match is promoted on the public homepage.">
            <Toggle
              checked={form.featured}
              onChange={(v) => set('featured', v)}
              label="Featured match"
              hint="Pins the match to the homepage carousel."
            />
            <div className="mt-4 max-w-xs">
              <FormField
                as="select"
                label="Priority"
                disabled={!form.featured}
                value={form.featuredPriority}
                onChange={(e) => set('featuredPriority', e.target.value)}
                options={[
                  { value: '1', label: '1 — Primary featured' },
                  { value: '2', label: '2 — Secondary' },
                  { value: '3', label: '3 — Tertiary' },
                ]}
              />
            </div>
          </FormSection>
        )}

        {/* ------------------------------------------------- 7 · save */}
        {step === 6 && (
          <FormSection step="7" title="Review & save" description="Nothing is written until you press Save.">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {[
                ['Sport', sports.data.find((s) => s.id === form.sportId)?.name ?? '—'],
                ['Tournament', tournaments.data.find((t) => t.id === form.tournamentId)?.name ?? '—'],
                ['Round', form.round || '—'],
                ['Match number', form.matchNumber],
                [teamBased ? 'Teams' : 'Players', `${form.teamAId || '—'} vs ${form.teamBId || '—'}`],
                ['Schedule', form.date ? `${form.date} ${form.time}` : '—'],
                ['Venue', venues.data.find((v) => v.id === form.venueId)?.name ?? '—'],
                ['Display', form.displayMode === 'dual_portrait' ? 'Dual portrait' : 'Single landscape'],
                [
                  'Interaction',
                  [
                    form.allowReactions && 'Reactions',
                    form.allowRatings && 'Ratings',
                    form.allowReviews && 'Reviews',
                    form.allowVoting && 'Voting',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None',
                ],
                ['Featured', form.featured ? `Yes (priority ${form.featuredPriority})` : 'No'],
              ].map(([term, detail]) => (
                <div key={term} className={cn('flex items-baseline justify-between gap-4 border-b py-2.5', isDay ? 'border-slate-100' : 'border-white/5')}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{term}</dt>
                  <dd className={cn('truncate text-right text-[13px] font-medium', isDay ? 'text-slate-800' : 'text-slate-100')}>{detail}</dd>
                </div>
              ))}
            </dl>

            {submitted && currentError && (
              <ErrorNotice message={currentError} className="mt-4" />
            )}

            <div className={cn(
              'mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-4 py-3',
              isDay ? 'border-slate-300 bg-slate-50 text-slate-600' : 'border-white/10 bg-white/[0.02] text-slate-400'
            )}>
              <span className="text-[12px] font-semibold">
                {form.sportId && form.teamAId && form.teamBId && form.date
                  ? 'All required fields are complete.'
                  : 'Some required fields are still empty — use the step rail above to jump back.'}
              </span>
            </div>
          </FormSection>
        )}
      </Card>

      {submitted && currentError && step !== 6 && (
        <ErrorNotice message={currentError} className="mt-4" />
      )}

      {/* ---------------------------------------------------- footer */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Btn onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving}>
          Back
        </Btn>
        <span className="text-[12px] tabular-nums text-slate-400">
          Step {step + 1} of {STEPS.length}
        </span>
        {step < STEPS.length - 1 ? (
          <Btn
            variant="primary"
            onClick={() => {
              setSubmitted(true);
              if (stepErrors[step]) {
                toast.error(stepErrors[step]);
                return;
              }
              setSubmitted(false);
              setStep((s) => s + 1);
            }}
            disabled={saving}
          >
            Continue
          </Btn>
        ) : (
          <Btn variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create match'}
          </Btn>
        )}
      </div>
    </>
  );
};

export default MatchEditor;
