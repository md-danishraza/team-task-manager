import { useAppSelector } from '../../store/hooks';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAppSelector((state) => state.auth.user);

  return (
    <header className="mb-8 flex flex-wrap gap-y-4 items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-primary-text">{user?.name}</p>
          <p className="text-xs opacity-70">{user?.email}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary shadow-neo-flat-sm flex items-center justify-center">
          <span className="text-lg font-bold">
            {user?.name?.charAt(0).toUpperCase()} 
          </span>
        </div>
      </div>
    </header>
  );
}