import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CEODashboardData {
  totalRevenue: number;
  pipelineValue: number;
  weightedForecast: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  activeDeals: number;
  revenueBySales: Array<{ salesName: string; revenue: number; dealsWon: number }>;
  topDoctors: Array<{ id: number; name: string; hospital: string; totalValue: number }>;
}

const CEODashboard: React.FC = () => {
  const [data, setData] = useState<CEODashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService.getCEODashboard()
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load CEO dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
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
        <h1 className="text-2xl font-bold text-slate-800">CEO Dashboard</h1>
        <p className="text-slate-500">Overview of sales performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.totalRevenue)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Pipeline Value</div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.pipelineValue)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Weighted Forecast</div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.weightedForecast)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Conversion Rate</div>
          <div className="text-2xl font-bold text-slate-800">{data.conversionRate}%</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Revenue by Sales</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueBySales} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="salesName" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {data.revenueBySales.map((_, index) => (
                    <Cell key={index} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data.revenueBySales.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.salesName}</span>
                <span className="font-medium text-slate-700">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Doctors */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Doctors</h2>
          <div className="space-y-3">
            {data.topDoctors.map((doctor) => (
              <div key={doctor.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last-border-b-0">
                <div>
                  <div className="font-medium text-slate-700">{doctor.name}</div>
                  <div className="text-sm text-slate-500">{doctor.hospital}</div>
                </div>
                <div className="font-semibold text-slate-700">{formatCurrency(doctor.totalValue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deal Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="text-sm text-blue-600 font-medium">Total Deals</div>
          <div className="text-3xl font-bold text-blue-700">{data.totalDeals}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="text-sm text-green-600 font-medium">Won</div>
          <div className="text-3xl font-bold text-green-700">{data.wonDeals}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <div className="text-sm text-yellow-600 font-medium">Active</div>
          <div className="text-3xl font-bold text-yellow-700">{data.activeDeals}</div>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;