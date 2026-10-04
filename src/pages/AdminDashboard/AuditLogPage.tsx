import React, { useMemo, useState } from 'react';
import { useCollection } from '@/hooks/useCollection';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  FilterSelect,
  LoadingRows,
  SearchInput,
  StatTile,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import type { AuditEntry } from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronRight, FiDownload, FiLock } from 'react-icons/fi';

/* ============================================================================
 *  Audit log — append-only record of every privileged action.
 *
 *  Reads the newest 300 entries of `auditLogs` (realtime). Nothing here can
 *  edit or delete an entry; the only client-side output is a CSV export of
 *  whatever is currently filtered.
 * ==========================================================================*/

const MAX_ROWS = 300;

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

const startOfDay = (value: string): number | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const endOfDay = (value: string): number | null => {
  const start = startOfDay(value);
  return start === null ? null : start + 24 * 60 * 60 * 1000 - 1;
};

/** Compact monospace chip, coloured by action family. */
const getActionTone = (action: string): string => {
  const family = (action ?? '').split('_')[0];
  switch (family) {
    case 'MATCH':
    case 'SCORE':
    case 'EVENT':
    case 'FIXTURE':
      return 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'TEAM':
    case 'PLAYER':
    case 'ROSTER':
      return 'border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-400';
    case 'ADMIN':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
    case 'SETTINGS':
      return 'border-line bg-surface-soft-2 text-ink-muted';
    default:
      return 'border-line bg-surface text-ink-muted';
  }
};

const prettyJson = (value: unknown): string => {
  if (value === undefined || value === null) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const AuditLogPage: React.FC = () => {
  const entries = useCollection<AuditEntry>('auditLogs', {
    sortBy: 'timestamp',
    direction: 'desc',
    max: MAX_ROWS,
  });

  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [adminId, setAdminId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [jsonId, setJsonId] = useState<string | null>(null);

  const error = entries.error;

  const actionOptions = useMemo(() => {
    const values = new Set<string>();
    entries.data.forEach((entry) => entry.action && values.add(entry.action));
    return [
      { value: '', label: 'All actions' },
      ...[...values].sort().map((value) => ({ value, label: value })),
    ];
  }, [entries.data]);

  const resourceOptions = useMemo(() => {
    const values = new Set<string>();
    entries.data.forEach((entry) => entry.resourceType && values.add(entry.resourceType));
    return [
      { value: '', label: 'All resources' },
      ...[...values].sort().map((value) => ({ value, label: value })),
    ];
  }, [entries.data]);

  const adminOptions = useMemo(() => {
    const values = new Map<string, string>();
    entries.data.forEach((entry) => {
      if (!entry.adminId) return;
      if (!values.has(entry.adminId)) {
        values.set(entry.adminId, entry.adminName ?? entry.adminEmail ?? entry.adminId);
      }
    });
    return [
      { value: '', label: 'All admins' },
      ...[...values.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [entries.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const fromTime = startOfDay(from);
    const toTime = endOfDay(to);

    return entries.data.filter((entry) => {
      if (action && entry.action !== action) return false;
      if (resourceType && entry.resourceType !== resourceType) return false;
      if (adminId && entry.adminId !== adminId) return false;

      if (fromTime !== null || toTime !== null) {
        const time = toDate(entry.timestamp)?.getTime();
        if (time === undefined) return false;
        if (fromTime !== null && time < fromTime) return false;
        if (toTime !== null && time > toTime) return false;
      }

      if (term) {
        const haystack = `${entry.resourceId ?? ''} ${entry.resourceLabel ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [entries.data, action, resourceType, adminId, from, to, search]);

  const stats = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    let todayCount = 0;
    let lastHour = 0;
    const admins = new Set<string>();
    const frequency = new Map<string, number>();

    entries.data.forEach((entry) => {
      const date = toDate(entry.timestamp);
      if (
        date &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      ) {
        todayCount += 1;
      }
      if (date && now - date.getTime() <= 60 * 60 * 1000) lastHour += 1;
      if (entry.adminId) admins.add(entry.adminId);
      if (entry.action) frequency.set(entry.action, (frequency.get(entry.action) ?? 0) + 1);
    });

    let topAction = '—';
    let topCount = 0;
    frequency.forEach((count, key) => {
      if (count > topCount) {
        topCount = count;
        topAction = key;
      }
    });

    return { todayCount, lastHour, admins: admins.size, topAction };
  }, [entries.data]);

  const downloadCsv = () => {
    if (rows.length === 0) {
      toast.error('Nothing to export with the current filters.');
      return;
    }
    const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = [
      'Timestamp',
      'Admin ID',
      'Admin name',
      'Admin email',
      'Action',
      'Resource type',
      'Resource ID',
      'Resource label',
      'Metadata',
    ];
    const lines = [header.map(escape).join(',')];
    rows.forEach((entry) => {
      const date = toDate(entry.timestamp);
      lines.push(
        [
          date ? date.toISOString() : '',
          entry.adminId,
          entry.adminName ?? '',
          entry.adminEmail ?? '',
          entry.action,
          entry.resourceType,
          entry.resourceId,
          entry.resourceLabel ?? '',
          prettyJson(entry.metadata),
        ]
          .map(escape)
          .join(','),
      );
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `olympia-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} entries`);
  };

  const dateInputClass =
    'h-9 rounded-lg border border-line bg-surface-2/70 px-2.5 text-[13px] text-ink outline-none transition-colors focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/15';

  return (
    <>
      <AdminHeader
        title="Audit Log"
        subtitle="Every privileged action an administrator takes, recorded in real time as append-only entries in Firestore."
        actions={
          <Btn variant="primary" onClick={downloadCsv} icon={<FiDownload className="h-4 w-4" />}>
            Download CSV
          </Btn>
        }
      />

      {/* -------------------------------------------------- pinned warning */}
      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-line bg-surface-soft/60 px-4 py-3 shadow-xs">
        <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
        <p className="text-[13px] font-semibold leading-relaxed text-ink">
          The audit log is append-only. Entries cannot be edited or deleted from this interface.
        </p>
      </div>

      {error && <ErrorNotice message={error} className="mb-4" />}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Entries today" value={stats.todayCount} accent="blue" isLoading={entries.isLoading} />
        <StatTile label="Actions in the last hour" value={stats.lastHour} accent="green" isLoading={entries.isLoading} />
        <StatTile label="Distinct admins" value={stats.admins} accent="gold" isLoading={entries.isLoading} />
        <StatTile
          label="Most frequent action"
          value={
            <span className="block break-all text-[15px] font-bold leading-tight tracking-normal">
              {stats.topAction}
            </span>
          }
          accent="slate"
          isLoading={entries.isLoading}
          hint="within the loaded window"
        />
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search resource ID or label…"
          className="w-full sm:w-72"
        />
        <FilterSelect value={action} onChange={setAction} options={actionOptions} />
        <FilterSelect value={resourceType} onChange={setResourceType} options={resourceOptions} />
        <FilterSelect value={adminId} onChange={setAdminId} options={adminOptions} />
        <label className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={dateInputClass} />
        </label>
        <label className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={dateInputClass} />
        </label>
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {entries.data.length} · newest {MAX_ROWS}
        </span>
      </Toolbar>

      <Card title="Activity" hint="Click a row for the full entry · click the metadata cell for raw JSON" flush>
        {entries.isLoading ? (
          <LoadingRows rows={8} cols={6} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          entries.data.length === 0 ? (
            <EmptyNotice
              title="No activity recorded yet"
              message="Actions performed by administrators will appear here in real time."
            />
          ) : (
            <EmptyNotice
              title="No entries match these filters"
              message="Widen the date range or clear a filter above."
            />
          )
        ) : (
          <TableShell minW={1160}>
            <THead>
              <tr>
                {[
                  'Timestamp',
                  'Admin',
                  'Action',
                  'Resource type',
                  'Resource ID',
                  'Resource label',
                  'Metadata',
                ].map((heading) => (
                  <Th key={heading}>{heading}</Th>
                ))}
              </tr>
            </THead>
            <TBody>
              {rows.map((entry) => {
                const date = toDate(entry.timestamp);
                const open = openId === entry.id;
                const jsonOpen = jsonId === entry.id;
                const metadataKeys = entry.metadata ? Object.keys(entry.metadata).length : 0;
                return (
                  <React.Fragment key={entry.id}>
                    <TRow
                      onClick={() => setOpenId(open ? null : entry.id)}
                      selected={open}
                    >
                      <Td numeric className="whitespace-nowrap">
                        {date
                          ? date.toLocaleString([], {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </Td>
                      <Td strong className="max-w-[220px]">
                        <span className="block truncate font-bold">
                          {entry.adminName ?? entry.adminId ?? '—'}
                        </span>
                        <span className="block truncate text-[11px] text-ink-faint">
                          {entry.adminEmail ?? entry.adminId}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                            getActionTone(entry.action),
                          )}
                        >
                          {entry.action}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">{entry.resourceType || '—'}</Td>
                      <Td className="max-w-[160px] truncate font-mono text-[12.5px]">
                        <span title={entry.resourceId}>{entry.resourceId || '—'}</span>
                      </Td>
                      <Td className="max-w-[240px] truncate font-medium text-ink">
                        {entry.resourceLabel || '—'}
                      </Td>
                      <td
                        className="whitespace-nowrap px-3.5 py-3 align-middle text-[13px] text-ink-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJsonId(jsonOpen ? null : entry.id);
                        }}
                      >
                        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink">
                          {metadataKeys > 0 ? `${metadataKeys} key${metadataKeys === 1 ? '' : 's'}` : 'none'}
                          {jsonOpen ? (
                            <FiChevronDown className="h-3 w-3" />
                          ) : (
                            <FiChevronRight className="h-3 w-3" />
                          )}
                        </span>
                      </td>
                    </TRow>

                    {jsonOpen && !open && (
                      <tr className="bg-surface-soft/50">
                        <td colSpan={7} className="px-3.5 py-3">
                          <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-muted">
                            {prettyJson(entry.metadata)}
                          </pre>
                        </td>
                      </tr>
                    )}

                    {open && (
                      <tr className="bg-surface-soft/70">
                        <td colSpan={7} className="px-3.5 py-3">
                          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                              ['Entry ID', entry.id],
                              ['Timestamp', date ? date.toISOString() : '—'],
                              ['Action', entry.action],
                              ['Admin ID', entry.adminId],
                              ['Admin name', entry.adminName ?? '—'],
                              ['Admin email', entry.adminEmail ?? '—'],
                              ['Resource type', entry.resourceType],
                              ['Resource ID', entry.resourceId],
                              ['Resource label', entry.resourceLabel ?? '—'],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="flex items-baseline justify-between gap-3 border-b border-line py-1.5"
                              >
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-ink-faint">
                                  {label}
                                </span>
                                <span
                                  className="min-w-0 truncate text-right font-mono text-[12px] text-ink"
                                  title={value}
                                >
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-muted">
                              Metadata
                            </span>
                            <pre className="mt-1 overflow-x-auto rounded-md border border-[#D9A441]/25 bg-surface-2 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-gold-ink">
                              {prettyJson(entry.metadata)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Card>
    </>
  );
};

export default AuditLogPage;
