import { useAuthStore, ROLES } from '../store/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function RoleGuard({ children, roles }: ProtectedRouteProps) {
  const hasRole = useAuthStore(state => state.hasRole);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  if (roles && !hasRole(roles)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}