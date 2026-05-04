import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
const LOST_REASON_OPTIONS = [
    { value: 'COMPETITOR', label: 'Lost to competitor' },
    { value: 'BUDGET', label: 'Budget constraints' },
    { value: 'TIMELINE', label: 'Timeline mismatch' },
    { value: 'NO_RESPONSE', label: 'No response' },
    { value: 'PRODUCT_MISMATCH', label: 'Product mismatch' },
    { value: 'OTHER', label: 'Other' },
];
export const LostReasonModal = ({ isOpen, onClose, onConfirm, }) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const handleConfirm = () => {
        if (!reason)
            return;
        onConfirm(reason, notes);
        setReason('');
        setNotes('');
    };
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: "Mark Deal as Lost", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: ["Reason ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: reason, onChange: (e) => setReason(e.target.value), className: "w-full px-3 py-2 border rounded-md", children: [_jsx("option", { value: "", children: "Select a reason" }), LOST_REASON_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Notes (optional)" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), className: "w-full px-3 py-2 border rounded-md", rows: 3, placeholder: "Additional details..." })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleConfirm, disabled: !reason, children: "Confirm" })] })] }) }));
};
