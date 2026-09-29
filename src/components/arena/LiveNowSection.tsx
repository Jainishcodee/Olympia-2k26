import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';

// Mock data
const mockLiveMatches = [
  { id: '1', sport: 'Basketball', teamA: 'Eagles', teamB: 'Sharks', scoreA: 89, scoreB: 84, time: 'Q4 02:14' },
  { id: '2', sport: 'Football', teamA: 'Tigers', teamB: 'Lions', scoreA: 2, scoreB: 1, time: '78\'' },
];

export const LiveNowSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#080A0D] border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF4D3D]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <Container>
        <div className="flex items-end justify-between mb-12">
          <SectionTitle 
            title={
              <div className="flex items-center">
                LIVE NOW
                <span className="ml-4 w-3 h-3 md:w-4 md:h-4 bg-[#FF4D3D] rounded-full animate-pulse shadow-[0_0_15px_#FF4D3D]" />
              </div>
            } 
            subtitle="The action as it happens" 
            className="mb-0"
          />
          <Link to="/live" className="hidden md:inline-flex text-[#1264FF] font-bold tracking-widest uppercase text-sm hover:text-white transition-colors">
            View All Live →
          </Link>
        </div>

        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 space-x-6 hide-scrollbar">
          {mockLiveMatches.length === 0 ? (
            <div className="w-full py-12 border border-white/10 flex flex-col items-center justify-center bg-white/5">
              <p className="text-white/50 uppercase tracking-widest font-bold">No matches live at the moment</p>
            </div>
          ) : (
            mockLiveMatches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex-shrink-0 w-[300px] md:w-[400px]"
              >
                <Link to={`/match/${match.id}`} className="block">
                  <div className="bg-[#071426] border border-[#FF4D3D]/30 p-6 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D3D]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{match.sport}</span>
                      <span className="text-xs font-bold text-[#FF4D3D] uppercase tracking-widest bg-[#FF4D3D]/10 px-2 py-1 rounded-sm">
                        {match.time}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <div className="w-12 h-12 bg-white/5 rounded-full mx-auto mb-2" />
                        <h3 className="font-bold text-white uppercase">{match.teamA}</h3>
                      </div>
                      
                      <div className="px-4 text-center">
                        <div className="text-3xl font-black text-white tracking-tighter">
                          {match.scoreA} - {match.scoreB}
                        </div>
                      </div>
                      
                      <div className="text-center flex-1">
                        <div className="w-12 h-12 bg-white/5 rounded-full mx-auto mb-2" />
                        <h3 className="font-bold text-white uppercase">{match.teamB}</h3>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </Container>
    </section>
  );
};
