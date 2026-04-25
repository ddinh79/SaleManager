import { KpiSummary, getPerformanceLevel, getPerformanceColor } from '../../types/kpi';

interface PerformanceCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  kpi?: KpiSummary;
  metric?: 'calls' | 'meetings' | 'revenue' | 'conversion';
}

export function PerformanceCard({ title, value, subtitle, kpi, metric }: PerformanceCardProps) {
  let bgColor = 'bg-white';
  let borderColor = 'border-gray-200';

  if (kpi && metric) {
    const level = getPerformanceLevel(kpi.conversionRate);
    bgColor = getPerformanceColor(level).split(' ')[1];
    borderColor = getPerformanceColor(level).split(' ')[0].replace('text-', 'border-');
  }

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 transition-all`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}