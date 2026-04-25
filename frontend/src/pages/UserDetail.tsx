import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';
import { RoleBadge } from '../components/common/RoleBadge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PerformanceCard } from '../components/common/PerformanceCard';
import api from '../services/api';
import { KpiSummary } from '../types/kpi';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'kpi' | 'doctors' | 'activities'>('profile');

  useEffect(() => {
    if (id) loadUserData(id);
  }, [id]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const [userData, kpiData] = await Promise.all([
        userService.getById(userId),
        api.get<KpiSummary>(`/kpi/users/${userId}/summary`).then(res => res.data).catch(() => null),
      ]);
      setUser(userData);
      setKpi(kpiData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">User not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
        </div>
        <Button variant="secondary" onClick={() => {}}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center pb-6 border-b border-gray-200">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
                {(user as any).avatarUrl ? (
                  <img src={(user as any).avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-medium text-gray-500">{user.fullName[0]}</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{user.fullName}</h2>
              <div className="mt-2">
                <RoleBadge role={user.role} size="md" />
              </div>
              <p className="text-sm text-gray-500 mt-2">{user.email}</p>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              {(user as any).phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {(user as any).phone}
                </div>
              )}
              {user.managerName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  Manager: {user.managerName}
                </div>
              )}
            </div>
          </Card>

          {kpi && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PerformanceCard title="Calls" value={kpi.totalCalls} subtitle="Last 30 days" kpi={kpi} metric="calls" />
              <PerformanceCard title="Meetings" value={kpi.totalMeetings} subtitle="Last 30 days" kpi={kpi} metric="meetings" />
              <PerformanceCard title="Revenue" value={`$${kpi.totalRevenue.toLocaleString()}`} subtitle="Last 30 days" kpi={kpi} metric="revenue" />
              <PerformanceCard title="Conversion" value={`${kpi.conversionRate}%`} subtitle={`${kpi.wonDeals}/${kpi.totalDeals} deals`} kpi={kpi} metric="conversion" />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex border-b border-gray-200 mb-4">
              {(['profile', 'kpi', 'doctors', 'activities'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${user.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kpi' && kpi && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Overview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.totalCalls}</p>
                      <p className="text-sm text-gray-500">Total Calls</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.totalMeetings}</p>
                      <p className="text-sm text-gray-500">Total Meetings</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.totalDeals}</p>
                      <p className="text-sm text-gray-500">Total Deals</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.wonDeals}</p>
                      <p className="text-sm text-gray-500">Won Deals</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600">Won</p>
                    <p className="text-3xl font-bold text-green-700">{kpi.wonDeals}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">Lost</p>
                    <p className="text-3xl font-bold text-red-700">{kpi.lostDeals}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Activity Score</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.activityScore}</p>
                  <p className="text-xs text-gray-400 mt-1">(calls × 1) + (meetings × 3) + (won × 5)</p>
                </div>
              </div>
            )}

            {activeTab === 'kpi' && !kpi && (
              <p className="text-gray-500">No KPI data available</p>
            )}

            {activeTab === 'doctors' && (
              <p className="text-gray-500">Assigned doctors will be shown here</p>
            )}

            {activeTab === 'activities' && (
              <p className="text-gray-500">Activity history will be shown here</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}