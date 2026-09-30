import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export interface SportOption {
  id: string;
  name: string;
  icon: string;
  category: 'team' | 'individual';
  description: string;
}

export const DISCIPLINE_LIST: SportOption[] = [
  { id: 'football', name: 'Football', icon: '⚽', category: 'team', description: 'Team Standings' },
  { id: 'cricket', name: 'Cricket', icon: '🏏', category: 'team', description: 'Team Standings' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', category: 'team', description: 'Team Standings' },
  { id: 'hand-tennis', name: 'Hand Tennis', icon: '✋', category: 'team', description: 'Team Standings' },
  { id: 'lan-games', name: 'LAN Games', icon: '🎮', category: 'team', description: 'Team Standings' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', category: 'individual', description: 'Top 3 Podium' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓', category: 'individual', description: 'Top 3 Podium' },
  { id: 'chess', name: 'Chess', icon: '♟', category: 'individual', description: 'Top 3 Podium' },
  { id: 'carrom', name: 'Carrom', icon: '🟤', category: 'individual', description: 'Top 3 Podium' },
];

export const SportFilterRibbon: React.FC<{
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
  extraDisciplines?: SportOption[];
}> = ({ selectedSport, onSelectSport, extraDisciplines = [] }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const allDisciplines = useMemo(() => {
    const existingIds = new Set(DISCIPLINE_LIST.map((s) => s.id));
    const extras = extraDisciplines.filter((s) => !existingIds.has(s.id));
    return [...DISCIPLINE_LIST, ...extras];
  }, [extraDisciplines]);

  return (
    <div className="relative mb-10 sm:mb-14">
      {/* Header bar: SELECT DISCIPLINE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
          <h2
            className={`text-xs sm:text-sm font-black uppercase tracking-[0.25em] ${
              isDay ? 'text-[#071426]/70' : 'text-white/70'
            }`}
          >
            SELECT DISCIPLINE
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-[#D9A441]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1264FF]" /> TEAM DISCIPLINES
          </span>
          <span className="opacity-30">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD21F]" /> INDIVIDUAL PODIUMS (TOP 3)
          </span>
        </div>
      </div>

      {/* Horizontal scrollable discipline pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {allDisciplines.map((sport) => {
          const isSelected = selectedSport === sport.id;

          return (
            <button
              key={sport.id}
              onClick={() => onSelectSport(sport.id)}
              className={`relative flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                isSelected
                  ? isDay
                    ? 'bg-[#071426] border-[#071426] text-white shadow-[0_8px_25px_rgba(7,20,38,0.25)] scale-[1.02]'
                    : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] border-[#FFD21F] text-[#071426] shadow-[0_0_25px_rgba(217,164,65,0.45)] scale-[1.02]'
                  : isDay
                    ? 'bg-white/85 border-[#071426]/10 text-[#071426]/80 hover:bg-white hover:border-[#071426]/30 hover:scale-[1.01]'
                    : 'bg-[#0B1528]/80 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/25 hover:scale-[1.01]'
              }`}
            >
              <span className="text-base sm:text-lg leading-none">{sport.icon}</span>
              <span className="font-extrabold">{sport.name}</span>

              {/* Tag indicator */}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${
                  isSelected
                    ? isDay
                      ? 'bg-white/20 text-white'
                      : 'bg-[#071426]/20 text-[#071426]'
                    : isDay
                      ? 'bg-[#071426]/5 text-[#071426]/60'
                      : 'bg-white/10 text-white/60'
                }`}
              >
                {sport.category === 'team' ? 'TEAM' : 'TOP 3'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
