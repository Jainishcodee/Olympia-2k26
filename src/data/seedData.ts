export const SEED_SPORTS = [
  { id: 'football', name: 'Football', slug: 'football', icon: '⚽', description: 'The beautiful game. 11v11 on the pitch.', active: true, scoringType: 'goals' as const, teamBased: true, maxPlayersPerTeam: 18, minPlayersPerTeam: 11 },
  { id: 'cricket', name: 'Cricket', slug: 'cricket', icon: '🏏', description: 'Bat meets ball. Strategic team sport.', active: true, scoringType: 'runs' as const, teamBased: true, maxPlayersPerTeam: 15, minPlayersPerTeam: 11 },
  { id: 'badminton', name: 'Badminton', slug: 'badminton', icon: '🏸', description: 'Speed and precision on the court.', active: true, scoringType: 'games_points' as const, teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
  { id: 'volleyball', name: 'Volleyball', slug: 'volleyball', icon: '🏐', description: 'Spike, set, and serve to victory.', active: true, scoringType: 'sets_points' as const, teamBased: true, maxPlayersPerTeam: 12, minPlayersPerTeam: 6 },
  { id: 'hand-tennis', name: 'Hand Tennis', slug: 'hand-tennis', icon: '✋', description: 'Fast-paced hand tennis action.', active: true, scoringType: 'configurable' as const, teamBased: true, maxPlayersPerTeam: 6, minPlayersPerTeam: 2 },
  { id: 'table-tennis', name: 'Table Tennis', slug: 'table-tennis', icon: '🏓', description: 'Lightning reflexes on the table.', active: true, scoringType: 'games_points' as const, teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
  { id: 'chess', name: 'Chess', slug: 'chess', icon: '♚', description: 'The ultimate battle of minds.', active: true, scoringType: 'result' as const, teamBased: false, maxPlayersPerTeam: 1, minPlayersPerTeam: 1 },
  { id: 'carrom', name: 'Carrom', slug: 'carrom', icon: '🎯', description: 'Precision flicking and strategy.', active: true, scoringType: 'configurable' as const, teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
  { id: 'smash-karts', name: 'Smash Karts', slug: 'smash-karts', icon: '🏎️', description: 'High-octane kart racing chaos.', active: true, scoringType: 'race' as const, teamBased: true, maxPlayersPerTeam: 4, minPlayersPerTeam: 1 },
  { id: 'counter-strike', name: 'Counter-Strike', slug: 'counter-strike', icon: '🎮', description: 'Tactical FPS esports action.', active: true, scoringType: 'rounds' as const, teamBased: true, maxPlayersPerTeam: 5, minPlayersPerTeam: 5 },
];

export const SEED_VENUES = [
  { id: 'main-arena', name: 'Olympia Main Arena', location: 'Central Campus', capacity: 500, description: 'The flagship arena for major events', active: true },
  { id: 'indoor-court', name: 'Indoor Sports Complex', location: 'Sports Block', capacity: 200, description: 'Multi-purpose indoor facility', active: true },
  { id: 'outdoor-field', name: 'Olympia Ground', location: 'East Campus', capacity: 1000, description: 'Open air sporting ground', active: true },
  { id: 'gaming-hub', name: 'Digital Arena Hub', location: 'Tech Building', capacity: 50, description: 'Esports and gaming facility', active: true },
];

export const SEED_TEAMS = [
  // Football teams
  { id: 'thunderbolts-fc', name: 'Thunderbolts FC', shortName: 'THU', sportId: 'football', description: 'Strike fast, strike hard', active: true, wins: 3, losses: 1, draws: 1, points: 10 },
  { id: 'phoenix-united', name: 'Phoenix United', shortName: 'PHX', sportId: 'football', description: 'Rising from the ashes', active: true, wins: 4, losses: 0, draws: 1, points: 13 },
  { id: 'iron-wolves', name: 'Iron Wolves', shortName: 'IRW', sportId: 'football', description: 'Strength of the pack', active: true, wins: 2, losses: 2, draws: 1, points: 7 },
  { id: 'royal-eagles', name: 'Royal Eagles', shortName: 'REG', sportId: 'football', description: 'Soaring above all', active: true, wins: 1, losses: 3, draws: 1, points: 4 },
  // Cricket teams
  { id: 'storm-breakers', name: 'Storm Breakers XI', shortName: 'STB', sportId: 'cricket', description: 'Breaking boundaries', active: true, wins: 3, losses: 1, draws: 0, points: 6 },
  { id: 'golden-warriors', name: 'Golden Warriors', shortName: 'GDW', sportId: 'cricket', description: 'Warriors of the crease', active: true, wins: 2, losses: 2, draws: 0, points: 4 },
  // Volleyball teams
  { id: 'spike-masters', name: 'Spike Masters', shortName: 'SPK', sportId: 'volleyball', description: 'Masters of the spike', active: true, wins: 4, losses: 1, draws: 0, points: 8 },
  { id: 'block-titans', name: 'Block Titans', shortName: 'BLT', sportId: 'volleyball', description: 'The wall of defense', active: true, wins: 3, losses: 2, draws: 0, points: 6 },
  // CS teams
  { id: 'cyber-phantoms', name: 'Cyber Phantoms', shortName: 'CPH', sportId: 'counter-strike', description: 'Silent and deadly', active: true, wins: 5, losses: 1, draws: 0, points: 10 },
  { id: 'neon-strikers', name: 'Neon Strikers', shortName: 'NES', sportId: 'counter-strike', description: 'Lighting up the server', active: true, wins: 3, losses: 3, draws: 0, points: 6 },
];

// Create 30+ sample players across teams with names, jersey numbers, roles
export const SEED_PLAYERS = [
  // Thunderbolts FC
  { id: 'p1', name: 'Arjun Mehta', jerseyNumber: 10, teamId: 'thunderbolts-fc', sportId: 'football', role: 'captain' as const, position: 'Forward', active: true },
  { id: 'p2', name: 'Kabir Singh', jerseyNumber: 7, teamId: 'thunderbolts-fc', sportId: 'football', role: 'vice_captain' as const, position: 'Midfielder', active: true },
  { id: 'p3', name: 'Dev Patel', jerseyNumber: 1, teamId: 'thunderbolts-fc', sportId: 'football', role: 'player' as const, position: 'Goalkeeper', active: true },
  { id: 'p4', name: 'Rohan Kumar', jerseyNumber: 4, teamId: 'thunderbolts-fc', sportId: 'football', role: 'player' as const, position: 'Defender', active: true },
  { id: 'p5', name: 'Vikram Joshi', jerseyNumber: 9, teamId: 'thunderbolts-fc', sportId: 'football', role: 'player' as const, position: 'Forward', active: true },
  // Phoenix United
  { id: 'p6', name: 'Aditya Sharma', jerseyNumber: 10, teamId: 'phoenix-united', sportId: 'football', role: 'captain' as const, position: 'Midfielder', active: true },
  { id: 'p7', name: 'Nikhil Verma', jerseyNumber: 5, teamId: 'phoenix-united', sportId: 'football', role: 'vice_captain' as const, position: 'Defender', active: true },
  { id: 'p8', name: 'Rajesh Nair', jerseyNumber: 9, teamId: 'phoenix-united', sportId: 'football', role: 'player' as const, position: 'Forward', active: true },
  { id: 'p9', name: 'Saurav Gupta', jerseyNumber: 1, teamId: 'phoenix-united', sportId: 'football', role: 'player' as const, position: 'Goalkeeper', active: true },
  { id: 'p10', name: 'Manish Tiwari', jerseyNumber: 3, teamId: 'phoenix-united', sportId: 'football', role: 'player' as const, position: 'Defender', active: true },
  // Storm Breakers XI (Cricket)
  { id: 'p11', name: 'Rahul Dravid Jr', jerseyNumber: 18, teamId: 'storm-breakers', sportId: 'cricket', role: 'captain' as const, position: 'Batsman', active: true },
  { id: 'p12', name: 'Ankit Rajput', jerseyNumber: 45, teamId: 'storm-breakers', sportId: 'cricket', role: 'vice_captain' as const, position: 'All-rounder', active: true },
  { id: 'p13', name: 'Pradeep Sangwan', jerseyNumber: 22, teamId: 'storm-breakers', sportId: 'cricket', role: 'player' as const, position: 'Bowler', active: true },
  // Golden Warriors (Cricket)
  { id: 'p14', name: 'Suresh Raina Jr', jerseyNumber: 3, teamId: 'golden-warriors', sportId: 'cricket', role: 'captain' as const, position: 'Batsman', active: true },
  { id: 'p15', name: 'Deepak Chahar Jr', jerseyNumber: 90, teamId: 'golden-warriors', sportId: 'cricket', role: 'vice_captain' as const, position: 'Bowler', active: true },
  // Add more players for each team...
  { id: 'p16', name: 'Akash Reddy', jerseyNumber: 8, teamId: 'spike-masters', sportId: 'volleyball', role: 'captain' as const, position: 'Setter', active: true },
  { id: 'p17', name: 'Harsh Pandey', jerseyNumber: 12, teamId: 'spike-masters', sportId: 'volleyball', role: 'vice_captain' as const, position: 'Spiker', active: true },
  { id: 'p18', name: 'Sameer Khan', jerseyNumber: 6, teamId: 'block-titans', sportId: 'volleyball', role: 'captain' as const, position: 'Libero', active: true },
  { id: 'p19', name: 'Yash Malhotra', jerseyNumber: 2, teamId: 'block-titans', sportId: 'volleyball', role: 'vice_captain' as const, position: 'Blocker', active: true },
  { id: 'p20', name: 'CyberX', jerseyNumber: 1, teamId: 'cyber-phantoms', sportId: 'counter-strike', role: 'captain' as const, position: 'AWPer', active: true },
  { id: 'p21', name: 'N3onBl4de', jerseyNumber: 2, teamId: 'neon-strikers', sportId: 'counter-strike', role: 'captain' as const, position: 'Entry Fragger', active: true },
];

// Create sample matches (mix of statuses)
export const SEED_MATCHES = [
  {
    id: 'match-1',
    sportId: 'football',
    matchNumber: 1,
    teamAId: 'thunderbolts-fc',
    teamBId: 'phoenix-united',
    participantA: { id: 'thunderbolts-fc', name: 'Thunderbolts FC', type: 'team' as const },
    participantB: { id: 'phoenix-united', name: 'Phoenix United', type: 'team' as const },
    venueId: 'main-arena',
    status: 'live' as const,
    score: { teamA: 2, teamB: 1, details: { period: '2nd Half', matchTime: 67 } },
    displayMode: 'single_landscape' as const,
    featured: true,
    allowReactions: true,
    allowVoting: true,
    allowRatings: true,
    allowReviews: true,
  },
  {
    id: 'match-2',
    sportId: 'cricket',
    matchNumber: 1,
    teamAId: 'storm-breakers',
    teamBId: 'golden-warriors',
    participantA: { id: 'storm-breakers', name: 'Storm Breakers XI', type: 'team' as const },
    participantB: { id: 'golden-warriors', name: 'Golden Warriors', type: 'team' as const },
    venueId: 'outdoor-field',
    status: 'live' as const,
    score: { teamA: 184, teamB: 0, details: { innings: 1, overs: 32, balls: 4, wickets: 4, target: null } },
    displayMode: 'dual_portrait' as const,
    featured: true,
    allowReactions: true,
    allowVoting: true,
    allowRatings: true,
    allowReviews: true,
  },
  {
    id: 'match-3',
    sportId: 'volleyball',
    matchNumber: 1,
    teamAId: 'spike-masters',
    teamBId: 'block-titans',
    participantA: { id: 'spike-masters', name: 'Spike Masters', type: 'team' as const },
    participantB: { id: 'block-titans', name: 'Block Titans', type: 'team' as const },
    venueId: 'indoor-court',
    status: 'upcoming' as const,
    score: { teamA: 0, teamB: 0, details: {} },
    displayMode: 'single_landscape' as const,
    featured: false,
    allowReactions: true,
    allowVoting: true,
    allowRatings: true,
    allowReviews: true,
  },
  {
    id: 'match-4',
    sportId: 'counter-strike',
    matchNumber: 1,
    teamAId: 'cyber-phantoms',
    teamBId: 'neon-strikers',
    participantA: { id: 'cyber-phantoms', name: 'Cyber Phantoms', type: 'team' as const },
    participantB: { id: 'neon-strikers', name: 'Neon Strikers', type: 'team' as const },
    venueId: 'gaming-hub',
    status: 'completed' as const,
    score: { teamA: 16, teamB: 12, details: { map: 'Dust II', rounds: 28 } },
    displayMode: 'single_landscape' as const,
    featured: false,
    allowReactions: true,
    allowVoting: false,
    allowRatings: true,
    allowReviews: true,
  },
  {
    id: 'match-5',
    sportId: 'football',
    matchNumber: 2,
    teamAId: 'iron-wolves',
    teamBId: 'royal-eagles',
    participantA: { id: 'iron-wolves', name: 'Iron Wolves', type: 'team' as const },
    participantB: { id: 'royal-eagles', name: 'Royal Eagles', type: 'team' as const },
    venueId: 'outdoor-field',
    status: 'scheduled' as const,
    score: { teamA: 0, teamB: 0, details: {} },
    displayMode: 'dual_portrait' as const,
    featured: false,
    allowReactions: true,
    allowVoting: true,
    allowRatings: true,
    allowReviews: true,
  },
];

export const SEED_TOURNAMENTS = [
  {
    id: 'olympia-cup-2026',
    name: 'Olympia Cup 2026',
    sportId: 'football',
    description: 'The flagship football tournament of Olympia 2K26',
    format: 'knockout' as const,
    status: 'ongoing' as const,
  },
  {
    id: 'cricket-championship',
    name: 'Cricket Championship',
    sportId: 'cricket',
    description: 'Premier cricket tournament',
    format: 'league' as const,
    status: 'ongoing' as const,
  },
];

export const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'OLYMPIA 2K26 IS HERE',
    description: 'The biggest sports event of the year kicks off! Enter the arena and witness greatness.',
    priority: 1,
    active: true,
  },
  {
    id: 'ann-2',
    title: 'Football Finals This Weekend',
    description: 'The Olympia Cup 2026 football finals are scheduled for this weekend. Don\'t miss the action!',
    priority: 2,
    active: true,
  },
];
