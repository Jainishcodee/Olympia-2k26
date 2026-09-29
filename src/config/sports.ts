export interface SportConfig {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  gradient: string[];
  accent: string;
  liveCount: number;
  upcomingCount: number;
  teamCount: number;
}

export const SPORTS_CONFIG: SportConfig[] = [
  {
    id: 'football',
    name: 'Football',
    slug: 'football',
    icon: '⚽',
    description: 'The beautiful game. 11v11 on the pitch.',
    gradient: ['#1B4F72', '#0D2B4A'],
    accent: '#1264FF',
    liveCount: 2,
    upcomingCount: 5,
    teamCount: 8,
  },
  {
    id: 'cricket',
    name: 'Cricket',
    slug: 'cricket',
    icon: '🏏',
    description: 'Bat meets ball. Strategic team sport.',
    gradient: ['#2D6A2D', '#163D16'],
    accent: '#22C55E',
    liveCount: 1,
    upcomingCount: 3,
    teamCount: 6,
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    slug: 'volleyball',
    icon: '🏐',
    description: 'Spike, set, and serve to victory.',
    gradient: ['#7C2D12', '#431407'],
    accent: '#F97316',
    liveCount: 0,
    upcomingCount: 4,
    teamCount: 5,
  },
  {
    id: 'hand-tennis',
    name: 'Hand Tennis',
    slug: 'hand-tennis',
    icon: '✋',
    description: 'Fast-paced hand tennis action.',
    gradient: ['#4C1D95', '#2E1065'],
    accent: '#A855F7',
    liveCount: 0,
    upcomingCount: 2,
    teamCount: 4,
  },
  {
    id: 'counter-strike',
    name: 'Counter-Strike',
    slug: 'counter-strike',
    icon: '🎮',
    description: 'Tactical FPS esports action.',
    gradient: ['#111827', '#030712'],
    accent: '#FFD21F',
    liveCount: 1,
    upcomingCount: 2,
    teamCount: 4,
  },
];