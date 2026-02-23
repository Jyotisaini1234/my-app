import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { NavPage } from './types/type';
import './styles/globals.scss';
import { Layout } from './components/Layout/Layout/Layout';
import { Router } from './Router/Router';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { validateSessionThunk } from './store/slice/authSlice/authSlice';
import AuthPage from './pages/Authpage/Authpage';
import { AppLoader } from './Router/AppLoader';



const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector(s => s.auth);
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    dispatch(validateSessionThunk()).finally(() => setSessionChecked(true));
  }, [dispatch]);

  if (!sessionChecked || loading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      <Router activePage={activePage} onNavigate={setActivePage} />
    </Layout>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;