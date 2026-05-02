import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLogoutMutation } from '../../api/authApi';
import { useAppDispatch } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import ThemeToggle from '../ThemeToggle';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [logoutMutation] = useLogoutMutation();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-primary py-6 shadow-neo-flat transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64 translate-x-0 px-6' : 'w-64 -translate-x-full px-6 lg:w-24 lg:translate-x-0 lg:px-4'}
      `}
    >
      {/* Header Area */}
      <div className={`mb-10 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {/* Hide text when collapsed on desktop */}
        <h1 className={`font-display text-xl font-bold text-primary-text transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'hidden lg:hidden'}`}>
          TaskFlow
        </h1>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden items-center justify-center rounded-xl p-2.5 text-primary-text shadow-neo-flat-sm transition-all hover:-translate-y-0.5 hover:shadow-neo-pressed-sm active:translate-y-0 lg:flex"
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center rounded-xl p-3 transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-text shadow-neo-pressed-sm'
                  : 'shadow-neo-flat-sm hover:-translate-y-0.5 hover:shadow-neo-pressed-sm'
              } ${isOpen ? 'gap-4 px-4' : 'justify-center'}`
            }
          >
            <item.icon size={22} className="shrink-0" />
            <span className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-200 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 lg:hidden'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions (Theme & Logout) */}
      <div className="mt-auto flex flex-col gap-6">
        <ThemeToggle isCollapsed={!isOpen} />
        
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-xl p-3 text-red-500 shadow-neo-flat-sm transition-all duration-200 hover:shadow-neo-pressed-sm active:translate-y-0.5
            ${isOpen ? 'gap-4 px-4' : 'justify-center'}
          `}
        >
          <LogOut size={22} className="shrink-0" />
          <span className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-200 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 lg:hidden'}`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}