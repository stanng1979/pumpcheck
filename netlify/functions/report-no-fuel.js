const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
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

    const store = getStore('fuel-reports');
    const now   = Date.now();
    let reports = [];

    try {
      const existing = await store.get(stationId, { type: 'json' });
      if (Array.isArray(existing)) reports = existing;
    } catch(_) {}

    reports.push({ ts: now, name: stationName || '' });
    reports = reports.slice(-10);

    await store.setJSON(stationId, reports);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, count: reports.length })
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};
