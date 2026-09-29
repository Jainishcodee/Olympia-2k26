import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useDoc } from '@/hooks/useCollection';
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
import FileUpload from '@/components/admin/FileUpload';
import {
  createAnnouncement,
  updateAnnouncement,
} from '@/services/announcements/announcementService';
import { uploadAnnouncementImage } from '@/services/storage/storageService';
import type { Announcement } from '@/types';
import toast from 'react-hot-toast';

/* ============================================================================
 *  Announcement editor — create (`/admin/announcements/create`) and edit
 *  (`/admin/announcements/:announcementId/edit`).
 *
 *  `Announcement.date` is the publish date. The optional `expiresAt` field is
 *  an addition maintained by this editor (the base type has no expiry).
 * ==========================================================================*/

type AnnouncementDoc = Announcement & { archived?: boolean; expiresAt?: Timestamp | null };

interface FormState {
  title: string;
  description: string;
  image: string;
  priority: string;
  date: string;
  expiresAt: string;
  active: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  dates?: string;
}

const EMPTY: FormState = {
  title: '',
  description: '',
  image: '',
  priority: '1',
  date: '',
  expiresAt: '',
  active: true,
};

const toInputDate = (value: unknown): string => {
  if (!value) return '';
  const date =
    value instanceof Date
      ? value
      : typeof (value as { toDate?: () => Date }).toDate === 'function'
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDate = (value: string): Timestamp | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
};

const AnnouncementEditor: React.FC = () => {
  const { announcementId } = useParams<{ announcementId: string }>();
  const isEdit = Boolean(announcementId);
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const existing = useDoc<AnnouncementDoc>('announcements', announcementId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

  // Prefill when editing.
  useEffect(() => {
    if (!existing.data) return;
    const item = existing.data;
    setForm({
      title: item.title ?? '',
      description: item.description ?? '',
      image: item.image ?? '',
      priority: String(item.priority ?? 1),
      date: toInputDate(item.date),
      expiresAt: toInputDate(item.expiresAt),
      active: item.active !== false,
    });
  }, [existing.data]);

  // Object URL for the freshly picked file, released on change/unmount.
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    const publish = parseDate(form.date);
    const expiry = parseDate(form.expiresAt);
    if (publish && expiry && expiry.toMillis() < publish.toMillis()) {
      next.dates = 'Expiry must be on or after the publish date.';
    }
    return next;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      // `Announcement.date` is non-nullable — an empty field means "publish now".
      const date = parseDate(form.date) ?? Timestamp.now();
      const expiresAt = parseDate(form.expiresAt);
      const priority = Math.max(1, Math.round(Number(form.priority) || 1));

      if (isEdit && announcementId) {
        let image = form.image;
        if (file) image = await uploadAnnouncementImage(announcementId, file);
        const patch: Partial<AnnouncementDoc> = {
          title: form.title.trim(),
          description: form.description.trim(),
          image,
          priority,
          date,
          expiresAt,
          active: form.active,
        };
        if (form.active) patch.archived = false;
        await updateAnnouncement(announcementId, patch);
        await log('ANNOUNCEMENT_UPDATED', 'announcement', announcementId, {
          label: form.title.trim(),
          metadata: { active: form.active, priority },
        });
        toast.success('Announcement updated');
      } else {
        const payload: Omit<AnnouncementDoc, 'id'> = {
          title: form.title.trim(),
          description: form.description.trim(),
          image: form.image,
          priority,
          date,
          expiresAt,
          active: form.active,
          createdAt: null as unknown as Timestamp,
          updatedAt: null as unknown as Timestamp,
        };
        const id = await createAnnouncement(payload);
        if (file) {
          const image = await uploadAnnouncementImage(id, file);
          await updateAnnouncement(id, { image });
        }
        await log(
          form.active ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_UNPUBLISHED',
          'announcement',
          id,
          { label: form.title.trim(), metadata: { created: true, active: form.active, priority } },
        );
        toast.success('Announcement created');
      }

      navigate('/admin/announcements');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && existing.isLoading) return <PageLoading label="Loading announcement…" />;
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
          title="Announcement not found"
          message={`No announcement exists with id "${announcementId}".`}
          action={<Btn to="/admin/announcements">Back to announcements</Btn>}
        />
      </div>
    );

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Edit announcement' : 'New announcement'}
        subtitle={
          isEdit
            ? 'Update the public notice. Publishing state can be toggled below or from the list.'
            : 'A title, a description and a schedule are all it takes. Nothing is written until you save.'
        }
        breadcrumbs={[
          { label: 'Announcements', to: '/admin/announcements' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
        actions={<Btn to="/admin/announcements">Cancel</Btn>}
      />

      <form onSubmit={submit} noValidate>
        <Card flush>
          {/* --------------------------------------------------- content */}
          <FormSection
            step="1"
            title="Content"
            description="What spectators will read on the public surfaces."
          >
            <FormGrid cols={1}>
              <FormField
                label="Title"
                required
                maxLength={120}
                placeholder="e.g. Finals day gates open at 8 AM"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                error={errors.title}
              />
              <FormField
                as="textarea"
                label="Description"
                required
                placeholder="One or two clear sentences."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                error={errors.description}
                helpText="Rendered verbatim under the title in the public card."
              />
            </FormGrid>
          </FormSection>

          {/* ----------------------------------------------------- media */}
          <FormSection
            step="2"
            title="Image"
            description="Upload a file (stored under announcements/{id}/image) or paste an existing URL."
          >
            <div className="mb-4">
              <FileUpload
                onUpload={setFile}
                previewUrl={preview || form.image || undefined}
                onClear={() => {
                  setFile(null);
                  set('image', '');
                }}
              />
            </div>
            <FormField
              label="Image URL fallback"
              placeholder="https://…"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              helpText="Used when no file is uploaded. Leave both empty for a text-only announcement."
            />
          </FormSection>

          {/* -------------------------------------------------- schedule */}
          <FormSection
            step="3"
            title="Schedule & priority"
            description="Priority 1 is shown first; expiry hides the announcement automatically."
          >
            <FormGrid cols={3}>
              <FormField
                label="Priority"
                type="number"
                min={1}
                max={99}
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                helpText="1 = headline"
              />
              <FormField
                label="Publish date"
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                helpText="Stored as `date` — leave empty to publish immediately"
              />
              <FormField
                label="Expiry date"
                type="date"
                value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
                error={errors.dates}
                helpText="Optional"
              />
            </FormGrid>
          </FormSection>

          {/* ---------------------------------------------------- status */}
          <FormSection step="4" title="Status" description="Whether the public site shows this announcement.">
            <Toggle
              checked={form.active}
              onChange={(value) => set('active', value)}
              label="Active"
              hint="Inactive announcements stay stored (and recoverable) but are never rendered publicly."
            />
          </FormSection>
        </Card>

        {saving && <PageLoading label="Saving…" />}

        {/* ---------------------------------------------------- footer */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Btn to="/admin/announcements" disabled={saving}>
            Cancel
          </Btn>
          <Btn type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create announcement'}
          </Btn>
        </div>
      </form>
    </>
  );
};

export default AnnouncementEditor;
