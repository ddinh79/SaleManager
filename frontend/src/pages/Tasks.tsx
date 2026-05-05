import { useTasks } from '../hooks/useTasks';
import { TaskItem, TaskFilter } from '../types';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

const filterTabs: { value: TaskFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OVERDUE', label: 'Quá hạn' },
  { value: 'CLOSING_SOON', label: 'Sắp đóng' },
  { value: 'TODAY', label: 'Hôm nay' },
];

function getTaskColor(task: TaskItem): string {
  if (task.overdueDays > 0) return 'border-l-red-500 bg-red-50';
  if (task.type === 'DEAL_CLOSING') {
    if (task.overdueDays >= -1) return 'border-l-orange-500 bg-orange-50';
    return 'border-l-yellow-500 bg-yellow-50';
  }
  return 'border-l-blue-500 bg-white';
}

function getTaskIcon(task: TaskItem) {
  if (task.overdueDays > 0) return <AlertCircle className="w-5 h-5 text-red-500" />;
  if (task.type === 'DEAL_CLOSING') return <Clock className="w-5 h-5 text-orange-500" />;
  return <CheckCircle className="w-5 h-5 text-blue-500" />;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function TaskCard({ task, onSnooze, onComplete }: { task: TaskItem; onSnooze: (days: number) => void; onComplete: () => void }) {
  return (
    <div className={`border-l-4 ${getTaskColor(task)} rounded-lg shadow-sm p-4 mb-3`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getTaskIcon(task)}
            <h3 className="font-semibold text-slate-800">{task.doctorName}</h3>
          </div>
          <p className="text-sm text-slate-500">{task.hospitalName}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              task.overdueDays > 0 ? 'bg-red-100 text-red-700' :
              task.type === 'DEAL_CLOSING' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {task.type === 'DEAL_OVERDUE' && `Quá hạn ${task.overdueDays} ngày`}
              {task.type === 'DEAL_CLOSING' && (task.overdueDays >= 0 ? `Đóng trong ${task.overdueDays} ngày` : `Đóng trong ${Math.abs(task.overdueDays)} ngày`)}
              {task.type === 'FOLLOW_UP' && 'Follow-up hôm nay'}
            </span>

            {task.dealValue && (
              <span className="text-xs font-medium text-slate-600">
                💰 {formatCurrency(task.dealValue)}
              </span>
            )}
            {task.dealStage && (
              <span className="text-xs text-slate-500">
                {task.dealStage}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onComplete()}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
            title="Hoàn thành"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <div className="relative group">
            <button
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Tạm hoãn"
            >
              <Clock className="w-5 h-5" />
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border p-2 z-10 min-w-[120px]">
              <button onClick={() => onSnooze(1)} className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded">1 ngày</button>
              <button onClick={() => onSnooze(3)} className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded">3 ngày</button>
              <button onClick={() => onSnooze(7)} className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded">7 ngày</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Tasks = () => {
  const { tasks, summary, loading, error, filter, setFilter, snooze, complete } = useTasks();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-slate-500">Đang tải...</span></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64"><span className="text-red-500">{error}</span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Công việc</h1>
          <p className="text-slate-500">Danh sách công việc ưu tiên</p>
        </div>
        {summary && (
          <div className="flex gap-4 text-sm">
            <span className="text-red-600">⚠️ {summary.overdue} quá hạn</span>
            <span className="text-orange-600">⏰ {summary.closingSoon} sắp đóng</span>
            <span className="text-blue-600">📋 {summary.total} tổng cộng</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Không có công việc nào
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={`${task.type}-${task.id}`}
              task={task}
              onSnooze={(days) => snooze(task.id, task.type, days)}
              onComplete={() => complete(task.id, task.type)}
            />
          ))
        )}
      </div>
    </div>
  );
};