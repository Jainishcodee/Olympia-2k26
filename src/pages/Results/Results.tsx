import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';
import { MatchCard } from '@/components/matches/MatchCard';

export const Results: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col">
      <Container className="flex-1 pb-24">
        <SectionTitle title="RESULTS" subtitle="History is written" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MatchCard id="5" sport="Tennis" teamA="Player 1" teamB="Player 2" scoreA={3} scoreB={1} status="completed" time="Yesterday" />
          <MatchCard id="6" sport="Basketball" teamA="Eagles" teamB="Titans" scoreA={102} scoreB={98} status="completed" time="Oct 12" />
        </div>
      </Container>
      <Footer />
    </div>
  );
};
