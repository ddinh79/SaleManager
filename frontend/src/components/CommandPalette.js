import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Activity, MessageSquare, Search } from 'lucide-react';
import { useUiStore } from '../store/uiStore';
const searchItems = [
    { label: 'Dashboard', path: '/', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }) },
    { label: 'Users', path: '/users', icon: _jsx(Users, { className: "w-5 h-5" }) },
    { label: 'Doctors', path: '/doctors', icon: _jsx(Stethoscope, { className: "w-5 h-5" }) },
    { label: 'Activities', path: '/activities', icon: _jsx(Activity, { className: "w-5 h-5" }) },
    { label: 'Interactions', path: '/interactions', icon: _jsx(MessageSquare, { className: "w-5 h-5" }) },
];
export const CommandPalette = () => {
    const navigate = useNavigate();
    const { searchModalOpen, closeSearchModal } = useUiStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const filteredItems = searchItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                if (searchModalOpen) {
                    closeSearchModal();
                }
                else {
                    useUiStore.getState().openSearchModal();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchModalOpen, closeSearchModal]);
    useEffect(() => {
        if (searchModalOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [searchModalOpen]);
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);
    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'Escape':
                closeSearchModal();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    navigate(filteredItems[selectedIndex].path);
                    closeSearchModal();
                }
                break;
        }
    };
    if (!searchModalOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-center pt-[15vh]", children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: closeSearchModal }), _jsxs("div", { className: "relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden", children: [_jsxs("div", { className: "flex items-center gap-3 px-4 border-b border-slate-200", children: [_jsx(Search, { className: "w-5 h-5 text-slate-400" }), _jsx("input", { ref: inputRef, type: "text", placeholder: "Search...", value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: handleKeyDown, className: "flex-1 h-14 bg-transparent outline-none text-slate-800 placeholder:text-slate-400" }), _jsx("kbd", { className: "px-2 py-1 text-xs text-slate-400 bg-slate-100 rounded", children: "ESC" })] }), _jsx("div", { className: "max-h-80 overflow-y-auto py-2", children: filteredItems.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-slate-400", children: "No results found" })) : (filteredItems.map((item, index) => (_jsxs("button", { onClick: () => {
                                navigate(item.path);
                                closeSearchModal();
                            }, className: `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`, children: [item.icon, _jsx("span", { className: "font-medium", children: item.label })] }, item.path)))) }), _jsxs("div", { className: "px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 rounded", children: "\u2191\u2193" }), " Navigate"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 rounded", children: "Enter" }), " Select"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 rounded", children: "Ctrl+K" }), " Toggle"] })] })] })] }));
};
