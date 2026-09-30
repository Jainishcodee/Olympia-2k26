import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import logoLight from '@/assets/logo_light.png';
import logoDark from '@/assets/logo_dark.png';
import arena from '@/assets/arena.jpeg';
import olympiaLogo from '@/assets/olympia.png';

/**
 * Every image the homepage is allowed to load.
 * Files live in `public/images/` — see `public/images/README.md` for the spec.
 * Missing files are tolerated: `useImageSrc` resolves to `null` and the caller
 * renders its built-in vector/gradient fallback instead.
 */
export const BRAND = {
  logo: olympiaLogo,
  olympia: olympiaLogo,
  logoSvg: '/olympia.png',
  wordmark: '/images/brand/olympia-wordmark.png',
  heroBackdrop: '/images/backgrounds/hero-stadium.jpg',
  heroGlow: '/images/backgrounds/hero-glow.jpg',
  grain: '/images/backgrounds/grain.png',
  logoLight,
  logoDark,
  arena,
} as const;

export function useThemeLogo(): string {
  const { theme } = useTheme();
  return theme === 'day' ? BRAND.logoLight : BRAND.logoDark;
}

/** Palette — brand identity. Never let accents leak into these. */
export const IDENTITY = {
  navy: '#071426',
  navyDeep: '#040B17',
  gold: '#D9A441',
  goldLight: '#FFD21F',
} as const;

/** Palette — environmental accents only (atmosphere, HUD, orbs). */
export const ACCENTS = {
  blue: '#1264FF',
  yellow: '#FFD21F',
  orange: '#FF6A00',
  coral: '#FF4D3D',
} as const;

/**
 * Preloads an asset and only returns it once it has actually decoded.
 * Returning `null` (missing or still loading) lets the caller show its
 * fallback with no flash of broken imagery.
 */
export function useImageSrc(url: string): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!cancelled) setSrc(url);
    };
    // Intentionally no onerror handler: `src` simply stays null.
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return src;
}
