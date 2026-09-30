import React, { useState } from 'react';
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
  MetaRow,
  PageLoading,
  StatusPill,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { deleteAnnouncement, updateAnnouncement } from '@/services/announcements/announcementService';
import type { Announcement } from '@/types';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Announcement detail — a faithful public preview plus the audit metadata.
 * ==========================================================================*/

type AnnouncementDoc = Announcement & { archived?: boolean; expiresAt?: Timestamp | null };

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

const fullDate = (value: unknown): string => {
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

const AnnouncementDetail: React.FC = () => {
  const { announcementId } = useParams<{ announcementId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();

  const announcement = useDoc<AnnouncementDoc>('announcements', announcementId);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const item = announcement.data;

  const write = async (
    patch: Partial<AnnouncementDoc>,
    action: 'ANNOUNCEMENT_PUBLISHED' | 'ANNOUNCEMENT_UNPUBLISHED' | 'ANNOUNCEMENT_ARCHIVED',
    message: string,
  ) => {
    if (!announcementId || !item) return;
    setBusy(true);
    try {
      await updateAnnouncement(announcementId, patch);
      await log(action, 'announcement', announcementId, {
        label: item.title,
        metadata: { active: patch.active, archived: patch.archived },
      });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!announcementId || !item || busy) return;
    setBusy(true);
    try {
      await deleteAnnouncement(announcementId);
      await log('ANNOUNCEMENT_DELETED', 'announcement', announcementId, {
        label: `Deleted announcement ${item.title}`,
      });
      toast.success('Announcement deleted');
      navigate('/admin/announcements');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  if (announcement.isLoading) return <PageLoading label="Loading announcement…" />;
  if (announcement.error)
    return (
      <div className="py-10">
        <ErrorNotice message={announcement.error} />
      </div>
    );
  if (!item || !announcementId)
    return (
      <>
        <AdminHeader
          title="Announcement"
          breadcrumbs={[{ label: 'Announcements', to: '/admin/announcements' }, { label: 'Detail' }]}
        />
        <EmptyNotice
          title="Announcement not found"
          message="It may have been removed, or the link is out of date."
          action={<Btn to="/admin/announcements">Back to announcements</Btn>}
        />
      </>
    );

  const isActive = item.active !== false;
  const isArchived = Boolean(item.archived);
  const publishDate = toDate(item.date);
  const expiryDate = toDate(item.expiresAt);
  const now = Date.now();
  const scheduled = Boolean(publishDate && publishDate.getTime() > now);
  const expired = Boolean(expiryDate && expiryDate.getTime() < now);

  const status = isArchived
    ? 'archived'
    : !isActive
      ? 'inactive'
      : scheduled
        ? 'scheduled'
        : expired
          ? 'expired'
          : 'active';

  return (
    <>
      <AdminHeader
        title={item.title || 'Untitled announcement'}
        subtitle="Public preview on the left, stored metadata and lifecycle controls on the right."
        breadcrumbs={[
          { label: 'Announcements', to: '/admin/announcements' },
          { label: item.title || 'Untitled' },
        ]}
        badge={<StatusPill value={status} />}
        actions={
          <>
            <Btn
              to={`/admin/announcements/${announcementId}/edit`}
              variant="primary"
              disabled={busy}
            >
              Edit
            </Btn>
            {isActive ? (
              <Btn
                disabled={busy}
                onClick={() =>
                  write({ active: false }, 'ANNOUNCEMENT_UNPUBLISHED', 'Announcement unpublished')
                }
              >
                Unpublish
              </Btn>
            ) : (
              <Btn
                disabled={busy}
                onClick={() =>
                  write(
                    { active: true, archived: false },
                    'ANNOUNCEMENT_PUBLISHED',
                    'Announcement published',
                  )
                }
              >
                Publish
              </Btn>
            )}
            <Btn
              variant="danger"
              disabled={busy}
              icon={<FiTrash2 className="h-4 w-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Btn>
          </>
        }
      />

      {announcement.error && <ErrorNotice message={announcement.error} className="mb-4" />}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* ------------------------------------------------ public preview */}
        <Card title="Public preview" hint="Exactly what spectators see" flush>
          <div className={cn('rounded-lg overflow-hidden border', isDay ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#071426] border-white/10')}>
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="h-56 w-full object-cover"
              />
            )}
            <div className="px-5 py-5">
              <div className="mb-3 flex items-center gap-2">
                <span className={cn(
                  'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  isDay ? 'border border-amber-300 bg-amber-50 text-amber-900' : 'border border-[#D9A441]/40 bg-[#D9A441]/10 text-[#D9A441]'
                )}>
                  Priority {item.priority ?? '—'}
                </span>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-400' : 'text-white/40')}>
                  OLYMPIA 2K26
                </span>
              </div>
              <h2 className={cn('text-lg font-bold leading-snug', isDay ? 'text-slate-900' : 'text-white')}>
                {item.title || 'Untitled announcement'}
              </h2>
              <p className={cn('mt-2 whitespace-pre-wrap text-[13px] leading-relaxed', isDay ? 'text-slate-600' : 'text-white/70')}>
                {item.description || 'No description provided.'}
              </p>
              <div className={cn('mt-4 border-t pt-3 text-[11px] uppercase tracking-wider', isDay ? 'border-slate-100 text-slate-400' : 'border-white/10 text-white/30')}>
                {isActive ? 'Now showing on public surfaces' : 'Hidden from public surfaces'}
              </div>
            </div>
          </div>
        </Card>

        {/* ----------------------------------------------------- metadata */}
        <Card title="Metadata" hint="Stored on the announcements document">
          <dl>
            <MetaRow label="Priority">{item.priority ?? '—'}</MetaRow>
            <MetaRow label="Publish date">{fullDate(item.date)}</MetaRow>
            <MetaRow label="Expiry date">{item.expiresAt ? fullDate(item.expiresAt) : '—'}</MetaRow>
            <MetaRow label="Active">{isActive ? 'Yes' : 'No'}</MetaRow>
            <MetaRow label="Archived">{isArchived ? 'Yes' : 'No'}</MetaRow>
            <MetaRow label="Created">{fullDate(item.createdAt)}</MetaRow>
            <MetaRow label="Updated">{fullDate(item.updatedAt)}</MetaRow>
            <MetaRow label="Document ID">
              <span className="font-mono text-[12px]">{item.id}</span>
            </MetaRow>
          </dl>

          <div className={cn('mt-4 rounded-lg border px-3.5 py-3', isDay ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.02]')}>
            <p className={cn('text-[12px] leading-relaxed', isDay ? 'text-slate-600' : 'text-slate-400')}>
              Deleting this announcement removes it permanently from Firestore in real-time.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn to="/admin/announcements">Back to list</Btn>
            <Btn to={`/admin/announcements/${announcementId}/edit`}>Edit announcement</Btn>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title={`Delete "${item.title}"?`}
        message="This will permanently delete this announcement from Firestore in real-time."
        confirmText="Delete announcement"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};

export default AnnouncementDetail;
