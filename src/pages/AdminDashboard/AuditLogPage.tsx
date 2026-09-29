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
  Toolbar,
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
const actionTone = (action: string): string => {
  const family = (action ?? '').split('_')[0];
  switch (family) {
    case 'MATCH':
    case 'SCORE':
    case 'EVENT':
    case 'FIXTURE':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'TEAM':
    case 'PLAYER':
    case 'ROSTER':
      return 'border-[#F0DFB8] bg-[#FFF7E6] text-[#A9761B]';
    case 'ADMIN':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'SETTINGS':
      return 'border-slate-300 bg-slate-100 text-slate-700';
    default:
      return 'border-slate-200 bg-white text-slate-600';
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
    'h-9 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] text-slate-700 outline-none transition-colors focus:border-[#1264FF] focus:ring-2 focus:ring-[#1264FF]/15';

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
      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3">
        <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="text-[13px] font-semibold leading-relaxed text-slate-600">
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={dateInputClass} />
        </label>
        <label className="inline-flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={dateInputClass} />
        </label>
        <span className="ml-auto text-[12px] tabular-nums text-slate-400">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {[
                    'Timestamp',
                    'Admin',
                    'Action',
                    'Resource type',
                    'Resource ID',
                    'Resource label',
                    'Metadata',
                  ].map((heading) => (
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
                {rows.map((entry) => {
                  const date = toDate(entry.timestamp);
                  const open = openId === entry.id;
                  const jsonOpen = jsonId === entry.id;
                  const metadataKeys = entry.metadata ? Object.keys(entry.metadata).length : 0;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        onClick={() => setOpenId(open ? null : entry.id)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-slate-50/70',
                          open && 'bg-slate-50',
                        )}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] tabular-nums text-slate-600">
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
                        </td>
                        <td className="max-w-[220px] px-3 py-2.5">
                          <span className="block truncate text-[13px] font-semibold text-slate-800">
                            {entry.adminName ?? entry.adminId ?? '—'}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {entry.adminEmail ?? entry.adminId}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                              actionTone(entry.action),
                            )}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-slate-600">
                          {entry.resourceType || '—'}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2.5 font-mono text-[12px] text-slate-500">
                          <span title={entry.resourceId}>{entry.resourceId || '—'}</span>
                        </td>
                        <td className="max-w-[240px] truncate px-3 py-2.5 text-[13px] text-slate-700">
                          {entry.resourceLabel || '—'}
                        </td>
                        <td
                          className="whitespace-nowrap px-3 py-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJsonId(jsonOpen ? null : entry.id);
                          }}
                        >
                          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800">
                            {metadataKeys > 0 ? `${metadataKeys} key${metadataKeys === 1 ? '' : 's'}` : 'none'}
                            {jsonOpen ? (
                              <FiChevronDown className="h-3 w-3" />
                            ) : (
                              <FiChevronRight className="h-3 w-3" />
                            )}
                          </span>
                        </td>
                      </tr>

                      {jsonOpen && !open && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-3 py-3">
                            <pre className="overflow-x-auto rounded-md bg-[#071426] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#D9A441]">
                              {prettyJson(entry.metadata)}
                            </pre>
                          </td>
                        </tr>
                      )}

                      {open && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-3 py-3">
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
                                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-slate-200 py-1.5">
                                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {label}
                                  </span>
                                  <span className="min-w-0 truncate text-right font-mono text-[12px] text-slate-700" title={value}>
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Metadata
                              </span>
                              <pre className="mt-1 overflow-x-auto rounded-md bg-[#071426] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#D9A441]">
                                {prettyJson(entry.metadata)}
                              </pre>
                            </div>
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
    </>
  );
};

export default AuditLogPage;
