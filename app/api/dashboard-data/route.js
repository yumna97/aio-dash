// app/api/dashboard-data/route.js — v7

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  const region = searchParams.get('region') || 'US';
  const startDate = `${days}daysAgo`;
  const prevStart = `${days * 2}daysAgo`;
  const prevEnd = `${days + 1}daysAgo`;

  try {
    const token = await getGoogleToken();
    const [curr, prev, pages, sources, newRet, exits, gsc] = await Promise.allSettled([
      fetchSummary(token, startDate, 'today', region),
      fetchSummary(token, prevStart, prevEnd, region),
      fetchPages(token, startDate, 'today', region),
      fetchSources(token, startDate, 'today', region),
      fetchNewReturn(token, startDate, 'today', region),
      fetchExitPages(token, startDate, 'today', region),
      fetchGSC(token, days),
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
      topPages:    pages.status  === 'fulfilled' ? pages.value  : [],
      sources:     sources.status === 'fulfilled' ? sources.value : [],
      newReturn:   newRet.status  === 'fulfilled' ? newRet.value  : { new:0, returning:0, other:0, newPct:0, returningPct:0, otherPct:0 },
      exitPages:   exits.status   === 'fulfilled' ? exits.value   : [],
      keywords:    gsc.status === 'fulfilled' ? gsc.value.keywords    : [],
      opportunities: gsc.status === 'fulfilled' ? gsc.value.opportunities : [],
      gscSummary:  gsc.status === 'fulfilled' ? gsc.value.summary     : null,
      gscError:    gsc.status === 'rejected'  ? gsc.reason?.message   : null,
      meta: { days, region, refreshed: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Fatal:', err.message);
    return Response.json({ error: err.message, kpis: nullKPIs(), topPages:[], sources:[], newReturn:{new:0,returning:0,other:0,newPct:0,returningPct:0,otherPct:0}, exitPages:[], keywords:[], opportunities:[], gscSummary:null, meta:{ days, region, refreshed: new Date().toISOString() } });
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
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

// ── GA4 helpers ───────────────────────────────────────────────────────────────
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

async function fetchPages(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'pagePath'},{name:'pageTitle'}], metrics:[{name:'screenPageViews'},{name:'averageSessionDuration'},{name:'bounceRate'},{name:'sessions'},{name:'engagementRate'}], orderBys:[{metric:{metricName:'screenPageViews'},desc:true}], limit:10 };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  return d.rows.map(row => {
    const bounce = parseFloat((parseFloat(row.metricValues[2]?.value||0)*100).toFixed(1));
    const eng = parseFloat((parseFloat(row.metricValues[1]?.value||0)/60).toFixed(1));
    const engRate = parseFloat((parseFloat(row.metricValues[4]?.value||0)*100).toFixed(1));
    const title = row.dimensionValues[1]?.value;
    const health = engRate>70&&eng>2?'excellent':engRate>50?'good':engRate>30?'warning':'critical';
    const rec = health==='warning'||health==='critical' ? getRecommendation(row.dimensionValues[0]?.value||'/', engRate, bounce, eng) : null;
    return { page:row.dimensionValues[0]?.value||'/', title:(!title||title==='(not set)'||title==='Untitled')?null:title, views:parseInt(row.metricValues[0]?.value||0), engagement:eng, bounceRate:bounce, engagementRate:engRate, sessions:parseInt(row.metricValues[3]?.value||0), health, recommendation:rec };
  });
}

function getRecommendation(page, engRate, bounce, eng) {
  const recs = [];
  if (bounce > 60) recs.push('High bounce rate — review the page hero/intro. Users are leaving without scrolling. Consider a clearer value proposition above the fold.');
  if (engRate < 40) recs.push('Low engagement rate — content may not match search intent. Review the page topic against how users are finding it.');
  if (eng < 0.5) recs.push('Very low time on page (under 30s) — this may indicate a mismatch between the page headline and user expectations.');
  if (page.includes('product') && bounce > 50) recs.push('Product pages need strong social proof and clear CTAs. Add customer logos, testimonials, or a video demo.');
  if (page === '/') recs.push('Homepage is your highest-traffic page. Even small improvements here have the biggest impact — test a cleaner hero CTA.');
  return recs.length > 0 ? recs[0] : 'Review page content structure and ensure the primary CTA is visible without scrolling.';
}

async function fetchSources(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'sessionDefaultChannelGroup'}], metrics:[{name:'sessions'},{name:'totalUsers'}], orderBys:[{metric:{metricName:'sessions'},desc:true}], limit:6 };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  const total = d.rows.reduce((s,r)=>s+parseInt(r.metricValues[0]?.value||0),0);
  return d.rows.map(r=>({ source:r.dimensionValues[0]?.value||'Unknown', sessions:parseInt(r.metricValues[0]?.value||0), users:parseInt(r.metricValues[1]?.value||0), pct:total>0?parseFloat((parseInt(r.metricValues[0]?.value||0)/total*100).toFixed(1)):0 }));
}

async function fetchNewReturn(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'newVsReturning'}], metrics:[{name:'sessions'},{name:'totalUsers'}] };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return {new:0,returning:0,other:0,newPct:0,returningPct:0,otherPct:0};
  const total = d.rows.reduce((s,r)=>s+parseInt(r.metricValues[0]?.value||0),0);
  let nw=0,ret=0;
  d.rows.forEach(r=>{ const v=parseInt(r.metricValues[0]?.value||0); if(r.dimensionValues[0]?.value==='new') nw=v; else ret=v; });
  const other = Math.max(0, total - nw - ret);
  return { new:nw, returning:ret, other, newPct:total>0?parseFloat((nw/total*100).toFixed(1)):0, returningPct:total>0?parseFloat((ret/total*100).toFixed(1)):0, otherPct:total>0?parseFloat((other/total*100).toFixed(1)):0 };
}

async function fetchExitPages(token, startDate, endDate, region) {
  const expr = countryExpr(region);
  const body = { dateRanges:[{startDate,endDate}], dimensions:[{name:'pagePath'}], metrics:[{name:'sessions'},{name:'bounceRate'}], orderBys:[{metric:{metricName:'bounceRate'},desc:true}], limit:5 };
  if (expr) body.dimensionFilter = { andGroup:{ expressions:[{filter:expr.filter}] } };
  const d = await ga4post(token, body);
  if (!d.rows) return [];
  return d.rows.map(r=>({ page:r.dimensionValues[0]?.value||'/', sessions:parseInt(r.metricValues[0]?.value||0), bounceRate:parseFloat((parseFloat(r.metricValues[1]?.value||0)*100).toFixed(1)) })).filter(r=>r.sessions>3);
}

// ── GSC ───────────────────────────────────────────────────────────────────────
async function fetchGSC(token, days) {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) throw new Error('Missing GSC_SITE_URL');
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now()-days*86400000).toISOString().split('T')[0];
  // Try with US filter first, fall back to global
  const tryFetch = async (withFilter) => {
    const body = { startDate:start, endDate:end, dimensions:['query'], rowLimit:25 };
    if (withFilter) body.dimensionFilterGroups = [{ filters:[{dimension:'country',operator:'equals',expression:'usa'}] }];
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify(body) });
    return r.json();
  };
  let d = await tryFetch(true);
  if (d.error || !d.rows || d.rows.length === 0) d = await tryFetch(false);
  if (d.error) throw new Error(d.error.message);
  const rows = d.rows||[];
  const keywords = rows.slice(0,8).map(r=>({ keyword:r.keys[0], impressions:r.impressions||0, clicks:r.clicks||0, ctr:parseFloat(((r.ctr||0)*100).toFixed(1)), position:parseFloat((r.position||0).toFixed(1)), trend:r.position<10?'up':'neutral' }));
  const opportunities = rows.filter(r=>r.position>8&&r.position<35&&r.impressions>20).slice(0,5).map(r=>({ keyword:r.keys[0], impressions:r.impressions||0, clicks:r.clicks||0, ctr:parseFloat(((r.ctr||0)*100).toFixed(1)), position:parseFloat((r.position||0).toFixed(1)), potential:r.impressions>300?'high':'medium', gap:Math.max(1,Math.round(r.position-3)) }));
  const ti=rows.reduce((s,r)=>s+(r.impressions||0),0), tc=rows.reduce((s,r)=>s+(r.clicks||0),0);
  return { keywords, opportunities, summary:{ totalImpressions:ti, totalClicks:tc, avgCTR:ti>0?parseFloat((tc/ti*100).toFixed(1)):0, avgPosition:rows.length>0?parseFloat((rows.reduce((s,r)=>s+(r.position||0),0)/rows.length).toFixed(1)):0, isUSFiltered: !d.error && d.rows?.length > 0 } };
}

function nullKPIs() {
  return { sessions:{current:0,previous:0,change:0}, users:{current:0,previous:0,change:0}, pageViews:{current:0,previous:0,change:0}, avgEngagement:{current:0,previous:0,change:0}, bounceRate:{current:0,previous:0,change:0}, newUsers:{current:0,previous:0,change:0} };
}
