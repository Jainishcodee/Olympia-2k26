# OLYMPIA 2K26 — Image Assets

Drop images into this folder using the **exact filenames** below.
Everything degrades gracefully: if a file is missing, the site falls back to the
built-in vector emblem / gradient stage, so nothing ever looks broken while
you're still collecting assets.

```
public/images/
├── brand/           ← the Olympia 2K26 identity
│   ├── olympia-logo.png        (REQUIRED — the hero object)
│   ├── olympia-wordmark.png
│   ├── olympia-mark.png
│   └── olympia-logo.svg        (optional, preferred if you have vector)
│
├── backgrounds/     ← environment / stage
│   ├── hero-stadium.jpg        (hero backdrop, 2400px+ wide, dark & moody)
│   ├── hero-glow.jpg           (optional atmospheric haze)
│   └── grain.png               (optional 512x512 tileable film grain)
│
└── sports/          ← floating sport objects (transparent PNG, ~512px)
    ├── ball-football.png
    ├── ball-cricket.png
    ├── ball-badminton.png
    ├── ball-volleyball.png
    └── ball-tabletennis.png
```

## Specs

| Asset | Size | Notes |
|---|---|---|
| `brand/olympia-logo.png` | 1024×1024, transparent PNG | **The hero object.** Navy + metallic gold. Keep the padding tight but leave ~4% breathing room so the glow doesn't clip. |
| `brand/olympia-wordmark.png` | 2048×512, transparent PNG | "OLYMPIA 2K26" horizontal lockup for the navbar / footer. |
| `backgrounds/hero-stadium.jpg` | 2400×1400 JPEG, < 400 KB | Should read as *environment*, not subject — it sits behind the emblem at ~35% opacity with a navy scrim. |
| `sports/*.png` | 512×512, transparent PNG | Isolated object, soft studio light, no baked-in shadow (shadows are added in CSS). |

## Colour discipline

- **Brand (identity):** Navy `#071426` + Metallic Gold `#D9A441` → `#FFD21F` sweep.
- **Environmental accents only:** Electric Blue `#1264FF`, Yellow `#FFD21F`, Orange `#FF6A00`.
- Do **not** introduce accent colours into the logo itself — the accents live in
  the atmosphere (glow, orbs, HUD), never on the mark.

## Naming

Lowercase, hyphenated, no spaces. The code imports by literal path
(e.g. `/images/brand/olympia-logo.png`), so a typo means the fallback renders
instead of your file.
