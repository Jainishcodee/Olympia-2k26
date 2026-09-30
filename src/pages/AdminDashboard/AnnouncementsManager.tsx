import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { deleteAnnouncement, updateAnnouncement } from '@/services/announcements/announcementService';
import {
  ActionIcon,
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FilterSelect,
  LoadingRows,
  SearchInput,
  StatTile,
  StatusPill,
  Toolbar,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Announcement } from '@/types';
import toast from 'react-hot-toast';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Announcements — publish / unpublish / archive.
 *
 *  Archiving is always soft: it sets `active:false` (+ `archived:true`), the
 *  document is never deleted from this screen.
 *
 *  `Announcement` ships `date` (the publish date) but has no expiry, so the
 *  editor also maintains an optional `expiresAt` Timestamp on the document.
 * ==========================================================================*/

type AnnouncementDoc = Announcement & { archived?: boolean; expiresAt?: Timestamp | null };
type StatusFilter = 'archived' | 'scheduled' | 'expired' | 'inactive' | 'active';

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

const statusOf = (item: AnnouncementDoc, now: number): StatusFilter => {
  if (item.archived) return 'archived';
  if (item.active === false) return 'inactive';
  const publish = toDate(item.date);
  if (publish && publish.getTime() > now) return 'scheduled';
  const expiry = toDate(item.expiresAt);
  if (expiry && expiry.getTime() < now) return 'expired';
  return 'active';
};

const formatDate = (value: unknown): string => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const truncate = (text: string, length = 110): string =>
  text.length > length ? `${text.slice(0, length)}…` : text;

const AnnouncementsManager: React.FC = () => {
  const { isDay } = useTheme();
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const announcements = useCollection<AnnouncementDoc>('announcements');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<AnnouncementDoc | null>(null);

  const error = announcements.error;
  const now = useMemo(() => Date.now(), []);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return announcements.data
      .filter((item) => {
        if (statusFilter && statusOf(item, now) !== statusFilter) return false;
        if (priorityFilter && String(item.priority ?? '') !== priorityFilter) return false;
        if (term && !(item.title ?? '').toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((left, right) => {
        const priority = (left.priority ?? 99) - (right.priority ?? 99);
        if (priority !== 0) return priority;
        return (toDate(right.date)?.getTime() ?? 0) - (toDate(left.date)?.getTime() ?? 0);
      });
  }, [announcements.data, search, statusFilter, priorityFilter, now]);

  const stats = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    announcements.data.forEach((item) => {
      const status = statusOf(item, now);
      if (status === 'active') active += 1;
      else if (status === 'scheduled') scheduled += 1;
      else if (status === 'expired') expired += 1;
    });
    return { active, scheduled, expired, total: announcements.data.length };
  }, [announcements.data, now]);

  const write = async (
    item: AnnouncementDoc,
    patch: Partial<AnnouncementDoc>,
    action: 'ANNOUNCEMENT_PUBLISHED' | 'ANNOUNCEMENT_UNPUBLISHED' | 'ANNOUNCEMENT_ARCHIVED',
    message: string,
  ) => {
    setBusyId(item.id);
    try {
      await updateAnnouncement(item.id, patch);
      await log(action, 'announcement', item.id, {
        label: item.title,
        metadata: { active: patch.active, archived: patch.archived },
      });
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const publish = (item: AnnouncementDoc) =>
    write(item, { active: true, archived: false }, 'ANNOUNCEMENT_PUBLISHED', 'Announcement published');
  const unpublish = (item: AnnouncementDoc) =>
    write(item, { active: false }, 'ANNOUNCEMENT_UNPUBLISHED', 'Announcement unpublished');

  const confirmDelete = async () => {
    if (!deletePending) return;
    setBusyId(deletePending.id);
    try {
      await deleteAnnouncement(deletePending.id);
      await log('ANNOUNCEMENT_ARCHIVED', 'announcement', deletePending.id, {
        label: `Deleted announcement: ${deletePending.title}`,
      });
      toast.success('Announcement deleted');
      setDeletePending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const priorityChip = (priority?: number) =>
    priority === 1 ? (
      <span className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        isDay
          ? 'border border-amber-300 bg-amber-50 text-amber-800'
          : 'border border-[#F0DFB8]/30 bg-[#FFF7E6]/10 text-[#FFD21F]'
      )}>
        P1 · Headline
      </span>
    ) : priority ? (
      <span className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        isDay
          ? 'border border-slate-200 bg-slate-100 text-slate-700'
          : 'border border-white/10 bg-white/[0.04] text-slate-300'
      )}>
        P{priority}
      </span>
    ) : (
      <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>—</span>
    );

  return (
    <>
      <AdminHeader
        title="Announcements"
        subtitle="Public notices shown across Olympia surfaces. Publishing, unpublishing and management are audited."
        actions={<Btn to="/admin/announcements/create" variant="primary">+ New announcement</Btn>}
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total" value={stats.total} accent="blue" isLoading={announcements.isLoading} />
        <StatTile label="Active" value={stats.active} accent="green" isLoading={announcements.isLoading} />
        <StatTile label="Scheduled" value={stats.scheduled} accent="gold" isLoading={announcements.isLoading} />
        <StatTile label="Expired" value={stats.expired} accent="slate" isLoading={announcements.isLoading} />
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'expired', label: 'Expired' },
            { value: 'inactive', label: 'Unpublished' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <FilterSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: '', label: 'Any priority' },
            { value: '1', label: 'Priority 1' },
            { value: '2', label: 'Priority 2' },
            { value: '3', label: 'Priority 3' },
          ]}
        />
        <span className={cn('ml-auto text-[12px] tabular-nums', isDay ? 'text-slate-500' : 'text-slate-400')}>
          {rows.length} of {announcements.data.length}
        </span>
      </Toolbar>

      <Card title="All announcements" hint="Sorted by priority, then publish date" flush>
        {announcements.isLoading ? (
          <LoadingRows rows={6} cols={6} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={announcements.data.length === 0 ? 'No announcements yet' : 'Nothing matches these filters'}
            message={
              announcements.data.length === 0
                ? 'Create the first announcement to greet spectators on the public site.'
                : 'Try another status, priority or search term.'
            }
            action={
              announcements.data.length === 0 ? (
                <Btn to="/admin/announcements/create" variant="primary">
                  New announcement
                </Btn>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className={cn('border-b', isDay ? 'border-slate-200 bg-slate-100/90' : 'border-white/10 bg-white/[0.04]')}>
                  {['Title', 'Description', 'Image', 'Priority', 'Publish date', 'Expiry date', 'Status', 'Actions'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className={cn('whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-600' : 'text-slate-400')}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
                {rows.map((item) => {
                  const status = statusOf(item, now);
                  const archived = Boolean(item.archived);
                  const isActive = item.active !== false;
                  const busy = busyId === item.id;
                  return (
                    <tr key={item.id} className={cn('transition-colors', isDay ? 'hover:bg-slate-50/80' : 'hover:bg-white/[0.02]')}>
                      <td className="max-w-[240px] px-3 py-2.5">
                        <span className={cn('block truncate text-[13px] font-semibold', isDay ? 'text-slate-900' : 'text-white')}>
                          {item.title || 'Untitled'}
                        </span>
                      </td>
                      <td className={cn('max-w-[300px] px-3 py-2.5 text-[12px] leading-relaxed', isDay ? 'text-slate-600' : 'text-slate-400')}>
                        {truncate(item.description ?? '') || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className={cn('h-9 w-14 rounded border object-cover', isDay ? 'border-slate-200' : 'border-white/10')}
                          />
                        ) : (
                          <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">{priorityChip(item.priority)}</td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-700' : 'text-slate-300')}>
                        {formatDate(item.date)}
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5 text-[12px]', isDay ? 'text-slate-700' : 'text-slate-300')}>
                        {formatDate(item.expiresAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <StatusPill value={status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionIcon
                            label="View announcement"
                            onClick={() => navigate(`/admin/announcements/${item.id}`)}
                          >
                            <FiEye className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <ActionIcon
                            label="Edit announcement"
                            onClick={() => navigate(`/admin/announcements/${item.id}/edit`)}
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </ActionIcon>
                          {isActive && !archived ? (
                            <Btn
                              size="xs"
                              disabled={busy}
                              onClick={() => unpublish(item)}
                            >
                              Unpublish
                            </Btn>
                          ) : (
                            <Btn
                              size="xs"
                              variant="primary"
                              disabled={busy}
                              onClick={() => publish(item)}
                            >
                              Publish
                            </Btn>
                          )}
                          <ActionIcon
                            label="Delete announcement"
                            danger
                            disabled={busy}
                            onClick={() => setDeletePending(item)}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </ActionIcon>
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

      <ConfirmDialog
        isOpen={deletePending !== null}
        title="Delete announcement permanently?"
        message={
          deletePending
            ? `"${deletePending.title || 'This announcement'}" will be permanently removed from Firestore.`
            : ''
        }
        confirmText={busyId ? 'Deleting…' : 'Delete announcement'}
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletePending(null)}
      />
    </>
  );
};

export default AnnouncementsManager;
