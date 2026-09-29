import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';

const upcoming = [
  { id: '3', sport: 'Volleyball', teamA: 'Spikers', teamB: 'Blockers', time: 'Tomorrow, 14:00' },
  { id: '4', sport: 'Tennis', teamA: 'Player One', teamB: 'Player Two', time: 'Tomorrow, 16:30' },
];

export const UpcomingMatches: React.FC = () => {
  return (
    <section className="py-24 bg-[#080A0D]">
      <Container>
        <SectionTitle title="UPCOMING BATTLES" subtitle="Prepare for the next encounters" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcoming.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={`/match/${match.id}`}>
                <div className="bg-[#071426] border border-white/5 p-6 hover:border-[#1264FF]/50 transition-colors flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#1264FF] font-bold uppercase tracking-widest mb-2">{match.sport}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-black text-white uppercase">{match.teamA}</span>
                      <span className="text-sm font-bold text-white/30">VS</span>
                      <span className="text-xl font-black text-white uppercase">{match.teamB}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-white/70">{match.time}</span>
                    <span className="text-xs text-[#D9A441] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">
                      Details →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
