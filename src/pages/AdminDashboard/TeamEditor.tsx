import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { createTeam, updateTeam } from '@/services/teams/teamService';
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
import type { Player, Sport, Team } from '@/types';

interface TeamForm {
  name: string;
  shortName: string;
  sportId: string;
  logo: string;
  captainId: string;
  viceCaptainId: string;
  coach: string;
  description: string;
  active: boolean;
}

const EMPTY_FORM: TeamForm = {
  name: '',
  shortName: '',
  sportId: '',
  logo: '',
  captainId: '',
  viceCaptainId: '',
  coach: '',
  description: '',
  active: true,
};

const TeamEditor: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const isCreate = !teamId;

  const teamDoc = useDoc<Team>('teams', teamId);
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const players = useCollection<Player>('players', { sortBy: 'name' });

  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hydrated = useRef<string | null>(null);

  const team = teamDoc.data;

  // Hydrate the form exactly once per document so a realtime update from
  // Firestore never clobbers what the administrator is typing.
  useEffect(() => {
    if (!team || hydrated.current === team.id) return;
    hydrated.current = team.id;
    setForm({
      name: team.name ?? '',
      shortName: team.shortName ?? '',
      sportId: team.sportId ?? '',
      logo: team.logo ?? '',
      captainId: team.captainId ?? '',
      viceCaptainId: team.viceCaptainId ?? '',
      coach: team.coach ?? '',
      description: team.description ?? '',
      active: team.active !== false,
    });
  }, [team]);

  const sportOptions = useMemo(
    () => [
      { value: '', label: 'Select a sport' },
      ...sports.data.map((sport) => ({ value: sport.id, label: sport.name })),
    ],
    [sports.data],
  );

  const playerOptions = useMemo(
    () => [
      { value: '', label: 'Not assigned' },
      ...players.data.map((player) => ({
        value: player.id,
        label: player.jerseyNumber ? `${player.name} · #${player.jerseyNumber}` : player.name,
      })),
    ],
    [players.data],
  );

  const set = <K extends keyof TeamForm>(key: K, value: TeamForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoFile = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'png';
      const path = `teams/${teamId ?? `new-${Date.now()}`}/logo.${extension}`;
      const url = await uploadFile(path, file);
      set('logo', url);
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed — paste an image URL instead');
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Team name is required.';
    if (!form.shortName.trim()) next.shortName = 'Short name is required.';
    else if (form.shortName.trim().length > 4) next.shortName = 'Short name must be 4 characters or fewer.';
    if (!form.sportId) next.sportId = 'Pick a sport.';
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
        shortName: form.shortName.trim(),
        sportId: form.sportId,
        logo: form.logo.trim(),
        captainId: form.captainId,
        viceCaptainId: form.viceCaptainId,
        playerIds: team?.playerIds ?? [],
        coach: form.coach.trim(),
        description: form.description.trim(),
        active: form.active,
        wins: team?.wins ?? 0,
        losses: team?.losses ?? 0,
        draws: team?.draws ?? 0,
        points: team?.points ?? 0,
      };

      if (isCreate) {
        const now = Timestamp.now();
        const newId = await createTeam({ ...base, createdAt: now, updatedAt: now });
        await log('TEAM_CREATED', 'team', newId, { label: base.name });
        toast.success('Team created');
      } else {
        const id = teamId ?? '';
        if (!id) throw new Error('Missing team id');
        await updateTeam(id, base);
        await log('TEAM_UPDATED', 'team', id, { label: base.name });
        toast.success('Team updated');
      }
      navigate('/admin/teams');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------- guards */

  if (!isCreate && !teamDoc.isReady) return <PageLoading label="Loading team…" />;

  if (!isCreate && teamDoc.error) {
    return (
      <>
        <AdminHeader title="Edit team" breadcrumbs={[{ label: 'Teams', to: '/admin/teams' }]} />
        <ErrorNotice message={teamDoc.error} />
      </>
    );
  }

  if (!isCreate && !team) {
    return (
      <>
        <AdminHeader title="Edit team" breadcrumbs={[{ label: 'Teams', to: '/admin/teams' }]} />
        <EmptyNotice
          title="Team not found"
          message="This team document no longer exists in Firestore."
          action={<Btn to="/admin/teams">Back to teams</Btn>}
        />
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title={isCreate ? 'Create team' : `Edit ${team?.name ?? 'team'}`}
        subtitle={
          isCreate
            ? 'Register a new squad. Sport and short name are required; everything else can be filled in later.'
            : 'Update the squad record. Existing matches and roster history are untouched.'
        }
        breadcrumbs={[
          { label: 'Teams', to: '/admin/teams' },
          ...(isCreate
            ? [{ label: 'Create' }]
            : [{ label: team?.name ?? 'Team', to: `/admin/teams/${teamId}` }, { label: 'Edit' }]),
        ]}
        actions={<Btn to="/admin/teams">Cancel</Btn>}
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card flush>
          <FormSection step="1" title="Identity" description="How the team appears across the admin panel and public site.">
            <div className="mb-4">
              <span className="block text-sm font-medium text-gray-700">Team logo</span>
              <div className="mt-1.5">
                <FileUpload
                  onUpload={handleLogoFile}
                  previewUrl={form.logo || undefined}
                  onClear={() => set('logo', '')}
                />
              </div>
            </div>
            <FormGrid>
              <FormField
                label="Team name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
                placeholder="e.g. Computer Science"
              />
              <FormField
                label="Short name"
                required
                maxLength={4}
                value={form.shortName}
                onChange={(e) => set('shortName', e.target.value)}
                error={errors.shortName}
                helpText="Max 4 characters — used on scoreboards."
                placeholder="e.g. CS"
              />
            </FormGrid>
            <FormGrid>
              <FormField
                as="select"
                label="Sport"
                required
                value={form.sportId}
                onChange={(e) => set('sportId', e.target.value)}
                error={errors.sportId}
                options={sportOptions}
              />
              <FormField
                label="Logo URL"
                value={form.logo}
                onChange={(e) => set('logo', e.target.value)}
                helpText="Fallback: paste a direct image URL instead of uploading."
                placeholder="https://…"
              />
            </FormGrid>
          </FormSection>

          <FormSection step="2" title="Leadership" description="Captain, vice captain and coaching staff.">
            <FormGrid>
              <FormField
                as="select"
                label="Captain"
                value={form.captainId}
                onChange={(e) => set('captainId', e.target.value)}
                options={playerOptions}
              />
              <FormField
                as="select"
                label="Vice captain"
                value={form.viceCaptainId}
                onChange={(e) => set('viceCaptainId', e.target.value)}
                options={playerOptions}
              />
            </FormGrid>
            <FormGrid>
              <FormField
                label="Coach"
                value={form.coach}
                onChange={(e) => set('coach', e.target.value)}
                placeholder="Coach name"
              />
            </FormGrid>
          </FormSection>

          <FormSection step="3" title="Details" description="Description shown on the public team page, plus visibility.">
            <FormField
              as="textarea"
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              helpText="Short blurb — department, colours, or anything worth knowing."
              placeholder="Who are they, and what do they play?"
            />
            <div className="border-t border-slate-100 pt-1">
              <Toggle
                checked={form.active}
                onChange={(checked) => set('active', checked)}
                label="Active team"
                hint="Inactive teams are archived: hidden from active lists but never deleted."
              />
            </div>
          </FormSection>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Btn to="/admin/teams" variant="secondary" size="md">
            Cancel
          </Btn>
          <Btn type="submit" variant="primary" size="md" disabled={busy || uploading}>
            {busy ? 'Saving…' : isCreate ? 'Create team' : 'Save changes'}
          </Btn>
        </div>
      </form>
    </>
  );
};

export default TeamEditor;
