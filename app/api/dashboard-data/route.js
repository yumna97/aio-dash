// app/api/dashboard-data/route.js
// Production v5 — US filtering, date ranges, traffic sources, fixed metrics

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  const region = searchParams.get('region') || 'US';

  const startDate = `${days}daysAgo`;
  const prevStartDate = `${days * 2}daysAgo`;
  const prevEndDate = `${days + 1}daysAgo`;

  try {
    const token = await getGoogleToken();

    const [ga4Main, ga4Prev, ga4Pages, ga4Sources, ga4NewReturn, gscData, clarityData] = await Promise.allSettled([
      fetchGA4Summary(token, startDate, 'today', region),
      fetchGA4Summary(token, prevStartDate, prevEndDate, region),
      fetchGA4Pages(token, startDate, 'today', region),
      fetchGA4Sources(token, startDate, 'today', region),
      fetchGA4NewReturn(token, startDate, 'today', region),
      fetchGSC(token, days),
      fetchClarity(),
    ]);

    const curr = ga4Main.status === 'fulfilled' ? ga4Main.value : null;
    const prev = ga4Prev.status === 'fulfilled' ? ga4Prev.value : null;
    const pct = (a, b) => b && b > 0 ? parseFloat(((a - b) / b * 100).toFixed(1)) : 0;

    const kpis = curr ? {
      sessions: { current: curr.sessions, previous: prev?.sessions || 0, change: pct(curr.sessions, prev?.sessions) },
      users: { current: curr.users, previous: prev?.users || 0, change: pct(curr.users, prev?.users) },
      pageViews: { current: curr.pageViews, previous: prev?.pageViews || 0, change: pct(curr.pageViews, prev?.pageViews) },
      avgEngagement: { current: curr.engagement, previous: prev?.engagement || 0, change: pct(curr.engagement, prev?.engagement) },
      bounceRate: { current: curr.bounceRate, previous: prev?.bounceRate || 0, change: pct(curr.bounceRate, prev?.bounceRate) },
      newUsers: { current: curr.newUsers, previous: prev?.newUsers || 0, change: pct(curr.newUsers, prev?.newUsers) },
    } : getFallbackKPIs();

    return Response.json({
      kpis,
      topPages: ga4Pages.status === 'fulfilled' ? ga4Pages.value : [],
      sources: ga4Sources.status === 'fulfilled' ? ga4Sources.value : [],
      newReturn: ga4NewReturn.status === 'fulfilled' ? ga4NewReturn.value : { new: 0, returning: 0 },
      keywords: gscData.status === 'fulfilled' ? gscData.value.keywords : [],
      opportunities: gscData.status === 'fulfilled' ? gscData.value.opportunities : [],
      behavior: clarityData.status === 'fulfilled' ? clarityData.value : getFallbackBehavior(),
      meta: { days, region, refreshed: new Date().toISOString() },
    });

  } catch (err) {
    console.error('Dashboard fatal error:', err.message);
    return Response.json({ error: err.message, kpis: getFallbackKPIs(), topPages: [], sources: [], newReturn: { new: 0, returning: 0 }, keywords: [], opportunities: [], behavior: getFallbackBehavior(), meta: { days, region, refreshed: new Date().toISOString() } });
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getGoogleToken() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || '';
  if (!email || !key) throw new Error('Missing Google credentials');
  key = key.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  })}`;

  const pemBody = key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/-----BEGIN RSA PRIVATE KEY-----/, '').replace(/-----END RSA PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryDer.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ─── GA4 helpers ─────────────────────────────────────────────────────────────

const GA4_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;

function countryFilter(region) {
  if (region === 'ALL') return [];
  return [{ filter: { fieldName: 'country', stringFilter: { value: region === 'US' ? 'United States' : region, matchType: 'EXACT' } } }];
}

async function ga4Post(token, body) {
  const res = await fetch(GA4_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function fetchGA4Summary(token, startDate, endDate, region) {
  const data = await ga4Post(token, {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' },
      { name: 'averageSessionDuration' }, { name: 'bounceRate' }, { name: 'newUsers' },
    ],
    dimensionFilter: { andGroup: { expressions: countryFilter(region).map(f => ({ filter: f.filter })) } },
  });

  if (data.error) throw new Error(data.error.message);
  const row = data.rows?.[0]?.metricValues || [];
  return {
    sessions: parseInt(row[0]?.value || 0),
    users: parseInt(row[1]?.value || 0),
    pageViews: parseInt(row[2]?.value || 0),
    engagement: parseFloat((parseFloat(row[3]?.value || 0) / 60).toFixed(1)),
    bounceRate: parseFloat((parseFloat(row[4]?.value || 0) * 100).toFixed(1)),
    newUsers: parseInt(row[5]?.value || 0),
  };
}

async function fetchGA4Pages(token, startDate, endDate, region) {
  const data = await ga4Post(token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [
      { name: 'screenPageViews' }, { name: 'averageSessionDuration' },
      { name: 'bounceRate' }, { name: 'sessions' }, { name: 'engagementRate' },
    ],
    dimensionFilter: { andGroup: { expressions: countryFilter(region).map(f => ({ filter: f.filter })) } },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  if (!data.rows) return [];

  return data.rows.map(row => {
    const bounce = parseFloat((parseFloat(row.metricValues[2]?.value || 0) * 100).toFixed(1));
    const engagement = parseFloat((parseFloat(row.metricValues[1]?.value || 0) / 60).toFixed(1));
    const engRate = parseFloat((parseFloat(row.metricValues[4]?.value || 0) * 100).toFixed(1));

    let health = 'good';
    if (engRate > 70 && engagement > 2) health = 'excellent';
    else if (engRate > 50) health = 'good';
    else if (engRate > 30) health = 'warning';
    else health = 'critical';

    return {
      page: row.dimensionValues[0]?.value || '/',
      title: row.dimensionValues[1]?.value || 'Untitled',
      views: parseInt(row.metricValues[0]?.value || 0),
      engagement,
      bounceRate: bounce,
      engagementRate: engRate,
      sessions: parseInt(row.metricValues[3]?.value || 0),
      health,
    };
  });
}

async function fetchGA4Sources(token, startDate, endDate, region) {
  const data = await ga4Post(token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    dimensionFilter: { andGroup: { expressions: countryFilter(region).map(f => ({ filter: f.filter })) } },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 6,
  });

  if (!data.rows) return [];
  const total = data.rows.reduce((sum, r) => sum + parseInt(r.metricValues[0]?.value || 0), 0);

  return data.rows.map(row => ({
    source: row.dimensionValues[0]?.value || 'Unknown',
    sessions: parseInt(row.metricValues[0]?.value || 0),
    users: parseInt(row.metricValues[1]?.value || 0),
    pct: total > 0 ? parseFloat((parseInt(row.metricValues[0]?.value || 0) / total * 100).toFixed(1)) : 0,
  }));
}

async function fetchGA4NewReturn(token, startDate, endDate, region) {
  const data = await ga4Post(token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'newVsReturning' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    dimensionFilter: { andGroup: { expressions: countryFilter(region).map(f => ({ filter: f.filter })) } },
  });

  if (!data.rows) return { new: 0, returning: 0, newPct: 0, returningPct: 0 };
  const total = data.rows.reduce((s, r) => s + parseInt(r.metricValues[0]?.value || 0), 0);

  let newS = 0, retS = 0;
  data.rows.forEach(r => {
    const val = parseInt(r.metricValues[0]?.value || 0);
    if (r.dimensionValues[0]?.value === 'new') newS = val;
    else retS = val;
  });

  return {
    new: newS,
    returning: retS,
    newPct: total > 0 ? parseFloat((newS / total * 100).toFixed(1)) : 0,
    returningPct: total > 0 ? parseFloat((retS / total * 100).toFixed(1)) : 0,
  };
}

// ─── GSC ─────────────────────────────────────────────────────────────────────

async function fetchGSC(token, days) {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) throw new Error('Missing GSC_SITE_URL');

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate, endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{ dimension: 'country', operator: 'equals', expression: 'usa' }]
        }],
        rowLimit: 25,
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const rows = data.rows || [];

  const keywords = rows.slice(0, 8).map(r => ({
    keyword: r.keys[0],
    impressions: r.impressions || 0,
    clicks: r.clicks || 0,
    ctr: parseFloat(((r.ctr || 0) * 100).toFixed(1)),
    position: parseFloat((r.position || 0).toFixed(1)),
    trend: r.position < 10 ? 'up' : 'neutral',
  }));

  const opportunities = rows
    .filter(r => r.position > 10 && r.position < 30 && r.impressions > 100)
    .slice(0, 5)
    .map(r => ({
      keyword: r.keys[0],
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      ctr: parseFloat(((r.ctr || 0) * 100).toFixed(1)),
      position: parseFloat((r.position || 0).toFixed(1)),
      potential: r.impressions > 500 ? 'high' : 'medium',
      gap: Math.max(1, Math.round(r.position - 3)),
    }));

  const totalImpressions = rows.reduce((s, r) => s + (r.impressions || 0), 0);
  const totalClicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions * 100).toFixed(1)) : 0;
  const avgPosition = rows.length > 0 ? parseFloat((rows.reduce((s, r) => s + (r.position || 0), 0) / rows.length).toFixed(1)) : 0;

  return {
    keywords,
    opportunities,
    summary: { totalImpressions, totalClicks, avgCTR, avgPosition },
  };
}

// ─── Clarity ─────────────────────────────────────────────────────────────────

async function fetchClarity() {
  const projectId = process.env.CLARITY_PROJECT_ID;
  const apiToken = process.env.CLARITY_API_TOKEN;

  if (!projectId || !apiToken || apiToken === 'none') return getFallbackBehavior();

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const res = await fetch(
      `https://api.clarity.microsoft.com/v1/projects/${projectId}/metrics?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    );

    if (!res.ok) return getFallbackBehavior();
    const data = await res.json();

    return {
      sessions: data.totalSessionCount || 0,
      avgSessionDuration: data.avgSessionDuration || '0m',
      rageClicks: data.rageClickCount || 0,
      deadClicks: data.deadClickCount || 0,
      errorClicks: data.errorClickCount || 0,
      recordedSessions: data.recordedSessionCount || 0,
      frustratedSessions: data.frustratedSessionCount || 0,
      feedbackSubmitted: data.feedbackCount || 0,
      frustrationRate: data.recordedSessionCount > 0 ? parseFloat((data.frustratedSessionCount / data.recordedSessionCount * 100).toFixed(1)) : 0,
      topFrustrationPages: (data.topFrustratedPages || []).slice(0, 3).map(p => ({
        page: p.url || p.page || '/',
        frustrated: p.frustratedSessionCount || 0,
        errorRate: `${parseFloat((p.errorRate || 0).toFixed(0))}%`,
        severity: (p.frustratedSessionCount || 0) > 30 ? 'high' : 'medium',
      })),
    };
  } catch {
    return getFallbackBehavior();
  }
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

function getFallbackKPIs() {
  return {
    sessions: { current: 0, previous: 0, change: 0 },
    users: { current: 0, previous: 0, change: 0 },
    pageViews: { current: 0, previous: 0, change: 0 },
    avgEngagement: { current: 0, previous: 0, change: 0 },
    bounceRate: { current: 0, previous: 0, change: 0 },
    newUsers: { current: 0, previous: 0, change: 0 },
  };
}

function getFallbackBehavior() {
  return {
    sessions: 0, avgSessionDuration: '0m', rageClicks: 0, deadClicks: 0,
    errorClicks: 0, recordedSessions: 0, frustratedSessions: 0,
    feedbackSubmitted: 0, frustrationRate: 0, topFrustrationPages: [],
  };
}
