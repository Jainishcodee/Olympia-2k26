import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatSportPositioning,
  recordMatchEvent,
  undoLastActiveEvent,
  correctMatchEvent,
} from '@/services/scoring/scoringService';
import { deriveFootballStats } from '@/components/matches/MatchStats';
import type { MatchEvent } from '@/types';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: { _mockDb: true },
  isFirebaseConfigured: true,
}));

let mockMatchData: any = {
  id: 'football-match-1',
  sportId: 'football',
  lastSequence: 0,
  score: { teamA: 0, teamB: 0, details: {} },
  liveState: { period: 1, clock: '00:00' },
  status: 'scheduled',
  startedAt: null,
  pausedAt: null,
  endedAt: null,
};

let mockEvents: any[] = [];
let mockTransactionUpdates: any[] = [];
let mockTransactionSets: any[] = [];

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((_db: any, path: string) => ({ _path: path })),
    doc: vi.fn((_dbOrColl: any, ...segments: string[]) => ({
      _id: segments[segments.length - 1] || 'generated-id',
      _segments: segments,
    })),
    Timestamp: {
      now: vi.fn(() => ({ toMillis: () => 1700000000000, seconds: 1700000000 })),
    },
    query: vi.fn((coll: any) => coll),
    where: vi.fn(),
    orderBy: vi.fn(),
    setDoc: vi.fn(async () => {}),
    getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
    getDocs: vi.fn(async () => ({
      docs: mockEvents.map((e) => ({
        id: e.id,
        data: () => e,
      })),
    })),
    runTransaction: vi.fn(async (_db: any, callback: any) => {
      const transaction = {
        get: vi.fn(async (ref: any) => {
          if (ref._segments?.includes('matches') && !ref._segments?.includes('events')) {
            return {
              exists: () => true,
              data: () => ({ ...mockMatchData }),
            };
          }
          const eventId = ref._segments?.[ref._segments.length - 1] || ref._id;
          const found = mockEvents.find((e) => e.id === eventId);
          return {
            exists: () => Boolean(found),
            data: () => (found ? { ...found } : undefined),
          };
        }),
        set: vi.fn((ref: any, data: any) => {
          mockTransactionSets.push({ ref, data });
          if (ref._segments?.includes('events') || data.sequence) {
            mockEvents.push({ id: ref._id || `event-${data.sequence}`, ...data });
          }
        }),
        update: vi.fn((ref: any, data: any) => {
          mockTransactionUpdates.push({ ref, data });
          if (ref._segments?.includes('matches') && !ref._segments?.includes('events')) {
            Object.assign(mockMatchData, data);
          } else {
            const eventId = ref._segments?.[ref._segments.length - 1] || ref._id;
            const targetEvent = mockEvents.find((e) => e.id === eventId);
            if (targetEvent) {
              Object.assign(targetEvent, data);
            }
          }
        }),
      };
      return callback(transaction);
    }),
  };
});

describe('Phase 2A: Football Live Scoring Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchData = {
      id: 'football-match-1',
      sportId: 'football',
      lastSequence: 0,
      score: { teamA: 0, teamB: 0, details: {} },
      liveState: { period: 1, clock: '00:00' },
      status: 'scheduled',
      startedAt: null,
      pausedAt: null,
      endedAt: null,
    };
    mockEvents = [];
    mockTransactionUpdates = [];
    mockTransactionSets = [];
  });

  // 1. Match Start
  it('1. Match Start: transitions scheduled to live, sets startedAt, period 1, records MATCH_START', async () => {
    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'match_start',
      description: 'Kickoff! First half underway',
      newScore: { teamA: 0, teamB: 0 },
    });

    expect(result.sequence).toBe(1);
    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.startedAt).toBeDefined();
    expect(mockMatchData.liveState.period).toBe(1);
    expect(mockMatchData.liveState.isHalfTime).toBe(false);

    const event = mockEvents.find((e) => e.sequence === 1);
    expect(event).toBeDefined();
    expect(event.type).toBe('match_start');
  });

  // 2. Goal Team A
  it('2. Goal Team A: increments Team A score +1 and records goal event', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 1;

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'goal',
      team: 'teamA',
      teamName: 'Arsenal',
      playerName: 'Bukayo Saka',
      scoreDelta: { teamA: 1 },
      description: '⚽ GOAL! Arsenal (Bukayo Saka)',
      positioning: { period: 1, matchSecond: 1380 },
    });

    expect(result.sequence).toBe(2);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(0);

    const event = mockEvents.find((e) => e.sequence === 2);
    expect(event.playerName).toBe('Bukayo Saka');
    expect(event.positioningText).toBe('1H 23\'');
    expect(event.snapshot.score.teamA).toBe(1);
  });

  // 3. Goal Team B
  it('3. Goal Team B: increments Team B score +1', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 2;
    mockMatchData.score = { teamA: 1, teamB: 0 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'goal',
      team: 'teamB',
      teamName: 'Chelsea',
      playerName: 'Cole Palmer',
      scoreDelta: { teamB: 1 },
      description: '⚽ GOAL! Chelsea (Cole Palmer)',
      positioning: { period: 1, matchSecond: 2400 },
    });

    expect(result.sequence).toBe(3);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);

    const event = mockEvents.find((e) => e.sequence === 3);
    expect(event.playerName).toBe('Cole Palmer');
    expect(event.positioningText).toBe('1H 40\'');
  });

  // 4. Yellow Card
  it('4. Yellow Card: preserves score and records disciplinary event', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 3;
    mockMatchData.score = { teamA: 1, teamB: 1 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'yellow_card',
      team: 'teamA',
      playerName: 'Declan Rice',
      description: '🟨 Yellow Card · Declan Rice',
      positioning: { period: 1, matchSecond: 2520 },
    });

    expect(result.sequence).toBe(4);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);

    const event = mockEvents.find((e) => e.sequence === 4);
    expect(event.playerName).toBe('Declan Rice');
    expect(event.type).toBe('yellow_card');
  });

  // 5. Red Card
  it('5. Red Card: preserves score and records disciplinary event', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 4;
    mockMatchData.score = { teamA: 1, teamB: 1 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'red_card',
      team: 'teamB',
      playerName: 'Nicolas Jackson',
      description: '🟥 Red Card · Nicolas Jackson',
      positioning: { period: 1, matchSecond: 2640 },
    });

    expect(result.sequence).toBe(5);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);

    const event = mockEvents.find((e) => e.sequence === 5);
    expect(event.playerName).toBe('Nicolas Jackson');
    expect(event.type).toBe('red_card');
  });

  // 6. Half Time
  it('6. Half Time: sets status paused, isHalfTime true, period 1, preserves score and supports added time', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 5;
    mockMatchData.score = { teamA: 1, teamB: 1 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'half_time',
      description: '⏱️ Half Time reached',
      positioning: { period: 1, matchSecond: 2700, addedTime: 2 },
    });

    expect(result.sequence).toBe(6);
    expect(mockMatchData.status).toBe('paused');
    expect(mockMatchData.pausedAt).toBeDefined();
    expect(mockMatchData.liveState.isHalfTime).toBe(true);
    expect(mockMatchData.liveState.period).toBe(1);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);

    const event = mockEvents.find((e) => e.sequence === 6);
    expect(event.positioningText).toBe('1H 45+2\'');
  });

  // 7. Second Half
  it('7. Second Half: sets status live, isHalfTime false, period 2, clears pausedAt and resumes play', async () => {
    mockMatchData.status = 'paused';
    mockMatchData.pausedAt = { toMillis: () => 1700000000000, seconds: 1700000000 };
    mockMatchData.liveState = { period: 1, isHalfTime: true, pausedDurationMs: 0 };
    mockMatchData.lastSequence = 6;
    mockMatchData.score = { teamA: 1, teamB: 1 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'second_half',
      description: '⏱️ Second Half kicked off',
      positioning: { period: 2, matchSecond: 2700 },
    });

    expect(result.sequence).toBe(7);
    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.pausedAt).toBeNull();
    expect(mockMatchData.liveState.isHalfTime).toBe(false);
    expect(mockMatchData.liveState.period).toBe(2);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);
  });

  // 8. Substitution
  it('8. Substitution: records player off and player on with score preserved', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 7;
    mockMatchData.score = { teamA: 1, teamB: 1 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'substitution',
      team: 'teamA',
      teamName: 'Arsenal',
      data: { playerOff: 'Gabriel Martinelli', playerOn: 'Leandro Trossard' },
      description: '🔄 SUB (Arsenal): Leandro Trossard ON ⇄ Gabriel Martinelli OFF',
      positioning: { period: 2, matchSecond: 3600 },
    });

    expect(result.sequence).toBe(8);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);

    const event = mockEvents.find((e) => e.sequence === 8);
    expect(event.data.playerOff).toBe('Gabriel Martinelli');
    expect(event.data.playerOn).toBe('Leandro Trossard');
  });

  // 9. Full Time / Match End
  it('9. Full Time: sets status completed and records endedAt', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 8;
    mockMatchData.score = { teamA: 1, teamB: 1 };

    const result = await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'full_time',
      description: '🏁 Full Time · Final whistle',
      positioning: { period: 2, matchSecond: 5400, addedTime: 4 },
    });

    expect(result.sequence).toBe(9);
    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.endedAt).toBeDefined();

    const event = mockEvents.find((e) => e.sequence === 9);
    expect(event.positioningText).toBe('2H 90+4\'');
  });

  // 10. Goal Concurrency (Two simultaneous goals from 0-0 commit to 1-1)
  it('10. Goal Concurrency: Two simultaneous goals from 0-0 commit to 1-1 with monotonic sequences', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 0, teamB: 0 };
    mockMatchData.lastSequence = 40;

    const [adminA, adminB] = await Promise.all([
      recordMatchEvent({
        matchId: 'football-match-1',
        sportId: 'football',
        type: 'goal',
        team: 'teamA',
        scoreDelta: { teamA: 1 },
        description: 'Goal Team A',
      }),
      recordMatchEvent({
        matchId: 'football-match-1',
        sportId: 'football',
        type: 'goal',
        team: 'teamB',
        scoreDelta: { teamB: 1 },
        description: 'Goal Team B',
      }),
    ]);

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);
    expect(new Set([adminA.sequence, adminB.sequence])).toEqual(new Set([41, 42]));
  });

  // 11. Card + Goal Concurrency
  it('11. Card + Goal Concurrency: Non-scoring card event does not overwrite simultaneous goal', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 1, teamB: 0 };
    mockMatchData.lastSequence = 10;

    const [cardResult, goalResult] = await Promise.all([
      recordMatchEvent({
        matchId: 'football-match-1',
        sportId: 'football',
        type: 'yellow_card',
        team: 'teamA',
        description: 'Yellow card Team A',
      }),
      recordMatchEvent({
        matchId: 'football-match-1',
        sportId: 'football',
        type: 'goal',
        team: 'teamB',
        scoreDelta: { teamB: 1 },
        description: 'Goal Team B',
      }),
    ]);

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);
    expect(new Set([cardResult.sequence, goalResult.sequence])).toEqual(new Set([11, 12]));
  });

  // 12. Undo Goal
  it('12. Undo Goal: cleanly reverses goal and restores prior snapshot score', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 1, teamB: 1 };
    mockMatchData.lastSequence = 2;

    const event1 = {
      id: 'event-1',
      sequence: 1,
      type: 'goal',
      team: 'teamA',
      description: 'Goal A',
      undone: false,
      snapshot: { score: { teamA: 1, teamB: 0 }, liveState: { period: 1 } },
    };
    const event2 = {
      id: 'event-2',
      sequence: 2,
      type: 'goal',
      team: 'teamB',
      description: 'Goal B',
      undone: false,
      snapshot: { score: { teamA: 1, teamB: 1 }, liveState: { period: 1 } },
    };
    mockEvents = [event2, event1];

    // Undo Goal B (event 2) -> restore event 1 (1-0)
    const undoResult = await undoLastActiveEvent('football-match-1', 'admin');
    expect(undoResult.undoneEvent.sequence).toBe(2);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(0);
    expect(event2.undone).toBe(true);

    // Undo Goal A (event 1) -> restore initial state (0-0)
    const undoResult2 = await undoLastActiveEvent('football-match-1', 'admin');
    expect(undoResult2.undoneEvent.sequence).toBe(1);
    expect(mockMatchData.score.teamA).toBe(0);
    expect(mockMatchData.score.teamB).toBe(0);
    expect(event1.undone).toBe(true);
  });

  // 13. Undo Non-scoring Event
  it('13. Undo Non-scoring Event: leaves score completely unchanged', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 2, teamB: 1 };
    mockMatchData.lastSequence = 3;

    const event1 = {
      id: 'event-1',
      sequence: 1,
      type: 'goal',
      undone: false,
      snapshot: { score: { teamA: 2, teamB: 1 }, liveState: { period: 1 } },
    };
    const event2 = {
      id: 'event-2',
      sequence: 2,
      type: 'yellow_card',
      undone: false,
      snapshot: { score: { teamA: 2, teamB: 1 }, liveState: { period: 1 } },
    };
    mockEvents = [event2, event1];

    const result = await undoLastActiveEvent('football-match-1', 'admin');
    expect(result.undoneEvent.type).toBe('yellow_card');
    expect(mockMatchData.score.teamA).toBe(2);
    expect(mockMatchData.score.teamB).toBe(1);
  });

  // 14. Event Correction
  it('14. Event Correction: invalidates original event and appends auditable replacement', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 5;
    mockMatchData.score = { teamA: 2, teamB: 0 };

    const originalEvent = {
      id: 'event-goal-wrong',
      sequence: 5,
      type: 'goal',
      team: 'teamA',
      description: 'Goal Team A (disputed)',
      undone: false,
      snapshot: { score: { teamA: 2, teamB: 0 }, liveState: { period: 1 } },
    };
    mockEvents = [originalEvent];

    const result = await correctMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      originalEventId: 'event-goal-wrong',
      correctionNote: 'VAR Review: Offside',
      newType: 'correction',
      newDescription: 'VAR Decision: Goal disallowed for offside',
      correctedScore: { teamA: 1, teamB: 0 },
      correctedBy: 'admin',
    });

    expect(result.sequence).toBe(6);
    expect(originalEvent.undone).toBe(true);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(0);
  });

  // 15. Completed Match Rejects New Scoring Events
  it('15. Completed Match Rejects New Scoring Events', async () => {
    mockMatchData.status = 'completed';
    mockMatchData.score = { teamA: 2, teamB: 1 };

    await expect(
      recordMatchEvent({
        matchId: 'football-match-1',
        sportId: 'football',
        type: 'goal',
        team: 'teamA',
        scoreDelta: { teamA: 1 },
        description: 'Late goal attempt',
      })
    ).rejects.toThrow('Cannot record scoring events on a completed match');
  });

  // 16. Timeline Monotonic Ordering & Positioning
  it('16. Timeline Monotonic Ordering & Positioning formatting', () => {
    expect(formatSportPositioning('football', { period: 1, matchSecond: 60 })).toBe('1H 1\'');
    expect(formatSportPositioning('football', { period: 1, matchSecond: 2700, addedTime: 3 })).toBe('1H 45+3\'');
    expect(formatSportPositioning('football', { period: 2, matchSecond: 5100 })).toBe('2H 85\'');
    expect(formatSportPositioning('football', { period: 2, matchSecond: 5400, addedTime: 5 })).toBe('2H 90+5\'');
  });

  // 17. Telemetry: Derived from Real Events, Untracked Marked
  it('17. Telemetry: Derived authentic stats from events with untracked fields marked', () => {
    const events: MatchEvent[] = [
      { id: '1', sequence: 1, matchId: 'm1', sportId: 'football', type: 'goal', team: 'teamA', description: 'Goal A', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '2', sequence: 2, matchId: 'm1', sportId: 'football', type: 'goal', team: 'teamA', description: 'Goal A2', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '3', sequence: 3, matchId: 'm1', sportId: 'football', type: 'goal', team: 'teamB', description: 'Goal B', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '4', sequence: 4, matchId: 'm1', sportId: 'football', type: 'yellow_card', team: 'teamA', description: 'Yellow A', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '5', sequence: 5, matchId: 'm1', sportId: 'football', type: 'red_card', team: 'teamB', description: 'Red B', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '6', sequence: 6, matchId: 'm1', sportId: 'football', type: 'substitution', team: 'teamA', description: 'Sub A', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '7', sequence: 7, matchId: 'm1', sportId: 'football', type: 'goal', team: 'teamB', description: 'Undone Goal B', timestamp: {} as any, undone: true, createdBy: 'admin' },
    ];

    const stats = deriveFootballStats(events);

    const goals = stats.find((s) => s.label === 'Goals');
    expect(goals).toEqual({ label: 'Goals', valA: 2, valB: 1, status: 'derived' });

    const yellowCards = stats.find((s) => s.label === 'Yellow Cards');
    expect(yellowCards).toEqual({ label: 'Yellow Cards', valA: 1, valB: 0, status: 'derived' });

    const redCards = stats.find((s) => s.label === 'Red Cards');
    expect(redCards).toEqual({ label: 'Red Cards', valA: 0, valB: 1, status: 'derived' });

    const subs = stats.find((s) => s.label === 'Substitutions');
    expect(subs).toEqual({ label: 'Substitutions', valA: 1, valB: 0, status: 'derived' });

    const possession = stats.find((s) => s.label === 'Possession');
    expect(possession).toEqual({ label: 'Possession', valA: '—', valB: '—', status: 'not_tracked' });

    const shots = stats.find((s) => s.label === 'Shots');
    expect(shots).toEqual({ label: 'Shots', valA: '—', valB: '—', status: 'not_tracked' });
  });

  // 18. Paused duration accumulation for halftime
  it('18. Paused Duration Accumulation: calculates pausedDurationMs when restarting for 2nd half', async () => {
    mockMatchData.status = 'paused';
    // Match paused 900,000 ms (15 minutes) ago
    const pauseTimeMs = Date.now() - 900000;
    mockMatchData.pausedAt = { toMillis: () => pauseTimeMs, seconds: Math.floor(pauseTimeMs / 1000) };
    mockMatchData.liveState = { period: 1, isHalfTime: true, pausedDurationMs: 0 };
    mockMatchData.lastSequence = 10;

    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'second_half',
      description: 'Second half kick off',
    });

    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.pausedAt).toBeNull();
    expect(mockMatchData.liveState.period).toBe(2);
    expect(mockMatchData.liveState.pausedDurationMs).toBeGreaterThanOrEqual(900000);
  });

  // 19. Formatting Shootout Positioning
  it('19. Formatting Shootout Positioning: formats penalty shootout positioning labels', () => {
    expect(formatSportPositioning('football', { isShootout: true })).toBe('PEN');
    expect(formatSportPositioning('football', { isShootout: true, penaltyKickNumber: 4 })).toBe('PEN · Kick 4');
    expect(formatSportPositioning('football', { isShootout: true, penaltyRound: 2 })).toBe('PEN · R2');
  });

  // 20. Penalty Shootout Full Flow
  it('20. Penalty Shootout Flow: starts shootout, tracks kicks, updates rounds, and completes match with winner', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 0, teamB: 0, details: {} };
    mockMatchData.liveState = { period: 2, clock: '90:00' };
    mockMatchData.lastSequence = 20;

    // 1. Start Shootout
    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'penalty_shootout_start',
      description: '⚽ Penalty Shootout Started',
    });

    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.liveState.period).toBe('shootout');
    expect(mockMatchData.liveState.isShootout).toBe(true);
    expect(mockMatchData.liveState.penalties).toBeDefined();
    expect(mockMatchData.liveState.penalties.teamA).toBe(0);
    expect(mockMatchData.liveState.penalties.teamB).toBe(0);
    expect(mockMatchData.liveState.penalties.round).toBe(1);
    expect(mockMatchData.liveState.penalties.currentTeam).toBe('teamA');
    expect(mockMatchData.liveState.penalties.kicks).toHaveLength(0);

    // 2. Team A Kick 1 - Scored
    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'penalty_scored',
      team: 'teamA',
      playerName: 'Kane',
      description: '⚽ Team A penalty scored by Kane',
    });

    expect(mockMatchData.liveState.penalties.teamA).toBe(1);
    expect(mockMatchData.liveState.penalties.teamB).toBe(0);
    expect(mockMatchData.liveState.penalties.currentTeam).toBe('teamB');
    expect(mockMatchData.liveState.penalties.kicks).toHaveLength(1);
    expect(mockMatchData.liveState.penalties.kicks[0].scored).toBe(true);
    expect(mockMatchData.liveState.penalties.kicks[0].playerName).toBe('Kane');

    // 3. Team B Kick 1 - Missed
    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'penalty_missed',
      team: 'teamB',
      playerName: 'Mbappe',
      description: '❌ Team B penalty missed by Mbappe',
    });

    expect(mockMatchData.liveState.penalties.teamA).toBe(1);
    expect(mockMatchData.liveState.penalties.teamB).toBe(0);
    expect(mockMatchData.liveState.penalties.round).toBe(2);
    expect(mockMatchData.liveState.penalties.currentTeam).toBe('teamA');
    expect(mockMatchData.liveState.penalties.kicks).toHaveLength(2);
    expect(mockMatchData.liveState.penalties.kicks[1].scored).toBe(false);

    // 4. Team A Kick 2 - Scored
    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'penalty_scored',
      team: 'teamA',
      playerName: 'Saka',
      description: '⚽ Team A penalty scored by Saka',
    });

    expect(mockMatchData.liveState.penalties.teamA).toBe(2);
    expect(mockMatchData.liveState.penalties.teamB).toBe(0);
    expect(mockMatchData.liveState.penalties.currentTeam).toBe('teamB');

    // 5. Team B Kick 2 - Scored
    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'penalty_scored',
      team: 'teamB',
      playerName: 'Griezmann',
      description: '⚽ Team B penalty scored by Griezmann',
    });

    expect(mockMatchData.liveState.penalties.teamA).toBe(2);
    expect(mockMatchData.liveState.penalties.teamB).toBe(1);
    expect(mockMatchData.liveState.penalties.round).toBe(3);
    expect(mockMatchData.liveState.penalties.currentTeam).toBe('teamA');

    // 6. Conclude Shootout & Finalize Match
    await recordMatchEvent({
      matchId: 'football-match-1',
      sportId: 'football',
      type: 'penalty_shootout_end',
      team: 'teamA',
      description: '🏁 Shootout Concluded: Team A wins on penalties',
    });

    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.liveState.isShootout).toBe(false);
    expect(mockMatchData.liveState.winnerTeam).toBe('teamA');
    expect(mockMatchData.liveState.resultText).toContain('won 2–1 on penalties');
  });

  // 21. Telemetry with Shootout Stats
  it('21. Telemetry: derives shootout and missed penalties stats when shootout events exist', () => {
    const events: MatchEvent[] = [
      { id: '1', sequence: 1, matchId: 'm1', sportId: 'football', type: 'penalty_scored', team: 'teamA', description: 'Pen A', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '2', sequence: 2, matchId: 'm1', sportId: 'football', type: 'penalty_scored', team: 'teamA', description: 'Pen A2', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '3', sequence: 3, matchId: 'm1', sportId: 'football', type: 'penalty_scored', team: 'teamB', description: 'Pen B', timestamp: {} as any, undone: false, createdBy: 'admin' },
      { id: '4', sequence: 4, matchId: 'm1', sportId: 'football', type: 'penalty_missed', team: 'teamB', description: 'Miss B', timestamp: {} as any, undone: false, createdBy: 'admin' },
    ];

    const stats = deriveFootballStats(events);
    const penStat = stats.find((s) => s.label === 'Penalty Shootout');
    expect(penStat).toEqual({ label: 'Penalty Shootout', valA: 2, valB: 1, status: 'derived' });

    const missStat = stats.find((s) => s.label === 'Penalties Missed');
    expect(missStat).toEqual({ label: 'Penalties Missed', valA: 0, valB: 1, status: 'derived' });
  });

  // 22. Undo Shootout Kick
  it('22. Undo Shootout Kick: restores prior snapshot penalty state and score', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 0, teamB: 0, details: { penalties: { teamA: 2, teamB: 1 } } };
    mockMatchData.liveState = {
      isShootout: true,
      period: 'shootout',
      penalties: { teamA: 2, teamB: 1, round: 2, currentTeam: 'teamA' },
    };
    mockMatchData.lastSequence = 30;

    const event1 = {
      id: 'pen-event-1',
      sequence: 1,
      type: 'penalty_scored',
      team: 'teamA',
      undone: false,
      snapshot: {
        score: { teamA: 0, teamB: 0, details: { penalties: { teamA: 1, teamB: 1 } } },
        liveState: {
          isShootout: true,
          period: 'shootout',
          penalties: { teamA: 1, teamB: 1, round: 2, currentTeam: 'teamB' },
        },
      },
    };
    const event2 = {
      id: 'pen-event-2',
      sequence: 2,
      type: 'penalty_scored',
      team: 'teamA',
      undone: false,
      snapshot: {
        score: { teamA: 0, teamB: 0, details: { penalties: { teamA: 2, teamB: 1 } } },
        liveState: {
          isShootout: true,
          period: 'shootout',
          penalties: { teamA: 2, teamB: 1, round: 2, currentTeam: 'teamA' },
        },
      },
    };
    mockEvents = [event2, event1];

    const undoResult = await undoLastActiveEvent('football-match-1', 'admin');
    expect(undoResult.undoneEvent.sequence).toBe(2);
    expect(mockMatchData.liveState.penalties.teamA).toBe(1);
    expect(mockMatchData.score.details.penalties.teamA).toBe(1);
    expect(event2.undone).toBe(true);
  });
});
