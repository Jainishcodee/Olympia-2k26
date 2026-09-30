import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
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
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { FiArrowRight, FiPause, FiPlay, FiSquare, FiClock, FiRadio } from 'react-icons/fi';

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
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

const MatchCard: React.FC<{
  match: Match;
  sportLabel: string;
  tournamentLabel?: string;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  busy?: boolean;
}> = ({ match, sportLabel, tournamentLabel, onPause, onResume, onEnd, busy }) => {
  const { isDay } = useTheme();
  const score = match.score as unknown as Record<string, unknown> | undefined;
  const cricket = match.sportId === 'cricket';
  const scoreline = cricket
    ? `${score?.teamA ?? 0}/${score?.teamB ?? 0}`
    : `${score?.teamA ?? 0} – ${score?.teamB ?? 0}`;

  const live = match.liveState;
  const clock =
    cricket && live?.over !== undefined
      ? `${live.over}.${live.ball ?? 0} overs`
      : (live?.clock ?? 'LIVE');

  const a = match.participantA?.name || match.teamAId || 'Team A';
  const b = match.participantB?.name || match.teamBId || 'Team B';
  const isLive = match.status === 'live';

  return (
    <motion.article 
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300',
        isDay
          ? 'border-slate-200/80 bg-white/95 shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-[#D9A441]/80'
          : 'border-white/10 bg-[#071426]/90 shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:border-[#D9A441]/40'
      )}
    >
      {/* Top radiant light beam */}
      {isLive && (
        <span className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#1264FF] to-transparent shadow-[0_0_12px_#1264FF]" />
      )}

      <header className={cn(
        'flex items-center gap-2.5 border-b px-5 py-3.5',
        isDay ? 'border-slate-100 bg-slate-50/80' : 'border-white/10 bg-white/[0.02]'
      )}>
        <span className={cn('text-[11px] font-black uppercase tracking-[0.2em]', isDay ? 'text-[#A9761B]' : 'text-[#D9A441]')}>
          {sportLabel}
        </span>
        <span className={cn('h-3 w-px', isDay ? 'bg-slate-300' : 'bg-white/20')} />
        <span className={cn('truncate text-xs font-bold', isDay ? 'text-slate-600' : 'text-slate-400')}>
          {tournamentLabel ? `${tournamentLabel} · ` : ''}Match #{match.matchNumber ?? '—'}
        </span>
        <span className="ml-auto">
          <StatusPill value={match.status} />
        </span>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-6">
        <span className={cn('truncate text-right text-sm md:text-base font-extrabold', isDay ? 'text-slate-900' : 'text-white')}>{a}</span>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            'rounded-xl border px-4 py-2',
            isDay
              ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-[0_4px_16px_rgba(217,164,65,0.15)]'
              : 'border-[#D9A441]/40 bg-gradient-to-r from-[#0B1A30] to-[#071426] shadow-[0_0_20px_rgba(217,164,65,0.25)]'
          )}>
            <span className={cn('text-xl md:text-2xl font-black tabular-nums tracking-widest', isDay ? 'text-amber-900' : 'text-[#FFD21F]')}>
              {scoreline}
            </span>
          </div>
          <span className={cn('mt-2 font-mono text-[11px] font-bold tabular-nums flex items-center gap-1.5', isDay ? 'text-slate-600' : 'text-slate-400')}>
            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
            {clock}
          </span>
        </div>

        <span className={cn('truncate text-left text-sm md:text-base font-extrabold', isDay ? 'text-slate-900' : 'text-white')}>{b}</span>
      </div>

      <footer className={cn(
        'flex flex-wrap items-center gap-2.5 border-t px-5 py-3.5',
        isDay ? 'border-slate-100 bg-slate-50/50' : 'border-white/10 bg-white/[0.01]'
      )}>
        <Btn to={`/admin/matches/${match.id}/scoring`} variant="warn" size="xs" icon={<FiArrowRight className="h-3.5 w-3.5" />}>
          Scoring Console
        </Btn>
        <Btn to={`/admin/matches/${match.id}`} variant="ghost" size="xs">
          Details
        </Btn>
        
        <div className="ml-auto flex items-center gap-2">
          {match.status === 'live' && onPause && (
            <Btn onClick={onPause} disabled={busy} size="xs" icon={<FiPause className="h-3 w-3" />}>
              Pause
            </Btn>
          )}
          {match.status === 'paused' && onResume && (
            <Btn onClick={onResume} disabled={busy} size="xs" variant="primary" icon={<FiPlay className="h-3 w-3" />}>
              Resume
            </Btn>
          )}
          {(match.status === 'live' || match.status === 'paused') && onEnd && (
            <Btn onClick={onEnd} disabled={busy} size="xs" variant="danger" icon={<FiSquare className="h-3 w-3" />}>
              End Match
            </Btn>
          )}
        </div>
      </footer>
    </motion.article>
  );
};

const LiveControl: React.FC = () => {
  const { isDay } = useTheme();
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
      { value: '', label: 'All Arena Disciplines' },
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
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className={cn('text-xs font-black uppercase tracking-[0.24em] flex items-center gap-2', isDay ? 'text-[#A9761B]' : 'text-[#D9A441]')}>
          <FiRadio className="h-3.5 w-3.5" />
          {title}
        </h2>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums border',
          isDay ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-white/10 bg-[#0B1A30] text-white'
        )}>
          {rows.length}
        </span>
        <span className={cn('h-px flex-1', isDay ? 'bg-slate-200' : 'bg-white/10')} />
        <span className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>{hint}</span>
      </div>

      {rows.length === 0 ? (
        <div className={cn(
          'rounded-xl border border-dashed p-8 text-center backdrop-blur-md',
          isDay ? 'border-slate-200 bg-white/60' : 'border-white/10 bg-white/[0.02]'
        )}>
          <p className={cn('text-sm font-bold', isDay ? 'text-slate-700' : 'text-slate-300')}>{emptyTitle}</p>
          <p className={cn('mt-1 text-xs', isDay ? 'text-slate-500' : 'text-slate-400')}>{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <AdminHeader
        title="Live Arena Operations"
        subtitle="Broadcast operations console for live active fixtures. Real-time control and direct links to the scoring console."
        badge={<StatusPill value={`${live.length} live`} />}
        actions={
          <div className="flex items-center gap-3">
            <Btn to="/admin/matches" variant="secondary">
              Matches Archive
            </Btn>
            <Btn to="/admin/matches/create" variant="warn">
              + New Match
            </Btn>
          </div>
        }
      />

      <div className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 backdrop-blur-md',
        isDay ? 'border-slate-200/80 bg-white/90 shadow-sm' : 'border-white/10 bg-[#071426]/70'
      )}>
        <FilterSelect label="Discipline" value={sportFilter} onChange={setSportFilter} options={sportOptions} />
        <div className={cn('flex items-center gap-3 text-xs font-bold', isDay ? 'text-slate-600' : 'text-slate-400')}>
          <span className="text-red-500 font-extrabold">{live.length} LIVE</span> ·{' '}
          <span className={isDay ? 'text-amber-700' : 'text-amber-400'}>{paused.length} PAUSED</span> ·{' '}
          <span className={isDay ? 'text-blue-700' : 'text-blue-400'}>{upcoming.length} UPCOMING TODAY</span>
        </div>
      </div>

      {matches.error && <ErrorNotice message={matches.error} className="mb-5" />}

      {matches.isLoading ? (
        <Card flush>
          <LoadingRows rows={5} cols={5} />
        </Card>
      ) : (
        <>
          {renderSection(
            'Live Active Matches',
            live,
            'Live broadcast active',
            'No Arena Matches Live',
            'When a match begins, its live scoreboard, clock and telemetry appear here instantaneously.',
          )}
          {renderSection(
            'Paused Matches',
            paused,
            'Match clock suspended',
            'No Paused Matches',
            'Matches paused for halftime, timeouts, or rain delays will appear here.',
          )}
          {renderSection(
            'Upcoming Today',
            upcoming,
            'Scheduled on timeline',
            'No More Matches Scheduled Today',
            'Upcoming fixtures for subsequent days can be viewed in the Fixtures manager.',
          )}
        </>
      )}

      {!matches.isLoading && matches.data.length === 0 && !matches.error && (
        <EmptyNotice
          title="No Matches Found"
          message="Seed the Firestore database or create your first tournament fixture."
          action={<Btn to="/admin/matches/create" variant="primary">Create Match</Btn>}
        />
      )}
    </motion.div>
  );
};

export default LiveControl;
