import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Activity, Phone, MessageSquare, Users } from 'lucide-react';

const mockActivities = [
  { id: 1, type: 'call', doctor: 'Dr. Nguyen Van A', content: 'Discussed new product', time: '2 hours ago' },
  { id: 2, type: 'meeting', doctor: 'Dr. Tran Thi B', content: 'Product demo at hospital', time: '5 hours ago' },
  { id: 3, type: 'call', doctor: 'Dr. Le Van C', content: 'Follow-up on order', time: '1 day ago' },
];

const typeIcons = {
  call: <Phone className="w-4 h-4 text-green-600" />,
  meeting: <Users className="w-4 h-4 text-blue-600" />,
  message: <MessageSquare className="w-4 h-4 text-purple-600" />,
};

export function Activities() {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Activities</h1>
        <p className="text-slate-500">
          {doctorId ? `Filtered by doctor: ${doctorId}` : 'All activity timeline'}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {mockActivities.map(activity => (
            <div key={activity.id} className="relative flex gap-4">
              {/* Icon */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                {typeIcons[activity.type as keyof typeof typeIcons] || <Activity className="w-4 h-4" />}
              </div>

              {/* Content */}
              <Card className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800">{activity.doctor}</span>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
                <p className="text-sm text-slate-600">{activity.content}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}