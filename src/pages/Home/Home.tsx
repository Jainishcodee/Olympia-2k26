import React from 'react';
import { HeroSection } from '@/components/arena/HeroSection';
import { LiveNowSection } from '@/components/arena/LiveNowSection';
import { SportsUniverse } from '@/components/arena/SportsUniverse';
import { FeaturedMatch } from '@/components/arena/FeaturedMatch';
import { UpcomingMatches } from '@/components/arena/UpcomingMatches';
import { TournamentSection } from '@/components/arena/TournamentSection';
import { ArenaLeaderboardPreview } from '@/components/arena/ArenaLeaderboardPreview';
import { ArenaMotivationalBanner } from '@/components/arena/ArenaMotivationalBanner';
import { Footer } from '@/components/arena/Footer';
import { ScrollProgress } from '@/components/arena/ScrollProgress';
import { useCollection } from '@/hooks/useCollection';
import { Sport } from '@/types';
import { PageLoading } from '@/components/admin/kit';
import { useTheme } from '@/contexts/ThemeContext';
import { InteractiveParticleCanvas, VelocityMarquee } from '@/components/motion';

const SportsUniverseWrapper: React.FC = () => {
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });
  
  if (sports.isLoading) return <PageLoading label="Loading sports…" />;
  if (sports.error || !sports.data.length) return null;
  
  return <SportsUniverse sports={sports.data.filter(s => s.active)} />;
};

export const Home: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${
        isDay
          ? 'bg-gradient-to-b from-[#7FA2C7] via-[#A9C4DF] via-25% via-[#D6E5F1] via-60% via-[#F5F8FA] via-85% to-[#FFFFFF] text-[#071426]'
          : 'bg-[#080A0D] text-white'
      }`}
    >
      {/* Blue-Hour Atmospheric Ambient Blooms */}
      {isDay && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[12%] left-1/4 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-white/80 via-[#D6E5F1]/30 to-transparent blur-[130px]" />
          <div className="absolute top-[38%] right-10 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-[#A9C4DF]/35 via-white/50 to-transparent blur-[140px]" />
          <div className="absolute top-[65%] left-10 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-[#FFF8E8]/40 via-[#F5F8FA]/60 to-transparent blur-[140px]" />
        </div>
      )}

      <ScrollProgress />
      <InteractiveParticleCanvas />

      <HeroSection />

      {/* Kinetic Velocity Marquee Banner */}
      <div
        className={`py-4 border-y overflow-hidden transition-colors duration-300 relative z-10 ${
          isDay
            ? 'bg-white/85 backdrop-blur-md border-[#071426]/10 text-[#071426] shadow-sm'
            : 'bg-[#040B17]/90 border-white/10 text-white'
        }`}
      >
        <VelocityMarquee baseVelocity={1.5} className="text-xs md:text-sm tracking-[0.3em] font-black uppercase">
          <span className="text-[#D9A441]">★</span>
          <span>OLYMPIA 2K26</span>
          <span className="text-[#1264FF]">/</span>
          <span>LIVE BROADCAST TELEMETRY</span>
          <span className="text-[#D9A441]">★</span>
          <span>CHOOSE YOUR PLAY</span>
          <span className="text-[#FF4D3D]">/</span>
          <span>REAL-TIME SCORING HUB</span>
        </VelocityMarquee>
      </div>

      <LiveNowSection />
      <SportsUniverseWrapper />

      {/* Reverse Velocity Ribbon */}
      <div
        className={`py-3.5 border-y overflow-hidden transition-colors duration-300 relative z-10 ${
          isDay
            ? 'bg-[#071426] border-[#071426] text-[#FFD21F] shadow-md'
            : 'bg-[#071426] border-white/5 text-[#D9A441]'
        }`}
      >
        <VelocityMarquee baseVelocity={-1.8} className="text-[11px] md:text-xs tracking-[0.28em] font-black uppercase">
          <span>HIGH-OCTANE CLASHES</span>
          <span className="opacity-40">•</span>
          <span>UNRIVALED ARENA</span>
          <span className="opacity-40">•</span>
          <span>24 CONTENDER TEAMS</span>
          <span className="opacity-40">•</span>
          <span>INSTANT FAN BALLOTS</span>
          <span className="opacity-40">•</span>
        </VelocityMarquee>
      </div>

      <FeaturedMatch />
      <UpcomingMatches />
      <TournamentSection />
      
      {/* Live Leaderboard Preview for the Arena */}
      <ArenaLeaderboardPreview />

      {/* Motivational Championship Billboard Banner */}
      <ArenaMotivationalBanner />

      <Footer />
    </div>
  );
};

export default Home;
