'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#2563EB','#10B981','#8B5CF6','#F59E0B','#EF4444','#6B7280'];
const H_COLOR = { excellent:'#10B981', good:'#2563EB', warning:'#F59E0B', critical:'#EF4444' };
const H_BG = { excellent:'#ECFDF5', good:'#EFF6FF', warning:'#FFFBEB', critical:'#FFF1F2' };
const H_LABEL = { excellent:'Excellent', good:'Good', warning:'Needs work', critical:'Critical' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'8px 12px',boxShadow:'0 4px 6px rgba(0,0,0,0.07)'}}>
      <p style={{fontSize:'11px',color:'#6B7280',margin:'0 0 4px'}}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{fontSize:'13px',fontWeight:'600',color:p.color,margin:'1px 0'}}>{p.name}: {p.value.toLocaleString()}</p>)}
    </div>
  );
};

export default function Home() {
  const [tab, setTab] = useState('overview');
  const [days, setDays] = useState(7);
  const [region, setRegion] = useState('US');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard-data?days=${days}&region=${region}`);
      setData(await r.json());
      setTs(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}));
    } catch(e){ console.error(e); }
    setLoading(false);
  }, [days, region]);

  useEffect(()=>{ load(); },[load]);

  const kpis = data?.kpis || {};
  const pages = data?.topPages || [];
  const sources = data?.sources || [];
  const nr = data?.newReturn || {};
  const exitPages = data?.exitPages || [];
  const dailyTrend = data?.dailyTrend || [];
  const keywords = data?.keywords || [];
  const opps = data?.opportunities || [];
  const gscSum = data?.gscSummary;
  const clarity = data?.clarity;
  const gscError = data?.gscError;

  const pill = a => ({ padding:'5px 14px', border:'1px solid', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontWeight:a?'600':'400', borderColor:a?'#2563EB':'#D1D5DB', background:a?'#EFF6FF':'#fff', color:a?'#2563EB':'#374151' });
  const tabSt = a => ({ padding:'10px 20px', border:'none', background:'transparent', fontSize:'13px', cursor:'pointer', fontWeight:a?'600':'400', color:a?'#2563EB':'#6B7280', borderBottom:a?'2px solid #2563EB':'2px solid transparent', whiteSpace:'nowrap' });
  const card = (extra={}) => ({ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'1.25rem', ...extra });
  const kpiBox = { background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'1rem' };
  const sTitle = { fontSize:'14px', fontWeight:'600', color:'#111827', marginBottom:'12px' };
  const muted = { fontSize:'12px', color:'#6B7280' };
  const arrowColor = (v,inv) => { const pos=inv?v<=0:v>=0; return {color:pos?'#059669':'#DC2626',symbol:pos?'↑':'↓'}; };

  const insights = () => {
    const list = [];
    if ((kpis.sessions?.change||0)>10) list.push({t:'good',text:`Sessions up ${kpis.sessions.change}% vs previous ${days}d — strong momentum in ${region==='US'?'United States':'all markets'}.`});
    else if ((kpis.sessions?.change||0)<-10) list.push({t:'bad',text:`Sessions dropped ${Math.abs(kpis.sessions?.change||0)}%. Check for ranking drops or traffic source changes.`});
    if ((kpis.bounceRate?.current||0)>60) list.push({t:'bad',text:`Bounce rate is ${kpis.bounceRate?.current}% — above benchmark. Homepage hero needs a stronger value proposition for US restaurant operators.`});
    if ((kpis.avgEngagement?.change||0)<-15) list.push({t:'warn',text:`Avg engagement dropped ${Math.abs(kpis.avgEngagement?.change||0)}%. Users may be scanning rather than reading — add visual content and shorter paragraphs.`});
    const direct = sources.find(s=>s.source==='Direct');
    if (direct?.pct>50) list.push({t:'warn',text:`${direct.pct}% of traffic is "Direct" — includes internal team visits. Real organic share is likely ${sources.find(s=>s.source==='Organic Search')?.pct||0}%.`});
    if ((nr.newPct||0)>85) list.push({t:'warn',text:`${nr.newPct}% of visitors are new — very low return rate. Consider email capture or retargeting.`});
    const bad=pages.filter(p=>p.health==='warning'||p.health==='critical');
    if (bad.length>0) list.push({t:'warn',text:`${bad.length} page${bad.length>1?'s':''} below engagement benchmark: ${bad.slice(0,2).map(p=>p.page).join(', ')}. See Pages tab.`});
    if (opps.length>0) list.push({t:'good',text:`${opps.length} keyword${opps.length>1?'s':''} on page 2–3 in US. Content updates could push these to page 1.`});
    if (clarity?.rageClicks>20) list.push({t:'bad',text:`${clarity.rageClicks} rage clicks detected in Clarity. Users are frustrated — review broken CTAs on product pages.`});
    if (list.length===0) list.push({t:'good',text:'All key metrics within normal range. No critical issues detected.'});
    return list.slice(0,5);
  };

  const actions = () => {
    const items = [];
    opps.slice(0,2).forEach(o=>items.push({c:'#059669',bg:'#F0FDF4',b:'#BBF7D0',text:`Target "${o.keyword}" — ranking #${Math.round(o.position)} with ${o.impressions.toLocaleString()} impressions. ${o.gap} positions to page 1.`}));
    pages.filter(p=>p.health==='warning'||p.health==='critical').slice(0,3).forEach(p=>items.push({c:'#D97706',bg:'#FFFBEB',b:'#FDE68A',text:`${p.page}: ${p.recommendation}`}));
    if ((kpis.bounceRate?.current||0)>60) items.push({c:'#DC2626',bg:'#FEF2F2',b:'#FECACA',text:`Bounce rate ${kpis.bounceRate?.current}%. A/B test homepage hero — ROI-focused headline vs current.`});
    if (clarity?.rageClicks>20) items.push({c:'#7C3AED',bg:'#F5F3FF',b:'#DDD6FE',text:`Review ${clarity.rageClicks} rage clicks in Clarity session recordings — check product page CTAs.`});
    if (items.length===0) items.push({c:'#059669',bg:'#F0FDF4',b:'#BBF7D0',text:'No urgent actions. Maintain publishing cadence and monitor keyword positions weekly.'});
    return items;
  };

  const nrData = [{name:'New',value:nr.newPct||0},{name:'Returning',value:nr.returningPct||0},...(nr.otherPct>0?[{name:'Other',value:nr.otherPct||0}]:[])];

  return (
    <div style={{background:'#F1F5F9',minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      {/* Nav */}
      <div style={{background:'#fff',borderBottom:'1px solid #E5E7EB',padding:'0 1.5rem',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:'1400px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:'56px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'16px',fontWeight:'700',color:'#111827'}}>AIO website performance</span>
            <span style={{fontSize:'11px',color:'#9CA3AF',padding:'2px 8px',background:'#F1F5F9',borderRadius:'20px'}}>GA4 · GSC · Clarity</span>
          </div>
          <div style={{display:'flex',gap:'5px',alignItems:'center'}}>
            {[7,14,30,90].map(d=><button key={d} onClick={()=>setDays(d)} style={pill(days===d)}>{d}d</button>)}
            <div style={{width:'1px',height:'18px',background:'#E5E7EB',margin:'0 3px'}}/>
            <button onClick={()=>setRegion('US')} style={pill(region==='US')}>🇺🇸 US</button>
            <button onClick={()=>setRegion('ALL')} style={pill(region==='ALL')}>🌍 Global</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'1rem 1.5rem'}}>
        {/* Status */}
        <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'7px 14px',fontSize:'12px',color:'#6B7280',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Last <strong style={{color:'#111827'}}>{days} days</strong> · {region==='US'?'🇺🇸 United States traffic only':'🌍 All countries'}</span>
          <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {loading?<span>⏳ Loading…</span>:<span>Refreshed {ts}</span>}
            <button onClick={load} style={{fontSize:'11px',padding:'3px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',background:'#fff',cursor:'pointer'}}>↻ Refresh</button>
          </span>
        </div>

        {/* Tabs */}
        <div style={{background:'#fff',borderRadius:'10px 10px 0 0',border:'1px solid #E5E7EB',borderBottom:'none',display:'flex',overflowX:'auto'}}>
          {[['overview','📊 Overview'],['pages','📄 Pages'],['keywords','🔍 Keywords'],['behavior','👥 Behavior'],['insights','💡 Insights']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={tabSt(tab===id)}>{lbl}</button>
          ))}
        </div>
        <div style={{background:'#fff',border:'1px solid #E5E7EB',borderTop:'none',borderRadius:'0 0 10px 10px',padding:'1.5rem',marginBottom:'1rem'}}>

          {loading && <div style={{padding:'3rem',textAlign:'center',color:'#9CA3AF'}}><div style={{fontSize:'28px',marginBottom:'8px'}}>⏳</div><p>Loading data…</p></div>}

          {!loading && <>

          {/* ── OVERVIEW ── */}
          {tab==='overview' && <>
            {/* KPI row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:'10px',marginBottom:'1.25rem'}}>
              {[
                {label:'Sessions',sub:'Total visits',key:'sessions',fmt:v=>v.toLocaleString()},
                {label:'Users',sub:'Unique visitors',key:'users',fmt:v=>v.toLocaleString()},
                {label:'Page views',sub:'Total pages viewed',key:'pageViews',fmt:v=>v.toLocaleString()},
                {label:'Avg engagement',sub:'Active time per session',key:'avgEngagement',fmt:v=>`${v}m`},
                {label:'Bounce rate',sub:'Left without interacting',key:'bounceRate',fmt:v=>`${v}%`,inv:true},
                {label:'New users',sub:'First-time visitors',key:'newUsers',fmt:v=>v.toLocaleString()},
              ].map(({label,sub,key,fmt,inv})=>{
                const d=kpis[key]||{current:0,change:0};
                const {color,symbol}=arrowColor(d.change,inv);
                return (
                  <div key={key} style={kpiBox}>
                    <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'1px'}}>{label}</div>
                    <div style={{fontSize:'10px',color:'#CBD5E1',marginBottom:'8px'}}>{sub}</div>
                    <div style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px',lineHeight:1}}>{fmt(d.current||0)}</div>
                    <div style={{fontSize:'11px',fontWeight:'600',color,display:'flex',alignItems:'center',gap:'2px'}}>{symbol} {Math.abs(d.change||0)}% vs prev {days}d</div>
                  </div>
                );
              })}
            </div>

            {/* Sessions trend chart */}
            {dailyTrend.length > 0 && (
              <div style={{...card(),marginBottom:'1rem'}}>
                <div style={sTitle}>Sessions over time</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={dailyTrend} margin={{left:-10,right:10}}>
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#CBD5E1" style={{fontSize:'11px'}} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#CBD5E1" style={{fontSize:'11px'}} tickLine={false} axisLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#2563EB" strokeWidth={2.5} fill="url(#sg)" dot={false} activeDot={{r:5,fill:'#2563EB'}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sources + New/Return */}
            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:'1rem',marginBottom:'1rem'}}>
              <div style={card()}>
                <div style={sTitle}>Traffic sources</div>
                {sources.length===0?<p style={{...muted,textAlign:'center',padding:'2rem 0'}}>No data</p>:<>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'10px'}}>
                    {sources.map((s,i)=>(
                      <span key={i} style={{fontSize:'11px',display:'flex',alignItems:'center',gap:'4px',color:'#374151'}}>
                        <span style={{width:'8px',height:'8px',borderRadius:'50%',background:COLORS[i%COLORS.length],display:'inline-block'}}/>
                        {s.source} <strong>{s.pct}%</strong>
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={sources} layout="vertical" margin={{left:0,right:30}}>
                      <XAxis type="number" stroke="#E2E8F0" style={{fontSize:'11px'}} tickLine={false} axisLine={false}/>
                      <YAxis dataKey="source" type="category" stroke="#9CA3AF" style={{fontSize:'11px'}} width={115} tickLine={false} axisLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="sessions" name="Sessions" radius={[0,6,6,0]}>{sources.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>}
              </div>

              <div style={card()}>
                <div style={sTitle}>New vs returning</div>
                {(!nr.new&&!nr.returning)?<p style={{...muted,textAlign:'center',padding:'2rem 0'}}>No data</p>:<>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={nrData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" startAngle={90} endAngle={450}>
                        {nrData.map((_,i)=><Cell key={i} fill={['#2563EB','#10B981','#9CA3AF'][i]}/>)}
                      </Pie>
                      <Tooltip formatter={v=>`${v}%`}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',justifyContent:'center',gap:'1.5rem',marginTop:'8px'}}>
                    {[{l:'New',v:nr.newPct,n:nr.new,c:'#2563EB'},{l:'Returning',v:nr.returningPct,n:nr.returning,c:'#10B981'}].map((x,i)=>(
                      <div key={i} style={{textAlign:'center'}}>
                        <div style={{fontSize:'18px',fontWeight:'700',color:x.c}}>{x.v}%</div>
                        <div style={{fontSize:'10px',color:'#9CA3AF'}}>{x.l} ({(x.n||0).toLocaleString()})</div>
                      </div>
                    ))}
                  </div>
                </>}
              </div>
            </div>

            {/* Top pages */}
            <div style={card()}>
              <div style={sTitle}>Top pages — {region==='US'?'US traffic':'all traffic'}</div>
              {pages.slice(0,5).map((p,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<4?'1px solid #F1F5F9':'none',gap:'1rem'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.page}</div>
                    {p.title&&<div style={{fontSize:'11px',color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'1px'}}>{p.title}</div>}
                  </div>
                  <div style={{display:'flex',gap:'10px',alignItems:'center',fontSize:'12px',color:'#6B7280',flexShrink:0}}>
                    <span>{p.views.toLocaleString()} views</span>
                    <span>{p.engagement}m</span>
                    <span>↩{p.bounceRate}%</span>
                    <span style={{background:H_BG[p.health],color:H_COLOR[p.health],fontSize:'10px',fontWeight:'600',padding:'2px 9px',borderRadius:'20px'}}>{H_LABEL[p.health]}</span>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* ── PAGES ── */}
          {tab==='pages' && <>
            <div style={{fontSize:'12px',color:'#6B7280',marginBottom:'1rem',padding:'8px 12px',background:'#F8FAFC',borderRadius:'8px'}}>
              <strong>Health score:</strong> Excellent = 70%+ engaged, 2+ min · Good = 50–70% · Needs work = 30–50% · Critical = under 30%
            </div>
            {pages.map((p,i)=>(
              <div key={i} style={{marginBottom:'10px',borderRadius:'10px',border:`1px solid ${H_COLOR[p.health]}40`,background:'#fff',overflow:'hidden'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'12px 14px',borderBottom:p.recommendation?`1px solid ${H_COLOR[p.health]}20`:'none'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                      <span style={{width:'4px',height:'16px',background:H_COLOR[p.health],borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
                      {p.page}
                    </div>
                    {p.title&&<div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'8px',marginLeft:'12px'}}>{p.title}</div>}
                    <div style={{display:'flex',gap:'1rem',fontSize:'12px',color:'#6B7280',marginLeft:'12px',flexWrap:'wrap'}}>
                      <span>📊 {p.views.toLocaleString()} views</span>
                      <span>⏱ {p.engagement}m avg</span>
                      <span>✅ {p.engagementRate}% engaged</span>
                      <span>↩ {p.bounceRate}% bounce</span>
                      <span>👤 {p.sessions.toLocaleString()} sessions</span>
                    </div>
                  </div>
                  <span style={{background:H_BG[p.health],color:H_COLOR[p.health],fontSize:'11px',fontWeight:'600',padding:'3px 12px',borderRadius:'20px',flexShrink:0}}>{H_LABEL[p.health]}</span>
                </div>
                {p.recommendation&&<div style={{padding:'10px 14px',background:H_BG[p.health],fontSize:'12px',color:'#374151',display:'flex',gap:'8px',alignItems:'flex-start'}}><span style={{flexShrink:0}}>💡</span><span>{p.recommendation}</span></div>}
              </div>
            ))}
          </>}

          {/* ── KEYWORDS ── */}
          {tab==='keywords' && <>
            {keywords.length===0?(
              <div style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>🔍</div>
                <p style={{fontWeight:'500',color:'#374151',marginBottom:'6px'}}>No keyword data yet</p>
                <p style={muted}>{gscError||'Make sure the service account has Full permission in Search Console.'}</p>
              </div>
            ):<>
              {gscSum&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'10px',marginBottom:'1rem'}}>
                  {[{l:'Total impressions',v:gscSum.totalImpressions.toLocaleString(),s:'Times AIO appeared in search'},{l:'Total clicks',v:gscSum.totalClicks.toLocaleString(),s:'Click-throughs'},{l:'Avg CTR',v:`${gscSum.avgCTR}%`,s:'Click-through rate'},{l:'Avg position',v:`#${gscSum.avgPosition}`,s:'Search ranking'}].map((k,i)=>(
                    <div key={i} style={kpiBox}>
                      <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'2px'}}>{k.l}</div>
                      <div style={{fontSize:'10px',color:'#CBD5E1',marginBottom:'6px'}}>{k.s}</div>
                      <div style={{fontSize:'20px',fontWeight:'700',color:'#111827'}}>{k.v}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{...card(),marginBottom:'1rem'}}>
                <div style={sTitle}>Top keywords</div>
                {keywords.map((k,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<keywords.length-1?'1px solid #F1F5F9':'none'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',marginBottom:'3px'}}>{k.keyword}</div>
                      <div style={{display:'flex',gap:'1rem',fontSize:'11px',color:'#9CA3AF'}}>
                        <span>👁 {k.impressions.toLocaleString()}</span>
                        <span>🖱 {k.clicks.toLocaleString()} clicks</span>
                        <span>CTR {k.ctr}%</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,marginLeft:'1rem'}}>
                      <div style={{fontSize:'20px',fontWeight:'700',color:k.position<=3?'#10B981':k.position<=10?'#2563EB':'#F59E0B'}}>#{Math.round(k.position)}</div>
                      <div style={{fontSize:'10px',color:'#9CA3AF'}}>rank</div>
                    </div>
                  </div>
                ))}
              </div>
              {opps.length>0&&(
                <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'10px',padding:'1.25rem'}}>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'#166534',marginBottom:'4px'}}>💡 Quick wins — page 2 & 3</div>
                  <p style={{fontSize:'12px',color:'#15803D',marginBottom:'1rem'}}>These keywords are close to page 1. A focused content update could push them over.</p>
                  {opps.map((o,i)=>(
                    <div key={i} style={{background:'#fff',borderRadius:'8px',padding:'10px 14px',marginBottom:'8px',border:'1px solid #BBF7D0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',marginBottom:'2px'}}>{o.keyword}</div>
                        <div style={{fontSize:'11px',color:'#6B7280'}}>{o.impressions.toLocaleString()} impressions · {o.ctr}% CTR · #{Math.round(o.position)} now · {o.gap} positions to page 1</div>
                      </div>
                      <span style={{background:o.potential==='high'?'#DCFCE7':'#FEF3C7',color:o.potential==='high'?'#166534':'#92400E',fontSize:'10px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',flexShrink:0,marginLeft:'1rem'}}>{o.potential==='high'?'⭐ High':'Medium'}</span>
                    </div>
                  ))}
                </div>
              )}
            </>}
          </>}

          {/* ── BEHAVIOR ── */}
          {tab==='behavior' && <>
            {clarity ? (
              <>
                <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'8px',padding:'10px 14px',marginBottom:'1rem',fontSize:'12px',color:'#1E40AF',display:'flex',gap:'8px',alignItems:'center'}}>
                  <span>✅</span><span><strong>Microsoft Clarity connected</strong> — live session data from Clarity.</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'10px',marginBottom:'1rem'}}>
                  {[
                    {label:'Rage clicks',val:clarity.rageClicks,bg:'#FEF2F2',color:'#DC2626',what:'Rapid repeated clicks from frustrated users',fix:clarity.rageClicks>20?'High — check product page CTAs and forms':'Normal range'},
                    {label:'Dead clicks',val:clarity.deadClicks,bg:'#FFFBEB',color:'#D97706',what:'Clicks on non-interactive elements',fix:clarity.deadClicks>50?'Review elements that look clickable but aren\'t':'Normal range'},
                    {label:'Error clicks',val:clarity.errorClicks,bg:'#EFF6FF',color:'#1D4ED8',what:'Clicks triggering JavaScript errors',fix:clarity.errorClicks>10?'Check browser console for JS errors':'Normal range'},
                    {label:'Frustration rate',val:`${clarity.frustrationRate}%`,bg:'#F5F3FF',color:'#7C3AED',what:'Sessions with frustration signals',fix:clarity.frustrationRate>10?'Above 10% — investigate session recordings':'Under 5% is healthy'},
                  ].map((item,i)=>(
                    <div key={i} style={{background:item.bg,borderRadius:'10px',padding:'14px',border:`1px solid ${item.color}25`}}>
                      <div style={{fontSize:'11px',color:item.color,fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{item.label}</div>
                      <div style={{fontSize:'28px',fontWeight:'700',color:item.color,marginBottom:'8px'}}>{item.val}</div>
                      <div style={{fontSize:'11px',color:'#374151',lineHeight:'1.5'}}>
                        <div style={{color:'#6B7280',marginBottom:'3px'}}>{item.what}</div>
                        <strong>{item.fix}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={card()}>
                  <div style={sTitle}>Session overview</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'10px'}}>
                    {[{l:'Recorded sessions',v:(clarity.recordedSessions||0).toLocaleString()},{l:'Frustrated sessions',v:(clarity.frustratedSessions||0).toLocaleString()},{l:'Avg duration',v:clarity.avgSessionDuration||'—'}].map((x,i)=>(
                      <div key={i} style={{background:'#F8FAFC',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                        <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'6px'}}>{x.l}</div>
                        <div style={{fontSize:'22px',fontWeight:'700',color:'#111827'}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'8px',padding:'10px 14px',marginBottom:'1rem',fontSize:'12px',color:'#92400E',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <span>ℹ️</span><span>Clarity API not connected. Showing GA4 behavior signals. View session recordings at <a href="https://clarity.microsoft.com" target="_blank" style={{color:'#D97706',fontWeight:'600'}}>clarity.microsoft.com</a></span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'10px',marginBottom:'1rem'}}>
                  {[
                    {label:'Avg engagement',val:`${kpis.avgEngagement?.current||0}m`,color:'#2563EB',bg:'#EFF6FF',what:'Active time per session',note:(kpis.avgEngagement?.current||0)<1?'Under 1 min — users not reading content':'Good engagement time'},
                    {label:'Bounce rate',val:`${kpis.bounceRate?.current||0}%`,color:'#EF4444',bg:'#FFF1F2',what:'Left without interacting',note:(kpis.bounceRate?.current||0)>60?'Above 60% — review page hero and CTAs':'Acceptable range'},
                    {label:'New user rate',val:`${nr.newPct||0}%`,color:'#8B5CF6',bg:'#F5F3FF',what:'First-time visitors',note:(nr.newPct||0)>85?'High — consider email capture':'Healthy new/return mix'},
                    {label:'Return rate',val:`${nr.returningPct||0}%`,color:'#10B981',bg:'#ECFDF5',what:'Visitors who came back',note:(nr.returningPct||0)<10?'Under 10% — try retargeting or newsletter':'Good return rate'},
                  ].map((item,i)=>(
                    <div key={i} style={{background:item.bg,borderRadius:'10px',padding:'14px',border:`1px solid ${item.color}25`}}>
                      <div style={{fontSize:'11px',color:item.color,fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{item.label}</div>
                      <div style={{fontSize:'26px',fontWeight:'700',color:item.color,marginBottom:'8px'}}>{item.val}</div>
                      <div style={{fontSize:'11px',color:'#374151',lineHeight:'1.5'}}>
                        <div style={{color:'#6B7280',marginBottom:'3px'}}>{item.what}</div>
                        <strong>{item.note}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {exitPages.length>0&&(
              <div style={card()}>
                <div style={sTitle}>High bounce pages</div>
                <p style={{...muted,marginBottom:'12px',marginTop:'-6px'}}>Priority pages to review — users are leaving without engaging.</p>
                {exitPages.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<exitPages.length-1?'1px solid #F1F5F9':'none'}}>
                    <span style={{fontSize:'13px',color:'#111827',fontWeight:'500'}}>{p.page}</span>
                    <div style={{display:'flex',gap:'1rem',fontSize:'12px',color:'#6B7280'}}>
                      <span>{p.sessions.toLocaleString()} sessions</span>
                      <span style={{color:p.bounceRate>70?'#EF4444':'#F59E0B',fontWeight:'600'}}>{p.bounceRate}% bounce</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>}

          {/* ── INSIGHTS ── */}
          {tab==='insights' && <>
            <div style={{...card(),marginBottom:'1rem'}}>
              <div style={sTitle}>Performance summary</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {insights().map((ins,i)=>{
                  const map={good:['#F0FDF4','#166534'],warn:['#FFFBEB','#92400E'],bad:['#FFF1F2','#9F1239']};
                  const [bg,color]=map[ins.t]||map.good;
                  return (
                    <div key={i} style={{background:bg,borderRadius:'8px',padding:'11px 14px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                      <span style={{flexShrink:0}}>{ins.t==='good'?'✅':ins.t==='warn'?'⚠️':'🔴'}</span>
                      <p style={{fontSize:'13px',color,margin:0,lineHeight:'1.6'}}>{ins.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={card()}>
              <div style={sTitle}>Action items this week</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {actions().map((item,i)=>(
                  <div key={i} style={{background:item.bg,border:`1px solid ${item.b}`,borderRadius:'8px',padding:'11px 14px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                    <span style={{color:item.c,fontWeight:'700',flexShrink:0,minWidth:'22px',fontSize:'13px'}}>{i+1}.</span>
                    <span style={{fontSize:'13px',color:'#374151',lineHeight:'1.6'}}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>}

          </>}
        </div>
      </div>
    </div>
  );
}
