import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatSportPositioning,
  recordMatchEvent,
  undoLastActiveEvent,
  correctMatchEvent,
} from '@/services/scoring/scoringService';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: { _mockDb: true },
  isFirebaseConfigured: true,
}));

let mockMatchData: any = {
  id: 'match-101',
  sportId: 'cricket',
  lastSequence: 40,
  score: { teamA: 120, teamB: 0, details: {} },
  liveState: { innings: 1, over: 15, ball: 2 },
  status: 'live',
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
          // Event doc lookup
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
            // Commit to mock database so subsequent transaction reads see committed state
            Object.assign(mockMatchData, data);
          }
        }),
      };
      return callback(transaction);
    }),
  };
});

describe('Phase 1: Live Scoring Safety & Data Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchData = {
      id: 'match-101',
      sportId: 'cricket',
      lastSequence: 40,
      score: { teamA: 120, teamB: 0, details: {} },
      liveState: { innings: 1, over: 15, ball: 2 },
      status: 'live',
    };
    mockEvents = [];
    mockTransactionUpdates = [];
    mockTransactionSets = [];
  });

  describe('1. formatSportPositioning (Sport-specific Telemetry)', () => {
    it('formats cricket innings, over, and ball correctly', () => {
      expect(
        formatSportPositioning('cricket', { innings: 1, over: 15, ball: 3 })
      ).toBe('Inn 1 · Over 15.3');
    });

    it('formats football periods and match minutes correctly', () => {
      expect(
        formatSportPositioning('football', { period: 1, matchSecond: 1380 })
      ).toBe('1H 23\'');
      expect(
        formatSportPositioning('football', { period: 2, matchSecond: 3600 }, '60:00')
      ).toBe('2H 60:00');
    });

    it('formats volleyball and tennis sets and rallies', () => {
      expect(
        formatSportPositioning('volleyball', { set: 2, rally: 18 })
      ).toBe('Set 2 · Rally 18');
    });

    it('formats badminton and table tennis games and rallies', () => {
      expect(
        formatSportPositioning('badminton', { game: 3, rally: 21 })
      ).toBe('Game 3 · Rally 21');
    });

    it('formats CS / LAN games maps and rounds', () => {
      expect(
        formatSportPositioning('lan-games', { map: 2, round: 14 })
      ).toBe('Map 2 · Round 14');
    });

    it('formats racing / carrom laps', () => {
      expect(
        formatSportPositioning('carrom', { lap: 4 })
      ).toBe('Lap 4');
    });
  });

  describe('2. Atomic Event Recording (runTransaction)', () => {
    it('increments sequence monotonically and commits score and event atomically', async () => {
      const result = await recordMatchEvent({
        matchId: 'match-101',
        sportId: 'cricket',
        type: 'four',
        team: 'teamA',
        teamName: 'Storm Breakers',
        description: 'Boundary through covers',
        newScore: { teamA: 124, teamB: 0 },
        newLiveState: { innings: 1, over: 15, ball: 3 },
      });

      expect(result.sequence).toBe(41);
      // Event written inside transaction
      expect(mockTransactionSets.length).toBe(1);
      expect(mockTransactionSets[0].data.sequence).toBe(41);
      expect(mockTransactionSets[0].data.type).toBe('four');
      expect(mockTransactionSets[0].data.undone).toBe(false);

      // Match updated inside the same transaction
      expect(mockTransactionUpdates.length).toBe(1);
      expect(mockTransactionUpdates[0].data.score.teamA).toBe(124);
      expect(mockTransactionUpdates[0].data.score.teamB).toBe(0);
    });
  });

  describe('3. Undo Concurrency & Safety', () => {
    it('successfully undoes the latest active event and rolls back snapshot', async () => {
      mockEvents = [
        {
          id: 'event-41',
          sequence: 41,
          undone: false,
          snapshot: { score: { teamA: 124, teamB: 0 }, liveState: {} },
        },
        {
          id: 'event-40',
          sequence: 40,
          undone: false,
          snapshot: { score: { teamA: 120, teamB: 0 }, liveState: {} },
        },
      ];

      const result = await undoLastActiveEvent('match-101', 'admin-user');

      expect(result.undoneEvent.id).toBe('event-41');
      expect(result.restoredScore).toEqual({ teamA: 120, teamB: 0 });

      // Target event marked undone
      const eventUpdate = mockTransactionUpdates.find((u) => u.data.undone === true);
      expect(eventUpdate).toBeDefined();
      expect(eventUpdate.data.undoneBy).toBe('admin-user');

      // Match score rolled back
      const matchUpdate = mockTransactionUpdates.find((u) => u.data.score);
      expect(matchUpdate.data.score).toEqual({ teamA: 120, teamB: 0 });
    });

    it('rejects concurrent undo if target event was already undone by another operator', async () => {
      mockEvents = [
        {
          id: 'event-41',
          sequence: 41,
          undone: true, // Already undone!
        },
      ];

      await expect(undoLastActiveEvent('match-101')).rejects.toThrow(
        'No active events found to undo.'
      );
    });
  });

  describe('4. Event Correction with Auditable Trace', () => {
    it('atomically invalidates original event and creates correction replacement', async () => {
      mockEvents = [
        {
          id: 'event-40',
          sequence: 40,
          undone: false,
          description: 'Boundary Four',
          matchTime: '15.2',
        },
      ];

      const result = await correctMatchEvent({
        matchId: 'match-101',
        sportId: 'cricket',
        originalEventId: 'event-40',
        correctionNote: 'Misfield corrected from 4 to 2 runs',
        newType: 'double',
        newDescription: 'Two runs taken',
        correctedScore: { teamA: 122, teamB: 0 },
      });

      expect(result.sequence).toBe(41);

      // Original event marked undone with correction note
      const origUpdate = mockTransactionUpdates.find((u) => u.data.correctionNote);
      expect(origUpdate).toBeDefined();
      expect(origUpdate.data.undone).toBe(true);

      // Replacement event created with isCorrection flag
      const newEvent = mockTransactionSets.find((s) => s.data.isCorrection);
      expect(newEvent).toBeDefined();
      expect(newEvent.data.sequence).toBe(41);
      expect(newEvent.data.replacesSequence).toBe(40);
      expect(newEvent.data.correctionNote).toBe('Misfield corrected from 4 to 2 runs');
    });
  });

  describe('5. Concurrency Audit: Zero Lost Updates on Simultaneous Submissions', () => {
    it('CRITICAL SCENARIO: Two admins simultaneously submit GOAL for Team A and Team B from 0-0', async () => {
      // Initial state: Team A = 0, Team B = 0, sequence = 40
      mockMatchData = {
        id: 'match-101',
        sportId: 'football',
        lastSequence: 40,
        score: { teamA: 0, teamB: 0, details: {} },
        liveState: { period: 1 },
        status: 'live',
      };

      // Both admins read initial match state (0 - 0) on their devices.
      // Admin A submits GOAL for Team A (expected delta = +1 for Team A)
      // Admin B submits GOAL for Team B (expected delta = +1 for Team B)
      const submitAdminA = recordMatchEvent({
        matchId: 'match-101',
        sportId: 'football',
        type: 'goal',
        team: 'teamA',
        teamName: 'Team A',
        description: 'Goal for Team A',
        scoreDelta: { teamA: 1 },
      });

      const submitAdminB = recordMatchEvent({
        matchId: 'match-101',
        sportId: 'football',
        type: 'goal',
        team: 'teamB',
        teamName: 'Team B',
        description: 'Goal for Team B',
        scoreDelta: { teamB: 1 },
      });

      const [resA, resB] = await Promise.all([submitAdminA, submitAdminB]);

      // Sequence numbers must be strictly sequential
      expect(resA.sequence).toBe(41);
      expect(resB.sequence).toBe(42);

      // Final match state must be Team A = 1, Team B = 1!
      // NEITHER GOAL CAN BE OVERWRITTEN OR LOST!
      expect(mockMatchData.lastSequence).toBe(42);
      expect(mockMatchData.score.teamA).toBe(1);
      expect(mockMatchData.score.teamB).toBe(1);

      // Verify the events timeline snapshots:
      const event41 = mockEvents.find((e) => e.sequence === 41);
      const event42 = mockEvents.find((e) => e.sequence === 42);

      expect(event41).toBeDefined();
      expect(event41.type).toBe('goal');
      expect(event41.team).toBe('teamA');
      expect(event41.snapshot.score).toEqual({ teamA: 1, teamB: 0, details: {} });

      expect(event42).toBeDefined();
      expect(event42.type).toBe('goal');
      expect(event42.team).toBe('teamB');
      expect(event42.snapshot.score).toEqual({ teamA: 1, teamB: 1, details: {} });
    });

    it('Cricket Concurrency: Simultaneous runs and wicket from different admins', async () => {
      mockMatchData = {
        id: 'match-cricket-1',
        sportId: 'cricket',
        lastSequence: 10,
        score: { teamA: 100, teamB: 0, details: { runs: 100, wickets: 2, overs: 12, balls: 2 } },
        liveState: { innings: 1, over: 12, ball: 2, wickets: 2 },
        status: 'live',
      };

      // Admin A scores a FOUR (+4 runs, +1 ball)
      const adminA = recordMatchEvent({
        matchId: 'match-cricket-1',
        sportId: 'cricket',
        type: 'four',
        team: 'teamA',
        description: 'Four runs',
        scoreDelta: { teamA: 4, runs: 4, balls: 1 },
      });

      // Admin B simultaneously scores a SINGLE (+1 run, +1 ball)
      const adminB = recordMatchEvent({
        matchId: 'match-cricket-1',
        sportId: 'cricket',
        type: 'single',
        team: 'teamA',
        description: 'Single taken',
        scoreDelta: { teamA: 1, runs: 1, balls: 1 },
      });

      const [resA, resB] = await Promise.all([adminA, adminB]);

      expect(resA.sequence).toBe(11);
      expect(resB.sequence).toBe(12);

      // Total runs must be 100 + 4 + 1 = 105!
      // Total balls must be 2 + 1 + 1 = 4!
      expect(mockMatchData.score.teamA).toBe(105);
      expect(mockMatchData.score.details.runs).toBe(105);
      expect(mockMatchData.score.details.balls).toBe(4);
    });

    it('Points Concurrency: Simultaneous point additions for both teams in volleyball/badminton', async () => {
      mockMatchData = {
        id: 'match-vb-1',
        sportId: 'volleyball',
        lastSequence: 20,
        score: { teamA: 14, teamB: 14, details: {} },
        liveState: { set: 1 },
        status: 'live',
      };

      const adminA = recordMatchEvent({
        matchId: 'match-vb-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamA',
        description: 'Spike winner for Team A',
        scoreDelta: { teamA: 1 },
      });

      const adminB = recordMatchEvent({
        matchId: 'match-vb-1',
        sportId: 'volleyball',
        type: 'point',
        team: 'teamB',
        description: 'Block point for Team B',
        scoreDelta: { teamB: 1 },
      });

      await Promise.all([adminA, adminB]);

      expect(mockMatchData.score.teamA).toBe(15);
      expect(mockMatchData.score.teamB).toBe(15);
      expect(mockMatchData.lastSequence).toBe(22);
    });

    it('Non-scoring event concurrency: Card event submitted simultaneously with a goal does not overwrite the goal', async () => {
      mockMatchData = {
        id: 'match-card-1',
        sportId: 'football',
        lastSequence: 15,
        score: { teamA: 0, teamB: 0, details: {} },
        liveState: { period: 1 },
        status: 'live',
      };

      // Admin A submits a Goal (+1 for Team A)
      const adminA = recordMatchEvent({
        matchId: 'match-card-1',
        sportId: 'football',
        type: 'goal',
        team: 'teamA',
        description: 'Goal!',
        scoreDelta: { teamA: 1 },
      });

      // Admin B submits a Yellow Card (non-scoring)
      const adminB = recordMatchEvent({
        matchId: 'match-card-1',
        sportId: 'football',
        type: 'yellow_card',
        team: 'teamA',
        description: 'Yellow card for reckless tackle',
      });

      await Promise.all([adminA, adminB]);

      // Score must remain Team A = 1, Team B = 0 regardless of commit order!
      expect(mockMatchData.score.teamA).toBe(1);
      expect(mockMatchData.score.teamB).toBe(0);
      expect(mockMatchData.lastSequence).toBe(17);
    });

    it('Inferred delta: Automatically infers score delta when scoreDelta is omitted', async () => {
      mockMatchData = {
        id: 'match-infer-1',
        sportId: 'football',
        lastSequence: 5,
        score: { teamA: 2, teamB: 1, details: {} },
        liveState: {},
        status: 'live',
      };

      // Omit scoreDelta — inferScoreDelta should detect goal on teamB
      const res = await recordMatchEvent({
        matchId: 'match-infer-1',
        sportId: 'football',
        type: 'goal',
        team: 'teamB',
        description: 'Equaliser!',
      });

      expect(res.sequence).toBe(6);
      expect(mockMatchData.score.teamA).toBe(2);
      expect(mockMatchData.score.teamB).toBe(2); // Inferred +1
    });
  });
});
