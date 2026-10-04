import React, { useMemo, useState } from 'react';
import { useCollection, useCollectionGroup } from '@/hooks/useCollection';
import { useAuditLog } from '@/hooks/useAuditLog';
import { updateMatch } from '@/services/matches/matchService';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  SearchInput,
  StatTile,
  StatusPill,
  SubLine,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import type { Match, Team, Vote } from '@/types';
import toast from 'react-hot-toast';

/* ============================================================================
 *  Votes — aggregate polling results per match.
 *
 *  Privacy: only counts are rendered. Individual ballots (and therefore any
 *  anonymous voter identity) are never listed, exported or drillable here.
 *
 *  `Match` has `allowVoting` but no lifecycle field, so closing a poll also
 *  writes `votingStatus: 'open' | 'closed'` on the match document.
 * ==========================================================================*/

type VoteDoc = Vote & { teamId?: string };
type MatchPatch = Partial<Match> & { votingStatus?: 'open' | 'closed' };

interface Split {
  total: number;
  a: number;
  b: number;
  other: number;
}

interface MatchRow {
  match: Match;
  total: number;
  a: number;
  b: number;
  other: number;
}

const matchLabel = (match: Match): string =>
  match.participantA?.name || match.participantB?.name
    ? `${match.participantA?.name ?? 'TBD'} vs ${match.participantB?.name ?? 'TBD'}`
    : `Match #${match.matchNumber ?? '—'}`;

const votingState = (match: Match): 'open' | 'closed' | 'disabled' => {
  const extra = match as Match & { votingStatus?: 'open' | 'closed' };
  if (!match.allowVoting) return 'disabled';
  return extra.votingStatus === 'closed' ? 'closed' : 'open';
};

const VotesManager: React.FC = () => {
  const { log } = useAuditLog();

  const votes = useCollectionGroup<VoteDoc>('votes');
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const teams = useCollection<Team>('teams');

  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const error = votes.error ?? matches.error ?? teams.error;
  const isLoading = votes.isLoading || matches.isLoading || teams.isLoading;

  const matchById = useMemo(() => new Map(matches.data.map((m) => [m.id, m])), [matches.data]);
  const teamName = useMemo(() => new Map(teams.data.map((t) => [t.id, t.name])), [teams.data]);

  const nameA = (match: Match) =>
    match.participantA?.name ?? teamName.get(match.teamAId) ?? 'Team A';
  const nameB = (match: Match) =>
    match.participantB?.name ?? teamName.get(match.teamBId) ?? 'Team B';

  /* ------------------------------------------ aggregate raw ballots */
  const splits = useMemo(() => {
    const map = new Map<string, Split>();
    votes.data.forEach((vote) => {
      if (!vote.matchId) return;
      let entry = map.get(vote.matchId);
      if (!entry) {
        entry = { total: 0, a: 0, b: 0, other: 0 };
        map.set(vote.matchId, entry);
      }
      entry.total += 1;

      const chosen = vote.selectedTeam || vote.teamId || '';
      const match = matchById.get(vote.matchId);
      const isA = Boolean(chosen) && (chosen === 'A' || chosen === 'teamA' || chosen === match?.teamAId || chosen === match?.participantA?.id);
      const isB = Boolean(chosen) && (chosen === 'B' || chosen === 'teamB' || chosen === match?.teamBId || chosen === match?.participantB?.id);
      if (isA) entry.a += 1;
      else if (isB) entry.b += 1;
      else entry.other += 1;
    });
    return map;
  }, [votes.data, matchById]);

  const rows = useMemo<MatchRow[]>(() => {
    const term = search.trim().toLowerCase();
    return matches.data
      .filter((match) => (term ? matchLabel(match).toLowerCase().includes(term) : true))
      .map<MatchRow>((match) => {
        const split = splits.get(match.id);
        return {
          match,
          total: split?.total ?? 0,
          a: split?.a ?? 0,
          b: split?.b ?? 0,
          other: split?.other ?? 0,
        };
      })
      .sort((left, right) => right.total - left.total);
  }, [matches.data, splits, search]);

  const stats = useMemo(() => {
    const totalVotes = votes.data.length;
    const withVotes = rows.filter((row) => row.total > 0).length;
    const enabled = matches.data.filter((match) => Boolean(match.allowVoting)).length;
    let leading = 0;
    let leadingLabel = '—';
    rows.forEach((row) => {
      if (row.total === 0) return;
      const share = (Math.max(row.a, row.b) / row.total) * 100;
      if (share > leading) {
        leading = share;
        leadingLabel = matchLabel(row.match);
      }
    });
    return { totalVotes, withVotes, enabled, leading, leadingLabel };
  }, [votes.data.length, rows, matches.data]);

  /* ------------------------------------------------------------- writes */
  const apply = async (
    match: Match,
    patch: MatchPatch,
    action: 'VOTING_ENABLED' | 'VOTING_DISABLED' | 'VOTING_CLOSED',
    message: string,
  ) => {
    setBusyId(match.id);
    try {
      await updateMatch(match.id, patch);
      await log(action, 'match', match.id, {
        label: matchLabel(match),
        metadata: { allowVoting: patch.allowVoting, votingStatus: patch.votingStatus },
      });
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const enable = (match: Match) =>
    apply(match, { allowVoting: true, votingStatus: 'open' }, 'VOTING_ENABLED', 'Voting enabled');
  const disable = (match: Match) =>
    apply(match, { allowVoting: false }, 'VOTING_DISABLED', 'Voting disabled');
  const close = (match: Match) =>
    apply(match, { allowVoting: false, votingStatus: 'closed' }, 'VOTING_CLOSED', 'Voting closed — the poll is final');

  return (
    <>
      <AdminHeader
        title="Votes"
        subtitle="Anonymous poll results aggregated per match. Counts only — individual ballots are never exposed."
        actions={<Btn to="/admin/matches">Manage matches</Btn>}
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total votes" value={stats.totalVotes} accent="blue" isLoading={isLoading} />
        <StatTile
          label="Matches with voting"
          value={stats.withVotes}
          accent="gold"
          isLoading={isLoading}
          hint="at least one ballot"
        />
        <StatTile
          label="Leading vote share"
          value={stats.leading ? `${stats.leading.toFixed(0)}%` : '—'}
          accent="green"
          isLoading={isLoading}
          hint={stats.leadingLabel}
        />
        <StatTile
          label="Voting enabled"
          value={stats.enabled}
          accent="slate"
          isLoading={isLoading}
          hint={`of ${matches.data.length} matches`}
        />
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search match…"
          className="w-full sm:w-72"
        />
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {matches.data.length} matches
        </span>
      </Toolbar>

      <Card
        title="Vote split by match"
        hint={votes.data.length === 0 ? 'No ballots recorded yet' : 'Live from the votes collection'}
        flush
      >
        {isLoading ? (
          <LoadingRows rows={7} cols={7} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={matches.data.length === 0 ? 'No matches in Firestore' : 'No matches match this search'}
            message={
              matches.data.length === 0
                ? 'Create a match first — every poll belongs to one.'
                : 'Clear the search box to see every match.'
            }
          />
        ) : (
          <TableShell minW={1120}>
            <THead>
              <tr>
                {[
                  'Match',
                  'Team A',
                  'Team B',
                  'Team A %',
                  'Team B %',
                  'Split',
                  'Total votes',
                  'Voting status',
                  'Actions',
                ].map((heading) => (
                  <Th key={heading}>{heading}</Th>
                ))}
              </tr>
            </THead>
            <TBody>
                {rows.map((row) => {
                  const { match, total, a, b, other } = row;
                  const pctA = total ? (a / total) * 100 : 0;
                  const pctB = total ? (b / total) * 100 : 0;
                  const pctOther = total ? (other / total) * 100 : 0;
                  const state = votingState(match);
                  const busy = busyId === match.id;
                  return (
                    <TRow key={match.id}>
                      <Td strong className="max-w-[240px]">
                        <span className="block truncate font-bold">{matchLabel(match)}</span>
                        <SubLine>
                          #{match.matchNumber ?? '—'} · {match.id.slice(0, 10)}
                        </SubLine>
                      </Td>
                      <Td className="max-w-[150px] truncate">{nameA(match)}</Td>
                      <Td className="max-w-[150px] truncate">{nameB(match)}</Td>
                      <Td numeric className="text-[#1264FF]">
                        {pctA.toFixed(0)}%
                      </Td>
                      <Td numeric className="text-[#FF4D3D]">
                        {pctB.toFixed(0)}%
                      </Td>
                      <Td>
                        <div className="w-44">
                          <div className="mb-1 flex items-center justify-between font-mono text-[10px] tabular-nums text-ink-muted">
                            <span>{a} to {nameA(match)}</span>
                            <span>{b} to {nameB(match)}</span>
                          </div>
                          <div className="flex h-3 w-full overflow-hidden rounded bg-surface-soft-2">
                            <div
                              className="h-full bg-[#1264FF] transition-[width] duration-300"
                              style={{ width: `${pctA}%` }}
                            />
                            <div
                              className="h-full bg-[#FF4D3D] transition-[width] duration-300"
                              style={{ width: `${pctB}%` }}
                            />
                            <div
                              className="h-full bg-line-strong transition-[width] duration-300"
                              style={{ width: `${pctOther}%` }}
                            />
                          </div>
                        </div>
                      </Td>
                      <Td numeric>{total}</Td>
                      <Td>
                        <StatusPill value={state} />
                      </Td>
                      <Td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Btn
                            size="xs"
                            variant="primary"
                            disabled={busy || state === 'open'}
                            onClick={() => enable(match)}
                          >
                            Enable voting
                          </Btn>
                          <Btn
                            size="xs"
                            variant="secondary"
                            disabled={busy || state === 'disabled'}
                            onClick={() => disable(match)}
                          >
                            Disable voting
                          </Btn>
                          <Btn
                            size="xs"
                            variant="warn"
                            disabled={busy || state !== 'open'}
                            onClick={() => close(match)}
                          >
                            Close voting
                          </Btn>
                        </div>
                      </Td>
                    </TRow>
                  );
                })}
            </TBody>
          </TableShell>
        )}
      </Card>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
        Closing a poll disables voting and marks the match <span className="font-mono">votingStatus: closed</span> —
        results stay visible, new ballots are refused. Only aggregated counts are shown on this screen.
      </p>
    </>
  );
};

export default VotesManager;
