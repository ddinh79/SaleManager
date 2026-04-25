import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
export const Login = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authService.login(formData);
            login(response.token, response.user);
            navigate('/');
        }
        catch (err) {
            setError('Invalid username or password');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-100", children: _jsxs(Card, { className: "w-full max-w-md p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-blue-600", children: "SaleManager" }), _jsx("p", { className: "text-slate-500 mt-2", children: "Sign in to your account" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 bg-red-50 text-red-600 rounded-lg text-sm", children: error })), _jsx(Input, { label: "Username", type: "text", placeholder: "Enter your username", value: formData.username, onChange: (e) => setFormData({ ...formData, username: e.target.value }), required: true }), _jsx(Input, { label: "Password", type: "password", placeholder: "Enter your password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: true }), _jsx(Button, { type: "submit", loading: loading, className: "w-full", children: "Sign In" })] }), _jsx("div", { className: "mt-6 p-4 bg-slate-50 rounded-lg", children: _jsxs("p", { className: "text-sm text-slate-600 text-center", children: [_jsx("span", { className: "font-semibold", children: "Demo Credentials:" }), _jsx("br", {}), "Username: ", _jsx("code", { className: "bg-slate-200 px-1 rounded", children: "admin" }), " | Password: ", _jsx("code", { className: "bg-slate-200 px-1 rounded", children: "admin123" })] }) })] }) }));
};
