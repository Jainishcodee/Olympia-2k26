import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eq, useCollection, useDoc } from '@/hooks/useCollection';
import {
  AdminHeader,
  AdminTabs,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  MetaRow,
  PageLoading,
  StatTile,
  StatusPill,
} from '@/components/admin/kit';
import type { Fixture, Match, Sport, Team, Tournament, Venue } from '@/types';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  Tournament detail — seven tabs over one competition: its record, the teams
 *  in scope, the fixture board, the bracket, a computed P/W/D/L table, the
 *  matches themselves and the finished results.
 * ==========================================================================*/

type TeamRow = Team & { tournamentId?: string };

interface StandingRow {
  key: string;
  name: string;
  p: number;
  w: number;
  d: number;
  l: number;
  pts: number;
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const stamp = value as { toDate?: () => Date; seconds?: number };
  if (typeof stamp.toDate === 'function') return stamp.toDate();
  if (typeof stamp.seconds === 'number') return new Date(stamp.seconds * 1000);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const timeOf = (value: unknown) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
};

const dateOf = (value: unknown) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const scoreOf = (match: Match): string => {
  const score: { teamA?: number; teamB?: number } | undefined = match.score;
  if (!score) return '—';
  const a = score.teamA;
  const b = score.teamB;
  if (a === undefined && b === undefined) return '—';
  return `${a ?? 0} – ${b ?? 0}`;
};

const TournamentDetail: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tab, setTab] = useState('overview');

  const tournament = useDoc<Tournament>('tournaments', tournamentId);
  const matches = useCollection<Match>('matches', {
    constraints: eq('tournamentId', tournamentId),
    enabled: Boolean(tournamentId),
  });
  const fixtures = useCollection<Fixture>('fixtures', {
    constraints: eq('tournamentId', tournamentId),
    enabled: Boolean(tournamentId),
  });
  const teams = useCollection<TeamRow>('teams', { sortBy: 'name' });
  const venues = useCollection<Venue>('venues', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });

  const teamNames = useMemo(() => new Map(teams.data.map((row) => [row.id, row.name])), [teams.data]);
  const venueName = (id?: string) =>
    id ? (venues.data.find((row) => row.id === id)?.name ?? id) : '—';

  const teamLabel = (id?: string, fallback?: string) => {
    if (id && teamNames.has(id)) return teamNames.get(id) as string;
    if (id && id.trim()) return id;
    return fallback || 'TBD';
  };

  /* ------------------------------------------------------------- scoping */

  const { scopeTeams, usingFallback } = useMemo(() => {
    const linked = teams.data.filter((row) => row.tournamentId && row.tournamentId === tournamentId);
    if (linked.length > 0) return { scopeTeams: linked, usingFallback: false };
    const sportId = tournament.data?.sportId;
    return {
      scopeTeams: sportId ? teams.data.filter((row) => row.sportId === sportId) : [],
      usingFallback: true,
    };
  }, [teams.data, tournamentId, tournament.data]);

  const completedMatches = useMemo(
    () => matches.data.filter((match) => match.status === 'completed'),
    [matches.data],
  );

  const remainingMatches = useMemo(
    () =>
      matches.data.filter(
        (match) => match.status !== 'completed' && match.status !== 'cancelled',
      ),
    [matches.data],
  );

  const standings = useMemo(() => {
    const map = new Map<string, StandingRow>();
    const ensure = (key: string, name: string): StandingRow => {
      const found = map.get(key);
      if (found) return found;
      const row: StandingRow = { key, name, p: 0, w: 0, d: 0, l: 0, pts: 0 };
      map.set(key, row);
      return row;
    };
    matches.data.forEach((match) => {
      if (match.status !== 'completed') return;
      const score: { teamA?: number; teamB?: number } | undefined = match.score;
      if (!score || score.teamA === undefined || score.teamB === undefined) return;
      const keyA = match.teamAId || match.participantA?.id || `${match.id}-a`;
      const keyB = match.teamBId || match.participantB?.id || `${match.id}-b`;
      const rowA = ensure(keyA, teamLabel(match.teamAId, match.participantA?.name));
      const rowB = ensure(keyB, teamLabel(match.teamBId, match.participantB?.name));
      rowA.p += 1;
      rowB.p += 1;
      if (score.teamA > score.teamB) {
        rowA.w += 1;
        rowB.l += 1;
        rowA.pts += 3;
      } else if (score.teamA < score.teamB) {
        rowB.w += 1;
        rowA.l += 1;
        rowB.pts += 3;
      } else {
        rowA.d += 1;
        rowB.d += 1;
        rowA.pts += 1;
        rowB.pts += 1;
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => b.pts - a.pts || b.w - a.w || a.name.localeCompare(b.name),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.data, teamNames]);

  const bracketRounds = useMemo(() => {
    const names: string[] = [];
    (tournament.data?.rounds ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((round) => {
        if (round.name && !names.includes(round.name)) names.push(round.name);
      });
    fixtures.data.forEach((fixture) => {
      const name = fixture.round || 'Unassigned';
      if (!names.includes(name)) names.push(name);
    });
    return names.map((name) => ({
      name,
      fixtures: fixtures.data
        .filter((fixture) => (fixture.round || 'Unassigned') === name)
        .sort((a, b) => {
          const left = toDate(a.scheduledAt)?.getTime();
          const right = toDate(b.scheduledAt)?.getTime();
          if (left === undefined && right === undefined) return (a.order ?? 0) - (b.order ?? 0);
          if (left === undefined) return 1;
          if (right === undefined) return -1;
          if (left !== right) return left - right;
          return (a.order ?? 0) - (b.order ?? 0);
        }),
    }));
  }, [tournament.data, fixtures.data]);

  const tabs = useMemo(() => {
    const counts: Record<string, number | undefined> = {
      teams: scopeTeams.length,
      fixtures: fixtures.data.length,
      matches: matches.data.length,
      results: completedMatches.length,
    };
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'teams', label: 'Teams' },
      { id: 'fixtures', label: 'Fixtures' },
      { id: 'bracket', label: 'Bracket' },
      { id: 'standings', label: 'Standings' },
      { id: 'matches', label: 'Matches' },
      { id: 'results', label: 'Results' },
    ].map((item) =>
      counts[item.id] === undefined ? item : { ...item, count: counts[item.id] },
    );
  }, [scopeTeams.length, fixtures.data.length, matches.data.length, completedMatches.length]);

  /* -------------------------------------------------------------- states */

  if (tournament.isLoading) return <PageLoading label="Loading tournament…" />;

  if (tournament.error)
    return (
      <>
        <AdminHeader
          title="Tournament"
          breadcrumbs={[{ label: 'Tournaments', to: '/admin/tournaments' }, { label: 'Detail' }]}
          actions={<Btn to="/admin/tournaments">All tournaments</Btn>}
        />
        <ErrorNotice message={tournament.error} />
      </>
    );

  if (!tournament.data)
    return (
      <>
        <AdminHeader
          title="Tournament"
          breadcrumbs={[{ label: 'Tournaments', to: '/admin/tournaments' }, { label: 'Detail' }]}
          actions={<Btn to="/admin/tournaments">All tournaments</Btn>}
        />
        <Card>
          <EmptyNotice
            title="Tournament not found"
            message="This competition may have been deleted. Return to the list to pick another one."
            action={
              <Btn to="/admin/tournaments" variant="primary">
                Back to tournaments
              </Btn>
            }
          />
        </Card>
      </>
    );

  const row = tournament.data;
  const sport = sports.data.find((candidate) => candidate.id === row.sportId);
  const sportName = sport ? sport.name : row.sportId || '—';

  /* --------------------------------------------------------------- tabs */

  const renderOverview = () => (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Teams"
          value={scopeTeams.length}
          accent="blue"
          isLoading={teams.isLoading}
          hint={usingFallback ? 'Scoped by sport' : 'Linked to this tournament'}
        />
        <StatTile
          label="Matches"
          value={matches.data.length}
          accent="gold"
          isLoading={matches.isLoading}
        />
        <StatTile
          label="Fixtures"
          value={fixtures.data.length}
          accent="slate"
          isLoading={fixtures.isLoading}
        />
        <StatTile
          label="Remaining"
          value={remainingMatches.length}
          accent="green"
          isLoading={matches.isLoading}
          hint="Not completed or cancelled"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Record" className="lg:col-span-2">
          <dl>
            <MetaRow label="Name">{row.name}</MetaRow>
            <MetaRow label="Sport">{sportName}</MetaRow>
            <MetaRow label="Format">{(row.format ?? '').replace('_', ' ') || '—'}</MetaRow>
            <MetaRow label="Status">{row.status ?? '—'}</MetaRow>
            <MetaRow label="Start date">{dateOf(row.startDate)}</MetaRow>
            <MetaRow label="End date">{dateOf(row.endDate)}</MetaRow>
            <MetaRow label="Venue">{row.venue || '—'}</MetaRow>
            <MetaRow label="Rounds">{row.rounds?.length ?? 0}</MetaRow>
            <MetaRow label="Tournament id">{row.id}</MetaRow>
          </dl>
        </Card>

        <Card title="Description">
          <p className="text-[13px] leading-relaxed text-slate-600">
            {row.description || 'No description yet.'}
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-[12px] leading-relaxed text-slate-500">
            {usingFallback
              ? 'No team carries this tournament id, so teams are scoped by sport. Link teams to tighten the scope.'
              : 'Teams are scoped by their tournament id.'}
          </div>
        </Card>
      </div>
    </>
  );

  const renderTeams = () => (
    <Card
      title="Teams"
      hint={usingFallback ? `No tournament link yet — showing ${sportName} teams` : 'Linked by tournament id'}
      flush
    >
      {teams.isLoading ? (
        <LoadingRows rows={5} cols={5} />
      ) : scopeTeams.length === 0 ? (
        <EmptyNotice
          title="No teams in scope"
          message="Teams appear here once they carry this tournament id, or belong to the same sport."
          action={<Btn to="/admin/teams">Open teams</Btn>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Team', 'Short name', 'Players', 'Record', 'Points', ''].map((heading) => (
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
              {scopeTeams.map((team) => (
                <tr key={team.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 text-[13px] font-semibold text-slate-800">
                    {team.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-slate-600">
                    {team.shortName || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-600">
                    {team.playerIds?.length ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12px] tabular-nums text-slate-600">
                    {team.wins ?? 0}W · {team.losses ?? 0}L · {team.draws ?? 0}D
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums text-slate-700">
                    {team.points ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <Btn size="xs" to={`/admin/teams/${team.id}`}>
                      View
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderFixtures = () => (
    <Card title="Fixtures" hint="The published schedule for this competition" flush>
      {fixtures.isLoading ? (
        <LoadingRows rows={5} cols={5} />
      ) : fixtures.data.length === 0 ? (
        <EmptyNotice
          title="No fixtures yet"
          message="Create fixtures to build the schedule and the bracket."
          action={
            <Btn to={`/admin/fixtures/create?tournament=${row.id}`} variant="primary">
              Create fixture
            </Btn>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {fixtures.data.map((fixture) => (
            <li key={fixture.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-12 shrink-0 font-mono text-[12px] font-bold tabular-nums text-slate-700">
                {timeOf(fixture.scheduledAt)}
              </span>
              <span className="min-w-[180px] flex-1">
                <span className="block truncate text-[13px] font-semibold text-slate-800">
                  {teamLabel(fixture.teamAId)} <span className="text-slate-400">vs</span>{' '}
                  {teamLabel(fixture.teamBId)}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {fixture.round || 'Fixture'} · {dateOf(fixture.scheduledAt)} ·{' '}
                  {venueName(fixture.venueId)}
                </span>
              </span>
              <StatusPill value={fixture.status ?? 'scheduled'} />
              <Btn size="xs" to={`/admin/fixtures/${fixture.id}`}>
                View
              </Btn>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const renderBracket = () => {
    const hasData = bracketRounds.some((round) => round.fixtures.length > 0);
    if (fixtures.isLoading) return <LoadingRows rows={5} cols={4} />;
    if (!hasData)
      return (
        <Card title="Bracket">
          <EmptyNotice
            title="Bracket not generated"
            message="Create fixtures to build the bracket."
            action={
              <Btn to={`/admin/fixtures/create?tournament=${row.id}`} variant="primary">
                Create fixture
              </Btn>
            }
          />
        </Card>
      );
    return (
      <Card
        title="Bracket"
        hint={`${(row.format ?? '').replace('_', ' ') || 'format'} · rounds render left to right`}
        flush
      >
        <div className="overflow-x-auto p-4">
          <div className="flex min-w-max gap-4">
            {bracketRounds.map((round, index) => (
              <div key={round.name} className="w-[260px]">
                <div className="mb-2 flex items-center justify-between rounded-md bg-[#071426] px-3 py-2">
                  <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-[#FFD21F]">
                    {round.name}
                  </span>
                  <span className="ml-2 shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                    {round.fixtures.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {round.fixtures.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-[11px] text-slate-400">
                      No fixtures in this round
                    </div>
                  ) : (
                    round.fixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className={cn(
                          'rounded-md border bg-white px-3 py-2 transition-colors',
                          fixture.status === 'completed'
                            ? 'border-emerald-200'
                            : 'border-slate-200 hover:border-[#1264FF]',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {timeOf(fixture.scheduledAt)}
                          </span>
                          <StatusPill value={fixture.status ?? 'scheduled'} />
                        </div>
                        <span className="mt-1.5 block truncate text-[13px] font-semibold text-slate-800">
                          {teamLabel(fixture.teamAId)}
                        </span>
                        <span className="block truncate text-[13px] font-semibold text-slate-800">
                          {teamLabel(fixture.teamBId)}
                        </span>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                          <span className="truncate text-[11px] text-slate-400">
                            {venueName(fixture.venueId)}
                          </span>
                          <Btn size="xs" to={`/admin/fixtures/${fixture.id}`}>
                            Open
                          </Btn>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {index < bracketRounds.length - 1 && (
                  <span className="mt-2 block text-center text-[10px] uppercase tracking-wider text-slate-300">
                    next round →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  const renderStandings = () => (
    <Card
      title="Standings"
      hint="3 points a win · 1 for a draw · computed from completed matches in this tournament"
      flush
    >
      {matches.isLoading ? (
        <LoadingRows rows={5} cols={7} />
      ) : standings.length === 0 ? (
        <EmptyNotice
          title="No results yet"
          message="Standings appear as soon as a match in this tournament is completed with a score."
          action={<Btn to="/admin/matches">Open matches</Btn>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['#', 'Team', 'P', 'W', 'D', 'L', 'Pts'].map((heading) => (
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
              {standings.map((standing, index) => (
                <tr key={standing.key} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-mono text-[12px] font-bold tabular-nums text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-semibold text-slate-800">
                    {standing.name}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-600">
                    {standing.p}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-600">
                    {standing.w}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-600">
                    {standing.d}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-slate-600">
                    {standing.l}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[14px] font-bold tabular-nums text-slate-900">
                    {standing.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderMatches = () => (
    <Card title="Matches" hint="Scoring happens in the console, not here" flush>
      {matches.isLoading ? (
        <LoadingRows rows={5} cols={6} />
      ) : matches.data.length === 0 ? (
        <EmptyNotice
          title="No matches in this tournament"
          message="Create matches and assign them to this tournament to see them here."
          action={<Btn to="/admin/matches/create">Create match</Btn>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Match', 'Teams', 'Date', 'Time', 'Venue', 'Status', ''].map((heading) => (
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
              {matches.data.map((match) => (
                <tr key={match.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-mono text-[13px] font-bold tabular-nums text-slate-700">
                    #{match.matchNumber ?? '—'}
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2.5 text-[13px] font-semibold text-slate-800">
                    {teamLabel(match.teamAId, match.participantA?.name)} vs{' '}
                    {teamLabel(match.teamBId, match.participantB?.name)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-slate-600">
                    {dateOf(match.scheduledAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] tabular-nums text-slate-600">
                    {timeOf(match.scheduledAt)}
                  </td>
                  <td className="max-w-[150px] truncate px-3 py-2.5 text-[13px] text-slate-600">
                    {venueName(match.venueId)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusPill value={match.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Btn size="xs" to={`/admin/matches/${match.id}`}>
                        View
                      </Btn>
                      <Btn size="xs" variant="primary" to={`/admin/matches/${match.id}/scoring`}>
                        Scoring
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderResults = () => (
    <Card title="Results" hint="Completed matches with a final score" flush>
      {matches.isLoading ? (
        <LoadingRows rows={5} cols={4} />
      ) : completedMatches.length === 0 ? (
        <EmptyNotice
          title="No results yet"
          message="When a match is completed in the scoring console its final score lands here."
          action={<Btn to="/admin/matches">Open matches</Btn>}
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {completedMatches.map((match) => {
            const score: { teamA?: number; teamB?: number } | undefined = match.score;
            const a = score?.teamA ?? 0;
            const b = score?.teamB ?? 0;
            const leftWon = a > b;
            const rightWon = b > a;
            return (
              <li key={match.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-14 shrink-0 font-mono text-[12px] font-bold tabular-nums text-slate-400">
                  #{match.matchNumber ?? '—'}
                </span>
                <span
                  className={cn(
                    'min-w-[160px] flex-1 truncate text-right text-[13px] font-semibold',
                    leftWon ? 'text-slate-900' : 'text-slate-500',
                  )}
                >
                  {teamLabel(match.teamAId, match.participantA?.name)}
                </span>
                <span className="rounded bg-[#071426] px-3 py-1.5 font-mono text-[14px] font-bold tabular-nums text-[#FFD21F]">
                  {scoreOf(match)}
                </span>
                <span
                  className={cn(
                    'min-w-[160px] flex-1 truncate text-[13px] font-semibold',
                    rightWon ? 'text-slate-900' : 'text-slate-500',
                  )}
                >
                  {teamLabel(match.teamBId, match.participantB?.name)}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                  {dateOf(match.endedAt ?? match.scheduledAt)}
                </span>
                <Btn size="xs" to={`/admin/matches/${match.id}`}>
                  Detail
                </Btn>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );

  const renderTab = () => {
    switch (tab) {
      case 'teams':
        return renderTeams();
      case 'fixtures':
        return renderFixtures();
      case 'bracket':
        return renderBracket();
      case 'standings':
        return renderStandings();
      case 'matches':
        return renderMatches();
      case 'results':
        return renderResults();
      default:
        return renderOverview();
    }
  };

  return (
    <>
      <AdminHeader
        title={row.name}
        subtitle={row.description || 'Competition record, schedule, bracket and standings.'}
        breadcrumbs={[{ label: 'Tournaments', to: '/admin/tournaments' }, { label: row.name }]}
        badge={<StatusPill value={row.status} />}
        actions={
          <>
            <Btn to={`/admin/tournaments/${row.id}/edit`} variant="secondary">
              Edit
            </Btn>
            <Btn to={`/admin/fixtures/create?tournament=${row.id}`} variant="primary">
              Create fixture
            </Btn>
          </>
        }
      />

      {(matches.error || fixtures.error || teams.error || sports.error) && (
        <ErrorNotice
          message={matches.error ?? fixtures.error ?? teams.error ?? sports.error ?? ''}
          className="mb-4"
        />
      )}

      <AdminTabs items={tabs} active={tab} onChange={setTab} layoutPrefix="tournament-tab" />

      {renderTab()}
    </>
  );
};

export default TournamentDetail;
