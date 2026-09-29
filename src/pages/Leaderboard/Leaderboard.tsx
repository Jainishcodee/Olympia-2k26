import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';

const STANDINGS = [
  { id: 'titans', team: 'Titans', points: 42, played: 15, w: 14, l: 1 },
  { id: 'fury', team: 'Fury', points: 36, played: 15, w: 12, l: 3 },
  { id: 'eagles', team: 'Eagles', points: 30, played: 15, w: 10, l: 5 },
  { id: 'sharks', team: 'Sharks', points: 24, played: 15, w: 8, l: 7 },
];

const COLS = 'grid grid-cols-[64px_minmax(0,1fr)_88px_88px_96px] items-center gap-3 sm:grid-cols-[72px_minmax(0,1fr)_96px_104px_110px]';

const rankClass = (index: number) =>
  index === 0
    ? 'bg-[#D9A441] text-[#080A0D]'
    : index === 1
      ? 'bg-gray-300 text-[#080A0D]'
      : index === 2
        ? 'bg-amber-700 text-[#FFFFFF]'
        : 'bg-white/5 text-white/60 border border-white/10';

export const Leaderboard: React.FC = () => {
  const standings = STANDINGS;

  return (
    <div className="flex min-h-screen flex-col bg-[#080A0D] pt-32 text-white">
      <Container className="flex-1 pb-24">
        <SectionTitle title="LEADERBOARD" subtitle="The pantheon of champions" />

        <div className="overflow-x-auto border border-white/10 bg-[#071426]">
          <div className="min-w-[600px]">
            {/* header */}
            <div className={`${COLS} border-b border-white/10 bg-white/5 px-4 py-3`}>
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Rank</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Team</span>
              <span className="text-center text-xs font-bold uppercase tracking-widest text-white/50">
                Played
              </span>
              <span className="text-center text-xs font-bold uppercase tracking-widest text-white/50">
                W-L
              </span>
              <span className="text-right text-xs font-bold uppercase tracking-widest text-[#D9A441]">
                Points
              </span>
            </div>

            {/* rows — `layout` lets a table reorder physically instead of snapping */}
            {standings.map((row, index) => (
              <motion.div
                key={row.id}
                layout
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={`${COLS} border-b border-white/5 px-4 py-4 transition-colors hover:bg-white/5`}
              >
                <span className="flex justify-center">
                  <motion.span
                    layout
                    // keyed by RANK, so the medal chip travels to whoever now holds it
                    layoutId={`rank-chip-${index + 1}`}
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                    className={`flex h-8 w-8 items-center justify-center font-black ${rankClass(index)}`}
                  >
                    {index + 1}
                  </motion.span>
                </span>

                <span className="truncate font-black uppercase tracking-wider">{row.team}</span>
                <span className="text-center text-white/70">{row.played}</span>
                <span className="text-center text-white/70">
                  {row.w}-{row.l}
                </span>
                <span className="text-right font-black text-xl text-[#D9A441]">{row.points}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
};

export default Leaderboard;
