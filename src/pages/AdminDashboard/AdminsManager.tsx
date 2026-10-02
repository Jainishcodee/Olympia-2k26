import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollection } from '@/hooks/useCollection';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useTheme } from '@/contexts/ThemeContext';
import { updateAdminProfile } from '@/services/admin/adminService';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  StatusPill,
  Toolbar,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Admin, AdminRole } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiEdit2, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';

/* ============================================================================
 *  Administrators.
 *
 *  SECURITY: no password is ever read, rendered, logged or stored here, and
 *  the client has no way to create a Firebase Auth user. Provisioning happens
 *  on the trusted backend (Cloud Function `createAdmin`); this screen manages
 *  the `admins/{uid}` profile document and its `active` flag only.
 *
 *  NOTE: `Admin` has no `lastActive` field, so "Last Active" falls back to
 *  `updatedAt` (written on every profile change).
 * ==========================================================================*/

type AdminRow = Admin & { id: string };

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  score_operator: 'Score operator',
  content_manager: 'Content manager',
};

const getRoleTone = (role: AdminRole, isDay: boolean): string => {
  switch (role) {
    case 'super_admin':
      return isDay ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-indigo-800/80 bg-indigo-950/60 text-indigo-300';
    case 'admin':
      return isDay ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-blue-800/80 bg-blue-950/60 text-blue-300';
    case 'score_operator':
    case 'content_manager':
    default:
      return isDay ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-700 bg-slate-800/60 text-slate-300';
  }
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in (value as Date)) return (value as { toDate: () => Date }).toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const formatDateTime = (value: unknown): string => {
  const date = toDate(value);
  return date
    ? date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
};

const roleLabel = (role: string): string =>
  ROLE_LABEL[role as AdminRole] ?? role ?? '—';

const AdminsManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const admins = useCollection<AdminRow>('admins', { sortBy: 'displayName' });

  const [pending, setPending] = useState<AdminRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const error = admins.error;
  const rows = admins.data;

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => counts.set(row.role, (counts.get(row.role) ?? 0) + 1));
    return counts;
  }, [rows]);

  const uidOf = (row: AdminRow): string => row.uid || row.id;

  const setActive = async (row: AdminRow, active: boolean) => {
    const uid = uidOf(row);
    if (!active && user?.uid === uid) {
      toast.error('You cannot disable your own account.');
      return;
    }
    setBusyId(uid);
    try {
      await updateAdminProfile(uid, { active });
      await log(active ? 'ADMIN_REACTIVATED' : 'ADMIN_DISABLED', 'admin', uid, {
        label: row.displayName || row.email,
        metadata: { active, role: row.role },
      });
      toast.success(active ? 'Administrator reactivated' : 'Administrator disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
      setPending(null);
    }
  };

  const confirmDisable = async () => {
    if (!pending) return;
    await setActive(pending, false);
  };

  return (
    <>
      <AdminHeader
        title="Administrators"
        subtitle="Everyone with access to this panel. Profile documents live in Firestore; credentials live in Firebase Authentication."
        actions={
          <Btn to="/admin/admins/create" variant="primary">
            Create administrator
          </Btn>
        }
      />

      {/* ------------------------------------------------- security banner */}
      <div
        className={cn(
          'mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-2xs',
          isDay
            ? 'border-blue-200 bg-blue-50/70 text-slate-800'
            : 'border-blue-900/50 bg-blue-950/30 text-slate-200',
        )}
      >
        <FiShield className={cn('mt-0.5 h-4 w-4 shrink-0', isDay ? 'text-blue-600' : 'text-blue-400')} />
        <div className="min-w-0">
          <p className={cn('text-[13px] font-bold', isDay ? 'text-slate-900' : 'text-white')}>
            Passwords are never displayed or stored here. Authentication is handled by Firebase
            Authentication.
          </p>
          <p className={cn('mt-0.5 text-[12px] leading-relaxed', isDay ? 'text-slate-600' : 'text-slate-400')}>
            This panel can only read and update the{' '}
            <span className="font-mono text-[11px]">admins/&#123;uid&#125;</span> profile document and its{' '}
            <span className="font-mono text-[11px]">active</span> flag. Accounts themselves are
            provisioned by the trusted backend via the <span className="font-mono text-[11px]">createAdmin</span>{' '}
            Cloud Function.
          </p>
        </div>
      </div>

      {error && <ErrorNotice message={error} className="mb-4" />}

      <Toolbar>
        <span className={cn('text-[12px] font-semibold', isDay ? 'text-slate-600' : 'text-white/60')}>
          {rows.length} administrator{rows.length === 1 ? '' : 's'}
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
          {[...roleCounts.entries()].map(([role, count]) => (
            <span
              key={role}
              className={cn(
                'rounded border px-2 py-0.5 font-medium',
                isDay ? 'border-slate-200 bg-white text-slate-600' : 'border-white/10 bg-white/[0.04] text-white/70',
              )}
            >
              {roleLabel(role)} · {count}
            </span>
          ))}
        </span>
      </Toolbar>

      <Card title="Directory" hint="Sorted by display name" flush>
        {admins.isLoading ? (
          <LoadingRows rows={6} cols={7} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNotice
            title="No administrator profiles yet"
            message="Provision the first account with the createAdmin Cloud Function, then register its profile here."
            action={
              <Btn to="/admin/admins/create" variant="primary">
                Create administrator
              </Btn>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr
                  className={cn(
                    'border-b',
                    isDay
                      ? 'border-slate-200 bg-slate-100/90 text-slate-700'
                      : 'border-white/10 bg-white/[0.04] text-white/70',
                  )}
                >
                  {['Name', 'Email', 'Role', 'Status', 'Created at', 'Last active', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className={cn(
                        'whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider',
                        isDay ? 'text-slate-600' : 'text-white/60',
                      )}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDay ? 'divide-slate-200/70' : 'divide-white/5')}>
                {rows.map((row) => {
                  const uid = uidOf(row);
                  const active = row.active !== false;
                  const isSelf = user?.uid === uid;
                  const busy = busyId === uid;
                  return (
                    <tr
                      key={uid}
                      className={cn(
                        'transition-colors',
                        isDay ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      <td className="max-w-[220px] px-3 py-2.5">
                        <span
                          className={cn(
                            'block truncate text-[13px] font-semibold',
                            isDay ? 'text-slate-900' : 'text-white',
                          )}
                        >
                          {row.displayName || 'Unnamed administrator'}
                        </span>
                        <span
                          className={cn(
                            'block truncate font-mono text-[11px]',
                            isDay ? 'text-slate-400' : 'text-white/40',
                          )}
                        >
                          {uid.slice(0, 16)}
                          {isSelf && ' · you'}
                        </span>
                      </td>
                      <td
                        className={cn(
                          'max-w-[260px] truncate px-3 py-2.5 text-[13px]',
                          isDay ? 'text-slate-600' : 'text-white/70',
                        )}
                      >
                        {row.email || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            getRoleTone(row.role, isDay),
                          )}
                        >
                          {roleLabel(row.role)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusPill value={active ? 'active' : 'inactive'} />
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap px-3 py-2.5 text-[12px]',
                          isDay ? 'text-slate-600' : 'text-white/70',
                        )}
                      >
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={cn(
                            'block text-[12px]',
                            isDay ? 'text-slate-600' : 'text-white/70',
                          )}
                        >
                          {formatDateTime(row.updatedAt ?? row.createdAt)}
                        </span>
                        <span
                          className={cn(
                            'block text-[10px] uppercase tracking-wider',
                            isDay ? 'text-slate-400' : 'text-white/40',
                          )}
                        >
                          from updatedAt
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Btn
                            size="xs"
                            onClick={() => navigate(`/admin/admins/${uid}/edit`)}
                            icon={<FiEdit2 className="h-3.5 w-3.5" />}
                          >
                            Edit
                          </Btn>
                          {active ? (
                            <Btn
                              size="xs"
                              variant="danger"
                              disabled={busy}
                              icon={<FiUserX className="h-3.5 w-3.5" />}
                              onClick={() => {
                                if (isSelf) {
                                  toast.error('You cannot disable your own account.');
                                  return;
                                }
                                setPending(row);
                              }}
                            >
                              Disable
                            </Btn>
                          ) : (
                            <Btn
                              size="xs"
                              variant="primary"
                              disabled={busy}
                              icon={<FiUserCheck className="h-3.5 w-3.5" />}
                              onClick={() => setActive(row, true)}
                            >
                              Reactivate
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
        “Last active” falls back to <span className="font-mono">updatedAt</span> — the{' '}
        <span className="font-mono">Admin</span> document has no activity timestamp of its own.
      </p>

      <ConfirmDialog
        isOpen={pending !== null}
        title="Disable this administrator?"
        message={
          pending
            ? `${pending.displayName || pending.email} will no longer be treated as an active administrator. Their Firebase Authentication credentials are untouched and the action is written to the audit log.`
            : ''
        }
        confirmText="Disable"
        isDestructive
        onConfirm={confirmDisable}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

export default AdminsManager;
