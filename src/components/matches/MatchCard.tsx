import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { TiltCard, RollingScore } from '@/components/motion';

interface MatchCardProps {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  status: 'live' | 'upcoming' | 'completed' | 'cancelled';
  time: string;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
  id, 
  sport, 
  teamA, 
  teamB, 
  scoreA, 
  scoreB, 
  status, 
  time, 
  className 
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <TiltCard
      tiltAngle={7}
      glowColor={status === 'live' ? 'rgba(255, 77, 61, 0.18)' : isDay ? 'rgba(21, 94, 239, 0.12)' : 'rgba(217, 164, 65, 0.15)'}
      cursorLabel={status === 'live' ? 'LIVE' : 'MATCH'}
      className={className}
    >
      <Link to={`/match/${id}`} className="block group h-full">
        <div 
          className={cn(
            "p-6 rounded-2xl relative overflow-hidden transition-all duration-300 border h-full flex flex-col justify-between backdrop-blur-md",
            isDay
              ? status === 'live'
                ? "bg-white/90 border-[#FF4D3D]/40 shadow-[0_10px_30px_rgba(255,77,61,0.08)] hover:border-[#FF4D3D]"
                : "bg-white/80 border-[#071426]/10 shadow-[0_10px_30px_rgba(7,20,38,0.04)] hover:border-[#155EEF]/50"
              : status === 'live' 
                ? "bg-[#071426]/90 border-[#FF4D3D]/50 hover:border-[#FF4D3D] shadow-[0_10px_30px_rgba(0,0,0,0.6)]" 
                : "bg-[#071426]/90 border-white/10 hover:border-[#1264FF]/50 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          )}
        >
          {status === 'live' && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D3D]/10 via-transparent to-transparent pointer-events-none" />
          )}
          
          <div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <span className={cn(
                "text-xs font-black uppercase tracking-widest",
                isDay ? "text-[#071426]/60" : "text-white/50"
              )}>
                {sport}
              </span>
              <Badge status={status}>{status === 'live' ? 'LIVE' : time}</Badge>
            </div>
            
            <div className="flex justify-between items-center relative z-10 gap-3 my-2">
              <div className="text-center flex-1 min-w-0">
                <h3 className={cn(
                  "font-black uppercase text-base md:text-lg truncate",
                  isDay ? "text-[#071426]" : "text-white"
                )}>
                  {teamA}
                </h3>
              </div>
              
              <div className="px-3 text-center shrink-0">
                {status === 'upcoming' ? (
                  <span className={cn(
                    "text-lg font-black tracking-wider px-2 py-0.5 rounded",
                    isDay ? "bg-[#071426]/5 text-[#D9A441]" : "bg-white/5 text-[#D9A441]"
                  )}>
                    VS
                  </span>
                ) : (
                  <div className={cn(
                    "flex items-center space-x-2 px-3 py-1 rounded-xl border text-xl md:text-2xl font-black tabular-nums",
                    isDay ? "bg-[#F7F6F1] border-[#071426]/10 text-[#155EEF]" : "bg-[#0B1A30] border-white/10 text-[#FFD21F]"
                  )}>
                    <RollingScore value={scoreA ?? 0} />
                    <span className="text-black/30 dark:text-white/30 text-sm">-</span>
                    <RollingScore value={scoreB ?? 0} />
                  </div>
                )}
              </div>
              
              <div className="text-center flex-1 min-w-0">
                <h3 className={cn(
                  "font-black uppercase text-base md:text-lg truncate",
                  isDay ? "text-[#071426]" : "text-white"
                )}>
                  {teamB}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xs font-bold">
            <span className={isDay ? "text-[#071426]/45" : "text-white/40"}>Telemetry</span>
            <span className={cn(
              "uppercase tracking-widest text-[11px] font-black group-hover:translate-x-1 transition-transform inline-flex items-center gap-1",
              status === 'live' ? "text-[#FF4D3D]" : isDay ? "text-[#155EEF]" : "text-[#D9A441]"
            )}>
              {status === 'live' ? 'Watch Live →' : 'View Details →'}
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
};

export default MatchCard;
