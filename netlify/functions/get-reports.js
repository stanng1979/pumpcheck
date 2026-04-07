const BIN_ID = '69d4cbfbaaba882197d12fe7';
const BIN_URL = 'https://api.jsonbin.io/v3/b/' + BIN_ID;
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };

  try {
    const ids = (event.queryStringParameters && event.queryStringParameters.ids
      ? event.queryStringParameters.ids
      : '').split(',').filter(Boolean);

    if (!ids.length) return { statusCode: 200, headers, body: JSON.stringify({}) };

    const apiKey = process.env.JSONBIN_KEY;

    // Read current bin
    const readRes = await fetch(BIN_URL + '/latest', {
      headers: { 'X-Master-Key': apiKey }
    });
    const readData = await readRes.json();
    const bin = readData.record || {};

    const now    = Date.now();
    const result = {};

    ids.forEach(function(id) {
      const reports = bin[id];
      if (!Array.isArray(reports)) return;
      const recent = reports.filter(function(r) { return (now - r.ts) < EXPIRY_MS; });
      if (recent.length) {
        result[id] = {
          count: recent.length,
          latest: recent[recent.length - 1].ts,
          minutesAgo: Math.round((now - recent[recent.length - 1].ts) / 60000)
        };
      }
    });

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
