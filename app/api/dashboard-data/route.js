// app/api/dashboard-data/route.js — v10 FIXED
// Fixes: Clarity metrics parsing + branded keyword filtering + Postgres foundation

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  const region = searchParams.get('region') || 'US';
  const startDate = `${days}daysAgo`;
  const prevStart = `${days * 2}daysAgo`;
  const prevEnd = `${days + 1}daysAgo`;

  try {
    const token = await getGoogleToken();
    const [curr, prev, pages, sources, newRet, exits, dailyTrend, gsc, clarity] = await Promise.allSettled([
      fetchSummary(token, startDate, 'today', region),
      fetchSummary(token, prevStart, prevEnd, region),
      fetchPages(token, startDate, 'today', region),
      fetchSources(token, startDate, 'today', region),
      fetchNewReturn(token, startDate, 'today', region),
      fetchExitPages(token, startDate, 'today', region),
      fetchDailyTrend(token, startDate, 'today', region),
      fetchGSC(token, days),
      fetchClarity(days),
    ]);

    const c = curr.status === 'fulfilled' ? curr.value : null;
    const p = prev.status === 'fulfilled' ? prev.value : null;
    const pct = (a, b) => (!b || b === 0) ? 0 : parseFloat(((a - b) / b * 100).toFixed(1));

    return Response.json({
      kpis: c ? {
        sessions:      { current: c.sessions,   previous: p?.sessions||0,   change: pct(c.sessions,   p?.sessions) },
        users:         { current: c.users,       previous: p?.users||0,      change: pct(c.users,      p?.users) },
        pageViews:     { current: c.pageViews,   previous: p?.pageViews||0,  change: pct(c.pageViews,  p?.pageViews) },
        avgEngagement: { current: c.engagement,  previous: p?.engagement||0, change: pct(c.engagement, p?.engagement) },
        bounceRate:    { current: c.bounceRate,  previous: p?.bounceRate||0, change: pct(c.bounceRate, p?.bounceRate) },
        newUsers:      { current: c.newUsers,    previous: p?.newUsers||0,   change: pct(c.newUsers,   p?.newUsers) },
      } : nullKPIs(),
      topPages:      pages.status      === 'fulfilled' ? pages.value      : [],
      sources:       sources.status    === 'fulfilled' ? sources.value    : [],
      newReturn:     newRet.status     === 'fulfilled' ? newRet.value     : { new:0, returning:0, other:0, newPct:0, returningPct:0, otherPct:0 },
      exitPages:     exits.status      === 'fulfilled' ? exits.value      : [],
      dailyTrend:    dailyTrend.status === 'fulfilled' ? dailyTrend.value : [],
      keywords:      gsc.status === 'fulfilled' ? gsc.value.keywords      : [],
      opportunities: gsc.status === 'fulfilled' ? gsc.value.opportunities : [],
      gscSummary:    gsc.status === 'fulfilled' ? gsc.value.summary       : null,
      gscError:      gsc.status === 'rejected'  ? gsc.reason?.message     : null,
      clarity:       clarity.status === 'fulfilled' ? clarity.value       : null,
      clarityError:  clarity.status === 'rejected'  ? clarity.reason?.message : null,
      meta: { days, region, refreshed: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Fatal:', err.message);
    return Response.json({ error: err.message, kpis: nullKPIs(), topPages:[], sources:[], newReturn:{new:0,returning:0,other:0,newPct:0,returningPct:0,otherPct:0}, exitPages:[], dailyTrend:[], keywords:[], opportunities:[], gscSummary:null, clarity:null, meta:{ days, region, refreshed: new Date().toISOString() } });
  }
}

async function getGoogleToken() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Missing Google credentials');
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => btoa(JSON.stringify(o)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const unsigned = `${b64({alg:'RS256',typ:'JWT'})}.${b64({iss:email,scope:'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',exp:now+3600,iat:now})}`;
  const pem = key.replace(/-----BEGIN PRIVATE KEY-----/,'').replace(/-----END PRIVATE KEY-----/,'').replace(/-----BEGIN RSA PRIVATE KEY-----/,'').replace(/-----END RSA PRIVATE KEY-----/,'').replace(/\s/g,'');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const ck = await crypto.subtle.importKey('pkcs8', der.buffer, {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', ck, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`});
  const d = await res.json();
  if (!d.access_token) throw new Error(`Token failed: ${JSON.stringify(d)}`);
  return d.access_token;
}

const GA4_URL = () => `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
function countryExpr(region) {
  if (!region || region === 'ALL') return null;
  return { filter: { fieldName: 'country', stringFilter: { value: 'United States', matchType: 'EXACT' } } };
}
async function ga4post(token, body) {
  const r = await fetch(GA4_URL(), { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify(body) });
  return r.json();
}

async function fetchSummary(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'averageSessionDuration'},{name:'bounceRate'},{name:'newUsers'}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (d.error) throw new Error(d.error.message);
  const r = d.rows?.[0]?.metricValues || [];
  return { sessions:parseInt(r[0]?.value||0), users:parseInt(r[1]?.value||0), pageViews:parseInt(r[2]?.value||0), engagement:parseFloat((parseFloat(r[3]?.value||0)/60).toFixed(1)), bounceRate:parseFloat((parseFloat(r[4]?.value||0)*100).toFixed(1)), newUsers:parseInt(r[5]?.value||0) };
}

async function fetchDailyTrend(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'date'}], metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'}], orderBys:[{dimension:{dimensionName:'date'}}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  return d.rows.map(row => {
    const date = row.dimensionValues?.[0]?.value;
    const vals = row.metricValues;
    return { date, label: new Date(date.slice(0,4), date.slice(4,6)-1, date.slice(6,8)).toLocaleDateString('en-US',{weekday:'short'}).substring(0,3), sessions: parseInt(vals[0]?.value||0), users: parseInt(vals[1]?.value||0), pageViews: parseInt(vals[2]?.value||0) };
  });
}

async function fetchPages(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'pagePathAndQueryString'},{name:'pageTitle'}], metrics:[{name:'screenPageViews'},{name:'engagementRate'},{name:'averageSessionDuration'},{name:'bounceRate'},{name:'sessions'}], limit:50, orderBys:[{metric:{metricName:'screenPageViews'},descending:true}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  return d.rows.slice(0,10).map(row => {
    const page = row.dimensionValues?.[0]?.value || '/';
    const title = row.dimensionValues?.[1]?.value;
    const views = parseInt(row.metricValues?.[0]?.value||0);
    const engagement = parseFloat((parseFloat(row.metricValues?.[1]?.value||0)*100).toFixed(1));
    const time = parseFloat(row.metricValues?.[2]?.value||0);
    const bounce = parseFloat((parseFloat(row.metricValues?.[3]?.value||0)*100).toFixed(1));
    const sessions = parseInt(row.metricValues?.[4]?.value||0);
    const health = engagement >= 60 ? 'excellent' : engagement >= 40 ? 'good' : engagement >= 20 ? 'warning' : 'critical';
    let recommendation = null;
    if (health === 'warning' || health === 'critical') recommendation = 'Product page bounce is high. Add customer testimonials, a clear pricing anchor, and a demo CTA visible without scrolling.';
    return { page, title, views, engagement: time.toFixed(1), bounceRate: bounce, engagementRate: engagement, sessions, health, recommendation };
  });
}

async function fetchSources(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'firstUserSourceMedium'}], metrics:[{name:'sessions'},{name:'totalUsers'}], orderBys:[{metric:{metricName:'sessions'},descending:true}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  const total = d.rows.reduce((s,r) => s+parseInt(r.metricValues?.[0]?.value||0), 0);
  return d.rows.map(row => {
    const src = row.dimensionValues?.[0]?.value || 'Direct';
    const srcClean = src.replace(/ \/ /g, ' ').split(' ').map((w,i)=>i===0?w[0].toUpperCase()+w.slice(1):w).join(' ');
    const sessions = parseInt(row.metricValues?.[0]?.value||0);
    const users = parseInt(row.metricValues?.[1]?.value||0);
    return { source: srcClean, sessions, users, pct: parseFloat(((sessions/total)*100).toFixed(1)) };
  });
}

async function fetchNewReturn(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'userType'}], metrics:[{name:'sessions'}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return { new:0, returning:0, other:0, newPct:0, returningPct:0, otherPct:0 };
  const new_v = d.rows.find(r=>r.dimensionValues?.[0]?.value==='new') || {metricValues:[{value:'0'}]};
  const ret_v = d.rows.find(r=>r.dimensionValues?.[0]?.value==='returning') || {metricValues:[{value:'0'}]};
  const n = parseInt(new_v.metricValues?.[0]?.value||0);
  const r = parseInt(ret_v.metricValues?.[0]?.value||0);
  const o = d.rows.reduce((s,x) => s+parseInt(x.metricValues?.[0]?.value||0), 0) - n - r;
  const total = n + r + o;
  return { new:n, returning:r, other:o, newPct: parseFloat(((n/total)*100).toFixed(1)), returningPct: parseFloat(((r/total)*100).toFixed(1)), otherPct: parseFloat(((o/total)*100).toFixed(1)) };
}

async function fetchExitPages(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'exitPage'}], metrics:[{name:'sessions'},{name:'bounceRate'}], limit:25, orderBys:[{metric:{metricName:'sessions'},descending:true}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  return d.rows.slice(0,5).map(row => ({
    page: row.dimensionValues?.[0]?.value || '/',
    sessions: parseInt(row.metricValues?.[0]?.value||0),
    bounceRate: parseFloat((parseFloat(row.metricValues?.[1]?.value||0)*100).toFixed(1))
  }));
}

async function fetchGSC(token, days) {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) throw new Error('Missing GSC_SITE_URL');
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = d => d.toISOString().split('T')[0];
  
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites/sc-domain:aioapp.com/searchAnalytics/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['query'],
      rowLimit: 25
    })
  });
  
  if (!res.ok) throw new Error(`GSC API error: ${res.status}`);
  const data = await res.json();
  
  // BRANDED KEYWORDS FILTER
  const brandedKeywords = ['aio', 'aioapp', 'aio app', 'aio pos', 'aio dashboard', 'aio ai', 'aio software', 'aio platform'];
  const isBranded = k => brandedKeywords.some(b => k.toLowerCase().includes(b));
  
  const keywords = (data.rows || [])
    .filter(r => !isBranded(r.keys[0]))
    .slice(0, 8)
    .map(r => ({
      keyword: r.keys[0],
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: parseFloat((r.ctr * 100).toFixed(1)),
      position: parseFloat(r.position.toFixed(1))
    }));
  
  const opps = (data.rows || [])
    .filter(r => r.position > 8 && r.position < 35 && r.impressions > 20 && !isBranded(r.keys[0]))
    .slice(0, 8)
    .map(r => ({
      keyword: r.keys[0],
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: parseFloat((r.ctr * 100).toFixed(1)),
      position: parseFloat(r.position.toFixed(1)),
      potential: r.impressions > 100 ? 'high' : r.impressions > 50 ? 'medium' : 'low',
      gap: Math.round(r.position - 1)
    }));
  
  const summary = {
    totalImpressions: (data.rows || []).reduce((s,r) => s+r.impressions, 0),
    totalClicks: (data.rows || []).reduce((s,r) => s+r.clicks, 0),
    avgCTR: data.rows && data.rows.length > 0 ? parseFloat((data.rows.reduce((s,r) => s+r.ctr, 0) / data.rows.length * 100).toFixed(1)) : 0,
    avgPosition: data.rows && data.rows.length > 0 ? parseFloat((data.rows.reduce((s,r) => s+r.position, 0) / data.rows.length).toFixed(1)) : 0
  };
  
  return { keywords, opportunities: opps, summary };
}

function nullKPIs() {
  return { sessions:{current:0,previous:0,change:0}, users:{current:0,previous:0,change:0}, pageViews:{current:0,previous:0,change:0}, avgEngagement:{current:0,previous:0,change:0}, bounceRate:{current:0,previous:0,change:0}, newUsers:{current:0,previous:0,change:0} };
}

async function fetchClarity(days) {
  const projectId = process.env.CLARITY_PROJECT_ID;
  const apiToken = process.env.CLARITY_API_TOKEN;
  if (!projectId || !apiToken) throw new Error('Missing Clarity credentials');
  
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = d => d.toISOString().split('T')[0];
  const startDate = fmt(start);
  const endDate = fmt(end);

  // FIXED: Clarity Metrics Parsing
  // For click metrics: read from appropriate field (value, count, or subTotal)
  // For session metrics: read from sessionsCount
  
  const metrics = ['RageClickCount','DeadClickCount','ErrorClickCount','FrustratedSessionCount','TotalSessionCount'];
  const results = {};

  await Promise.all(metrics.map(async metric => {
    try {
      const url = `https://www.clarity.ms/export-data/api/v1/project-live-insights?projectId=${projectId}&startDate=${startDate}&endDate=${endDate}&granularity=daily&dimension=All&metric=${metric}`;
      const res = await fetch(url, { 
        headers: { 
          'Authorization': `Bearer ${apiToken}`, 
          'Ocp-Apim-Subscription-Key': apiToken 
        } 
      });
      
      if (!res.ok) {
        if (res.status === 429) console.warn(`Clarity rate limited (429) for ${metric}`);
        return;
      }
      
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      let total = 0;
      
      rows.forEach(row => {
        if (row.information && Array.isArray(row.information)) {
          row.information.forEach(info => {
            // FIX: Handle both session metrics (sessionsCount) and click metrics (subTotal or value)
            if (metric.includes('SessionCount') || metric.includes('Frustrated')) {
              total += parseInt(info.sessionsCount || 0);
            } else {
              // Click metrics: try subTotal first, then value, then count
              total += parseInt(info.subTotal || info.value || info.count || 0);
            }
          });
        }
      });
      
      results[metric] = total;
    } catch(e) { 
      console.error(`Clarity error for ${metric}:`, e.message);
      results[metric] = 0; 
    }
  }));

  const sessions = results['TotalSessionCount'] || 0;
  const frustrated = results['FrustratedSessionCount'] || 0;

  return {
    rageClicks: results['RageClickCount'] || 0,
    deadClicks: results['DeadClickCount'] || 0,
    errorClicks: results['ErrorClickCount'] || 0,
    recordedSessions: sessions,
    frustratedSessions: frustrated,
    frustrationRate: sessions > 0 ? parseFloat((frustrated/sessions*100).toFixed(1)) : 0,
    avgSessionDuration: '—',
    feedbackSubmitted: 0,
    topFrustrationPages: [],
  };
}

/* ══════════════════════════════════════════════════════════════
   POSTGRES FOUNDATION — Weekly Snapshots (Coming Soon)
   
   Schema for `aio_dashboard_snapshots` table:
   
   CREATE TABLE aio_dashboard_snapshots (
     id BIGSERIAL PRIMARY KEY,
     week_start DATE NOT NULL,
     week_end DATE NOT NULL,
     region VARCHAR(10) NOT NULL DEFAULT 'US',
     sessions INT,
     users INT,
     pageViews INT,
     avgEngagement DECIMAL(5,2),
     bounceRate DECIMAL(5,2),
     newUsers INT,
     topKeyword VARCHAR(255),
     topKeywordImpressions INT,
     topKeywordClicks INT,
     topKeywordCTR DECIMAL(5,2),
     opportunityCount INT,
     highBouncePageCount INT,
     clarity_rageClicks INT,
     clarity_deadClicks INT,
     clarity_errorClicks INT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(week_start, region)
   );
   
   Usage: Every Monday 00:00 UTC, run:
   - Fetch last 7 days of data
   - Insert into snapshots table
   - Dashboard queries trends: SELECT * FROM snapshots ORDER BY week_start DESC LIMIT 12
   
   This enables:
   ✓ Weekly email reports (compare week-over-week)
   ✓ Historical trend charts (12+ weeks of data)
   ✓ Anomaly detection (bounce rate spike, traffic drop)
   ✓ Manager reporting (monthly performance reviews)
   
   TODO: Set up Vercel cron job to call this weekly
══════════════════════════════════════════════════════════════ */
