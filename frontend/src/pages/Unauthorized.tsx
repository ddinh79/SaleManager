import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-6">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};