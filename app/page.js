'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard-data')
      .then(res => {
        if (!res.ok) throw new Error('API call failed');
        return res.json();
      })
      .then(apiData => {
        setData(apiData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load data. Please refresh.');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '1rem' }}>⏳</div>
      <p style={{ color: '#6B7280', fontSize: '16px' }}>Loading dashboard data...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '4rem', textAlign: 'center', background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '24px', marginBottom: '1rem' }}>❌</div>
      <p style={{ color: '#DC2626', fontSize: '16px' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
        Retry
      </button>
    </div>
  );

  if (!data) return null;

  const getHealthColor = (health) => {
    const colors = {
      excellent: { bg: '#E7F5EE', text: '#059669', border: '#10B981' },
      good: { bg: '#E0F2FE', text: '#0369A1', border: '#0EA5E9' },
      warning: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
      critical: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
    };
    return colors[health] || colors.good;
  };

  const kpis = data.kpis || {};
  const topPages = data.topPages || [];
  const lowPerformers = data.lowPerformers || [];
  const keywords = data.keywords || [];
  const opportunities = data.opportunities || [];
  const behavior = data.behavior || {};
  const trends = data.trends || {};
  const weeklyData = trends.weeklyData || [];

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid #E5E7EB' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', margin: '0 0 0.5rem', color: '#1F2937' }}>
            AIO website performance
          </h1>
          <p style={{ fontSize: '15px', color: '#6B7280', margin: 0 }}>
            Real-time monitoring • GA4 • Google Search Console • Microsoft Clarity
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '2px solid #F3F4F6', paddingBottom: '1rem' }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'pages', label: 'Pages', icon: '📄' },
            { id: 'keywords', label: 'Keywords', icon: '🔍' },
            { id: 'behavior', label: 'User behavior', icon: '👥' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#0EA5E9' : '#6B7280',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                borderBottom: activeTab === tab.id ? '3px solid #0EA5E9' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Sessions', value: (kpis.sessions?.current || 0).toLocaleString(), change: kpis.sessions?.change, icon: '👥' },
                { label: 'Users', value: (kpis.users?.current || 0).toLocaleString(), change: kpis.users?.change, icon: '🔗' },
                { label: 'Page views', value: (kpis.pageViews?.current || 0).toLocaleString(), change: kpis.pageViews?.change, icon: '📖' },
                { label: 'Engagement', value: `${kpis.avgEngagement?.current || 0}m`, change: kpis.avgEngagement?.change, icon: '⏱️' },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCard(idx)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: '#FFFFFF',
                    border: hoveredCard === idx ? '1px solid #0EA5E9' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.3s',
                    boxShadow: hoveredCard === idx ? '0 4px 12px rgba(14, 165, 233, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {kpi.label}
                      </p>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
                        {kpi.value}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', fontWeight: '600', color: parseFloat(kpi.change) >= 0 ? '#10B981' : '#DC2626' }}>
                        <span>{parseFloat(kpi.change) >= 0 ? '↑' : '↓'}</span>
                        <span>{Math.abs(kpi.change)}% vs last week</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '28px', opacity: 0.6 }}>{kpi.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.75rem', border: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 1.25rem', color: '#1F2937' }}>📊 Weekly sessions</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="sessions" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.75rem', border: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 1.25rem', color: '#1F2937' }}>📈 Engagement trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Pages */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>🏆 Best performing pages</h3>
              {topPages.length === 0 ? (
                <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>No page data available yet</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {topPages.map((page, idx) => {
                    const health = getHealthColor(page.health);
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '1.25rem',
                          background: '#F9FAFB',
                          borderRadius: '10px',
                          border: `1px solid ${health.border}`,
                          borderLeft: `4px solid ${health.border}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = health.bg}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 0.5rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>{page.page}</p>
                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px', color: '#6B7280' }}>
                            <span>📊 {(page.views || 0).toLocaleString()} views</span>
                            <span>⏱️ {page.engagement}m</span>
                            <span>↩️ {page.bounce}% bounce</span>
                            <span>CTR {page.ctr}%</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: (page.traffic || '').startsWith('+') ? '#10B981' : '#DC2626' }}>{page.traffic}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', background: health.bg, color: health.text, borderRadius: '6px' }}>
                            {(page.health || '').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGES TAB */}
        {activeTab === 'pages' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '2rem', border: '2px solid #EF4444' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#DC2626' }}>🚨 Pages requiring immediate action</h3>
              {lowPerformers.length === 0 ? (
                <p style={{ color: '#059669', background: '#FFFFFF', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>✅ No critical pages found. All pages performing well!</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {lowPerformers.map((page, idx) => (
                    <div key={idx} style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '10px', border: `1px solid ${page.status === 'critical' ? '#EF4444' : '#F59E0B'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 0.25rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>{page.page}</p>
                        <p style={{ margin: '0 0 0.5rem', color: '#6B7280', fontSize: '13px' }}>{page.issue}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px', color: '#6B7280' }}>
                          <span>{(page.views || 0).toLocaleString()} views</span>
                          <span style={{ color: '#DC2626', fontWeight: '600' }}>{page.bounce}% bounce</span>
                          <span>{page.ctr}% CTR</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', background: page.status === 'critical' ? '#FEE2E2' : '#FEF3C7', color: page.status === 'critical' ? '#DC2626' : '#B45309', borderRadius: '6px' }}>
                        {(page.status || '').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>All pages performance</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                      <th style={{ textAlign: 'left', padding: '1rem', color: '#6B7280', fontWeight: '600', fontSize: '13px' }}>Page</th>
                      <th style={{ textAlign: 'right', padding: '1rem', color: '#6B7280', fontWeight: '600', fontSize: '13px' }}>Views</th>
                      <th style={{ textAlign: 'right', padding: '1rem', color: '#6B7280', fontWeight: '600', fontSize: '13px' }}>Bounce</th>
                      <th style={{ textAlign: 'right', padding: '1rem', color: '#6B7280', fontWeight: '600', fontSize: '13px' }}>Engagement</th>
                      <th style={{ textAlign: 'right', padding: '1rem', color: '#6B7280', fontWeight: '600', fontSize: '13px' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((page, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '1rem', color: '#1F2937', fontSize: '14px' }}>{page.page}</td>
                        <td style={{ textAlign: 'right', padding: '1rem', color: '#1F2937', fontSize: '14px' }}>{(page.views || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: page.bounce > 50 ? '#FEE2E2' : '#E7F5EE', color: page.bounce > 50 ? '#DC2626' : '#059669' }}>
                            {page.bounce}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '1rem', color: '#1F2937', fontSize: '14px' }}>{page.engagement}m</td>
                        <td style={{ textAlign: 'right', padding: '1rem', color: (page.traffic || '').startsWith('+') ? '#10B981' : '#DC2626', fontWeight: '600', fontSize: '13px' }}>{page.traffic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* KEYWORDS TAB */}
        {activeTab === 'keywords' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>🏆 Top keywords by impressions</h3>
              {keywords.length === 0 ? (
                <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>No keyword data available yet</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {keywords.map((kw, idx) => (
                    <div
                      key={idx}
                      style={{ padding: '1.25rem', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#0EA5E9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>{kw.keyword}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px', color: '#6B7280' }}>
                          <span>📊 {(kw.impressions || 0).toLocaleString()} impressions</span>
                          <span>🖱️ {(kw.clicks || 0).toLocaleString()} clicks</span>
                          <span>📈 CTR {kw.ctr}%</span>
                          <span>📍 Position {kw.position}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 10px', background: kw.trend === 'up' ? '#E7F5EE' : '#FEE2E2', color: kw.trend === 'up' ? '#059669' : '#DC2626', borderRadius: '6px' }}>
                        {kw.change}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#E7F5EE', borderRadius: '12px', padding: '2rem', border: '2px solid #10B981' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#059669' }}>💡 Keywords to optimize (quick wins)</h3>
              {opportunities.length === 0 ? (
                <p style={{ color: '#059669', background: '#FFFFFF', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>No keyword opportunities detected yet</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {opportunities.map((opp, idx) => (
                    <div key={idx} style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 0.25rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>{opp.keyword}</p>
                        <p style={{ margin: '0 0 0.5rem', color: '#6B7280', fontSize: '13px' }}>{(opp.impressions || 0).toLocaleString()} monthly impressions • Currently at position {opp.position}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px', color: '#6B7280' }}>
                          <span>CTR {opp.ctr}%</span>
                          <span>Gap to top: {opp.gap} positions</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', background: opp.potential === 'high' ? '#E7F5EE' : '#FEF3C7', color: opp.potential === 'high' ? '#059669' : '#B45309', borderRadius: '6px' }}>
                        {opp.potential === 'high' ? '⭐ HIGH' : 'MEDIUM'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BEHAVIOR TAB */}
        {activeTab === 'behavior' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Rage clicks', value: behavior.rageClicks || 0, bg: '#FEE2E2', border: '#EF4444', color: '#DC2626', sub: 'Users frustrated this week' },
                { label: 'Dead clicks', value: behavior.deadClicks || 0, bg: '#FEF3C7', border: '#F59E0B', color: '#B45309', sub: 'Unclickable areas found' },
                { label: 'Error clicks', value: behavior.errorClicks || 0, bg: '#E0F2FE', border: '#0EA5E9', color: '#0369A1', sub: 'JS errors triggered' },
                { label: 'Frustration rate', value: `${behavior.frustrationRate || 0}%`, bg: '#F3E8FF', border: '#A855F7', color: '#7E22CE', sub: 'Of recorded sessions' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: item.bg, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${item.border}`, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: item.color, fontWeight: '600', textTransform: 'uppercase' }}>{item.label}</p>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: '700', color: item.color }}>{item.value}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{item.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Recorded sessions', value: (behavior.recordedSessions || 0).toLocaleString(), sub: 'This week' },
                { label: 'Avg session', value: behavior.avgSessionDuration || '0m', sub: 'Time on site' },
                { label: 'User feedback', value: behavior.feedbackSubmitted || 0, sub: 'Submissions collected' },
                { label: 'Frustrated sessions', value: behavior.frustratedSessions || 0, sub: `Out of ${(behavior.recordedSessions || 0).toLocaleString()}` },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>{item.label}</p>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>{item.value}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{item.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>Pages with highest frustration</h3>
              {(behavior.topFrustrationPages || []).length === 0 ? (
                <p style={{ color: '#059669', textAlign: 'center', padding: '2rem' }}>✅ No frustration signals detected</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {(behavior.topFrustrationPages || []).map((page, idx) => (
                    <div key={idx} style={{ padding: '1.25rem', background: page.severity === 'high' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)', borderRadius: '10px', borderLeft: `4px solid ${page.severity === 'high' ? '#EF4444' : '#F59E0B'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: '#1F2937', fontSize: '15px' }}>{page.page}</p>
                        <div style={{ display: 'flex', gap: '2rem', fontSize: '13px', color: '#6B7280' }}>
                          <span>😤 {page.frustrated} frustrated sessions</span>
                          <span>⚠️ {page.errorRate} error rate</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', background: page.severity === 'high' ? '#FEE2E2' : '#FEF3C7', color: page.severity === 'high' ? '#DC2626' : '#B45309', borderRadius: '6px' }}>
                        {(page.severity || '').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
