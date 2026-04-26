import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';

interface CEODashboardData {
  totalRevenue: number;
  pipelineValue: number;
  weightedForecast: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  activeDeals: number;
  revenueBySales: Array<{ salesName: string; revenue: number }>;
  topDoctors: Array<{ id: number; name: string; hospital: string; totalValue: number }>;
}

const CEODashboard: React.FC = () => {
  const [data, setData] = useState<CEODashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getCEODashboard()
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load CEO dashboard:', err);
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
        {/* Revenue by Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Revenue by Sales</h2>
          <div className="space-y-3">
            {data.revenueBySales.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm text-slate-700 truncate">{item.salesName}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min((item.revenue / Math.max(...data.revenueBySales.map(i => i.revenue))) * 100, 100)}%` }}
                  />
                </div>
                <div className="w-24 text-sm font-medium text-slate-700 text-right">
                  {formatCurrency(item.revenue)}
                </div>
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