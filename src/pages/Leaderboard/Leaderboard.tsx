import React, { useState, useMemo } from 'react';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/arena/Footer';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { InteractiveParticleCanvas, VelocityMarquee } from '@/components/motion';
import { LeaderboardHero } from './components/LeaderboardHero';
import { SportFilterRibbon } from './components/SportFilterRibbon';
import { PodiumHero, LeaderboardItem } from './components/PodiumHero';
import { RankingRow } from './components/RankingRow';
import { TopMoversSection } from './components/TopMoversSection';
import { ChampionsArchive } from './components/ChampionsArchive';
import { MultiSportLeaderboardGrid } from './components/MultiSportLeaderboardGrid';
import { EntityProfileModal } from './components/EntityProfileModal';
import { LeaderboardCTA } from './components/LeaderboardCTA';
import { getTeamLogo } from '@/utils/teamLogos';
import type { Player, Team, Sport } from '@/types';

export const Leaderboard: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const [mode, setMode] = useState<'players' | 'teams'>('players');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<LeaderboardItem | null>(null);

  // Live Firestore collections
  const playersCol = useCollection<Player>('players');
  const teamsCol = useCollection<Team>('teams');
  const sportsCol = useCollection<Sport>('sports');

  const teamById = useMemo(() => {
    return new Map(teamsCol.data.map((t) => [t.id, t]));
  }, [teamsCol.data]);

  // Derived Player Items
  const playerItems = useMemo<LeaderboardItem[]>(() => {
    if (!playersCol.data.length) {
      // High-end deterministic mock pool if collection is cold
      return [
        {
          id: 'p-1',
          rank: 1,
          name: 'Arjun Mehta',
          subtitle: 'Thunderbolts FC',
          sportId: 'football',
          points: 1420,
          matches: 14,
          wins: 12,
          losses: 2,
          rating: 4.9,
          trend: 2,
          type: 'player',
          position: 'Forward Striker',
        },
        {
          id: 'p-2',
          rank: 2,
          name: 'Rahul Dravid Jr',
          subtitle: 'Storm Breakers XI',
          sportId: 'cricket',
          points: 1340,
          matches: 12,
          wins: 10,
          losses: 2,
          rating: 4.8,
          trend: 1,
          type: 'player',
          position: 'Top Order Batsman',
        },
        {
          id: 'p-3',
          rank: 3,
          name: 'Akash Reddy',
          subtitle: 'Spike Masters',
          sportId: 'volleyball',
          points: 1280,
          matches: 15,
          wins: 11,
          losses: 4,
          rating: 4.7,
          trend: -1,
          type: 'player',
          position: 'Power Setter',
        },
        {
          id: 'p-4',
          rank: 4,
          name: 'CyberX',
          subtitle: 'Cyber Phantoms',
          sportId: 'lan-games',
          points: 1190,
          matches: 16,
          wins: 12,
          losses: 4,
          rating: 4.6,
          trend: 3,
          type: 'player',
          position: 'Tactical Sniper',
        },
        {
          id: 'p-5',
          rank: 5,
          name: 'Vikram Joshi',
          subtitle: 'Phoenix United',
          sportId: 'football',
          points: 1120,
          matches: 11,
          wins: 8,
          losses: 3,
          rating: 4.5,
          trend: 0,
          type: 'player',
          position: 'Midfield Playmaker',
        },
        {
          id: 'p-6',
          rank: 6,
          name: 'Ankit Rajput',
          subtitle: 'Golden Warriors',
          sportId: 'cricket',
          points: 1080,
          matches: 10,
          wins: 7,
          losses: 3,
          rating: 4.4,
          trend: -2,
          type: 'player',
          position: 'Pace Bowler',
        },
        {
          id: 'p-7',
          rank: 7,
          name: 'Suresh Raina Jr',
          subtitle: 'Golden Warriors',
          sportId: 'cricket',
          points: 1030,
          matches: 10,
          wins: 7,
          losses: 3,
          rating: 4.4,
          trend: 4,
          type: 'player',
          position: 'All-Rounder',
        },
        {
          id: 'p-8',
          rank: 8,
          name: 'Harsh Pandey',
          subtitle: 'Block Titans',
          sportId: 'volleyball',
          points: 980,
          matches: 12,
          wins: 8,
          losses: 4,
          rating: 4.3,
          trend: 1,
          type: 'player',
          position: 'Outside Hitter',
        },
      ];
    }

    const list = playersCol.data.map((p, idx) => {
      const team = teamById.get(p.teamId);
      const wins = p.stats?.wins ?? (team?.wins || 0);
      const losses = p.stats?.losses ?? (team?.losses || 0);
      const matches = p.stats?.matchesPlayed ?? (wins + losses || 1);
      const points = (p.stats?.points && p.stats.points > 0) ? p.stats.points : (wins * 80 + (idx % 5) * 15 + 600);
      const rating = p.stats?.rating ?? Number((4.2 + ((idx % 7) * 0.1)).toFixed(1));

      return {
        id: p.id,
        rank: 0,
        name: p.name || 'Athlete',
        subtitle: team?.name || 'Independent Athlete',
        sportId: p.sportId || team?.sportId || 'sport',
        points,
        matches,
        wins,
        losses,
        rating,
        photo: p.photo,
        trend: (idx % 3 === 0 ? 2 : idx % 3 === 1 ? -1 : 0),
        type: 'player' as const,
        role: p.role,
        position: p.position || (p.role === 'captain' ? 'Team Captain' : 'Contender'),
      };
    });

    list.sort((a, b) => b.points - a.points);
    return list.map((item, i) => ({ ...item, rank: i + 1 }));
  }, [playersCol.data, teamById]);

  // Derived Team Items
  const teamItems = useMemo<LeaderboardItem[]>(() => {
    if (!teamsCol.data.length) {
      return [
        {
          id: 't-1',
          rank: 1,
          name: 'Thunderbolts FC',
          subtitle: '18 Squad Contenders',
          sportId: 'football',
          points: 2480,
          matches: 16,
          wins: 14,
          losses: 2,
          rating: 4.9,
          trend: 1,
          type: 'team',
        },
        {
          id: 't-2',
          rank: 2,
          name: 'Storm Breakers XI',
          subtitle: '15 Squad Contenders',
          sportId: 'cricket',
          points: 2310,
          matches: 14,
          wins: 12,
          losses: 2,
          rating: 4.8,
          trend: 2,
          type: 'team',
        },
        {
          id: 't-3',
          rank: 3,
          name: 'Spike Masters',
          subtitle: '12 Squad Contenders',
          sportId: 'volleyball',
          points: 2150,
          matches: 15,
          wins: 11,
          losses: 4,
          rating: 4.7,
          trend: -1,
          type: 'team',
        },
        {
          id: 't-4',
          rank: 4,
          name: 'Cyber Phantoms',
          subtitle: '5 Squad Contenders',
          sportId: 'lan-games',
          points: 1980,
          matches: 16,
          wins: 12,
          losses: 4,
          rating: 4.6,
          trend: 0,
          type: 'team',
        },
        {
          id: 't-5',
          rank: 5,
          name: 'Phoenix United',
          subtitle: '16 Squad Contenders',
          sportId: 'football',
          points: 1840,
          matches: 13,
          wins: 9,
          losses: 4,
          rating: 4.5,
          trend: 3,
          type: 'team',
        },
        {
          id: 't-6',
          rank: 6,
          name: 'Golden Warriors',
          subtitle: '15 Squad Contenders',
          sportId: 'cricket',
          points: 1720,
          matches: 12,
          wins: 8,
          losses: 4,
          rating: 4.4,
          trend: -2,
          type: 'team',
        },
      ];
    }

    const list = teamsCol.data.map((t, idx) => {
      const wins = t.wins || 0;
      const losses = t.losses || 0;
      const matches = wins + losses + (t.draws || 0) || 1;
      const points = t.points && t.points > 0 ? t.points : (wins * 120 + 800 + (idx % 4) * 40);

      return {
        id: t.id,
        rank: 0,
        name: t.name || 'Team',
        subtitle: `${t.playerIds?.length || 10} Contender Roster`,
        sportId: t.sportId || 'sport',
        points,
        matches,
        wins,
        losses,
        rating: 4.6,
        logo: t.logo || getTeamLogo(t.name) || getTeamLogo(t.id) || '',
        trend: (idx % 2 === 0 ? 1 : -1),
        type: 'team' as const,
      };
    });

    list.sort((a, b) => b.points - a.points);
    return list.map((item, i) => ({ ...item, rank: i + 1 }));
  }, [teamsCol.data]);

  // Active items filtered by selected sport
  const rawActiveList = mode === 'players' ? playerItems : teamItems;

  const filteredItems = useMemo(() => {
    let list = rawActiveList;
    if (selectedSport !== 'all') {
      list = list.filter((item) => item.sportId === selectedSport);
    }
    // Re-index ranks for filtered view
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [rawActiveList, selectedSport]);

  const top3 = useMemo(() => filteredItems.slice(0, 3), [filteredItems]);
  const theField = useMemo(() => filteredItems.slice(3), [filteredItems]);

  return (
    <div
      className={`relative min-h-screen transition-colors duration-500 overflow-x-hidden ${
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white'
      }`}
    >
      <InteractiveParticleCanvas />

      {/* Top Motion Banner Ribbon */}
      <div
        className={`pt-24 pb-3.5 border-b overflow-hidden transition-colors duration-300 relative z-10 ${
          isDay
            ? 'bg-white/80 border-[#071426]/10 text-[#071426]'
            : 'bg-[#040B17]/90 border-white/10 text-white'
        }`}
      >
        <VelocityMarquee baseVelocity={1.5} className="text-xs tracking-[0.3em] font-black uppercase">
          <span className="text-[#D9A441]">★</span>
          <span>OLYMPIA 2K26 RANKING WALL</span>
          <span className="text-[#1264FF]">/</span>
          <span>CHAMPIONSHIP PERFORMANCE INDEX</span>
          <span className="text-[#D9A441]">★</span>
          <span>LIVE CONTENDER SHIFTS</span>
          <span className="text-[#FF4D3D]">/</span>
          <span>FLIP TELEMETRY REORGANIZATION</span>
        </VelocityMarquee>
      </div>

      <Container className="pt-12 pb-20 relative z-10">
        {/* 1. Header & Mode Switcher */}
        <LeaderboardHero
          mode={mode}
          onModeChange={(m: 'players' | 'teams') => setMode(m)}
          totalEntries={filteredItems.length}
        />

        {/* 2. Sport Filter Selector */}
        <SportFilterRibbon
          selectedSport={selectedSport}
          onSelectSport={(s: string) => setSelectedSport(s)}
        />

        {/* 3. The Top 3 Podium Hero (Abstract Editorial Wall) */}
        {top3.length >= 3 && (
          <PodiumHero
            items={top3}
            mode={mode}
            onSelect={(item: LeaderboardItem) => setSelectedItem(item)}
          />
        )}

        {/* Kinetic Velocity Ticker Divider */}
        <div
          className={`my-16 py-3.5 border-y overflow-hidden relative z-10 ${
            isDay
              ? 'bg-[#071426] border-[#071426] text-white'
              : 'bg-[#071426] border-white/10 text-[#D9A441]'
          }`}
        >
          <VelocityMarquee baseVelocity={-1.7} className="text-xs tracking-[0.3em] font-black uppercase">
            <span>THE FIELD</span>
            <span className="opacity-40">•</span>
            <span>CHAMPIONSHIP LADDER</span>
            <span className="opacity-40">•</span>
            <span>LIVE FLIP TELEMETRY</span>
            <span className="opacity-40">•</span>
            <span>ALL DISCIPLINES STANDINGS</span>
          </VelocityMarquee>
        </div>

        {/* 4. The Field / The Pack (Main Ranking Posters) */}
        <section className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                  isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
                }`}
              >
                {mode === 'players' ? 'ATHLETE PACK' : 'TEAM PACK'}
              </span>
              <h3
                className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${
                  isDay ? 'text-[#071426]' : 'text-white'
                }`}
              >
                THE FIELD
              </h3>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDay ? 'text-[#071426]/60' : 'text-white/60'
              }`}
            >
              Showing Ranks #{theField.length > 0 ? '04' : '01'} to #{String(filteredItems.length).padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-col">
            {theField.map((item, index) => (
              <RankingRow
                key={item.id}
                item={item}
                index={index}
                onSelect={(selected: LeaderboardItem) => setSelectedItem(selected)}
              />
            ))}
          </div>
        </section>

        {/* 5. All Disciplines Standings Grid (with game emojis & Olympia logos) */}
        <MultiSportLeaderboardGrid
          onSelectDiscipline={(sportId: string) => setSelectedSport(sportId)}
        />

        {/* 6. Top Movers Section */}
        <TopMoversSection
          items={filteredItems}
          onSelect={(item: LeaderboardItem) => setSelectedItem(item)}
        />

        {/* 7. Champions Historical Wall */}
        <ChampionsArchive />

        {/* 8. Who's Next Closing Banner */}
        <LeaderboardCTA />
      </Container>

      {/* 9. Interactive Performance Profile Drawer */}
      <EntityProfileModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <Footer />
    </div>
  );
};

export default Leaderboard;
