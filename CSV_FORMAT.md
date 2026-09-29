# OLYMPIA 2K26 - Simplified Team/Player CSV Format

## New Format: One row per team

```csv
Sport,Team,Captain,Players
Football,"Reign FC","Rishi","Arham;Dishant;Harshil;Karan;Kavya;Niyam;Rachit;Sam;Vandan;Vraj;Yash"
Football,"Shadow Strikers","Arham","Devam;Herit;Jainish;Megh;Moksh;Parth;Parth;Utsav;Vishrut;Yash"
Cricket,"Boundary Breakers","Moksh","Aadi;Adil;Arham;Dishant;Lubhansh;Manan;Pal;Shasan;Vatsal;Vedant;Vishrut"
Cricket,"Legendary Lions","Yash","Arham;Harshil;Karan;Kavya;Nem;Niyam;Parth;Pratham;Rishi;Yash"
```

## Column Details

| Column | Description | Example |
|--------|-------------|---------|
| **Sport** | Sport name (must match config) | Football, Cricket, Volleyball, Hand Tennis, LAN Games |
| **Team** | Team name (will be used as doc ID after slugify) | "Reign FC" |
| **Captain** | Captain's name (must exist in Players list) | "Rishi" |
| **Players** | Semicolon-separated list of player names | "Arham;Dishant;Harshil;Karan" |

## Notes

- Player names are matched case-insensitively
- Captain MUST be one of the listed players
- Team ID is auto-generated from team name (lowercase, hyphens)
- Player IDs are auto-generated as: `{sportId}-{playerName-slugified}`
- Duplicate player names across teams are allowed (each team gets own player docs)
- Existing data in Firestore is preserved unless `--clear` flag used