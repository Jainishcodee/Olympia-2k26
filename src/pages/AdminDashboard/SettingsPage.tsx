import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AdminHeader,
  AdminTabs,
  Btn,
  Card,
  ErrorNotice,
  FormGrid,
  PageLoading,
  StatusPill,
  Toggle,
} from '@/components/admin/kit';
import FormField from '@/components/admin/FormField';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { getSettings, saveSettings } from '@/services/settings/settingsService';
import { DEFAULT_SETTINGS, SystemSettings } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiSave, FiArrowRight } from 'react-icons/fi';

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'scoring', label: 'Live scoring' },
  { id: 'interaction', label: 'Public interaction' },
  { id: 'display', label: 'Display defaults' },
  { id: 'security', label: 'Security' },
];

const REACTION_CHIPS: { value: string; emoji: string; label: string }[] = [
  { value: 'fire', emoji: '🔥', label: 'Fire' },
  { value: 'clap', emoji: '👏', label: 'Applause' },
  { value: 'lightning', emoji: '⚡', label: 'Lightning' },
  { value: 'heart', emoji: '❤️', label: 'Heart' },
  { value: 'wow', emoji: '😮', label: 'Wow' },
  { value: 'trophy', emoji: '🏆', label: 'Trophy' },
  { value: 'muscle', emoji: '💪', label: 'Flex' },
];

type Settings = SystemSettings;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const [section, setSection] = useState('general');
  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getSettings();
      if (cancelled) return;
      setForm(settings);
      setSaved(settings);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  );

  const invalid = useMemo(() => {
    if (!form.eventName.trim()) return 'Event name is required.';
    if (form.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail))
      return 'Support email is not a valid address.';
    if (form.sessionTimeoutMinutes < 5)
      return 'Session timeout must be at least 5 minutes.';
    if (form.auditRetentionDays < 1)
      return 'Audit retention must be at least 1 day.';
    if (form.goalClockPauseSeconds < 0) return 'Clock pause seconds cannot be negative.';
    return null;
  }, [form]);

  const save = async () => {
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSaving(true);
    try {
      const next: Settings = { ...form, updatedBy: user?.uid ?? 'unknown' };
      await saveSettings(next);
      setForm(next);
      setSaved(next);
      await log('SETTINGS_UPDATED', 'settings', 'default', {
        label: form.eventName,
        metadata: { section },
      });
      toast.success('Settings saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoading label="Loading settings…" />;

  const dirtyChip = dirty ? <StatusPill value="Unsaved changes" /> : null;

  return (
    <>
      <AdminHeader
        title="Settings"
        subtitle="Global defaults for the OLYMPIA 2K26 platform. Changes apply to newly created matches — existing matches keep the values they were created with."
        badge={dirtyChip}
        actions={
          <>
            <Btn to="/admin/scoring-simulator" variant="secondary" icon={<FiArrowRight className="h-4 w-4" />}>
              Scoring simulator
            </Btn>
            <Btn
              variant="primary"
              onClick={save}
              disabled={saving || !dirty || invalid !== null}
              icon={<FiSave className="h-4 w-4" />}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Btn>
          </>
        }
      />

      {error && <ErrorNotice message={error} className="mb-5" />}
      {invalid && dirty && <ErrorNotice message={invalid} className="mb-5" />}

      <AdminTabs items={SECTIONS} active={section} onChange={setSection} layoutPrefix="settings-tab" />

      <Card flush>
        {/* ---------------------------------------------------- general */}
        {section === 'general' && (
          <div className="px-5 py-5">
            <h3 className={cn('mb-4 text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>General</h3>
            <FormGrid cols={2}>
              <FormField
                label="Event name"
                required
                value={form.eventName}
                onChange={(e) => set('eventName', e.target.value)}
              />
              <FormField
                label="Tagline"
                value={form.eventTagline}
                onChange={(e) => set('eventTagline', e.target.value)}
              />
              <FormField
                label="Support email"
                type="email"
                value={form.supportEmail}
                onChange={(e) => set('supportEmail', e.target.value)}
              />
              <FormField
                label="Timezone"
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                helpText="Used when rendering kick-off times."
              />
            </FormGrid>
            <div className="max-w-xs">
              <FormField
                label="Locale"
                value={form.locale}
                onChange={(e) => set('locale', e.target.value)}
                helpText="BCP-47 tag, e.g. en-IN."
              />
            </div>
          </div>
        )}

        {/* --------------------------------------------------- branding */}
        {section === 'branding' && (
          <div className="px-5 py-5">
            <h3 className={cn('mb-1 text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>Branding</h3>
            <p className={cn('mb-4 text-[12px]', isDay ? 'text-slate-400' : 'text-white/50')}>
              Navy and gold are the identity. Blue, yellow and coral are environmental accents only.
            </p>
            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  ['brandPrimary', 'Electric blue', '#1264FF'],
                  ['brandGold', 'Metallic gold', '#D9A441'],
                  ['brandAccent', 'Olympia navy', '#071426'],
                  ['brandYellow', 'Signal yellow', '#FFD21F'],
                ] as const
              ).map(([key, label, fallback]) => (
                <label key={key} className="block">
                  <span className={cn('block text-[11px] font-semibold uppercase tracking-wider', isDay ? 'text-slate-400' : 'text-white/50')}>
                    {label}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={form[key] || fallback}
                      onChange={(e) => set(key, e.target.value)}
                      className={cn(
                        'h-9 w-11 shrink-0 cursor-pointer rounded border p-1',
                        isDay ? 'border-slate-300 bg-white' : 'border-white/10 bg-[#071426]',
                      )}
                      aria-label={label}
                    />
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className={cn(
                        'h-9 w-full rounded-md border px-2.5 font-mono text-[13px] uppercase outline-none focus:border-[#1264FF]',
                        isDay ? 'border-slate-300 bg-white text-slate-700' : 'border-white/10 bg-[#071426] text-white/90',
                      )}
                    />
                  </span>
                </label>
              ))}
            </div>
            <div className="max-w-md">
              <FormField
                label="Logo URL"
                value={form.logoUrl}
                onChange={(e) => set('logoUrl', e.target.value)}
                placeholder="https://… or /images/logo.png"
                helpText="Leave empty to use the built-in OLYMPIA wordmark."
              />
            </div>
            <div
              className={cn(
                'mt-4 flex items-center gap-4 rounded-lg border px-4 py-3 shadow-sm',
                isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]',
              )}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-md text-base font-black shadow-inner"
                style={{ backgroundColor: form.brandAccent, color: form.brandGold }}
              >
                O
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-black tracking-[0.18em]" style={{ color: form.brandGold }}>
                  {(form.eventName || 'OLYMPIA').toUpperCase()}
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: form.brandPrimary }}>
                  {form.eventTagline}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------- live scoring */}
        {section === 'scoring' && (
          <div className="px-5 py-5">
            <h3 className={cn('mb-4 text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>Live scoring</h3>
            <FormGrid cols={2}>
              <FormField
                as="select"
                label="Default match clock"
                value={form.defaultClockMode}
                onChange={(e) => set('defaultClockMode', e.target.value as Settings['defaultClockMode'])}
                options={[
                  { value: 'period', label: 'Period (football, basketball)' },
                  { value: 'half', label: 'Half' },
                  { value: 'overs', label: 'Overs (cricket)' },
                  { value: 'none', label: 'No clock' },
                ]}
              />
              <FormField
                label="Goal clock pause (seconds)"
                type="number"
                min={0}
                value={String(form.goalClockPauseSeconds)}
                onChange={(e) => set('goalClockPauseSeconds', Number(e.target.value) || 0)}
                helpText="0 disables the automatic pause."
              />
            </FormGrid>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Toggle
                checked={form.allowOperatorUndo}
                onChange={(v) => set('allowOperatorUndo', v)}
                label="Allow operator undo"
                hint="The scorekeeper can reverse the last event."
              />
              <Toggle
                checked={form.autoAdvanceOvers}
                onChange={(v) => set('autoAdvanceOvers', v)}
                label="Auto-advance overs"
                hint="Six legal balls move the cricket over on."
              />
              <Toggle
                checked={form.confirmBeforeEndMatch}
                onChange={(v) => set('confirmBeforeEndMatch', v)}
                label="Confirm before ending a match"
                hint="Prevents an accidental FINAL on the console."
              />
            </div>
            <div
              className={cn(
                'mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-3',
                isDay ? 'border-slate-300 bg-slate-50' : 'border-white/15 bg-white/[0.03]',
              )}
            >
              <span className={cn('text-[12px]', isDay ? 'text-slate-600' : 'text-white/60')}>
                Verify these rules against sample scores before a live event.
              </span>
              <Btn size="xs" to="/admin/scoring-simulator">
                Open scoring simulator
              </Btn>
            </div>
          </div>
        )}

        {/* ----------------------------------------- public interaction */}
        {section === 'interaction' && (
          <div className="px-5 py-5">
            <h3 className={cn('mb-1 text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>Public interaction</h3>
            <p className={cn('mb-4 text-[12px]', isDay ? 'text-slate-400' : 'text-white/50')}>
              Defaults applied when a match is created. Each match can override them individually.
            </p>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Toggle
                checked={form.defaultReactionsEnabled}
                onChange={(v) => set('defaultReactionsEnabled', v)}
                label="Reactions enabled by default"
                hint="Live emoji bursts on the public page."
              />
              <Toggle
                checked={form.defaultRatingsEnabled}
                onChange={(v) => set('defaultRatingsEnabled', v)}
                label="Ratings enabled by default"
                hint="Star ratings on players."
              />
              <Toggle
                checked={form.defaultReviewsEnabled}
                onChange={(v) => set('defaultReviewsEnabled', v)}
                label="Reviews enabled by default"
                hint="Written reviews, moderated at /admin/reviews."
              />
              <Toggle
                checked={form.defaultVotingEnabled}
                onChange={(v) => set('defaultVotingEnabled', v)}
                label="Voting enabled by default"
                hint="Anonymous who-wins polls."
              />
            </div>

            <h4 className={cn('mb-2 mt-6 text-[11px] font-bold uppercase tracking-wider', isDay ? 'text-slate-400' : 'text-white/50')}>
              Available reactions
            </h4>
            <div className="flex flex-wrap gap-2">
              {REACTION_CHIPS.map((chip) => {
                const active = form.enabledReactions.includes(chip.value);
                return (
                  <button
                    key={chip.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set(
                        'enabledReactions',
                        active
                          ? form.enabledReactions.filter((value) => value !== chip.value)
                          : [...form.enabledReactions, chip.value],
                      )
                    }
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                      active
                        ? isDay
                          ? 'border-[#1264FF] bg-[#1264FF]/10 text-slate-900'
                          : 'border-[#1264FF] bg-[#1264FF]/20 text-white shadow-sm shadow-[#1264FF]/30'
                        : isDay
                          ? 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800'
                          : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white',
                    )}
                  >
                    <span className="text-[15px]">{chip.emoji}</span>
                    {chip.label}
                  </button>
                );
              })}
            </div>
            {form.enabledReactions.length === 0 && (
              <p className="mt-2 text-[12px] font-semibold text-red-500">
                At least one reaction should stay enabled, otherwise spectators see an empty bar.
              </p>
            )}
          </div>
        )}

        {/* -------------------------------------------------- display */}
        {section === 'display' && (
          <div className="px-5 py-5">
            <h3 className={cn('mb-4 text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>Display defaults</h3>
            <span className={cn('mb-2 block text-[11px] font-semibold uppercase tracking-wider', isDay ? 'text-slate-400' : 'text-white/50')}>
              Default match display
            </span>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: 'single_landscape' as const,
                    title: 'Single landscape',
                    copy: 'Teams either side of a centred score — the standard broadcast layout.',
                  },
                  {
                    value: 'dual_portrait' as const,
                    title: 'Dual portrait',
                    copy: 'Two stacked team panels — best for a tall LED or vertical stream.',
                  },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set('defaultDisplayMode', option.value)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors',
                    form.defaultDisplayMode === option.value
                      ? isDay
                        ? 'border-[#1264FF] bg-[#1264FF]/5 ring-2 ring-[#1264FF]/20'
                        : 'border-[#1264FF] bg-[#1264FF]/15 ring-2 ring-[#1264FF]/30'
                      : isDay
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-3.5 w-3.5 rounded-full border-2',
                        form.defaultDisplayMode === option.value
                          ? 'border-[#1264FF] bg-[#1264FF]'
                          : isDay ? 'border-slate-300' : 'border-white/20',
                      )}
                    />
                    <span className={cn('text-[13px] font-bold', isDay ? 'text-slate-800' : 'text-white')}>{option.title}</span>
                  </span>
                  <span className={cn('mt-2 block text-[12px] leading-relaxed', isDay ? 'text-slate-500' : 'text-white/60')}>{option.copy}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Toggle
                checked={form.defaultFeaturedEnabled}
                onChange={(v) => set('defaultFeaturedEnabled', v)}
                label="Feature matches by default"
                hint="Pins new matches to the public homepage."
              />
              <Toggle
                checked={form.showScorersOnDisplay}
                onChange={(v) => set('showScorersOnDisplay', v)}
                label="Show scorers on the display"
                hint="Name and minute beside each goal."
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------- security */}
        {section === 'security' && (
          <div className="px-5 py-5">
            <h3 className={cn('mb-1 text-sm font-bold', isDay ? 'text-slate-900' : 'text-white')}>Security</h3>
            <p className={cn('mb-4 text-[12px]', isDay ? 'text-slate-400' : 'text-white/50')}>
              Client-side controls are convenience only — <strong>Firebase Security Rules</strong> and the trusted
              backend are what actually enforce permissions.
            </p>
            <FormGrid cols={2}>
              <FormField
                label="Session timeout (minutes)"
                type="number"
                min={5}
                value={String(form.sessionTimeoutMinutes)}
                onChange={(e) => set('sessionTimeoutMinutes', Number(e.target.value) || 0)}
              />
              <FormField
                label="Audit retention (days)"
                type="number"
                min={1}
                value={String(form.auditRetentionDays)}
                onChange={(e) => set('auditRetentionDays', Number(e.target.value) || 0)}
              />
              <FormField
                as="select"
                label="Minimum role for the scoring console"
                value={form.scoringAccessRole}
                onChange={(e) => set('scoringAccessRole', e.target.value as Settings['scoringAccessRole'])}
                options={[
                  { value: 'score_operator', label: 'Score operator (most permissive)' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'super_admin', label: 'Super admin only' },
                ]}
              />
            </FormGrid>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Toggle
                checked={form.requireConfirmOnDelete}
                onChange={(v) => set('requireConfirmOnDelete', v)}
                label="Confirm destructive actions"
                hint="Every archive/delete asks first."
              />
            </div>
            <div
              className={cn(
                'mt-5 rounded-lg border px-4 py-3 shadow-sm',
                isDay
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-[#D9A441]/30 bg-[#D9A441]/10',
              )}
            >
              <p className={cn('text-[13px] font-semibold', isDay ? 'text-amber-900' : 'text-[#F5CA6E]')}>
                Passwords are never displayed or stored here.
              </p>
              <p className={cn('mt-0.5 text-[12px] leading-relaxed', isDay ? 'text-amber-800' : 'text-white/70')}>
                Authentication lives in Firebase Authentication. Administrator accounts are provisioned by a trusted
                backend via Cloud Functions — see <code className="font-mono">functions/src/admins/createAdmin.ts</code>.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ------------------------------------------------- sticky footer */}
      <div
        className={cn(
          'mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-sm',
          isDay
            ? 'border-slate-200 bg-white'
            : 'border-white/10 bg-[#071426]',
        )}
      >
        <span
          className={cn(
            'text-[12px]',
            dirty
              ? isDay ? 'font-semibold text-[#A9761B]' : 'font-semibold text-[#F5CA6E]'
              : isDay ? 'text-slate-400' : 'text-white/40',
          )}
        >
          {dirty
            ? 'You have unsaved changes — nothing reaches Firestore until you save.'
            : 'All changes are saved.'}
        </span>
        <span className="flex gap-2">
          <Btn onClick={() => navigate('/admin')} variant="ghost">
            Back to dashboard
          </Btn>
          <Btn
            variant="primary"
            onClick={save}
            disabled={saving || !dirty || invalid !== null}
            icon={<FiSave className="h-4 w-4" />}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Btn>
        </span>
      </div>
    </>
  );
};

export default SettingsPage;
