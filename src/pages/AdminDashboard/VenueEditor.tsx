import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { createVenue, updateVenue } from '@/services/venues/venueService';
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
import type { Venue } from '@/types';
import { cn } from '@/utils/cn';

/** Availability lives on the document as an optional extra field — see VenuesManager. */
type VenueRecord = Venue & { available?: boolean };

interface VenueForm {
  name: string;
  location: string;
  description: string;
  capacity: string;
  image: string;
  available: boolean;
  active: boolean;
}

const EMPTY_FORM: VenueForm = {
  name: '',
  location: '',
  description: '',
  capacity: '',
  image: '',
  available: true,
  active: true,
};

const VenueEditor: React.FC = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { log } = useAuditLog();

  const isCreate = !venueId;

  const venueDoc = useDoc<VenueRecord>('venues', venueId);

  const [form, setForm] = useState<VenueForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hydrated = useRef<string | null>(null);

  const venue = venueDoc.data;

  // Hydrate once per document so realtime updates never overwrite typing.
  useEffect(() => {
    if (!venue || hydrated.current === venue.id) return;
    hydrated.current = venue.id;
    setForm({
      name: venue.name ?? '',
      location: venue.location ?? '',
      description: venue.description ?? '',
      capacity: typeof venue.capacity === 'number' ? String(venue.capacity) : '',
      image: venue.image ?? '',
      available: venue.available !== false,
      active: venue.active !== false,
    });
  }, [venue]);

  const set = <K extends keyof VenueForm>(key: K, value: VenueForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageFile = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'png';
      const path = `venues/${venueId ?? `new-${Date.now()}`}/image.${extension}`;
      const url = await uploadFile(path, file);
      set('image', url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed — paste an image URL instead');
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Venue name is required.';
    const raw = form.capacity.trim();
    const capacity = raw === '' ? NaN : Number(raw);
    if (!Number.isFinite(capacity) || !Number.isInteger(capacity)) {
      next.capacity = 'Capacity must be a whole number.';
    } else if (capacity < 0) {
      next.capacity = 'Capacity cannot be negative.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    try {
      const payload: Omit<VenueRecord, 'id'> = {
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        capacity: Number(form.capacity.trim()),
        image: form.image.trim(),
        available: form.available,
        active: form.active,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (isCreate) {
        const newId = await createVenue(payload);
        await log('VENUE_CREATED', 'venue', newId, { label: payload.name });
        toast.success('Venue created');
      } else {
        const id = venueId ?? '';
        if (!id) throw new Error('Missing venue id');
        await updateVenue(id, payload);
        await log('VENUE_UPDATED', 'venue', id, { label: payload.name });
        toast.success('Venue updated');
      }
      navigate('/admin/venues');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const capacityHint = useMemo(
    () => (form.capacity.trim() === '' ? 'Seats or slots available at this venue.' : undefined),
    [form.capacity],
  );

  /* ------------------------------------------------------------- guards */

  if (!isCreate && !venueDoc.isReady) return <PageLoading label="Loading venue…" />;

  if (!isCreate && venueDoc.error) {
    return (
      <>
        <AdminHeader title="Edit venue" breadcrumbs={[{ label: 'Venues', to: '/admin/venues' }]} />
        <ErrorNotice message={venueDoc.error} />
      </>
    );
  }

  if (!isCreate && !venue) {
    return (
      <>
        <AdminHeader title="Edit venue" breadcrumbs={[{ label: 'Venues', to: '/admin/venues' }]} />
        <EmptyNotice
          title="Venue not found"
          message="This venue document no longer exists in Firestore."
          action={<Btn to="/admin/venues">Back to venues</Btn>}
        />
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title={isCreate ? 'Create venue' : `Edit ${venue?.name ?? 'venue'}`}
        subtitle={
          isCreate
            ? 'Add a ground, hall or court so matches can be scheduled against it.'
            : 'Update the venue record. Matches already scheduled here are unaffected.'
        }
        breadcrumbs={[
          { label: 'Venues', to: '/admin/venues' },
          ...(isCreate
            ? [{ label: 'Create' }]
            : [{ label: venue?.name ?? 'Venue', to: `/admin/venues/${venueId}` }, { label: 'Edit' }]),
        ]}
        actions={<Btn to="/admin/venues">Cancel</Btn>}
      />

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card flush>
          <FormSection step="1" title="Venue" description="Name, location and capacity as shown on fixtures.">
            <FormGrid>
              <FormField
                label="Name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
                placeholder="e.g. Main Ground"
              />
              <FormField
                label="Location"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. North Campus, Block C"
              />
            </FormGrid>
            <FormGrid>
              <FormField
                label="Capacity"
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                error={errors.capacity}
                helpText={errors.capacity ? undefined : capacityHint}
                placeholder="0"
              />
            </FormGrid>
            <FormField
              as="textarea"
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              helpText="Surface, dimensions, or anything operators should know."
              placeholder="Open-air turf with floodlights."
            />
          </FormSection>

          <FormSection step="2" title="Image" description="Used on the public venue listing.">
            <div className="mb-4">
              <span className={cn('block text-sm font-medium', isDay ? 'text-slate-700' : 'text-slate-200')}>Venue image</span>
              <div className="mt-1.5">
                <FileUpload
                  onUpload={handleImageFile}
                  previewUrl={form.image || undefined}
                  onClear={() => set('image', '')}
                />
              </div>
            </div>
            <FormField
              label="Image URL"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              helpText="Fallback: paste a direct image URL instead of uploading."
              placeholder="https://…"
            />
          </FormSection>

          <FormSection step="3" title="Availability" description="Whether operators can pick this venue right now.">
            <div className={cn('divide-y', isDay ? 'divide-slate-100' : 'divide-white/5')}>
              <Toggle
                checked={form.available}
                onChange={(checked) => set('available', checked)}
                label="Available for booking"
                hint="Unavailable venues are shown with a badge but should not be scheduled."
              />
              <Toggle
                checked={form.active}
                onChange={(checked) => set('active', checked)}
                label="Venue enabled"
                hint="Disabled venues are hidden from active lists. Nothing is deleted — matches keep their venue."
              />
            </div>
          </FormSection>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Btn to="/admin/venues" variant="secondary" size="md">
            Cancel
          </Btn>
          <Btn type="submit" variant="primary" size="md" disabled={busy || uploading}>
            {busy ? 'Saving…' : isCreate ? 'Create venue' : 'Save changes'}
          </Btn>
        </div>
      </form>
    </>
  );
};

export default VenueEditor;
