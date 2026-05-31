# Automated upload to Google Play with `eas submit`

`eas.json` is already configured to submit builds to the **internal testing**
track. You just need a Google service-account key once.

> ⚠️ The key file is a **secret**. It's git-ignored (`google-play-key.json`).
> Never commit it, paste it in chat, or share it.

---

## One-time: create the service-account key

1. **Create the app in Play Console first** (Play Console → *Create app* →
   name "Snake & Multiply"). The API can upload builds but cannot create the
   app itself.

2. In **Google Play Console**, open **API access**
   (account-level menu, near *Users and permissions*).

3. **Link a Google Cloud project** (create one if prompted) and accept the
   terms.

4. Under **Service accounts**, click **Create new service account**. This opens
   the **Google Cloud Console** in a new tab.
   - Click **Create service account**, give it a name (e.g. `eas-play-upload`),
     click **Done** (no extra GCP roles needed).
   - Open the new service account → **Keys** → **Add key** → **Create new key**
     → **JSON** → download. This is your key file.

5. Back in **Play Console → API access**, click **Refresh service accounts**,
   find the new one, **Manage Play Console permissions / Grant access**, and
   give it at least:
   - **Release to testing tracks** (and Production later)
   - **View app information and download bulk reports**
   Then **Invite / Save**.

6. Move the downloaded JSON into the project root and rename it exactly:
   ```
   google-play-key.json
   ```
   (Verify it's ignored: `git status` should NOT list it.)

---

## Submitting

**Option A — build then submit in one go:**
```
eas build -p android --profile production --auto-submit
```

**Option B — submit the latest existing build:**
```
eas submit -p android --profile production --latest
```

It uploads the `.aab` to the **internal testing** track as a **draft** release
(see `eas.json` → `submit.production.android`).

- To push it live to internal testers automatically, change `releaseStatus`
  from `"draft"` to `"completed"`.
- To later ship to production, change `track` from `"internal"` to
  `"production"` (only after the 12-tester / 14-day requirement is met on new
  personal accounts).

---

## First-upload note
Some accounts require the **very first** `.aab` to be uploaded **manually** in
Play Console before the API will accept submissions. If `eas submit` errors on
the first release, upload that first build by hand, then all future releases can
go through `eas submit`.
