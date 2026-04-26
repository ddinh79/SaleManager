import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';

interface ManagerDashboardData {
  teamSize: number;
  teamPipelineValue: number;
  teamWeightedForecast: number;
  dealsClosingThisMonth: number;
  inactiveSalesMembers: Array<{
    id: number;
    name: string;
    lastActivity: string;
    daysInactive: number;
  }>;
  teamPerformance: Array<{
    salesId: number;
    salesName: string;
    dealsWon: number;
    revenue: number;
    tasksCompleted: number;
  }>;
}

const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getManagerDashboard()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load manager dashboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">No data available</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
        <p className="text-slate-500">Team performance overview</p>
      </div>

      {/* Team KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Team Size</div>
          <div className="text-2xl font-bold text-slate-800">{data.teamSize}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Team Pipeline</div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.teamPipelineValue)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Weighted Forecast</div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.teamWeightedForecast)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Closing This Month</div>
          <div className="text-2xl font-bold text-slate-800">{data.dealsClosingThisMonth}</div>
        </div>
      </div>

      {/* Inactive Sales Members */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Inactive Sales Members (5+ days)</h2>
        {data.inactiveSalesMembers.length === 0 ? (
          <div className="text-slate-500">No inactive members</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 text-sm font-medium text-slate-600">Name</th>
                <th className="text-left py-3 text-sm font-medium text-slate-600">Last Activity</th>
                <th className="text-left py-3 text-sm font-medium text-slate-600">Days Inactive</th>
              </tr>
            </thead>
            <tbody>
              {data.inactiveSalesMembers.map((member) => (
                <tr key={member.id} className="border-b border-slate-100">
                  <td className="py-3 text-slate-700">{member.name}</td>
                  <td className="py-3 text-slate-700">{new Date(member.lastActivity).toLocaleDateString()}</td>
                  <td className="py-3 text-slate-700">{member.daysInactive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Team Performance</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 text-sm font-medium text-slate-600">Sales Person</th>
              <th className="text-right py-3 text-sm font-medium text-slate-600">Deals Won</th>
              <th className="text-right py-3 text-sm font-medium text-slate-600">Revenue</th>
              <th className="text-right py-3 text-sm font-medium text-slate-600">Tasks Completed</th>
            </tr>
          </thead>
          <tbody>
            {data.teamPerformance.map((item) => (
              <tr key={item.salesId} className="border-b border-slate-100">
                <td className="py-3 text-slate-700">{item.salesName}</td>
                <td className="py-3 text-right text-slate-700">{item.dealsWon}</td>
                <td className="py-3 text-right text-slate-700">{formatCurrency(item.revenue)}</td>
                <td className="py-3 text-right text-slate-700">{item.tasksCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerDashboard;