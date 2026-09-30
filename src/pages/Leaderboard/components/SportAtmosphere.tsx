import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export interface SportAtmosphereProps {
  sportId: string;
}

export const SportAtmosphere: React.FC<SportAtmosphereProps> = ({ sportId }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const strokeColor = isDay ? 'rgba(7, 20, 38, 0.08)' : 'rgba(255, 255, 255, 0.07)';
  const accentStroke = isDay ? 'rgba(21, 94, 239, 0.15)' : 'rgba(217, 164, 65, 0.15)';

  const renderGeometry = () => {
    switch (sportId) {
      case 'football':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            {/* Center Circle & Halfway Line */}
            <line x1="600" y1="40" x2="600" y2="760" stroke={strokeColor} strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="600" cy="400" r="140" stroke={accentStroke} strokeWidth="2" />
            <circle cx="600" cy="400" r="4" fill={accentStroke} />
            {/* Penalty Boxes */}
            <rect x="40" y="220" width="220" height="360" stroke={strokeColor} strokeWidth="2" />
            <rect x="40" y="300" width="80" height="200" stroke={strokeColor} strokeWidth="2" />
            <path d="M 260 320 Q 320 400 260 480" stroke={strokeColor} strokeWidth="2" fill="none" />
            <rect x="940" y="220" width="220" height="360" stroke={strokeColor} strokeWidth="2" />
            <rect x="1080" y="300" width="80" height="200" stroke={strokeColor} strokeWidth="2" />
            <path d="M 940 320 Q 880 400 940 480" stroke={strokeColor} strokeWidth="2" fill="none" />
            {/* Goal frames & corner arcs */}
            <path d="M 40 80 A 40 40 0 0 1 80 40" stroke={accentStroke} strokeWidth="2" />
            <path d="M 1120 40 A 40 40 0 0 1 1160 80" stroke={accentStroke} strokeWidth="2" />
          </svg>
        );

      case 'cricket':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            {/* 30-Yard Circle Oval */}
            <ellipse cx="600" cy="400" rx="480" ry="320" stroke={strokeColor} strokeWidth="2" strokeDasharray="8 8" />
            {/* Pitch Rectangle */}
            <rect x="440" y="160" width="320" height="480" rx="8" stroke={accentStroke} strokeWidth="2" />
            {/* Bowling Creases */}
            <line x1="420" y1="240" x2="780" y2="240" stroke={strokeColor} strokeWidth="2" />
            <line x1="420" y1="560" x2="780" y2="560" stroke={strokeColor} strokeWidth="2" />
            {/* Popping Creases */}
            <line x1="400" y1="280" x2="800" y2="280" stroke={accentStroke} strokeWidth="2" />
            <line x1="400" y1="520" x2="800" y2="520" stroke={accentStroke} strokeWidth="2" />
            {/* Stumps Markers */}
            <circle cx="585" cy="240" r="3" fill={accentStroke} />
            <circle cx="600" cy="240" r="3" fill={accentStroke} />
            <circle cx="615" cy="240" r="3" fill={accentStroke} />
            <circle cx="585" cy="560" r="3" fill={accentStroke} />
            <circle cx="600" cy="560" r="3" fill={accentStroke} />
            <circle cx="615" cy="560" r="3" fill={accentStroke} />
          </svg>
        );

      case 'volleyball':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <rect x="240" y="140" width="720" height="520" stroke={strokeColor} strokeWidth="2" />
            <line x1="600" y1="100" x2="600" y2="700" stroke={accentStroke} strokeWidth="3" />
            <line x1="480" y1="140" x2="480" y2="660" stroke={strokeColor} strokeWidth="2" strokeDasharray="6 4" />
            <line x1="720" y1="140" x2="720" y2="660" stroke={strokeColor} strokeWidth="2" strokeDasharray="6 4" />
            <line x1="592" y1="100" x2="592" y2="700" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
            <line x1="608" y1="100" x2="608" y2="700" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
          </svg>
        );

      case 'hand-tennis':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <rect x="260" y="160" width="680" height="480" rx="4" stroke={strokeColor} strokeWidth="2" />
            <line x1="600" y1="160" x2="600" y2="640" stroke={accentStroke} strokeWidth="2" />
            <line x1="260" y1="400" x2="940" y2="400" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="8 6" />
            <circle cx="600" cy="400" r="80" stroke={accentStroke} strokeWidth="1.5" opacity="0.6" />
            <circle cx="600" cy="400" r="160" stroke={accentStroke} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          </svg>
        );

      case 'lan-games':
      case 'counter-strike':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <circle cx="600" cy="400" r="180" stroke={accentStroke} strokeWidth="1.5" strokeDasharray="12 12" />
            <circle cx="600" cy="400" r="60" stroke={accentStroke} strokeWidth="2" />
            <line x1="380" y1="400" x2="520" y2="400" stroke={accentStroke} strokeWidth="2" />
            <line x1="680" y1="400" x2="820" y2="400" stroke={accentStroke} strokeWidth="2" />
            <line x1="600" y1="180" x2="600" y2="320" stroke={accentStroke} strokeWidth="2" />
            <line x1="600" y1="480" x2="600" y2="620" stroke={accentStroke} strokeWidth="2" />
            <path d="M 200 200 L 220 200 L 220 220" stroke={strokeColor} strokeWidth="2" />
            <path d="M 1000 200 L 980 200 L 980 220" stroke={strokeColor} strokeWidth="2" />
            <path d="M 200 600 L 220 600 L 220 580" stroke={strokeColor} strokeWidth="2" />
            <path d="M 1000 600 L 980 600 L 980 580" stroke={strokeColor} strokeWidth="2" />
          </svg>
        );

      case 'badminton':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <rect x="220" y="160" width="760" height="480" stroke={strokeColor} strokeWidth="2" />
            <line x1="220" y1="210" x2="980" y2="210" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="220" y1="590" x2="980" y2="590" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="600" y1="120" x2="600" y2="680" stroke={accentStroke} strokeWidth="3" />
            <line x1="490" y1="160" x2="490" y2="640" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="710" y1="160" x2="710" y2="640" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="220" y1="400" x2="490" y2="400" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="710" y1="400" x2="980" y2="400" stroke={strokeColor} strokeWidth="1.5" />
          </svg>
        );

      case 'table-tennis':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <rect x="260" y="180" width="680" height="440" rx="6" stroke={strokeColor} strokeWidth="2.5" />
            <line x1="260" y1="400" x2="940" y2="400" stroke={strokeColor} strokeWidth="2" strokeDasharray="8 6" />
            <line x1="600" y1="140" x2="600" y2="660" stroke={accentStroke} strokeWidth="4" />
            <circle cx="600" cy="140" r="5" fill={accentStroke} />
            <circle cx="600" cy="660" r="5" fill={accentStroke} />
          </svg>
        );

      case 'chess':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <rect x="360" y="160" width="480" height="480" stroke={accentStroke} strokeWidth="2" />
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <React.Fragment key={i}>
                <line x1={360 + i * 60} y1="160" x2={360 + i * 60} y2="640" stroke={strokeColor} strokeWidth="1" />
                <line x1="360" y1={160 + i * 60} x2="840" y2={160 + i * 60} stroke={strokeColor} strokeWidth="1" />
              </React.Fragment>
            ))}
          </svg>
        );

      case 'carrom':
        return (
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <rect x="360" y="160" width="480" height="480" rx="12" stroke={strokeColor} strokeWidth="3" />
            <circle cx="390" cy="190" r="22" stroke={accentStroke} strokeWidth="2" />
            <circle cx="810" cy="190" r="22" stroke={accentStroke} strokeWidth="2" />
            <circle cx="390" cy="610" r="22" stroke={accentStroke} strokeWidth="2" />
            <circle cx="810" cy="610" r="22" stroke={accentStroke} strokeWidth="2" />
            <circle cx="600" cy="400" r="60" stroke={accentStroke} strokeWidth="2" />
            <circle cx="600" cy="400" r="16" fill={accentStroke} opacity="0.4" />
            <line x1="430" y1="230" x2="550" y2="350" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="770" y1="230" x2="650" y2="350" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="430" y1="570" x2="550" y2="450" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="770" y1="570" x2="650" y2="450" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={sportId}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {renderGeometry()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SportAtmosphere;
