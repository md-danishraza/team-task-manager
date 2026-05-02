import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useGetCurrentUserQuery } from './api/authApi';
import { setUser } from './features/auth/authSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';

function AppInitializer({ children }) {
  const dispatch = useAppDispatch();

  // 1. Get the theme state from Redux
  const isDark = useAppSelector((state) => state.theme.isDark);

  // 2. Apply it to the DOM whenever it changes (or on first load)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  // RTK Query handles the loading state natively
  const { data, isLoading, error } = useGetCurrentUserQuery(undefined, {
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
    } else if (error?.status === 401) {
      dispatch(setUser(null));
    }
  }, [data, error, dispatch]);

  // Block the entire router from mounting until we know the user's status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
      <ToastProvider>
        <BrowserRouter>
          <AppInitializer>
            <div className="min-h-screen bg-primary text-primary-text">
              <AppRoutes />
            </div>
          </AppInitializer>
        </BrowserRouter>
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  );
}