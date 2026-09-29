import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { MatchCard } from '@/components/matches/MatchCard';
import { Footer } from '@/components/arena/Footer';

export const Matches: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col">
      <Container className="flex-1 pb-24">
        <SectionTitle title="ALL MATCHES" subtitle="Complete arena schedule" />
        
        <div className="flex space-x-4 mb-8 overflow-x-auto hide-scrollbar pb-2">
          {['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'].map((tab, i) => (
            <button key={tab} className={`px-6 py-2 font-bold tracking-widest text-sm uppercase ${i === 0 ? 'bg-[#D9A441] text-[#080A0D]' : 'bg-transparent border border-white/20 text-white/70 hover:border-[#1264FF] hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MatchCard id="1" sport="Basketball" teamA="Eagles" teamB="Sharks" scoreA={89} scoreB={84} status="live" time="Q4 02:14" />
          <MatchCard id="2" sport="Football" teamA="Tigers" teamB="Lions" scoreA={2} scoreB={1} status="live" time="78'" />
          <MatchCard id="3" sport="Volleyball" teamA="Spikers" teamB="Blockers" status="upcoming" time="Tomorrow, 14:00" />
          <MatchCard id="5" sport="Tennis" teamA="Player 1" teamB="Player 2" scoreA={3} scoreB={1} status="completed" time="Yesterday" />
        </div>
      </Container>
      <Footer />
    </div>
  );
};
