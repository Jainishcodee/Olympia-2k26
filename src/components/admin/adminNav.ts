import type { IconType } from 'react-icons';
import {
  HiOutlineChartPie,
  HiOutlineVideoCamera,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineLocationMarker,
  HiOutlineStar,
  HiOutlineThumbUp,
  HiOutlineSpeakerphone,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineFire,
  HiOutlineChat,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: IconType;
  /** Match this path exactly (used for `/admin`, which is a prefix of everything). */
  end?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

/**
 * The navigation model. Single source of truth for the sidebar *and* the
 * topbar section label — keep them in sync by editing only this file.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: HiOutlineChartPie, end: true },
      { label: 'Live Control', path: '/admin/live', icon: HiOutlineVideoCamera },
    ],
  },
  {
    label: 'Competition',
    items: [
      { label: 'Matches', path: '/admin/matches', icon: HiOutlineCalendar },
      { label: 'Fixtures', path: '/admin/fixtures', icon: HiOutlineClock },
      { label: 'Sports', path: '/admin/sports', icon: HiOutlineLightningBolt },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Teams', path: '/admin/teams', icon: HiOutlineUserGroup },
      { label: 'Players', path: '/admin/players', icon: HiOutlineUsers },
      { label: 'Venues', path: '/admin/venues', icon: HiOutlineLocationMarker },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { label: 'Reactions', path: '/admin/reactions', icon: HiOutlineFire },
      { label: 'Ratings', path: '/admin/ratings', icon: HiOutlineStar },
      { label: 'Reviews', path: '/admin/reviews', icon: HiOutlineChat },
      { label: 'Votes', path: '/admin/votes', icon: HiOutlineThumbUp },
    ],
  },
  {
    label: 'Content',
    items: [{ label: 'Announcements', path: '/admin/announcements', icon: HiOutlineSpeakerphone }],
  },
  {
    label: 'System',
    items: [
      { label: 'Administrators', path: '/admin/admins', icon: HiOutlineShieldCheck },
      { label: 'Settings', path: '/admin/settings', icon: HiOutlineCog },
      { label: 'Audit Log', path: '/admin/audit', icon: HiOutlineClipboardList },
    ],
  },
];

/** Every admin path → its human title, for the topbar and document title. */
export const ADMIN_TITLES: { match: RegExp; title: string; section: string }[] = [
  { match: /^\/admin\/?$|^\/admin\/dashboard$/, title: 'Dashboard', section: 'Overview' },
  { match: /^\/admin\/live/, title: 'Live Control Room', section: 'Overview' },
  { match: /^\/admin\/matches\/[^/]+\/scoring/, title: 'Match Scoring', section: 'Competition' },
  { match: /^\/admin\/matches\/create/, title: 'Create Match', section: 'Competition' },
  { match: /^\/admin\/matches\/[^/]+/, title: 'Match Detail', section: 'Competition' },
  { match: /^\/admin\/matches/, title: 'Matches', section: 'Competition' },
  { match: /^\/admin\/fixtures/, title: 'Fixtures', section: 'Competition' },
  { match: /^\/admin\/tournaments/, title: 'Tournaments', section: 'Competition' },
  { match: /^\/admin\/sports/, title: 'Sports', section: 'Competition' },
  { match: /^\/admin\/teams/, title: 'Teams', section: 'People' },
  { match: /^\/admin\/players/, title: 'Players', section: 'People' },
  { match: /^\/admin\/venues/, title: 'Venues', section: 'People' },
  { match: /^\/admin\/reactions/, title: 'Reactions', section: 'Engagement' },
  { match: /^\/admin\/ratings/, title: 'Ratings', section: 'Engagement' },
  { match: /^\/admin\/reviews/, title: 'Reviews', section: 'Engagement' },
  { match: /^\/admin\/votes/, title: 'Votes', section: 'Engagement' },
  { match: /^\/admin\/announcements/, title: 'Announcements', section: 'Content' },
  { match: /^\/admin\/admins/, title: 'Administrators', section: 'System' },
  { match: /^\/admin\/settings/, title: 'Settings', section: 'System' },
  { match: /^\/admin\/audit/, title: 'Audit Log', section: 'System' },
];

export const lookupAdminTitle = (pathname: string) =>
  ADMIN_TITLES.find((entry) => entry.match.test(pathname)) ?? {
    title: 'Admin',
    section: 'System',
  };
