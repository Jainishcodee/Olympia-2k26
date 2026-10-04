import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollection } from '@/hooks/useCollection';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { updateAdminProfile } from '@/services/admin/adminService';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  StatusPill,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toolbar,
  TRow,
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

const getRoleTone = (role: AdminRole): string => {
  switch (role) {
    case 'super_admin':
      return 'border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
    case 'admin':
      return 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'score_operator':
    case 'content_manager':
    default:
      return 'border-line bg-surface-soft-2 text-ink-muted';
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
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#1264FF]/25 bg-[#1264FF]/8 px-4 py-3 shadow-xs">
        <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-[#1264FF]" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink">
            Passwords are never displayed or stored here. Authentication is handled by Firebase
            Authentication.
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
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
        <span className="text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} administrator{rows.length === 1 ? '' : 's'}
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
          {[...roleCounts.entries()].map(([role, count]) => (
            <span
              key={role}
              className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-semibold text-ink-muted"
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
          <TableShell minW={1000}>
            <THead>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Created at', 'Last active', 'Actions'].map((heading) => (
                  <Th key={heading} className={heading === 'Actions' ? 'text-right' : undefined}>
                    {heading}
                  </Th>
                ))}
              </tr>
            </THead>
            <TBody>
              {rows.map((row) => {
                const uid = uidOf(row);
                const active = row.active !== false;
                const isSelf = user?.uid === uid;
                const busy = busyId === uid;
                return (
                  <TRow key={uid}>
                    <Td strong className="max-w-[220px]">
                      <span className="block truncate font-bold">
                        {row.displayName || 'Unnamed administrator'}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-ink-faint">
                        {uid.slice(0, 16)}
                        {isSelf && ' · you'}
                      </span>
                    </Td>
                    <Td className="max-w-[260px] truncate">{row.email || '—'}</Td>
                    <Td className="whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]',
                          getRoleTone(row.role),
                        )}
                      >
                        {roleLabel(row.role)}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <StatusPill value={active ? 'active' : 'inactive'} />
                    </Td>
                    <Td className="whitespace-nowrap">{formatDateTime(row.createdAt)}</Td>
                    <Td className="whitespace-nowrap">
                      <span className="block text-[12px] text-ink">
                        {formatDateTime(row.updatedAt ?? row.createdAt)}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-ink-faint">
                        from updatedAt
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
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
                    </Td>
                  </TRow>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Card>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
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
