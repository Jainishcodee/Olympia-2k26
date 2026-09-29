import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Possession', valA: 60, valB: 40, suffix: '%' },
  { label: 'Shots', valA: 12, valB: 8 },
  { label: 'Shots on Target', valA: 5, valB: 3 },
  { label: 'Fouls', valA: 10, valB: 14 },
];

export const MatchStats: React.FC = () => {
  return (
    <div className="bg-[#071426] border border-white/10 p-6">
      <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4 text-center">Team Stats</h3>
      
      <div className="space-y-6">
        {stats.map((stat, i) => {
          const total = stat.valA + stat.valB;
          const pctA = total === 0 ? 50 : (stat.valA / total) * 100;
          const pctB = total === 0 ? 50 : (stat.valB / total) * 100;
          
          return (
            <div key={i} className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold text-lg">{stat.valA}{stat.suffix}</span>
                <span className="text-white/50 font-bold uppercase text-xs tracking-widest">{stat.label}</span>
                <span className="text-white font-bold text-lg">{stat.valB}{stat.suffix}</span>
              </div>
              <div className="flex h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pctA}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-[#1264FF]" 
                />
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pctB}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-[#FF4D3D]" 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
