import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { dealService } from '../../services/dealService';
import type { Deal, UpdateDealRequest } from '../../types';
import { Lock } from 'lucide-react';

interface DealDetailDrawerProps {
  dealId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({ dealId, isOpen, onClose, onUpdate }) => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dealId && isOpen) {
      loadDeal();
    }
  }, [dealId, isOpen]);

  const loadDeal = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const data = await dealService.getDeal(dealId);
      setDeal(data);
    } catch (error) {
      console.error('Failed to load deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!deal) return;
    setSaving(true);
    try {
      const request: UpdateDealRequest = {
        product: deal.product as 'SILICONE' | 'CREAM',
        quantity: deal.quantity,
        unitPrice: deal.unitPrice,
        expectedCloseDate: deal.expectedCloseDate || undefined,
        notes: deal.notes || undefined,
      };
      await dealService.updateDeal(deal.id, request);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update deal:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!deal) return null;

  const isLocked = deal.stage === 'WON' || deal.stage === 'LOST';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deal Details">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isLocked && (
              <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg mb-6">
                <Lock className="w-4 h-4" />
                <span className="text-sm">This deal is locked ({deal.stage})</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                <p className="text-slate-800">{deal.doctorName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                  <select
                    value={deal.product}
                    onChange={(e) => setDeal({ ...deal, product: e.target.value as 'SILICONE' | 'CREAM' })}
                    disabled={isLocked}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  >
                    <option value="SILICONE">SILICONE</option>
                    <option value="CREAM">CREAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                  <p className="text-slate-800">{deal.stage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={deal.quantity}
                    onChange={(e) => setDeal({ ...deal, quantity: parseInt(e.target.value) || 0 })}
                    disabled={isLocked}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    value={deal.unitPrice}
                    onChange={(e) => setDeal({ ...deal, unitPrice: parseInt(e.target.value) || 0 })}
                    disabled={isLocked}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-sm text-slate-600">Total Value: </span>
                <span className="text-lg font-semibold text-slate-800">
                  {formatCurrency(deal.totalValue)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close</label>
                <input
                  type="date"
                  value={deal.expectedCloseDate || ''}
                  onChange={(e) => setDeal({ ...deal, expectedCloseDate: e.target.value || null })}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={deal.notes || ''}
                  onChange={(e) => setDeal({ ...deal, notes: e.target.value })}
                  disabled={isLocked}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                {!isLocked && (
                  <Button onClick={handleSave} loading={saving}>Save Changes</Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
