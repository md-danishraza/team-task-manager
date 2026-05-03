// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="neo-card flex flex-col items-center justify-center p-12 text-center max-w-md w-full">
        <div className="mb-6 rounded-full p-4 shadow-neo-pressed">
          <AlertCircle size={48} className="text-primary-text opacity-80" />
        </div>
        
        <h1 className="font-display text-6xl font-bold text-primary-text mb-2">404</h1>
        <h2 className="text-xl font-semibold text-primary-text mb-4">Page Not Found</h2>
        <p className="text-primary-text opacity-70 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/dashboard"
          className="neo-button flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all"
        >
          <Home size={18} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}