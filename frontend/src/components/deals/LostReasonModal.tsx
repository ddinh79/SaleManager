import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { LostReason } from '../../types';

interface LostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: LostReason, notes: string) => void;
}

const LOST_REASON_OPTIONS: { value: LostReason; label: string }[] = [
  { value: 'COMPETITOR', label: 'Lost to competitor' },
  { value: 'BUDGET', label: 'Budget constraints' },
  { value: 'TIMELINE', label: 'Timeline mismatch' },
  { value: 'NO_RESPONSE', label: 'No response' },
  { value: 'PRODUCT_MISMATCH', label: 'Product mismatch' },
  { value: 'OTHER', label: 'Other' },
];

export const LostReasonModal: React.FC<LostReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState<LostReason | ''>('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, notes);
    setReason('');
    setNotes('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Deal as Lost">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as LostReason)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a reason</option>
            {LOST_REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="Additional details..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};