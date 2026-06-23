'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const demoData = {
      kpis: {
        sessions: { current: 8342, previous: 7856, change: 6.2, trend: 'up' },
        users: { current: 5124, previous: 4890, change: 4.8, trend: 'up' },
        pageViews: { current: 24156, previous: 22340, change: 8.1, trend: 'up' },
        avgEngagement: { current: 3.2, previous: 2.9, change: 10.3, trend: 'up' },
      },
      topPages: [
        { page: '/platform/marketing', views: 3240, engagement: 3.8, bounce: 32, traffic: '+12%', health: 'excellent', ctr: 8.2 },
        { page: '/platform/order-and-pay', views: 2890, engagement: 3.5, bounce: 38, traffic: '-4%', health: 'good', ctr: 7.1 },
        { page: '/pricing', views: 2450, engagement: 2.1, bounce: 58, traffic: '+8%', health: 'warning', ctr: 4.2 },
        { page: '/features/inventory', views: 1980, engagement: 3.9, bounce: 24, traffic: '+15%', health: 'excellent', ctr: 8.9 },
        { page: '/blog/restaurant-automation', views: 1850, engagement: 4.2, bounce: 18, traffic: '+22%', health: 'excellent', ctr: 9.5 },
      ],
      lowPerformers: [
        { page: '/integrations/shopify', views: 245, bounce: 72, ctr: 1.2, status: 'critical', issue: 'Extremely high bounce - needs redesign' },
        { page: '/case-studies/old', views: 180, bounce: 68, ctr: 1.5, status: 'critical', issue: 'Low traffic - update content strategy' },
        { page: '/blog/seo-tips-2024', views: 320, bounce: 65, ctr: 2.1, status: 'warning', issue: 'Above benchmark bounce rate' },
      ],
      keywords: [
        { keyword: 'restaurant management software', impressions: 8420, clicks: 1240, ctr: 14.7, position: 3.2, change: '+2', trend: 'up', difficulty: 'high' },
        { keyword: 'restaurant pos system', impressions: 6850, clicks: 890, ctr: 13.0, position: 4.1, change: '-1', trend: 'down', difficulty: 'high' },
        { keyword: 'restaurant inventory management', impressions: 5120, clicks: 650, ctr: 12.7, position: 2.8, change: '+3', trend: 'up', difficulty: 'medium' },
        { keyword: 'staff scheduling software', impressions: 4320, clicks: 380, ctr: 8.8, position: 5.2, change: '-2', trend: 'down', difficulty: 'high' },
        { keyword: 'restaurant analytics platform', impressions: 3890, clicks: 320, ctr: 8.2, position: 6.5, change: '+1', trend: 'up', difficulty: 'medium' },
      ],
      opportunities: [
        { keyword: 'restaurant marketing tools', impressions: 2100, clicks: 85, ctr: 4.0, position: 12.5, potential: 'high', gap: 8 },
        { keyword: 'restaurant staff management', impressions: 1850, clicks: 62, ctr: 3.4, position: 14.2, potential: 'high', gap: 10 },
        { keyword: 'restaurant operational efficiency', impressions: 1420, clicks: 35, ctr: 2.5, position: 18.5, potential: 'medium', gap: 14 },
      ],
      behavior: {
        sessions: 8342,
        avgSessionDuration: '3m 42s',
        rageClicks: 142,
        deadClicks: 89,
        errorClicks: 45,
        recordedSessions: 4120,
        frustratedSessions: 312,
        feedbackSubmitted: 28,
        frustrationRate: 7.6,
        topFrustrationPages: [
          { page: '/pricing', frustrated: 45, errorRate: '12%', severity: 'high' },
          { page: '/platform', frustrated: 38, errorRate: '8%', severity: 'medium' },
          { page: '/integrations', frustrated: 25, errorRate: '5%', severity: 'medium' },
        ],
      },
      trends: {
        thisWeek: 8342,
        lastWeek: 7856,
        weekChange: 6.2,
        weeklyData: [
          { day: 'Mon', sessions: 1240, users: 820, engagement: 3.1, bounce: 42 },
          { day: 'Tue', sessions: 1180, users: 790, engagement: 3.0, bounce: 44 },
          { day: 'Wed', sessions: 1420, users: 950, engagement: 3.5, bounce: 38 },
          { day: 'Thu', sessions: 1350, users: 880, engagement: 3.3, bounce: 40 },
          { day: 'Fri', sessions: 1520, users: 1020, engagement: 3.8, bounce: 35 },
          { day: 'Sat', sessions: 980, users: 620, engagement: 2.8, bounce: 48 },
          { day: 'Sun', sessions: 670, users: 464, engagement: 2.2, bounce: 52 },
        ],
      },
    };
    setData(demoData);
    setLoading(false);
  }, []);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', background: '#ffffff', minHeight: '100vh' }}>Loading dashboard...</div>;

  const getHealthColor = (health) => {
    const colors = {
      excellent: { bg: '#E7F5EE', text: '#059669', border: '#10B981' },
      good: { bg: '#E0F2FE', text: '#0369A1', border: '#0EA5E9' },
      warning: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
      critical: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
    };
    return colors[health] || colors.good;
  };

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
                background: activeTab === tab.id ? 'transparent' : 'transparent',
                color: activeTab === tab.id ? '#0EA5E9' : '#6B7280',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                borderBottom: activeTab === tab.id ? '3px solid #0EA5E9' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#1F2937'}
              onMouseLeave={(e) => e.target.style.color = activeTab === tab.id ? '#0EA5E9' : '#6B7280'}
            >
              <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Sessions', value: data.kpis.sessions.current.toLocaleString(), change: data.kpis.sessions.change, icon: '👥' },
                { label: 'Users', value: data.kpis.users.current.toLocaleString(), change: data.kpis.users.change, icon: '🔗' },
                { label: 'Page views', value: data.kpis.pageViews.current.toLocaleString(), change: data.kpis.pageViews.change, icon: '📖' },
                { label: 'Engagement', value: `${data.kpis.avgEngagement.current.toFixed(1)}m`, change: data.kpis.avgEngagement.change, icon: '⏱️' },
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', fontWeight: '600', color: '#10B981' }}>
                        <span>↑</span>
                        <span>{kpi.change}% vs last week</span>
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
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 1.25rem', color: '#1F2937' }}>
                  📊 Weekly sessions
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.trends.weeklyData}>
                    <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="sessions" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.75rem', border: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 1.25rem', color: '#1F2937' }}>
                  📈 Engagement trend
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.trends.weeklyData}>
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
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>
                🏆 Best performing pages
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.topPages.map((page, idx) => {
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
                        <p style={{ margin: '0 0 0.5rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>
                          {page.page}
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px', color: '#6B7280' }}>
                          <span>📊 {page.views.toLocaleString()} views</span>
                          <span>⏱️ {page.engagement.toFixed(1)}m</span>
                          <span>↩️ {page.bounce}% bounce</span>
                          <span>CTR {page.ctr}%</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>
                          {page.traffic}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', background: health.bg, color: health.text, borderRadius: '6px' }}>
                          {page.health.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Critical Issues */}
            <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '2rem', border: '2px solid #EF4444' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#DC2626' }}>
                🚨 Pages requiring immediate action
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.lowPerformers.map((page, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: `1px solid ${page.status === 'critical' ? '#EF4444' : '#F59E0B'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.25rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>
                        {page.page}
                      </p>
                      <p style={{ margin: '0 0 0.5rem', color: '#6B7280', fontSize: '13px' }}>
                        {page.issue}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px', color: '#6B7280' }}>
                        <span>{page.views} views</span>
                        <span style={{ color: '#DC2626', fontWeight: '600' }}>{page.bounce}% bounce</span>
                        <span>{page.ctr}% CTR</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', background: page.status === 'critical' ? '#FEE2E2' : '#FEF3C7', color: page.status === 'critical' ? '#DC2626' : '#B45309', borderRadius: '6px' }}>
                      {page.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Pages Table */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>
                All pages performance
              </h3>
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
                    {data.topPages.map((page, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '1rem', color: '#1F2937', fontSize: '14px' }}>{page.page}</td>
                        <td style={{ textAlign: 'right', padding: '1rem', color: '#1F2937', fontSize: '14px' }}>{page.views.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '1rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: page.bounce > 50 ? '#FEE2E2' : '#E7F5EE', color: page.bounce > 50 ? '#DC2626' : '#059669' }}>
                            {page.bounce}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '1rem', color: '#1F2937', fontSize: '14px' }}>{page.engagement.toFixed(1)}m</td>
                        <td style={{ textAlign: 'right', padding: '1rem', color: '#10B981', fontWeight: '600', fontSize: '13px' }}>
                          {page.traffic}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Top Keywords */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>
                🏆 Top keywords by impressions
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.keywords.map((kw, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      background: '#F9FAFB',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#0EA5E9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.5rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>
                        {kw.keyword}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px', color: '#6B7280' }}>
                        <span>📊 {kw.impressions.toLocaleString()} impressions</span>
                        <span>🖱️ {kw.clicks.toLocaleString()} clicks</span>
                        <span>📈 CTR {kw.ctr.toFixed(1)}%</span>
                        <span>📍 Position {kw.position.toFixed(1)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 10px', background: kw.trend === 'up' ? '#E7F5EE' : '#FEE2E2', color: kw.trend === 'up' ? '#059669' : '#DC2626', borderRadius: '6px' }}>
                        {kw.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div style={{ background: '#E7F5EE', borderRadius: '12px', padding: '2rem', border: '2px solid #10B981' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#059669' }}>
                💡 Keywords to optimize (quick wins)
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.opportunities.map((opp, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #10B981',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.25rem', color: '#1F2937', fontWeight: '600', fontSize: '15px' }}>
                        {opp.keyword}
                      </p>
                      <p style={{ margin: '0 0 0.5rem', color: '#6B7280', fontSize: '13px' }}>
                        {opp.impressions.toLocaleString()} monthly impressions • Currently at position {opp.position.toFixed(1)}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '12px', color: '#6B7280' }}>
                        <span>CTR {opp.ctr.toFixed(1)}%</span>
                        <span>Gap to top: {opp.gap} positions</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', background: opp.potential === 'high' ? '#E7F5EE' : '#FEF3C7', color: opp.potential === 'high' ? '#059669' : '#B45309', borderRadius: '6px' }}>
                      {opp.potential === 'high' ? '⭐ HIGH' : 'MEDIUM'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Frustration Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EF4444', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#DC2626', fontWeight: '600', textTransform: 'uppercase' }}>Rage clicks</p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: '700', color: '#DC2626' }}>{data.behavior.rageClicks}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Users frustrated this week</p>
              </div>

              <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '1.5rem', border: '1px solid #F59E0B', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#B45309', fontWeight: '600', textTransform: 'uppercase' }}>Dead clicks</p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: '700', color: '#B45309' }}>{data.behavior.deadClicks}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Unclickable areas found</p>
              </div>

              <div style={{ background: '#E0F2FE', borderRadius: '12px', padding: '1.5rem', border: '1px solid #0EA5E9', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#0369A1', fontWeight: '600', textTransform: 'uppercase' }}>Error clicks</p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: '700', color: '#0369A1' }}>{data.behavior.errorClicks}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>JS errors triggered</p>
              </div>

              <div style={{ background: '#F3E8FF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #A855F7', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#7E22CE', fontWeight: '600', textTransform: 'uppercase' }}>Frustration rate</p>
                <p style={{ margin: '0 0 0.5rem', fontSize: '32px', fontWeight: '700', color: '#7E22CE' }}>{data.behavior.frustrationRate}%</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Of recorded sessions</p>
              </div>
            </div>

            {/* Session Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Recorded sessions</p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>{data.behavior.recordedSessions.toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>This week</p>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Avg session</p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>{data.behavior.avgSessionDuration}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Time on site</p>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>User feedback</p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>{data.behavior.feedbackSubmitted}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Submissions collected</p>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Frustrated sessions</p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>{data.behavior.frustratedSessions}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Out of {data.behavior.recordedSessions.toLocaleString()}</p>
              </div>
            </div>

            {/* Problem Pages */}
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '0 0 1.5rem', color: '#1F2937' }}>
                Pages with highest frustration
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.behavior.topFrustrationPages.map((page, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      background: page.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                      borderRadius: '10px',
                      borderLeft: `4px solid ${page.severity === 'high' ? '#EF4444' : '#F59E0B'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: '#1F2937', fontSize: '15px' }}>
                        {page.page}
                      </p>
                      <div style={{ display: 'flex', gap: '2rem', fontSize: '13px', color: '#6B7280' }}>
                        <span>😤 {page.frustrated} frustrated sessions</span>
                        <span>⚠️ {page.errorRate} error rate</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', background: page.severity === 'high' ? '#FEE2E2' : '#FEF3C7', color: page.severity === 'high' ? '#DC2626' : '#B45309', borderRadius: '6px' }}>
                      {page.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}