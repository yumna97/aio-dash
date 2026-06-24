'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563EB','#10B981','#8B5CF6','#F59E0B','#EF4444','#6B7280'];
const HEALTH_COLOR = { excellent:'#10B981', good:'#2563EB', warning:'#F59E0B', critical:'#EF4444' };
const HEALTH_BG = { excellent:'#ECFDF5', good:'#EFF6FF', warning:'#FFFBEB', critical:'#FFF1F2' };
const HEALTH_LABEL = { excellent:'Excellent', good:'Good', warning:'Needs work', critical:'Critical' };

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
  const keywords = data?.keywords || [];
  const opps = data?.opportunities || [];
  const gscSum = data?.gscSummary;
  const behavior = data?.clarity || null;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const pill = a => ({ padding:'5px 14px', border:'1px solid', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontWeight: a?'600':'400', borderColor: a?'#2563EB':'#D1D5DB', background: a?'#EFF6FF':'#fff', color: a?'#2563EB':'#374151' });
  const tabSt = a => ({ padding:'10px 20px', border:'none', background:'transparent', fontSize:'14px', cursor:'pointer', fontWeight: a?'600':'400', color: a?'#2563EB':'#6B7280', borderBottom: a?'2px solid #2563EB':'2px solid transparent', whiteSpace:'nowrap' });
  const card = (extra={}) => ({ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'1.25rem', ...extra });
  const kpiCard = { background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'1rem' };
  const sectionTitle = { fontSize:'14px', fontWeight:'600', color:'#111827', marginBottom:'12px' };
  const muted = { fontSize:'12px', color:'#6B7280' };

  const arrowColor = (v, inv) => {
    const pos = inv ? v<=0 : v>=0;
    return { color: pos?'#059669':'#DC2626', symbol: pos?'↑':'↓' };
  };

  // ── Insights ────────────────────────────────────────────────────────────────
  const buildInsights = () => {
    const list = [];
    const s = kpis.sessions||{};
    const br = kpis.bounceRate||{};
    const eng = kpis.avgEngagement||{};
    if ((s.change||0)>10) list.push({t:'good', text:`Sessions up ${s.change}% vs previous ${days}d in ${region==='US'?'the US':'all markets'} — strong momentum.`});
    else if ((s.change||0)<-10) list.push({t:'bad', text:`Sessions dropped ${Math.abs(s.change||0)}% vs previous ${days}d. Check for ranking drops or traffic source changes.`});
    if ((br.current||0)>60) list.push({t:'bad', text:`Bounce rate is ${br.current}% on ${region==='US'?'US':'global'} traffic — above the 50% benchmark. The homepage needs a stronger opening hook and clearer CTA.`});
    if ((eng.change||0)<-15) list.push({t:'warn', text:`Avg engagement dropped ${Math.abs(eng.change||0)}%. Users may be scanning rather than reading — consider adding more visual content and shorter paragraphs.`});
    const directSrc = sources.find(s=>s.source==='Direct');
    if (directSrc && directSrc.pct>50) list.push({t:'warn', text:`${directSrc.pct}% of ${region==='US'?'US':'global'} traffic is "Direct" — this often includes internal visits (employees, QA). Real organic traffic share may be lower.`});
    if ((nr.newPct||0)>85) list.push({t:'warn', text:`${nr.newPct}% of visitors are new — return rate is very low. Consider email capture, retargeting ads, or a newsletter to build repeat visitors.`});
    const bad = pages.filter(p=>p.health==='warning'||p.health==='critical');
    if (bad.length>0) list.push({t:'warn', text:`${bad.length} page${bad.length>1?'s':''} below engagement benchmark: ${bad.slice(0,2).map(p=>p.page).join(', ')}. See Pages tab for specific recommendations.`});
    if (opps.length>0) list.push({t:'good', text:`${opps.length} keyword${opps.length>1?'s':''} ranking on page 2–3. Content updates targeting these could move them to page 1 and significantly increase organic traffic.`});
    if (list.length===0) list.push({t:'good', text:'All key metrics are within normal range. No critical issues detected this period.'});
    return list.slice(0,5);
  };

  const buildActions = () => {
    const items = [];
    opps.slice(0,2).forEach(o=>items.push({color:'#059669',bg:'#F0FDF4',border:'#BBF7D0',text:`Target "${o.keyword}" — ranking #${Math.round(o.position)} with ${o.impressions.toLocaleString()} impressions. Write or refresh a page targeting this. ${o.gap} positions to page 1.`}));
    pages.filter(p=>p.health==='warning'||p.health==='critical').slice(0,3).forEach(p=>items.push({color:'#D97706',bg:'#FFFBEB',border:'#FDE68A',text:`${p.page}: ${p.recommendation}`}));
    if ((kpis.bounceRate?.current||0)>60) items.push({color:'#DC2626',bg:'#FEF2F2',border:'#FECACA',text:`Bounce rate is ${kpis.bounceRate?.current}%. A/B test the homepage hero — try a clearer headline that immediately communicates AIO's core value for US restaurant operators.`});
    if (items.length===0) items.push({color:'#059669',bg:'#F0FDF4',border:'#BBF7D0',text:'No urgent actions needed. Maintain publishing cadence and monitor keyword positions weekly.'});
    return items;
  };

  const nrData = [
    { name:'New', value: nr.newPct||0 },
    { name:'Returning', value: nr.returningPct||0 },
    ...(nr.otherPct > 0 ? [{ name:'Other', value: nr.otherPct||0 }] : []),
  ];

  return (
    <div style={{background:'#F8FAFC',minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      {/* Top nav */}
      <div style={{background:'#fff',borderBottom:'1px solid #E5E7EB',padding:'0 1.5rem'}}>
        <div style={{maxWidth:'1400px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:'60px'}}>
          <div>
            <span style={{fontSize:'17px',fontWeight:'700',color:'#111827'}}>AIO website performance</span>
            <span style={{fontSize:'12px',color:'#9CA3AF',marginLeft:'10px'}}>GA4 · Search Console · Clarity</span>
          </div>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            {[7,14,30,90].map(d=><button key={d} onClick={()=>setDays(d)} style={pill(days===d)}>{d}d</button>)}
            <div style={{width:'1px',height:'20px',background:'#E5E7EB',margin:'0 4px'}}/>
            <button onClick={()=>setRegion('US')} style={pill(region==='US')}>🇺🇸 US</button>
            <button onClick={()=>setRegion('ALL')} style={pill(region==='ALL')}>🌍 Global</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'1.25rem 1.5rem'}}>
        {/* Status bar */}
        <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',color:'#6B7280',marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Showing <strong style={{color:'#111827'}}>last {days} days</strong> · {region==='US'?'🇺🇸 United States traffic only':'🌍 All countries'}</span>
          <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {loading?<span style={{color:'#9CA3AF'}}>Loading…</span>:<span>Refreshed {ts}</span>}
            <button onClick={load} style={{fontSize:'11px',padding:'3px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',background:'#fff',cursor:'pointer'}}>↻ Refresh</button>
          </span>
        </div>

        {/* Tabs */}
        <div style={{background:'#fff',border:'1px solid #E5E7EB',borderRadius:'12px 12px 0 0',display:'flex',overflowX:'auto',borderBottom:'none'}}>
          {[['overview','Overview'],['pages','Pages'],['keywords','Keywords'],['behavior','User behavior'],['insights','Insights']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={tabSt(tab===id)}>{lbl}</button>
          ))}
        </div>
        <div style={{background:'#fff',border:'1px solid #E5E7EB',borderTop:'none',borderRadius:'0 0 12px 12px',padding:'1.5rem',marginBottom:'1rem'}}>

          {loading && (
            <div style={{padding:'3rem',textAlign:'center',color:'#9CA3AF'}}>
              <div style={{fontSize:'28px',marginBottom:'0.5rem'}}>⏳</div>
              <p style={{fontSize:'14px'}}>Loading {region==='US'?'US':'global'} data…</p>
            </div>
          )}

          {!loading && <>

            {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
            {tab==='overview' && <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:'10px',marginBottom:'1.5rem'}}>
                {[
                  {label:'Sessions',key:'sessions',fmt:v=>v.toLocaleString(),help:'Total visits'},
                  {label:'Users',key:'users',fmt:v=>v.toLocaleString(),help:'Unique visitors'},
                  {label:'Page views',key:'pageViews',fmt:v=>v.toLocaleString(),help:'Total pages viewed'},
                  {label:'Avg engagement',key:'avgEngagement',fmt:v=>`${v}m`,help:'Avg time actively on page'},
                  {label:'Bounce rate',key:'bounceRate',fmt:v=>`${v}%`,inv:true,help:'Left without interacting'},
                  {label:'New users',key:'newUsers',fmt:v=>v.toLocaleString(),help:'First-time visitors'},
                ].map(({label,key,fmt,inv,help})=>{
                  const d=kpis[key]||{current:0,change:0};
                  const {color,symbol}=arrowColor(d.change,inv);
                  return (
                    <div key={key} style={kpiCard}>
                      <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'2px'}}>{label}</div>
                      <div style={{fontSize:'11px',color:'#CBD5E1',marginBottom:'8px'}}>{help}</div>
                      <div style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>{fmt(d.current||0)}</div>
                      <div style={{fontSize:'11px',fontWeight:'600',color,display:'flex',alignItems:'center',gap:'2px'}}>{symbol} {Math.abs(d.change||0)}% vs prev {days}d</div>
                    </div>
                  );
                })}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:'1rem',marginBottom:'1rem'}}>
                <div style={card()}>
                  <div style={sectionTitle}>Traffic sources</div>
                  {sources.length===0?<p style={{...muted,textAlign:'center',padding:'2rem 0'}}>No source data</p>:<>
                    <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'10px'}}>
                      {sources.map((s,i)=>(
                        <span key={i} style={{fontSize:'11px',display:'flex',alignItems:'center',gap:'4px',color:'#374151'}}>
                          <span style={{width:'8px',height:'8px',borderRadius:'50%',background:COLORS[i%COLORS.length],display:'inline-block'}}/>
                          {s.source} <strong>{s.pct}%</strong>
                        </span>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={sources} layout="vertical" margin={{left:0,right:30}}>
                        <XAxis type="number" stroke="#CBD5E1" style={{fontSize:'11px'}} tickLine={false} axisLine={false}/>
                        <YAxis dataKey="source" type="category" stroke="#9CA3AF" style={{fontSize:'11px'}} width={115} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={{fontSize:'12px',borderRadius:'8px',border:'1px solid #E5E7EB',boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}} formatter={(v,n,p)=>[`${p.payload.pct}% (${v} sessions)`,'Sessions']}/>
                        <Bar dataKey="sessions" radius={[0,6,6,0]}>
                          {sources.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>}
                </div>

                <div style={card()}>
                  <div style={sectionTitle}>New vs returning</div>
                  {(!nr.new&&!nr.returning)?<p style={{...muted,textAlign:'center',padding:'2rem 0'}}>No data</p>:<>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={nrData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" startAngle={90} endAngle={450}>
                          <Cell fill="#2563EB"/><Cell fill="#10B981"/><Cell fill="#9CA3AF"/>
                        </Pie>
                        <Tooltip formatter={v=>`${v}%`}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{display:'flex',justifyContent:'center',gap:'1.5rem',marginTop:'8px'}}>
                      {[{label:'New',val:nr.newPct,count:nr.new,color:'#2563EB'},{label:'Returning',val:nr.returningPct,count:nr.returning,color:'#10B981'}].map((x,i)=>(
                        <div key={i} style={{textAlign:'center'}}>
                          <div style={{fontSize:'18px',fontWeight:'700',color:x.color}}>{x.val}%</div>
                          <div style={{fontSize:'11px',color:'#9CA3AF'}}>{x.label} ({(x.count||0).toLocaleString()})</div>
                        </div>
                      ))}
                    </div>
                  </>}
                </div>
              </div>

              <div style={card()}>
                <div style={sectionTitle}>Top pages — {region==='US'?'US traffic':'all traffic'}</div>
                {pages.slice(0,5).map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<4?'1px solid #F1F5F9':'none',gap:'1rem'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.page}</div>
                      {p.title&&<div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</div>}
                    </div>
                    <div style={{display:'flex',gap:'12px',alignItems:'center',fontSize:'12px',color:'#6B7280',flexShrink:0}}>
                      <span>{p.views.toLocaleString()} views</span>
                      <span>{p.engagement}m</span>
                      <span>↩ {p.bounceRate}%</span>
                      <span style={{background:HEALTH_BG[p.health],color:HEALTH_COLOR[p.health],fontSize:'10px',fontWeight:'600',padding:'2px 9px',borderRadius:'20px'}}>{HEALTH_LABEL[p.health]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* ── PAGES ────────────────────────────────────────────────────── */}
            {tab==='pages' && <>
              <div style={{...muted,marginBottom:'1rem',padding:'10px 14px',background:'#F1F5F9',borderRadius:'8px'}}>
                Health score: <strong>Excellent</strong> = 70%+ engaged for 2+ min · <strong>Good</strong> = 50–70% · <strong>Needs work</strong> = 30–50% · <strong>Critical</strong> = under 30%
              </div>
              {pages.map((p,i)=>(
                <div key={i} style={{marginBottom:'10px',borderRadius:'10px',border:`1px solid ${HEALTH_COLOR[p.health]}40`,background:'#fff',overflow:'hidden'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'12px 14px',borderBottom:p.recommendation?`1px solid ${HEALTH_COLOR[p.health]}20`:'none'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{width:'4px',height:'16px',background:HEALTH_COLOR[p.health],borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
                        {p.page}
                      </div>
                      {p.title&&<div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'2px',marginLeft:'12px'}}>{p.title}</div>}
                      <div style={{display:'flex',gap:'1rem',fontSize:'12px',color:'#6B7280',marginTop:'8px',marginLeft:'12px',flexWrap:'wrap'}}>
                        <span>📊 {p.views.toLocaleString()} views</span>
                        <span>⏱ {p.engagement}m avg</span>
                        <span>✅ {p.engagementRate}% engaged</span>
                        <span>↩ {p.bounceRate}% bounce</span>
                        <span>👤 {p.sessions.toLocaleString()} sessions</span>
                      </div>
                    </div>
                    <span style={{background:HEALTH_BG[p.health],color:HEALTH_COLOR[p.health],fontSize:'11px',fontWeight:'600',padding:'3px 12px',borderRadius:'20px',flexShrink:0}}>{HEALTH_LABEL[p.health]}</span>
                  </div>
                  {p.recommendation&&(
                    <div style={{padding:'10px 14px',background:`${HEALTH_BG[p.health]}`,fontSize:'12px',color:'#374151',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                      <span style={{flexShrink:0,fontSize:'13px'}}>💡</span>
                      <span>{p.recommendation}</span>
                    </div>
                  )}
                </div>
              ))}
            </>}

            {/* ── KEYWORDS ─────────────────────────────────────────────────── */}
            {tab==='keywords' && <>
              {keywords.length===0?(
                <div style={{textAlign:'center',padding:'3rem',color:'#9CA3AF'}}>
                  <div style={{fontSize:'32px',marginBottom:'0.75rem'}}>🔍</div>
                  <p style={{fontWeight:'500',color:'#374151',marginBottom:'6px'}}>No keyword data yet</p>
                  <p style={muted}>Make sure the service account has Full permission in Search Console. Data may take 24–48h to appear.</p>
                </div>
              ):<>
                {gscSum&&(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'10px',marginBottom:'1rem'}}>
                    {[
                      {label:'Total impressions',value:gscSum.totalImpressions.toLocaleString(),help:'Times AIO appeared in US search'},
                      {label:'Total clicks',value:gscSum.totalClicks.toLocaleString(),help:'Times users clicked through'},
                      {label:'Avg CTR',value:`${gscSum.avgCTR}%`,help:'Click-through rate'},
                      {label:'Avg position',value:`#${gscSum.avgPosition}`,help:'Avg US search ranking'},
                    ].map((k,i)=>(
                      <div key={i} style={kpiCard}>
                        <div style={{fontSize:'11px',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'2px'}}>{k.label}</div>
                        <div style={{fontSize:'11px',color:'#CBD5E1',marginBottom:'6px'}}>{k.help}</div>
                        <div style={{fontSize:'22px',fontWeight:'700',color:'#111827'}}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{...card(),marginBottom:'1rem'}}>
                  <div style={sectionTitle}>Top keywords {gscSum?.isUSFiltered?'— US search results':'— global search results'}</div>
                  {keywords.map((k,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<keywords.length-1?'1px solid #F1F5F9':'none'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',fontWeight:'500',color:'#111827',marginBottom:'3px'}}>{k.keyword}</div>
                        <div style={{display:'flex',gap:'1rem',fontSize:'11px',color:'#9CA3AF'}}>
                          <span>👁 {k.impressions.toLocaleString()} impressions</span>
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
                  <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'12px',padding:'1.25rem'}}>
                    <div style={{fontSize:'14px',fontWeight:'600',color:'#166534',marginBottom:'4px'}}>💡 Quick wins — page 2 & 3</div>
                    <p style={{fontSize:'12px',color:'#15803D',marginBottom:'1rem'}}>These keywords are ranking just outside page 1. A focused content update could move them over.</p>
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

            {/* ── BEHAVIOR ─────────────────────────────────────────────────── */}
            {tab==='behavior' && <>
              {behavior && (
                <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'8px',padding:'12px 14px',marginBottom:'1rem',fontSize:'12px',color:'#1E40AF',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <span style={{flexShrink:0}}>✅</span>
                  <span><strong>Clarity connected</strong> — showing live session data from Microsoft Clarity.</span>
                </div>
              )}
              {!behavior && (
                <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'8px',padding:'12px 14px',marginBottom:'1rem',fontSize:'12px',color:'#92400E',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <span style={{flexShrink:0}}>ℹ️</span>
                  <span>Clarity API not connected. Showing GA4 behavior signals instead. View recordings at <a href="https://clarity.microsoft.com" target="_blank" style={{color:'#D97706',fontWeight:'600'}}>clarity.microsoft.com</a></span>
                </div>
              )}

              <div style={{...card(),marginBottom:'1rem'}}>
                <div style={sectionTitle}>GA4 behavior signals</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'10px'}}>
                  {[
                    {label:'Avg engagement time',val:`${kpis.avgEngagement?.current||0}m`,color:'#2563EB',bg:'#EFF6FF',what:'How long users actively engage per session',note: (kpis.avgEngagement?.current||0)<1?'Under 1 min is low — users may not be reading content':'Good engagement time'},
                    {label:'Bounce rate',val:`${kpis.bounceRate?.current||0}%`,color:'#EF4444',bg:'#FFF1F2',what:'Users who left without any interaction',note:(kpis.bounceRate?.current||0)>60?'Above 60% — review page openings and CTAs':'Within acceptable range'},
                    {label:'New user rate',val:`${nr.newPct||0}%`,color:'#8B5CF6',bg:'#F5F3FF',what:'Share of first-time visitors',note:(nr.newPct||0)>85?'Very high — low loyalty. Consider email capture':'Healthy mix of new and returning'},
                    {label:'Return visitor rate',val:`${nr.returningPct||0}%`,color:'#10B981',bg:'#ECFDF5',what:'Users who came back to the site',note:(nr.returningPct||0)<10?'Under 10% — consider retargeting or newsletter':'Good return rate'},
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
              </div>

              {exitPages.length>0&&(
                <div style={card()}>
                  <div style={sectionTitle}>High bounce pages</div>
                  <p style={{...muted,marginBottom:'12px',marginTop:'-6px'}}>Pages where users most commonly leave without engaging. These are priority pages to review.</p>
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

            {/* ── INSIGHTS ─────────────────────────────────────────────────── */}
            {tab==='insights' && <>
              <div style={{...card(),marginBottom:'1rem'}}>
                <div style={sectionTitle}>📊 Performance summary</div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {buildInsights().map((ins,i)=>{
                    const map={good:['#F0FDF4','#166534'],warn:['#FFFBEB','#92400E'],bad:['#FFF1F2','#9F1239']};
                    const [bg,color]=map[ins.t]||map.good;
                    return (
                      <div key={i} style={{background:bg,borderRadius:'8px',padding:'12px 14px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                        <span style={{flexShrink:0}}>{ins.t==='good'?'✅':ins.t==='warn'?'⚠️':'🔴'}</span>
                        <p style={{fontSize:'13px',color,margin:0,lineHeight:'1.6'}}>{ins.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={card()}>
                <div style={sectionTitle}>📌 Action items this week</div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {buildActions().map((item,i)=>(
                    <div key={i} style={{background:item.bg,border:`1px solid ${item.border}`,borderRadius:'8px',padding:'12px 14px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                      <span style={{color:item.color,fontWeight:'700',flexShrink:0,minWidth:'22px',fontSize:'13px'}}>{i+1}.</span>
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
