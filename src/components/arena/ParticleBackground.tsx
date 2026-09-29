import React, { useMemo } from 'react';

export const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 10 + 10}s`,
      animationDelay: `${Math.random() * 5}s`,
      size: Math.random() * 4 + 2,
      isGold: Math.random() > 0.5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-950">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full opacity-30 animate-pulse ${p.isGold ? 'bg-amber-400' : 'bg-blue-400'}`}
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            boxShadow: `0 0 ${p.size * 2}px ${p.isGold ? 'rgba(251, 191, 36, 0.5)' : 'rgba(96, 165, 250, 0.5)'}`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;
