import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';

export const TournamentSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#080A0D]">
      <Container>
        <SectionTitle title="ACTIVE TOURNAMENTS" subtitle="The road to glory" />
        <div className="bg-gradient-to-br from-[#1747B8]/20 to-[#071426] border border-[#1747B8]/30 p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Olympia Grand Cup</h3>
              <p className="text-[#D9A441] font-bold tracking-widest uppercase text-sm mt-2">Multiple Disciplines</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <span className="text-white/50 text-sm font-bold">STAGE</span>
              <p className="text-xl font-black text-white uppercase">Quarter-Finals</p>
            </div>
          </div>
          
          <div className="w-full bg-white/5 h-2 mb-4 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "65%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-[#1264FF] to-[#D9A441]" 
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-white/30 uppercase tracking-widest">
            <span>Groups</span>
            <span>Finals</span>
          </div>
        </div>
      </Container>
    </section>
  );
};
