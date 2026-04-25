export interface KpiSummary {
  totalCalls: number;
  totalMeetings: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  conversionRate: number;
  activityScore: number;
}

export interface DailyKpi {
  date: string;
  calls: number;
  meetings: number;
  newDeals: number;
  revenue: number;
}

export interface WeeklyKpi {
  weekNumber: number;
  calls: number;
  meetings: number;
  wonDeals: number;
  conversionRate: number;
}

export interface MonthlyKpi {
  month: number;
  year: number;
  revenue: number;
  targetPercent: number;
  avgDealSize: number;
}

export type PerformanceLevel = 'excellent' | 'average' | 'poor';

export const getPerformanceLevel = (conversionRate: number): PerformanceLevel => {
  if (conversionRate >= 50) return 'excellent';
  if (conversionRate >= 25) return 'average';
  return 'poor';
};

export const getPerformanceColor = (level: PerformanceLevel): string => {
  switch (level) {
    case 'excellent': return 'text-green-600 bg-green-50';
    case 'average': return 'text-yellow-600 bg-yellow-50';
    case 'poor': return 'text-red-600 bg-red-50';
  }
};