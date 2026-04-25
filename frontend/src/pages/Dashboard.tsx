import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const stats = [
  { label: 'Total Doctors', value: '156', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { label: 'Monthly Revenue', value: '$45,230', icon: DollarSign, color: 'text-green-600 bg-green-100' },
  { label: 'Growth Rate', value: '+12.5%', icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
  { label: 'Active Deals', value: '24', icon: Activity, color: 'text-orange-600 bg-orange-100' },
];

const recentActivities = [
  { id: 1, text: 'Dr. Nguyen Van A updated prescription data', time: '5 minutes ago' },
  { id: 2, text: 'New hospital added: City General Hospital', time: '1 hour ago' },
  { id: 3, text: 'Meeting scheduled with Dr. Tran Thi B', time: '2 hours ago' },
  { id: 4, text: 'Sales report submitted for Q1', time: '3 hours ago' },
];

const dealsClosing = [
  { id: 1, doctor: 'Dr. Le Van C', specialty: 'Cardiology', hospital: 'Heart Center', amount: '$5,000' },
  { id: 2, doctor: 'Dr. Pham Thi D', specialty: 'Orthopedics', hospital: 'Bone & Joint', amount: '$3,500' },
  { id: 3, doctor: 'Dr. Hoang Van E', specialty: 'Neurology', hospital: 'Brain Institute', amount: '$4,200' },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Access to Users */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Team Members</h3>
            <p className="text-sm text-slate-500">Manage your sales team and view performance</p>
          </div>
          <Button onClick={() => navigate('/users')}>
            <Users className="w-4 h-4 mr-2" />
            View Users
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm text-slate-700">{activity.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Deals Closing Soon */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Deals Closing Soon</h3>
          <div className="space-y-3">
            {dealsClosing.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">{deal.doctor}</p>
                  <p className="text-sm text-slate-500">{deal.specialty} • {deal.hospital}</p>
                </div>
                <span className="font-semibold text-green-600">{deal.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};