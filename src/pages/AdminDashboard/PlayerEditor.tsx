import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { createPlayer, updatePlayer } from '@/services/players/playerService';
import { addPlayerToTeam, removePlayerFromTeam } from '@/services/teams/teamService';
import { uploadFile } from '@/services/storage/storageService';
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
import FileUpload from '@/components/admin/FileUpload';
import FormField from '@/components/admin/FormField';
import type { Player, PlayerStats, Sport, Team } from '@/types';
import { cn } from '@/utils/cn';

type PlayerRole = Player['role'];
type Gender = Player['gender'];

interface PlayerForm {
  name: string;
  photo: string;
  jerseyNumber: string;
  gender: Gender;
  teamId: string;
  sportId: string;
  role: PlayerRole;
  position: string;
  bio: string;
  active: boolean;
}

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

const EMPTY_FORM: PlayerForm = {
  name: '',
  photo: '',
  jerseyNumber: '',
  gender: 'male',
  teamId: '',
  sportId: '',
  role: 'player',
  position: '',
  bio: '',
  active: true,
};

const PlayerEditor: React.FC = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();
  const [searchParams] = useSearchParams();

  // Arriving from a roster: `/admin/players/create?teamId=…`
  const presetTeamId = searchParams.get('teamId') ?? '';
  const isCreate = !playerId;

  const playerDoc = useDoc<Player>('players', playerId);
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });

  const [form, setForm] = useState<PlayerForm>({ ...EMPTY_FORM, teamId: presetTeamId });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hydrated = useRef<string | null>(null);

  const player = playerDoc.data;

  // Hydrate once per document so realtime updates never overwrite typing.
  useEffect(() => {
    if (!player || hydrated.current === player.id) return;
    hydrated.current = player.id;
    setForm({
      name: player.name ?? '',
      photo: player.photo ?? '',
      jerseyNumber:
        typeof player.jerseyNumber === 'number' && Number.isFinite(player.jerseyNumber)
          ? String(player.jerseyNumber)
          : '',
      gender: player.gender ?? 'male',
      teamId: player.teamId ?? '',
      sportId: player.sportId ?? '',
      role: player.role ?? 'player',
      position: player.position ?? '',
      bio: player.bio ?? '',
      active: player.active !== false,
    });
  }, [player]);

  const teamById = useMemo(() => new Map(teams.data.map((team) => [team.id, team])), [teams.data]);

  const teamOptions = useMemo(
    () => [
      { value: '', label: 'No team — free agent' },
      ...teams.data.map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams.data],
  );

  const sportOptions = useMemo(
    () => [
      { value: '', label: 'Select a sport' },
      ...sports.data.map((sport) => ({ value: sport.id, label: sport.name })),
    ],
    [sports.data],
  );

  // Sport follows the selected team unless it was set explicitly.
  const resolvedSportId = form.sportId || teamById.get(form.teamId)?.sportId || '';

  const set = <K extends keyof PlayerForm>(key: K, value: PlayerForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTeamChange = (nextTeamId: string) => {
    const derived = teamById.get(nextTeamId)?.sportId ?? '';
    setForm((prev) => ({ ...prev, teamId: nextTeamId, sportId: derived || prev.sportId }));
  };

  const handlePhotoFile = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'png';
      const path = `players/${playerId ?? `new-${Date.now()}`}/photo.${extension}`;
      const url = await uploadFile(path, file);
      set('photo', url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed — paste an image URL instead');
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Player name is required.';
    const raw = form.jerseyNumber.trim();
    const jersey = raw === '' ? NaN : Number(raw);
    if (!Number.isInteger(jersey) || jersey < 0) {
      next.jerseyNumber = 'Jersey number must be a whole number of 0 or more.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const base = {
        name: form.name.trim(),
        photo: form.photo.trim(),
        jerseyNumber: Number(form.jerseyNumber.trim()),
        gender: form.gender,
        teamId: form.teamId,
        sportId: resolvedSportId,
        role: form.role,
        position: form.position.trim(),
        bio: form.bio.trim(),
        active: form.active,
        stats: { ...EMPTY_STATS, ...(player?.stats ?? {}) },
      };

      if (isCreate) {
        const now = Timestamp.now();
        const newId = await createPlayer({ ...base, createdAt: now, updatedAt: now });
        if (base.teamId) await addPlayerToTeam(newId, base.teamId);
        await log('PLAYER_CREATED', 'player', newId, { label: base.name });
        toast.success('Player created');
      } else {
        const id = playerId ?? '';
        if (!id) throw new Error('Missing player id');
        await updatePlayer(id, base);
        // Keep `Team.playerIds` in step with `Player.teamId`.
        const previousTeamId = player?.teamId ?? '';
        if (previousTeamId !== base.teamId) {
          if (previousTeamId) await removePlayerFromTeam(previousTeamId, id);
          if (base.teamId) await addPlayerToTeam(base.teamId, id);
        }
        await log('PLAYER_UPDATED', 'player', id, { label: base.name });
        toast.success('Player updated');
      }
      navigate('/admin/players');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------- guards */

  if (!isCreate && !playerDoc.isReady) return <PageLoading label="Loading player…" />;

  if (!isCreate && playerDoc.error) {
    return (
      <>
        <AdminHeader title="Edit player" breadcrumbs={[{ label: 'Players', to: '/admin/players' }]} />
        <ErrorNotice message={playerDoc.error} />
      </>
    );
  }

  if (!isCreate && !player) {
    return (
      <>
        <AdminHeader title="Edit player" breadcrumbs={[{ label: 'Players', to: '/admin/players' }]} />
        <EmptyNotice
          title="Player not found"
          message="This player document no longer exists in Firestore."
          action={<Btn to="/admin/players">Back to players</Btn>}
        />
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title={isCreate ? 'Add player' : `Edit ${player?.name ?? 'player'}`}
        subtitle={
          isCreate
            ? 'Register a new athlete. The sport is derived from the selected team.'
            : 'Update the player record — statistics are preserved.'
        }
        breadcrumbs={[
          { label: 'Players', to: '/admin/players' },
          ...(isCreate
            ? [{ label: 'Add player' }]
            : [{ label: player?.name ?? 'Player', to: `/admin/players/${playerId}` }, { label: 'Edit' }]),
        ]}
        actions={<Btn to="/admin/players">Cancel</Btn>}
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card flush>
          <FormSection step="1" title="Identity" description="Name, photo and squad number as shown on scoreboards.">
            <div className="mb-4">
              <span className={cn('block text-sm font-medium', isDay ? 'text-slate-700' : 'text-slate-200')}>Player photo</span>
              <div className="mt-1.5">
                <FileUpload
                  onUpload={handlePhotoFile}
                  previewUrl={form.photo || undefined}
                  onClear={() => set('photo', '')}
                />
              </div>
            </div>
            <FormGrid>
              <FormField
                label="Name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
                placeholder="e.g. Aarav Sharma"
              />
              <FormField
                label="Jersey number"
                required
                inputMode="numeric"
                value={form.jerseyNumber}
                onChange={(e) => set('jerseyNumber', e.target.value)}
                error={errors.jerseyNumber}
                placeholder="e.g. 10"
              />
            </FormGrid>
            <FormGrid>
              <FormField
                as="select"
                label="Gender"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value as Gender)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <FormField
                label="Photo URL"
                value={form.photo}
                onChange={(e) => set('photo', e.target.value)}
                helpText="Fallback: paste a direct image URL instead of uploading."
                placeholder="https://…"
              />
            </FormGrid>
          </FormSection>

          <FormSection step="2" title="Squad" description="Team, sport, role and position.">
            <FormGrid>
              <FormField
                as="select"
                label="Team"
                value={form.teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                options={teamOptions}
              />
              <FormField
                as="select"
                label="Sport"
                value={resolvedSportId}
                onChange={(e) => set('sportId', e.target.value)}
                options={sportOptions}
                helpText={form.teamId ? 'Derived from the selected team.' : 'Set manually until a team is chosen.'}
              />
            </FormGrid>
            <FormGrid>
              <FormField
                as="select"
                label="Role"
                value={form.role}
                onChange={(e) => set('role', e.target.value as PlayerRole)}
                options={[
                  { value: 'player', label: 'Player' },
                  { value: 'captain', label: 'Captain' },
                  { value: 'vice_captain', label: 'Vice captain' },
                ]}
              />
              <FormField
                label="Position"
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="e.g. Midfielder"
              />
            </FormGrid>
          </FormSection>

          <FormSection step="3" title="Details" description="Short biography plus visibility across the app.">
            <FormField
              as="textarea"
              label="Bio"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              helpText="One or two lines — year, department, playing style."
              placeholder="Second-year CSE, left-footed winger."
            />
            <div className={cn('border-t pt-1', isDay ? 'border-slate-100' : 'border-white/5')}>
              <Toggle
                checked={form.active}
                onChange={(checked) => set('active', checked)}
                label="Active player"
                hint="Inactive players are archived: hidden from active lists but never deleted."
              />
            </div>
          </FormSection>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Btn to="/admin/players" variant="secondary" size="md">
            Cancel
          </Btn>
          <Btn type="submit" variant="primary" size="md" disabled={busy || uploading}>
            {busy ? 'Saving…' : isCreate ? 'Create player' : 'Save changes'}
          </Btn>
        </div>
      </form>
    </>
  );
};

export default PlayerEditor;
