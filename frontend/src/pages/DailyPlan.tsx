import { useDailyPlan } from '../hooks/useDailyPlan';
import { Clock, AlertCircle, CheckCircle, MessageCircle, Phone, Calendar } from 'lucide-react';

const categoryColors = {
  MUST_DO: 'border-l-red-500 bg-red-50',
  SHOULD_DO: 'border-l-yellow-500 bg-yellow-50',
  NICE_TO_HAVE: 'border-l-blue-500 bg-white',
};

const statusIcons = {
  PENDING: <Clock className="w-5 h-5 text-slate-400" />,
  IN_PROGRESS: <Phone className="w-5 h-5 text-blue-500" />,
  COMPLETED_AUTO: <CheckCircle className="w-5 h-5 text-green-500" />,
  COMPLETED_MANUAL: <AlertCircle className="w-5 h-5 text-orange-500" />,
  SKIPPED: <MessageCircle className="w-5 h-5 text-slate-400" />,
  EXPIRED: <AlertCircle className="w-5 h-5 text-red-500" />,
  OFF_TRACK: <AlertCircle className="w-5 h-5 text-red-500" />,
};

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function TaskCard({ task, isActive, onActivate, onComplete, onSkip }: {
  task: any;
  isActive: boolean;
  onActivate: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const isCompleted = task.status.startsWith('COMPLETED') || task.status === 'SKIPPED';

  return (
    <div className={`border-l-4 ${categoryColors[task.category as keyof typeof categoryColors]} rounded-lg shadow-sm p-4 mb-3 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {statusIcons[task.status as keyof typeof statusIcons] || statusIcons.PENDING}
            {task.plannedStart && (
              <span className="text-sm font-medium text-slate-600">
                {formatTime(task.plannedStart)}
              </span>
            )}
            <h3 className={`font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.taskType === 'CALL' && '📞 '}
              {task.taskType === 'MEETING' && '🤝 '}
              {task.taskType === 'FOLLOW_UP' && '📋 '}
              {task.taskType === 'MESSAGE' && '💬 '}
              {task.doctorName}
            </h3>
          </div>
          <p className="text-sm text-slate-500">{task.hospitalName}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.dealValue && (
              <span className="text-xs font-medium text-slate-600">
                💰 {formatCurrency(task.dealValue)}
              </span>
            )}
            {task.temperature && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.temperature === 'HOT' ? 'bg-red-100 text-red-700' :
                task.temperature === 'WARM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {task.temperature}
              </span>
            )}
            {task.isLowConfidence && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                ⚠️ Manual
              </span>
            )}
          </div>
        </div>

        {!isCompleted && (
          <div className="flex gap-2">
            {!isActive && (
              <button
                onClick={onActivate}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                title="Start"
              >
                ▶
              </button>
            )}
            <button
              onClick={onComplete}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
              title="Complete"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onSkip}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Skip"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const DailyPlan: React.FC = () => {
  const { plan, loading, error, completeTask, skipTask, activateTask } = useDailyPlan();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-slate-500">Đang tải...</span></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64"><span className="text-red-500">{error}</span></div>;
  }

  if (!plan) {
    return <div className="flex items-center justify-center h-64"><span className="text-slate-500">Không có kế hoạch</span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 Kế hoạch hôm nay</h1>
          <p className="text-slate-500">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className={`px-3 py-1 rounded-full ${plan.isRecoveryMode ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {plan.capacity.mode} Mode
          </span>
          <span className="text-slate-600">
            📊 Confidence: {Math.round(plan.confidenceScore * 100)}%
          </span>
        </div>
      </div>

      {plan.status === 'OFF_TRACK' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ Kế hoạch bị trễ ({plan.mustDo.filter(t => t.delayMinutes > 0).length} task)
        </div>
      )}

      {/* MUST DO Section */}
      {plan.mustDo.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            🔥 MUST DO
            <span className="text-sm font-normal text-slate-500">{plan.capacity.mustDoLimit} tasks</span>
          </h2>
          <div>
            {plan.mustDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={plan.activeTaskId === task.id}
                onActivate={() => activateTask(task.id)}
                onComplete={() => completeTask(task.id, { reasonCode: 'COMPLETED' })}
                onSkip={() => skipTask(task.id, { reasonCode: 'SKIPPED' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* SHOULD DO Section */}
      {plan.shouldDo.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            ⚡ SHOULD DO
            <span className="text-sm font-normal text-slate-500">{plan.capacity.shouldDoLimit} tasks</span>
          </h2>
          <div>
            {plan.shouldDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={plan.activeTaskId === task.id}
                onActivate={() => activateTask(task.id)}
                onComplete={() => completeTask(task.id, { reasonCode: 'COMPLETED' })}
                onSkip={() => skipTask(task.id, { reasonCode: 'SKIPPED' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* NICE TO HAVE Section */}
      {plan.niceToHave.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            🧊 LATER
          </h2>
          <div>
            {plan.niceToHave.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={plan.activeTaskId === task.id}
                onActivate={() => activateTask(task.id)}
                onComplete={() => completeTask(task.id, { reasonCode: 'COMPLETED' })}
                onSkip={() => skipTask(task.id, { reasonCode: 'SKIPPED' })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlan;