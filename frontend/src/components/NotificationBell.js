import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import NotificationDropdown from './NotificationDropdown';
import { useState, useRef, useEffect } from 'react';
const NotificationBell = () => {
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const isConnected = useNotificationStore((state) => state.isConnected);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (_jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setShowDropdown(!showDropdown), className: "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative", children: [_jsx(Bell, { className: "w-5 h-5" }), unreadCount > 0 && (_jsx("span", { className: "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1", children: unreadCount > 99 ? '99+' : unreadCount }))] }), _jsx("div", { className: "absolute -bottom-0.5 -right-0.5", children: isConnected ? (_jsx(Wifi, { className: "w-3 h-3 text-green-500" })) : (_jsx(WifiOff, { className: "w-3 h-3 text-red-500" })) }), showDropdown && (_jsx(NotificationDropdown, { onClose: () => setShowDropdown(false), isOpen: showDropdown }))] }));
};
export default NotificationBell;
