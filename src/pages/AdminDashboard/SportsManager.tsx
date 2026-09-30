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
  Toolbar,
  Toggle,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import FormField from '@/components/admin/FormField';
import { useCollection } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useTheme } from '@/contexts/ThemeContext';
import { updateSport } from '@/services/sports/sportService';
import type { Match, ScoringType, Sport } from '@/types';
import { cn } from '@/utils/cn';
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
  const { theme } = useTheme();
  const isDay = theme === 'day';

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

      <div className={cn(
        'mb-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-relaxed',
        isDay ? 'border-amber-200 bg-amber-50/80 text-amber-900' : 'border-amber-500/30 bg-amber-950/30 text-amber-200',
      )}>
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
        <span className={cn('ml-auto text-[12px] tabular-nums font-bold', isDay ? 'text-slate-500' : 'text-slate-400')}>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] border-collapse text-left">
              <thead>
                <tr className={cn(
                  'border-b transition-colors',
                  isDay ? 'border-slate-200 bg-slate-50/90 text-slate-600' : 'border-white/10 bg-[#0B1A30]/60 text-slate-400'
                )}>
                  {['Icon', 'Name', 'Scoring Type', 'Team Based', 'Max / Min Players', 'Matches', 'Status'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3.5 text-[10px] font-black uppercase tracking-wider"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                  <th className="whitespace-nowrap px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDay ? 'divide-slate-100 bg-white' : 'divide-white/5 bg-transparent')}>
                {rows.map((sport) => {
                  const matchCount = matchCounts.get(sport.id) ?? 0;
                  return (
                    <React.Fragment key={sport.id}>
                      <tr
                        className={cn(
                          'transition-colors',
                          isDay ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.03]',
                        )}
                      >
                        <td className="px-4 py-3.5">
                          <SportIcon sport={sport} />
                        </td>
                        <td className="max-w-[220px] px-4 py-3.5">
                          <span
                            className={cn(
                              'block truncate text-[13px] font-black',
                              sport.active
                                ? isDay ? 'text-slate-900' : 'text-white'
                                : 'text-slate-400',
                            )}
                          >
                            {sport.name}
                          </span>
                          <span className={cn('block truncate text-[11px]', isDay ? 'text-slate-400' : 'text-slate-500')}>
                            {sport.slug}
                          </span>
                        </td>
                        <td className={cn('whitespace-nowrap px-4 py-3.5 text-[13px] capitalize font-medium', isDay ? 'text-slate-700' : 'text-slate-300')}>
                          {scoreLabel(sport.scoringType)}
                        </td>
                        <td className={cn('whitespace-nowrap px-4 py-3.5 text-[13px]', isDay ? 'text-slate-600' : 'text-slate-400')}>
                          {sport.teamBased ? 'Yes' : 'No'}
                        </td>
                        <td className={cn('whitespace-nowrap px-4 py-3.5 font-mono text-[13px] tabular-nums', isDay ? 'text-slate-700' : 'text-slate-300')}>
                          {sport.maxPlayersPerTeam ?? '—'} / {sport.minPlayersPerTeam ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className={cn('inline-flex items-center gap-1.5 font-mono text-[13px] font-bold tabular-nums', isDay ? 'text-slate-800' : 'text-slate-200')}>
                            {matchCount}
                            {matchCount > 0 && (
                              <FiLock
                                className="h-3.5 w-3.5 text-amber-500"
                                aria-label="Historical matches — cannot be removed"
                              />
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusPill value={sport.active ? 'active' : 'disabled'} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
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
                        </td>
                      </tr>
                      {matchCount > 0 && (
                        <tr className={isDay ? 'bg-amber-50/40' : 'bg-amber-950/20'}>
                          <td colSpan={8} className="px-4 py-1.5">
                            <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold', isDay ? 'text-amber-800' : 'text-amber-300')}>
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
              </tbody>
            </table>
          </div>
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
  const { theme } = useTheme();
  const isDay = theme === 'day';

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
        <div className={cn(
          'relative w-full max-w-xl rounded-2xl text-left shadow-2xl border backdrop-blur-2xl overflow-hidden',
          isDay ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10' : 'bg-[#071426] border-white/10 text-white shadow-black/80',
        )}>
          <header className={cn(
            'flex items-center justify-between gap-3 border-b px-6 py-4',
            isDay ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-white/[0.02]',
          )}>
            <div className="min-w-0">
              <h3 className={cn('truncate text-sm font-black', isDay ? 'text-slate-900' : 'text-white')}>Edit sport</h3>
              <p className={cn('truncate text-[11px]', isDay ? 'text-slate-400' : 'text-slate-500')}>
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

            <div className={cn('border-t pt-2', isDay ? 'border-slate-100' : 'border-white/5')}>
              <Toggle
                checked={teamBased}
                onChange={setTeamBased}
                label="Team based"
                hint="Off means individuals compete (chess, carrom, racing)."
              />
            </div>
          </div>

          <footer className={cn(
            'flex items-center justify-end gap-2.5 border-t px-6 py-3.5',
            isDay ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-black/20',
          )}>
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
