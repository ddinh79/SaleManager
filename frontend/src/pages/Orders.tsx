import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import type { Order, OrderStatus } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CheckCircle, Truck, Package } from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'bg-gray-100 text-gray-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  READY_TO_SHIP: 'bg-orange-100 text-orange-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'Pending',
  APPROVED: 'Approved',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipping',
  COMPLETED: 'Completed',
};

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; icon: React.ReactNode; api: 'approve' | 'markReady' | 'ship' | 'complete' }>> = {
  PENDING_APPROVAL: { label: 'Approve', icon: <CheckCircle className="w-4 h-4" />, api: 'approve' },
  APPROVED: { label: 'Ready to Ship', icon: <Package className="w-4 h-4" />, api: 'markReady' },
  READY_TO_SHIP: { label: 'Ship', icon: <Truck className="w-4 h-4" />, api: 'ship' },
  SHIPPED: { label: 'Complete', icon: <CheckCircle className="w-4 h-4" />, api: 'complete' },
};

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await orderService.getOrders(status);
      setOrders(data.items);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId: string, action: 'approve' | 'markReady' | 'ship' | 'complete') => {
    setActionLoading(orderId);
    try {
      switch (action) {
        case 'approve':
          await orderService.approve(orderId);
          break;
        case 'markReady':
          await orderService.markReady(orderId);
          break;
        case 'ship':
          await orderService.ship(orderId);
          break;
        case 'complete':
          await orderService.complete(orderId);
          break;
      }
      loadOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order: ' + (error as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | 'ALL')}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="ALL">All</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="READY_TO_SHIP">Ready to Ship</option>
          <option value="SHIPPED">Shipping</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No orders found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Value</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => {
                const nextAction = NEXT_ACTION[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-800">{order.doctorName}</div>
                      <div className="text-xs text-slate-500">{order.product}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-800">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-xs text-slate-500">{order.quantity} units</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {nextAction && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(order.id, nextAction.api)}
                          loading={actionLoading === order.id}
                        >
                          {nextAction.icon}
                          {nextAction.label}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};