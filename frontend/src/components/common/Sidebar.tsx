import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2 } from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  className?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Doctors', path: '/doctors', icon: <Users className="w-5 h-5" /> },
  { label: 'Hospitals', path: '/hospitals', icon: <Building2 className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();

  return (
    <div className={`w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-blue-600">Sales System</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};