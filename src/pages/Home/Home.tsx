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

const SportsUniverseWrapper: React.FC = () => {
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  
  if (sports.isLoading) return <PageLoading label="Loading sports…" />;
  if (sports.error || !sports.data.length) return null;
  
  return <SportsUniverse sports={sports.data.filter(s => s.active)} />;
};

export const Home: React.FC = () => {
  return (
    <div className="bg-[#080A0D] min-h-screen text-white overflow-x-hidden">
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
