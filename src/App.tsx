import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { LiveMatchProvider } from './contexts/LiveMatchContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Navbar } from './components/navigation/Navbar';
import { CustomCursor } from './components/navigation/CustomCursor';
import { LoadingScreen } from './components/arena/LoadingScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Spinner } from './components/ui/Spinner';
import { BRAND } from './components/arena/BrandAssets';


// Lazy load public pages
const Home = lazy(() => import('./pages/Home/Home'));
const Live = lazy(() => import('./pages/Live/Live'));
const Matches = lazy(() => import('./pages/Matches/Matches').then(m => ({ default: m.Matches || (m as any).default })));
const MatchDetail = lazy(() => import('./pages/MatchDetail/MatchDetail').then(m => ({ default: m.MatchDetail || (m as any).default })));
const Sports = lazy(() => import('./pages/Sports/Sports'));
const SportDetail = lazy(() => import('./pages/Sports/SportDetail'));
const Teams = lazy(() => import('./pages/Teams/Teams'));
const TeamDetail = lazy(() => import('./pages/Teams/TeamDetail'));
const Players = lazy(() => import('./pages/Players/Players'));
const PlayerDetail = lazy(() => import('./pages/Players/PlayerDetail'));
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard').then(m => ({ default: m.Leaderboard || (m as any).default })));
const Results = lazy(() => import('./pages/Results/Results').then(m => ({ default: m.Results || (m as any).default })));
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin'));

// Lazy load admin pages (all use default exports)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const LiveControl = lazy(() => import('./pages/AdminDashboard/LiveControl'));
const ScoringConsole = lazy(() => import('./pages/AdminDashboard/ScoringConsole'));
const MatchesManager = lazy(() => import('./pages/AdminDashboard/MatchesManager'));
const MatchEditor = lazy(() => import('./pages/AdminDashboard/MatchEditor'));
const AdminMatchDetail = lazy(() => import('./pages/AdminDashboard/MatchDetail'));
const FixturesManager = lazy(() => import('./pages/AdminDashboard/FixturesManager'));
const FixtureEditor = lazy(() => import('./pages/AdminDashboard/FixtureEditor'));
const FixtureDetail = lazy(() => import('./pages/AdminDashboard/FixtureDetail'));
const SportsManager = lazy(() => import('./pages/AdminDashboard/SportsManager'));
const AdminSportDetail = lazy(() => import('./pages/AdminDashboard/SportDetail'));
const TeamsManager = lazy(() => import('./pages/AdminDashboard/TeamsManager'));
const TeamEditor = lazy(() => import('./pages/AdminDashboard/TeamEditor'));
const AdminTeamDetail = lazy(() => import('./pages/AdminDashboard/TeamDetail'));
const PlayersManager = lazy(() => import('./pages/AdminDashboard/PlayersManager'));
const PlayerEditor = lazy(() => import('./pages/AdminDashboard/PlayerEditor'));
const AdminPlayerDetail = lazy(() => import('./pages/AdminDashboard/PlayerDetail'));
const TournamentsManager = lazy(() => import('./pages/AdminDashboard/TournamentsManager'));
const TournamentEditor = lazy(() => import('./pages/AdminDashboard/TournamentEditor'));
const TournamentDetail = lazy(() => import('./pages/AdminDashboard/TournamentDetail'));
const VenuesManager = lazy(() => import('./pages/AdminDashboard/VenuesManager'));
const VenueEditor = lazy(() => import('./pages/AdminDashboard/VenueEditor'));
const VenueDetail = lazy(() => import('./pages/AdminDashboard/VenueDetail'));
const AnnouncementsManager = lazy(() => import('./pages/AdminDashboard/AnnouncementsManager'));
const AnnouncementEditor = lazy(() => import('./pages/AdminDashboard/AnnouncementEditor'));
const AnnouncementDetail = lazy(() => import('./pages/AdminDashboard/AnnouncementDetail'));
const ReactionsManager = lazy(() => import('./pages/AdminDashboard/ReactionsManager'));
const RatingsManager = lazy(() => import('./pages/AdminDashboard/RatingsManager'));
const ReviewsManager = lazy(() => import('./pages/AdminDashboard/ReviewsManager'));
const VotesManager = lazy(() => import('./pages/AdminDashboard/VotesManager'));
const AdminsManager = lazy(() => import('./pages/AdminDashboard/AdminsManager'));
const AdminEditor = lazy(() => import('./pages/AdminDashboard/AdminEditor'));
const SettingsPage = lazy(() => import('./pages/AdminDashboard/SettingsPage'));
const AuditLogPage = lazy(() => import('./pages/AdminDashboard/AuditLogPage'));
const ScoringSimulator = lazy(() => import('./pages/AdminDashboard/ScoringSimulator'));
const LeaderboardsManager = lazy(() => import('./pages/AdminDashboard/LeaderboardsManager'));

// Layout components
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';

// Admin loading fallback
const AdminLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Spinner size="lg" />
  </div>
);

/** Wrap an admin page in its Suspense boundary without repeating it 40×. */
const adminPage = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<AdminLoadingFallback />}>
    <Component />
  </Suspense>
);

/** `/admin/live-control/:matchId` → the canonical scoring route. */
const LegacyScoringRedirect = () => {
  const { matchId } = useParams<{ matchId: string }>();
  return <Navigate to={`/admin/matches/${matchId}/scoring`} replace />;
};

// Public loading fallback
const PublicLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#080A0D]">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-[#D9A441] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[#D9A441]/60 text-sm tracking-widest uppercase">Loading</p>
    </div>
  </div>
);

// Route-change sweep — adaptive gold/blue in day, starlight cyan/white in night
const RouteSweep: React.FC = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <motion.div
      key={location.pathname}
      aria-hidden
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left"
      style={{
        background: isDay
          ? 'linear-gradient(90deg, #1264FF 0%, #D9A441 55%, #FFD21F 100%)'
          : 'linear-gradient(90deg, #1264FF 0%, #38BDF8 40%, #FFFFFF 65%, #93C5FD 100%)',
      }}
    />
  );
};

const GlobalBackground: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme === 'day') {
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.12] bg-cover bg-center bg-no-repeat bg-fixed" 
        style={{ backgroundImage: `url(${BRAND.arena})` }} 
      />
    );
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Night mode arena backdrop with atmospheric stadium lighting */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed opacity-[0.18] mix-blend-screen scale-105" 
        style={{ backgroundImage: `url(${BRAND.arena})` }} 
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 10%, rgba(18,100,255,0.18) 0%, rgba(7,20,38,0.88) 50%, #080A0D 100%)'
        }}
      />
      <div 
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[500px] rounded-full blur-[140px] opacity-30"
        style={{ background: 'radial-gradient(circle, #1264FF 0%, #38BDF8 35%, rgba(226,232,240,0.12) 65%, transparent 80%)' }}
      />
    </div>
  );
};

import { MobileBottomNav } from './components/navigation/MobileBottomNav';

// Public layout wrapper (persistent layout using Outlet for smooth, freeze-free route transitions)
const PublicLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <>
      <GlobalBackground />
      <Navbar />
      <RouteSweep />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen pb-16 lg:pb-0"
        >
          <Suspense fallback={<PublicLoadingFallback />}>
            {children ?? <Outlet />}
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <MobileBottomNav />
    </>
  );
};

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        return true; // Direct access to admin routes skips loading screen
      }
    }
    return false;
  });

  return (
    <ErrorBoundary>
      <ThemeProvider>
      <FirebaseProvider>
        <AuthProvider>
          <LiveMatchProvider>
            <MotionConfig reducedMotion="user">
            <Router>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line-strong)',
                  },
                  success: {
                    iconTheme: { primary: 'var(--gold)', secondary: 'var(--surface)' },
                  },
                  error: {
                    iconTheme: { primary: 'var(--coral)', secondary: 'var(--surface)' },
                  },
                }}
              />

              {/* Loading screen - only on first visit; AnimatePresence so the
                  curtain actually wipes away instead of vanishing */}
              <AnimatePresence mode="wait">
                {!isLoaded && <LoadingScreen key="loading-screen" onComplete={() => setIsLoaded(true)} />}
              </AnimatePresence>

              {isLoaded && (
                <>
                  {/* Custom cursor for desktop */}
                  <CustomCursor />

                  <Routes>
                    {/* ============================================ */}
                    {/* PUBLIC ROUTES (Persistent PublicLayout)      */}
                    {/* ============================================ */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/live" element={<Live />} />
                      <Route path="/matches" element={<Matches />} />
                      <Route path="/match/:matchId" element={<MatchDetail />} />
                      <Route path="/tournaments" element={<Navigate to="/matches" replace />} />
                      <Route path="/sports" element={<Sports />} />
                      <Route path="/sports/:sportSlug" element={<SportDetail />} />
                      <Route path="/teams" element={<Teams />} />
                      <Route path="/teams/:teamId" element={<TeamDetail />} />
                      <Route path="/players" element={<Players />} />
                      <Route path="/players/:playerId" element={<PlayerDetail />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/results" element={<Results />} />
                    </Route>

                    {/* Admin Login (public access, no navbar) */}
                    <Route path="/admin/login" element={
                      <Suspense fallback={<AdminLoadingFallback />}>
                        <AdminLogin />
                      </Suspense>
                    } />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES (Protected)                     */}
                    {/* Persistent AdminLayout sidebar + <Outlet/>   */}
                    {/* ============================================ */}
                    <Route path="/admin" element={<ProtectedRoute />}>
                      <Route element={<AdminLayout />}>
                        {/* ---- Overview ------------------------------- */}
                        <Route index element={adminPage(AdminDashboard)} />
                        <Route path="live" element={adminPage(LiveControl)} />

                        {/* ---- Competition ---------------------------- */}
                        <Route path="matches" element={adminPage(MatchesManager)} />
                        <Route path="matches/create" element={adminPage(MatchEditor)} />
                        <Route path="matches/:matchId" element={adminPage(AdminMatchDetail)} />
                        <Route path="matches/:matchId/edit" element={adminPage(MatchEditor)} />
                        <Route path="matches/:matchId/scoring" element={adminPage(ScoringConsole)} />

                        <Route path="fixtures" element={adminPage(FixturesManager)} />
                        <Route path="fixtures/create" element={adminPage(FixtureEditor)} />
                        <Route path="fixtures/:fixtureId" element={adminPage(FixtureDetail)} />
                        <Route path="fixtures/:fixtureId/edit" element={adminPage(FixtureEditor)} />

                        <Route path="tournaments" element={adminPage(TournamentsManager)} />
                        <Route path="tournaments/create" element={adminPage(TournamentEditor)} />
                        <Route path="tournaments/:tournamentId" element={adminPage(TournamentDetail)} />
                        <Route path="tournaments/:tournamentId/edit" element={adminPage(TournamentEditor)} />

                        <Route path="sports" element={adminPage(SportsManager)} />
                        <Route path="sports/:sportId" element={adminPage(AdminSportDetail)} />
                        <Route path="leaderboard" element={adminPage(LeaderboardsManager)} />

                        {/* ---- People --------------------------------- */}
                        <Route path="teams" element={adminPage(TeamsManager)} />
                        <Route path="teams/create" element={adminPage(TeamEditor)} />
                        <Route path="teams/:teamId" element={adminPage(AdminTeamDetail)} />
                        <Route path="teams/:teamId/roster" element={adminPage(AdminTeamDetail)} />
                        <Route path="teams/:teamId/edit" element={adminPage(TeamEditor)} />

                        <Route path="players" element={adminPage(PlayersManager)} />
                        <Route path="players/create" element={adminPage(PlayerEditor)} />
                        <Route path="players/:playerId" element={adminPage(AdminPlayerDetail)} />
                        <Route path="players/:playerId/edit" element={adminPage(PlayerEditor)} />

                        <Route path="venues" element={adminPage(VenuesManager)} />
                        <Route path="venues/create" element={adminPage(VenueEditor)} />
                        <Route path="venues/:venueId" element={adminPage(VenueDetail)} />
                        <Route path="venues/:venueId/edit" element={adminPage(VenueEditor)} />

                        {/* ---- Engagement ----------------------------- */}
                        <Route path="reactions" element={adminPage(ReactionsManager)} />
                        <Route path="ratings" element={adminPage(RatingsManager)} />
                        <Route path="reviews" element={adminPage(ReviewsManager)} />
                        <Route path="votes" element={adminPage(VotesManager)} />

                        {/* ---- Content -------------------------------- */}
                        <Route path="announcements" element={adminPage(AnnouncementsManager)} />
                        <Route path="announcements/create" element={adminPage(AnnouncementEditor)} />
                        <Route path="announcements/:announcementId" element={adminPage(AnnouncementDetail)} />
                        <Route path="announcements/:announcementId/edit" element={adminPage(AnnouncementEditor)} />

                        {/* ---- System --------------------------------- */}
                        <Route path="admins" element={adminPage(AdminsManager)} />
                        <Route path="admins/create" element={adminPage(AdminEditor)} />
                        <Route path="admins/:adminId/edit" element={adminPage(AdminEditor)} />
                        <Route path="settings" element={adminPage(SettingsPage)} />
                        <Route path="audit" element={adminPage(AuditLogPage)} />
                        <Route path="scoring-simulator" element={adminPage(ScoringSimulator)} />

                        {/* ---- Legacy paths (pre-restructure) --------- */}
                        <Route path="live-control" element={<Navigate to="/admin/live" replace />} />
                        <Route path="live-control/:matchId" element={<LegacyScoringRedirect />} />
                        <Route path="scoring/:matchId" element={<LegacyScoringRedirect />} />
                        <Route path="administrators" element={<Navigate to="/admin/admins" replace />} />
                        <Route path="administrators/create" element={<Navigate to="/admin/admins/create" replace />} />
                        <Route path="matches/new" element={<Navigate to="/admin/matches/create" replace />} />
                        <Route path="teams/new" element={<Navigate to="/admin/teams/create" replace />} />
                        <Route path="players/new" element={<Navigate to="/admin/players/create" replace />} />
                        <Route path="venues/new" element={<Navigate to="/admin/venues/create" replace />} />
                        <Route path="tournaments/new" element={<Navigate to="/admin/tournaments/create" replace />} />
                        <Route path="announcements/new" element={<Navigate to="/admin/announcements/create" replace />} />
                        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
                      </Route>
                    </Route>

                    {/* 404 Fallback */}
                    <Route path="*" element={
                      <Suspense fallback={<PublicLoadingFallback />}>
                        <PublicLayout>
                          <div className="min-h-screen flex items-center justify-center bg-[#080A0D]">
                            <div className="text-center">
                              <h1 className="text-8xl font-black text-gradient-gold mb-4">404</h1>
                              <p className="text-xl text-white/60 mb-8">This arena doesn't exist</p>
                              <Link to="/" className="px-8 py-3 bg-[#D9A441] text-[#071426] font-bold rounded-lg hover:bg-[#FFD21F] transition-colors">
                                RETURN TO ARENA
                              </Link>
                            </div>
                          </div>
                        </PublicLayout>
                      </Suspense>
                    } />
                  </Routes>
                </>
              )}
            </Router>
            </MotionConfig>
          </LiveMatchProvider>
        </AuthProvider>
      </FirebaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
