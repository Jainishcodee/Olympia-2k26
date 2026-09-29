import React from 'react';

const ITEMS = [
  '🚨 OLYMPIA 2K26 OFFICIALLY LAUNCHED',
  'REGISTRATIONS FOR E-SPORTS NOW OPEN',
  'NEW FEATURE: LIVE PLAYER RATINGS',
  'TICKETS FOR THE GRAND FINAL NOW LIVE',
];

const Track: React.FC<{ copy: number }> = ({ copy }) => (
  <span className="flex shrink-0 items-center" aria-hidden={copy === 1}>
    {ITEMS.map((item, i) => (
      <React.Fragment key={`${copy}-${i}`}>
        <span className="mx-5 text-[11px] font-black uppercase tracking-[0.24em] whitespace-nowrap">{item}</span>
        <span className="text-[11px] font-black opacity-50">◆</span>
      </React.Fragment>
    ))}
  </span>
);

/** Gold ticker. Two identical tracks translate by -50% for a seamless loop. */
export const AnnouncementBanner: React.FC = () => (
  <div className="relative flex overflow-hidden whitespace-nowrap bg-[#D9A441] py-2 text-[#080A0D]">
    <div className="flex shrink-0 animate-[marquee_34s_linear_infinite] will-change-transform">
      <Track copy={0} />
      <Track copy={1} />
    </div>

    {/* edge fades so items don't pop in at the sides */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-16"
      style={{ background: 'linear-gradient(90deg, #D9A441 0%, rgba(217,164,65,0) 100%)' }}
    />
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 w-16"
      style={{ background: 'linear-gradient(270deg, #D9A441 0%, rgba(217,164,65,0) 100%)' }}
    />
  </div>
);

export default AnnouncementBanner;
