import { useState, useEffect, useRef } from 'react';

interface MatchClockProps {
  startedAt?: { seconds: number; nanoseconds: number; toMillis?: () => number } | Date | number | null;
  pausedAt?: { seconds: number; nanoseconds: number; toMillis?: () => number } | Date | number | null;
  pausedDurationMs?: number;
  status: string;
}

const getMs = (val: MatchClockProps['startedAt']): number | null => {
  if (!val) return null;
  if (typeof (val as any).toMillis === 'function') return (val as any).toMillis();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if ('seconds' in val) return val.seconds * 1000;
  return null;
};

export function useMatchClock(match: MatchClockProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const requestRef = useRef<number>();
  
  const isRunning = match.status === 'live' && !match.pausedAt;
  const pausedDuration = Number(match.pausedDurationMs || 0);

  useEffect(() => {
    const startTime = getMs(match.startedAt);
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    const updateClock = () => {
      if (isRunning) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
        requestRef.current = requestAnimationFrame(updateClock);
      } else if (match.pausedAt) {
        const pauseTime = getMs(match.pausedAt) || Date.now();
        const elapsed = Math.floor((pauseTime - startTime - pausedDuration) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
      }
    };

    if (isRunning) {
      requestRef.current = requestAnimationFrame(updateClock);
    } else {
      updateClock(); // update once if not running
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [match.startedAt, match.pausedAt, match.pausedDurationMs, isRunning, pausedDuration]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return { elapsedSeconds, formattedTime, isRunning };
}
