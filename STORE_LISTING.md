# Google Play — Store Listing Pack

Copy/paste-ready text and specs for publishing **Snake & Multiply** to Google Play.

---

## App details

| Field | Value |
|---|---|
| App name (≤30 chars) | `Snake & Multiply` |
| Package name | `com.expref.snakemultiply` |
| Default language | English (United States) – `en-US` |
| App or game | **Game** |
| Category | **Educational** (alt: Casual) |
| Tags | education, math, brain, kids, arcade |
| Contact email | experiencereflectgrow@gmail.com |
| Website (optional) | https://expref.github.io/snake-game/ |
| Privacy policy URL | https://expref.github.io/snake-game/privacy.html |

---

## Short description (≤80 chars)

```
Classic Snake meets times tables — learn ×2 to ×12 and reveal mystery stars!
```

## Full description (≤4000 chars)

```
Slither, snack, and multiply! Snake & Multiply is a bright, fast, family-friendly
twist on the classic Snake game that secretly teaches your multiplication tables.

Pick a table from ×2 all the way to ×12, then guide your snake to eat the shapes
IN ORDER: 2, 4, 6, 8… Every correct bite extends your snake, speeds things up, and
uncovers another piece of a hidden mystery picture. Clear all five levels to fully
reveal it and win!

★ LEARN WHILE YOU PLAY
Each shape shows the next answer in the sequence, and an optional voice reads every
result aloud — so the times tables stick without it ever feeling like homework.

★ FIVE LEVELS, ONE MYSTERY PICTURE
Each table hides a famous face from around the world. The further you get, the more
of the picture you reveal. How far can you go?

★ CELEBRATE EVERY RUN
The better you do, the bigger the party on the game-over screen — applause,
confetti, sprinkles, a chocolate shower, and a golden trophy with a roaring crowd
when you master all five levels.

★ MADE FOR EVERYONE
• Simple swipe or joystick controls
• Twelve times tables (×2 to ×12)
• Voice numbers, music, sound effects and vibration — all toggleable
• Tracks your best score for every table
• No ads. No sign-in required. Plays fully offline.

★ PRIVACY FIRST
Everything is stored on your device only. We don't collect analytics, track you,
or share any data. Perfect for kids and classrooms.

Whether you're a student brushing up on multiplication, a parent looking for
screen time that actually teaches something, or just a Snake fan who loves a
challenge — Snake & Multiply is for you.

Download now, and turn times-table practice into a game you'll WANT to play!
```

---

## Graphic assets needed (you must create/upload these)

| Asset | Spec | Notes |
|---|---|---|
| **Hi-res icon** | 512 × 512 px, 32-bit PNG, ≤1 MB | Required. Reuse/scale `assets/icon.png`. |
| **Feature graphic** | 1024 × 500 px, PNG or JPG, no alpha | Required. Banner shown at top of listing. |
| **Phone screenshots** | 2–8 images, 9:16 (e.g. 1080 × 1920), 24-bit PNG/JPEG | Required (min 2). Capture menu, gameplay, level reveal, win/celebration. |
| **Tablet screenshots** | 7" and 10" sizes | Optional but recommended for wider reach. |

> Tip: capture phone screenshots straight from a device/emulator running the
> `preview` (APK) build: `eas build -p android --profile preview`.

---

## Data safety form answers

The app keeps everything **on-device** and transmits nothing, so:

- **Does your app collect or share any of the required user data types?** → **No**
- Data collected: **None**
- Data shared: **None**
- (If asked) Data is **not** processed off the device; **not** sold.
- Security practices: data is stored locally; user can delete it via
  "Reset progress" in Settings or by uninstalling.

## Content rating questionnaire

- Category: **Game**
- No violence, no user interaction/chat, no data sharing, no ads, no purchases,
  no mature content → expected rating: **Everyone / PEGI 3**.

## Target audience & ads

- Target age: can include children — content is family-friendly.
- **Contains ads:** No.
- **In-app purchases:** No.

---

## First-release checklist (Play Console)

1. Create app → name, language, Game, free.
2. Set up: App access (all features available without restrictions),
   Ads (No), Content rating (complete questionnaire), Target audience,
   Data safety (No data collected), Privacy policy URL (above).
3. Store listing → paste short + full description, upload icon, feature
   graphic, screenshots.
4. Release → **Testing → Internal testing** → upload the `.aab` → roll out.
5. New personal accounts: run **Closed testing with 12+ testers for 14 days**
   before Production is unlocked.
