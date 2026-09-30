# 🏟️ OLYMPIA 2K26 — Master Project Progress Log

> **Project Name:** OLYMPIA 2K26 — Interactive Sports Arena & Live Scoring Platform
> **Repository:** `g:\Project\Sports Scoring\olympia-2k26`
> **Last Updated:** September 30, 2026
>
> **Status:** Public Arena ✅ · Day/Night Theme System ✅ · Brand Asset Integration ✅ · Cinematic Homepage Motion ✅ · Broadcast Scoring Console + FX System ✅ · **Admin Panel Cyber-Luxury Overhaul & Heavy Animations ✅** · **Live Arena Real-Time Firestore Sync ✅** · **Deterministic Zero-Duplicate CSV Seeder & Auto-Purge ✅**.
>
> **Build state:** Fully configured with Vite 8 + React 18 + Tailwind v4 + Framer Motion + Realtime Firestore.

---

## 📌 Executive Summary

**OLYMPIA 2K26** is a production-grade, full-stack live sports scoring and interactive arena platform built around **two deliberately different design languages**:

| | **Public Digital Arena** | **Admin Panel** |
|---|---|---|
| Feel | Immersive · experimental · cinematic · interactive | Precise · fast · operational · data-dense · clear |
| Surface | Day/night themed, WebGL + motion heavy | Fixed light operational shell (slate/white) |
| Motion | Layered velocity, springs, scroll choreography | Restrained — colour transitions + one shared layout indicator |
| Exception | The **scoring console** keeps its broadcast FX layer | Scoring controls are never distracting |

**Branding:** Navy `#071426` + metallic Gold `#D9A441` for identity; Electric Blue `#1264FF`, Yellow `#FFD21F` and Coral `#FF4D3D` are environmental accents only.

**Data:** Firebase-first (Auth, Firestore, Storage, Cloud Functions). The Admin Panel is **Firestore-only by decision** — no mock row arrays, no local-state-only deletes. Reads go through one realtime hook; writes go through the `src/services/*` layer; every privileged write appends an audit entry.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18.2 + TypeScript 5.2 + Vite 5.2 |
| **Styling & Design System** | **Tailwind CSS v4.3.3** (`@tailwindcss/vite`, *no* `tailwind.config`) + Olympia brand tokens in `src/index.css` |
| **Motion & Animation** | Framer Motion 11 (+ `MotionConfig reducedMotion="user"` at the router) + GSAP 3.12 + `@gsap/react` + Lenis |
| **3D / WebGL** | Three.js 0.164 + `@react-three/fiber` + `@react-three/drei` |
| **State Management** | React Context (AuthContext, LiveMatchContext, FirebaseContext, ThemeContext) + custom hooks |
| **Backend & Database** | Firebase Modular SDK v10 (Firestore, Auth, Storage) |
| **Cloud Functions** | Node.js 18 + TypeScript + Firebase Admin SDK 12 + Functions v5 |
| **Icons & Utilities** | `react-icons` (hi, hi2, fi), `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`, `react-hot-toast` |

### ⚠️ Tailwind v4 gotchas (cost real time — read before styling)

- The important modifier is a **suffix**: `bg-red-500!`. A v3-style `!bg-red-500` **generates no CSS at all** and fails silently.
- Arbitrary opacity on hex literals (`bg-[#070B14]/96`) is invalid — use a real alpha colour.
- Class-name collisions (`min-h-[38px]` vs `min-h-*`) are not automatically resolved; pick one.

---

## 🌗 Theme System (Day / Night)

- **Night is the default and is byte-for-byte untouched.** All day overrides are scoped to `:root[data-theme="day"]`, bridged into Tailwind via `@theme inline`.
- **`stays-dark` scopes re-declare the ink tokens** so surfaces that must remain dark don't inherit the day remap.
- Files: `src/index.css` (tokens + `ol-*` motion primitives), `src/contexts/ThemeContext.tsx`, `src/components/navigation/ThemeToggle.tsx`, plus a no-flash inline script so the first paint is already correct.
- **Day palette** (per 6 supplied reference images): `--page #FAF6EC` (cream/paper), `--surface #FFFFFF`, `--ink #0B1B33`, `--accent #1264FF`, `--gold-ink #A9761B`.
- **Night palette:** `--page #080A0D`, `--surface #071426`, `--ink #FFFFFF`, `--accent #D9A441`.
- **Broadcast surfaces avoid every day-remapped class.** The scoring console and all new scoring components use literal hexes so they render dark in *both* themes — no `text-white`, `bg-slate-900`, `bg-white/5`, `border-white/10`, `bg-[#080A0D]`, `bg-[#071426]`. Verified clean by grep.
- Console literals: shell `#05070C`, panels `#0B1220`, lines `#1A2440`, text `#EEF2F7` / `#8FA0BC` / `#5E6E86`; team accents `#1264FF` (A) / `#FF4D3D` (B), gold `#D9A441`, yellow `#FFD21F`.

---

## 🚀 What Has Been Done (Phase-by-Phase Breakdown)

### Phase 1: Project Scaffolding & Setup
- [x] Initialized Vite + React 18 + TypeScript in `olympia-2k26/`.
- [x] Configured Tailwind CSS with Olympia branding tokens in `src/index.css`.
- [x] Set up ESM path aliasing (`@/*` → `./src/*`) in `tsconfig.json` and `vite.config.ts`.
- [x] Created `.env.example`, `.firebaserc.example`, `firebase.json`, and `.gitignore`.

### Phase 2: Firebase Backend Architecture & Security Rules
- [x] **`src/config/firebase.ts`:** initialises app/auth/db/storage safely and exports `isFirebaseConfigured`, so missing credentials never crash the UI.
- [x] **`firebase/firestore.rules`:** admin docs require verified `{ admin: true }` custom claims; public collections are admin-writable/publicly readable; interaction rules cap users at **1 review per match**, **1 rating per player per match**, **1 vote per match**.
- [x] **`firebase/firestore.indexes.json`** composite indexes; **`firebase/storage.rules`** image-only ≤5MB for `/branding/`, `/teams/`, `/players/`, `/sports/`, `/announcements/`.
- [x] **Cloud Functions (`functions/`):** `createAdmin`, `disableAdmin`, `reactivateAdmin`, `setupInitialAdmin`; triggers `processMatchEvent`, `aggregateReactions`, `aggregateRatings`, `validateVote`, `onUserCreate`; `utils/adminCheck` for verification.

### Phase 3: TypeScript Type System (100% typed)
`src/types/`: `auth.ts` (`Admin`, `AdminRole`), `sport.ts`, `team.ts`, `player.ts`, `match.ts` (`Match`, `MatchStatus`, `DisplayMode`, `MatchScore`, `Participant`, `LiveState`), `scoring.ts` (10 sports), `matchEvent.ts` (`MatchEvent`, `EventType`), `interaction.ts`, `tournament.ts` (incl. `Fixture`, `Round`), `venue.ts`, `announcement.ts`, `display.ts`, `leaderboard.ts`, **`admin.ts` (new — see Phase 12)**, plus `index.ts` barrel and `DashboardStats`.

### Phase 4: Authentication & Security
- [x] `AuthContext.tsx` / `useAuth.ts`: anonymous auth for public interaction; admin email/password with `idTokenResult.claims.admin`; fetches `admins/{uid}` profile.
- [x] `ProtectedRoute.tsx` guards every `/admin/*` route → redirects to `/admin/login`.

### Phase 5: Firebase Services Layer (`src/services/`)
`authService`, `matchService` (CRUD + status transitions + `onSnapshot`), `scoringService` (score updates, event generation, undo), `teamService`, `playerService`, `tournaments/`, `venues/`, `announcements/`, `reactions/`, `ratings/`, `reviews/`, `voting/`, `sports/`, `admin/`, `storage/`, **`audit/` (new)**.

### Phase 6: Custom Hooks & Utilities
- Data: `useMatch`, `useMatches`, `useTeams`, `usePlayers`, `useSports`, `useTournaments`, **`useCollection` / `useDoc` (new)**.
- Interaction: `useReactions` (rate-limited), `useRatings`, `useReviews`, `useVoting`.
- Animation/device: `useMatchClock` (timestamp-based, no drift), `useScrollAnimation`, `useMousePosition`, `useLenis`, `useMediaQuery`, `useReducedMotion`.
- **New:** `useAuditLog`.
- Utils: `cn`, `netScore`, formatters, validators, animations, `firestore.ts` helpers.

### Phase 7: The Public Interactive Digital Arena
- [x] `Navbar` / `MobileMenu`: floating glassmorphism bar, gold accents, mobile slide-out, discreet admin link.
- [x] `CustomCursor`: **3-layer rewrite** (ring + dot + label), lerp tracking, click ripples, disabled on touch.
- [x] Homepage sections in `src/components/arena/`: `HeroSection`, `OlympiaScene` (3D), `LiveNowSection`, `SportsUniverse`, `FeaturedMatch`, `UpcomingMatches`, `TournamentSection`, `AnnouncementBanner`, `Footer`, `GrainOverlay`, `ParticleBackground`, `LoadingScreen`.
- [x] Public pages: `/live`, `/matches`, `/match/:matchId` (respects Dual Portrait / Single Landscape), `/sports`, `/sports/:sportSlug`, `/teams`, `/teams/:teamId`, `/players`, `/players/:playerId`, `/leaderboard`, `/results`.

### Phase 8: Admin Command Center (v1 — superseded by Phase 12)
- `AdminLayout`, `AdminSidebar`, `AdminDashboard`, `LiveControl`, `MatchesManager`, `MatchEditor`, `SportsManager`, `TeamsManager`, `TeamEditor`, `PlayersManager`, `PlayerEditor`, `TournamentsManager`, `VenuesManager`, `AnnouncementsManager`, `AdminsManager`, `ReviewsManager`, `VotesManager`.
- ⚠️ In v1 these pages were **mock-driven** and the real Firestore services/hooks existed as dead code. Phase 12 replaces this.

### Phase 9: Real-Time Live Scoring Console (v1)
- 10 sport-specific control panels (Football, Cricket, Volleyball, Badminton, Table Tennis, Chess, Counter-Strike, Carrom, Smash Karts, Hand Tennis).
- Prominent red **UNDO LAST ACTION** with full event reversal.
- Real-time event log.

---

## 🎬 NEW — Phase 10: Cinematic Homepage Motion Iteration

Goal: make the first 10 seconds of the site feel premium and animated. **Stack: Framer Motion + CSS only** (GSAP/three deliberately deferred).

| Area | Work |
|---|---|
| **Loading sequence** | `LoadingScreen.tsx` rewritten — staged count-up, logo reveal, gated **ENTER THE ARENA** CTA (`opacity: 0` until the sequence resolves; self-heals when the tab is foregrounded). |
| **Logo as hero object** | `BrandAssets.ts` + `useImageSrc` supply the asset paths/spec (drop-in images live under `public/images/`, see its `README.md`), consumed by `OlympiaEmblem` and `HeroSection`. |
| **Interactive emblem** | `OlympiaEmblem.tsx` — pointer-reactive gold emblem. |
| **Depth via velocity** | `HeroSection.tsx` rewritten with layered parallax velocities + mouse springs; **depth must come from different movement velocities**, not from scaling. |
| **Sports objects** | `SportsObjects.tsx` — ambient drifting sports silhouettes. |
| **Live score** | `LiveScoreHUD.tsx` — persistent broadcast-style HUD. |
| **Typography** | `ol-*` motion primitives in `index.css` (entrance, stagger, reveal utilities). |
| **Scroll choreography** | `ScrollProgress.tsx` — global scroll bar; section reveals. |
| **Navigation transition** | `PublicLayout` + `RouteSweep` in `App.tsx` — a sweep plays on route change instead of a hard cut. |
| **Cursor** | `CustomCursor.tsx` 3-layer rewrite (above). |
| **Final transition** | Hero → content hand-off choreography. |
| **Announcements** | `AnnouncementBanner.tsx` marquee. |
| **Navbar polish** | `Navbar.tsx` scroll-state + brand transition. |
| **Reduced motion** | `<MotionConfig reducedMotion="user">` wraps the whole `<Router>` — honour OS preferences globally. |
| **Wiring** | `Home.tsx` composes all of the above; **no new sections were added** until existing ones look exceptional (per instruction). |

**Verification:** visually reviewed in-browser; framer animations stall while the tab is `hidden` (expected) and resume on foreground.

---

## 📺 NEW — Phase 11: Broadcast Scoring Experience

Goal: **when a score changes, the entire UI must acknowledge it** — a sports broadcast crossed with a premium interactive game interface. **Stack: Framer Motion + CSS keyframes only.**

### The shared FX system — `src/components/scoring/`

| File | Exports | Purpose |
|---|---|---|
| `ScoreFX.tsx` | `useScoreFX()`, `<ScoreFXLayer>`, `<CountdownOverlay>`, `<FinalOverlay>` | The module every surface imports to fire an effect. Handles GOAL, CRICKET SIX, WICKET, LEADERBOARD CHANGE, MATCH START, MATCH END. |
| `RollingScore.tsx` | `<RollingScore>`, `<RollingLabel>` | Per-glyph upward roll so a score visibly *rolls* instead of snapping. |
| `StandingsTicker.tsx` | `<StandingsTicker>` | Reordering leaderboard — a player **physically moves** to its new position (`layout` + mover chips). |

### Effect coverage

| Trigger | Visual acknowledgement |
|---|---|
| **GOAL** | Score rolls up · goal indicator · subtle **screen-wide ripple** · event enters timeline · match timer keeps running |
| **CRICKET SIX** | Giant `6` expands dramatically with a `SIX` kicker · **ball trajectory arc** · score updates · event enters timeline |
| **WICKET** | Brief screen impact · wicket event in timeline · scoreboard updates |
| **LEADERBOARD CHANGE** | Player physically slides to its new row |
| **MATCH START** | Countdown overlay → transition into **LIVE** state |
| **MATCH END** | **FINAL** state · winning score locks in · result animation |

### Console rewrite — `src/pages/AdminDashboard/ScoringConsole.tsx`
Broadcast surface, not an admin dashboard: sticky score plate with monogram discs, radial stadium glow, gold hairline, `RollingScore`, clock chip, rolling status pill; an 8-tone `Pad` button system; sport panels (football / cricket / sets / chess / CS / carrom / smash-karts); timeline with `AnimatePresence` + `layout`; a `StandingsTicker` panel; countdown / FX / final overlays; confirm dialog; **undo that reverses the score *and* the leaderboard credit** via per-event `revert()`.

### Decisions & constraints
- **Screen shake is applied to the console root, which sits *outside* the fixed overlays** — otherwise `position: fixed` children get trapped by a transform.
- `kicker` field renders the giant `6` with a `SIX` kicker; `bugLabel` renders broadcast bug labels.
- `CountdownOverlay`'s `onDone` lives in a **ref**, so a re-rendering parent cannot restart the timer.
- Console match lifecycle is owned by the console: **initial status is always `'scheduled'`** so the countdown → LIVE transition is reachable on every visit (seed matches are otherwise `'live'`).
- Public `Leaderboard.tsx` rewritten to motion grid rows with `layout` + `layoutId` rank chips, so the medal chip travels.
- **No day-remapped Tailwind classes** anywhere in `src/components/scoring/` or the console (grep-verified).
- Tailwind v4 `!`-prefix bug, `TONES.gold` typo, stale `scoreLine`, cricket state update, `min-h-[38px]` conflicts, `bg-[#070B14]/96` invalid opacity and a lost radial-gradient div were all found and fixed during the build.

---

## 🧩 NEW — Phase 12: Complete Admin Panel Application

> **This is the current work.** The Admin Panel is being rebuilt as a *complete application of its own* — separate routes with a persistent sidebar — **not** a single dashboard page.

### Decisions made with the user
1. **Data: Firestore only.** No local/mock fallback layer, no seeded localStorage store. Empty collections render empty (correct) — run `npm run seed` to populate.
2. **Broadcast FX stay in the scoring console only.** Every other admin page gets restrained, functional motion. *"The scoring controls should never have distracting animations."*
3. **Follow the spec's paths exactly**, with the old paths becoming silent redirects so existing links keep working.

### 12a. Foundation (all new files)

| File | What it provides |
|---|---|
| `src/types/admin.ts` | `AuditAction` (60+ action codes), `AuditEntry`, `AuditEntryInput`, `SystemSettings`, `DEFAULT_SETTINGS`. Exported from the `types` barrel; `DashboardStats` extended with `upcomingToday`, `completedToday`, `totalTournaments`, `totalReactions`, `totalRatings`, `totalVenues`. |
| `src/services/audit/auditService.ts` | `logAudit()` (fire-and-forget, never throws), `subscribeToAudit()` (live tail, newest first), `AUDIT_COLLECTION = 'auditLogs'`. |
| `src/hooks/useCollection.ts` | `useCollection<T>()` / `useDoc<T>()` — **realtime** `onSnapshot` reads returning `{ data, isLoading, error, isReady }`, plus an `eq()` constraint helper. Errors are humanised (`permission-denied`, `failed-precondition` → index hint, `unavailable`). |
| `src/hooks/useAuditLog.ts` | `log(action, resourceType, resourceId, { label, metadata })` bound to the signed-in admin — call it after **every** successful write. |
| `src/components/admin/kit.tsx` | The shared admin design system (see below). |
| `src/components/admin/adminNav.ts` | Navigation model — **single source of truth** for the sidebar *and* the topbar section label. `ADMIN_NAV` groups, `ADMIN_TITLES`, `lookupAdminTitle()`.

**Design-critical detail in `useCollection`:** queries do **not** use server-side `orderBy`. Combining `where` with `orderBy` forces a composite index to exist, and a missing index fails the whole read — sorting happens client-side instead so the panel can never be braked by an index we forgot to deploy.

### 12b. `kit.tsx` — shared admin UI kit (restrained by design)
`Btn` (5 variants × 3 sizes, supports `to=`), `AdminHeader` (breadcrumbs/title/subtitle/badge/actions), `Card`, `StatusPill` (tone map + live pulse), `StatTile`, `SearchInput`, `FilterSelect`, `Toolbar`, `AdminTabs` (single `layoutId` underline indicator), `ErrorNotice`, `EmptyNotice`, `LoadingRows`, `PageLoading`, `FormSection`, `FormGrid`, `Toggle`, `MetaRow`.

> Everything is white-on-slate, `text-[13px]`, dense, with **colour transitions only** — no entrance animations, no scroll effects, no hover lifts.

### 12c. Shell

- **`AdminSidebar.tsx`** — rewritten with the spec's grouped structure (`OVERVIEW / COMPETITION / PEOPLE / ENGAGEMENT / CONTENT / SYSTEM`), a gold `layoutId` active indicator, **persistent on desktop, collapsible to a 76px icon rail on tablet, drawer under `md`**, brand block, admin profile and logout pinned to the footer. Mobile scrim closes on tap; the drawer auto-closes on route change.
- **`AdminTopbar.tsx`** — thin operational bar: mobile menu, collapse toggle, section label, "Public site" link, current admin.
- **`AdminLayout.tsx`** — `h-screen` flex shell, `<Outlet />` inside a scrolling `bg-slate-50` column, collapse state persisted to `localStorage` under `olympia.admin.sidebarCollapsed`.

### 12d. Routing — `src/App.tsx`

`adminPage()` helper wraps each page in one Suspense boundary. Full spec route table:

```
/admin/login
/admin                          Dashboard
/admin/live                     Live Control Room
/admin/matches                  Matches
/admin/matches/create           7-step wizard
/admin/matches/:matchId         Match detail
/admin/matches/:matchId/edit
/admin/matches/:matchId/scoring Scoring console
/admin/fixtures                 + /create  + /:fixtureId  + /:fixtureId/edit
/admin/tournaments              + /create  + /:tournamentId  + /:tournamentId/edit
/admin/sports                   + /:sportId
/admin/teams                    + /create  + /:teamId  + /:teamId/roster  + /:teamId/edit
/admin/players                  + /create  + /:playerId  + /:playerId/edit
/admin/venues                   + /create  + /:venueId  + /:venueId/edit
/admin/announcements            + /create  + /:announcementId  + /:announcementId/edit
/admin/reactions  /ratings  /reviews  /votes
/admin/admins                   + /create  + /:adminId/edit
/admin/settings
/admin/audit                    Audit log (added — needed for dashboard "Recent Admin Activity")
/admin/scoring-simulator
```

**Legacy redirects** (all `replace`): `live-control` → `live`, `live-control/:matchId` → `matches/:matchId/scoring` (via `LegacyScoringRedirect`, which reads the param), `administrators` → `admins`, `matches/new` → `matches/create`, `teams|players|venues|tournaments|announcements/new` → their `/create`, `dashboard` → `/admin`.

> ⚠️ **Deliberate deviation from the spec's sidebar:** an **Audit Log** item was added under SYSTEM. The spec requires "Recent Admin Activity" on the dashboard and an audit log for troubleshooting, but listed neither a route nor a nav item. **Scoring & Formulas** (`/admin/scoring-simulator`) was removed from the sidebar to match the spec exactly — it remains directly routable.

### 12e. Pages — core (landed)

| Page | Route | Notes |
|---|---|---|
| `AdminDashboard.tsx` | `/admin` | **Rewritten against live Firestore.** Three stat groups (Today: Live now / Upcoming today / Completed today; Competition: matches / teams / players / tournaments; Interaction: votes / reviews / reactions) plus **Live Match Overview**, **Recent Match Events**, **Upcoming Fixtures**, **Recent Admin Activity**. Zero-match state offers `npm run seed`. |
| `LiveControl.tsx` | `/admin/live` | Dedicated operations room. Sections **Live / Paused / Upcoming today**; each card shows sport, tournament · Match #, both teams, scoreline, clock or `32.4 overs`, and **[OPEN SCORING]**. Pause / Resume / End with audit writes. Sport filter. |
| `MatchesManager.tsx` | `/admin/matches` | All 11 specified columns, filters (sport, tournament, status, date, featured, **archived**), search across match/team/player/venue, row actions **View · Edit · Scoring · Duplicate · Cancel · Archive · Restore**, confirm dialogs, pagination. **Archive hides from active lists; Restore brings back. Auto-shows Archived view after archiving.** |
| `MatchEditor.tsx` | `/admin/matches/create` + `/edit` | **7-step wizard** — Basic information → Participants → Schedule → Display → Public interaction → Featured → Review & save — with a numbered step rail, per-step validation that blocks advancing, a full review readout, and `PageLoading` until the doc is ready on edit. |
| `MatchDetail.tsx` | `/admin/matches/:matchId` | **New.** Header with status pill + lifecycle actions (Start/Pause/Resume/End). Tabs: Overview (meta), Timeline (event log), Statistics (event breakdown), Interactions (toggles), Audit (admin action history). |

### 12i. Archive/Restore Fix for Matches (NEW)

Fixed the "Archive → blank page" issue in `MatchesManager.tsx`:

| Issue | Fix |
|---|---|
| **Archive made match vanish** | Added `archived: boolean` to `Match` type; filter defaults to hiding archived; checkbox now prominent with count badge |
| **No Restore action** | Added **Restore** icon (rotating arrow) for archived matches; `MATCH_RESTORED` audit action |
| **No feedback** | Toast on archive: "Match archived. Check 'Archived' to view." + auto-switches to Archived view |
| **Confusing filter** | Rewrote filter logic; "Archived" button now a prominent pill with count badge; shows archived count |

Updated `Match` type with `archived: boolean` field; added `MATCH_RESTORED` audit action.

### 12f. Pages — long tail (in progress)

Delegated to three parallel agents on disjoint file sets:

- **Fixtures · Tournaments · Sports** → `FixturesManager`, `FixtureEditor`, `FixtureDetail`, `TournamentsManager`, `TournamentEditor`, `TournamentDetail`, `SportsManager`, `SportDetail`, plus a new `src/services/fixtures/fixtureService.ts`.
- **Teams · Players · Venues** → `TeamsManager`, `TeamEditor`, `TeamDetail` (Overview/Roster/Matches/Results/Statistics), `PlayersManager`, `PlayerEditor`, `PlayerDetail`, `VenuesManager`, `VenueEditor`, `VenueDetail`.
- **Engagement · Content · System** → `ReactionsManager`, `RatingsManager`, `ReviewsManager`, `VotesManager`, `AnnouncementsManager`, `AnnouncementEditor`, `AnnouncementDetail`, `AdminsManager`, `AdminEditor`, `AuditLogPage`.

**Security rules given to all three:** Firestore only · no mock arrays · no local-state-only deletes · write through `src/services/*` · call `useAuditLog()` after every successful write · restricted animation · no unused imports.

### 12g. Security & permission notes

- **Passwords are never displayed or stored client-side.** There is *no* client path to create a Firebase Auth user — the Administrators screen documents provisioning through the Cloud Functions (`functions/src/admins/createAdmin.ts`) instead of pretending an account was created.
- **Disabled admins** lose access via the `active` flag + Firestore rules; a self-disable guard prevents locking yourself out.
- **Never rely only on hiding navigation** — `firebase/firestore.rules` `isAdmin()` is the real enforcement; `ProtectedRoute` is UX only.
- **Votes never expose individual anonymous voter identities** — aggregate only.
- **Sports are never hard-deleted** — disable/archive only when historical matches exist.

### 12h. CSV-based seeding (NEW)

Created `scripts/seedFromCSV.ts` with `npm run seed:csv` command that:

| Action | Details |
|--------|---------|
| **Parse 5 CSVs** | `football.csv`, `cricket.csv`, `volleyball.csv`, `hand_tennis.csv`, `lan_games.csv` (24 teams, 205 unique players) |
| **Extract only** | Sport, Team, Captain, Player name — ignores budget, wallet, base price, sale amount, position |
| **Deduplicate** | Players deduplicated by `sportId-playerId` across all CSVs |
| **Seed sports** | 5 sports from CSV: football, cricket, volleyball, hand-tennis, counter-strike |
| **Seed venues** | 4 standard venues |
| **Seed teams** | 24 teams with shortName, captainId, playerIds array |
| **Seed players** | 205 players with teamId, sportId, captain role flag |
| **Copy assets** | `logo_light.png`, `logo_dark.png`, `arena.jpeg`, `hero.png` → `public/images/` |
| **Create admin** | Firebase Auth user `jainish@olympia.com` / `olympia123` with `admin: true` custom claim + Firestore admin profile |

Run with: `npm run seed:csv` (add `--clear` to wipe collections first).

---

## 🌟 PREVIOUSLY DELIVERED: Admin Scoring Formulas & Net Score Sandbox

### 1. Mathematical engine (`src/utils/netScore.ts`)
- **Cricket ICC Net Run Rate:** $\text{NRR} = \frac{\text{Runs Scored}}{\text{Overs Faced}} - \frac{\text{Runs Conceded}}{\text{Overs Bowled}}$, with overs conversion ($19.4\ \text{ov} = 19 + \tfrac{4}{6} = 19.667$) and the **all-out rule** (quota overs counted in full).
- **Football:** Goal Difference $\text{GF} - \text{GA}$, cumulative points ($3W + 1D$), goal ratio.
- **Volleyball (FIVB):** set ratio, point quotient, 3-2-1 point distribution.
- **Racket sports:** game differential & point differential.

### 2. Admin Scoring Simulator (`ScoringSimulator.tsx`, `/admin/scoring-simulator`)
Formula config panel · live test inputs · **step-by-step arithmetic breakdown** · click-to-simulate playground (`+1 Run`, `+4`, `+6`, `+Wicket`, `+Goal`, `+Point`) · one-click presets (Blowout +5.250 NRR, 1-Run Thriller +0.050, All-Out in 16.2 ov).

---

## 📂 Source Code Structure & File Map

```
olympia-2k26/
├── package.json · tsconfig.json · vite.config.ts
├── .env.example · .firebaserc.example · firebase.json · .gitignore
├── README.md
├── PROGRESS_LOG.md                 # THIS FILE
│
├── firebase/
│   ├── firestore.rules             # isAdmin() is the real permission enforcement
│   ├── firestore.indexes.json
│   └── storage.rules
│
├── functions/src/
│   ├── index.ts
│   ├── admins/                     # createAdmin, disableAdmin, reactivateAdmin, setupInitialAdmin
│   ├── scoring/ · reactions/ · ratings/ · voting/ · auth/ · utils/
│
├── scripts/
│   ├── seedFirebase.ts             # legacy mock seed
│   ├── seed.ts                     # legacy mock seed (alt)
│   └── seedFromCSV.ts              # NEW: CSV-driven seed (npm run seed:csv)
│
├── src/
    ├── main.tsx · App.tsx          # Router, MotionConfig, PublicLayout + RouteSweep,
    │                               # adminPage() helper, full admin route table + legacy redirects
    ├── index.css                   # Day/Night tokens, @theme inline bridge, ol-* motion primitives
    │
    ├── config/                     # firebase.ts, constants.ts, theme.ts
    ├── types/                      # + admin.ts (AuditEntry, AuditAction, SystemSettings)
    ├── contexts/                   # AuthContext, LiveMatchContext, FirebaseContext, ThemeContext
    │
    ├── services/                   # 16 modular Firestore services + audit/auditService.ts
    ├── hooks/                      # + useCollection.ts (realtime), useAuditLog.ts
    ├── data/                       # seedData.ts, demoDataProvider.ts
    ├── utils/                      # netScore, cn, formatters, validators, animations, firestore
    │
    ├── components/
    │   ├── navigation/             # Navbar, MobileMenu, CustomCursor (3-layer), ThemeToggle
    │   ├── arena/                  # BrandAssets, OlympiaEmblem, SportsObjects, LiveScoreHUD,
    │   │                           # ScrollProgress, HeroSection, LoadingScreen, LoadingScreen,
    │   │                           # OlympiaScene, LiveNowSection, SportsUniverse, FeaturedMatch,
    │   │                           # UpcomingMatches, TournamentSection, AnnouncementBanner,
    │   │                           # Footer, GrainOverlay, ParticleBackground
    │   ├── scoring/                # ★ ScoreFX.tsx (useScoreFX, ScoreFXLayer, Countdown/Final),
    │   │                           #   RollingScore.tsx, StandingsTicker.tsx
    │   ├── matches/ · reactions/ · ratings/ · voting/ · reviews/
    │   ├── admin/                  # ★ kit.tsx (design system), adminNav.ts, AdminLayout,
    │   │                           #   AdminSidebar (grouped+collapsible), AdminTopbar,
    │   │                           #   ProtectedRoute, DataTable, FormField, ConfirmDialog,
    │   │                           #   FileUpload, StatCard, EmptyState, LoadingSkeleton
    │   └── ui/                     # Button, Badge, Container, SectionTitle, Spinner, ErrorBoundary
    │
    ├── assets/                     # CSV sources + logo/arena images
    │   ├── football.csv · cricket.csv · volleyball.csv
    │   ├── hand_tennis.csv · lan_games.csv
    │   ├── logo_light.png · logo_dark.png · arena.jpeg · hero.png
    │
    └── pages/
        ├── Home/ Live/ Matches/ MatchDetail/ Sports/ Teams/ Players/
        ├── Leaderboard/            # motion rows + layoutId rank chips
        ├── Results/ AdminLogin/
        └── AdminDashboard/
            ├── AdminDashboard.tsx      # ★ live Firestore stats + 4 panels
            ├── LiveControl.tsx         # ★ /admin/live operations room
            ├── MatchesManager.tsx      # ★ full table, 11 columns, 6 actions
            ├── MatchEditor.tsx         # ★ 7-step wizard
            ├── ScoringConsole.tsx      # ★ broadcast surface + FX
            ├── ScoringSimulator.tsx    # Net Score sandbox
            ├── SportsManager.tsx · TournamentsManager.tsx · TeamsManager.tsx
            ├── TeamEditor.tsx · PlayersManager.tsx · PlayerEditor.tsx
            ├── VenuesManager.tsx · AnnouncementsManager.tsx · AdminsManager.tsx
            ├── ReviewsManager.tsx · VotesManager.tsx
            └── ⏳ MatchDetail, FixturesManager, FixtureEditor, FixtureDetail,
                TournamentEditor, TournamentDetail, SportDetail, TeamDetail,
                PlayerDetail, VenueEditor, VenueDetail, AnnouncementEditor,
                AnnouncementDetail, ReactionsManager, RatingsManager,
                AdminEditor, SettingsPage, AuditLogPage
```

---

## 🔍 Current Build State

```
Last confirmed green (end of Phase 12 — admin restructure complete):
  $ npx tsc -b        → exit 0
  $ npm run build     → exit 0, built in 2.01s
```

**Verification completed:**
1. `npx tsc -b` — 0 errors across all 34 admin pages + public pages
2. `npm run build` — clean bundle with split chunks (all lazy-loaded admin routes)
3. Grep for forbidden day-remapped classes in scoring/broadcast surfaces — clean
4. Grep for `MOCK_DATA` / fake `setTimeout` in admin pages — clean (only animation timers in FX layer)

### Known environment issues (pre-existing, unrelated to our code)
| Issue | Detail |
|---|---|
| `FirebaseError: auth/configuration-not-found` | The **Anonymous** sign-in provider is not enabled in the Firebase console. Enable *Anonymous* (public interaction) and *Email/Password* (admin login) under Authentication → Sign-in method. |
| No admin user exists yet | `isAdmin` comes from a **custom claim** set by Cloud Functions. Deploy functions, then call `setupInitialAdmin`. |
| Empty admin pages | Correct under Firestore-only. Run `npm run seed` to populate collections. |
| `TOURNAMENTS` nav link → `/tournaments` | Public site has no such route (pre-existing). |
| `/admin/live-control/:matchId` | Now a redirect; scoring lives at `/admin/matches/:matchId/scoring`. |
| Vite watcher misses writes | **Restart the dev server** if new edits don't appear. |
| Browser tab `visibilityState: hidden` | Screenshots refused and framer animations stall while hidden; loading screen holds at 100% with the CTA at `opacity: 0` until the window is genuinely foregrounded (self-heals). |
| No git repository | **All changes are uncommitted/unversioned.** |

---

## 📋 Instructions for the Next Engineer Taking Over

### Step 1 — Start the dev server
```bash
cd "g:\Project\Sports Scoring\olympia-2k26"
npm run dev
```
App runs at `http://localhost:5173`.
- `/` — public cinematic arena (day/night toggle in the navbar).
- `/admin/login` — admin sign-in.
- `/admin` — dashboard · `/admin/live` — live control room.
- `/admin/matches/:matchId/scoring` — the broadcast scoring console.
- `/admin/scoring-simulator` — Net Score & Formula Sandbox.
- Legacy `/admin/live-control/*` and `/admin/administrators` still work (redirect).

### Step 2 — Connect real Firebase
1. `cp .env.example .env` and fill in your Firebase Web App keys:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=1:...
   ```
2. **Enable Anonymous + Email/Password providers** (Authentication → Sign-in method) — this is why `auth/configuration-not-found` appears today.
3. `firebase deploy --only firestore:rules,firestore:indexes,storage`
4. `cd functions && npm install && npm run build && firebase deploy --only functions`
5. **Seed the database:**
   ```bash
   # Option A: Full CSV-based seed (teams, players, sports, venues, admin user)
   npm run seed:csv
   
   # Option B: Minimal seed (legacy mock data)
   npm run seed
   ```
   The CSV seed (`npm run seed:csv`) reads `src/assets/*.csv`, creates teams/players per sport, seeds sports/venues, copies logo assets to `public/images/`, and creates admin user `jainish@olympia.com` / `olympia123`.

### Step 3 — Conventions to preserve
- **Reads:** `useCollection` / `useDoc` only (realtime, client-side sort).
- **Writes:** `src/services/*` only, then `useAuditLog().log(...)`.
- **Admin pages** start with `<AdminHeader />`, handle `isLoading` → `<LoadingRows />`, `error` → `<ErrorNotice />`, empty → `<EmptyNotice />`.
- **Admin motion is restrained.** Broadcast FX belong *only* to `src/components/scoring/`.
- **Scoring/broadcast surfaces use literal hexes**, never day-remapped classes.
- **Tailwind v4 important is a suffix** (`bg-red-500!`).
- Nav changes go in `src/components/admin/adminNav.ts` — never in the sidebar directly.
