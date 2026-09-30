import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
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
import { FiArrowRight, FiClock, FiActivity, FiUsers, FiAward, FiRadio, FiShield, FiTrendingUp } from 'react-icons/fi';
import { HiOutlineVideoCamera } from 'react-icons/hi';

/** Accepts a Firestore Timestamp, a Date, an ISO string or nothing. */
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
  if (!score) return '0 – 0';
  const a = score.teamA;
  const b = score.teamB;
  if (a === undefined && b === undefined) return '0 – 0';
  return `${a ?? 0} – ${b ?? 0}`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const AdminDashboard: React.FC = () => {
  const { isDay } = useTheme();
  const matches = useCollection<Match>('matches', { sortBy: 'scheduledAt', direction: 'desc' });
  const teams = useCollection<Team>('teams', { sortBy: 'name' });
  const players = useCollection<{ id: string }>('players');
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
    fixtures.isLoading;

  const firstError =
    matches.error ?? teams.error ?? players.error ?? fixtures.error ?? null;

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

  const error = firstError;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <AdminHeader
        title="Arena Command Center"
        subtitle="Real-time live telemetry, telemetry aggregates, and operational controls for OLYMPIA 2K26."
        actions={
          <div className="flex items-center gap-3">
            <Btn to="/admin/live" variant="primary" icon={<HiOutlineVideoCamera className="h-4 w-4 animate-pulse" />}>
              Live Control Room
            </Btn>
            <Btn to="/admin/matches/create" variant="warn">
              + New Match
            </Btn>
          </div>
        }
      />

      {error && <ErrorNotice message={error} className="mb-5" />}

      {/* ------------------------------------------------ Active Arena Stats Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="Live Now"
            value={liveMatches.length}
            accent="red"
            icon={<FiRadio className="text-red-400 animate-pulse" />}
            hint="Active arena matches broadcasting"
            isLoading={isLoading}
            to="/admin/live"
          />
          <StatTile
            label="Upcoming Today"
            value={upcomingToday.length}
            accent="blue"
            icon={<FiClock className="text-blue-400" />}
            hint="Scheduled on local timeline"
            isLoading={isLoading}
            to="/admin/matches"
          />
          <StatTile
            label="Completed Today"
            value={completedToday.length}
            accent="green"
            icon={<FiTrendingUp className="text-emerald-400" />}
            hint="Archived results confirmed"
            isLoading={isLoading}
            to="/admin/matches"
          />
        </div>
      </motion.div>

      {/* ------------------------------------------------ Competition Totals */}
      <motion.div variants={itemVariants}>
        <Card title="Competition Telemetry" hint="Core database aggregates" glow="gold">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile 
              label="Total Matches" 
              value={matches.data.length} 
              accent="blue" 
              icon={<FiActivity />} 
              isLoading={isLoading} 
              to="/admin/matches" 
            />
            <StatTile 
              label="Active Teams" 
              value={teams.data.length} 
              accent="gold" 
              icon={<FiShield />} 
              isLoading={isLoading} 
              to="/admin/teams" 
            />
            <StatTile 
              label="Rostered Players" 
              value={players.data.length} 
              accent="gold" 
              icon={<FiUsers />} 
              isLoading={isLoading} 
              to="/admin/players" 
            />
            <StatTile
              label="Active Fixtures"
              value={fixtures.data.length}
              accent="slate"
              icon={<FiAward />}
              isLoading={isLoading}
              to="/admin/fixtures"
            />
          </div>
        </Card>
      </motion.div>

      {/* ------------------------------------------------ Public Interaction telemetry */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="Ballots & Votes"
            value={votes.data.length}
            accent="blue"
            isLoading={votes.isLoading}
            hint="Real-time fan predictions"
            to="/admin/votes"
          />
          <StatTile
            label="Fan Reviews"
            value={reviews.data.length}
            accent="gold"
            isLoading={reviews.isLoading}
            hint="Moderated match opinions"
            to="/admin/reviews"
          />
          <StatTile
            label="Live Reactions"
            value={reactions.data.length}
            accent="green"
            isLoading={reactions.isLoading}
            hint="Crowd excitement pulses"
            to="/admin/reactions"
          />
        </div>
      </motion.div>

      {/* ------------------------------------------ Live Match Overview + Recent Events */}
      <motion.div variants={itemVariants} className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Live Arena Stream"
          hint="Click through to the high-performance scoring console"
          glow="blue"
          actions={
            <Btn to="/admin/live" size="xs" variant="primary" icon={<FiArrowRight className="h-3 w-3" />}>
              Open All
            </Btn>
          }
          flush
        >
          {matches.isLoading ? (
            <LoadingRows rows={4} cols={4} />
          ) : matches.error ? (
            <div className="p-5"><ErrorNotice message={matches.error} /></div>
          ) : liveMatches.length === 0 ? (
            <EmptyNotice
              title="No Arena Matches Live"
              message="Start a match from the Live Control Room to activate broadcast telemetry."
              action={<Btn to="/admin/live" variant="primary">Launch Control Room</Btn>}
            />
          ) : (
            <ul className={cn('divide-y', isDay ? 'divide-slate-200/80' : 'divide-white/10')}>
              {liveMatches.map((match) => {
                 const sport = match.sportId;
                 const a = match.participantA?.name ?? teamName(match.teamAId);
                 const b = match.participantB?.name ?? teamName(match.teamBId);
                 return (
                   <motion.li 
                     key={match.id}
                     whileHover={{ backgroundColor: isDay ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)' }}
                     className="p-5 transition-colors"
                   >
                     <div className="flex items-center justify-between gap-3">
                       <div className="flex items-center gap-2.5">
                         <span className={cn(
                           'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                           isDay
                             ? 'border border-blue-500/30 bg-blue-50 text-blue-700'
                             : 'border border-blue-400/30 bg-[#1264FF]/20 text-blue-300'
                         )}>
                           {sport}
                         </span>
                         <StatusPill value="live" />
                       </div>
                       <span className={cn('font-mono text-xs font-bold tabular-nums flex items-center gap-1.5', isDay ? 'text-[#A9761B]' : 'text-[#D9A441]')}>
                         <FiClock className="h-3.5 w-3.5" />
                         {formatTime(match.scheduledAt)}
                       </span>
                     </div>

                     <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                       <span className={cn('truncate text-right text-sm font-extrabold', isDay ? 'text-slate-900' : 'text-white')}>{a}</span>
                       <div className={cn(
                         'relative rounded-lg px-4 py-1.5',
                         isDay
                           ? 'border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50/80 shadow-[0_4px_16px_rgba(217,164,65,0.15)]'
                           : 'border border-[#D9A441]/40 bg-gradient-to-r from-[#0B1A30] to-[#071426] shadow-[0_0_20px_rgba(217,164,65,0.2)]'
                       )}>
                         <span className={cn('text-lg font-black tabular-nums tracking-wider', isDay ? 'text-amber-900' : 'text-[#FFD21F]')}>
                           {renderScore(match)}
                         </span>
                       </div>
                       <span className={cn('truncate text-left text-sm font-extrabold', isDay ? 'text-slate-900' : 'text-white')}>{b}</span>
                     </div>

                     <div className="flex justify-end">
                       <Btn to={`/admin/matches/${match.id}/scoring`} variant="warn" size="xs">
                         Open Scoring Console →
                       </Btn>
                     </div>
                   </motion.li>
                 );
               })}
             </ul>
           )}
         </Card>

         {/* --------------------------------------------- Recent Events Timeline */}
         <Card
           title="Telemetry Event Stream"
           hint="Live broadcast actions stream"
           actions={<span className={cn('text-[10px] font-bold uppercase tracking-wider', isDay ? 'text-slate-500' : 'text-slate-400')}>Live Pulse</span>}
           flush
         >
           {events.isLoading ? (
             <LoadingRows rows={5} cols={3} />
           ) : events.error ? (
             <div className="p-5"><ErrorNotice message={events.error} /></div>
           ) : events.data.length === 0 ? (
             <EmptyNotice
               title="No Events Logged Yet"
               message="Scores, goals, wickets and cards recorded in the console will appear here in real time."
             />
           ) : (
             <ul className={cn('divide-y', isDay ? 'divide-slate-200/60' : 'divide-white/5')}>
               {events.data.slice(0, 8).map((event) => (
                 <motion.li 
                   key={event.id}
                   whileHover={{ backgroundColor: isDay ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)' }}
                   className="flex items-start gap-3.5 px-5 py-3.5 transition-colors"
                 >
                   <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', isDay ? 'bg-[#A9761B]' : 'bg-[#D9A441] shadow-[0_0_8px_#D9A441]')} />
                   <div className="min-w-0 flex-1">
                     <span className={cn('block truncate text-xs font-black uppercase tracking-wider', isDay ? 'text-slate-900' : 'text-white')}>
                       {String(event.type ?? 'EVENT').replace(/_/g, ' ')}
                       {event.teamId ? <span className={cn('font-normal', isDay ? 'text-slate-500' : 'text-slate-400')}> · {teamName(event.teamId)}</span> : ''}
                     </span>
                     <span className={cn('block truncate text-[11px] mt-0.5', isDay ? 'text-slate-500' : 'text-slate-400')}>
                       {event.undone ? <span className="text-red-500 font-bold">UNDONE · </span> : ''}
                       {event.data ? Object.entries(event.data).map(([k, v]) => `${k}: ${String(v)}`).join(' · ') : 'Event registered'}
                     </span>
                   </div>
                   <span className={cn('shrink-0 font-mono text-[11px] font-bold tabular-nums', isDay ? 'text-slate-500' : 'text-slate-400')}>
                     {(() => {
                       const date = toDate(event.timestamp);
                       return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                     })()}
                   </span>
                 </motion.li>
               ))}
             </ul>
           )}
         </Card>
       </motion.div>

       {/* ---------------------------------------- Fixtures + Audit Activity */}
       <motion.div variants={itemVariants} className="grid gap-6 xl:grid-cols-2">
         <Card
           title="Upcoming Arena Fixtures"
           actions={<Btn to="/admin/fixtures" size="xs">Manage Calendar</Btn>}
           flush
         >
           {fixtures.isLoading ? (
             <LoadingRows rows={4} cols={3} />
           ) : fixtures.error ? (
             <div className="p-5"><ErrorNotice message={fixtures.error} /></div>
           ) : upcomingFixtures.length === 0 ? (
             <EmptyNotice
               title="No Fixtures Scheduled"
               message="Build your tournament brackets and schedule upcoming arena clashes."
               action={<Btn to="/admin/fixtures/create" variant="primary">Create Fixture</Btn>}
             />
           ) : (
             <ul className={cn('divide-y', isDay ? 'divide-slate-200/60' : 'divide-white/5')}>
               {upcomingFixtures.map((fixture) => (
                 <li key={fixture.id} className={cn('flex items-center gap-4 px-5 py-3.5 transition-colors', isDay ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')}>
                   <div className={cn(
                     'flex w-16 shrink-0 flex-col items-center rounded-lg py-1.5 shadow-inner',
                     isDay ? 'border border-amber-200 bg-amber-50/80' : 'border border-white/10 bg-[#0B1A30]/80'
                   )}>
                     <span className={cn('text-[10px] font-black uppercase tracking-wider', isDay ? 'text-[#A9761B]' : 'text-[#D9A441]')}>
                       {formatDay(fixture.scheduledAt)}
                     </span>
                     <span className={cn('font-mono text-xs font-bold tabular-nums', isDay ? 'text-slate-900' : 'text-white')}>
                       {formatTime(fixture.scheduledAt)}
                     </span>
                   </div>
                   <div className="min-w-0 flex-1">
                     <span className={cn('block truncate text-xs font-extrabold', isDay ? 'text-slate-900' : 'text-white')}>
                       {teamName(fixture.teamAId)} <span className={isDay ? 'text-[#A9761B] font-black' : 'text-[#D9A441] font-black'}>VS</span> {teamName(fixture.teamBId)}
                     </span>
                     <span className={cn('block text-[11px] mt-0.5', isDay ? 'text-slate-500' : 'text-slate-400')}>
                       {fixture.round ?? 'Round Match'} · {fixture.venueId ?? 'Arena Main'}
                     </span>
                   </div>
                   <StatusPill value={fixture.status ?? 'scheduled'} />
                 </li>
               ))}
             </ul>
           )}
         </Card>

         {/* --------------------------------------- Audit Log */}
         <Card
           title="Security & System Audit Log"
           actions={<Btn to="/admin/audit" size="xs">Full Audit</Btn>}
           flush
         >
           {activity.isLoading ? (
             <LoadingRows rows={5} cols={3} />
           ) : activity.error ? (
             <div className="p-5"><ErrorNotice message={activity.error} /></div>
           ) : activity.data.length === 0 ? (
             <EmptyNotice
               title="Audit Log Initialized"
               message="Every privileged administrative operation is immutably timestamped."
             />
           ) : (
             <ul className={cn('divide-y', isDay ? 'divide-slate-200/60' : 'divide-white/5')}>
               {activity.data.slice(0, 8).map((entry) => (
                 <li key={entry.id} className={cn('flex items-center gap-3 px-5 py-3 transition-colors', isDay ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]')}>
                   <span
                     className={cn(
                       'shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-black uppercase',
                       entry.action?.startsWith('MATCH')
                         ? isDay ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                         : entry.action?.startsWith('ADMIN')
                           ? isDay ? 'border-red-300 bg-red-50 text-red-700' : 'border-red-500/40 bg-red-500/10 text-red-300'
                           : isDay ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
                     )}
                   >
                     {entry.action}
                   </span>
                   <span className={cn('min-w-0 flex-1 truncate text-xs', isDay ? 'text-slate-700' : 'text-slate-300')}>
                     {entry.resourceLabel ?? entry.resourceId}
                   </span>
                   <span className={cn('shrink-0 text-[11px] font-bold', isDay ? 'text-slate-500' : 'text-slate-400')}>{entry.adminName ?? entry.adminId}</span>
                 </li>
               ))}
             </ul>
           )}
         </Card>
       </motion.div>
     </motion.div>
   );
 };

 export default AdminDashboard;
