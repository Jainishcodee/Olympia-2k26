import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCollection } from '@/hooks/useCollection';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  StatTile,
  StatusPill,
} from '@/components/admin/kit';
import { cn } from '@/utils/cn';
import type { AuditEntry, Fixture, Match, MatchEvent, Team } from '@/types';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import { HiOutlineVideoCamera } from 'react-icons/hi';

/** Accepts a Firestore Timestamp, a Date, an ISO string or nothing. */
const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in (value as Date)) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const isToday = (value: unknown) => {
  const date = toDate(value);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const formatTime = (value: unknown) => {
  const date = toDate(value);
  return date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
};

const formatDay = (value: unknown) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString([], { day: '2-digit', month: 'short' }) : '—';
};

/** `score` is `{teamA, teamB}` for most sports but free-form for cricket. */
const renderScore = (match: Match) => {
  const score = match.score as unknown as Record<string, unknown> | undefined;
  if (!score) return '—';
  const a = score.teamA;
  const b = score.teamB;
  if (a === undefined && b === undefined) return '—';
  return `${a ?? 0} – ${b ?? 0}`;
};

const AdminDashboard: React.FC = () => {
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const players = useCollection<{ id: string }>('players');
  const tournaments = useCollection<{ id: string; status?: string }>('tournaments');
  const votes = useCollection<{ id: string }>('votes');
  const reviews = useCollection<{ id: string; rating?: number }>('reviews');
  const reactions = useCollection<{ id: string }>('reactions');
  const fixtures = useCollection<Fixture>('fixtures', { sortBy: 'scheduledAt' });
  const events = useCollection<MatchEvent>('matchEvents', { max: 8 });
  const activity = useCollection<AuditEntry>('auditLogs', {
    sortBy: 'timestamp',
    direction: 'desc',
    max: 8,
  });

  const isLoading =
    matches.isLoading ||
    teams.isLoading ||
    players.isLoading ||
    tournaments.isLoading;

  const firstError =
    matches.error ?? teams.error ?? players.error ?? tournaments.error ?? null;

  const teamById = useMemo(
    () => new Map(teams.data.map((team) => [team.id, team])),
    [teams.data],
  );

  const liveMatches = useMemo(
    () => matches.data.filter((match) => match.status === 'live'),
    [matches.data],
  );

  const upcomingToday = useMemo(
    () => matches.data.filter((m) => (m.status === 'upcoming' || m.status === 'scheduled') && isToday(m.scheduledAt)),
    [matches.data],
  );

  const completedToday = useMemo(
    () => matches.data.filter((m) => m.status === 'completed' && isToday(m.scheduledAt)),
    [matches.data],
  );

  const upcomingFixtures = useMemo(() => {
    const now = Date.now();
    return fixtures.data
      .filter((fixture) => {
        const date = toDate(fixture.scheduledAt);
        return !date || date.getTime() >= now;
      })
      .slice(0, 6);
  }, [fixtures.data]);

  const teamName = (id?: string) => (id ? teamById.get(id)?.name ?? id : '—');

  const nameOf = (match?: Match) => {
    if (!match) return '—';
    return match.participantA?.name ?? teamName(match.teamAId);
  };

  const error = firstError;

  return (
    <>
      <AdminHeader
        title="Dashboard"
        subtitle="Operational overview of OLYMPIA 2K26. Every figure below is read live from Firestore."
        actions={
          <>
            <Btn to="/admin/live" variant="primary" icon={<HiOutlineVideoCamera className="h-4 w-4" />}>
              Live control room
            </Btn>
            <Btn to="/admin/matches/create" variant="secondary">
              Create match
            </Btn>
          </>
        }
      />

      {error && <ErrorNotice message={error} className="mb-5" />}

      {/* ------------------------------------------------ today's traffic */}
      <Card title="Today" hint="Matches scheduled against the local date" className="mb-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Live now"
            value={liveMatches.length}
            accent="red"
            hint="Open the control room to operate them"
            isLoading={isLoading}
            to="/admin/live"
          />
          <StatTile
            label="Upcoming today"
            value={upcomingToday.length}
            accent="blue"
            isLoading={isLoading}
            to="/admin/matches"
          />
          <StatTile
            label="Completed today"
            value={completedToday.length}
            accent="green"
            isLoading={isLoading}
            to="/admin/matches"
          />
        </div>
      </Card>

      {/* -------------------------------------------------- totals */}
      <Card title="Competition" className="mb-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total matches" value={matches.data.length} accent="blue" isLoading={isLoading} to="/admin/matches" />
          <StatTile label="Total teams" value={teams.data.length} accent="gold" isLoading={isLoading} to="/admin/teams" />
          <StatTile label="Total players" value={players.data.length} accent="gold" isLoading={isLoading} to="/admin/players" />
          <StatTile
            label="Total tournaments"
            value={tournaments.data.length}
            accent="slate"
            isLoading={isLoading}
            to="/admin/tournaments"
          />
        </div>
      </Card>

      <Card title="Public interaction" className="mb-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Total votes"
            value={votes.data.length}
            accent="blue"
            isLoading={votes.isLoading}
            hint="Anonymous ballots cast"
            to="/admin/votes"
          />
          <StatTile
            label="Total reviews"
            value={reviews.data.length}
            accent="gold"
            isLoading={reviews.isLoading}
            to="/admin/reviews"
          />
          <StatTile
            label="Total reactions"
            value={reactions.data.length}
            accent="slate"
            isLoading={reactions.isLoading}
            to="/admin/reactions"
          />
        </div>
      </Card>

      {/* ------------------------------------------ live match overview */}
      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <Card
          title="Live match overview"
          hint="Click through to the scoring console"
          actions={<Btn to="/admin/live" size="xs" icon={<FiArrowRight className="h-3.5 w-3.5" />}>All live</Btn>}
          flush
        >
          {matches.isLoading ? (
            <LoadingRows rows={4} cols={4} />
          ) : matches.error ? (
            <div className="p-4"><ErrorNotice message={matches.error} /></div>
          ) : liveMatches.length === 0 ? (
            <EmptyNotice
              title="No matches are live"
              message="Start a match from the Live Control Room and it will appear here in real time."
              action={<Btn to="/admin/live" variant="primary">Open control room</Btn>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {liveMatches.map((match) => {
                const sport = match.sportId;
                const a = match.participantA?.name ?? teamName(match.teamAId);
                const b = match.participantB?.name ?? teamName(match.teamBId);
                return (
                  <li key={match.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {sport}
                      </span>
                      <StatusPill value="live" />
                      <span className="ml-auto font-mono text-[12px] tabular-nums text-slate-500">
                        {formatTime(match.scheduledAt)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <span className="truncate text-right text-[13px] font-semibold text-slate-800">{a}</span>
                      <span className="rounded bg-slate-900 px-2.5 py-1 text-[14px] font-black tabular-nums text-white">
                        {renderScore(match)}
                      </span>
                      <span className="truncate text-[13px] font-semibold text-slate-800">{b}</span>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Btn to={`/admin/matches/${match.id}/scoring`} variant="primary" size="xs">
                        Open scoring
                      </Btn>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* --------------------------------------------- recent events */}
        <Card
          title="Recent match events"
          actions={<span className="text-[11px] text-slate-400">newest first</span>}
          flush
        >
          {events.isLoading ? (
            <LoadingRows rows={5} cols={3} />
          ) : events.error ? (
            <div className="p-4"><ErrorNotice message={events.error} /></div>
          ) : events.data.length === 0 ? (
            <EmptyNotice
              title="No match events yet"
              message="Goals, wickets and cards recorded from the scoring console stream here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {events.data.slice(0, 8).map((event) => (
                <li key={event.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1264FF]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">
                      {String(event.type ?? 'event').replace(/_/g, ' ')}
                      {event.teamId ? ` · ${teamName(event.teamId)}` : ''}
                    </span>
                    <span className="block truncate text-[12px] text-slate-400">
                      {event.undone ? 'undone · ' : ''}
                      {event.data ? Object.entries(event.data).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') : ''}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                    {(() => {
                      const stamp = event.timestamp;
                      if (!stamp) return '';
                      const date =
                        typeof (stamp as { toDate?: () => Date }).toDate === 'function'
                          ? (stamp as { toDate: () => Date }).toDate()
                          : new Date(stamp as unknown as number);
                      return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* ---------------------------------------- upcoming fixtures */}
        <Card
          title="Upcoming fixtures"
          actions={<Btn to="/admin/fixtures" size="xs">Manage</Btn>}
          flush
        >
          {fixtures.isLoading ? (
            <LoadingRows rows={4} cols={3} />
          ) : fixtures.error ? (
            <div className="p-4"><ErrorNotice message={fixtures.error} /></div>
          ) : upcomingFixtures.length === 0 ? (
            <EmptyNotice title="No fixtures scheduled" message="Create fixtures to build the schedule." action={<Btn to="/admin/fixtures/create" variant="primary">Create fixture</Btn>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingFixtures.map((fixture) => (
                <li key={fixture.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex w-14 shrink-0 flex-col items-center rounded border border-slate-200 bg-slate-50 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {formatDay(fixture.scheduledAt)}
                    </span>
                    <span className="font-mono text-[12px] font-bold tabular-nums text-slate-700">
                      {formatTime(fixture.scheduledAt)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">
                      {teamName(fixture.teamAId)} <span className="text-slate-400">vs</span> {teamName(fixture.teamBId)}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {fixture.round ?? 'Fixture'} · {fixture.venueId ?? 'Venue TBC'}
                    </span>
                  </span>
                  <StatusPill value={fixture.status ?? 'scheduled'} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* --------------------------------------- recent admin activity */}
        <Card
          title="Recent admin activity"
          actions={<Btn to="/admin/audit" size="xs">Full audit log</Btn>}
          flush
        >
          {activity.isLoading ? (
            <LoadingRows rows={5} cols={3} />
          ) : activity.error ? (
            <div className="p-4"><ErrorNotice message={activity.error} /></div>
          ) : activity.data.length === 0 ? (
            <EmptyNotice
              title="No activity recorded yet"
              message="Every privileged action an administrator takes is written to the audit log."
              action={<Btn to="/admin/audit">Open audit log</Btn>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.data.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={cn(
                      'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                      entry.action?.startsWith('MATCH')
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : entry.action?.startsWith('ADMIN')
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700',
                    )}
                  >
                    {entry.action}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-slate-600">
                    {entry.resourceLabel ?? entry.resourceId}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">{entry.adminName ?? entry.adminId}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {!isLoading && !error && matches.data.length === 0 && (
        <Card className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-700">
                <FiClock className="mr-1.5 inline h-4 w-4 text-slate-400" />
                Firestore returned zero matches.
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Run <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px] font-bold">npm run seed</code> to
                populate the collections, or create your first match manually.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/admin/matches/create"
                className="rounded-md bg-[#1264FF] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#0B4FD1]"
              >
                Create match
              </Link>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AdminDashboard;
