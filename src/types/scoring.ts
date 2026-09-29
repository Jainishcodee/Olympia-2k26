export interface FootballScore {
  teamAGoals: number;
  teamBGoals: number;
  period: number;
  half: number;
  matchTime: string;
  teamAYellowCards: number;
  teamBYellowCards: number;
  teamARedCards: number;
  teamBRedCards: number;
  teamACorners: number;
  teamBCorners: number;
  teamAShots: number;
  teamBShots: number;
}

export interface BallEvent {
  over: number;
  ball: number;
  runs: number;
  type: 'dot' | 'single' | 'double' | 'triple' | 'four' | 'six' | 'wicket' | 'wide' | 'no_ball' | 'bye' | 'leg_bye';
  batsmanId: string;
  bowlerId: string;
  timestamp: string;
}

export interface CricketExtras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalties: number;
}

export interface CricketInnings {
  teamId: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: CricketExtras;
  ballLog: BallEvent[];
}

export interface CricketScore {
  battingTeam: string;
  innings: CricketInnings[];
  target: number;
  currentRunRate: number;
  requiredRunRate: number;
}

export interface SetScore {
  teamAPoints: number;
  teamBPoints: number;
  completed: boolean;
  winner: string | null;
}

export interface VolleyballScore {
  sets: SetScore[];
  currentSet: number;
  teamASetWins: number;
  teamBSetWins: number;
}

export interface GameScore {
  teamAPoints: number;
  teamBPoints: number;
  completed: boolean;
  winner: string | null;
}

export interface BadmintonScore {
  games: GameScore[];
  currentGame: number;
  teamAGameWins: number;
  teamBGameWins: number;
}

export type TableTennisScore = BadmintonScore;

export interface ChessScore {
  result: 'white_wins' | 'black_wins' | 'draw' | 'ongoing';
  moves: string[];
  whitePlayerId: string;
  blackPlayerId: string;
}

export interface CarromScore {
  teamAPoints: number;
  teamBPoints: number;
  rounds: number;
  currentRound: number;
}

export interface MapScore {
  name: string;
  teamARounds: number;
  teamBRounds: number;
  completed: boolean;
  winner: string | null;
}

export interface CounterStrikeScore {
  maps: MapScore[];
  currentMap: number;
  teamARounds: number;
  teamBRounds: number;
}

export interface KartParticipant {
  id: string;
  name: string;
  position: number;
  points: number;
  laps: number;
}

export interface SmashKartsScore {
  participants: KartParticipant[];
  currentLap: number;
  totalLaps: number;
}

export interface HandTennisScore {
  sets: SetScore[];
  currentSet: number;
  format: 'configurable' | string;
}
