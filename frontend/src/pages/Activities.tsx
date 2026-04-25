import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Phone, MessageSquare, Users, Activity as ActivityIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';
import { doctorService } from '../services/doctorService';

type ActivityType = 'CALL' | 'MESSAGE' | 'MEETING' | 'DEMO' | 'SAMPLE_SENT';

const typeIcons: Record<ActivityType, React.ReactNode> = {
  CALL: <Phone className="w-4 h-4 text-green-600" />,
  MESSAGE: <MessageSquare className="w-4 h-4 text-purple-600" />,
  MEETING: <Users className="w-4 h-4 text-blue-600" />,
  DEMO: <ActivityIcon className="w-4 h-4 text-orange-600" />,
  SAMPLE_SENT: <ActivityIcon className="w-4 h-4 text-gray-600" />,
};

const gpsStatusColors: Record<string, string> = {
  VALID: 'bg-green-100 text-green-700',
  SUSPICIOUS: 'bg-yellow-100 text-yellow-700',
  MISSING: 'bg-gray-100 text-gray-500',
};

const gpsStatusLabels: Record<string, string> = {
  VALID: 'Valid',
  SUSPICIOUS: 'Suspicious',
  MISSING: 'Missing',
};

type GroupedActivities = {
  today: any[],
  yesterday: any[],
  dates: Record<string, any[]>,
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatDateHeader = (dateKey: string) => {
  return new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function Activities() {
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get('doctorId');
  const {
    activities,
    selectedDoctorId,
    isLoading,
    quickAddOpen,
    setSelectedDoctor,
    setQuickAddOpen,
    fetchTimeline,
    createActivity,
  } = useActivityStore();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'CALL' as ActivityType,
    content: '',
    result: '',
    nextFollowUpAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    doctorService.getAssignedDoctors().then(setDoctors).catch(console.error);
  }, []);

  useEffect(() => {
    if (doctorIdFromUrl) {
      setSelectedDoctor(doctorIdFromUrl);
    }
  }, [doctorIdFromUrl, setSelectedDoctor]);

  useEffect(() => {
    fetchTimeline(selectedDoctorId || undefined);
  }, [selectedDoctorId, fetchTimeline]);

  const groupedActivities = useMemo((): GroupedActivities => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const result: GroupedActivities = { today: [], yesterday: [], dates: {} };

    activities.forEach((activity: any) => {
      const activityDate = new Date(activity.createdAt);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === today.getTime()) {
        result.today.push(activity);
      } else if (activityDate.getTime() === yesterday.getTime()) {
        result.yesterday.push(activity);
      } else {
        const dateKey = activityDate.toISOString().split('T')[0];
        if (!result.dates[dateKey]) result.dates[dateKey] = [];
        result.dates[dateKey].push(activity);
      }
    });

    return result;
  }, [activities]);

  const selectedDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return doctors.find((d: any) => d.id === selectedDoctorId);
  }, [selectedDoctorId, doctors]);

  const handleSubmit = async () => {
    if (!formData.content.trim()) return;
    if (!selectedDoctorId) return;

    setSubmitting(true);
    try {
      await createActivity({
        doctorId: selectedDoctorId,
        type: formData.type,
        content: formData.content,
        result: formData.result || undefined,
        nextFollowUpAt: formData.nextFollowUpAt || undefined,
      });
      setFormData({ type: 'CALL', content: '', result: '', nextFollowUpAt: '' });
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const doctorOptions = useMemo(() => [
    { value: '', label: 'All Doctors' },
    ...doctors.map((d: any) => ({ value: d.id, label: d.name }))
  ], [doctors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activities</h1>
          {selectedDoctor && (
            <p className="text-slate-500 mt-1">
              Next follow-up: {selectedDoctor.nextFollowUpAt
                ? new Date(selectedDoctor.nextFollowUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not scheduled'}
            </p>
          )}
        </div>
        <Button onClick={() => setQuickAddOpen(!quickAddOpen)}>
          {quickAddOpen ? 'Cancel' : '+ Add Activity'}
        </Button>
      </div>

      {/* Doctor Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-500">Doctor:</label>
        <Select
          value={selectedDoctorId || ''}
          onChange={(e) => setSelectedDoctor(e.target.value || null)}
          options={doctorOptions}
          className="w-64"
        />
      </div>

      {/* Quick Add Form */}
      {quickAddOpen && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <Select
                  value={selectedDoctorId || ''}
                  onChange={(e) => setSelectedDoctor(e.target.value || null)}
                  options={doctorOptions}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                  options={[
                    { value: 'CALL', label: 'Call' },
                    { value: 'MESSAGE', label: 'Message' },
                    { value: 'MEETING', label: 'Meeting' },
                    { value: 'DEMO', label: 'Demo' },
                    { value: 'SAMPLE_SENT', label: 'Sample Sent' },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What happened?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                <Select
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  options={[
                    { value: '', label: 'Select result' },
                    { value: 'interested', label: 'Interested' },
                    { value: 'not_interested', label: 'Not Interested' },
                    { value: 'follow_up_needed', label: 'Follow-up Needed' },
                  ]}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
                <input
                  type="date"
                  value={formData.nextFollowUpAt}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!formData.content.trim() || !selectedDoctorId || submitting}
              >
                {submitting ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.today.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Today</h2>
              <div className="space-y-3">
                {groupedActivities.today.map((activity: any) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    expanded={expandedId === activity.id}
                    onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedActivities.yesterday.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Yesterday</h2>
              <div className="space-y-3">
                {groupedActivities.yesterday.map((activity: any) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    expanded={expandedId === activity.id}
                    onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {Object.entries(groupedActivities.dates).map(([dateKey, dateActivities]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">{formatDateHeader(dateKey)}</h2>
              <div className="space-y-3">
                {dateActivities.map((activity: any) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    expanded={expandedId === activity.id}
                    onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No activities yet. Click "+ Add Activity" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity, expanded, onToggle }: { activity: any; expanded: boolean; onToggle: () => void }) {
  const typeKey = activity.type as ActivityType;
  const icon = typeIcons[typeKey] || <ActivityIcon className="w-4 h-4" />;

  return (
    <div className="cursor-pointer hover:shadow-md transition-shadow" onClick={onToggle}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800">{activity.doctorName}</p>
              <span className="text-sm text-gray-400">{formatTime(activity.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-600 truncate">{activity.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gpsStatusColors[activity.gpsStatus]}`}>
                {activity.gpsStatus === 'VALID' && '✅ '}
                {activity.gpsStatus === 'SUSPICIOUS' && '⚠️ '}
                {gpsStatusLabels[activity.gpsStatus]}
                {activity.distanceMeters && ` (${activity.distanceMeters}m)`}
              </span>
            </div>

            {expanded && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {activity.result && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Result</p>
                    <p className="text-sm font-medium">{activity.result.replace('_', ' ')}</p>
                  </div>
                )}
                {activity.nextFollowUpAt && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Next Follow-up</p>
                    <p className="text-sm">{new Date(activity.nextFollowUpAt).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase">Logged by</p>
                  <p className="text-sm">{activity.salesName}</p>
                </div>
              </div>
            )}

            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expanded ? 'Less' : 'More'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}