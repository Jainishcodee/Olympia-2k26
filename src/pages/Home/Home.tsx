import React from 'react';
import { HeroSection } from '@/components/arena/HeroSection';
import { LiveNowSection } from '@/components/arena/LiveNowSection';
import { SportsUniverse } from '@/components/arena/SportsUniverse';
import { FeaturedMatch } from '@/components/arena/FeaturedMatch';
import { UpcomingMatches } from '@/components/arena/UpcomingMatches';
import { TournamentSection } from '@/components/arena/TournamentSection';
import { AnnouncementBanner } from '@/components/arena/AnnouncementBanner';
import { Footer } from '@/components/arena/Footer';
import { ScrollProgress } from '@/components/arena/ScrollProgress';
import { useCollection } from '@/hooks/useCollection';
import { Sport } from '@/types';
import { PageLoading } from '@/components/admin/kit';
import { useTheme } from '@/contexts/ThemeContext';

const SportsUniverseWrapper: React.FC = () => {
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  
  if (sports.isLoading) return <PageLoading label="Loading sports…" />;
  if (sports.error || !sports.data.length) return null;
  
  return <SportsUniverse sports={sports.data.filter(s => s.active)} />;
};

export const Home: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen overflow-x-hidden ${theme === 'day' ? 'bg-page text-ink' : 'bg-[#080A0D] text-white'}`}>
      <ScrollProgress />

      {/* Hero owns the first screen; the ticker becomes the hand-off
          into the scrolled experience rather than competing with it. */}
      <HeroSection />
      <AnnouncementBanner />

      <LiveNowSection />
      <SportsUniverseWrapper />
      <FeaturedMatch />
      <UpcomingMatches />
      <TournamentSection />
      <Footer />
    </div>
  );
};

export default Home;
