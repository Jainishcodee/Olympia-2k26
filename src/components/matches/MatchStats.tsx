import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

interface StatItem {
  label: string;
  valA: number;
  valB: number;
  suffix?: string;
}

const defaultStats: StatItem[] = [
  { label: 'Possession', valA: 55, valB: 45, suffix: '%' },
  { label: 'Shots', valA: 12, valB: 8 },
  { label: 'Shots on Target', valA: 5, valB: 3 },
  { label: 'Fouls', valA: 10, valB: 14 },
];

export const MatchStats: React.FC<{ stats?: StatItem[]; className?: string }> = ({ 
  stats = defaultStats, 
  className 
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border backdrop-blur-xl transition-all shadow-xl",
        isDay
          ? "bg-white/80 border-[#071426]/10 text-[#071426] shadow-[0_10px_30px_rgba(7,20,38,0.05)]"
          : "bg-[#071426]/90 border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: isDay ? 'rgba(7,20,38,0.08)' : 'rgba(255,255,255,0.1)' }}>
        <h3
          className={cn(
            "text-lg font-black uppercase tracking-widest",
            isDay ? "text-[#071426]" : "text-white"
          )}
        >
          Match Telemetry
        </h3>
        <span className={cn("text-xs font-bold uppercase tracking-wider", isDay ? "text-[#071426]/50" : "text-white/40")}>
          Live Stats
        </span>
      </div>

      <div className="space-y-6">
        {stats.map((stat, i) => {
          const total = stat.valA + stat.valB;
          const pctA = total === 0 ? 50 : (stat.valA / total) * 100;
          const pctB = total === 0 ? 50 : (stat.valB / total) * 100;

          return (
            <div key={i} className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className={cn("font-black text-base sm:text-lg tabular-nums", isDay ? "text-[#155EEF]" : "text-[#1264FF]")}>
                  {stat.valA}{stat.suffix || ''}
                </span>
                <span className={cn("font-black uppercase text-xs tracking-widest", isDay ? "text-[#071426]/60" : "text-white/50")}>
                  {stat.label}
                </span>
                <span className="text-[#FF4D3D] font-black text-base sm:text-lg tabular-nums">
                  {stat.valB}{stat.suffix || ''}
                </span>
              </div>
              <div className={cn("flex h-2.5 rounded-full overflow-hidden", isDay ? "bg-[#071426]/10" : "bg-white/10")}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pctA}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-[#1264FF] rounded-l-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pctB}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-[#FF4D3D] rounded-r-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
