# Google Play Console — step-by-step (first release)

Everything you paste/upload is already prepared in `STORE_LISTING.md` and the
`store/` folder. Work top-to-bottom.

---

## Step 1 — Create the app
1. Go to **https://play.google.com/console** and pick your developer account.
2. Click **Create app** (top-right).
3. Fill in:
   - **App name:** `Snake & Multiply`
   - **Default language:** English (United States)
   - **App or game:** **Game**
   - **Free or paid:** **Free**
4. Tick the **Declarations** (Developer Program Policies + US export laws).
5. Click **Create app**.

You land on the **Dashboard**. The rest is the **"Set up your app"** checklist.

---

## Step 2 — "Set up your app" (policy section)
Open each task (left nav → *Policy and programs* / Dashboard cards):

| Task | What to choose |
|---|---|
| **App access** | "All functionality is available without special access" |
| **Ads** | "No, my app does not contain ads" |
| **Content rating** | Start questionnaire → email → category **Game** → answer **No** to all violence/sexual/etc. → Save → Calculate. Expect **Everyone / PEGI 3**. |
| **Target audience & content** | Pick the age groups you want. ⚠️ Including **under 13** opts you into the **Families policy** (extra requirements). The app is kid-safe (no ads, no data), so either choice works — choosing **13+** is the simplest path. |
| **News app** | No |
| **Health / COVID tracing** | No |
| **Data safety** | "No data collected or shared" (see `STORE_LISTING.md` for exact answers). Add privacy URL when asked. |
| **Government app** | No |
| **Financial features** | "My app doesn't provide any financial features" |
| **Privacy policy** | `https://expref.github.io/snake-game/privacy.html` |

---

## Step 3 — Main store listing
Left nav → **Grow → Store presence → Main store listing**:
- **App name:** `Snake & Multiply`
- **Short description:** (copy from `STORE_LISTING.md`)
- **Full description:** (copy from `STORE_LISTING.md`)
- **App icon:** upload `store/play-icon-512.png`
- **Feature graphic:** upload `store/feature-graphic.png`
- **Phone screenshots:** upload 2–8 (capture from a `preview` APK build)
- Save.

Then **Store settings**: App category = **Game → Educational**; add tags;
contact email `experiencereflectgrow@gmail.com`; website (optional)
`https://expref.github.io/snake-game/`.

---

## Step 4 — Upload the build (Internal testing)
Left nav → **Test and release → Testing → Internal testing**:
1. **Create new release.**
2. **App signing:** accept **Play App Signing** (recommended). Your EAS build's
   key becomes the upload key; Google manages the app signing key.
3. **Upload** your `.aab` (from `eas build -p android --profile production`),
   or it arrives automatically if you used `eas submit` / `--auto-submit`.
4. **Release name:** `1.0.0` (auto-filled).
5. **Release notes:** paste the "What's new" text from `STORE_LISTING.md`
   inside the `<en-US>` block.
6. **Save → Review release → Start rollout to Internal testing.**

---

## Step 5 — Add testers
Internal testing → **Testers** tab → create an email list → add tester emails →
copy the **opt-in link** and share it. Testers open the link, accept, and
install from Play.

---

## Step 6 — Unlock Production (new personal accounts)
Google requires new personal accounts to run **Closed testing with 12+ testers,
opted-in for 14 continuous days**, before Production opens:
1. **Testing → Closed testing → Create track** (or use the default Alpha).
2. Add a release (same `.aab`) and 12+ testers.
3. Keep them opted-in for 14 days.
4. Then **Test and release → Production → Create release**, switch
   `eas.json` track to `"production"`, and roll out.

---

## Quick reference
- App id: `com.expref.snakemultiply`
- Privacy: https://expref.github.io/snake-game/privacy.html
- Listing copy + release notes: `STORE_LISTING.md`
- Graphics: `store/play-icon-512.png`, `store/feature-graphic.png`
- Auto-submit setup: `SUBMIT.md`
