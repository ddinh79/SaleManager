import {
  LayoutDashboard,
  Users,
  Stethoscope,
  MessageSquare,
  Activity,
} from 'lucide-react';
import type { UserRole } from '../types';

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export interface MenuSection {
  label: string;
  items: MenuItem[];
}

export const menuConfig: MenuSection[] = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
    ],
  },
  {
    label: 'SALES',
    items: [
      { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" />, roles: ['Admin'] },
      { label: 'Doctors', path: '/doctors', icon: <Stethoscope className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
      { label: 'Interactions', path: '/interactions', icon: <MessageSquare className="w-5 h-5" />, roles: ['Admin', 'SalesManager'] },
      { label: 'Activities', path: '/activities', icon: <Activity className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
    ],
  },
];

export const getVisibleMenuItems = (userRole: UserRole): MenuItem[] => {
  return menuConfig.flatMap(section =>
    section.items.filter(item => item.roles.includes(userRole))
  );
};