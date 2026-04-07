const BIN_ID = '69d4cbfbaaba882197d12fe7';
const BIN_URL = 'https://api.jsonbin.io/v3/b/' + BIN_ID;
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { stationId, stationName } = JSON.parse(event.body || '{}');
    if (!stationId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing stationId' }) };

    const apiKey = process.env.JSONBIN_KEY;

    // Read current bin
    const readRes = await fetch(BIN_URL + '/latest', {
      headers: { 'X-Master-Key': apiKey }
    });
    const readData = await readRes.json();
    const bin = readData.record || {};

    // Get existing reports for this station, filter out expired ones
    const now = Date.now();
    const existing = (bin[stationId] || []).filter(function(r) {
      return (now - r.ts) < EXPIRY_MS;
    });

    // Add new report, keep last 10
    existing.push({ ts: now, name: stationName || '' });
    bin[stationId] = existing.slice(-10);

    // Write back
    await fetch(BIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(bin)
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, count: existing.length })
    };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
