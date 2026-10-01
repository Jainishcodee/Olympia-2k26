import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatSportPositioning,
  recordMatchEvent,
  undoLastActiveEvent,
  correctMatchEvent,
} from '@/services/scoring/scoringService';
import { deriveVolleyballStats } from '@/components/matches/MatchStats';
import type { MatchEvent } from '@/types';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: { _mockDb: true },
  isFirebaseConfigured: true,
}));

let mockMatchData: any = {
  id: 'volleyball-match-1',
  sportId: 'volleyball',
  teamAId: 'team-spikers',
  teamBId: 'team-blockers',
  participantA: { id: 'team-spikers', name: 'Thunder Spikers', type: 'team' },
  participantB: { id: 'team-blockers', name: 'Iron Blockers', type: 'team' },
  lastSequence: 0,
  score: { teamA: 0, teamB: 0, details: { sets: [], currentSet: 1, setsWon: { teamA: 0, teamB: 0 } } },
  liveState: {
    bestOf: 3,
    setsRequiredToWin: 2,
    currentSet: 1,
    targetPoints: 25,
    winByTwo: true,
    setsWon: { teamA: 0, teamB: 0 },
    currentSetScore: { teamA: 0, teamB: 0 },
    completedSets: [],
    setStatus: 'in_progress',
  },
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
    orderBy: vi.fn(),
    getDocs: vi.fn(async () => {
      const sorted = [...mockEvents].sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
      return {
        docs: sorted.map((e) => ({
          id: e.id,
          data: () => e,
        })),
      };
    }),
    runTransaction: vi.fn(async (_db: any, callback: any) => {
      const transaction = {
        get: vi.fn(async (ref: any) => {
          if (ref._segments?.includes('matches') && !ref._segments?.includes('events')) {
            return {
              exists: () => true,
              data: () => JSON.parse(JSON.stringify(mockMatchData)),
            };
          }
          const eventId = ref._segments?.[ref._segments.length - 1] || ref._id;
          const found = mockEvents.find((e) => e.id === eventId);
          return {
            exists: () => Boolean(found),
            data: () => (found ? JSON.parse(JSON.stringify(found)) : undefined),
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

describe('Phase 2C: Volleyball Live Scoring Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchData = {
      id: 'volleyball-match-1',
      sportId: 'volleyball',
      teamAId: 'team-spikers',
      teamBId: 'team-blockers',
      participantA: { id: 'team-spikers', name: 'Thunder Spikers', type: 'team' },
      participantB: { id: 'team-blockers', name: 'Iron Blockers', type: 'team' },
      lastSequence: 0,
      score: { teamA: 0, teamB: 0, details: { sets: [], currentSet: 1, setsWon: { teamA: 0, teamB: 0 } } },
      liveState: {
        bestOf: 3,
        setsRequiredToWin: 2,
        currentSet: 1,
        targetPoints: 25,
        winByTwo: true,
        setsWon: { teamA: 0, teamB: 0 },
        currentSetScore: { teamA: 0, teamB: 0 },
        completedSets: [],
        setStatus: 'in_progress',
      },
      status: 'scheduled',
      startedAt: null,
      pausedAt: null,
      endedAt: null,
    };
    mockEvents = [];
    mockTransactionUpdates = [];
    mockTransactionSets = [];
  });

  // 1. Match start
  it('1. Match start: Initializes Set 1, targetPoints = 25, winByTwo = true, setsWon = 0-0, status = live', async () => {
    const res = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'match_start',
      description: 'Volleyball Match Started',
      data: { bestOf: 3 },
    });

    expect(res.sequence).toBe(1);
    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.startedAt).toBeDefined();
    expect(mockMatchData.liveState.currentSet).toBe(1);
    expect(mockMatchData.liveState.targetPoints).toBe(25);
    expect(mockMatchData.liveState.winByTwo).toBe(true);
    expect(mockMatchData.liveState.setsRequiredToWin).toBe(2);
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 0, teamB: 0 });
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 0, teamB: 0 });
    expect(mockMatchData.liveState.completedSets).toEqual([]);
    expect(mockMatchData.score.teamA).toBe(0);
    expect(mockMatchData.score.teamB).toBe(0);
  });

  // 2. Set start
  it('2. Set start: Explicit set_started event initializes set state', async () => {
    mockMatchData.status = 'live';
    const res = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'set_started',
      description: 'Set 1 Started',
      positioning: { set: 1 },
      data: { set: 1, targetPoints: 25 },
    });

    expect(res.sequence).toBe(1);
    expect(mockMatchData.liveState.currentSet).toBe(1);
    expect(mockMatchData.liveState.targetPoints).toBe(25);
    expect(mockMatchData.liveState.setStatus).toBe('in_progress');
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 0, teamB: 0 });
  });

  // 3. Team A point
  it('3. Team A point: Increments Team A points in current set and records positioning telemetry', async () => {
    mockMatchData.status = 'live';
    const res = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      teamName: 'Thunder Spikers',
      description: 'Point for Thunder Spikers',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(res.sequence).toBe(1);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(0);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 1, teamB: 0 });

    const event = mockTransactionSets.find((s) => s.data.type === 'point');
    expect(event).toBeDefined();
    expect(event.data.positioning).toEqual({ set: 1, rally: 1 });
    expect(event.data.positioningText).toBe('Set 1 · Rally 1');
  });

  // 4. Team B point
  it('4. Team B point: Increments Team B points in current set', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 1, teamB: 0, details: {} };
    mockMatchData.liveState.currentSetScore = { teamA: 1, teamB: 0 };
    mockMatchData.lastSequence = 1;

    const res = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamB',
      teamName: 'Iron Blockers',
      description: 'Point for Iron Blockers',
      scoreDelta: { teamB: 1, points: 1 },
    });

    expect(res.sequence).toBe(2);
    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.score.teamB).toBe(1);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 1, teamB: 1 });

    const event = mockTransactionSets.find((s) => s.data.type === 'point');
    expect(event.data.positioning).toEqual({ set: 1, rally: 2 });
    expect(event.data.positioningText).toBe('Set 1 · Rally 2');
  });

  // 5. Same-team concurrent points
  it('5. Same-team concurrent points: Simultaneous point additions for Team A commit with zero lost updates', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 20;
    mockMatchData.score = { teamA: 10, teamB: 10, details: {} };
    mockMatchData.liveState.currentSetScore = { teamA: 10, teamB: 10 };

    const admin1 = recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Spike kill Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    const admin2 = recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Block point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    const [res1, res2] = await Promise.all([admin1, admin2]);
    expect(res1.sequence).toBe(21);
    expect(res2.sequence).toBe(22);
    expect(mockMatchData.score.teamA).toBe(12);
    expect(mockMatchData.score.teamB).toBe(10);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 12, teamB: 10 });
    expect(mockMatchData.lastSequence).toBe(22);
  });

  // 6. Opposing-team concurrent points
  it('6. Opposing-team concurrent points: Simultaneous points for Team A and Team B commit without interference', async () => {
    mockMatchData.status = 'live';
    mockMatchData.lastSequence = 20;
    mockMatchData.score = { teamA: 10, teamB: 10, details: {} };
    mockMatchData.liveState.currentSetScore = { teamA: 10, teamB: 10 };

    const adminA = recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    const adminB = recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamB',
      description: 'Point Team B',
      scoreDelta: { teamB: 1, points: 1 },
    });

    const [resA, resB] = await Promise.all([adminA, adminB]);
    expect(resA.sequence).toBe(21);
    expect(resB.sequence).toBe(22);
    expect(mockMatchData.score.teamA).toBe(11);
    expect(mockMatchData.score.teamB).toBe(11);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 11, teamB: 11 });
  });

  // 7. 24–24 continuation
  it('7. 24–24 continuation: Set does NOT complete at 25-24 because win-by-2 margin is required', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 24, teamB: 24, details: {} };
    mockMatchData.liveState.currentSet = 1;
    mockMatchData.liveState.targetPoints = 25;
    mockMatchData.liveState.winByTwo = true;
    mockMatchData.liveState.currentSetScore = { teamA: 24, teamB: 24 };
    mockMatchData.liveState.setsWon = { teamA: 0, teamB: 0 };

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point Team A (25-24 deuce)',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.score.teamA).toBe(25);
    expect(mockMatchData.score.teamB).toBe(24);
    expect(mockMatchData.liveState.currentSet).toBe(1); // Set continues!
    expect(mockMatchData.liveState.setStatus).toBe('in_progress');
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 0, teamB: 0 }); // Not won yet!
    expect(mockMatchData.status).toBe('live');
  });

  // 8. 26–24 set completion
  it('8. 26–24 set completion: 2-point margin reached, set completes automatically', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 25, teamB: 24, details: {} };
    mockMatchData.liveState.currentSet = 1;
    mockMatchData.liveState.targetPoints = 25;
    mockMatchData.liveState.winByTwo = true;
    mockMatchData.liveState.currentSetScore = { teamA: 25, teamB: 24 };
    mockMatchData.liveState.setsWon = { teamA: 0, teamB: 0 };
    mockMatchData.liveState.completedSets = [];

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Set point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    // Set 1 completed with 26-24
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 1, teamB: 0 });
    expect(mockMatchData.liveState.completedSets).toEqual([
      { set: 1, teamA: 26, teamB: 24, winner: 'teamA' },
    ]);
    // Advances to Set 2 with points reset
    expect(mockMatchData.liveState.currentSet).toBe(2);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 0, teamB: 0 });
    expect(mockMatchData.score.teamA).toBe(0);
    expect(mockMatchData.score.teamB).toBe(0);
  });

  // 9. Deciding set (15 points win-by-2)
  it('9. Deciding set: Set 3 target is 15 points win-by-2, 15-14 continues and 16-14 wins', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.bestOf = 3;
    mockMatchData.liveState.setsRequiredToWin = 2;
    mockMatchData.liveState.currentSet = 3; // Deciding set!
    mockMatchData.liveState.targetPoints = 15;
    mockMatchData.liveState.winByTwo = true;
    mockMatchData.liveState.setsWon = { teamA: 1, teamB: 1 };
    mockMatchData.liveState.currentSetScore = { teamA: 14, teamB: 14 };
    mockMatchData.score = { teamA: 14, teamB: 14, details: {} };

    // Point to Team A -> 15-14 (target reached but margin is only 1)
    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.score.teamA).toBe(15);
    expect(mockMatchData.score.teamB).toBe(14);
    expect(mockMatchData.liveState.currentSet).toBe(3); // Still Set 3
    expect(mockMatchData.status).toBe('live');

    // Point to Team A -> 16-14 (margin is 2 -> wins set and match!)
    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Match winning point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 2, teamB: 1 });
    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.liveState.winnerTeam).toBe('teamA');
    expect(mockMatchData.liveState.resultText).toContain('won 2–1');
  });

  // 10. Set transition
  it('10. Set transition: Preserves completed set scores in history and resets points for next set', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 24, teamB: 22, details: {} };
    mockMatchData.liveState.currentSet = 1;
    mockMatchData.liveState.targetPoints = 25;
    mockMatchData.liveState.currentSetScore = { teamA: 24, teamB: 22 };
    mockMatchData.liveState.setsWon = { teamA: 0, teamB: 0 };
    mockMatchData.liveState.completedSets = [];

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Team A wins Set 1',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.liveState.completedSets.length).toBe(1);
    expect(mockMatchData.liveState.completedSets[0]).toEqual({
      set: 1,
      teamA: 25,
      teamB: 22,
      winner: 'teamA',
    });
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 1, teamB: 0 });
    expect(mockMatchData.liveState.currentSet).toBe(2);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 0, teamB: 0 });
    expect(mockMatchData.score.teamA).toBe(0);
    expect(mockMatchData.score.teamB).toBe(0);
  });

  // 11. Best-of-3 completion
  it('11. Best-of-3 completion: Reaching 2 sets won automatically concludes match', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.bestOf = 3;
    mockMatchData.liveState.setsRequiredToWin = 2;
    mockMatchData.liveState.currentSet = 2;
    mockMatchData.liveState.targetPoints = 25;
    mockMatchData.liveState.setsWon = { teamA: 1, teamB: 0 };
    mockMatchData.liveState.currentSetScore = { teamA: 24, teamB: 20 };
    mockMatchData.score = { teamA: 24, teamB: 20, details: {} };
    mockMatchData.liveState.completedSets = [
      { set: 1, teamA: 25, teamB: 20, winner: 'teamA' },
    ];

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Team A seals Set 2 and the Match',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 2, teamB: 0 });
    expect(mockMatchData.liveState.winnerTeam).toBe('teamA');
    expect(mockMatchData.liveState.resultText).toContain('Thunder Spikers won 2–0');
    expect(mockMatchData.liveState.completedSets.length).toBe(2);
    expect(mockMatchData.endedAt).toBeDefined();
  });

  // 12. Best-of-5 completion if supported
  it('12. Best-of-5 completion: Requires 3 sets to win when bestOf is configured to 5', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.bestOf = 5;
    mockMatchData.liveState.setsRequiredToWin = 3;
    mockMatchData.liveState.currentSet = 3;
    mockMatchData.liveState.targetPoints = 25;
    mockMatchData.liveState.setsWon = { teamA: 2, teamB: 0 };
    mockMatchData.liveState.currentSetScore = { teamA: 24, teamB: 18 };
    mockMatchData.score = { teamA: 24, teamB: 18, details: {} };
    mockMatchData.liveState.completedSets = [
      { set: 1, teamA: 25, teamB: 20, winner: 'teamA' },
      { set: 2, teamA: 25, teamB: 21, winner: 'teamA' },
    ];

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Team A wins Set 3 and Match (3-0)',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 3, teamB: 0 });
    expect(mockMatchData.liveState.resultText).toContain('won 3–0');
  });

  // 13. Undo point
  it('13. Undo point: Restores previous set points and snapshot state', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 18, teamB: 17, details: {} };
    mockMatchData.liveState.currentSetScore = { teamA: 18, teamB: 17 };

    // Prior event: 19-17
    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });
    expect(mockMatchData.score.teamA).toBe(19);

    // Latest event: 20-17
    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Spike kill Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });
    expect(mockMatchData.score.teamA).toBe(20);

    // Undo latest point -> restores 19-17
    const undoRes = await undoLastActiveEvent('volleyball-match-1');
    expect(undoRes.undoneEvent.type).toBe('point');
    expect(mockMatchData.score.teamA).toBe(19);
    expect(mockMatchData.score.teamB).toBe(17);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 19, teamB: 17 });
  });

  // 14. Undo set transition
  it('14. Undo set transition: Restores prior set score and reverses setsWon increment', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 23, teamB: 22, details: {} };
    mockMatchData.liveState.currentSet = 1;
    mockMatchData.liveState.currentSetScore = { teamA: 23, teamB: 22 };
    mockMatchData.liveState.setsWon = { teamA: 0, teamB: 0 };
    mockMatchData.liveState.completedSets = [];

    // Prior event: Team A reaches 24-22 (Set 1)
    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Set point setup',
      scoreDelta: { teamA: 1, points: 1 },
    });
    expect(mockMatchData.score.teamA).toBe(24);
    expect(mockMatchData.liveState.currentSet).toBe(1);

    // Winning point of Set 1 -> transitions to Set 2 (0-0, setsWon: 1-0)
    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Set point Team A',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockMatchData.liveState.currentSet).toBe(2);
    expect(mockMatchData.liveState.setsWon.teamA).toBe(1);

    // Operator undos the winning point -> rolls back to Set 1 at 24-22
    await undoLastActiveEvent('volleyball-match-1');

    expect(mockMatchData.liveState.currentSet).toBe(1);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 24, teamB: 22 });
    expect(mockMatchData.liveState.setsWon).toEqual({ teamA: 0, teamB: 0 });
    expect(mockMatchData.liveState.completedSets).toEqual([]);
    expect(mockMatchData.score.teamA).toBe(24);
    expect(mockMatchData.score.teamB).toBe(22);
  });

  // 15. Correction
  it('15. Correction: Corrects mistaken event with an auditable replacement and updates score', async () => {
    mockMatchData.status = 'live';
    mockEvents = [
      {
        id: 'ev-1',
        sequence: 1,
        matchId: 'volleyball-match-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamB',
        undone: false,
        snapshot: { score: { teamA: 10, teamB: 11 }, liveState: { currentSet: 1, currentSetScore: { teamA: 10, teamB: 11 } } },
      },
    ];

    const corrRes = await correctMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      originalEventId: 'ev-1',
      correctionNote: 'Misattributed point: Spike touched block, point was Team A',
      newType: 'point',
      team: 'teamA',
      newDescription: 'Corrected Point for Team A',
      correctedScore: { teamA: 11, teamB: 10 },
      correctedLiveState: { currentSet: 1, currentSetScore: { teamA: 11, teamB: 10 } },
    });

    expect(corrRes.sequence).toBe(1);
    expect(mockMatchData.score.teamA).toBe(11);
    expect(mockMatchData.score.teamB).toBe(10);
    expect(mockMatchData.liveState.currentSetScore).toEqual({ teamA: 11, teamB: 10 });
    expect(mockEvents[0].undone).toBe(true);
  });

  // 16. Player attribution optional
  it('16. Player attribution optional: Supports optional player name without failing when omitted', async () => {
    mockMatchData.status = 'live';

    // Point WITH player attribution
    const resWithPlayer = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      playerName: 'Rahul Verma',
      playerId: 'p-101',
      description: 'Point for Team A (Rahul Verma)',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(resWithPlayer.sequence).toBe(1);
    const ev1 = mockTransactionSets.find((s) => s.data.sequence === 1);
    expect(ev1.data.playerName).toBe('Rahul Verma');
    expect(ev1.data.playerId).toBe('p-101');

    // Point WITHOUT player attribution
    const resWithoutPlayer = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamB',
      description: 'Point for Team B',
      scoreDelta: { teamB: 1, points: 1 },
    });

    expect(resWithoutPlayer.sequence).toBe(2);
    const ev2 = mockTransactionSets.find((s) => s.data.sequence === 2);
    expect(ev2.data.playerName).toBe('');
    expect(ev2.data.playerId).toBe('');
  });

  // 17. Timeline ordering
  it('17. Timeline ordering: Sequence numbers increment monotonically and format correctly', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point 1',
      scoreDelta: { teamA: 1, points: 1 },
    });

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'timeout',
      team: 'teamB',
      description: 'Timeout Team B',
      positioning: { set: 1 },
    });

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point 2',
      scoreDelta: { teamA: 1, points: 1 },
    });

    expect(mockTransactionSets.map((s) => s.data.sequence)).toEqual([1, 2, 3]);
    expect(mockTransactionSets[1].data.type).toBe('timeout');
    expect(mockTransactionSets[1].data.positioningText).toBe('Set 1');
  });

  // 18. Completed match guard
  it('18. Completed match guard: Blocks scoring actions on completed match unless privileged correction', async () => {
    mockMatchData.status = 'completed';

    await expect(
      recordMatchEvent({
        matchId: 'volleyball-match-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamA',
        description: 'Late point attempt',
        scoreDelta: { teamA: 1, points: 1 },
      })
    ).rejects.toThrow('Cannot record scoring events on a completed match');

    // Privileged correction is permitted
    const privRes = await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Privileged point adjustment',
      scoreDelta: { teamA: 1, points: 1 },
      data: { isPrivilegedCorrection: true },
    });
    expect(privRes.sequence).toBe(1);
  });

  // 19. Authentic stats derivation
  it('19. Authentic stats derivation: Accurately calculates derived metrics and flags unmonitored ones as not_tracked', () => {
    const events: MatchEvent[] = [
      {
        id: 'e1',
        sequence: 1,
        matchId: 'volleyball-match-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamA',
        timestamp: { toMillis: () => 0, seconds: 0 } as any,
        description: 'Point A',
        undone: false,
        createdBy: 'admin',
      },
      {
        id: 'e2',
        sequence: 2,
        matchId: 'volleyball-match-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamA',
        timestamp: { toMillis: () => 0, seconds: 0 } as any,
        description: 'Point A',
        undone: false,
        createdBy: 'admin',
      },
      {
        id: 'e3',
        sequence: 3,
        matchId: 'volleyball-match-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamB',
        timestamp: { toMillis: () => 0, seconds: 0 } as any,
        description: 'Point B',
        undone: false,
        createdBy: 'admin',
      },
      {
        id: 'e4',
        sequence: 4,
        matchId: 'volleyball-match-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamB',
        timestamp: { toMillis: () => 0, seconds: 0 } as any,
        description: 'Undone point',
        undone: true, // Should be excluded!
        createdBy: 'admin',
      },
    ];

    const matchSnapshot: any = {
      score: { teamA: 2, teamB: 1 },
      liveState: {
        setsWon: { teamA: 1, teamB: 0 },
        currentSetScore: { teamA: 2, teamB: 1 },
        completedSets: [{ set: 1, teamA: 25, teamB: 20, winner: 'teamA' }],
      },
    };

    const stats = deriveVolleyballStats(events, matchSnapshot);

    const setsWonStat = stats.find((s) => s.label === 'Sets Won');
    expect(setsWonStat).toBeDefined();
    expect(setsWonStat?.valA).toBe(1);
    expect(setsWonStat?.valB).toBe(0);
    expect(setsWonStat?.status).toBe('derived');

    const currentPointsStat = stats.find((s) => s.label === 'Current Set Points');
    expect(currentPointsStat?.valA).toBe(2);
    expect(currentPointsStat?.valB).toBe(1);

    const totalMatchPointsStat = stats.find((s) => s.label === 'Total Match Points');
    expect(totalMatchPointsStat?.valA).toBe(27); // 25 + 2
    expect(totalMatchPointsStat?.valB).toBe(21); // 20 + 1

    const pointRalliesStat = stats.find((s) => s.label === 'Point Rallies Won');
    expect(pointRalliesStat?.valA).toBe(2);
    expect(pointRalliesStat?.valB).toBe(1);

    // Unmonitored metrics must be explicitly 'not_tracked' with '—'
    const attackPct = stats.find((s) => s.label === 'Attack Percentage');
    expect(attackPct?.status).toBe('not_tracked');
    expect(attackPct?.valA).toBe('—');
    expect(attackPct?.valB).toBe('—');

    const blocks = stats.find((s) => s.label === 'Blocks');
    expect(blocks?.status).toBe('not_tracked');
    expect(blocks?.valA).toBe('—');

    const aces = stats.find((s) => s.label === 'Aces');
    expect(aces?.status).toBe('not_tracked');
    expect(aces?.valA).toBe('—');
  });

  // 20. Public state synchronization
  it('20. Public state synchronization: Confirms authoritative current match document contains all fields for real-time rendering', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'volleyball-match-1',
      sportId: 'volleyball',
      type: 'point',
      team: 'teamA',
      description: 'Point scored',
      scoreDelta: { teamA: 1, points: 1 },
    });

    // Authoritative Match Document has everything the spectator UI needs
    expect(mockMatchData.score).toHaveProperty('teamA');
    expect(mockMatchData.score).toHaveProperty('teamB');
    expect(mockMatchData.score.details).toHaveProperty('sets');
    expect(mockMatchData.score.details).toHaveProperty('setsWon');
    expect(mockMatchData.liveState).toHaveProperty('currentSet');
    expect(mockMatchData.liveState).toHaveProperty('currentSetScore');
    expect(mockMatchData.liveState).toHaveProperty('setsWon');
    expect(mockMatchData.liveState).toHaveProperty('targetPoints');
    expect(mockMatchData.liveState).toHaveProperty('completedSets');
    expect(mockMatchData.lastSequence).toBe(1);
    expect(mockMatchData.updatedAt).toBeDefined();
  });
});
