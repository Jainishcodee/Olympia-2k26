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
  FilterSelect,
  LoadingRows,
  SearchInput,
  StatTile,
  SubLine,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toggle,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import type { Match, Reaction, ReactionType, Sport } from '@/types';
import toast from 'react-hot-toast';
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';

/* ============================================================================
 *  Reactions — analytics + per-match enable/disable.
 *  Read-only over the `reactions` collection; the only write is
 *  `matches/{id}.allowReactions`.
 * ==========================================================================*/

const REACTION_EMOJI: Record<ReactionType, string> = {
  fire: '🔥',
  clap: '👏',
  lightning: '⚡',
  heart: '❤️',
  wow: '😮',
  trophy: '🏆',
  muscle: '💪',
};

const REACTION_LABEL: Record<ReactionType, string> = {
  fire: 'Fire',
  clap: 'Applause',
  lightning: 'Lightning',
  heart: 'Love',
  wow: 'Wow',
  trophy: 'Trophy',
  muscle: 'Muscle',
};

/** Unknown types (legacy writes) still render, with a neutral glyph. */
const emojiFor = (type: string): string =>
  (REACTION_EMOJI as Record<string, string | undefined>)[type] ?? '👍';

const labelFor = (type: string): string =>
  (REACTION_LABEL as Record<string, string | undefined>)[type] ?? type;

interface MatchAggregate {
  total: number;
  users: Set<string>;
  counts: Map<string, number>;
}

interface MatchRow {
  match: Match;
  total: number;
  users: number;
  topType: string;
}

const matchLabel = (match: Match): string =>
  match.participantA?.name || match.participantB?.name
    ? `${match.participantA?.name ?? 'TBD'} vs ${match.participantB?.name ?? 'TBD'}`
    : `Match #${match.matchNumber ?? '—'}`;

const ReactionsManager: React.FC = () => {
  const { log } = useAuditLog();

  const reactions = useCollectionGroup<Reaction>('reactions');
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const sports = useCollection<Sport>('sports');

  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const error = reactions.error ?? matches.error ?? sports.error;

  const sportName = useMemo(() => new Map(sports.data.map((s) => [s.id, s.name])), [sports.data]);
  const matchById = useMemo(() => new Map(matches.data.map((m) => [m.id, m])), [matches.data]);

  /* ------------------------------------------------------------- by type */
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    reactions.data.forEach((r) => counts.set(r.type, (counts.get(r.type) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [reactions.data]);

  /* ---------------------------------------------------- by match (agg) */
  const perMatch = useMemo(() => {
    const map = new Map<string, MatchAggregate>();
    reactions.data.forEach((reaction) => {
      let agg = map.get(reaction.matchId);
      if (!agg) {
        agg = { total: 0, users: new Set<string>(), counts: new Map<string, number>() };
        map.set(reaction.matchId, agg);
      }
      agg.total += 1;
      if (reaction.userId) agg.users.add(reaction.userId);
      agg.counts.set(reaction.type, (agg.counts.get(reaction.type) ?? 0) + 1);
    });
    return map;
  }, [reactions.data]);

  /* ----------------------------------------------------- by sport (agg) */
  const perSport = useMemo(() => {
    const map = new Map<string, number>();
    reactions.data.forEach((reaction) => {
      const key = matchById.get(reaction.matchId)?.sportId ?? 'unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [reactions.data, matchById]);

  /* ---------------------------------------------------------- table rows */
  const rows = useMemo<MatchRow[]>(() => {
    const term = search.trim().toLowerCase();
    const list = matches.data
      .filter((match) => (sportFilter ? match.sportId === sportFilter : true))
      .map<MatchRow>((match) => {
        const agg = perMatch.get(match.id);
        let topType = '';
        let topCount = 0;
        agg?.counts.forEach((count, type) => {
          if (count > topCount) {
            topCount = count;
            topType = type;
          }
        });
        return { match, total: agg?.total ?? 0, users: agg?.users.size ?? 0, topType };
      })
      .filter((row) =>
        term
          ? `${matchLabel(row.match)} ${sportName.get(row.match.sportId) ?? ''}`
              .toLowerCase()
              .includes(term)
          : true,
      );

    list.sort((a, b) => (sortDesc ? b.total - a.total : a.total - b.total));
    return list;
  }, [matches.data, perMatch, sportFilter, search, sortDesc, sportName]);

  const total = reactions.data.length;
  const totalSpectators = useMemo(() => {
    const users = new Set<string>();
    reactions.data.forEach((r) => r.userId && users.add(r.userId));
    return users.size;
  }, [reactions.data]);

  const avgPerMatch = matches.data.length ? total / matches.data.length : 0;
  const busiest = typeCounts[0];
  const maxTypeCount = busiest?.[1] ?? 1;
  const maxSportCount = perSport[0]?.[1] ?? 1;
  const maxRowTotal = Math.max(1, ...rows.map((row) => row.total));

  /* ------------------------------------------------------------ the write */
  const toggleReactions = async (match: Match) => {
    const next = !Boolean(match.allowReactions);
    setBusyId(match.id);
    try {
      await updateMatch(match.id, { allowReactions: next });
      await log(next ? 'REACTIONS_ENABLED' : 'REACTIONS_DISABLED', 'match', match.id, {
        label: matchLabel(match),
        metadata: { allowReactions: next },
      });
      toast.success(next ? 'Reactions enabled for this match' : 'Reactions disabled for this match');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const isLoading = reactions.isLoading || matches.isLoading || sports.isLoading;

  const sportOptions = useMemo(
    () => [
      { value: '', label: 'All sports' },
      ...sports.data.map((s) => ({ value: s.id, label: s.name })),
    ],
    [sports.data],
  );

  return (
    <>
      <AdminHeader
        title="Reactions"
        subtitle="Live emoji reactions across every match — usage analytics and a per-match kill switch."
        actions={<Btn to="/admin/matches">Manage matches</Btn>}
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      {/* -------------------------------------------------------- stat row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total reactions"
          value={total}
          accent="blue"
          isLoading={isLoading}
          hint="Across every match"
        />
        <StatTile
          label="Reactions per match"
          value={avgPerMatch.toFixed(1)}
          accent="slate"
          isLoading={isLoading}
          hint={`over ${matches.data.length} matches`}
        />
        <StatTile
          label="Most used reaction"
          value={busiest ? `${emojiFor(busiest[0])} ${labelFor(busiest[0])}` : '—'}
          accent="gold"
          isLoading={isLoading}
          hint={busiest ? `${busiest[1]} reactions` : 'No reactions yet'}
        />
        <StatTile
          label="Matches with reactions"
          value={perMatch.size}
          accent="green"
          isLoading={isLoading}
          hint={`${totalSpectators} unique spectators`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* ------------------------------------------- most used reaction */}
        <Card
          title="Most used reaction"
          hint="Count by reaction type, newest collection snapshot"
        >
          {isLoading ? (
            <LoadingRows rows={5} cols={4} />
          ) : error ? (
            <ErrorNotice message={error} />
          ) : typeCounts.length === 0 ? (
            <EmptyNotice
              title="No reactions recorded yet"
              message="Reactions sent from the public match page will appear here in real time."
            />
          ) : (
            <ul className="space-y-2.5">
              {typeCounts.map(([type, count]) => (
                <li key={type} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center text-[15px] leading-none" aria-hidden>
                    {emojiFor(type)}
                  </span>
                  <span className="w-20 shrink-0 truncate text-[12px] font-semibold text-ink">
                    {labelFor(type)}
                  </span>
                  <span className="h-4 flex-1 overflow-hidden rounded bg-surface-soft-2">
                    <span
                      className="block h-full rounded bg-[#1264FF] transition-[width] duration-300"
                      style={{ width: `${Math.round((count / maxTypeCount) * 100)}%` }}
                    />
                  </span>
                  <span className="w-24 shrink-0 text-right font-mono text-[12.5px] font-bold tabular-nums text-ink">
                    {count} · {Math.round((count / Math.max(1, total)) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------------------------------------------- reactions/sport */}
        <Card title="Reactions per sport" hint="Grouped through the match's sport">
          {isLoading ? (
            <LoadingRows rows={5} cols={4} />
          ) : error ? (
            <ErrorNotice message={error} />
          ) : perSport.length === 0 ? (
            <EmptyNotice title="Nothing grouped yet" message="No reactions have been recorded." />
          ) : (
            <TableShell minW={0}>
              <THead>
                <tr>
                  {['Sport', 'Reactions', 'Share'].map((heading) => (
                    <Th key={heading}>{heading}</Th>
                  ))}
                </tr>
              </THead>
              <TBody>
                {perSport.map(([sportId, count]) => (
                  <TRow key={sportId}>
                    <Td className="max-w-[180px] truncate font-semibold text-ink">
                      {sportName.get(sportId) ?? 'Unassigned'}
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-32 overflow-hidden rounded bg-surface-soft-2">
                          <span
                            className="block h-full rounded bg-[#1264FF]"
                            style={{ width: `${Math.round((count / maxSportCount) * 100)}%` }}
                          />
                        </span>
                        <span className="font-mono text-[12.5px] font-bold tabular-nums text-ink">{count}</span>
                      </span>
                    </Td>
                    <Td numeric>{Math.round((count / Math.max(1, total)) * 100)}%</Td>
                  </TRow>
                ))}
              </TBody>
            </TableShell>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------ per-match table */}
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search match…"
          className="w-full sm:w-72"
        />
        <FilterSelect value={sportFilter} onChange={setSportFilter} options={sportOptions} />
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {matches.data.length} matches
        </span>
      </Toolbar>

      <Card title="Reactions per match" hint="Sort by total; switch reactions off per match" flush>
        {isLoading ? (
          <LoadingRows rows={7} cols={6} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={matches.data.length === 0 ? 'No matches in Firestore' : 'No matches match these filters'}
            message={
              matches.data.length === 0
                ? 'Create a match first — reactions are always attached to one.'
                : 'Clear the search box or the sport filter above.'
            }
          />
        ) : (
          <TableShell minW={1020}>
            <THead>
              <tr>
                <Th>Match</Th>
                <Th>Sport</Th>
                <Th>
                  <button
                    type="button"
                    onClick={() => setSortDesc((prev) => !prev)}
                    className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-[#1264FF]"
                    title="Sort by total"
                  >
                    Total
                    {sortDesc ? <FiArrowDown className="h-3 w-3" /> : <FiArrowUp className="h-3 w-3" />}
                  </button>
                </Th>
                {['Top reaction', 'Spectators', 'Share', 'Reactions enabled'].map((heading) => (
                  <Th key={heading}>{heading}</Th>
                ))}
              </tr>
            </THead>
            <TBody>
                {rows.map(({ match, total: matchTotal, users, topType }) => {
                  const share = total > 0 ? Math.round((matchTotal / total) * 100) : 0;
                  return (
                    <TRow key={match.id}>
                      <Td strong className="max-w-[260px]">
                        <span className="block truncate font-bold">{matchLabel(match)}</span>
                        <SubLine>
                          #{match.matchNumber ?? '—'} · {match.id.slice(0, 10)}
                        </SubLine>
                      </Td>
                      <Td className="whitespace-nowrap font-semibold text-ink">
                        {sportName.get(match.sportId) ?? '—'}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-24 overflow-hidden rounded bg-surface-soft-2">
                            <span
                              className="block h-full rounded bg-[#1264FF]"
                              style={{ width: `${Math.round((matchTotal / maxRowTotal) * 100)}%` }}
                            />
                          </span>
                          <span className="font-mono text-[12.5px] font-bold tabular-nums text-ink">
                            {matchTotal}
                          </span>
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {topType ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span aria-hidden>{emojiFor(topType)}</span>
                            {labelFor(topType)}
                          </span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </Td>
                      <Td numeric>{users}</Td>
                      <Td numeric>{share}%</Td>
                      <Td className="w-44">
                        <Toggle
                          checked={Boolean(match.allowReactions)}
                          onChange={() => toggleReactions(match)}
                          label={match.allowReactions ? 'Enabled' : 'Disabled'}
                          disabled={busyId === match.id}
                        />
                      </Td>
                    </TRow>
                  );
                })}
            </TBody>
          </TableShell>
        )}
      </Card>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
        “Spectators” counts unique anonymous spectators who sent at least one reaction — no public
        viewer count is stored, so share is measured against all {total} reactions.
      </p>
    </>
  );
};

export default ReactionsManager;
