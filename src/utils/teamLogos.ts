/**
 * OLYMPIA 2K26 — Master Team Logo Registry & Resolver
 *
 * Automatically resolves and provides high-resolution logos for all 24 tournament teams.
 * Supports exact names, team doc IDs (e.g. `team-cricket-ronin-xi`), slugs, and aliases.
 */

// Eagerly import all logos from assets directory via Vite
const logoModules = import.meta.glob<string>('../assets/Logos/*.{jpg,png}', {
  eager: true,
  import: 'default',
});

export interface TeamLogoDefinition {
  name: string;
  sportId: 'cricket' | 'football' | 'volleyball' | 'hand-tennis' | 'lan-games';
  filename: string;
  slug: string;
  aliases: string[];
}

export const TEAM_REGISTRY: TeamLogoDefinition[] = [
  // LAN Games
  {
    name: 'Apex Attackers',
    sportId: 'lan-games',
    filename: 'Apex Attackers.jpg',
    slug: 'apex-attackers',
    aliases: ['apex attackers', 'apex', 'team-lan-games-apex-attackers'],
  },
  {
    name: 'Frag Ninjas',
    sportId: 'lan-games',
    filename: 'Frag Ninjas.jpg',
    slug: 'frag-ninjas',
    aliases: ['frag ninjas', 'ninjas', 'team-lan-games-frag-ninjas'],
  },
  {
    name: 'K-Strike',
    sportId: 'lan-games',
    filename: 'K-Strike.png',
    slug: 'k-strike',
    aliases: [
      'k-strike',
      'k strike',
      'kstrike',
      'k_strike',
      'k-strike.png',
      'kstrike.png',
      'k_strike.png',
      'team-lan-games-k-strike',
      'team-lan-games-kstrike',
      'team-lan-games-k_strike',
    ],
  },
  {
    name: "Lagga's Legends",
    sportId: 'lan-games',
    filename: "Lagga's Legends.jpg",
    slug: 'laggas-legends',
    aliases: ["lagga's legends", 'laggas legends', 'lagga legends', "team-lan-games-lagga's-legends", 'team-lan-games-laggas-legends'],
  },

  // Cricket
  {
    name: 'Boundary Breakers',
    sportId: 'cricket',
    filename: 'Boundary Breakers.jpg',
    slug: 'boundary-breakers',
    aliases: ['boundary breakers', 'team-cricket-boundary-breakers'],
  },
  {
    name: 'Legendary Lions',
    sportId: 'cricket',
    filename: 'Legendary Lions.jpg',
    slug: 'legendary-lions',
    aliases: ['legendary lions', 'lions', 'team-cricket-legendary-lions'],
  },
  {
    name: 'Power Hitters',
    sportId: 'cricket',
    filename: 'Power Hitters.jpg',
    slug: 'power-hitters',
    aliases: ['power hitters', 'hitters', 'team-cricket-power-hitters'],
  },
  {
    name: 'Ronin XI',
    sportId: 'cricket',
    filename: 'ronin XI.png',
    slug: 'ronin-xi',
    aliases: ['ronin xi', 'ronin 11', 'ronin-xi', 'ronin', 'team-cricket-ronin-xi'],
  },

  // Football
  {
    name: 'Reign FC',
    sportId: 'football',
    filename: 'Reign FC.jpg',
    slug: 'reign-fc',
    aliases: ['reign fc', 'reignfc', 'reign', 'team-football-reign-fc'],
  },
  {
    name: 'Shadow Strikers',
    sportId: 'football',
    filename: 'Shadow Strikers.jpg',
    slug: 'shadow-strikers',
    aliases: ['shadow strikers', 'team-football-shadow-strikers'],
  },
  {
    name: 'Super Strikers',
    sportId: 'football',
    filename: 'Super Strikers.jpg',
    slug: 'super-strikers',
    aliases: ['super strikers', 'team-football-super-strikers'],
  },
  {
    name: 'Vedant Blackfangs',
    sportId: 'football',
    filename: 'Vedant Blackfang.jpg',
    slug: 'vedant-blackfangs',
    aliases: ['vedant blackfangs', 'vedant blackfang', 'blackfangs', 'blackfang', 'team-football-vedant-blackfangs', 'team-football-vedant-blackfang'],
  },

  // Volleyball
  {
    name: "Jinu's Smashers",
    sportId: 'volleyball',
    filename: "Jinu's Smashers.jpg",
    slug: 'jinus-smashers',
    aliases: ["jinu's smashers", 'jinus smashers', 'jinu smashers', "team-volleyball-jinu's-smashers", 'team-volleyball-jinus-smashers'],
  },
  {
    name: 'Net Warriors',
    sportId: 'volleyball',
    filename: 'Net Warriors.jpg',
    slug: 'net-warriors',
    aliases: ['net warriors', 'team-volleyball-net-warriors'],
  },
  {
    name: 'Spike Warriors',
    sportId: 'volleyball',
    filename: 'Spike Warriors.jpg',
    slug: 'spike-warriors',
    aliases: ['spike warriors', 'team-volleyball-spike-warriors'],
  },
  {
    name: 'Vedant Spikers',
    sportId: 'volleyball',
    filename: 'Vedant Spikers.jpg',
    slug: 'vedant-spikers',
    aliases: ['vedant spikers', 'team-volleyball-vedant-spikers'],
  },
  {
    name: 'Vortex Aces',
    sportId: 'volleyball',
    filename: 'Vortex Aces.jpg',
    slug: 'vortex-aces',
    aliases: ['vortex aces', 'aces', 'team-volleyball-vortex-aces'],
  },
  {
    name: 'Vraj ke Veterans',
    sportId: 'volleyball',
    filename: 'Vraj ke Veterans.jpg',
    slug: 'vraj-ke-veterans',
    aliases: ['vraj ke veterans', 'vraj veterans', 'veterans', 'team-volleyball-vraj-ke-veterans'],
  },

  // Hand Tennis
  {
    name: 'Court Kings',
    sportId: 'hand-tennis',
    filename: 'Court Kings.jpg',
    slug: 'court-kings',
    aliases: ['court kings', 'team-hand-tennis-court-kings'],
  },
  {
    name: 'G.C. Spikers',
    sportId: 'hand-tennis',
    filename: 'G.C. Spikers.png',
    slug: 'gc-spikers',
    aliases: ['g.c. spikers', 'gc spikers', 'g c spikers', 'team-hand-tennis-g-c-spikers', 'team-hand-tennis-gc-spikers'],
  },
  {
    name: 'Hand Hitters',
    sportId: 'hand-tennis',
    filename: 'Hand Hitters.jpg',
    slug: 'hand-hitters',
    aliases: ['hand hitters', 'team-hand-tennis-hand-hitters'],
  },
  {
    name: 'Power Palm',
    sportId: 'hand-tennis',
    filename: 'Power Palm.jpg',
    slug: 'power-palm',
    aliases: ['power palm', 'team-hand-tennis-power-palm'],
  },
  {
    name: 'Shadow Spikers',
    sportId: 'hand-tennis',
    filename: 'Shadow Spikers.png',
    slug: 'shadow-spikers',
    aliases: ['shadow spikers', 'team-hand-tennis-shadow-spikers'],
  },
  {
    name: 'Shadow X',
    sportId: 'hand-tennis',
    filename: 'Shadow X.jpg',
    slug: 'shadow-x',
    aliases: ['shadow x', 'shadowx', 'team-hand-tennis-shadow-x'],
  },
];

// Helper to normalize strings for robust fuzzy lookup
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Build fast lookup dictionary
const logoCache = new Map<string, string>();

// Populate lookup dictionary
for (const item of TEAM_REGISTRY) {
  // Resolve bundled asset from glob
  const assetKey = `../assets/Logos/${item.filename}`;
  const bundledUrl =
    logoModules[assetKey] ||
    logoModules[`../assets/Logos/${item.filename.toLowerCase()}`] ||
    logoModules[`../assets/Logos/${item.slug}.png`] ||
    logoModules[`../assets/Logos/${item.slug}.jpg`] ||
    `/logos/${encodeURIComponent(item.filename)}`;

  // Store by exact name
  logoCache.set(item.name.toLowerCase(), bundledUrl);
  logoCache.set(normalizeKey(item.name), bundledUrl);

  // Store by slug
  logoCache.set(item.slug, bundledUrl);
  logoCache.set(normalizeKey(item.slug), bundledUrl);

  // Store by static URL paths
  logoCache.set(`/logos/${item.filename}`, bundledUrl);
  logoCache.set(`/logos/${item.filename.toLowerCase()}`, bundledUrl);
  logoCache.set(`/logos/${item.slug}.png`, bundledUrl);
  logoCache.set(`/logos/${item.slug}.jpg`, bundledUrl);
  logoCache.set(`/logos/${item.slug}`, bundledUrl);

  // Store by aliases
  for (const alias of item.aliases) {
    logoCache.set(alias.toLowerCase(), bundledUrl);
    logoCache.set(normalizeKey(alias), bundledUrl);
    logoCache.set(`/logos/${alias.toLowerCase()}`, bundledUrl);
  }
}

/**
 * Resolves a team logo URL from a team name, ID, or slug.
 *
 * @param identifier Team name, ID (e.g., `team-cricket-ronin-xi`), or slug
 * @returns Bundled asset URL or undefined if not matched
 */
export function getTeamLogo(identifier?: string | null): string | undefined {
  if (!identifier) return undefined;
  const raw = identifier.trim();
  if (!raw) return undefined;

  // Direct exact/case-insensitive match
  const direct = logoCache.get(raw.toLowerCase());
  if (direct) return direct;

  // Normalized alphanumeric match
  const normalized = normalizeKey(raw);
  const byNorm = logoCache.get(normalized);
  if (byNorm) return byNorm;

  // Check if identifier contains any registered team slug
  for (const item of TEAM_REGISTRY) {
    if (normalized.includes(normalizeKey(item.name)) || normalized.includes(normalizeKey(item.slug))) {
      return logoCache.get(item.slug);
    }
  }

  return undefined;
}

/**
 * Returns full metadata for a registered team.
 */
export function getTeamInfo(identifier?: string | null): TeamLogoDefinition | undefined {
  if (!identifier) return undefined;
  const norm = normalizeKey(identifier);
  return TEAM_REGISTRY.find(
    (t) => normalizeKey(t.name) === norm || normalizeKey(t.slug) === norm || t.aliases.some((a) => normalizeKey(a) === norm)
  );
}

/**
 * Return all registered teams with resolved logos.
 */
export function getAllTeamsWithLogos() {
  return TEAM_REGISTRY.map((team) => ({
    ...team,
    logoUrl: getTeamLogo(team.name) || `/logos/${team.filename}`,
  }));
}
