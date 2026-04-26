import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CheckCircle, Truck, Package } from 'lucide-react';
const STATUS_COLORS = {
    PENDING_APPROVAL: 'bg-gray-100 text-gray-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    READY_TO_SHIP: 'bg-orange-100 text-orange-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
};
const STATUS_LABELS = {
    PENDING_APPROVAL: 'Pending',
    APPROVED: 'Approved',
    READY_TO_SHIP: 'Ready to Ship',
    SHIPPED: 'Shipping',
    COMPLETED: 'Completed',
};
const NEXT_ACTION = {
    PENDING_APPROVAL: { label: 'Approve', icon: _jsx(CheckCircle, { className: "w-4 h-4" }), api: 'approve' },
    APPROVED: { label: 'Ready to Ship', icon: _jsx(Package, { className: "w-4 h-4" }), api: 'markReady' },
    READY_TO_SHIP: { label: 'Ship', icon: _jsx(Truck, { className: "w-4 h-4" }), api: 'ship' },
    SHIPPED: { label: 'Complete', icon: _jsx(CheckCircle, { className: "w-4 h-4" }), api: 'complete' },
};
export const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState(null);
    useEffect(() => {
        loadOrders();
    }, [filter]);
    const loadOrders = async () => {
        try {
            const status = filter === 'ALL' ? undefined : filter;
            const data = await orderService.getOrders(status);
            setOrders(data.items);
        }
        catch (error) {
            console.error('Failed to load orders:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAction = async (orderId, action) => {
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
        }
        catch (error) {
            console.error('Failed to update order:', error);
            alert('Failed to update order: ' + error.message);
        }
        finally {
            setActionLoading(null);
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Orders" }), _jsxs("select", { value: filter, onChange: (e) => setFilter(e.target.value), className: "px-3 py-2 border border-slate-300 rounded-lg", children: [_jsx("option", { value: "ALL", children: "All" }), _jsx("option", { value: "PENDING_APPROVAL", children: "Pending" }), _jsx("option", { value: "APPROVED", children: "Approved" }), _jsx("option", { value: "READY_TO_SHIP", children: "Ready to Ship" }), _jsx("option", { value: "SHIPPED", children: "Shipping" }), _jsx("option", { value: "COMPLETED", children: "Completed" })] })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : orders.length === 0 ? (_jsx(Card, { className: "p-8 text-center", children: _jsx("p", { className: "text-gray-500", children: "No orders found." }) })) : (_jsx(Card, { className: "overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-50 border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold text-slate-700", children: "Order" }), _jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold text-slate-700", children: "Doctor" }), _jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold text-slate-700", children: "Value" }), _jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold text-slate-700", children: "Status" }), _jsx("th", { className: "px-4 py-3 text-right text-sm font-semibold text-slate-700", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200", children: orders.map((order) => {
                                const nextAction = NEXT_ACTION[order.status];
                                return (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsxs("div", { className: "text-sm font-medium text-slate-800", children: ["#", order.id.slice(0, 8).toUpperCase()] }), _jsx("div", { className: "text-xs text-slate-500", children: formatDate(order.createdAt) })] }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("div", { className: "text-sm text-slate-800", children: order.doctorName }), _jsx("div", { className: "text-xs text-slate-500", children: order.product })] }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("div", { className: "text-sm font-semibold text-slate-800", children: formatCurrency(order.totalAmount) }), _jsxs("div", { className: "text-xs text-slate-500", children: [order.quantity, " units"] })] }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`, children: STATUS_LABELS[order.status] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: nextAction && (_jsxs(Button, { size: "sm", onClick: () => handleAction(order.id, nextAction.api), loading: actionLoading === order.id, children: [nextAction.icon, nextAction.label] })) })] }, order.id));
                            }) })] }) }))] }));
};
