import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleTheme } from '../features/theme/themeSlice';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const dispatch = useAppDispatch();
  const { isDark } = useAppSelector((state) => state.theme);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className={`flex items-center justify-start rounded-xl p-3 text-primary-text shadow-neo-flat-sm transition-all duration-200 hover:shadow-neo-pressed-sm active:translate-y-0.5 ${
        isCollapsed ? 'w-full' : 'gap-4 px-4'
      }`}
    >
      {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
      <span className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-200 ${!isCollapsed ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}


