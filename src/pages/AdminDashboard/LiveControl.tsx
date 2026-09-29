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
  StatusPill,
} from '@/components/admin/kit';
import { useAuditLog } from '@/hooks/useAuditLog';
import { pauseMatch, resumeMatch, endMatch } from '@/services/matches/matchService';
import type { Match, MatchStatus, Tournament } from '@/types';
import toast from 'react-hot-toast';
import { FiArrowRight, FiPause, FiPlay, FiSquare } from 'react-icons/fi';

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

const MatchCard: React.FC<{
  match: Match;
  sportLabel: string;
  tournamentLabel?: string;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  busy?: boolean;
}> = ({ match, sportLabel, tournamentLabel, onPause, onResume, onEnd, busy }) => {
  const score = match.score as unknown as Record<string, unknown> | undefined;
  const cricket = match.sportId === 'cricket';
  const scoreline = cricket
    ? `${score?.teamA ?? 0}/${score?.teamB ?? 0}`
    : `${score?.teamA ?? 0} – ${score?.teamB ?? 0}`;

  const live = match.liveState;
  const clock =
    cricket && live?.over !== undefined
      ? `${live.over}.${live.ball ?? 0} overs`
      : (live?.clock ?? '—');

  const a = match.participantA?.name || match.teamAId || 'Team A';
  const b = match.participantB?.name || match.teamBId || 'Team B';

  return (
    <article className="rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
          {sportLabel}
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="truncate text-[11px] font-semibold text-slate-400">
          {tournamentLabel ? `${tournamentLabel} · ` : ''}Match #{match.matchNumber ?? '—'}
        </span>
        <span className="ml-auto">
          <StatusPill value={match.status} />
        </span>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
        <span className="truncate text-right text-[14px] font-bold text-slate-800">{a}</span>
        <span className="flex flex-col items-center">
          <span className="rounded-md bg-slate-900 px-3 py-1.5 text-[20px] font-black tabular-nums leading-none text-white">
            {scoreline}
          </span>
          <span className="mt-1.5 font-mono text-[11px] font-semibold tabular-nums text-slate-500">
            {clock}
          </span>
        </span>
        <span className="truncate text-[14px] font-bold text-slate-800">{b}</span>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
        <Btn to={`/admin/matches/${match.id}/scoring`} variant="primary" icon={<FiArrowRight className="h-4 w-4" />}>
          Open scoring
        </Btn>
        <Btn to={`/admin/matches/${match.id}`} variant="ghost">
          Detail
        </Btn>
        <span className="ml-auto flex gap-2">
          {match.status === 'live' && onPause && (
            <Btn onClick={onPause} disabled={busy} icon={<FiPause className="h-3.5 w-3.5" />}>
              Pause
            </Btn>
          )}
          {match.status === 'paused' && onResume && (
            <Btn onClick={onResume} disabled={busy} variant="warn" icon={<FiPlay className="h-3.5 w-3.5" />}>
              Resume
            </Btn>
          )}
          {(match.status === 'live' || match.status === 'paused') && onEnd && (
            <Btn onClick={onEnd} disabled={busy} variant="danger" icon={<FiSquare className="h-3.5 w-3.5" />}>
              End
            </Btn>
          )}
        </span>
      </footer>
    </article>
  );
};

const LiveControl: React.FC = () => {
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const tournaments = useCollection<Tournament>('tournaments');
  const sports = useCollection<{ id: string; name: string; icon?: string }>('sports');
  const { log } = useAuditLog();

  const [sportFilter, setSportFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const sportName = useMemo(() => {
    const map = new Map(sports.data.map((s) => [s.id, s]));
    return (id?: string) => (id ? map.get(id)?.name ?? id : 'Sport');
  }, [sports.data]);

  const tournamentName = useMemo(() => {
    const map = new Map(tournaments.data.map((t) => [t.id, t.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [tournaments.data]);

  const filtered = useMemo(
    () => (sportFilter ? matches.data.filter((m) => m.sportId === sportFilter) : matches.data),
    [matches.data, sportFilter],
  );

  const live = useMemo(() => filtered.filter((m) => m.status === 'live'), [filtered]);
  const paused = useMemo(() => filtered.filter((m) => m.status === 'paused'), [filtered]);
  const upcoming = useMemo(
    () => filtered.filter((m) => (m.status === 'upcoming' || m.status === 'scheduled') && isToday(m.scheduledAt)),
    [filtered],
  );

  const run = async (
    match: Match,
    action: 'pause' | 'resume' | 'end',
    fn: () => Promise<void>,
    auditAction: Parameters<typeof log>[0],
  ) => {
    setBusyId(match.id);
    try {
      await fn();
      await log(auditAction, 'match', match.id, {
        label: `${sportName(match.sportId)} · Match #${match.matchNumber}`,
      });
      toast.success(`${match.participantA?.name ?? 'Match'} — ${action} recorded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const sportOptions = useMemo(
    () => [
      { value: '', label: 'All sports' },
      ...sports.data.map((s) => ({ value: s.id, label: s.name })),
    ],
    [sports.data],
  );

  const renderSection = (
    title: string,
    rows: Match[],
    hint: string,
    emptyTitle: string,
    emptyMessage: string,
  ) => (
    <section className="mb-6">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h2>
        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
          {rows.length}
        </span>
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] text-slate-400">{hint}</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center">
          <p className="text-[13px] font-semibold text-slate-600">{emptyTitle}</p>
          <p className="mt-0.5 text-[12px] text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              sportLabel={sportName(match.sportId)}
              tournamentLabel={tournamentName(match.tournamentId)}
              busy={busyId === match.id}
              onPause={() =>
                run(match, 'pause', () => pauseMatch(match.id), 'MATCH_PAUSED')
              }
              onResume={() =>
                run(match, 'resume', () => resumeMatch(match.id), 'MATCH_RESUMED')
              }
              onEnd={() =>
                run(match, 'end', () => endMatch(match.id), 'MATCH_ENDED')
              }
            />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <>
      <AdminHeader
        title="Live Control Room"
        subtitle="Every match currently under way. Each card opens its scoring console."
        badge={<StatusPill value={`${live.length} live`} />}
        actions={
          <>
            <Btn to="/admin/matches" variant="secondary">
              All matches
            </Btn>
            <Btn to="/admin/matches/create" variant="primary">
              Create match
            </Btn>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <FilterSelect label="Sport" value={sportFilter} onChange={setSportFilter} options={sportOptions} />
        <span className="text-[12px] text-slate-400">
          {live.length} live · {paused.length} paused · {upcoming.length} upcoming today
        </span>
      </div>

      {matches.error && <ErrorNotice message={matches.error} className="mb-5" />}

      {matches.isLoading ? (
        <Card flush>
          <LoadingRows rows={5} cols={5} />
        </Card>
      ) : (
        <>
          {renderSection(
            'Live matches',
            live,
            'operating now',
            'No matches are live',
            'Start a match from the Matches screen — the status flips to LIVE and it appears here instantly.',
          )}
          {renderSection(
            'Paused',
            paused,
            'on hold',
            'Nothing paused',
            'Paused matches will be listed here.',
          )}
          {renderSection(
            'Upcoming today',
            upcoming,
            'scheduled',
            'No more matches today',
            'Tomorrow’s fixtures are on the Fixtures screen.',
          )}
        </>
      )}

      {!matches.isLoading && matches.data.length === 0 && !matches.error && (
        <EmptyNotice
          title="No matches in Firestore"
          message="Run npm run seed to populate the collections, or create a match to get started."
          action={<Btn to="/admin/matches/create" variant="primary">Create match</Btn>}
        />
      )}
    </>
  );
};

export default LiveControl;
