const { getStore } = require('@netlify/blobs');

const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };

  try {
    const ids = (event.queryStringParameters?.ids || '').split(',').filter(Boolean);
    if (!ids.length) return { statusCode: 200, headers, body: JSON.stringify({}) };

    const store   = getStore('fuel-reports');
    const now     = Date.now();
    const result  = {};

    await Promise.all(ids.map(async function(id) {
      try {
        const raw = await store.get(id, { type: 'json' });
        if (!raw) return;
        // Filter to only reports within expiry window
        const recent = raw.filter(function(r) { return (now - r.ts) < EXPIRY_MS; });
        if (recent.length) {
          result[id] = {
            count: recent.length,
            latest: recent[recent.length - 1].ts,
            minutesAgo: Math.round((now - recent[recent.length - 1].ts) / 60000)
          };
        }
      } catch(_) {}
    }));

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
