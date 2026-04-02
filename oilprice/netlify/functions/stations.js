exports.handler = async function(event) {
  const { lat, lng, fuel, radius } = event.queryStringParameters || {};
  if (!lat || !lng) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing lat/lng' }) };
  }
  const f = fuel || 'E10';
  const r = Math.min(parseInt(radius) || 5, 50);
  const url = `https://checkfuelprices.co.uk/api/widget/stations?lat=${lat}&lng=${lng}&fuel=${f}&radius=${r}&limit=20`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://checkfuelprices.co.uk/'
      }
    });
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: `Upstream error: ${res.status}` }) };
    }
    const data = await res.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      },
      body: data
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
