import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/* ============================================================================
 *  StandingsTicker — a leaderboard where rows physically travel to their new
 *  position instead of silently re-rendering in place.
 * ==========================================================================*/

export interface ScorerRow {
  id: string;
  name: string;
  teamShort: string;
  teamKey: 'teamA' | 'teamB';
  value: number;
}

export interface StandingsTickerProps {
  rows: ScorerRow[];
  title?: string;
  unit?: string;
  /** Row that just changed — gets a gold flash and a move indicator */
  highlightId?: string | null;
}

const MOVE_CLEAR = 1800;

export const StandingsTicker: React.FC<StandingsTickerProps> = ({
  rows,
  title = 'Leaderboard',
  unit = 'pts',
  highlightId = null,
}) => {
  const [movers, setMovers] = useState<Record<string, 1 | -1>>({});
  const prev = useRef<Record<string, number>>({});
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const next: Record<string, 1 | -1> = {};
    rows.forEach((row, index) => {
      const before = prev.current[row.id];
      if (before !== undefined && before !== index) next[row.id] = before > index ? 1 : -1;
    });
    prev.current = Object.fromEntries(rows.map((r, i) => [r.id, i]));

    if (Object.keys(next).length > 0) {
      setMovers(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMovers({}), MOVE_CLEAR);
    }
  }, [rows]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return (
    <div className="border border-[#1A2440] bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-[#1A2440] px-4 py-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D9A441]">{title}</h3>
        <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#5E6E86]">
          {unit}
        </span>
      </div>

      <div className="px-2 py-2">
        <AnimatePresence initial={false}>
          {rows.map((row, index) => (
            <motion.div
              key={row.id}
              layout
              transition={{ type: 'spring', stiffness: 460, damping: 36, mass: 0.7 }}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              className="relative flex items-center gap-3 overflow-hidden px-2 py-2"
            >
              {/* gold wash on the row that just changed */}
              <AnimatePresence>
                {highlightId === row.id && (
                  <motion.span
                    key={`wash-${row.id}`}
                    className="absolute inset-0 bg-[#D9A441]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, times: [0, 0.18, 1] }}
                  />
                )}
              </AnimatePresence>

              {/* rank — pops when it changes */}
              <span className="relative w-6 shrink-0 text-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={index}
                    initial={{ y: -14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 14, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className={cn(
                      'block text-[13px] font-black tabular-nums',
                      index === 0 ? 'text-[#FFD21F]' : index < 3 ? 'text-[#D9A441]' : 'text-[#5E6E86]',
                    )}
                  >
                    {index + 1}
                  </motion.span>
                </AnimatePresence>
              </span>

              <span className="relative h-6 w-1 shrink-0" style={{ backgroundColor: row.teamKey === 'teamA' ? '#1264FF' : '#FF4D3D' }} />

              <span className="relative min-w-0 flex-1 truncate text-[12px] font-bold text-[#C7D2E4]">
                {row.name}
                <span className="ml-2 text-[10px] font-black tracking-[0.14em] text-[#4C5B75]">
                  {row.teamShort}
                </span>
              </span>

              <AnimatePresence>
                {movers[row.id] && (
                  <motion.span
                    key={`move-${row.id}-${movers[row.id]}`}
                    initial={{ opacity: 0, y: movers[row.id] === 1 ? 8 : -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className={cn(
                      'relative text-[11px] font-black',
                      movers[row.id] === 1 ? 'text-[#3BFF7E]' : 'text-[#FF4D3D]',
                    )}
                  >
                    {movers[row.id] === 1 ? '▲' : '▼'}
                  </motion.span>
                )}
              </AnimatePresence>

              <span className="relative w-8 text-right text-[13px] font-black tabular-nums text-[#EEF2F7]">
                {row.value}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StandingsTicker;
