import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { MatchCard } from '@/components/matches/MatchCard';
import { Footer } from '@/components/arena/Footer';

export const Live: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080A0D] pt-32 text-white">
      <Container className="pb-24">
        <SectionTitle 
          title={
            <div className="flex items-center">
              LIVE ARENA
              <span className="ml-4 w-4 h-4 bg-[#FF4D3D] rounded-full animate-pulse shadow-[0_0_15px_#FF4D3D]" />
            </div>
          } 
          subtitle="Real-time action across all disciplines" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MatchCard id="1" sport="Basketball" teamA="Eagles" teamB="Sharks" scoreA={89} scoreB={84} status="live" time="Q4 02:14" />
          <MatchCard id="2" sport="Football" teamA="Tigers" teamB="Lions" scoreA={2} scoreB={1} status="live" time="78'" />
        </div>
      </Container>
      <Footer />
    </div>
  );
};

export default Live;
