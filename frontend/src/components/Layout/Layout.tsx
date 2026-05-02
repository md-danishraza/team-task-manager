import { useState, useEffect, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Default to true, but we will immediately correct it on mount
  const [isOpen, setIsOpen] = useState(true);

  // Auto-close sidebar on small screens, open on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false); // Mobile: collapsed (hidden)
      } else {
        setIsOpen(true);  // Desktop: expanded (w-64)
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      {/* Mobile Backdrop Overlay - dims background when sidebar is open on phones */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-text/10 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Pass state to Sidebar */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Main Content Area */}
      <main
        className={`min-h-screen p-4 sm:p-8 transition-all duration-300 ease-in-out ${
          isOpen ? 'lg:ml-64' : 'lg:ml-24'
        }`}
      >
        {/* Mobile Top Nav (Visible only on small screens) */}
        <header className="mb-8 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center rounded-xl p-3 text-primary-text shadow-neo-flat-sm transition-all active:-translate-y-0.5 active:shadow-neo-pressed-sm"
          >
            <Menu size={24} />
          </button>
          <h1 className="font-display text-2xl font-bold text-primary-text">TaskFlow</h1>
          <div className="w-12" /> {/* Spacer to perfectly center the heading */}
        </header>

        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}