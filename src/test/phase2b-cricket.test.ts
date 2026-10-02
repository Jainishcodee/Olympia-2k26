import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatSportPositioning,
  recordMatchEvent,
  undoLastActiveEvent,
  correctMatchEvent,
} from '@/services/scoring/scoringService';
import { deriveCricketStats } from '@/components/matches/MatchStats';
import type { MatchEvent } from '@/types';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: { _mockDb: true },
  isFirebaseConfigured: true,
}));

let mockMatchData: any = {
  id: 'cricket-match-1',
  sportId: 'cricket',
  teamAId: 'team-india',
  teamBId: 'team-australia',
  lastSequence: 0,
  score: { teamA: 0, teamB: 0, details: { runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0 } },
  liveState: {
    innings: 1,
    battingTeam: 'teamA',
    totalRuns: 0,
    wickets: 0,
    over: 0,
    ball: 0,
    legalBalls: 0,
    overs: 0,
    extras: 0,
    strikerName: 'R. Sharma',
    strikerRuns: 0,
    strikerBalls: 0,
    nonStrikerName: 'V. Kohli',
    nonStrikerRuns: 0,
    nonStrikerBalls: 0,
    currentBowlerName: 'P. Cummins',
    bowlerRunsConceded: 0,
    bowlerWickets: 0,
    bowlerOvers: 0,
    bowlerBalls: 0,
    maxOvers: 20,
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

describe('Phase 2B: Cricket Live Scoring Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchData = {
      id: 'cricket-match-1',
      sportId: 'cricket',
      teamAId: 'team-india',
      teamBId: 'team-australia',
      lastSequence: 0,
      score: { teamA: 0, teamB: 0, details: { runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0 } },
      liveState: {
        innings: 1,
        battingTeam: 'teamA',
        totalRuns: 0,
        wickets: 0,
        over: 0,
        ball: 0,
        legalBalls: 0,
        overs: 0,
        extras: 0,
        strikerName: 'R. Sharma',
        strikerRuns: 0,
        strikerBalls: 0,
        nonStrikerName: 'V. Kohli',
        nonStrikerRuns: 0,
        nonStrikerBalls: 0,
        currentBowlerName: 'P. Cummins',
        bowlerRunsConceded: 0,
        bowlerWickets: 0,
        bowlerOvers: 0,
        bowlerBalls: 0,
        maxOvers: 20,
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

  it('1. match_start initializes Innings 1, 0/0 score, 0.0 overs, and sets status to live', async () => {
    const res = await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'match_start',
      team: 'teamA',
      teamName: 'India',
      description: 'Match started. India elected to bat first.',
    });

    expect(res.sequence).toBe(1);
    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.liveState.innings).toBe(1);
    expect(mockMatchData.liveState.battingTeam).toBe('teamA');
    expect(mockMatchData.liveState.over).toBe(0);
    expect(mockMatchData.liveState.ball).toBe(0);
    expect(mockMatchData.liveState.wickets).toBe(0);
    expect(mockMatchData.liveState.totalRuns).toBe(0);
  });

  it('2. 1 run (single) increments batting score, advances ball (0.1), and rotates strike', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'single',
      team: 'teamA',
      teamName: 'India',
      description: '🏏 +1 RUN · Over 0.1',
    });

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.liveState.totalRuns).toBe(1);
    expect(mockMatchData.liveState.ball).toBe(1);
    expect(mockMatchData.liveState.over).toBe(0);

    // Striker faced ball and scored 1, then strike rotated
    expect(mockMatchData.liveState.nonStrikerName).toBe('R. Sharma');
    expect(mockMatchData.liveState.nonStrikerRuns).toBe(1);
    expect(mockMatchData.liveState.nonStrikerBalls).toBe(1);
    expect(mockMatchData.liveState.strikerName).toBe('V. Kohli');
  });

  it('3. 2 runs (double) retains strike for the active batsman and increments balls', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'double',
      team: 'teamA',
      teamName: 'India',
      description: '🏏 +2 RUNS · Over 0.1',
    });

    expect(mockMatchData.score.teamA).toBe(2);
    expect(mockMatchData.liveState.ball).toBe(1);
    // Even runs: R. Sharma hit 2 runs and stays on strike
    expect(mockMatchData.liveState.strikerName).toBe('R. Sharma');
    expect(mockMatchData.liveState.strikerRuns).toBe(2);
    expect(mockMatchData.liveState.strikerBalls).toBe(1);
    expect(mockMatchData.liveState.nonStrikerName).toBe('V. Kohli');
  });

  it('4. 4 runs (four) adds 4 runs, advances ball, and retains strike', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'four',
      team: 'teamA',
      teamName: 'India',
      description: '🏏 FOUR! Beautiful cover drive · Over 0.1',
    });

    expect(mockMatchData.score.teamA).toBe(4);
    expect(mockMatchData.liveState.ball).toBe(1);
    expect(mockMatchData.liveState.strikerName).toBe('R. Sharma');
    expect(mockMatchData.liveState.strikerRuns).toBe(4);
    expect(mockMatchData.liveState.strikerBalls).toBe(1);
  });

  it('5. 6 runs (six) adds 6 runs, advances ball, and retains strike', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'six',
      team: 'teamA',
      teamName: 'India',
      description: '🏏 SIX! Launched over long on · Over 0.1',
    });

    expect(mockMatchData.score.teamA).toBe(6);
    expect(mockMatchData.liveState.ball).toBe(1);
    expect(mockMatchData.liveState.strikerName).toBe('R. Sharma');
    expect(mockMatchData.liveState.strikerRuns).toBe(6);
  });

  it('6. 10 runs (Olympia 10-run bonus) adds 10 runs to team and batter, advances ball, and retains strike', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'ten',
      team: 'teamA',
      teamName: 'India',
      description: '🏏 10 RUNS (BONUS)! Super shot out of stadium · Over 0.1',
    });

    expect(mockMatchData.score.teamA).toBe(10);
    expect(mockMatchData.liveState.totalRuns).toBe(10);
    expect(mockMatchData.liveState.ball).toBe(1);
    // 10 is even: striker retains strike
    expect(mockMatchData.liveState.strikerName).toBe('R. Sharma');
    expect(mockMatchData.liveState.strikerRuns).toBe(10);
  });

  it('7. Wide delivery adds 1 run and 1 extra, but legal balls count does NOT increment', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'wide',
      team: 'teamA',
      description: '⚠️ Wide delivery outside off stump',
    });

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.liveState.totalRuns).toBe(1);
    expect(mockMatchData.liveState.ball).toBe(0); // Ball didn't increment!
    expect(mockMatchData.liveState.extras).toBe(1);
    expect(mockMatchData.liveState.extrasDetail?.wides).toBe(1);
    expect(mockMatchData.liveState.strikerBalls).toBe(0); // Batsman didn't face a legal ball
  });

  it('8. No ball adds 1 run and 1 extra, but legal balls count does NOT increment', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'no_ball',
      team: 'teamA',
      description: '⚠️ No ball overstepping the crease',
    });

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.liveState.ball).toBe(0);
    expect(mockMatchData.liveState.extras).toBe(1);
    expect(mockMatchData.liveState.extrasDetail?.noBalls).toBe(1);
    expect(mockMatchData.liveState.strikerBalls).toBe(0);
  });

  it('9. Bye adds 1 extra to team, counts 1 legal ball, but batter personal runs do NOT increase', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'bye',
      team: 'teamA',
      description: '⚠️ 1 Bye taken by batsmen',
    });

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.liveState.ball).toBe(1);
    expect(mockMatchData.liveState.extras).toBe(1);
    expect(mockMatchData.liveState.extrasDetail?.byes).toBe(1);
    // Batter faced ball, but scored 0 runs from bat
    expect(mockMatchData.liveState.nonStrikerRuns).toBe(0); // Rotated on 1 bye
    expect(mockMatchData.liveState.nonStrikerBalls).toBe(1);
  });

  it('10. Leg bye adds 1 extra to team, counts 1 legal ball, but batter personal runs do NOT increase', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'leg_bye',
      team: 'teamA',
      description: '⚠️ 1 Leg bye off the thigh pad',
    });

    expect(mockMatchData.score.teamA).toBe(1);
    expect(mockMatchData.liveState.ball).toBe(1);
    expect(mockMatchData.liveState.extras).toBe(1);
    expect(mockMatchData.liveState.extrasDetail?.legByes).toBe(1);
    expect(mockMatchData.liveState.nonStrikerRuns).toBe(0);
    expect(mockMatchData.liveState.nonStrikerBalls).toBe(1);
  });

  it('11. Wicket delivery increments wickets, counts legal ball, and assigns new batsman', async () => {
    mockMatchData.status = 'live';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'wicket',
      team: 'teamA',
      teamName: 'India',
      description: '🎯 OUT! R. Sharma c. Warner b. Cummins · Over 0.1',
      data: {
        dismissalType: 'caught',
        outBatsman: 'striker',
        newBatsman: 'S. Gill',
      },
    });

    expect(mockMatchData.liveState.wickets).toBe(1);
    expect(mockMatchData.liveState.ball).toBe(1);
    expect(mockMatchData.liveState.strikerName).toBe('S. Gill');
    expect(mockMatchData.liveState.strikerRuns).toBe(0);
    expect(mockMatchData.liveState.strikerBalls).toBe(0);
    expect(mockMatchData.liveState.bowlerWickets).toBe(1);
  });

  it('12. Legal ball counting rolls over on ball 6 to increment overs and reset ball to 0', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.ball = 5;
    mockMatchData.liveState.over = 2;

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'single',
      team: 'teamA',
      description: '🏏 Single on the last ball of the over',
    });

    expect(mockMatchData.liveState.over).toBe(3);
    expect(mockMatchData.liveState.ball).toBe(0);
  });

  it('13. Over completion rotates ends so strike automatically swaps on even/dot 6th delivery', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.ball = 5;
    mockMatchData.liveState.over = 1;
    mockMatchData.liveState.strikerName = 'R. Sharma';
    mockMatchData.liveState.nonStrikerName = 'V. Kohli';

    // 0 runs on 6th ball: batsman remains at batting end, then end of over swaps ends so non-striker faces next over
    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'dot',
      team: 'teamA',
      description: '⚪ Dot ball to finish over',
    });

    expect(mockMatchData.liveState.over).toBe(2);
    expect(mockMatchData.liveState.ball).toBe(0);
    expect(mockMatchData.liveState.strikerName).toBe('V. Kohli');
    expect(mockMatchData.liveState.nonStrikerName).toBe('R. Sharma');
  });

  it('14. Manual strike swap (swapStriker) explicitly swaps striker and non-striker', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.strikerName = 'R. Sharma';
    mockMatchData.liveState.nonStrikerName = 'V. Kohli';

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'ball',
      team: 'teamA',
      description: '⇄ Strike rotated between batsmen',
      data: { swapStriker: true },
    });

    expect(mockMatchData.liveState.strikerName).toBe('V. Kohli');
    expect(mockMatchData.liveState.nonStrikerName).toBe('R. Sharma');
  });

  it('15. over_completed lifecycle action resets ball and legalBalls counters to 0', async () => {
    mockMatchData.status = 'live';
    mockMatchData.liveState.ball = 6;

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'over_completed',
      team: 'teamA',
      description: '⏱️ End of Over 5',
    });

    expect(mockMatchData.liveState.ball).toBe(0);
    expect(mockMatchData.liveState.legalBalls).toBe(0);
  });

  it('16. drinks_break records positioning without mutating scores or overs', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score.teamA = 65;
    mockMatchData.liveState.over = 8;
    mockMatchData.liveState.ball = 3;

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'drinks_break',
      description: '🥤 Drinks break called',
    });

    expect(mockMatchData.score.teamA).toBe(65);
    expect(mockMatchData.liveState.over).toBe(8);
    expect(mockMatchData.liveState.ball).toBe(3);
  });

  it('17. Innings 1 completion (innings_end) stores firstInnings snapshot and derives targetRuns', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score.teamA = 175;
    mockMatchData.liveState.totalRuns = 175;
    mockMatchData.liveState.wickets = 6;
    mockMatchData.liveState.over = 20;
    mockMatchData.liveState.ball = 0;

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'innings_end',
      team: 'teamA',
      teamName: 'India',
      description: '🏁 End of Innings 1: India 175/6 in 20.0 ov',
    });

    expect(mockMatchData.status).toBe('paused');
    expect(mockMatchData.liveState.inningsStatus).toBe('completed');
    expect(mockMatchData.liveState.firstInnings).toEqual({
      team: 'teamA',
      runs: 175,
      wickets: 6,
      overs: 20,
      balls: 0,
    });
    expect(mockMatchData.liveState.targetRuns).toBe(176);
    expect(mockMatchData.liveState.requiredRuns).toBe(176);
  });

  it('18. Second innings start (innings_start) swaps batting team to Team B and resets live counters', async () => {
    mockMatchData.status = 'paused';
    mockMatchData.score.teamA = 175;
    mockMatchData.liveState.innings = 1;
    mockMatchData.liveState.battingTeam = 'teamA';
    mockMatchData.liveState.targetRuns = 176;

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'innings_start',
      team: 'teamB',
      teamName: 'Australia',
      data: { innings: 2 },
      description: '🏏 2nd Innings began: Australia batting, chasing target of 176',
    });

    expect(mockMatchData.status).toBe('live');
    expect(mockMatchData.liveState.innings).toBe(2);
    expect(mockMatchData.liveState.battingTeam).toBe('teamB');
    expect(mockMatchData.liveState.totalRuns).toBe(0);
    expect(mockMatchData.liveState.wickets).toBe(0);
    expect(mockMatchData.liveState.over).toBe(0);
    expect(mockMatchData.liveState.ball).toBe(0);
  });

  it('19. Innings 2 scoring correctly updates Team B score without modifying Team A score', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 175, teamB: 0, details: {} };
    mockMatchData.liveState.innings = 2;
    mockMatchData.liveState.battingTeam = 'teamB';
    mockMatchData.liveState.totalRuns = 0;
    mockMatchData.liveState.targetRuns = 176;

    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'four',
      team: 'teamB',
      teamName: 'Australia',
      description: '🏏 FOUR! Australia off the mark · Over 0.1',
    });

    expect(mockMatchData.score.teamA).toBe(175); // Preserved!
    expect(mockMatchData.score.teamB).toBe(4);
    expect(mockMatchData.liveState.totalRuns).toBe(4);
    expect(mockMatchData.liveState.requiredRuns).toBe(172); // 176 - 4
  });

  it('20. Innings 2 target chase victory automatically concludes match with correct wicket margin', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 175, teamB: 172, details: {} };
    mockMatchData.liveState = {
      ...mockMatchData.liveState,
      innings: 2,
      battingTeam: 'teamB',
      totalRuns: 172,
      wickets: 3,
      targetRuns: 176,
      maxOvers: 20,
      overs: 18,
      ball: 2,
    };

    // Australia hits a 4 to reach 176!
    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'four',
      team: 'teamB',
      teamName: 'Australia',
      description: '🏏 FOUR! Australia crosses the line!',
    });

    expect(mockMatchData.score.teamB).toBe(176);
    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.liveState.winnerTeam).toBe('teamB');
    expect(mockMatchData.liveState.winnerTeamId).toBe('team-australia');
    expect(mockMatchData.liveState.resultText).toBe('Australia won by 7 wickets'); // 10 - 3 = 7
  });

  it('21. Innings 2 defending victory automatically concludes match when all 10 wickets fall', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 175, teamB: 140, details: {} };
    mockMatchData.liveState = {
      ...mockMatchData.liveState,
      innings: 2,
      battingTeam: 'teamB',
      totalRuns: 140,
      wickets: 9,
      targetRuns: 176,
      maxOvers: 20,
      overs: 17,
      ball: 4,
    };

    // 10th wicket falls!
    await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'wicket',
      team: 'teamB',
      teamName: 'Australia',
      description: '🎯 OUT! 10th wicket falls. Australia all out!',
    });

    expect(mockMatchData.liveState.wickets).toBe(10);
    expect(mockMatchData.status).toBe('completed');
    expect(mockMatchData.liveState.winnerTeam).toBe('teamA');
    expect(mockMatchData.liveState.winnerTeamId).toBe('team-india');
    expect(mockMatchData.liveState.resultText).toBe('Team A won by 35 runs'); // 175 - 140 = 35
  });

  it('22. Concurrent scoring simulation correctly resolves simultaneous deliveries without lost runs', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 100, teamB: 0, details: {} };
    mockMatchData.liveState.totalRuns = 100;
    mockMatchData.liveState.battingTeam = 'teamA';

    // Two scoring actions simultaneously submitted: 4 runs and 6 runs
    await Promise.all([
      recordMatchEvent({
        matchId: 'cricket-match-1',
        sportId: 'cricket',
        type: 'four',
        team: 'teamA',
        description: 'Delivery 1: Four',
      }),
      recordMatchEvent({
        matchId: 'cricket-match-1',
        sportId: 'cricket',
        type: 'six',
        team: 'teamA',
        description: 'Delivery 2: Six',
      }),
    ]);

    expect(mockMatchData.score.teamA).toBe(110); // 100 + 4 + 6 = 110!
    expect(mockMatchData.lastSequence).toBe(2);
  });

  it('23. Undo last active event rolls back runs, balls, sequence, and restores prior snapshot', async () => {
    mockMatchData.status = 'live';
    mockMatchData.score = { teamA: 50, teamB: 0, details: {} };
    mockMatchData.liveState.totalRuns = 50;
    mockMatchData.liveState.ball = 3;

    const recorded = await recordMatchEvent({
      matchId: 'cricket-match-1',
      sportId: 'cricket',
      type: 'six',
      team: 'teamA',
      description: 'Mistakenly pressed six',
    });

    expect(mockMatchData.score.teamA).toBe(56);
    expect(mockMatchData.liveState.ball).toBe(4);

    const undoResult = await undoLastActiveEvent('cricket-match-1', 'admin-1', { teamA: 50, teamB: 0 }, { ball: 3, totalRuns: 50 });

    expect(undoResult.undoneEvent.sequence).toBe(recorded.sequence);
    expect(mockMatchData.score.teamA).toBe(50);
    expect(mockMatchData.liveState.ball).toBe(3);
  });

  it('24. Completed match guard blocks scoring on concluded match unless privileged', async () => {
    mockMatchData.status = 'completed';

    await expect(
      recordMatchEvent({
        matchId: 'cricket-match-1',
        sportId: 'cricket',
        type: 'four',
        team: 'teamA',
        description: 'Illegal post-match delivery',
      })
    ).rejects.toThrow('Cannot record scoring events on a completed match');
  });

  it('25. deriveCricketStats authentic derivation calculates runs, wickets, overs, 4s, 6s, 10s, extras, and unmonitored metrics', () => {
    const events = [
      { id: 'e1', sequence: 1, type: 'four', team: 'teamA', description: 'Four', timestamp: {} as any },
      { id: 'e2', sequence: 2, type: 'six', team: 'teamA', description: 'Six', timestamp: {} as any },
      { id: 'e3', sequence: 3, type: 'ten', team: 'teamA', description: 'Super Ten', timestamp: {} as any },
      { id: 'e4', sequence: 4, type: 'wide', team: 'teamA', description: 'Wide', timestamp: {} as any },
      { id: 'e5', sequence: 5, type: 'dot', team: 'teamA', description: 'Dot', timestamp: {} as any },
      { id: 'e6', sequence: 6, type: 'wicket', team: 'teamA', description: 'Wicket', timestamp: {} as any },
      { id: 'e7', sequence: 7, type: 'single', team: 'teamB', description: 'Single', timestamp: {} as any },
      { id: 'e8', sequence: 8, type: 'four', team: 'teamB', description: 'Four', timestamp: {} as any },
    ] as unknown as MatchEvent[];

    const liveMatch: any = {
      score: { teamA: 21, teamB: 5 },
    };

    const stats = deriveCricketStats(events, liveMatch);

    const findStat = (label: string) => stats.find((s) => s.label === label);

    expect(findStat('Runs Scored')?.valA).toBe(21);
    expect(findStat('Runs Scored')?.valB).toBe(5);

    expect(findStat('Wickets Lost')?.valA).toBe(1);
    expect(findStat('Wickets Lost')?.valB).toBe(0);

    expect(findStat('Fours (4s)')?.valA).toBe(1);
    expect(findStat('Fours (4s)')?.valB).toBe(1);

    expect(findStat('Sixes (6s)')?.valA).toBe(1);
    expect(findStat('Sixes (6s)')?.valB).toBe(0);

    expect(findStat('Super Tens (10s)')?.valA).toBe(1);
    expect(findStat('Super Tens (10s)')?.valB).toBe(0);

    expect(findStat('Extras Conceded')?.valA).toBe(1); // Wide
    expect(findStat('Extras Conceded')?.valB).toBe(0);

    expect(findStat('Dot Balls Faced')?.valA).toBe(1);

    expect(findStat('Control %')?.status).toBe('not_tracked');
    expect(findStat('Catch Efficiency')?.status).toBe('not_tracked');
  });
});
