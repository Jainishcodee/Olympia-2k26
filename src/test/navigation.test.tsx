import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { TiltCard } from '../components/motion/TiltCard';
import { Leaderboard } from '../pages/Leaderboard/Leaderboard';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

// Mock Firebase collections
vi.mock('../hooks/useCollection', () => ({
  useCollection: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../contexts/FirebaseContext', () => ({
  FirebaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFirebase: () => ({
    auth: {},
    db: {},
    storage: {},
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    isAdmin: false,
    loading: false,
  }),
}));

vi.mock('../contexts/LiveMatchContext', () => ({
  LiveMatchProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLiveMatch: () => ({
    matches: [],
    currentMatch: null,
  }),
}));

describe('TiltCard Hook Stability', () => {
  it('mounts, handles mouse events, and unmounts cleanly without hook errors', () => {
    const { unmount, container } = render(
      <TiltCard glowColor="rgba(21, 94, 239, 0.25)" cursorLabel="TEST">
        <div data-testid="card-child">Card Content</div>
      </TiltCard>
    );

    expect(screen.getByTestId('card-child')).toBeDefined();

    // Trigger mouse enter and mouse move
    const element = container.querySelector('[data-cursor-label="TEST"]');
    expect(element).toBeDefined();

    if (element) {
      act(() => {
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100, bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      });
    }

    // Verify unmount occurs without throwing any React Rules of Hooks errors
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});

describe('Navigation and Route Flow', () => {
  const PublicLayoutTest: React.FC = () => {
    return (
      <div data-testid="public-layout">
        <header>
          <nav>
            <Link to="/" data-testid="nav-home">Home</Link>
            <Link to="/leaderboard" data-testid="nav-leaderboard">Leaderboard</Link>
            <Link to="/live" data-testid="nav-live">Live</Link>
            <Link to="/matches" data-testid="nav-matches">Matches</Link>
            <Link to="/sports" data-testid="nav-sports">Sports</Link>
            <Link to="/teams" data-testid="nav-teams">Teams</Link>
            <Link to="/players" data-testid="nav-players">Players</Link>
            <Link to="/results" data-testid="nav-results">Results</Link>
          </nav>
        </header>
        <AnimatePresence mode="wait" initial={false}>
          <main>
            <Outlet />
          </main>
        </AnimatePresence>
      </div>
    );
  };

  const TestApp = ({ initialEntries = ['/'] }: { initialEntries?: string[] }) => {
    return (
      <ThemeProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route element={<PublicLayoutTest />}>
              <Route path="/" element={<div data-testid="arena-home">Arena Home View</div>} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/live" element={<div data-testid="live-view">Live View</div>} />
              <Route path="/matches" element={<div data-testid="matches-view">Matches View</div>} />
              <Route path="/sports" element={<div data-testid="sports-view">Sports View</div>} />
              <Route path="/teams" element={<div data-testid="teams-view">Teams View</div>} />
              <Route path="/players" element={<div data-testid="players-view">Players View</div>} />
              <Route path="/results" element={<div data-testid="results-view">Results View</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders home page without white screen', () => {
    render(<TestApp initialEntries={['/']} />);
    expect(screen.getByTestId('public-layout')).toBeDefined();
    expect(screen.getByTestId('arena-home')).toBeDefined();
  });

  it('navigates from Leaderboard back to Home cleanly without unmount crash or blank screen', () => {
    // Start on Leaderboard
    const { unmount } = render(<TestApp initialEntries={['/leaderboard']} />);

    // Verify Leaderboard rendered
    expect(screen.getByTestId('public-layout')).toBeDefined();

    // Click nav to Home
    const homeLink = screen.getByTestId('nav-home');
    act(() => {
      homeLink.click();
    });

    // Verify Home view is now rendered and active
    expect(screen.getByTestId('arena-home')).toBeDefined();

    // Click nav back to Leaderboard
    const leaderboardLink = screen.getByTestId('nav-leaderboard');
    act(() => {
      leaderboardLink.click();
    });

    // Click nav back to Home again
    act(() => {
      homeLink.click();
    });

    expect(screen.getByTestId('arena-home')).toBeDefined();

    unmount();
  });

  it('navigates through all public pages seamlessly without crashing or freezing', () => {
    const { unmount } = render(<TestApp initialEntries={['/']} />);

    const routesToTest = [
      { testId: 'nav-live', viewId: 'live-view' },
      { testId: 'nav-matches', viewId: 'matches-view' },
      { testId: 'nav-sports', viewId: 'sports-view' },
      { testId: 'nav-teams', viewId: 'teams-view' },
      { testId: 'nav-players', viewId: 'players-view' },
      { testId: 'nav-leaderboard', viewId: 'public-layout' },
      { testId: 'nav-results', viewId: 'results-view' },
      { testId: 'nav-home', viewId: 'arena-home' },
    ];

    for (const route of routesToTest) {
      const link = screen.getByTestId(route.testId);
      act(() => {
        link.click();
      });
      expect(screen.getByTestId(route.viewId)).toBeDefined();
    }

    unmount();
  });
});
