import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ActionIcon,
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FilterSelect,
  FormGrid,
  LoadingRows,
  SearchInput,
  StatusPill,
  SubLine,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toolbar,
  Toggle,
  TRow,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import FormField from '@/components/admin/FormField';
import { useCollection } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { updateSport } from '@/services/sports/sportService';
import type { Match, ScoringType, Sport } from '@/types';
import { FiEdit2, FiEye, FiLock, FiUnlock } from 'react-icons/fi';

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

const scoreLabel = (value?: ScoringType | string) =>
  value ? String(value).replace(/_/g, ' ') : '—';

const SportIcon: React.FC<{ sport: Sport }> = ({ sport }) => {
  const icon = sport.icon ?? '';
  if (/^(https?:|data:)/.test(icon)) {
    return <img src={icon} alt="" className="h-6 w-6 rounded object-cover" />;
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center text-base leading-none">
      {icon || '•'}
    </span>
  );
};

const SportsManager: React.FC = () => {
  const { log } = useAuditLog();
  const navigate = useNavigate();

  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  const matches = useCollection<Match>('matches');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [disabling, setDisabling] = useState<Sport | null>(null);
  const [editing, setEditing] = useState<Sport | null>(null);
  const [busy, setBusy] = useState(false);

  const error = sports.error ?? matches.error;

  const matchCounts = useMemo(() => {
    const counts = new Map<string, number>();
    matches.data.forEach((match) => {
      if (match.sportId) counts.set(match.sportId, (counts.get(match.sportId) ?? 0) + 1);
    });
    return counts;
  }, [matches.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sports.data.filter((sport) => {
      if (statusFilter === 'active' && !sport.active) return false;
      if (statusFilter === 'disabled' && sport.active) return false;
      if (!term) return true;
      return `${sport.name} ${sport.slug} ${sport.scoringType}`.toLowerCase().includes(term);
    });
  }, [sports.data, search, statusFilter]);

  const confirmDisable = async () => {
    if (!disabling) return;
    setBusy(true);
    try {
      await updateSport(disabling.id, { active: false });
      await log('SPORT_DISABLED', 'sport', disabling.id, { label: disabling.name });
      toast.success(`${disabling.name} disabled`);
      setDisabling(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Disable failed');
    } finally {
      setBusy(false);
    }
  };

  const enable = async (sport: Sport) => {
    setBusy(true);
    try {
      await updateSport(sport.id, { active: true });
      await log('SPORT_UPDATED', 'sport', sport.id, {
        label: sport.name,
        metadata: { enabled: true },
      });
      toast.success(`${sport.name} enabled`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enable failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminHeader
        title="Sports"
        subtitle="Every discipline available to the event. Sports can be disabled — never deleted — so historical results survive."
        actions={
          <Btn to="/admin/matches" variant="secondary">
            Matches
          </Btn>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-[13px] leading-relaxed text-amber-700 dark:text-amber-200">
        <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <span>
          There is no delete control here on purpose. Disabling a sport hides it from new match
          creation; every match, team and player already recorded stays exactly as it is.
        </span>
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sport, slug or scoring type…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'Any status' },
            { value: 'active', label: 'Active' },
            { value: 'disabled', label: 'Disabled' },
          ]}
        />
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {sports.data.length}
        </span>
      </Toolbar>

      <Card flush>
        {sports.isLoading ? (
          <LoadingRows rows={6} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={
              sports.data.length === 0 ? 'No sports in Firestore' : 'No sports match these filters'
            }
            message={
              sports.data.length === 0
                ? 'Run npm run seed to create the disciplines the event runs on.'
                : 'Try clearing the search box or the status filter.'
            }
          />
        ) : (
          <TableShell minW={1020}>
            <THead>
              <tr>
                {['Icon', 'Name', 'Scoring Type', 'Team Based', 'Max / Min Players', 'Matches', 'Status'].map(
                  (heading) => (
                    <Th key={heading}>{heading}</Th>
                  ),
                )}
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {rows.map((sport) => {
                const matchCount = matchCounts.get(sport.id) ?? 0;
                return (
                  <React.Fragment key={sport.id}>
                    <TRow>
                      <Td>
                        <SportIcon sport={sport} />
                      </Td>
                      <Td strong className="max-w-[220px]">
                        <span
                          className={
                            sport.active
                              ? 'block truncate font-bold text-ink'
                              : 'block truncate font-bold text-ink-faint'
                          }
                        >
                          {sport.name}
                        </span>
                        <SubLine>{sport.slug}</SubLine>
                      </Td>
                      <Td className="whitespace-nowrap font-semibold capitalize">
                        {scoreLabel(sport.scoringType)}
                      </Td>
                      <Td className="whitespace-nowrap">{sport.teamBased ? 'Yes' : 'No'}</Td>
                      <Td numeric>
                        {sport.maxPlayersPerTeam ?? '—'} / {sport.minPlayersPerTeam ?? '—'}
                      </Td>
                      <Td numeric>
                        <span className="inline-flex items-center gap-1.5">
                          {matchCount}
                          {matchCount > 0 && (
                            <FiLock
                              className="h-3.5 w-3.5 text-amber-500"
                              aria-label="Historical matches — cannot be removed"
                            />
                          )}
                        </span>
                      </Td>
                      <Td>
                        <StatusPill value={sport.active ? 'active' : 'disabled'} />
                      </Td>
                      <Td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionIcon
                            label="View"
                            onClick={() => navigate(`/admin/sports/${sport.id}`)}
                          >
                            <FiEye className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon label="Edit" onClick={() => setEditing(sport)}>
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </ActionIcon>
                          {sport.active ? (
                            <ActionIcon
                              label="Disable sport"
                              disabled={busy}
                              onClick={() => setDisabling(sport)}
                            >
                              <FiLock className="h-3.5 w-3.5" />
                            </ActionIcon>
                          ) : (
                            <ActionIcon
                              label="Enable sport"
                              disabled={busy}
                              primary
                              onClick={() => enable(sport)}
                            >
                              <FiUnlock className="h-3.5 w-3.5" />
                            </ActionIcon>
                          )}
                        </div>
                      </Td>
                    </TRow>
                    {matchCount > 0 && (
                      <tr className="bg-amber-500/[0.07]">
                        <td colSpan={8} className="px-3.5 py-1.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            <FiLock className="h-3 w-3" />
                            {matchCount} historical {matchCount === 1 ? 'match' : 'matches'} — this
                            sport can be disabled but never removed.
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Card>

      <ConfirmDialog
        isOpen={disabling !== null}
        title="Disable this sport?"
        message={
          disabling
            ? `${disabling.name} will be hidden from new match creation. ${
                matchCounts.get(disabling.id) ?? 0
              } recorded match(es), teams and players stay in Firestore untouched — nothing is deleted.`
            : ''
        }
        confirmText={busy ? 'Disabling…' : 'Disable sport'}
        isDestructive
        onConfirm={confirmDisable}
        onCancel={() => setDisabling(null)}
      />

      {editing && (
        <SportEditModal sport={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
        <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface text-left text-ink shadow-2xl backdrop-blur-2xl">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-soft/70 px-6 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-ink">Edit sport</h3>
              <p className="truncate text-[11px] text-ink-faint">
                {sport.slug} · id {sport.id}
              </p>
            </div>
            <Btn size="xs" variant="ghost" onClick={onClose}>
              Close
            </Btn>
          </header>

          <div className="px-6 py-5">
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
                options={SCORING_TYPES.map((value) => ({
                  value,
                  label: value.replace(/_/g, ' '),
                }))}
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

            <div className="border-t border-line pt-2">
              <Toggle
                checked={teamBased}
                onChange={setTeamBased}
                label="Team based"
                hint="Off means individuals compete (chess, carrom, racing)."
              />
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2.5 border-t border-line bg-surface-soft/70 px-6 py-3.5">
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

export default SportsManager;
