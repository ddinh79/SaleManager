import { Deal } from '../../types';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick, isDragging }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isLocked = deal.stage === 'WON' || deal.stage === 'LOST';

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-slate-200 p-3 cursor-pointer
        hover:shadow-md transition-shadow
        ${isDragging ? 'shadow-xl rotate-2' : ''}
        ${isLocked ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{deal.doctorName}</p>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            {formatCurrency(deal.totalValue)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>{formatDate(deal.expectedCloseDate)}</span>
            <span>·</span>
            <span>{deal.probability}%</span>
          </div>
        </div>
        {isLocked && (
          <div className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
            {deal.stage === 'WON' ? '✓ Won' : '✗ Lost'}
          </div>
        )}
      </div>
    </div>
  );
};