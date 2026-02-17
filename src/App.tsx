import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { NavPage } from './types/type';
import './styles/globals.scss';
import { BulkTradingPage } from './pages/BulkTrading/Bulktradingpage';
import { ClientManagementPage } from './pages/ClientManagement/ClientManagementPage';
import { DashboardPage } from './pages/Dashboard/Dashboard';
import { SettingsPage } from './pages/Settings/Settingspage';
import { TradeHistoryPage } from './pages/TradeHistory/Tradehistorypage';
import { Layout } from './components/Layout/Layout/Layout';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActivePage} />;
      case 'clients':
        return <ClientManagementPage />;
      case 'bulk-trading':
        return <BulkTradingPage />;
      case 'trade-history':
        return <TradeHistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;