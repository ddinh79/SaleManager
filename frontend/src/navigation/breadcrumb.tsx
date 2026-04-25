import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames: Record<string, string> = {
  '': 'Dashboard',
  'users': 'Users',
  'doctors': 'Doctors',
  'interactions': 'Interactions',
  'activities': 'Activities',
};

export function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link to="/" className="text-gray-400 hover:text-gray-600">
        <Home className="w-4 h-4" />
      </Link>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const routePath = '/' + paths.slice(0, index + 1).join('/');
        const label = routeNames[path] || path;

        return (
          <span key={path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-gray-300" />
            {isLast ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link to={routePath} className="text-gray-500 hover:text-gray-700">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}