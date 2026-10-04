import React, { useMemo, useState } from 'react';
import { useCollection, useCollectionGroup } from '@/hooks/useCollection';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  SearchInput,
  StatTile,
  SubLine,
  TBody,
  Td,
  THead,
  Th,
  TableShell,
  Toolbar,
  TRow,
} from '@/components/admin/kit';
import type { Match, Player, Rating, Sport } from '@/types';

/* ============================================================================
 *  Ratings — a read-only leaderboard of rated players.
 *
 *  Ratings are user-submitted and are deliberately NOT editable here. The only
 *  moderation surface for public feedback is /admin/reviews.
 * ==========================================================================*/

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

const matchLabel = (match?: Match): string =>
  !match
    ? '—'
    : match.participantA?.name || match.participantB?.name
      ? `${match.participantA?.name ?? 'TBD'} vs ${match.participantB?.name ?? 'TBD'}`
      : `Match #${match.matchNumber ?? '—'}`;

const Stars: React.FC<{ value: number }> = ({ value }) => {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`text-[13px] leading-none ${step <= filled ? 'text-[#D9A441]' : 'text-ink-faint'}`}
          >
            {step <= filled ? '★' : '☆'}
          </span>
        ))}
      </span>
      <span className="font-mono text-[12px] font-bold tabular-nums">
        {value.toFixed(1)}
      </span>
    </span>
  );
};

/** 1–5 histogram as one thin stacked bar. */
const Distribution: React.FC<{ dist: number[]; count: number }> = ({ dist, count }) => {
  const tones = ['bg-red-400', 'bg-amber-300', 'bg-[#D9A441]', 'bg-sky-400', 'bg-[#1264FF]'];
  if (!count) return <span className="text-[12px] text-ink-faint">—</span>;
  return (
    <span className="flex h-2 w-32 overflow-hidden rounded-full bg-surface-soft-2" title="1★ → 5★">
      {dist.map((value, index) => (
        <span
          key={index}
          className={tones[index]}
          style={{ width: `${(value / count) * 100}%` }}
          aria-hidden
        />
      ))}
    </span>
  );
};

interface PlayerRow {
  playerId: string;
  count: number;
  total: number;
  average: number;
  dist: number[];
  matchIds: Set<string>;
  latestMatchId: string;
  latestAt: number;
}

const RatingsManager: React.FC = () => {
  const ratings = useCollectionGroup<Rating>('ratings', { sortBy: 'createdAt', direction: 'desc' });
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const players = useCollection<Player>('players', { sortBy: 'name' });
  const sports = useCollection<Sport>('sports');

  const [search, setSearch] = useState('');

  const error = ratings.error ?? matches.error ?? players.error ?? sports.error;
  const isLoading = ratings.isLoading || matches.isLoading || players.isLoading || sports.isLoading;

  const playerById = useMemo(() => new Map(players.data.map((p) => [p.id, p])), [players.data]);
  const matchById = useMemo(() => new Map(matches.data.map((m) => [m.id, m])), [matches.data]);
  const sportName = useMemo(() => new Map(sports.data.map((s) => [s.id, s.name])), [sports.data]);

  /* --------------------------------------------- leaderboard aggregation */
  const rows = useMemo<PlayerRow[]>(() => {
    const grouped = new Map<string, PlayerRow>();

    ratings.data.forEach((rating) => {
      const score = Number(rating.score ?? (rating as any).rating);
      if (!Number.isFinite(score)) return;

      let row = grouped.get(rating.playerId);
      if (!row) {
        row = {
          playerId: rating.playerId,
          count: 0,
          total: 0,
          average: 0,
          dist: [0, 0, 0, 0, 0],
          matchIds: new Set<string>(),
          latestMatchId: rating.matchId,
          latestAt: toDate(rating.createdAt)?.getTime() ?? toDate(rating.updatedAt)?.getTime() ?? 0,
        };
        grouped.set(rating.playerId, row);
      }

      row.count += 1;
      row.total += score;
      row.average = row.total / row.count;
      const bucket = Math.min(5, Math.max(1, Math.round(score))) - 1;
      row.dist[bucket] += 1;
      row.matchIds.add(rating.matchId);

      const at = toDate(rating.createdAt)?.getTime() ?? toDate(rating.updatedAt)?.getTime() ?? 0;
      if (at >= row.latestAt) {
        row.latestAt = at;
        row.latestMatchId = rating.matchId;
      }
    });

    const term = search.trim().toLowerCase();
    const list = [...grouped.values()].filter((row) => {
      if (!term) return true;
      const player = playerById.get(row.playerId);
      return `${player?.name ?? ''} ${row.playerId}`.toLowerCase().includes(term);
    });

    list.sort((a, b) => b.average - a.average || b.count - a.count);
    return list;
  }, [ratings.data, playerById, search]);

  const totalRatings = ratings.data.length;
  const overallAverage = totalRatings
    ? ratings.data.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / totalRatings
    : 0;
  const matchesRated = useMemo(() => {
    const ids = new Set<string>();
    ratings.data.forEach((r) => ids.add(r.matchId));
    return ids.size;
  }, [ratings.data]);
  const topPlayer = rows[0];

  const sportOf = (row: PlayerRow): string => {
    const player = playerById.get(row.playerId);
    if (player?.sportId) return sportName.get(player.sportId) ?? '—';
    const match = matchById.get(row.latestMatchId);
    return match ? sportName.get(match.sportId) ?? '—' : '—';
  };

  return (
    <>
      <AdminHeader
        title="Ratings"
        subtitle="Player ratings submitted by spectators, grouped as a leaderboard of the rated players."
        actions={<Btn to="/admin/reviews">Moderate reviews</Btn>}
      />

      {error && <ErrorNotice message={error} className="mb-4" />}

      {/* -------------------------------------------------------- stat row */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total ratings" value={totalRatings} accent="blue" isLoading={isLoading} />
        <StatTile
          label="Average score"
          value={overallAverage ? overallAverage.toFixed(2) : '—'}
          accent="gold"
          isLoading={isLoading}
          hint="out of 5"
        />
        <StatTile
          label="Highest rated player"
          value={
            <span className="block break-all text-[15px] font-bold leading-tight tracking-normal">
              {topPlayer ? playerById.get(topPlayer.playerId)?.name ?? topPlayer.playerId : '—'}
            </span>
          }
          accent="green"
          isLoading={isLoading}
          hint={topPlayer ? `${topPlayer.average.toFixed(2)} avg · ${topPlayer.count} ratings` : 'No ratings yet'}
        />
        <StatTile label="Matches rated" value={matchesRated} accent="slate" isLoading={isLoading} />
      </div>

      {/* ------------------------------------------------ read-only notice */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink">Ratings are user-submitted and read-only.</p>
          <p className="mt-0.5 max-w-3xl text-[12px] leading-relaxed text-ink-muted">
            Nothing on this screen edits a public score. Abusive or spam feedback can only be moderated
            through the Reviews screen, where written reviews are hidden or deleted.
          </p>
        </div>
        <Btn to="/admin/reviews" variant="primary">
          Open reviews
        </Btn>
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search player…"
          className="w-full sm:w-72"
        />
        <span className="ml-auto text-[12px] font-bold tabular-nums text-ink-muted">
          {rows.length} of {playerById.size} players
        </span>
      </Toolbar>

      <Card title="Rated players" hint="Sorted by average rating, then by volume" flush>
        {isLoading ? (
          <LoadingRows rows={7} cols={6} />
        ) : error ? (
          <div className="p-4">
            <ErrorNotice message={error} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyNotice
            title={totalRatings === 0 ? 'No ratings recorded yet' : 'No players match this search'}
            message={
              totalRatings === 0
                ? 'Spectators rate players from the public match page; ratings stream here live.'
                : 'Clear the search box to see the full leaderboard.'
            }
          />
        ) : (
          <TableShell minW={940}>
            <THead>
              <tr>
                {['Player', 'Match', 'Sport', 'Average rating', 'Ratings', 'Distribution'].map((heading) => (
                  <Th key={heading}>{heading}</Th>
                ))}
              </tr>
            </THead>
            <TBody>
              {rows.map((row) => {
                const player = playerById.get(row.playerId);
                const latestMatch = matchById.get(row.latestMatchId);
                return (
                  <TRow key={row.playerId}>
                    <Td strong className="max-w-[220px]">
                      <span className="block truncate font-bold">{player?.name ?? row.playerId}</span>
                      <SubLine>
                        {player?.jerseyNumber ? `#${player.jerseyNumber} · ` : ''}
                        {row.playerId.slice(0, 12)}
                      </SubLine>
                    </Td>
                    <Td className="max-w-[240px]">
                      <span className="block truncate text-[13px] text-ink">{matchLabel(latestMatch)}</span>
                      {row.matchIds.size > 1 && (
                        <span className="block text-[11px] text-ink-faint">
                          {row.matchIds.size} matches rated
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap font-semibold text-ink">{sportOf(row)}</Td>
                    <Td className="whitespace-nowrap">
                      <Stars value={row.average} />
                    </Td>
                    <Td numeric>{row.count}</Td>
                    <Td className="whitespace-nowrap">
                      <Distribution dist={row.dist} count={row.count} />
                      <span className="mt-1 block font-mono text-[10px] tabular-nums text-ink-faint">
                        {row.dist
                          .map((value, index) => `${index + 1}★${value}`)
                          .join('  ')}
                      </span>
                    </Td>
                  </TRow>
                );
              })}
            </TBody>
          </TableShell>
        )}
      </Card>
    </>
  );
};

export default RatingsManager;
