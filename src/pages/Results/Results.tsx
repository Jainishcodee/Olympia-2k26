import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';
import { MatchCard } from '@/components/matches/MatchCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { Match, Sport } from '@/types';
import { Trophy, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ResultItem {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'completed';
  time: string;
}



export const Results: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { data: firestoreMatches, isLoading } = useCollection<Match>('matches');
  const { data: firestoreSports } = useCollection<Sport>('sports');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const sportsMap = new Map<string, string>();
  firestoreSports?.forEach(s => sportsMap.set(s.id, s.name));

  const liveResultItems: ResultItem[] = (firestoreMatches || [])
    .filter(m => m.status === 'completed')
    .map(m => ({
      id: m.id,
      sport: sportsMap.get(m.sportId) || 'Sports',
      teamA: m.participantA?.name || m.teamAId || 'Team A',
      teamB: m.participantB?.name || m.teamBId || 'Team B',
      scoreA: m.score?.teamA ?? 0,
      scoreB: m.score?.teamB ?? 0,
      status: 'completed',
      time: 'Final',
    }));

  const displayMatches = liveResultItems;
  const sports = ['All', ...Array.from(new Set(displayMatches.map(m => m.sport)))];

  const filteredMatches = displayMatches.filter(m => {
    const matchesSport = selectedSport === 'All' || m.sport.toLowerCase() === selectedSport.toLowerCase();
    const matchesSearch = !searchQuery || 
      m.teamA.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.teamB.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <div
      className={cn(
        "min-h-screen pt-28 pb-16 flex flex-col justify-between transition-colors",
        isDay ? "bg-[#F7F6F1] text-[#071426]" : "bg-[#080A0D] text-white"
      )}
    >
      <Container className="flex-1 pb-16 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b pb-8" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.08)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-[#D9A441]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#D9A441]">Official Records</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter">
              CHAMPIONSHIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] to-[#FFD21F]">RESULTS</span>
            </h1>
            <p className={cn("mt-2 text-sm sm:text-base font-medium max-w-xl", isDay ? "text-[#071426]/70" : "text-white/60")}>
              Verified outcomes, match statistics, and archival scorelines across all tournament fixtures.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-72 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search match records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2",
                isDay
                  ? "bg-white border-[#071426]/10 text-[#071426] focus:ring-[#155EEF]/30"
                  : "bg-white/5 border-white/10 text-white focus:ring-[#FFD21F]/30"
              )}
            />
          </div>
        </div>

        {/* Sport Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 smooth-scroll-x hide-scrollbar">
          {sports.map(sport => {
            const isSelected = selectedSport === sport;
            return (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                  isSelected
                    ? isDay
                      ? "bg-[#155EEF] text-white border-[#155EEF] shadow-md"
                      : "bg-[#D9A441] text-[#080A0D] border-[#D9A441] shadow-lg shadow-[#D9A441]/20 font-black"
                    : isDay
                      ? "bg-white/80 border-[#071426]/10 text-[#071426]/70 hover:bg-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}
              >
                {sport}
              </button>
            );
          })}
        </div>

        {/* Results Grid */}
        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map(m => (
              <MatchCard
                key={m.id}
                id={m.id}
                sport={m.sport}
                teamA={m.teamA}
                teamB={m.teamB}
                scoreA={m.scoreA}
                scoreB={m.scoreB}
                status={m.status}
                time={m.time}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "py-20 rounded-3xl border text-center flex flex-col items-center justify-center p-8",
              isDay ? "bg-white/60 border-[#071426]/10" : "bg-white/5 border-white/10"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center justify-center mb-4 text-[#D9A441]">
              <Trophy size={28} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">No Match Records Found</h3>
            <p className={cn("text-xs sm:text-sm max-w-md", isDay ? "text-[#071426]/60" : "text-white/50")}>
              {searchQuery ? `No recorded results matching "${searchQuery}"` : "Completed match results will be displayed here once games conclude."}
            </p>
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default Results;

