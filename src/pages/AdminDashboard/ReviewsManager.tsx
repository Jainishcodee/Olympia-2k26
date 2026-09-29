import React, { useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useCollection } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FilterSelect,
  LoadingRows,
  MetaRow,
  SearchInput,
  StatTile,
  StatusPill,
  Toolbar,
} from '@/components/admin/kit';
import type { Match, Review } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiRotateCcw, FiX } from 'react-icons/fi';

/* ============================================================================
 *  Reviews — moderation queue.
 *
 *  Reviewers are shown pseudonymised (`uid-••••1a2b`); no Firebase Auth
 *  identity is ever rendered or exported from this screen.
 *
 *  The `Review` type has no moderation field, so hiding writes a `hidden:
 *  boolean` on the review document (and keeps `updatedAt` current).
 * ==========================================================================*/

type ReviewDoc = Review & { hidden?: boolean; status?: string };

const isHidden = (review: ReviewDoc): boolean =>
  review.hidden === true || review.status === 'hidden';

const anonymise = (uid?: string): string =>
  uid ? `uid-••••${uid.slice(-4)}` : '—';

const excerpt = (text?: string, length = 90): string => {
  const value = (text ?? '').trim();
  if (!value) return '—';
  return value.length > length ? `${value.slice(0, length)}…` : value;
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

const relative = (date: Date | null): string => {
  if (!date) return '—';
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const Stars: React.FC<{ value: number }> = ({ value }) => {
  const filled = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${filled} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`text-[12px] leading-none ${step <= filled ? 'text-[#D9A441]' : 'text-slate-300'}`}
        >
          {step <= filled ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
};

const ReviewsManager: React.FC = () => {
  const { log } = useAuditLog();

  const reviews = useCollection<ReviewDoc>('reviews', { sortBy: 'createdAt', direction: 'desc' });
  const matches = useCollection<Match>('matches');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('');
  const [minRating, setMinRating] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ReviewDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const error = reviews.error ?? matches.error;
  const matchById = useMemo(() => new Map(matches.data.map((m) => [m.id, m])), [matches.data]);

  const matchTitle = (id: string): string => {
    const match = matchById.get(id);
    if (!match) return id || '—';
    return match.participantA?.name || match.participantB?.name
      ? `${match.participantA?.name ?? 'TBD'} vs ${match.participantB?.name ?? 'TBD'}`
      : `Match #${match.matchNumber ?? '—'}`;
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reviews.data.filter((review) => {
      const hidden = isHidden(review);
      if (statusFilter === 'hidden' && !hidden) return false;
      if (statusFilter === 'visible' && hidden) return false;
      if (matchFilter && review.matchId !== matchFilter) return false;
      if (minRating && Number(review.rating) < Number(minRating)) return false;
      if (term && !(review.content ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [reviews.data, search, statusFilter, matchFilter, minRating]);

  const stats = useMemo(() => {
    const total = reviews.data.length;
    let hidden = 0;
    let ratingSum = 0;
    reviews.data.forEach((review) => {
      if (isHidden(review)) hidden += 1;
      ratingSum += Number(review.rating) || 0;
    });
    return {
      total,
      hidden,
      visible: total - hidden,
      average: total ? ratingSum / total : 0,
    };
  }, [reviews.data]);

  /* ------------------------------------------------------------- writes */
  const persist = async (review: ReviewDoc, hidden: boolean) => {
    if (!db) throw new Error('Firebase is not configured.');
    await updateDoc(doc(db, 'reviews', review.id), {
      hidden,
      updatedAt: serverTimestamp(),
    });
    await log(hidden ? 'REVIEW_HIDDEN' : 'REVIEW_RESTORED', 'review', review.id, {
      label: excerpt(review.content, 48),
      metadata: { matchId: review.matchId, rating: review.rating, hidden },
    });
  };

  const setVisibility = async (review: ReviewDoc, hidden: boolean) => {
    setBusy(true);
    try {
      await persist(review, hidden);
      toast.success(hidden ? 'Review hidden from the public page' : 'Review restored');
      setSelected((current) => (current && current.id === review.id ? { ...current, hidden } : current));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const hideSelected = async () => {
    const ids = [...selectedIds];
    const targets = reviews.data.filter((review) => ids.includes(review.id) && !isHidden(review));
    if (targets.length === 0) {
      toast('Nothing to hide — the selection is already hidden.', { icon: 'ℹ️' });
      setSelectedIds(new Set());
      return;
    }
    setBusy(true);
    try {
      for (const review of targets) await persist(review, true);
      toast.success(`${targets.length} review${targets.length === 1 ? '' : 's'} hidden`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk hide failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = rows.length > 0 && rows.every((review) => selectedIds.has(review.id));

  const toggleAll = () =>
    setSelectedIds(() => {
      if (allVisibleSelected) return new Set<string>();
      const next = new Set<string>();
      rows.forEach((review) => next.add(review.id));
      return next;
    });

  const matchOptions = useMemo(
    () => [
      { value: '', label: 'All matches' },
      ...matches.data.map((m) => ({ value: m.id, label: matchTitle(m.id) })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matches.data],
  );

  const selectedHidden = selected ? isHidden(selected) : false;
  const selectedDate = selected ? toDate(selected.createdAt) ?? toDate(selected.updatedAt) : null;

  return (
    <>
      <AdminHeader
        title="Reviews"
        subtitle="Written public reviews. Reviewers are shown pseudonymously — identities never leave Firebase Auth."
        actions={<Btn to="/admin/matches">Manage matches</Btn>}
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total reviews" value={stats.total} accent="blue" isLoading={reviews.isLoading} />
        <StatTile label="Visible" value={stats.visible} accent="green" isLoading={reviews.isLoading} />
        <StatTile label="Hidden" value={stats.hidden} accent="gold" isLoading={reviews.isLoading} />
        <StatTile
          label="Average rating"
          value={stats.total ? stats.average.toFixed(2) : '—'}
          accent="slate"
          isLoading={reviews.isLoading}
          hint="out of 5"
        />
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search review text…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'Any status' },
            { value: 'visible', label: 'Visible' },
            { value: 'hidden', label: 'Hidden' },
          ]}
        />
        <FilterSelect value={matchFilter} onChange={setMatchFilter} options={matchOptions} />
        <FilterSelect
          value={minRating}
          onChange={setMinRating}
          options={[
            { value: '', label: 'Any rating' },
            { value: '5', label: '5 stars' },
            { value: '4', label: '4★ and up' },
            { value: '3', label: '3★ and up' },
            { value: '2', label: '2★ and up' },
            { value: '1', label: '1★ and up' },
          ]}
        />
        <span className="ml-auto text-[12px] tabular-nums text-slate-400">
          {rows.length} of {reviews.data.length}
        </span>
      </Toolbar>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#F0DFB8] bg-[#FFF7E6] px-3.5 py-2.5">
          <span className="text-[13px] font-bold text-[#A9761B]">
            {selectedIds.size} selected
          </span>
          <Btn variant="warn" size="sm" onClick={hideSelected} disabled={busy} icon={<FiEyeOff className="h-3.5 w-3.5" />}>
            Hide selected
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Btn>
        </div>
      )}

      <Card title="Review queue" hint="Click a row to expand the full text" flush>
        {reviews.isLoading ? (
          <LoadingRows rows={7} cols={6} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={reviews.data.length === 0 ? 'No reviews yet' : 'No reviews match these filters'}
            message={
              reviews.data.length === 0
                ? 'Public reviews appear here the moment a spectator submits one.'
                : 'Try clearing the search box or the filters above.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-9 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all visible reviews"
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-[#1264FF]"
                    />
                  </th>
                  {['Reviewer', 'Match', 'Rating', 'Review', 'Created at', 'Status', ''].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((review) => {
                  const hidden = isHidden(review);
                  const created = toDate(review.createdAt) ?? toDate(review.updatedAt);
                  const expanded = expandedId === review.id;
                  return (
                    <React.Fragment key={review.id}>
                      <tr
                        onClick={() => setExpandedId(expanded ? null : review.id)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-slate-50/70',
                          hidden && 'bg-amber-50/40',
                        )}
                      >
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(review.id)}
                            onChange={() => toggleSelect(review.id)}
                            aria-label="Select review"
                            className="h-3.5 w-3.5 rounded border-slate-300 accent-[#1264FF]"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="block font-mono text-[12px] font-semibold text-slate-700">
                            {anonymise(review.userId ?? review.id)}
                          </span>
                        </td>
                        <td className="max-w-[200px] px-3 py-2.5">
                          <span className="block truncate text-[13px] text-slate-700">
                            {matchTitle(review.matchId)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Stars value={Number(review.rating) || 0} />
                        </td>
                        <td className="max-w-[340px] px-3 py-2.5">
                          <span
                            className={cn(
                              'block text-[13px] leading-relaxed',
                              expanded ? 'whitespace-pre-wrap text-slate-700' : 'truncate text-slate-600',
                            )}
                          >
                            {review.content || '—'}
                          </span>
                          {!expanded && (
                            <span className="block text-[11px] text-slate-400">Click to expand</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className="block text-[12px] font-medium text-slate-600">
                            {relative(created)}
                          </span>
                          <span className="block font-mono text-[11px] tabular-nums text-slate-400">
                            {created
                              ? created.toLocaleString([], {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <StatusPill value={hidden ? 'hidden' : 'visible'} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton
                              label="View review"
                              onClick={() => setSelected(review)}
                              icon={<FiEye className="h-3.5 w-3.5" />}
                            />
                            {hidden ? (
                              <ActionButton
                                label="Restore review"
                                primary
                                disabled={busy}
                                onClick={() => setVisibility(review, false)}
                                icon={<FiRotateCcw className="h-3.5 w-3.5" />}
                              />
                            ) : (
                              <ActionButton
                                label="Hide review"
                                danger
                                disabled={busy}
                                onClick={() => setVisibility(review, true)}
                                icon={<FiEyeOff className="h-3.5 w-3.5" />}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={8} className="px-3 py-3">
                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                              {review.content || 'Empty review body.'}
                            </p>
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

      {/* ------------------------------------------------------ detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close review detail"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSelected(null)}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Review detail
                </p>
                <h2 className="mt-1 truncate text-[15px] font-bold text-slate-900">
                  {matchTitle(selected.matchId)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <FiX className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p className="text-[12px] leading-relaxed text-slate-600">{selected.content || 'Empty review body.'}</p>
              </div>

              <dl>
                <MetaRow label="Reviewer">{anonymise(selected.userId ?? selected.id)}</MetaRow>
                <MetaRow label="Match">{matchTitle(selected.matchId)}</MetaRow>
                <MetaRow label="Rating">
                  <span className="inline-flex items-center gap-2">
                    <Stars value={Number(selected.rating) || 0} />
                    <span className="font-mono text-[12px] text-slate-500">{selected.rating}/5</span>
                  </span>
                </MetaRow>
                <MetaRow label="Created">
                  {selectedDate
                    ? selectedDate.toLocaleString([], {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </MetaRow>
                <MetaRow label="Status">{selectedHidden ? 'Hidden' : 'Visible'}</MetaRow>
                <MetaRow label="Document ID">
                  <span className="font-mono text-[12px]">{selected.id}</span>
                </MetaRow>
              </dl>

              <p className="mt-4 text-[12px] leading-relaxed text-slate-400">
                The reviewer's identity stays in Firebase Authentication. This panel only ever shows a
                pseudonymised reference.
              </p>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <Btn onClick={() => setSelected(null)}>Close</Btn>
              {selectedHidden ? (
                <Btn
                  variant="primary"
                  disabled={busy}
                  onClick={() => setVisibility(selected, false)}
                  icon={<FiRotateCcw className="h-3.5 w-3.5" />}
                >
                  Restore
                </Btn>
              ) : (
                <Btn
                  variant="danger"
                  disabled={busy}
                  onClick={() => setVisibility(selected, true)}
                  icon={<FiEyeOff className="h-3.5 w-3.5" />}
                >
                  Hide
                </Btn>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  );
};

const ActionButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}> = ({ label, icon, onClick, primary, danger, disabled }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'flex h-7 w-7 items-center justify-center rounded border transition-colors disabled:opacity-40',
      primary
        ? 'border-[#1264FF] bg-[#1264FF] text-white hover:bg-[#0B4FD1]'
        : danger
          ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900',
    )}
  >
    {icon}
  </button>
);

export default ReviewsManager;
