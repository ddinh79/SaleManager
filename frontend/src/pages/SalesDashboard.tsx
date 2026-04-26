import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';

const SalesDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSalesDashboard().then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
      
      {/* My Deal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">My Deals</div>
          <div className="text-2xl font-bold">{data.myDeals}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Pipeline Value</div>
          <div className="text-2xl font-bold">{data.myPipelineValue.toLocaleString()}đ</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Weighted Forecast</div>
          <div className="text-2xl font-bold">{data.myWeightedForecast.toLocaleString()}đ</div>
        </div>
      </div>

      {/* KPI Progress */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">KPI Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Revenue Progress</span>
              <span className="text-sm font-medium">
                {data.kpiProgress.currentRevenue.toLocaleString()}đ / {data.kpiProgress.targetRevenue.toLocaleString()}đ
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
