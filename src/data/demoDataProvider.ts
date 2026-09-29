import { SEED_SPORTS, SEED_TEAMS, SEED_PLAYERS, SEED_MATCHES, SEED_TOURNAMENTS, SEED_ANNOUNCEMENTS, SEED_VENUES } from './seedData';

// Functions that mirror the service layer but return seed data
export const getDemoSports = () => SEED_SPORTS;
export const getDemoTeams = (sportId?: string) => sportId ? SEED_TEAMS.filter(t => t.sportId === sportId) : SEED_TEAMS;
export const getDemoPlayers = (teamId?: string) => teamId ? SEED_PLAYERS.filter(p => p.teamId === teamId) : SEED_PLAYERS;
export const getDemoMatches = (status?: string) => status ? SEED_MATCHES.filter(m => m.status === status) : SEED_MATCHES;
export const getDemoMatch = (id: string) => SEED_MATCHES.find(m => m.id === id);
export const getDemoTournaments = () => SEED_TOURNAMENTS;
export const getDemoAnnouncements = () => SEED_ANNOUNCEMENTS;
export const getDemoVenues = () => SEED_VENUES;
export const getDemoLiveMatches = () => SEED_MATCHES.filter(m => m.status === 'live');
export const getDemoFeaturedMatches = () => SEED_MATCHES.filter(m => m.featured);
