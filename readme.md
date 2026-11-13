# Yehulu SACCOS event countdown

A branded countdown page for Yehulu SACCOS events, with a phone remote. Plain HTML/CSS/JS, no build step.

- `index.html` is the big-screen page. Open it on the PC.
- `remote.html` is the phone remote, served at `/remote`.
- `api/state.js` is a Vercel function that stores the shared timer state in Upstash Redis.

## Deploy (Vercel)

1. Push this folder to GitHub and import the repo in Vercel. Framework preset: Other. No build command, no output directory.
2. In the Vercel project, open Storage, add **Upstash for Redis** (free plan) and connect it to the project. This sets the `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) environment variables the API reads.
3. Redeploy so the function picks up the variables.

## Use

1. Open the site on the PC. It adds a room code to the URL (`?room=...`).
2. Click **Phone remote** and scan the QR code with your phone.
3. Control the timer from either device. Press `H` on the PC to hide the buttons before projecting.

Keys on the PC: Space = start/pause, R = reset, H = hide controls.

Anyone with the room link can control the timer, so close the QR card before projecting. To get a fresh room, open the site with a new code, e.g. `/?room=myevent2026`.

## Edit the event text

The title, venue, date and slogan are in the `<main>` section of `index.html`.