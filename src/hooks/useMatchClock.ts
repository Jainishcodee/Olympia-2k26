import { useState, useEffect, useRef } from 'react';

interface MatchClockProps {
  startedAt?: { seconds: number; nanoseconds: number } | Date | number | null;
  pausedAt?: { seconds: number; nanoseconds: number } | Date | number | null;
  status: string;
}

export function useMatchClock(match: MatchClockProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const requestRef = useRef<number>();
  
  const isRunning = match.status === 'live' && !match.pausedAt;

  useEffect(() => {
    if (!match.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const getStartTime = () => {
      if (match.startedAt instanceof Date) return match.startedAt.getTime();
      if (typeof match.startedAt === 'number') return match.startedAt;
      if (match.startedAt && 'seconds' in match.startedAt) return match.startedAt.seconds * 1000;
      return Date.now();
    };

    const startTime = getStartTime();

    const updateClock = () => {
      if (isRunning) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
        requestRef.current = requestAnimationFrame(updateClock);
      } else if (match.pausedAt) {
        let pauseTime = Date.now();
        if (match.pausedAt instanceof Date) pauseTime = match.pausedAt.getTime();
        else if (typeof match.pausedAt === 'number') pauseTime = match.pausedAt;
        else if ('seconds' in match.pausedAt) pauseTime = match.pausedAt.seconds * 1000;
        
        const elapsed = Math.floor((pauseTime - startTime) / 1000);
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
  }, [match.startedAt, match.pausedAt, isRunning]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return { elapsedSeconds, formattedTime, isRunning };
}
