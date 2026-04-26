import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { dealService } from '../../services/dealService';
import { Lock } from 'lucide-react';
export const DealDetailDrawer = ({ dealId, isOpen, onClose, onUpdate }) => {
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (dealId && isOpen) {
            loadDeal();
        }
    }, [dealId, isOpen]);
    const loadDeal = async () => {
        if (!dealId)
            return;
        setLoading(true);
        try {
            const data = await dealService.getDeal(dealId);
            setDeal(data);
        }
        catch (error) {
            console.error('Failed to load deal:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!deal)
            return;
        setSaving(true);
        try {
            const request = {
                product: deal.product,
                quantity: deal.quantity,
                unitPrice: deal.unitPrice,
                expectedCloseDate: deal.expectedCloseDate || undefined,
                notes: deal.notes || undefined,
            };
            await dealService.updateDeal(deal.id, request);
            onUpdate();
            onClose();
        }
        catch (error) {
            console.error('Failed to update deal:', error);
        }
        finally {
            setSaving(false);
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };
    if (!deal)
        return null;
    const isLocked = deal.stage === 'WON' || deal.stage === 'LOST';
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: "Deal Details", children: _jsx("div", { className: "p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }) })) : (_jsxs(_Fragment, { children: [isLocked && (_jsxs("div", { className: "flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg mb-6", children: [_jsx(Lock, { className: "w-4 h-4" }), _jsxs("span", { className: "text-sm", children: ["This deal is locked (", deal.stage, ")"] })] })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Doctor" }), _jsx("p", { className: "text-slate-800", children: deal.doctorName })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Product" }), _jsxs("select", { value: deal.product, onChange: (e) => setDeal({ ...deal, product: e.target.value }), disabled: isLocked, className: "w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100", children: [_jsx("option", { value: "SILICONE", children: "SILICONE" }), _jsx("option", { value: "CREAM", children: "CREAM" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Stage" }), _jsx("p", { className: "text-slate-800", children: deal.stage })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Quantity" }), _jsx("input", { type: "number", min: "1", value: deal.quantity, onChange: (e) => setDeal({ ...deal, quantity: parseInt(e.target.value) || 0 }), disabled: isLocked, className: "w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Unit Price" }), _jsx("input", { type: "number", min: "0", value: deal.unitPrice, onChange: (e) => setDeal({ ...deal, unitPrice: parseInt(e.target.value) || 0 }), disabled: isLocked, className: "w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100" })] })] }), _jsxs("div", { className: "bg-slate-50 p-3 rounded-lg", children: [_jsx("span", { className: "text-sm text-slate-600", children: "Total Value: " }), _jsx("span", { className: "text-lg font-semibold text-slate-800", children: formatCurrency(deal.totalValue) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Expected Close" }), _jsx("input", { type: "date", value: deal.expectedCloseDate || '', onChange: (e) => setDeal({ ...deal, expectedCloseDate: e.target.value || null }), disabled: isLocked, className: "w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Notes" }), _jsx("textarea", { value: deal.notes || '', onChange: (e) => setDeal({ ...deal, notes: e.target.value }), disabled: isLocked, rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx(Button, { variant: "ghost", onClick: onClose, children: "Cancel" }), !isLocked && (_jsx(Button, { onClick: handleSave, loading: saving, children: "Save Changes" }))] })] })] })) }) }));
};
