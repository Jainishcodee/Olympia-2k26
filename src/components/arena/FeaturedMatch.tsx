import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';

export const FeaturedMatch: React.FC = () => {
  return (
    <section className="py-24 bg-[#080A0D]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full aspect-[2/1] md:aspect-[3/1] bg-[#071426] border border-[#D9A441]/30 overflow-hidden group"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1747B8]/20 via-[#071426] to-[#FF4D3D]/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <span className="text-[#D9A441] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4 md:mb-8 text-center">
              Featured Main Event
            </span>
            
            <div className="flex items-center justify-center w-full max-w-4xl space-x-4 md:space-x-12">
              <div className="flex-1 flex flex-col items-end">
                <div className="w-16 h-16 md:w-32 md:h-32 bg-white/5 rounded-full mb-4" />
                <h3 className="text-xl md:text-5xl font-black text-white uppercase tracking-tighter text-right">TITANS</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center px-4">
                <span className="text-3xl md:text-6xl font-black text-[#D9A441] mb-2">VS</span>
                <span className="text-xs md:text-sm text-white/50 font-bold uppercase tracking-widest text-center">
                  Oct 15 • 20:00
                </span>
              </div>
              
              <div className="flex-1 flex flex-col items-start">
                <div className="w-16 h-16 md:w-32 md:h-32 bg-white/5 rounded-full mb-4" />
                <h3 className="text-xl md:text-5xl font-black text-white uppercase tracking-tighter text-left">FURY</h3>
              </div>
            </div>
            
            <motion.div 
              className="mt-8 md:mt-12"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/match/featured" className="bg-[#D9A441] text-[#071426] font-black uppercase tracking-widest px-8 py-3 md:px-12 md:py-4 text-sm md:text-base hover:bg-white transition-colors">
                View Match
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
