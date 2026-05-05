import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { doctorService } from '../../services/doctorService';
import { dealService } from '../../services/dealService';
import type { Doctor, CreateDealRequest } from '../../types';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDealModal: React.FC<AddDealModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    doctorId: '',
    product: 'SILICONE' as 'SILICONE' | 'CREAM',
    quantity: 1,
    unitPrice: 0,
    expectedCloseDate: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    try {
      const data = await doctorService.getDoctors();
      setDoctors(data.Data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || form.quantity <= 0 || form.unitPrice <= 0) return;

    setLoading(true);
    try {
      const request: CreateDealRequest = {
        doctorId: form.doctorId,
        product: form.product,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      };
      await dealService.createDeal(request);
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      doctorId: '',
      product: 'SILICONE',
      quantity: 1,
      unitPrice: 0,
      expectedCloseDate: '',
      notes: '',
    });
  };

  const totalValue = form.quantity * form.unitPrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Deal">
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
            <select
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value as 'SILICONE' | 'CREAM' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="SILICONE">SILICONE</option>
              <option value="CREAM">CREAM</option>
            </select>
          </div>

          {/* Quantity + Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (VND)</label>
              <input
                type="number"
                min="0"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Total Value Display */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-sm text-slate-600">Total Value: </span>
            <span className="text-lg font-semibold text-slate-800">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalValue)}
            </span>
          </div>

          {/* Expected Close Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close Date</label>
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Deal</Button>
          </div>
        </form>
    </Modal>
  );
};