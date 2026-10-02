import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import { useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuditLog } from '@/hooks/useAuditLog';
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
import { createAdminProfile, updateAdminProfile } from '@/services/admin/adminService';
import type { Admin, AdminRole, AuditAction } from '@/types';
import toast from 'react-hot-toast';
import { FiCopy, FiLock, FiShield } from 'react-icons/fi';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Administrator editor — create (`/admin/admins/create`) and edit
 *  (`/admin/admins/:adminId/edit`).
 *
 *  SECURITY: there is NO password input of any kind on this screen, and the
 *  browser cannot create a Firebase Authentication user. Provisioning is a
 *  backend job — the `createAdmin` Cloud Function (functions/src/admins/
 *  createAdmin.ts) creates the Auth user, sets the custom claims and writes
 *  the profile. This form writes `admins/{uid}` only when a uid is known.
 * ==========================================================================*/

type AdminRow = Admin & { id: string };

interface FormState {
  uid: string;
  displayName: string;
  email: string;
  role: AdminRole | '';
  active: boolean;
  permissions: string[];
}

interface FormErrors {
  displayName?: string;
  email?: string;
  role?: string;
  uid?: string;
}

const EMPTY: FormState = {
  uid: '',
  displayName: '',
  email: '',
  role: 'admin',
  active: true,
  permissions: [],
};

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: 'Super admin — unrestricted access' },
  { value: 'admin', label: 'Admin — manage competition and content' },
  { value: 'score_operator', label: 'Score operator — scoring console only' },
  { value: 'content_manager', label: 'Content manager — announcements and media' },
];

/** Permission keys held by the profile document (`Admin.permissions: string[]`). */
const PERMISSIONS: { key: string; label: string; hint: string }[] = [
  { key: 'matches:write', label: 'Matches & fixtures', hint: 'Create, edit, cancel and operate matches.' },
  { key: 'scores:write', label: 'Scoring console', hint: 'Live scores, periods and match events.' },
  { key: 'teams:write', label: 'Teams, players & venues', hint: 'Rosters, registrations and venues.' },
  { key: 'content:write', label: 'Announcements', hint: 'Publish, unpublish and archive notices.' },
  { key: 'moderation:write', label: 'Moderation', hint: 'Hide or restore public reviews.' },
  { key: 'engagement:write', label: 'Engagement switches', hint: 'Reactions, ratings and voting per match.' },
  { key: 'admins:write', label: 'Administrators', hint: 'Create profiles and disable accounts.' },
  { key: 'settings:write', label: 'System settings', hint: 'Global configuration and branding.' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const projectId: string =
  (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '<project-id>';
const CREATE_ADMIN_ENDPOINT = `https://us-central1-${projectId}.cloudfunctions.net/createAdmin`;

const AdminEditor: React.FC = () => {
  const { adminId } = useParams<{ adminId: string }>();
  const isEdit = Boolean(adminId);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();

  const existing = useDoc<AdminRow>('admins', adminId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [highlightPanel, setHighlightPanel] = useState(false);

  // Prefill when editing.
  useEffect(() => {
    if (!existing.data) return;
    const admin = existing.data;
    setForm({
      uid: admin.uid || admin.id,
      displayName: admin.displayName ?? '',
      email: admin.email ?? '',
      role: admin.role ?? 'admin',
      active: admin.active !== false,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    });
  }, [existing.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const togglePermission = (key: string) =>
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((item) => item !== key)
        : [...prev.permissions, key],
    }));

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.displayName.trim()) next.displayName = 'Display name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.role) next.role = 'Role is required.';
    if (!isEdit && form.uid.trim() && form.uid.trim().length < 6) {
      next.uid = 'That does not look like a Firebase Auth UID.';
    }
    return next;
  };

  const writeAudit = (
    action: AuditAction | 'ADMIN_UPDATED',
    uid: string,
    label: string,
    metadata: Record<string, unknown>,
  ) => log(action as AuditAction, 'admin', uid, { label, metadata });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Fix the highlighted fields before saving.');
      return;
    }

    const payload = {
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      role: (form.role || 'admin') as AdminRole,
      active: form.active,
      permissions: form.permissions,
    };

    setSaving(true);
    try {
      if (isEdit && adminId) {
        const patch: Partial<Admin> = { ...payload };
        await updateAdminProfile(adminId, patch);
        await writeAudit('ADMIN_UPDATED', adminId, payload.displayName, {
          role: payload.role,
          active: payload.active,
          permissions: payload.permissions.length,
        });
        toast.success('Administrator updated');
        navigate('/admin/admins');
        return;
      }

      const uid = form.uid.trim();
      if (!uid) {
        setHighlightPanel(true);
        toast.error(
          'No Firebase Auth UID supplied — no account was created. Provision it with the createAdmin function first.',
        );
        return;
      }

      await createAdminProfile(uid, {
        ...payload,
        uid,
        createdAt: null as unknown as Timestamp,
        updatedAt: null as unknown as Timestamp,
      });
      await writeAudit('ADMIN_CREATED', uid, payload.displayName, {
        role: payload.role,
        email: payload.email,
        source: 'profile-form',
      });
      toast.success('Profile document created — confirm the Firebase Authentication account exists.');
      navigate('/admin/admins');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const provisionPayload = JSON.stringify(
    {
      email: form.email.trim() || '<email>',
      password: '<set by the backend operator — never entered in this UI>',
      role: form.role || 'admin',
      displayName: form.displayName.trim() || '<name>',
    },
    null,
    2,
  );

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(provisionPayload);
      toast.success('Payload copied to clipboard');
    } catch {
      toast.error('Copy failed — select the payload manually.');
    }
  };

  if (isEdit && existing.isLoading) return <PageLoading label="Loading administrator…" />;
  if (isEdit && existing.error)
    return (
      <div className="py-10">
        <ErrorNotice message={existing.error} />
      </div>
    );
  if (isEdit && !existing.data)
    return (
      <div className="py-10">
        <EmptyNotice
          title="Administrator not found"
          message={`No admin profile exists with id "${adminId}".`}
          action={<Btn to="/admin/admins">Back to administrators</Btn>}
        />
      </div>
    );

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Edit administrator' : 'Create administrator'}
        subtitle={
          isEdit
            ? 'Update the profile document. Credentials always stay in Firebase Authentication.'
            : 'Collect the details here, provision the account on the trusted backend, then attach the profile.'
        }
        breadcrumbs={[
          { label: 'Administrators', to: '/admin/admins' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
        actions={<Btn to="/admin/admins">Cancel</Btn>}
      />

      {/* ------------------------------------------- security note banner */}
      <div
        className={cn(
          'mb-5 flex items-start gap-3 rounded-lg border px-4 py-3',
          isDay
            ? 'border-slate-200 bg-white text-slate-600 shadow-sm'
            : 'border-white/10 bg-white/[0.04] text-slate-300'
        )}
      >
        <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-[#1264FF]" />
        <p className="text-[13px] leading-relaxed">
          <span className={cn('font-bold', isDay ? 'text-slate-800' : 'text-white')}>
            No password fields, ever.
          </span>{' '}
          Account credentials are created in Firebase Authentication by an administrator via Cloud Functions —
          this form only writes the <span className={cn('font-mono text-[12px]', isDay ? 'text-amber-700 bg-amber-50 px-1 py-0.5 rounded' : 'text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded')}>admins/&#123;uid&#125;</span>{' '}
          profile document.
        </p>
      </div>

      <form onSubmit={submit} noValidate>
        <Card flush>
          {/* -------------------------------------------------- identity */}
          <FormSection step="1" title="Identity" description="How this person appears across the panel.">
            {!isEdit && (
              <div className="mb-4">
                <FormField
                  label="Firebase Auth UID"
                  placeholder="e.g. 7mQ2pX9kL0aB3cD4"
                  value={form.uid}
                  onChange={(e) => set('uid', e.target.value)}
                  error={errors.uid}
                  helpText="Optional. Leave empty until the account has been provisioned by the backend — the profile document can only be written against a real UID."
                />
              </div>
            )}

            <FormGrid cols={2}>
              <FormField
                label="Display name"
                required
                placeholder="e.g. Priya Nair"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                error={errors.displayName}
              />
              <FormField
                label="Email"
                type="email"
                required
                placeholder="name@olympia2k26.app"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                error={errors.email}
              />
            </FormGrid>

            <p
              className={cn(
                '-mt-2 mb-4 flex items-start gap-2 rounded-md border px-3 py-2.5 text-[12px] leading-relaxed',
                isDay
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : 'border-white/10 bg-white/[0.03] text-slate-400'
              )}
            >
              <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>
                Account credentials are created in Firebase Authentication by an administrator via Cloud
                Functions.{' '}
                {isEdit
                  ? 'Changing the email here updates the profile document only — the Firebase Auth sign-in email is changed from the backend.'
                  : 'The sign-in email must already exist in Firebase Authentication before this profile is usable.'}
              </span>
            </p>

            <FormGrid cols={1}>
              <FormField
                as="select"
                label="Role"
                required
                value={form.role}
                onChange={(e) => set('role', e.target.value as AdminRole)}
                error={errors.role}
                options={[
                  { value: '', label: 'Select a role' },
                  ...ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
                ]}
                helpText="Roles come from the AdminRole union: super_admin · admin · score_operator · content_manager."
              />
            </FormGrid>
          </FormSection>

          {/* ---------------------------------------------------- status */}
          <FormSection step="2" title="Status" description="Disabled administrators keep their profile but lose access.">
            <Toggle
              checked={form.active}
              onChange={(value) => set('active', value)}
              label="Active"
              hint="Toggling this from the list view is audited as ADMIN_DISABLED / ADMIN_REACTIVATED."
            />
          </FormSection>

          {/* ---------------------------------------------- permissions */}
          <FormSection
            step="3"
            title="Permissions"
            description="Stored on the profile document as an array of capability keys."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => {
                const checked = form.permissions.includes(permission.key);
                return (
                  <label
                    key={permission.key}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-all',
                      checked
                        ? isDay
                          ? 'border-[#1264FF] bg-[#1264FF]/10 text-slate-900 shadow-sm'
                          : 'border-[#1264FF] bg-[#1264FF]/20 text-white'
                        : isDay
                        ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 text-slate-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(permission.key)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-[#1264FF]"
                    />
                    <span className="min-w-0">
                      <span className={cn('block text-[13px] font-semibold', isDay ? 'text-slate-800' : 'text-white')}>
                        {permission.label}
                      </span>
                      <span className={cn('block text-[11px] leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>
                        {permission.hint} · <span className="font-mono">{permission.key}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </FormSection>

          {/* ----------------------------------------- provisioning panel */}
          {!isEdit && (
            <FormSection
              step="4"
              title="Backend provisioning"
              description="The browser cannot create Firebase Authentication users. This is a deliberate security boundary."
            >
              <div
                className={cn(
                  'rounded-lg border px-4 py-4',
                  highlightPanel
                    ? isDay
                      ? 'border-2 border-blue-500 bg-blue-50/60'
                      : 'border-2 border-blue-500 bg-blue-950/30'
                    : isDay
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-white/10 bg-white/[0.03]'
                )}
              >
                <p className={cn('text-[13px] font-bold', isDay ? 'text-slate-800' : 'text-white')}>
                  Create the account with the <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">createAdmin</span> Cloud
                  Function, then paste the returned UID above.
                </p>
                <ol className={cn('mt-2 list-decimal space-y-1 pl-5 text-[12px] leading-relaxed', isDay ? 'text-slate-600' : 'text-slate-400')}>
                  <li>
                    Callable function <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">createAdmin</span>, exported from{' '}
                    <span className="font-mono">functions/src/admins/createAdmin.ts</span> via{' '}
                    <span className="font-mono">functions/src/index.ts</span>.
                  </li>
                  <li>
                    Endpoint:{' '}
                    <span className="break-all font-mono text-[11px]">{CREATE_ADMIN_ENDPOINT}</span>
                  </li>
                  <li>
                    It requires an authenticated admin caller (<span className="font-mono">verifyAdmin</span>),
                    creates the Auth user, sets custom claims{' '}
                    <span className="font-mono">&#123; admin: true, role &#125;</span> and writes{' '}
                    <span className="font-mono">admins/&#123;uid&#125;</span>.
                  </li>
                  <li>
                    Copy the payload below, invoke it from the backend, then return here with the UID it
                    returns. Nothing on this page can create the account for you.
                  </li>
                </ol>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDay ? 'text-slate-500' : 'text-slate-400')}>
                    Request payload
                  </span>
                  <Btn size="xs" onClick={copyPayload} icon={<FiCopy className="h-3.5 w-3.5" />}>
                    Copy payload
                  </Btn>
                </div>
                <pre className={cn('mt-2 overflow-x-auto rounded-md px-3 py-3 font-mono text-[11px] leading-relaxed', isDay ? 'bg-slate-900 text-slate-200' : 'bg-slate-950 text-slate-200 border border-slate-800')}>
{provisionPayload}
                </pre>

                <p className={cn('mt-3 text-[12px] leading-relaxed', isDay ? 'text-slate-500' : 'text-slate-400')}>
                  The password field above is a placeholder for the backend operator only — this UI never
                  receives, renders or stores a password.
                </p>
              </div>
            </FormSection>
          )}
        </Card>

        {saving && <PageLoading label="Saving…" />}

        {/* ---------------------------------------------------- footer */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Btn to="/admin/admins" disabled={saving}>
            Cancel
          </Btn>
          <Btn type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create profile'}
          </Btn>
        </div>
      </form>
    </>
  );
};

export default AdminEditor;
