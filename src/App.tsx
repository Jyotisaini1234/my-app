import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { NavPage } from './types/type';
import './styles/globals.scss';
import { Layout } from './components/Layout/Layout/Layout';
import { Router } from './Router/Router';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');

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