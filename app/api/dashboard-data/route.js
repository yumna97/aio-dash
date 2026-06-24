// app/api/dashboard-data/route.js
// Debug version - logs errors clearly

export async function GET() {
  const logs = [];

  try {
    // Check env vars exist
    logs.push(`GA4_PROPERTY_ID: ${process.env.GA4_PROPERTY_ID ? 'SET' : 'MISSING'}`);
    logs.push(`GOOGLE_CLIENT_EMAIL: ${process.env.GOOGLE_CLIENT_EMAIL ? 'SET' : 'MISSING'}`);
    logs.push(`GOOGLE_PRIVATE_KEY: ${process.env.GOOGLE_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_PRIVATE_KEY.length + ')' : 'MISSING'}`);
    logs.push(`GSC_SITE_URL: ${process.env.GSC_SITE_URL ? 'SET' : 'MISSING'}`);

    // Check private key format
    const key = process.env.GOOGLE_PRIVATE_KEY || '';
    logs.push(`Key starts with: ${key.substring(0, 30)}`);
    logs.push(`Key contains literal \\n: ${key.includes('\\n')}`);
    logs.push(`Key contains real newline: ${key.includes('\n')}`);
    logs.push(`Key has BEGIN PRIVATE KEY: ${key.includes('BEGIN PRIVATE KEY')}`);
    logs.push(`Key has BEGIN RSA PRIVATE KEY: ${key.includes('BEGIN RSA PRIVATE KEY')}`);

    // Try getting token
    let token = null;
    try {
      token = await getGoogleToken();
      logs.push(`Token obtained: YES (length: ${token.length})`);
    } catch (tokenErr) {
      logs.push(`Token error: ${tokenErr.message}`);
    }

    // Try GA4 if token worked
    if (token) {
      try {
        const ga4 = await fetchGA4Data(token);
        logs.push(`GA4 sessions: ${ga4.kpis.sessions.current}`);
        return Response.json({ success: true, logs, data: ga4 });
      } catch (ga4Err) {
        logs.push(`GA4 error: ${ga4Err.message}`);
      }
    }

    return Response.json({ success: false, logs, data: null });

  } catch (err) {
    logs.push(`Fatal: ${err.message}`);
    return Response.json({ success: false, logs, error: err.message });
  }
}

async function getGoogleToken() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || '';

  if (!email || !key) throw new Error('Missing Google credentials');

  // Fix escaped newlines
  key = key.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => btoa(JSON.stringify(obj))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${b64(header)}.${b64(payload)}`;

  const pemBody = key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${unsigned}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token failed: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function fetchGA4Data(token) {
  const propertyId = process.env.GA4_PROPERTY_ID;

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
        ],
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(`GA4 API error: ${JSON.stringify(data.error)}`);

  const row = data.rows?.[0]?.metricValues || [];
  return {
    kpis: {
      sessions: { current: parseInt(row[0]?.value || 0), previous: 0, change: 0 },
      users: { current: parseInt(row[1]?.value || 0), previous: 0, change: 0 },
      pageViews: { current: parseInt(row[2]?.value || 0), previous: 0, change: 0 },
      avgEngagement: { current: (parseFloat(row[3]?.value || 0) / 60).toFixed(1), previous: 0, change: 0 },
    },
    topPages: [],
    lowPerformers: [],
    trends: { thisWeek: 0, lastWeek: 0, weekChange: 0, weeklyData: [] },
  };
}
