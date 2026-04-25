import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { taskService, type TaskItem } from '../services/taskService';
import { Phone, MessageSquare, Users, Activity as ActivityIcon } from 'lucide-react';

const temperatureColors: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700',
  WARM: 'bg-yellow-100 text-yellow-700',
  COLD: 'bg-gray-100 text-gray-500',
};

const temperatureEmoji: Record<string, string> = {
  HOT: '🔥',
  WARM: '🌤',
  COLD: '❄️',
};

export function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [snoozeOpen, setSnoozeOpen] = useState<string | null>(null);
  const [tempOpen, setTempOpen] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await taskService.getTodayTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = (doctorId: string) => {
    navigate(`/activities?doctorId=${doctorId}`);
  };

  const handleTemperatureChange = async (doctorId: string, temp: 'HOT' | 'WARM' | 'COLD') => {
    try {
      await taskService.updateTemperature(doctorId, temp);
      setTempOpen(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to update temperature:', error);
    }
  };

  const handleSnooze = async (doctorId: string, days: number) => {
    try {
      await taskService.snooze(doctorId, days);
      setSnoozeOpen(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLastActivityText = (task: TaskItem) => {
    if (!task.lastActivityAt) return 'No activity yet';
    const days = Math.floor((Date.now() - new Date(task.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Today's Tasks</h1>
        <span className="text-sm text-gray-500">{tasks.length} tasks</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No tasks for today. Enjoy your day!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.doctorId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xl">{temperatureEmoji[task.temperature]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{task.doctorName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${temperatureColors[task.temperature]}`}>
                        {task.temperature}
                      </span>
                      {task.isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Last: {task.lastActivityType ? `${task.lastActivityType} ` : ''}{getLastActivityText(task)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Next: {formatDate(task.nextFollowUpAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleLogActivity(task.doctorId)}>
                    Log Activity
                  </Button>

                  {/* Temperature dropdown */}
                  <div className="relative">
                    <Button size="sm" variant="ghost" onClick={() => setTempOpen(tempOpen === task.doctorId ? null : task.doctorId)}>
                      Temp ▾
                    </Button>
                    {tempOpen === task.doctorId && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleTemperatureChange(task.doctorId, 'HOT')}>🔥 Hot</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleTemperatureChange(task.doctorId, 'WARM')}>🌤 Warm</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleTemperatureChange(task.doctorId, 'COLD')}>❄️ Cold</button>
                      </div>
                    )}
                  </div>

                  {/* Snooze dropdown */}
                  <div className="relative">
                    <Button size="sm" variant="ghost" onClick={() => setSnoozeOpen(snoozeOpen === task.doctorId ? null : task.doctorId)}>
                      Snooze ▾
                    </Button>
                    {snoozeOpen === task.doctorId && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleSnooze(task.doctorId, 1)}>1 day</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleSnooze(task.doctorId, 3)}>3 days</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleSnooze(task.doctorId, 7)}>1 week</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}