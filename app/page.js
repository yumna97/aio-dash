'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SOURCE_COLORS = { 'Organic Search': '#1D9E75', 'Direct': '#378ADD', 'Referral': '#7F77DD', 'Organic Social': '#EF9F27', 'Email': '#D4537E', 'Other': '#888780' };
const PIE_COLORS = ['#1D9E75', '#378ADD', '#7F77DD', '#EF9F27', '#D4537E', '#888780'];

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [days, setDays] = useState(7);
  const [region, setRegion] = useState('US');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard-data?days=${days}&region=${region}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setError('Could not load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [days, region]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = {
    wrap: { background: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
    inner: { maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1.25rem' },
    topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' },
    h1: { fontSize: '22px', fontWeight: '600', color: '#111827', margin: '0 0 3px' },
    sub: { fontSize: '13px', color: '#6B7280', margin: 0 },
    controls: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
    metaBar: { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: '#6B7280', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' },
    tabs: { display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '1.5rem', overflowX: 'auto' },
    tab: (active) => ({ padding: '10px 18px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: active ? '600' : '400', color: active ? '#1D4ED8' : '#6B7280', borderBottom: active ? '2px solid #1D4ED8' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }),
    pill: (active) => ({ padding: '5px 12px', border: '1px solid', borderColor: active ? '#1D4ED8' : '#D1D5DB', borderRadius: '20px', background: active ? '#EFF6FF' : '#fff', color: active ? '#1D4ED8' : '#374151', fontSize: '12px', cursor: 'pointer', fontWeight: active ? '600' : '400' }),
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '1.25rem' },
    kpi: { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px' },
    kpiLabel: { fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
    kpiVal: { fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    kpiChange: (pos) => ({ fontSize: '12px', fontWeight: '500', color: pos ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: '3px' }),
    card: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' },
    cardTitle: { fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '1rem' },
    chartsRow: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1rem' },
    sectionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
    badge: (type) => {
      const map = { excellent: ['#DCFCE7', '#166534'], good: ['#DBEAFE', '#1E40AF'], warning: ['#FEF3C7', '#92400E'], critical: ['#FEE2E2', '#991B1B'] };
      const [bg, text] = map[type] || map.good;
      return { background: bg, color: text, fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' };
    },
    tableRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F3F4F6', fontSize: '13px' },
    clarityCard: (color) => ({ borderRadius: '10px', padding: '14px', background: color, textAlign: 'center' }),
    insight: (type) => {
      const map = { good: ['#F0FDF4', '#15803D', '#166534'], warn: ['#FFFBEB', '#D97706', '#92400E'], bad: ['#FFF1F2', '#E11D48', '#9F1239'] };
      const [bg, dot, text] = map[type] || map.good;
      return { bg, dot, text };
    },
  };

  const changeArrow = (v) => v >= 0 ? '↑' : '↓';

  const getHealthLabel = (h) => {
    const map = { excellent: 'Excellent', good: 'Good', warning: 'Needs work', critical: 'Critical' };
    return map[h] || 'Good';
  };

  if (error) return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#DC2626', marginBottom: '1rem' }}>{error}</p>
        <button onClick={fetchData} style={{ padding: '8px 20px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const kpis = data?.kpis || {};
  const topPages = data?.topPages || [];
  const sources = data?.sources || [];
  const newReturn = data?.newReturn || {};
  const keywords = data?.keywords || [];
  const opportunities = data?.opportunities || [];
  const behavior = data?.behavior || {};

  const newReturnData = [
    { name: 'New users', value: newReturn.newPct || 0 },
    { name: 'Returning', value: newReturn.returningPct || 0 },
  ];

  const generateInsights = () => {
    const insights = [];
    if (kpis.sessions?.change > 10) insights.push({ type: 'good', text: `Sessions up ${kpis.sessions.change}% vs previous period — strong traffic growth. Homepage is the top landing page.` });
    else if (kpis.sessions?.change < -10) insights.push({ type: 'bad', text: `Sessions dropped ${Math.abs(kpis.sessions.change)}% vs previous period. Review traffic sources for drop-off.` });
    if (kpis.avgEngagement?.change < -20) insights.push({ type: 'warn', text: `Engagement time dropped ${Math.abs(kpis.avgEngagement.change)}%. Users may not be finding what they need — consider reviewing page content depth.` });
    if (behavior.rageClicks > 50) insights.push({ type: 'bad', text: `${behavior.rageClicks} rage clicks detected on Clarity. Users are frustrated — likely broken CTAs or unresponsive buttons on product pages.` });
    if (opportunities.length > 0) insights.push({ type: 'good', text: `${opportunities.length} keyword opportunities identified in positions 10–30. These are quick wins — targeted content updates could move them to page 1.` });
    if (newReturn.newPct > 80) insights.push({ type: 'warn', text: `${newReturn.newPct}% of users are new. Very low return rate — consider email capture or retargeting to improve retention.` });
    if (kpis.bounceRate?.current > 60) insights.push({ type: 'bad', text: `Bounce rate at ${kpis.bounceRate.current}% — above the 50% benchmark. Review above-the-fold content and page load speed.` });
    if (insights.length === 0) insights.push({ type: 'good', text: `Overall performance looks stable. No critical issues detected in this period.` });
    return insights.slice(0, 4);
  };

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        {/* Header */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.h1}>AIO website performance</h1>
            <p style={s.sub}>GA4 · Search Console · Clarity · {region === 'US' ? '🇺🇸 United States' : '🌍 Global'}</p>
          </div>
          <div style={s.controls}>
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={s.pill(days === d)}>{d}d</button>
            ))}
            <div style={{ width: '1px', height: '20px', background: '#E5E7EB', margin: '0 4px' }} />
            <button onClick={() => setRegion('US')} style={s.pill(region === 'US')}>🇺🇸 US</button>
            <button onClick={() => setRegion('ALL')} style={s.pill(region === 'ALL')}>🌍 Global</button>
          </div>
        </div>

        {/* Meta bar */}
        <div style={s.metaBar}>
          <span>Showing last <strong>{days} days</strong> · {region === 'US' ? 'United States traffic only' : 'All countries'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading && <span style={{ color: '#6B7280' }}>⏳ Loading...</span>}
            {lastRefreshed && !loading && <span>Last refreshed {lastRefreshed}</span>}
            <button onClick={fetchData} style={{ fontSize: '11px', padding: '3px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#374151' }}>↻ Refresh</button>
          </span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[['overview', 'Overview'], ['pages', 'Pages'], ['keywords', 'Keywords (US)'], ['behavior', 'User behavior'], ['insights', 'Insights']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={s.tab(activeTab === id)}>{label}</button>
          ))}
        </div>

        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '0.75rem' }}>⏳</div>
            <p>Loading {region === 'US' ? 'US' : 'global'} data for last {days} days...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div>
                <div style={s.kpiGrid}>
                  {[
                    { label: 'Sessions', key: 'sessions', format: v => v.toLocaleString() },
                    { label: 'Users', key: 'users', format: v => v.toLocaleString() },
                    { label: 'Page views', key: 'pageViews', format: v => v.toLocaleString() },
                    { label: 'Avg engagement', key: 'avgEngagement', format: v => `${v}m` },
                    { label: 'Bounce rate', key: 'bounceRate', format: v => `${v}%`, invertColor: true },
                    { label: 'New users', key: 'newUsers', format: v => v.toLocaleString() },
                  ].map(({ label, key, format, invertColor }) => {
                    const d = kpis[key] || {};
                    const isPos = invertColor ? d.change <= 0 : d.change >= 0;
                    return (
                      <div key={key} style={s.kpi}>
                        <div style={s.kpiLabel}>{label}</div>
                        <div style={s.kpiVal}>{format(d.current || 0)}</div>
                        <div style={s.kpiChange(isPos)}>
                          {changeArrow(isPos ? 1 : -1)} {Math.abs(d.change || 0)}% vs prev {days}d
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={s.chartsRow}>
                  <div style={s.card}>
                    <div style={s.cardTitle}>Traffic sources</div>
                    {sources.length === 0 ? (
                      <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>No source data</p>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {sources.map((s2, i) => (
                            <span key={i} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#374151' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                              {s2.source} {s2.pct}%
                            </span>
                          ))}
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={sources} layout="vertical">
                            <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                            <YAxis dataKey="source" type="category" stroke="#9CA3AF" style={{ fontSize: '11px' }} width={100} />
                            <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                            <Bar dataKey="sessions" radius={[0, 6, 6, 0]}>
                              {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div style={s.card}>
                    <div style={s.cardTitle}>New vs returning users</div>
                    {newReturn.new === 0 && newReturn.returning === 0 ? (
                      <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>No data</p>
                    ) : (
                      <div>
                        <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie data={newReturnData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                              <Cell fill="#1D9E75" />
                              <Cell fill="#378ADD" />
                            </Pie>
                            <Tooltip formatter={(v) => `${v}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '13px', marginTop: '8px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '700', fontSize: '20px', color: '#1D9E75' }}>{newReturn.newPct}%</div>
                            <div style={{ color: '#6B7280', fontSize: '11px' }}>New users ({newReturn.new?.toLocaleString()})</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '700', fontSize: '20px', color: '#378ADD' }}>{newReturn.returningPct}%</div>
                            <div style={{ color: '#6B7280', fontSize: '11px' }}>Returning ({newReturn.returning?.toLocaleString()})</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top pages preview */}
                <div style={s.card}>
                  <div style={s.cardTitle}>Top pages — {region === 'US' ? 'US traffic' : 'all traffic'}</div>
                  {topPages.slice(0, 5).map((p, i) => (
                    <div key={i} style={s.tableRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#111827', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>
                        <span>{p.views.toLocaleString()} views</span>
                        <span>{p.engagement}m engaged</span>
                        <span>↩ {p.bounceRate}%</span>
                        <span style={s.badge(p.health)}>{getHealthLabel(p.health)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PAGES ── */}
            {activeTab === 'pages' && (
              <div>
                <div style={{ ...s.card, marginBottom: '1rem' }}>
                  <div style={s.cardTitle}>Page performance — {region === 'US' ? '🇺🇸 US traffic only' : '🌍 all countries'}</div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '1rem', marginTop: '-8px' }}>
                    Health score is based on engagement rate + time on page. Benchmark: excellent = 70%+ engaged for 2+ min.
                  </p>
                  {topPages.length === 0 ? (
                    <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>No page data available</p>
                  ) : topPages.map((p, i) => (
                    <div key={i} style={{ padding: '12px', marginBottom: '8px', background: '#F9FAFB', borderRadius: '8px', borderLeft: `4px solid ${p.health === 'excellent' ? '#1D9E75' : p.health === 'good' ? '#378ADD' : p.health === 'warning' ? '#EF9F27' : '#E24B4A'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{p.page}</div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{p.title}</div>
                        </div>
                        <span style={s.badge(p.health)}>{getHealthLabel(p.health)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px', color: '#6B7280' }}>
                        <span>📊 {p.views.toLocaleString()} views</span>
                        <span>⏱ {p.engagement}m avg engagement</span>
                        <span>✅ {p.engagementRate}% engaged</span>
                        <span>↩ {p.bounceRate}% bounce</span>
                        <span>🔢 {p.sessions.toLocaleString()} sessions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── KEYWORDS ── */}
            {activeTab === 'keywords' && (
              <div>
                {data?.keywords?.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#6B7280', marginBottom: '8px' }}>No US keyword data available yet.</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Make sure the service account is added to Search Console with Full permissions.</p>
                  </div>
                ) : (
                  <>
                    {data?.keywords && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1rem' }}>
                        {[
                          { label: 'Total impressions (US)', value: (data?.keywords?.reduce((s, k) => s + k.impressions, 0) || 0).toLocaleString() },
                          { label: 'Total clicks (US)', value: (data?.keywords?.reduce((s, k) => s + k.clicks, 0) || 0).toLocaleString() },
                          { label: 'Avg CTR', value: `${data?.keywords?.length > 0 ? (data.keywords.reduce((s, k) => s + k.ctr, 0) / data.keywords.length).toFixed(1) : 0}%` },
                          { label: 'Avg position', value: data?.keywords?.length > 0 ? (data.keywords.reduce((s, k) => s + k.position, 0) / data.keywords.length).toFixed(1) : '—' },
                        ].map((k, i) => (
                          <div key={i} style={s.kpi}>
                            <div style={s.kpiLabel}>{k.label}</div>
                            <div style={{ ...s.kpiVal, fontSize: '20px' }}>{k.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={s.card}>
                      <div style={s.cardTitle}>Top keywords — US search results</div>
                      {keywords.map((k, i) => (
                        <div key={i} style={{ ...s.tableRow, padding: '10px 0' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>{k.keyword}</div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '11px', color: '#6B7280' }}>
                              <span>👁 {k.impressions.toLocaleString()} impressions</span>
                              <span>🖱 {k.clicks.toLocaleString()} clicks</span>
                              <span>📈 {k.ctr}% CTR</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: k.position <= 3 ? '#059669' : k.position <= 10 ? '#1D4ED8' : '#D97706' }}>#{Math.round(k.position)}</div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>US position</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {opportunities.length > 0 && (
                      <div style={{ ...s.card, border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
                        <div style={{ ...s.cardTitle, color: '#166534' }}>💡 Quick wins — positions 10–30 in US</div>
                        <p style={{ fontSize: '12px', color: '#15803D', marginBottom: '1rem', marginTop: '-8px' }}>
                          These keywords rank on page 2–3 in the US. A content update or new blog post targeting these could push them to page 1.
                        </p>
                        {opportunities.map((o, i) => (
                          <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', border: '1px solid #BBF7D0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{o.keyword}</div>
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                  {o.impressions.toLocaleString()} US impressions · {o.ctr}% CTR · {o.gap} positions to page 1
                                </div>
                              </div>
                              <span style={{ background: o.potential === 'high' ? '#DCFCE7' : '#FEF3C7', color: o.potential === 'high' ? '#166534' : '#92400E', fontSize: '10px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
                                {o.potential === 'high' ? '⭐ HIGH' : 'MEDIUM'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── BEHAVIOR ── */}
            {activeTab === 'behavior' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
                  {[
                    { label: 'Rage clicks', val: behavior.rageClicks || 0, bg: '#FEF2F2', color: '#DC2626', what: 'Users clicking rapidly in frustration', fix: 'Check for broken buttons or unresponsive CTAs' },
                    { label: 'Dead clicks', val: behavior.deadClicks || 0, bg: '#FFFBEB', color: '#D97706', what: 'Clicks on non-interactive elements', fix: 'Review elements that look clickable but aren\'t' },
                    { label: 'Error clicks', val: behavior.errorClicks || 0, bg: '#EFF6FF', color: '#1D4ED8', what: 'Clicks triggering JavaScript errors', fix: 'Check browser console for JS errors on forms/buttons' },
                    { label: 'Frustration rate', val: `${behavior.frustrationRate || 0}%`, bg: '#F5F3FF', color: '#7C3AED', what: 'Sessions with frustration signals', fix: 'Benchmark: under 5% is healthy, above 10% needs action' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: item.bg, border: `1px solid ${item.color}30`, borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: item.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{item.label}</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: item.color, marginBottom: '8px' }}>{item.val}</div>
                      <div style={{ fontSize: '11px', color: '#374151', marginBottom: '4px' }}><strong>What it means:</strong> {item.what}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}><strong>What to do:</strong> {item.fix}</div>
                    </div>
                  ))}
                </div>

                <div style={s.card}>
                  <div style={s.cardTitle}>Session overview</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {[
                      { label: 'Recorded sessions', val: (behavior.recordedSessions || 0).toLocaleString() },
                      { label: 'Frustrated sessions', val: (behavior.frustratedSessions || 0).toLocaleString() },
                      { label: 'Avg session duration', val: behavior.avgSessionDuration || '0m' },
                      { label: 'Feedback submitted', val: (behavior.feedbackSubmitted || 0).toLocaleString() },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '6px' }}>{item.label}</div>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {(behavior.topFrustrationPages || []).length > 0 && (
                  <div style={s.card}>
                    <div style={s.cardTitle}>Pages with highest frustration</div>
                    {(behavior.topFrustrationPages || []).map((p, i) => (
                      <div key={i} style={{ ...s.tableRow, padding: '10px 0' }}>
                        <span style={{ fontSize: '13px', color: '#111827' }}>{p.page}</span>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#6B7280' }}>
                          <span>😤 {p.frustrated} frustrated</span>
                          <span>⚠️ {p.errorRate} errors</span>
                          <span style={s.badge(p.severity === 'high' ? 'critical' : 'warning')}>{p.severity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── INSIGHTS ── */}
            {activeTab === 'insights' && (
              <div>
                <div style={{ ...s.card, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: '1rem' }}>
                  <div style={{ ...s.cardTitle, color: '#1D4ED8' }}>📋 What to tell your manager</div>
                  <p style={{ fontSize: '14px', color: '#1E40AF', lineHeight: '1.7' }}>
                    {region === 'US' ? 'In the US market, ' : 'Globally, '}
                    AIO received <strong>{(kpis.sessions?.current || 0).toLocaleString()} sessions</strong> in the last {days} days
                    {kpis.sessions?.change > 0 ? `, up ${kpis.sessions.change}% from the previous period` : kpis.sessions?.change < 0 ? `, down ${Math.abs(kpis.sessions?.change)}% from the previous period` : ''}.
                    {' '}Top performing pages are {topPages.slice(0, 2).map(p => p.page).join(' and ')}.
                    {keywords.length > 0 && ` In US search, the site ranks #${Math.round(keywords[0]?.position || 0)} for "${keywords[0]?.keyword}".`}
                    {behavior.rageClicks > 50 ? ` There are ${behavior.rageClicks} rage clicks flagged by Clarity — UX review recommended.` : ' No major UX issues flagged this period.'}
                  </p>
                </div>

                <div style={s.card}>
                  <div style={s.cardTitle}>🧠 Automated insights</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {generateInsights().map((ins, i) => {
                      const colors = ins.type === 'good' ? ['#F0FDF4', '#166534', '#DCFCE7'] : ins.type === 'warn' ? ['#FFFBEB', '#92400E', '#FEF3C7'] : ['#FFF1F2', '#9F1239', '#FFE4E6'];
                      return (
                        <div key={i} style={{ background: colors[0], borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '16px', flexShrink: 0 }}>{ins.type === 'good' ? '✅' : ins.type === 'warn' ? '⚠️' : '🔴'}</span>
                          <p style={{ fontSize: '13px', color: colors[1], margin: 0, lineHeight: '1.6' }}>{ins.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={s.card}>
                  <div style={s.cardTitle}>📌 Action items this week</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {opportunities.slice(0, 3).map((o, i) => (
                      <div key={i} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', display: 'flex', gap: '10px' }}>
                        <span style={{ color: '#059669', fontWeight: '700', flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ color: '#374151' }}>Write or update content targeting "<strong>{o.keyword}</strong>" — currently ranking #{Math.round(o.position)} in US with {o.impressions.toLocaleString()} impressions. {o.gap} positions to page 1.</span>
                      </div>
                    ))}
                    {behavior.rageClicks > 20 && (
                      <div style={{ background: '#FEF2F2', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', display: 'flex', gap: '10px' }}>
                        <span style={{ color: '#DC2626', fontWeight: '700', flexShrink: 0' }}>{(opportunities.slice(0, 3).length + 1)}.</span>
                        <span style={{ color: '#374151' }}>Review <strong>{behavior.rageClicks} rage clicks</strong> in Microsoft Clarity — watch session recordings on the pricing and product pages to identify broken interactions.</span>
                      </div>
                    )}
                    {topPages.filter(p => p.health === 'warning' || p.health === 'critical').slice(0, 2).map((p, i) => (
                      <div key={i} style={{ background: '#FFFBEB', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', display: 'flex', gap: '10px' }}>
                        <span style={{ color: '#D97706', fontWeight: '700', flexShrink: 0 }}>{opportunities.slice(0, 3).length + 2 + i}.</span>
                        <span style={{ color: '#374151' }}>Improve <strong>{p.page}</strong> — {p.engagementRate}% engagement rate is below benchmark. Review content relevance and page structure.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
