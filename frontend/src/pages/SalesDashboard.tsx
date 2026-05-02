import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';

const SalesDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService.getSalesDashboard()
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load sales dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return <div className="p-6">No data available</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
        <p className="text-slate-500">Your sales performance overview</p>
      </div>

      {/* My Tasks Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="text-sm text-blue-600 font-medium">Tasks Today</div>
          <div className="text-3xl font-bold text-blue-700">{data.tasksToday}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <div className="text-sm text-red-600 font-medium">Overdue Tasks</div>
          <div className="text-3xl font-bold text-red-700">{data.tasksOverdue}</div>
        </div>
      </div>

      {/* My Deal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">My Deals</div>
          <div className="text-2xl font-bold">{data.myDeals}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Pipeline Value</div>
          <div className="text-2xl font-bold">{formatCurrency(data.myPipelineValue)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Weighted Forecast</div>
          <div className="text-2xl font-bold">{formatCurrency(data.myWeightedForecast)}</div>
        </div>
      </div>

      {/* My Deals Detail */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">My Active Deals</h2>
        {data.myDealDetails && data.myDealDetails.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Doctor</th>
                <th className="text-left py-2">Hospital</th>
                <th className="text-right py-2">Value</th>
                <th className="text-left py-2">Stage</th>
                <th className="text-right py-2">Expected Close</th>
              </tr>
            </thead>
            <tbody>
              {data.myDealDetails.map((deal: any) => (
                <tr key={deal.dealId} className="border-b">
                  <td className="py-2">{deal.doctorName}</td>
                  <td className="py-2">{deal.hospitalName}</td>
                  <td className="py-2 text-right">{formatCurrency(deal.totalValue)}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      deal.stage === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      deal.stage === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="py-2 text-right">{new Date(deal.expectedCloseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">No active deals</div>
        )}
      </div>

      {/* KPI Progress */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">KPI Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Revenue Progress</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.kpiProgress.currentRevenue)} / {formatCurrency(data.kpiProgress.targetRevenue)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-blue-600 h-2 rounded"
                style={{ width: `${Math.min(100, (data.kpiProgress.currentRevenue / data.kpiProgress.targetRevenue) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Deals Won</span>
              <span className="text-sm font-medium">
                {data.kpiProgress.wonDeals} / {data.kpiProgress.targetDeals}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-green-600 h-2 rounded"
                style={{ width: `${Math.min(100, (data.kpiProgress.wonDeals / data.kpiProgress.targetDeals) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
        {data.recentActivities.length === 0 ? (
          <div className="text-gray-500">No recent activities</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Doctor</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivities.map((activity: any) => (
                <tr key={activity.id} className="border-b">
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.type === 'CALL' ? 'bg-blue-100 text-blue-700' :
                      activity.type === 'MEETING' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="py-2">{activity.doctorName}</td>
                  <td className="py-2">{new Date(activity.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
