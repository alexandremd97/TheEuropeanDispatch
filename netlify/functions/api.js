const fetch = require('node-fetch');

const NEWSAPI_KEY        = 'cbd4f7ca02144195901037d9459c5921';
const TICKETMASTER_KEY   = 'SF5aRyR3AhGQORYurBOg4JNjkSOykJuw';
const SPOTIFY_CLIENT_ID  = 'cbaa427358bf44de9a256a892384ff76';
const SPOTIFY_SECRET     = 'aec968fc60394f4aa22e23b91213aeb2';

// Cache the Spotify token across invocations within the same warm function instance
let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_SECRET}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error('Could not get Spotify token: ' + JSON.stringify(data));
  }

  cachedToken = data.access_token;
  // Spotify tokens last 3600s — refresh a little early
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const type   = params.type;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // ── NEWS ──────────────────────────────────────────────────────
    if (type === 'news') {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(params.q)}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${NEWSAPI_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ── EVENTS ────────────────────────────────────────────────────
    if (type === 'events') {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(params.city)}&countryCode=${params.country}&size=9&sort=date,asc&apikey=${TICKETMASTER_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // ── PODCASTS (Spotify search) ────────────────────────────────
    if (type === 'podcasts') {
      const token = await getSpotifyToken();
      const q = encodeURIComponent(params.q || 'podcast');
      const market = params.market || 'GB';

      const url = `https://api.spotify.com/v1/search?q=${q}&type=show&market=${market}&limit=10`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
