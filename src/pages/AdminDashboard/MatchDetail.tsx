import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCollection, useDoc, eq } from '@/hooks/useCollection';
import {
  AdminHeader,
  AdminTabs,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  PageLoading,
  StatTile,
  StatusPill,
  Toggle,
} from '@/components/admin/kit';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  endMatch,
  pauseMatch,
  resumeMatch,
  startMatch,
  updateMatch,
} from '@/services/matches/matchService';
import type {
  AuditEntry,
  Match,
  MatchEvent,
  MatchStatus,
  Sport,
  Team,
  Tournament,
  Venue,
} from '@/types';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiArrowRight, FiEdit2, FiPlay, FiPause, FiSquare } from 'react-icons/fi';

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const fullStamp = (value: unknown) => {
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

const timeOnly = (value: unknown) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
};

type Lifecycle = 'start' | 'pause' | 'resume' | 'end';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Match timeline' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'interactions', label: 'Public interaction' },
  { id: 'audit', label: 'Admin action history' },
];

const MatchDetail: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { log } = useAuditLog();

  const match = useDoc<Match>('matches', matchId);
  const events = useCollection<MatchEvent>('matchEvents', {
    constraints: eq('matchId', matchId),
    sortBy: 'timestamp',
    direction: 'desc',
  });
  const audit = useCollection<AuditEntry>('auditLogs', {
    constraints: eq('resourceId', matchId),
    sortBy: 'timestamp',
    direction: 'desc',
  });

  const sports = useCollection<Sport>('sports');
  const tournaments = useCollection<Tournament>('tournaments');
  const venues = useCollection<Venue>('venues');
  const teams = useCollection<Team>('teams');

  const [tab, setTab] = useState('overview');
  const [pending, setPending] = useState<Lifecycle | null>(null);
  const [busy, setBusy] = useState(false);

  const lookups = useMemo(() => {
    const build = (rows: { id: string; name: string }[]) => {
      const map = new Map(rows.map((row) => [row.id, row.name]));
      return (id?: string) => (id ? (map.get(id) ?? id) : '—');
    };
    return {
      sport: build(sports.data),
      tournament: build(tournaments.data),
      venue: build(venues.data),
      team: build(teams.data),
    };
  }, [sports.data, tournaments.data, venues.data, teams.data]);

  const data = match.data;

  const score = data?.score as unknown as Record<string, unknown> | undefined;
  const cricket = data?.sportId === 'cricket';
  const scoreline = data
    ? cricket
      ? `${score?.teamA ?? 0}/${score?.teamB ?? 0}`
      : `${score?.teamA ?? 0} – ${score?.teamB ?? 0}`
    : '—';

  const participantName = (side: 'A' | 'B') => {
    if (!data) return '—';
    const participant = side === 'A' ? data.participantA : data.participantB;
    if (participant?.name) return participant.name;
    const id = side === 'A' ? data.teamAId : data.teamBId;
    return lookups.team(id);
  };

  /** Which lifecycle controls are legal right now. */
  const controls = useMemo(() => {
    const status = data?.status as MatchStatus | undefined;
    if (status === 'scheduled' || status === 'upcoming')
      return [{ kind: 'start' as Lifecycle, label: 'Start match', variant: 'primary' as const, Icon: FiPlay }];
    if (status === 'live')
      return [
        { kind: 'pause' as Lifecycle, label: 'Pause', variant: 'secondary' as const, Icon: FiPause },
        { kind: 'end' as Lifecycle, label: 'End match', variant: 'danger' as const, Icon: FiSquare },
      ];
    if (status === 'paused')
      return [
        { kind: 'resume' as Lifecycle, label: 'Resume', variant: 'warn' as const, Icon: FiPlay },
        { kind: 'end' as Lifecycle, label: 'End match', variant: 'danger' as const, Icon: FiSquare },
      ];
    return [];
  }, [data?.status]);

  const runLifecycle = async (kind: Lifecycle) => {
    if (!matchId) return;
    setBusy(true);
    try {
      if (kind === 'start') {
        await startMatch(matchId);
        await log('MATCH_STARTED', 'match', matchId, { label: labelFor() });
        toast.success('Match started — status is LIVE');
      } else if (kind === 'pause') {
        await pauseMatch(matchId);
        await log('MATCH_PAUSED', 'match', matchId, { label: labelFor() });
        toast.success('Match paused');
      } else if (kind === 'resume') {
        await resumeMatch(matchId);
        await log('MATCH_RESUMED', 'match', matchId, { label: labelFor() });
        toast.success('Match resumed');
      } else {
        await endMatch(matchId);
        await log('MATCH_ENDED', 'match', matchId, { label: labelFor(), metadata: { finalScore: scoreline } });
        toast.success('Match ended — FINAL');
      }
      setPending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const labelFor = () =>
    data ? `${lookups.sport(data.sportId)} · Match #${data.matchNumber ?? '—'}` : matchId ?? 'match';

  const setInteraction = async (
    key: 'allowReactions' | 'allowRatings' | 'allowReviews' | 'allowVoting',
    value: boolean,
  ) => {
    if (!matchId || !data) return;
    try {
      await updateMatch(matchId, { [key]: value } as Partial<Match>);
      await log('MATCH_UPDATED', 'match', matchId, {
        label: labelFor(),
        metadata: { [key]: value },
      });
      toast.success(`${key.replace('allow', '')} ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  if (match.isLoading) return <PageLoading label="Loading match…" />;
  if (match.error) return <div className="py-10"><ErrorNotice message={match.error} /></div>;
  if (!data)
    return (
      <div className="py-6">
        <EmptyNotice
          title="Match not found"
          message={`No document exists at matches/${matchId}.`}
          action={<Btn to="/admin/matches">Back to matches</Btn>}
        />
      </div>
    );

  const cancelled = data.status === 'cancelled';
  const live = data.liveState ?? {};

  return (
    <>
      <AdminHeader
        title={`Match #${data.matchNumber ?? '—'}`}
        subtitle={`${participantName('A')} vs ${participantName('B')}`}
        breadcrumbs={[
          { label: 'Matches', to: '/admin/matches' },
          { label: `#${data.matchNumber ?? '—'}` },
        ]}
        badge={<StatusPill value={data.status} />}
        actions={
          <>
            <Btn to="/admin/matches" variant="ghost">Back</Btn>
            <Btn to={`/admin/matches/${data.id}/edit`} variant="secondary" icon={<FiEdit2 className="h-4 w-4" />}>
              Edit
            </Btn>
            <Btn
              to={`/admin/matches/${data.id}/scoring`}
              variant="primary"
              icon={<FiArrowRight className="h-4 w-4" />}
            >
              Open scoring
            </Btn>
          </>
        }
      />

      {/* -------------------------------------------------- score plate */}
      <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            {lookups.sport(data.sportId)}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="truncate text-[11px] font-semibold text-slate-400">
            {lookups.tournament(data.tournamentId)}
          </span>
          <span className="ml-auto font-mono text-[12px] tabular-nums text-slate-500">
            {live.clock ?? (live.over !== undefined ? `${live.over}.${live.ball ?? 0} ov` : '')}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-6">
          <span className="truncate text-right text-[17px] font-bold text-slate-900">
            {participantName('A')}
          </span>
          <span className="flex flex-col items-center">
            <span className="rounded-md bg-slate-900 px-4 py-2 text-[28px] font-black leading-none tabular-nums text-white">
              {scoreline}
            </span>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {data.status}
            </span>
          </span>
          <span className="truncate text-[17px] font-bold text-slate-900">
            {participantName('B')}
          </span>
        </div>

        {controls.length > 0 && (
          <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Match status
            </span>
            {controls.map(({ kind, label, variant, Icon }) => (
              <Btn
                key={kind}
                variant={variant}
                disabled={busy}
                icon={<Icon className="h-3.5 w-3.5" />}
                onClick={() => setPending(kind)}
              >
                {label}
              </Btn>
            ))}
          </footer>
        )}
        {cancelled && (
          <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[12px] text-slate-500">
            This match is cancelled. Reopen it from the matches table to operate it again.
          </p>
        )}
      </section>

      <AdminTabs items={TABS} active={tab} onChange={setTab} layoutPrefix="match-tab" />

      {/* ------------------------------------------------------ overview */}
      {tab === 'overview' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Definition">
            <dl>
              {[
                ['Sport', lookups.sport(data.sportId)],
                ['Tournament', lookups.tournament(data.tournamentId)],
                ['Match number', String(data.matchNumber ?? '—')],
                ['Team A', participantName('A')],
                ['Team B', participantName('B')],
                ['Venue', lookups.venue(data.venueId)],
                ['Document ID', data.id],
                ['Created by', data.createdBy || '—'],
              ].map(([term, detail]) => (
                <div
                  key={term}
                  className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0"
                >
                  <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {term}
                  </dt>
                  <dd className="min-w-0 truncate text-right text-[13px] font-medium text-slate-800">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Schedule & lifecycle">
            <dl>
              {[
                ['Scheduled at', fullStamp(data.scheduledAt)],
                ['Started at', fullStamp(data.startedAt)],
                ['Paused at', fullStamp(data.pausedAt)],
                ['Ended at', fullStamp(data.endedAt)],
                ['Display mode', data.displayMode === 'dual_portrait' ? 'Dual portrait' : 'Single landscape'],
                ['Featured', data.featured ? `Yes (priority ${data.featuredPriority ?? 0})` : 'No'],
                ['Updated at', fullStamp(data.updatedAt)],
              ].map(([term, detail]) => (
                <div
                  key={term}
                  className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0"
                >
                  <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {term}
                  </dt>
                  <dd className="min-w-0 truncate text-right text-[13px] font-medium text-slate-800">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------- timeline */}
      {tab === 'timeline' && (
        <Card
          title="Match timeline"
          hint="Every recorded event, newest first"
          actions={<Btn size="xs" to={`/admin/matches/${data.id}/scoring`}>Record events</Btn>}
          flush
        >
          {events.isLoading ? (
            <div className="px-4 py-6"><PageLoading label="Loading events…" /></div>
          ) : events.error ? (
            <div className="p-4"><ErrorNotice message={events.error} /></div>
          ) : events.data.length === 0 ? (
            <EmptyNotice
              title="No events yet"
              message="Goals, wickets, cards and sets recorded from the scoring console appear here."
              action={<Btn variant="primary" to={`/admin/matches/${data.id}/scoring`}>Open scoring</Btn>}
            />
          ) : (
            <ol className="divide-y divide-slate-100">
              {events.data.map((event) => (
                <li key={event.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 w-16 shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                    {timeOnly(event.timestamp)}
                  </span>
                  <span
                    className={cn(
                      'w-32 shrink-0 rounded border px-1.5 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider',
                      event.undone
                        ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                        : event.type === 'goal' || event.type === 'six' || event.type === 'point'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : event.type === 'wicket' || event.type === 'red_card'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700',
                    )}
                  >
                    {String(event.type).replace(/_/g, ' ')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-slate-700">
                      {event.teamId ? lookups.team(event.teamId) : '—'}
                      {event.playerId ? ` · ${event.playerId}` : ''}
                    </span>
                    {event.data && Object.keys(event.data).length > 0 && (
                      <span className="block truncate text-[11px] text-slate-400">
                        {Object.entries(event.data)
                          .map(([key, value]) => `${key}: ${String(value)}`)
                          .join(' · ')}
                      </span>
                    )}
                  </span>
                  {event.undone && (
                    <span className="shrink-0 text-[10px] font-bold uppercase text-slate-400">undone</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {/* ----------------------------------------------------- statistics */}
      {tab === 'statistics' && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Events recorded" value={events.data.filter((e) => !e.undone).length} accent="blue" isLoading={events.isLoading} />
            <StatTile
              label="Final score"
              value={scoreline}
              accent="gold"
              hint={cricket ? 'runs / wickets' : undefined}
            />
            <StatTile
              label="Undone events"
              value={events.data.filter((e) => e.undone).length}
              accent="slate"
            />
            <StatTile label="Period / over" value={String(live.period ?? live.over ?? '—')} accent="slate" />
          </div>

          <Card title="Event breakdown" flush>
            {events.data.length === 0 ? (
              <EmptyNotice title="Nothing to summarise yet" message="Record events from the scoring console." />
            ) : (
              (() => {
                const counts = events.data
                  .filter((event) => !event.undone)
                  .reduce<Record<string, number>>((acc, event) => {
                    acc[event.type] = (acc[event.type] ?? 0) + 1;
                    return acc;
                  }, {});
                const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const max = Math.max(...rows.map(([, count]) => count), 1);
                return (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Event</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Count</th>
                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map(([type, count]) => (
                        <tr key={type}>
                          <td className="px-4 py-2.5 text-[13px] font-semibold text-slate-700">
                            {type.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] font-bold tabular-nums text-slate-900">{count}</td>
                          <td className="px-4 py-2.5">
                            <span className="block h-1.5 w-full max-w-[240px] rounded-full bg-slate-100">
                              <span
                                className="block h-1.5 rounded-full bg-[#1264FF]"
                                style={{ width: `${(count / max) * 100}%` }}
                              />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()
            )}
          </Card>
        </>
      )}

      {/* --------------------------------------------------- interactions */}
      {tab === 'interactions' && (
        <Card title="Public interaction" hint="Applies to the public /match/:matchId page">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <Toggle
              checked={data.allowReactions ?? true}
              onChange={(value) => setInteraction('allowReactions', value)}
              label="Reactions"
              hint="Live emoji bursts from spectators."
            />
            <Toggle
              checked={data.allowRatings ?? true}
              onChange={(value) => setInteraction('allowRatings', value)}
              label="Ratings"
              hint="Star ratings on players after the match."
            />
            <Toggle
              checked={data.allowReviews ?? true}
              onChange={(value) => setInteraction('allowReviews', value)}
              label="Reviews"
              hint="Written reviews, moderated at /admin/reviews."
            />
            <Toggle
              checked={data.allowVoting ?? true}
              onChange={(value) => setInteraction('allowVoting', value)}
              label="Voting"
              hint="Who-wins / man-of-the-match polls."
            />
          </div>
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[12px] text-slate-500">
            Each change is written straight to the match document and appended to the audit log.
          </p>
        </Card>
      )}

      {/* ---------------------------------------------------------- audit */}
      {tab === 'audit' && (
        <Card title="Admin action history" hint="Audit entries whose resource is this match" flush>
          {audit.isLoading ? (
            <div className="px-4 py-6"><PageLoading label="Loading audit trail…" /></div>
          ) : audit.error ? (
            <div className="p-4"><ErrorNotice message={audit.error} /></div>
          ) : audit.data.length === 0 ? (
            <EmptyNotice
              title="No audit entries yet"
              message="Status changes, edits and interaction toggles performed by administrators will appear here."
              action={<Btn to="/admin/audit">Open full audit log</Btn>}
            />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Timestamp', 'Admin', 'Action', 'Details'].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.data.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] tabular-nums text-slate-600">
                      {fullStamp(entry.timestamp)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-[12px] text-slate-600">
                      {entry.adminName ?? entry.adminEmail ?? entry.adminId}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700">
                        {entry.action}
                      </span>
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-2.5 text-[12px] text-slate-500">
                      {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <ConfirmDialog
        isOpen={pending === 'end'}
        title="End this match?"
        message={`Final score ${scoreline}. The display locks into the FINAL state — score updates from the console will be blocked.`}
        confirmText="End match"
        isDestructive
        onConfirm={() => runLifecycle('end')}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        isOpen={pending === 'start' || pending === 'pause' || pending === 'resume'}
        title={
          pending === 'start' ? 'Start this match?' : pending === 'pause' ? 'Pause this match?' : 'Resume this match?'
        }
        message={
          pending === 'start'
            ? 'Status moves to LIVE and the public scoreboard begins streaming.'
            : pending === 'pause'
              ? 'The clock stops and the public display shows PAUSED.'
              : 'The clock restarts and the match returns to LIVE.'
        }
        confirmText={pending === 'start' ? 'Start match' : pending === 'pause' ? 'Pause' : 'Resume'}
        onConfirm={() => pending && runLifecycle(pending)}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

export default MatchDetail;
