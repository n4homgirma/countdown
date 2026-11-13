// Shared timer state for the countdown page and the phone remote.
// Storage: Upstash Redis over its REST API (no npm dependencies).
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Keep in sync with reduce() in index.html and remote.html
function reduce(s, action, now, minutes, title) {
  let n = { total: s.total, remaining: s.remaining, running: s.running, endAt: s.endAt, caption: s.caption, rev: (s.rev || 0) + 1 };
  const expired = s.running && now >= s.endAt;
  if (action === 'start') {
    if (s.running && !expired) return s;
    const rem = expired || s.remaining <= 0 ? s.total : s.remaining;
    n.remaining = rem; n.running = true; n.endAt = now + rem * 1000;
  } else if (action === 'pause') {
    if (!s.running || expired) return s;
    n.remaining = Math.max(0, (s.endAt - now) / 1000); n.running = false; n.endAt = 0;
  } else if (action === 'reset' || action === 'set') {
    if (action === 'set') n.total = Math.max(1, Math.min(999, parseInt(minutes, 10) || 10)) * 60;
    n.remaining = n.total; n.running = false; n.endAt = 0;
  } else if (action === 'title') {
    n.caption = String(title == null ? '' : title).slice(0, 80);
  } else return s;
  return n;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Redis environment variables are missing' });
    const room = String((req.query && req.query.room) || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32);
    if (room.length < 4) return res.status(400).json({ error: 'Missing or invalid room' });
    const key = 'yc:' + room, now = Date.now();
    const raw = await redis(['GET', key]);
    let s = raw ? JSON.parse(raw) : { total: 600, remaining: 600, running: false, endAt: 0, rev: 0 };
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const n = reduce(s, b.action, now, b.minutes, b.title);
      if (n !== s) { s = n; await redis(['SET', key, JSON.stringify(s), 'EX', 172800]); }
    }
    res.status(200).json({ state: s, now: now });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};