import { useState, useEffect, useRef } from 'react';

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0, velocityX: 0, velocityY: 0, isMoving: false });
  const lastPosition = useRef({ x: 0, y: 0, time: Date.now() });
  const requestRef = useRef<number>();
  
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = now - lastPosition.current.time;
      
      const dx = e.clientX - lastPosition.current.x;
      const dy = e.clientY - lastPosition.current.y;
      
      const vx = dt > 0 ? dx / dt : 0;
      const vy = dt > 0 ? dy / dt : 0;
      
      lastPosition.current = { x: e.clientX, y: e.clientY, time: now };
      
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        setPosition({
          x: e.clientX,
          y: e.clientY,
          velocityX: vx,
          velocityY: vy,
          isMoving: true
        });
      });
    };

    let stopTimer: NodeJS.Timeout;
    const handleStop = () => {
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        setPosition(prev => ({ ...prev, isMoving: false, velocityX: 0, velocityY: 0 }));
      }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleStop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleStop);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearTimeout(stopTimer);
    };
  }, []);

  return position;
}
