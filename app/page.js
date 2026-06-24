'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#1D9E75','#378ADD','#7F77DD','#EF9F27','#D4537E','#888780'];

export default function Home() {
  const [tab, setTab] = useState('overview');
  const [days, setDays] = useState(7);
  const [region, setRegion] = useState('US');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard-data?days=${days}&region=${region}`);
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [days, region]);

  useEffect(() => { load(); }, [load]);

  const pill = active => ({
    padding: '5px 14px', border: '1px solid', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: active ? '600' : '400',
    borderColor: active ? '#1D4ED8' : '#D1D5DB', background: active ? '#EFF6FF' : '#fff', color: active ? '#1D4ED8' : '#374151',
  });

  const tabStyle = active => ({
    padding: '10px 20px', border: 'none', background: 'transparent', fontSize: '14px', cursor: 'pointer',
    fontWeight: active ? '600' : '400', color: active ? '#1D4ED8' : '#6B7280',
    borderBottom: active ? '2px solid #1D4ED8' : '2px solid transparent', whiteSpace: 'nowrap',
  });

  const badge = type => {
    const m = {excellent:['#DCFCE7','#166534'],good:['#DBEAFE','#1E40AF'],warning:['#FEF3C7','#92400E'],critical:['#FEE2E2','#991B1B']};
    const [bg,color] = m[type]||m.good;
    return {background:bg,color,fontSize:'10px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px'};
  };

  const healthLabel = h => ({excellent:'Excellent',good:'Good',warning:'Needs work',critical:'Critical'}[h]||'Good');

  const arrow = (v, invert) => {
    const pos = invert ? v <= 0 : v >= 0;
    return { symbol: pos ? '↑' : '↓', color: pos ? '#059669' : '#DC2626' };
  };

  const kpis = data?.kpis || {};
  const pages = data?.topPages || [];
  const sources = data?.sources || [];
  const nr = data?.newReturn || {};
  const keywords = data?.keywords || [];
  const opps = data?.opportunities || [];
  const gscSum = data?.gscSummary || null;
  const behavior = data?.behavior || {};

  const insights = () => {
    const list = [];
    if ((kpis.sessions?.change||0) > 10) list.push({type:'good', text:`Sessions up ${kpis.sessions.change}% vs previous ${days}d — strong traffic growth in the ${region==='US'?'US':'global'} market.`});
    else if ((kpis.sessions?.change||0) < -10) list.push({type:'bad', text:`Sessions dropped ${Math.abs(kpis.sessions?.change||0)}% vs previous ${days}d. Review traffic sources for changes.`});
    if ((kpis.avgEngagement?.change||0) < -15) list.push({type:'warn', text:`Average engagement dropped ${Math.abs(kpis.avgEngagement?.change||0)}%. Consider reviewing page content depth and structure.`});
    if ((kpis.bounceRate?.current||0) > 60) list.push({type:'bad', text:`Bounce rate at ${kpis.bounceRate?.current}% — above the 50% benchmark. Review homepage above-the-fold content.`});
    if ((nr.newPct||0) > 85) list.push({type:'warn', text:`${nr.newPct}% of visitors are new users. Very low return rate — consider email capture or retargeting strategies.`});
    if (opps.length > 0) list.push({type:'good', text:`${opps.length} keyword${opps.length>1?'s':''} ranking on page 2–3 in the US. Targeted content updates could move these to page 1.`});
    const needsWork = pages.filter(p=>p.health==='warning'||p.health==='critical');
    if (needsWork.length > 0) list.push({type:'warn', text:`${needsWork.length} page${needsWork.length>1?'s':''} below engagement benchmark: ${needsWork.slice(0,2).map(p=>p.page).join(', ')}. Review content and UX.`});
    if (list.length === 0) list.push({type:'good', text:'No critical issues detected this period. All key metrics are within normal range.'});
    return list.slice(0,5);
  };

  const actionItems = () => {
    const items = [];
    opps.slice(0,3).forEach(o => items.push({color:'#059669',bg:'#F0FDF4',text:`Write or update content targeting "${o.keyword}" — ranking #${Math.round(o.position)} in US with ${o.impressions.toLocaleString()} impressions. ${o.gap} positions to page 1.`}));
    pages.filter(p=>p.health==='warning'||p.health==='critical').slice(0,2).forEach(p => items.push({color:'#D97706',bg:'#FFFBEB',text:`Improve ${p.page} — only ${p.engagementRate}% engaged. Review content relevance and structure.`}));
    if ((kpis.bounceRate?.current||0) > 60) items.push({color:'#DC2626',bg:'#FEF2F2',text:`High bounce rate (${kpis.bounceRate?.current}%) on ${region==='US'?'US':'global'} traffic. A/B test the homepage hero section.`});
    if (items.length === 0) items.push({color:'#059669',bg:'#F0FDF4',text:'No urgent actions needed. Focus on maintaining current content quality and publishing cadence.'});
    return items;
  };

  return (
    <div style={{background:'#fff',minHeight:'100vh',fontFamily:'system-ui,-apple-system,sans-serif'}}>
      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'1.5rem 1.25rem'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem',flexWrap:'wrap',gap:'0.75rem'}}>
          <div>
            <h1 style={{fontSize:'22px',fontWeight:'600',color:'#111827',margin:'0 0 3px'}}>AIO website performance</h1>
            <p style={{fontSize:'13px',color:'#6B7280',margin:0}}>GA4 · Search Console · Clarity · {region==='US'?'🇺🇸 United States':'🌍 Global'}</p>
          </div>
          <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
            {[7,14,30,90].map(d=><button key={d} onClick={()=>setDays(d)} style={pill(days===d)}>{d}d</button>)}
            <div style={{width:'1px',height:'20px',background:'#E5E7EB',margin:'0 2px'}}/>
            <button onClick={()=>setRegion('US')} style={pill(region==='US')}>🇺🇸 US</button>
            <button onClick={()=>setRegion('ALL')} style={pill(region==='ALL')}>🌍 Global</button>
          </div>
        </div>

        {/* Meta bar */}
        <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',color:'#6B7280',marginBottom:'1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'6px'}}>
          <span>Last <strong style={{color:'#111827'}}>{days} days</strong> · {region==='US'?'United States traffic only':'All countries'}</span>
          <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {loading && <span>⏳ Loading...</span>}
            {lastRefreshed && !loading && <span>Refreshed {lastRefreshed}</span>}
            <button onClick={load} style={{fontSize:'11px',padding:'3px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',background:'#fff',cursor:'pointer',color:'#374151'}}>↻ Refresh</button>
          </span>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #E5E7EB',marginBottom:'1.5rem',overflowX:'auto'}}>
          {[['overview','Overview'],['pages','Pages'],['keywords','Keywords (US)'],['behavior','User behavior'],['insights','Insights']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={tabStyle(tab===id)}>{label}</button>
          ))}
        </div>

        {loading && (
          <div style={{padding:'4rem',textAlign:'center',color:'#9CA3AF'}}>
            <div style={{fontSize:'32px',marginBottom:'0.75rem'}}>⏳</div>
            <p>Loading {region==='US'?'US':'global'} data for last {days} days…</p>
          </div>
        )}

        {!loading && <>

          {/* ── OVERVIEW ── */}
          {tab==='overview' && <div>
            {/* KPIs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'10px',marginBottom:'1.25rem'}}>
              {[
                {label:'Sessions',key:'sessions',fmt:v=>v.toLocaleString()},
                {label:'Users',key:'users',fmt:v=>v.toLocaleString()},
                {label:'Page views',key:'pageViews',fmt:v=>v.toLocaleString()},
                {label:'Avg engagement',key:'avgEngagement',fmt:v=>`${v}m`},
                {label:'Bounce rate',key:'bounceRate',fmt:v=>`${v}%`,inv:true},
                {label:'New users',key:'newUsers',fmt:v=>v.toLocaleString()},
              ].map(({label,key,fmt,inv})=>{
                const d=kpis[key]||{current:0,change:0};
                const {symbol,color}=arrow(d.change,inv);
                return (
                  <div key={key} style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'14px'}}>
                    <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{label}</div>
                    <div style={{fontSize:'26px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>{fmt(d.current||0)}</div>
                    <div style={{fontSize:'12px',fontWeight:'500',color,display:'flex',alignItems:'center',gap:'3px'}}>{symbol} {Math.abs(d.change||0)}% vs prev {days}d</div>
                  </div>
                );
              })}
            </div>

            {/* Charts row */}
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
              <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem'}}>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>Traffic sources</div>
                {sources.length===0 ? <p style={{color:'#9CA3AF',fontSize:'13px',textAlign:'center',padding:'2rem 0'}}>No source data available</p> : <>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
                    {sources.map((s,i)=>(
                      <span key={i} style={{fontSize:'11px',display:'flex',alignItems:'center',gap:'4px',color:'#374151'}}>
                        <span style={{width:'8px',height:'8px',borderRadius:'50%',background:PIE_COLORS[i%PIE_COLORS.length],display:'inline-block'}}/>
                        {s.source} {s.pct}%
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={sources} layout="vertical" margin={{left:0,right:20}}>
                      <XAxis type="number" stroke="#9CA3AF" style={{fontSize:'11px'}} tickLine={false}/>
                      <YAxis dataKey="source" type="category" stroke="#9CA3AF" style={{fontSize:'11px'}} width={110} tickLine={false}/>
                      <Tooltip contentStyle={{fontSize:'12px',borderRadius:'8px',border:'1px solid #E5E7EB'}}/>
                      <Bar dataKey="sessions" radius={[0,6,6,0]}>
                        {sources.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>}
              </div>

              <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem'}}>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>New vs returning users</div>
                {(!nr.new && !nr.returning) ? <p style={{color:'#9CA3AF',fontSize:'13px',textAlign:'center',padding:'2rem 0'}}>No data available</p> : <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={[{name:'New',value:nr.newPct||0},{name:'Returning',value:nr.returningPct||0}]} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" startAngle={90} endAngle={450}>
                        <Cell fill="#1D9E75"/><Cell fill="#378ADD"/>
                      </Pie>
                      <Tooltip formatter={v=>`${v}%`}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',justifyContent:'center',gap:'2rem',marginTop:'8px'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'20px',fontWeight:'700',color:'#1D9E75'}}>{nr.newPct}%</div>
                      <div style={{fontSize:'11px',color:'#6B7280'}}>New ({(nr.new||0).toLocaleString()})</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'20px',fontWeight:'700',color:'#378ADD'}}>{nr.returningPct}%</div>
                      <div style={{fontSize:'11px',color:'#6B7280'}}>Returning ({(nr.returning||0).toLocaleString()})</div>
                    </div>
                  </div>
                </>}
              </div>
            </div>

            {/* Top pages preview */}
            <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>Top pages — {region==='US'?'US traffic':'all traffic'}</div>
              {pages.length===0 ? <p style={{color:'#9CA3AF',textAlign:'center',padding:'2rem'}}>No page data available</p> : pages.slice(0,5).map((p,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<4?'1px solid #F3F4F6':'none',gap:'1rem'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',color:'#111827',fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.page}</div>
                    {p.title && <div style={{fontSize:'11px',color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'1px'}}>{p.title}</div>}
                  </div>
                  <div style={{display:'flex',gap:'1rem',alignItems:'center',fontSize:'12px',color:'#6B7280',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <span>{p.views.toLocaleString()} views</span>
                    <span>{p.engagement}m engaged</span>
                    <span>↩ {p.bounceRate}%</span>
                    <span style={badge(p.health)}>{healthLabel(p.health)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* ── PAGES ── */}
          {tab==='pages' && <div>
            <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'4px'}}>Page performance — {region==='US'?'🇺🇸 US traffic only':'🌍 all countries'}</div>
              <p style={{fontSize:'12px',color:'#6B7280',marginBottom:'1.25rem'}}>Health score: Excellent = 70%+ engaged, 2+ min. Good = 50–70%. Needs work = 30–50%. Critical = under 30%.</p>
              {pages.length===0 ? <p style={{color:'#9CA3AF',textAlign:'center',padding:'2rem'}}>No page data available</p> : pages.map((p,i)=>(
                <div key={i} style={{padding:'12px',marginBottom:'8px',background:'#F9FAFB',borderRadius:'8px',borderLeft:`4px solid ${p.health==='excellent'?'#1D9E75':p.health==='good'?'#378ADD':p.health==='warning'?'#EF9F27':'#E24B4A'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                    <div>
                      <div style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{p.page}</div>
                      {p.title && <div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'2px'}}>{p.title}</div>}
                    </div>
                    <span style={badge(p.health)}>{healthLabel(p.health)}</span>
                  </div>
                  <div style={{display:'flex',gap:'1.25rem',fontSize:'12px',color:'#6B7280',flexWrap:'wrap'}}>
                    <span>📊 {p.views.toLocaleString()} views</span>
                    <span>⏱ {p.engagement}m avg</span>
                    <span>✅ {p.engagementRate}% engaged</span>
                    <span>↩ {p.bounceRate}% bounce</span>
                    <span>🔢 {p.sessions.toLocaleString()} sessions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* ── KEYWORDS ── */}
          {tab==='keywords' && <div>
            {keywords.length===0 ? (
              <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'3rem',textAlign:'center'}}>
                <div style={{fontSize:'32px',marginBottom:'0.75rem'}}>🔍</div>
                <p style={{color:'#374151',fontWeight:'500',marginBottom:'8px'}}>No US keyword data yet</p>
                <p style={{fontSize:'12px',color:'#6B7280'}}>Make sure the service account has Full permission in Search Console, then wait 24–48h for data to appear.</p>
              </div>
            ) : <>
              {gscSum && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'10px',marginBottom:'1rem'}}>
                  {[
                    {label:'Total impressions (US)',value:gscSum.totalImpressions.toLocaleString()},
                    {label:'Total clicks (US)',value:gscSum.totalClicks.toLocaleString()},
                    {label:'Avg CTR',value:`${gscSum.avgCTR}%`},
                    {label:'Avg position',value:`#${gscSum.avgPosition}`},
                  ].map((k,i)=>(
                    <div key={i} style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'14px'}}>
                      <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{k.label}</div>
                      <div style={{fontSize:'22px',fontWeight:'700',color:'#111827'}}>{k.value}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem',marginBottom:'1rem'}}>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>Top keywords in US search results</div>
                {keywords.map((k,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<keywords.length-1?'1px solid #F3F4F6':'none'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',marginBottom:'3px'}}>{k.keyword}</div>
                      <div style={{display:'flex',gap:'1rem',fontSize:'11px',color:'#6B7280'}}>
                        <span>👁 {k.impressions.toLocaleString()} impressions</span>
                        <span>🖱 {k.clicks.toLocaleString()} clicks</span>
                        <span>📈 {k.ctr}% CTR</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,marginLeft:'1rem'}}>
                      <div style={{fontSize:'20px',fontWeight:'700',color:k.position<=3?'#059669':k.position<=10?'#1D4ED8':'#D97706'}}>#{Math.round(k.position)}</div>
                      <div style={{fontSize:'10px',color:'#9CA3AF'}}>US rank</div>
                    </div>
                  </div>
                ))}
              </div>
              {opps.length>0 && (
                <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'10px',padding:'1.25rem'}}>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'#166534',marginBottom:'4px'}}>💡 Quick wins — page 2 & 3 in US</div>
                  <p style={{fontSize:'12px',color:'#15803D',marginBottom:'1rem'}}>These keywords are close to page 1. A focused content update could push them over.</p>
                  {opps.map((o,i)=>(
                    <div key={i} style={{background:'#fff',borderRadius:'8px',padding:'10px 14px',marginBottom:'8px',border:'1px solid #BBF7D0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',marginBottom:'3px'}}>{o.keyword}</div>
                        <div style={{fontSize:'11px',color:'#6B7280'}}>{o.impressions.toLocaleString()} US impressions · {o.ctr}% CTR · #{Math.round(o.position)} now · {o.gap} positions to page 1</div>
                      </div>
                      <span style={{background:o.potential==='high'?'#DCFCE7':'#FEF3C7',color:o.potential==='high'?'#166534':'#92400E',fontSize:'10px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',flexShrink:0,marginLeft:'1rem'}}>{o.potential==='high'?'⭐ High':'Medium'}</span>
                    </div>
                  ))}
                </div>
              )}
            </>}
          </div>}

          {/* ── BEHAVIOR ── */}
          {tab==='behavior' && <div>
            <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'10px',padding:'12px 16px',marginBottom:'1rem',fontSize:'12px',color:'#7F1D1D'}}>
              ℹ️ Clarity data shows zeros if the API token is not set. View session recordings directly at <strong>clarity.microsoft.com</strong> for the full picture.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'10px',marginBottom:'1rem'}}>
              {[
                {label:'Rage clicks',val:behavior.rageClicks||0,bg:'#FEF2F2',color:'#DC2626',what:'Users clicking rapidly out of frustration',fix:'Check for broken CTAs or unresponsive buttons'},
                {label:'Dead clicks',val:behavior.deadClicks||0,bg:'#FFFBEB',color:'#D97706',what:'Clicks on elements that aren\'t interactive',fix:'Review elements that look clickable but aren\'t'},
                {label:'Error clicks',val:behavior.errorClicks||0,bg:'#EFF6FF',color:'#1D4ED8',what:'Clicks that trigger JavaScript errors',fix:'Check browser console on forms and buttons'},
                {label:'Frustration rate',val:`${behavior.frustrationRate||0}%`,bg:'#F5F3FF',color:'#7C3AED',what:'Sessions showing frustration signals',fix:'Under 5% is healthy. Above 10% needs investigation.'},
              ].map((item,i)=>(
                <div key={i} style={{background:item.bg,borderRadius:'10px',padding:'16px',border:`1px solid ${item.color}25`}}>
                  <div style={{fontSize:'11px',color:item.color,fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{item.label}</div>
                  <div style={{fontSize:'28px',fontWeight:'700',color:item.color,marginBottom:'10px'}}>{item.val}</div>
                  <div style={{fontSize:'11px',color:'#374151',lineHeight:'1.5'}}>
                    <strong>What it means:</strong> {item.what}<br/>
                    <strong>What to do:</strong> {item.fix}
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>Session overview</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'10px'}}>
                {[
                  {label:'Recorded sessions',val:(behavior.recordedSessions||0).toLocaleString()},
                  {label:'Frustrated sessions',val:(behavior.frustratedSessions||0).toLocaleString()},
                  {label:'Avg session duration',val:behavior.avgSessionDuration||'0m'},
                  {label:'Feedback submitted',val:(behavior.feedbackSubmitted||0).toLocaleString()},
                ].map((item,i)=>(
                  <div key={i} style={{background:'#F9FAFB',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{item.label}</div>
                    <div style={{fontSize:'22px',fontWeight:'700',color:'#111827'}}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {/* ── INSIGHTS ── */}
          {tab==='insights' && <div>
            <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem',marginBottom:'1rem'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>📊 Performance summary</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {insights().map((ins,i)=>{
                  const map={good:['#F0FDF4','#166534'],warn:['#FFFBEB','#92400E'],bad:['#FFF1F2','#9F1239']};
                  const [bg,color]=map[ins.type]||map.good;
                  const icon=ins.type==='good'?'✅':ins.type==='warn'?'⚠️':'🔴';
                  return (
                    <div key={i} style={{background:bg,borderRadius:'8px',padding:'12px 14px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                      <span style={{flexShrink:0}}>{icon}</span>
                      <p style={{fontSize:'13px',color,margin:0,lineHeight:'1.6'}}>{ins.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'1.25rem'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'12px'}}>📌 Action items this week</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {actionItems().map((item,i)=>(
                  <div key={i} style={{background:item.bg,borderRadius:'8px',padding:'10px 14px',fontSize:'13px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                    <span style={{color:item.color,fontWeight:'700',flexShrink:0,minWidth:'20px'}}>{i+1}.</span>
                    <span style={{color:'#374151',lineHeight:'1.6'}}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>}

        </>}
      </div>
    </div>
  );
}
