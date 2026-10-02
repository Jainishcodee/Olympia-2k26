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
  Toggle,
} from '@/components/admin/kit';
import FormField from '@/components/admin/FormField';
import { useAuditLog } from '@/hooks/useAuditLog';
import { createFixture, updateFixture } from '@/services/fixtures/fixtureService';
import { createMatch, updateMatch } from '@/services/matches/matchService';
import type { Fixture, Match, MatchStatus, Player, Sport, Team, Tournament, Venue } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Fixture editor — creates or updates a fixture and automatically provisions
 *  the synchronized live Match instance in Firestore with interactive fan
 *  settings (voting, reactions, player ratings, reviews, featured banner).
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
  isHidden: boolean;
  // Match Synchronization & Public Interaction Settings
  autoCreateMatch: boolean;
  featured: boolean;
  allowVoting: boolean;
  allowReactions: boolean;
  allowRatings: boolean;
  allowReviews: boolean;
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
  isHidden: false,
  autoCreateMatch: true,
  featured: false,
  allowVoting: true,
  allowReactions: true,
  allowRatings: true,
  allowReviews: true,
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
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const players = useCollection<Player>('players', { sortBy: 'name' });
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
    const existingMatch = matches.data.find((m) => m.id === fixture.matchId);
    setForm((prev) => ({
      ...prev,
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
      isHidden: fixture.isHidden ?? false,
      autoCreateMatch: true,
      featured: existingMatch?.featured ?? prev.featured ?? false,
      allowVoting: existingMatch?.allowVoting ?? prev.allowVoting ?? true,
      allowReactions: existingMatch?.allowReactions ?? prev.allowReactions ?? true,
      allowRatings: existingMatch?.allowRatings ?? prev.allowRatings ?? true,
      allowReviews: existingMatch?.allowReviews ?? prev.allowReviews ?? true,
    }));
  }, [existing.data, matches.data]);

  const set = <K extends keyof FixtureForm>(key: K, value: FixtureForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const linkedMatch = useMemo(
    () => matches.data.find((match) => match.id === form.matchId),
    [matches.data, form.matchId],
  );

  const selectedTournament = useMemo(
    () => tournaments.data.find((t) => t.id === form.tournamentId),
    [tournaments.data, form.tournamentId]
  );

  const selectedSport = useMemo(() => {
    if (!selectedTournament?.sportId) return undefined;
    const tSport = selectedTournament.sportId.toLowerCase();
    return sports.data.find(
      (s) =>
        s.id.toLowerCase() === tSport ||
        s.slug?.toLowerCase() === tSport ||
        s.name.toLowerCase() === tSport
    );
  }, [sports.data, selectedTournament]);

  const isIndividualSport = useMemo(() => {
    const sId = (selectedSport?.id || selectedTournament?.sportId || '').toLowerCase();
    const individualIds = ['chess', 'carrom', 'table-tennis', 'table_tennis', 'badminton'];
    if (individualIds.includes(sId)) return true;
    if (selectedSport && selectedSport.teamBased === false) return true;
    return false;
  }, [selectedSport, selectedTournament]);

  const isTeamBased = !isIndividualSport;

  const filteredTeams = useMemo(() => {
    if (!selectedTournament?.sportId && !selectedSport?.id) return teams.data;
    const targetIds = new Set(
      [
        selectedTournament?.sportId?.toLowerCase(),
        selectedSport?.id?.toLowerCase(),
        selectedSport?.slug?.toLowerCase(),
      ].filter(Boolean)
    );
    const list = teams.data.filter((t) => targetIds.has(t.sportId?.toLowerCase()));
    return list.length > 0 ? list : teams.data;
  }, [teams.data, selectedTournament, selectedSport]);

  const filteredPlayers = useMemo(() => {
    if (!selectedTournament?.sportId && !selectedSport?.id) return players.data;
    const targetIds = new Set(
      [
        selectedTournament?.sportId?.toLowerCase(),
        selectedSport?.id?.toLowerCase(),
        selectedSport?.slug?.toLowerCase(),
      ].filter(Boolean)
    );
    // Sort matching sport players first, but include ALL players so any player can be chosen
    return [...players.data].sort((a, b) => {
      const aMatch = targetIds.has(a.sportId?.toLowerCase());
      const bMatch = targetIds.has(b.sportId?.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [players.data, selectedTournament, selectedSport]);

  const errors = useMemo(() => {
    const found: Record<string, string> = {};
    if (!form.tournamentId) found.tournamentId = 'Select a tournament.';
    if (form.mode === 'match') {
      if (!form.matchId) found.participants = 'Select the linked match.';
    } else if (!form.teamAId || !form.teamBId) {
      found.participants = isTeamBased ? 'Select both teams.' : 'Select both participants.';
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
  }, [form, isTeamBased]);

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
      const tourney = tournaments.data.find((t) => t.id === form.tournamentId);
      const teamA = teams.data.find((t) => t.id === form.teamAId);
      const teamB = teams.data.find((t) => t.id === form.teamBId);
      const playerA = players.data.find((p) => p.id === form.teamAId);
      const playerB = players.data.find((p) => p.id === form.teamBId);

      const derivedSportId =
        tourney?.sportId ||
        selectedSport?.id ||
        (isTeamBased ? teamA?.sportId : playerA?.sportId) ||
        linkedMatch?.sportId ||
        'cricket';

      let finalMatchId = form.mode === 'match' ? form.matchId : '';

      // Auto-create or synchronize Match instance if mode is 'teams' and autoCreateMatch is enabled
      if (form.mode === 'teams' && form.autoCreateMatch) {
        const participantA = {
          id: form.teamAId,
          name: (isTeamBased ? teamA?.name : playerA?.name) || 'Participant A',
          logo: (isTeamBased ? teamA?.logo : playerA?.photo) || '',
          type: (isTeamBased ? 'team' : 'player') as 'team' | 'player',
        };
        const participantB = {
          id: form.teamBId,
          name: (isTeamBased ? teamB?.name : playerB?.name) || 'Participant B',
          logo: (isTeamBased ? teamB?.logo : playerB?.photo) || '',
          type: (isTeamBased ? 'team' : 'player') as 'team' | 'player',
        };

        if (isEdit && form.matchId) {
          finalMatchId = form.matchId;
          await updateMatch(form.matchId, {
            sportId: derivedSportId,
            tournamentId: form.tournamentId,
            round: form.round.trim(),
            teamAId: form.teamAId,
            teamBId: form.teamBId,
            participantA,
            participantB,
            venueId: form.venueId,
            scheduledAt: when,
            status: (form.status as MatchStatus) || 'scheduled',
            featured: Boolean(form.featured),
            allowReactions: Boolean(form.allowReactions),
            allowVoting: Boolean(form.allowVoting),
            allowRatings: Boolean(form.allowRatings),
            allowReviews: Boolean(form.allowReviews),
            isHidden: Boolean(form.isHidden),
          });
        } else {
          finalMatchId = await createMatch({
            sportId: derivedSportId,
            tournamentId: form.tournamentId,
            matchNumber: matches.data.length + 1,
            round: form.round.trim(),
            teamAId: form.teamAId,
            teamBId: form.teamBId,
            participantA,
            participantB,
            venueId: form.venueId,
            scheduledAt: when,
            startedAt: null,
            pausedAt: null,
            endedAt: null,
            status: (form.status as MatchStatus) || 'scheduled',
            score: { teamA: 0, teamB: 0, details: {} },
            liveState: {},
            displayMode: 'dual_portrait',
            featured: Boolean(form.featured),
            featuredPriority: 0,
            allowReactions: Boolean(form.allowReactions),
            allowVoting: Boolean(form.allowVoting),
            allowRatings: Boolean(form.allowRatings),
            allowReviews: Boolean(form.allowReviews),
            isHidden: Boolean(form.isHidden),
            archived: false,
            createdBy: 'fixture_auto',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          await log('MATCH_CREATED', 'match', finalMatchId, {
            label: `Auto-created from fixture: ${participantA.name} vs ${participantB.name}`,
          });
        }
      } else if (form.mode === 'match' && form.matchId) {
        await updateMatch(form.matchId, {
          scheduledAt: when,
          venueId: form.venueId,
          round: form.round.trim(),
          featured: Boolean(form.featured),
          allowReactions: Boolean(form.allowReactions),
          allowVoting: Boolean(form.allowVoting),
          allowRatings: Boolean(form.allowRatings),
          allowReviews: Boolean(form.allowReviews),
          isHidden: Boolean(form.isHidden),
        });
      }

      const shared = {
        tournamentId: form.tournamentId,
        sportId: derivedSportId,
        round: form.round.trim(),
        matchId: finalMatchId,
        order: Number(form.order) || 0,
        teamAId: linkedMatch?.teamAId || form.teamAId,
        teamBId: linkedMatch?.teamBId || form.teamBId,
        scheduledAt: when,
        venueId: form.venueId,
        status: form.status || 'scheduled',
        isHidden: Boolean(form.isHidden),
      };
      const summary = `${shared.round || 'Fixture'} · ${new Date(
        `${form.date}T${form.time || '00:00'}`,
      ).toLocaleDateString([], { day: '2-digit', month: 'short' })}`;

      if (isEdit && fixtureId) {
        await updateFixture(fixtureId, shared);
        await log('FIXTURE_UPDATED', 'fixture', fixtureId, { label: summary });
        toast.success(finalMatchId ? 'Fixture & live match updated' : 'Fixture updated');
        navigate('/admin/fixtures');
      } else {
        const newId = await createFixture({ ...shared, createdAt: Timestamp.now() });
        await log('FIXTURE_CREATED', 'fixture', newId, { label: summary });
        toast.success(finalMatchId ? 'Fixture & live match created successfully!' : 'Fixture created');
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
            ? 'Change schedule, participants, fan interactivity, or visibility. Linked matches are updated automatically.'
            : 'Schedule a championship fixture. A corresponding live match instance is automatically generated and synchronized.'
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
          description="Pick the two sides or link to an existing match directly."
        >
          <div className={cn(
            'mb-4 inline-flex rounded-md border p-0.5',
            isDay ? 'border-slate-300 bg-slate-50' : 'border-white/10 bg-white/[0.04]'
          )}>
            {(
              [
                { id: 'teams', label: isTeamBased ? 'Two Teams' : 'Two Players' },
                { id: 'match', label: 'Linked Match' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set('mode', option.id)}
                className={cn(
                  'h-8 rounded px-3 text-[11px] font-bold uppercase tracking-wider transition-colors',
                  form.mode === option.id
                    ? isDay ? 'bg-slate-900 text-white shadow-2xs' : 'bg-blue-600 text-white shadow-2xs'
                    : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
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
                helpText="The match supplies both participants, the venue, and the kick-off time."
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
                label={isTeamBased ? 'Team A' : 'Participant A (Player)'}
                required
                value={form.teamAId}
                onChange={(e) => set('teamAId', e.target.value)}
                error={submitted ? errors.participants : undefined}
                options={[
                  { value: '', label: isTeamBased ? 'Select a team' : 'Select a player' },
                  ...(isTeamBased
                    ? filteredTeams.map((team) => ({ value: team.id, label: team.name }))
                    : filteredPlayers.map((player) => ({ value: player.id, label: player.name }))),
                ]}
              />
              <FormField
                as="select"
                label={isTeamBased ? 'Team B' : 'Participant B (Player)'}
                required
                value={form.teamBId}
                onChange={(e) => set('teamBId', e.target.value)}
                options={[
                  { value: '', label: isTeamBased ? 'Select a team' : 'Select a player' },
                  ...(isTeamBased
                    ? filteredTeams.map((team) => ({ value: team.id, label: team.name }))
                    : filteredPlayers.map((player) => ({ value: player.id, label: player.name }))),
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
          <FormGrid cols={2}>
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
        </FormSection>

        <FormSection
          step="5"
          title="Live match & public engagement"
          description="Automatic scoring integration, fan interactivity, and public visibility."
        >
          {isEdit && form.matchId && (
            <div className={cn(
              'mb-4 p-3 rounded-lg border text-xs flex items-center justify-between',
              isDay ? 'border-amber-200 bg-amber-50/80 text-amber-900' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
            )}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">🔗 Synchronized Match:</span>
                <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">{form.matchId}</code>
              </div>
              <span className="text-[11px] opacity-80">Linked with scoring engine</span>
            </div>
          )}

          <div className="space-y-4">
            {form.mode === 'teams' && (
              <Toggle
                label="Auto-create live match instance"
                hint="Automatically creates and links a live Match record in the database so you can immediately open the Scoring Console without re-entering details."
                checked={form.autoCreateMatch}
                onChange={(checked) => set('autoCreateMatch', checked)}
              />
            )}

            {(form.autoCreateMatch || form.mode === 'match') && (
              <div className={cn(
                'rounded-lg border p-4 space-y-4 transition-colors',
                isDay ? 'border-slate-200/80 bg-slate-50/50' : 'border-white/10 bg-white/[0.02]'
              )}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Spectator & Homepage Settings
                </div>

                <Toggle
                  label="Featured on homepage carousel"
                  hint="Promote this match into the hero spotlight and top banner carousel on the public website."
                  checked={form.featured}
                  onChange={(checked) => set('featured', checked)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <Toggle
                    label="Enable fan voting"
                    hint="Spectators can predict the winner and vote on match outcomes."
                    checked={form.allowVoting}
                    onChange={(checked) => set('allowVoting', checked)}
                  />
                  <Toggle
                    label="Enable live reactions"
                    hint="Spectators can send cheer emojis, fire, and live reactions."
                    checked={form.allowReactions}
                    onChange={(checked) => set('allowReactions', checked)}
                  />
                  <Toggle
                    label="Enable player ratings"
                    hint="Spectators can rate participant performance out of 10."
                    checked={form.allowRatings}
                    onChange={(checked) => set('allowRatings', checked)}
                  />
                  <Toggle
                    label="Enable fan reviews & comments"
                    hint="Spectators can post comments, analysis, and reviews."
                    checked={form.allowReviews}
                    onChange={(checked) => set('allowReviews', checked)}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
              <Toggle
                label="Hide fixture & match from public website"
                hint="When enabled, this fixture and its linked match are saved as draft/private and will NOT appear on public schedules, sport brackets, or match list pages."
                checked={form.isHidden}
                onChange={(checked) => set('isHidden', checked)}
              />
            </div>
          </div>

          {submitted && Object.keys(errors).length > 0 && (
            <div className="mt-4">
              <ErrorNotice message={Object.values(errors)[0] ?? 'Fix the highlighted fields.'} />
            </div>
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
