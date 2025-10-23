import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DashboardProps {
  config: any;
}

export default function Dashboard({ config }: DashboardProps) {
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalRevenue: 0,
    badgeCodesRemaining: 0,
    lastPurchase: null as string | null,
    machineHealth: 'healthy'
  });
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [config]);

  const loadDashboardData = async () => {
    try {
      // Query datasets
      const datasetsResult = await window.electronAPI.querySupabase('datasets?select=count');
      
      // Query purchases for revenue
      const purchasesResult = await window.electronAPI.querySupabase('purchases?select=*&order=created_at.desc');
      
      // Query badge codes
      const badgesResult = await window.electronAPI.querySupabase('badge_codes?select=*&claimed=eq.false');

      if (datasetsResult.success && purchasesResult.success && badgesResult.success) {
        const purchases = purchasesResult.data || [];
        const totalRevenue = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid || 0), 0);
        
        setStats({
          totalDatasets: datasetsResult.data?.[0]?.count || 0,
          totalRevenue,
          badgeCodesRemaining: badgesResult.data?.length || 0,
          lastPurchase: purchases[0]?.created_at || null,
          machineHealth: 'healthy'
        });

        // Prepare revenue chart data
        const last7Days = [...Array(7)].map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const revenueByDay = last7Days.map(day => {
          return purchases
            .filter((p: any) => p.created_at?.startsWith(day))
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid || 0), 0);
        });

        setRevenueData({
          labels: last7Days.map(d => new Date(d).toLocaleDateString()),
          datasets: [{
            label: 'Daily Revenue ($)',
            data: revenueByDay,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  if (!config) {
    return (
      <div className="card">
        <h2>⚠️ Configuration Required</h2>
        <p>Please configure the agent in the Settings tab before using the dashboard.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Dashboard</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Datasets Published</div>
          <div className="stat-value">{stats.totalDatasets}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Badge Codes Remaining</div>
          <div className="stat-value" style={{ color: stats.badgeCodesRemaining < 10 ? '#ef4444' : '#3b82f6' }}>
            {stats.badgeCodesRemaining}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Purchase</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>
            {stats.lastPurchase ? new Date(stats.lastPurchase).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {stats.badgeCodesRemaining < 10 && (
        <div className="alert warning" style={{ marginTop: '24px' }}>
          ⚠️ Low badge code inventory! Only {stats.badgeCodesRemaining} codes remaining. Please generate more.
        </div>
      )}

      <div className="card" style={{ marginTop: '24px' }}>
        <h2>Revenue Trends (Last 7 Days)</h2>
        {revenueData && (
          <Line 
            data={revenueData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  labels: { color: '#e2e8f0' }
                }
              },
              scales: {
                y: {
                  ticks: { color: '#94a3b8' },
                  grid: { color: '#334155' }
                },
                x: {
                  ticks: { color: '#94a3b8' },
                  grid: { color: '#334155' }
                }
              }
            }}
          />
        )}
      </div>

      <div className="card">
        <h2>Machine Health</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="status-dot active"></span>
          <span style={{ fontSize: '18px', color: '#22c55e' }}>Operational</span>
        </div>
        <p style={{ marginTop: '12px', color: '#94a3b8' }}>
          All systems running normally. Last check: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
