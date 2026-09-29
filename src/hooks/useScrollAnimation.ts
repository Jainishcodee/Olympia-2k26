import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation(config: gsap.AnimationVars) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(el, 
        { opacity: 0, y: 50 }, 
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            ...(typeof config.scrollTrigger === 'object' ? config.scrollTrigger : {})
          },
          ...(config as any)
        }
      );
    }, el);

    return () => ctx.revert();
  }, [config]);

  return triggerRef;
}
