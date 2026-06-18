const fetch = require('node-fetch');

const NEWSAPI_KEY      = 'cbd4f7ca02144195901037d9459c5921';
const TICKETMASTER_KEY = 'SF5aRyR3AhGQORYurBOg4JNjkSOykJuw';

exports.handler = async (event) => {
  const params = event.queryStringParameters;
  const type   = params.type;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    if (type === 'news') {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(params.q)}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${NEWSAPI_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (type === 'events') {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(params.city)}&countryCode=${params.country}&size=9&sort=date,asc&apikey=${TICKETMASTER_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
