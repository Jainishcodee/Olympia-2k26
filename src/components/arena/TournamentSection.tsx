import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '../ui/Container';
import { SectionTitle } from '../ui/SectionTitle';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, SplitText, Magnetic } from '@/components/motion';
import { Link } from 'react-router-dom';

export const TournamentSection: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <section className={`py-24 relative transition-colors duration-500 border-t ${
      isDay ? 'bg-transparent border-[#071426]/10 text-[#071426]' : 'bg-[#080A0D] border-white/5 text-white'
    }`}>
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <SectionTitle 
            title={
              <SplitText 
                text="ACTIVE TOURNAMENTS" 
                charClassName={isDay ? 'text-[#071426]' : 'text-white'}
              />
            } 
            subtitle="The road to glory · Championship brackets & progression" 
            className="mb-0"
          />
          <Magnetic strength={0.3} radius={80}>
            <Link 
              to="/tournaments" 
              className={`text-xs font-black uppercase tracking-widest mt-3 md:mt-0 inline-flex items-center gap-2 ${
                isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
              }`}
            >
              <span>Explore All Brackets</span>
              <span>→</span>
            </Link>
          </Magnetic>
        </div>

        <TiltCard
          tiltAngle={6}
          glowColor={isDay ? 'rgba(21, 94, 239, 0.12)' : 'rgba(18, 100, 255, 0.2)'}
          cursorLabel="BRACKET"
        >
          <div className={`rounded-3xl p-8 md:p-12 border relative overflow-hidden transition-all duration-500 ${
            isDay
              ? 'bg-gradient-to-br from-white/95 via-[#FDFBF7] to-[#EEF5FC] border-[#071426]/12 shadow-[0_20px_50px_rgba(7,20,38,0.06)]'
              : 'bg-gradient-to-br from-[#1747B8]/20 via-[#071426] to-[#040B17] border-[#1747B8]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${
                  isDay ? 'text-[#155EEF]' : 'text-[#D9A441]'
                }`}>
                  Flagship Grand Series
                </span>
                <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tight mt-1 ${
                  isDay ? 'text-[#071426]' : 'text-white'
                }`}>
                  Olympia Grand Cup 2K26
                </h3>
                <p className={`font-bold tracking-widest uppercase text-xs mt-2 ${
                  isDay ? 'text-[#071426]/60' : 'text-[#D9A441]'
                }`}>
                  10 Disciplines · 24 Contender Teams
                </p>
              </div>

              <div className="mt-4 md:mt-0 text-left md:text-right">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isDay ? 'text-[#071426]/50' : 'text-white/50'
                }`}>
                  Current Stage
                </span>
                <p className={`text-xl font-black uppercase ${
                  isDay ? 'text-[#155EEF]' : 'text-white'
                }`}>
                  Quarter-Finals Bracket
                </p>
              </div>
            </div>
            
            <div className={`w-full h-3 mb-4 rounded-full overflow-hidden p-0.5 border ${
              isDay ? 'bg-[#071426]/5 border-[#071426]/10' : 'bg-white/5 border-white/10'
            }`}>
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: "68%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[#1264FF] via-[#155EEF] to-[#D9A441]" 
              />
            </div>

            <div className={`flex justify-between text-xs font-black uppercase tracking-widest ${
              isDay ? 'text-[#071426]/40' : 'text-white/40'
            }`}>
              <span>01. Group Qualifiers</span>
              <span className={isDay ? 'text-[#155EEF]' : 'text-[#FFD21F]'}>02. Quarter-Finals (Active)</span>
              <span>03. Grand Finale</span>
            </div>
          </div>
        </TiltCard>
      </Container>
    </section>
  );
};

export default TournamentSection;
