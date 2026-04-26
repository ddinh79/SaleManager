import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { doctorService } from '../../services/doctorService';
import { dealService } from '../../services/dealService';
export const AddDealModal = ({ isOpen, onClose, onSuccess }) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        doctorId: '',
        product: 'SILICONE',
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
            setDoctors(data.data);
        }
        catch (error) {
            console.error('Failed to load doctors:', error);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.doctorId || form.quantity <= 0 || form.unitPrice <= 0)
            return;
        setLoading(true);
        try {
            const request = {
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
        }
        catch (error) {
            console.error('Failed to create deal:', error);
        }
        finally {
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
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: "Add New Deal", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Doctor" }), _jsxs("select", { value: form.doctorId, onChange: (e) => setForm({ ...form, doctorId: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: "", children: "Select doctor" }), doctors.map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Product" }), _jsxs("select", { value: form.product, onChange: (e) => setForm({ ...form, product: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "SILICONE", children: "SILICONE" }), _jsx("option", { value: "CREAM", children: "CREAM" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Quantity" }), _jsx("input", { type: "number", min: "1", value: form.quantity, onChange: (e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Unit Price (VND)" }), _jsx("input", { type: "number", min: "0", value: form.unitPrice, onChange: (e) => setForm({ ...form, unitPrice: parseInt(e.target.value) || 0 }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] })] }), _jsxs("div", { className: "bg-slate-50 p-3 rounded-lg", children: [_jsx("span", { className: "text-sm text-slate-600", children: "Total Value: " }), _jsx("span", { className: "text-lg font-semibold text-slate-800", children: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalValue) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Expected Close Date" }), _jsx("input", { type: "date", value: form.expectedCloseDate, onChange: (e) => setForm({ ...form, expectedCloseDate: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Notes" }), _jsx("textarea", { value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx(Button, { type: "button", variant: "ghost", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", loading: loading, children: "Create Deal" })] })] }) }));
};
