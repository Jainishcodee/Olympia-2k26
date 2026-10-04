import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection } from '@/hooks/useCollection';
import { updateVenue } from '@/services/venues/venueService';
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
  StatusPill,
  TBody,
  Td,
  THead,
  Th,
  TableLink,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Match, Venue } from '@/types';
import { FiCheck, FiEdit2, FiEye, FiPlus, FiSlash } from 'react-icons/fi';

type VenueRecord = Venue & { available?: boolean };

const AvailabilityBadge: React.FC<{ available: boolean }> = ({ available }) => (
  <span
    className={
      available
        ? 'inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400'
        : 'inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400'
    }
  >
    {available ? 'Available' : 'Unavailable'}
  </span>
);

const VenuesManager: React.FC = () => {
  const navigate = useNavigate();
  const { log } = useAuditLog();

  const venues = useCollection<VenueRecord>('venues', { sortBy: 'name' });
  const matches = useCollection<Match>('matches');

  const [search, setSearch] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pending, setPending] = useState<{ venue: VenueRecord; enable: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const hostedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    matches.data.forEach((match) => {
      if (!match.venueId) return;
      counts.set(match.venueId, (counts.get(match.venueId) ?? 0) + 1);
    });
    return counts;
  }, [matches.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return venues.data.filter((venue) => {
      const available = venue.available !== false;
      const active = venue.active !== false;
      if (availableFilter === 'available' && !available) return false;
      if (availableFilter === 'unavailable' && available) return false;
      if (statusFilter === 'active' && !active) return false;
      if (statusFilter === 'disabled' && active) return false;
      if (term) {
        const haystack = `${venue.name} ${venue.location ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [venues.data, search, availableFilter, statusFilter]);

  const isLoading = venues.isLoading || matches.isLoading;
  const error = venues.error ?? matches.error;

  const applyStatus = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const { venue, enable } = pending;
      const patch: Partial<VenueRecord> = { active: enable };
      await updateVenue(venue.id, patch);
      await log('VENUE_UPDATED', 'venue', venue.id, {
        label: `${venue.name} ${enable ? 'enabled' : 'disabled'}`,
      });
      toast.success(`${venue.name} ${enable ? 'enabled' : 'disabled'}`);
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const availableOptions = [
    { value: '', label: 'Any availability' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
  ];

  const statusOptions = [
    { value: '', label: 'Any status' },
    { value: 'active', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
  ];

  return (
    <>
      <AdminHeader
        title="Venues"
        subtitle="Every ground, hall and court. Venues are disabled rather than deleted because matches reference them."
        actions={
          <Btn to="/admin/venues/create" variant="primary" icon={<FiPlus className="h-4 w-4" />}>
            Create venue
          </Btn>
        }
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search venue or location…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={availableFilter}
          onChange={setAvailableFilter}
          options={availableOptions}
        />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {venues.data.length}
        </span>
      </Toolbar>

      <Card flush>
        {isLoading ? (
          <LoadingRows rows={6} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={venues.data.length === 0 ? 'No venues yet' : 'No venues match these filters'}
            message={
              venues.data.length === 0
                ? 'Add the first venue so matches can be scheduled against it.'
                : 'Try clearing the search box or the filters above.'
            }
            action={
              venues.data.length === 0 ? (
                <Btn to="/admin/venues/create" variant="primary">
                  Create venue
                </Btn>
              ) : undefined
            }
          />
        ) : (
          <TableShell minW={980}>
            <THead>
              <tr>
                {['Venue', 'Location', 'Capacity', 'Available', 'Matches hosted', 'Status', ''].map(
                  (heading) => (
                    <Th key={heading}>{heading}</Th>
                  ),
                )}
              </tr>
            </THead>
            <TBody>
              {rows.map((venue) => {
                const active = venue.active !== false;
                return (
                  <TRow key={venue.id}>
                    <Td strong className="max-w-[220px] truncate">
                      <TableLink to={`/admin/venues/${venue.id}`}>{venue.name}</TableLink>
                    </Td>
                    <Td className="max-w-[240px] truncate">{venue.location || '—'}</Td>
                    <Td numeric>{Number(venue.capacity ?? 0).toLocaleString()}</Td>
                    <Td>
                      <AvailabilityBadge available={venue.available !== false} />
                    </Td>
                    <Td numeric>{hostedCounts.get(venue.id) ?? 0}</Td>
                    <Td>
                      <StatusPill value={active ? 'active' : 'disabled'} />
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionIcon label="View" onClick={() => navigate(`/admin/venues/${venue.id}`)}>
                          <FiEye className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label="Edit"
                          onClick={() => navigate(`/admin/venues/${venue.id}/edit`)}
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </ActionIcon>
                        <ActionIcon
                          label={active ? 'Disable' : 'Enable'}
                          primary={!active}
                          disabled={busy}
                          onClick={() => setPending({ venue, enable: !active })}
                        >
                          {active ? <FiSlash className="h-3.5 w-3.5" /> : <FiCheck className="h-3.5 w-3.5" />}
                        </ActionIcon>
                      </div>
                    </Td>
                  </TRow>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Card>

      <ConfirmDialog
        isOpen={pending !== null}
        title={pending?.enable ? 'Enable this venue?' : 'Disable this venue?'}
        message={
          pending
            ? pending.enable
              ? `${pending.venue.name} becomes selectable again when scheduling matches.`
              : `${pending.venue.name} will be hidden from scheduling. Nothing is deleted — existing matches keep their venue.`
            : ''
        }
        confirmText={pending?.enable ? 'Enable' : 'Disable'}
        isDestructive={!pending?.enable}
        onConfirm={applyStatus}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

export default VenuesManager;
