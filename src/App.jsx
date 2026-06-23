import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppRouter from './routes/AppRouter';

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return <AppRouter />;
}

export default App;