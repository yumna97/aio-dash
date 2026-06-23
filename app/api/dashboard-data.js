export async function GET(req) {
  const demoData = {
    kpis: {
      sessions: { current: 8342, previous: 7856, change: 6.2 },
      users: { current: 5124, previous: 4890, change: 4.8 },
      pageViews: { current: 24156, previous: 22340, change: 8.1 },
      avgEngagement: { current: 3.2, previous: 2.9, change: 10.3 },
    },
    topPages: [
      { page: '/platform/marketing', views: 3240, engagement: 3.8, bounce: 32, traffic: '+12%', health: 'good' },
      { page: '/platform/order-and-pay', views: 2890, engagement: 3.5, bounce: 38, traffic: '-4%', health: 'good' },
      { page: '/pricing', views: 2450, engagement: 2.1, bounce: 58, traffic: '+8%', health: 'warning' },
      { page: '/features/inventory', views: 1980, engagement: 3.9, bounce: 24, traffic: '+15%', health: 'good' },
      { page: '/blog/restaurant-automation', views: 1850, engagement: 4.2, bounce: 18, traffic: '+22%', health: 'excellent' },
    ],
    lowPerformers: [
      { page: '/integrations/shopify', views: 245, bounce: 72, ctr: 1.2, status: 'critical', issue: 'Extremely high bounce rate' },
      { page: '/case-studies/old', views: 180, bounce: 68, ctr: 1.5, status: 'critical', issue: 'Low traffic, high bounce' },
      { page: '/blog/seo-tips-2024', views: 320, bounce: 65, ctr: 2.1, status: 'warning', issue: 'Above benchmark bounce' },
    ],
    keywords: [
      { keyword: 'restaurant management software', impressions: 8420, clicks: 1240, ctr: 14.7, position: 3.2, change: '+2', trend: 'up' },
      { keyword: 'restaurant pos system', impressions: 6850, clicks: 890, ctr: 13.0, position: 4.1, change: '-1', trend: 'down' },
      { keyword: 'restaurant inventory management', impressions: 5120, clicks: 650, ctr: 12.7, position: 2.8, change: '+3', trend: 'up' },
      { keyword: 'staff scheduling software', impressions: 4320, clicks: 380, ctr: 8.8, position: 5.2, change: '-2', trend: 'down' },
      { keyword: 'restaurant analytics platform', impressions: 3890, clicks: 320, ctr: 8.2, position: 6.5, change: '+1', trend: 'up' },
    ],
    opportunities: [
      { keyword: 'restaurant marketing tools', impressions: 2100, clicks: 85, ctr: 4.0, position: 12.5, potential: 'high', priority: 'urgent' },
      { keyword: 'restaurant staff management', impressions: 1850, clicks: 62, ctr: 3.4, position: 14.2, potential: 'high', priority: 'urgent' },
      { keyword: 'restaurant operational efficiency', impressions: 1420, clicks: 35, ctr: 2.5, position: 18.5, potential: 'medium', priority: 'normal' },
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
        { day: 'Mon', sessions: 1240, users: 820, engagement: 3.1 },
        { day: 'Tue', sessions: 1180, users: 790, engagement: 3.0 },
        { day: 'Wed', sessions: 1420, users: 950, engagement: 3.5 },
        { day: 'Thu', sessions: 1350, users: 880, engagement: 3.3 },
        { day: 'Fri', sessions: 1520, users: 1020, engagement: 3.8 },
        { day: 'Sat', sessions: 980, users: 620, engagement: 2.8 },
        { day: 'Sun', sessions: 670, users: 464, engagement: 2.2 },
      ],
    },
  };

  return Response.json(demoData);
}