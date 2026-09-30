import React, { useState } from 'react';
import { SPORTS_ART } from './BrandAssets';
import { getTeamLogo } from '@/utils/teamLogos';

interface SportBallArtProps {
  sportSlug: string;
  className?: string;
  customImageUrl?: string;
}

/**
 * Resolves the sport slug to its high-definition 3D transparent asset
 */
export function getSportArtUrl(sportSlug: string): string | null {
  const slug = (sportSlug || '').toLowerCase().trim().replace(/_/g, '-');
  
  if (slug === 'football' || slug === 'soccer') return SPORTS_ART.football;
  if (slug === 'cricket') return SPORTS_ART.cricket;
  if (slug === 'volleyball') return SPORTS_ART.volleyball;
  if (slug === 'carrom') return SPORTS_ART.carrom;
  if (slug.includes('kart') || slug.includes('smash')) return SPORTS_ART.smashKarts;
  if (
    slug.includes('counter') ||
    slug.includes('cs') ||
    slug.includes('lan') ||
    slug.includes('sniper') ||
    slug.includes('k-strike') ||
    slug.includes('kstrike')
  ) {
    return SPORTS_ART.counterStrike;
  }
  if (slug === 'badminton') return SPORTS_ART.badminton;
  if (slug === 'tennis' || slug === 'hand-tennis') return SPORTS_ART.tennis;
  if (slug === 'table-tennis' || slug === 'ping-pong') return SPORTS_ART.tableTennis;
  if (slug === 'chess') return SPORTS_ART.chess;

  // Check if sportSlug matches any registered team logo (e.g. K-Strike)
  const teamLogo = getTeamLogo(sportSlug);
  if (teamLogo) return teamLogo;
  
  return null;
}

export const SportBallArt: React.FC<SportBallArtProps> = ({
  sportSlug,
  className = 'w-full h-full',
  customImageUrl,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // If user provides a direct image URL, render it cleanly with object-contain
  if (customImageUrl && !imgFailed) {
    return (
      <img
        src={customImageUrl}
        alt={sportSlug}
        draggable={false}
        onError={() => setImgFailed(true)}
        className={`${className} object-contain select-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.32)] transition-transform duration-300`}
      />
    );
  }

  const artUrl = getSportArtUrl(sportSlug);

  // Render the high-definition 3D transparent asset when available
  if (artUrl && !imgFailed) {
    return (
      <img
        src={artUrl}
        alt={sportSlug}
        draggable={false}
        onError={() => setImgFailed(true)}
        className={`${className} object-contain select-none filter drop-shadow-[0_14px_28px_rgba(0,0,0,0.35)] transition-transform duration-300`}
      />
    );
  }

  const slug = (sportSlug || '').toLowerCase().trim().replace(/_/g, '-');

  // Vector Fallback with high-fidelity realistic SVG rendering
  switch (slug) {
    case 'football':
    case 'soccer':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="fb-sphere" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#E2E8F0" />
              <stop offset="85%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
            <radialGradient id="fb-black-patch" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
            <filter id="fb-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>
          <g filter="url(#fb-shadow)">
            <circle cx="50" cy="50" r="44" fill="url(#fb-sphere)" />
            {/* Center black pentagon */}
            <polygon points="50,38 61,46 57,59 43,59 39,46" fill="url(#fb-black-patch)" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Outer connecting patches */}
            <polygon points="50,38 50,22 36,14 27,26 39,46" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="50,38 50,22 64,14 73,26 61,46" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="61,46 76,44 85,55 77,68 57,59" fill="url(#fb-black-patch)" stroke="#CBD5E1" strokeWidth="0.8" />
            <polygon points="39,46 24,44 15,55 23,68 43,59" fill="url(#fb-black-patch)" stroke="#CBD5E1" strokeWidth="0.8" />
            <polygon points="43,59 36,76 50,86 64,76 57,59" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
            {/* Light specular sheen */}
            <ellipse cx="38" cy="28" rx="14" ry="7" fill="#FFFFFF" fillOpacity="0.5" transform="rotate(-25 38 28)" />
          </g>
        </svg>
      );

    case 'cricket':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="cricket-ball" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="35%" stopColor="#DC2626" />
              <stop offset="70%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#450A0A" />
            </radialGradient>
            <filter id="cricket-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#991B1B" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter="url(#cricket-glow)">
            <circle cx="50" cy="50" r="44" fill="url(#cricket-ball)" />
            {/* Equator Stitched Seam */}
            <path d="M6 50 Q50 44 94 50" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3 2" fill="none" />
            <path d="M7 47 Q50 41 93 47" stroke="#FEF08A" strokeWidth="1" strokeDasharray="2 2" fill="none" />
            <path d="M7 53 Q50 47 93 53" stroke="#FEF08A" strokeWidth="1" strokeDasharray="2 2" fill="none" />
            {/* Specular Highlight */}
            <ellipse cx="36" cy="28" rx="12" ry="6" fill="#FFFFFF" fillOpacity="0.5" transform="rotate(-20 36 28)" />
          </g>
        </svg>
      );

    case 'volleyball':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="vb-sphere" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </radialGradient>
            <filter id="vb-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.3" />
            </filter>
          </defs>
          <g filter="url(#vb-shadow)">
            <circle cx="50" cy="50" r="44" fill="url(#vb-sphere)" />
            {/* Olympic Mikasa curved panels */}
            <path d="M50 6 C64 26 64 46 50 50 C36 46 36 26 50 6 Z" fill="#1264FF" stroke="#0B3E99" strokeWidth="1" />
            <path d="M50 94 C36 74 36 54 50 50 C64 54 64 74 50 94 Z" fill="#1264FF" stroke="#0B3E99" strokeWidth="1" />
            <path d="M6 50 C26 36 46 36 50 50 C46 64 26 64 6 50 Z" fill="#FFD21F" stroke="#B89209" strokeWidth="1" />
            <path d="M94 50 C74 64 54 64 50 50 C54 36 74 36 94 50 Z" fill="#FFD21F" stroke="#B89209" strokeWidth="1" />
            <ellipse cx="38" cy="28" rx="12" ry="6" fill="#FFFFFF" fillOpacity="0.45" transform="rotate(-20 38 28)" />
          </g>
        </svg>
      );

    case 'carrom':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="carrom-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.3" />
            </filter>
          </defs>
          <g filter="url(#carrom-shadow)">
            {/* Wooden Board Frame */}
            <rect x="8" y="8" width="84" height="84" rx="6" fill="#D4A373" stroke="#8D5B28" strokeWidth="2.5" />
            <rect x="15" y="15" width="70" height="70" rx="3" fill="#FAEDCD" stroke="#CCD5AE" strokeWidth="1.5" />
            {/* Corner Pockets */}
            <circle cx="21" cy="21" r="5" fill="#1E293B" />
            <circle cx="79" cy="21" r="5" fill="#1E293B" />
            <circle cx="21" cy="79" r="5" fill="#1E293B" />
            <circle cx="79" cy="79" r="5" fill="#1E293B" />
            {/* Carrom Men cluster: Yellow, Blue, and center Red Queen */}
            <circle cx="50" cy="50" r="6" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="43" cy="44" r="4.5" fill="#FFD21F" stroke="#D97706" strokeWidth="0.8" />
            <circle cx="57" cy="44" r="4.5" fill="#1264FF" stroke="#1D4ED8" strokeWidth="0.8" />
            <circle cx="43" cy="56" r="4.5" fill="#1264FF" stroke="#1D4ED8" strokeWidth="0.8" />
            <circle cx="57" cy="56" r="4.5" fill="#FFD21F" stroke="#D97706" strokeWidth="0.8" />
            {/* Striker */}
            <circle cx="50" cy="74" r="6.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'smash-karts':
    case 'smash-kart':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="kart-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#DC2626" floodOpacity="0.35" />
            </filter>
          </defs>
          <g filter="url(#kart-shadow)" transform="translate(0, 10)">
            {/* Black Rubber Tires */}
            <rect x="14" y="24" width="12" height="20" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <rect x="74" y="24" width="12" height="20" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <rect x="12" y="52" width="14" height="24" rx="5" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <rect x="74" y="52" width="14" height="24" rx="5" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            {/* Glossy Red Chassis */}
            <path d="M26 36 L74 36 L70 66 L30 66 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
            {/* Aerodynamic Front Bumper */}
            <path d="M20 30 Q50 20 80 30 L74 38 L26 38 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
            {/* Racing White Stripe & Number */}
            <rect x="46" y="26" width="8" height="30" fill="#FFFFFF" />
            {/* Steering Wheel */}
            <circle cx="50" cy="46" r="7" stroke="#CBD5E1" strokeWidth="2.5" fill="none" />
            {/* Chrome Rear Spoiler */}
            <rect x="22" y="68" width="56" height="7" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          </g>
        </svg>
      );

    case 'counter-strike':
    case 'counterstrike':
    case 'k-strike':
    case 'kstrike':
    case 'strike':
    case 'lan-games':
    case 'lan':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="cs-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter="url(#cs-shadow)" transform="rotate(-25 50 50)">
            {/* Long Rifle Barrel with Muzzle Brake */}
            <rect x="15" y="47" width="70" height="4" rx="1" fill="#334155" />
            <rect x="80" y="45" width="8" height="8" rx="1" fill="#0F172A" />
            {/* Telescopic Sniper Scope */}
            <rect x="35" y="38" width="28" height="6" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <circle cx="35" cy="41" r="4" fill="#0284C7" />
            {/* Tactical Olive & Dark Body */}
            <path d="M18 48 L48 48 L42 62 L22 62 Z" fill="#3F6212" stroke="#1A2E05" strokeWidth="1" />
            {/* Stock and Grip */}
            <path d="M18 48 L8 58 L12 70 L24 64 Z" fill="#0F172A" />
            {/* Bipod legs */}
            <line x1="68" y1="51" x2="62" y2="70" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <line x1="68" y1="51" x2="74" y2="70" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'tennis':
    case 'hand-tennis':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="tball-sphere" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FCFFAE" />
              <stop offset="40%" stopColor="#E2F51C" />
              <stop offset="100%" stopColor="#AEC406" />
            </radialGradient>
            <filter id="tball-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#AEC406" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter="url(#tball-shadow)">
            <circle cx="50" cy="50" r="44" fill="url(#tball-sphere)" />
            <path d="M22 22 C44 26 44 74 22 78" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M78 22 C56 26 56 74 78 78" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      );

    case 'badminton':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="badm-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.25" />
            </filter>
          </defs>
          <g filter="url(#badm-shadow)" transform="rotate(-25 50 50)">
            <path d="M28 24 L72 24 L56 66 L44 66 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="36" y1="24" x2="47" y2="66" stroke="#94A3B8" strokeWidth="1" />
            <line x1="50" y1="24" x2="50" y2="66" stroke="#94A3B8" strokeWidth="1" />
            <line x1="64" y1="24" x2="53" y2="66" stroke="#94A3B8" strokeWidth="1" />
            <path d="M28 24 Q50 18 72 24" stroke="#1264FF" strokeWidth="2.5" fill="none" />
            <path d="M44 66 C44 80 56 80 56 66 Z" fill="#D9A441" stroke="#9A7020" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'chess':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="chess-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#D9A441" floodOpacity="0.35" />
            </filter>
          </defs>
          <g filter="url(#chess-shadow)">
            <path d="M28 84 L72 84 L68 76 L32 76 Z" fill="#1E293B" stroke="#D9A441" strokeWidth="1.5" />
            <path d="M34 76 L66 76 L60 56 L40 56 Z" fill="#0F172A" stroke="#D9A441" strokeWidth="1" />
            <path d="M40 56 C36 38 42 32 50 32 C58 32 64 38 60 56 Z" fill="#1E293B" stroke="#D9A441" strokeWidth="1.5" />
            {/* Golden King Crown */}
            <path d="M47 16 L53 16 L53 26 L47 26 Z" fill="#FFD21F" />
            <path d="M42 20 L58 20 L58 24 L42 24 Z" fill="#FFD21F" />
          </g>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="42" fill="#071426" stroke="#D9A441" strokeWidth="2" />
          <polygon points="50,30 55,42 68,44 58,54 61,67 50,60 39,67 42,54 32,44 45,42" fill="#FFD21F" />
        </svg>
      );
  }
};

export default SportBallArt;
