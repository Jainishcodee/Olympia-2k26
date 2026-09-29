import { useState, useEffect } from 'react';

export function useMediaQuery() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateMatches = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    updateMatches();
    window.addEventListener('resize', updateMatches);
    
    return () => window.removeEventListener('resize', updateMatches);
  }, []);

  return { isMobile, isTablet, isDesktop };
}
