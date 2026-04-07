import React, { useEffect, useState } from 'react';
import { NavPage } from '../types/type';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { validateSessionThunk } from '../store/slice/authSlice/authSlice';
import { fetchTradeHistory } from '../store/slice/tradeHistorySlice/tradeHistorySlice';
import { Layout } from '../components/Layout/Layout/Layout';
import AuthPage from '../pages/Authpage/Authpage';
import { AppLoader } from './AppLoader';
import { DashboardPage }        from '../pages/Dashboard/Dashboard';
import { ClientManagementPage } from '../pages/ClientManagement/ClientManagementPage';
import { BulkTradingPage }      from '../pages/BulkTrading/Bulktradingpage';
import { TradeHistoryPage }     from '../pages/TradeHistory/Tradehistorypage';
import { OrderLogsPage }        from '../pages/Orderlogs/Orderlogspage';
import { SettingsPage }         from '../pages/Settings/Settingspage';
import { LogExportPage }        from '../pages/Logexportpage/Logexportpage';
import { PortfolioPage }        from '../pages/PortfolioPage/PortfolioPage';
import OrderNotifications from '../components/common/Ordernotifications/Ordernotifications';
import { FnoWatchlistPage } from '../pages/Fnowatchlistpage/FnoWatchlistPage';


const PageRenderer: React.FC<{
  activePage: NavPage;
  onNavigate: (p: NavPage) => void;
}> = ({ activePage, onNavigate }) => {
  switch (activePage) {
    case 'dashboard':     return <DashboardPage onNavigate={onNavigate} />;
    case 'clients':       return <ClientManagementPage onNavigate={onNavigate} />;
    case 'portfolio':     return <PortfolioPage />;
    case 'bulk-trading':  return <BulkTradingPage />;
    case 'trade-history': return <TradeHistoryPage />;
    case 'order-logs':    return <OrderLogsPage />;
    case 'log-export':    return <LogExportPage />;
    case 'fno-watchlist': return <FnoWatchlistPage />;
    case 'settings':      return <SettingsPage />;
    default:              return <DashboardPage onNavigate={onNavigate} />;
  }
};


export const Router: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const clientCode = useAppSelector(s => s.auth.user?.clientCode);
  const [activePage,     setActivePage]     = useState<NavPage>('dashboard');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    dispatch(validateSessionThunk())
      .then(result => {
        if (validateSessionThunk.fulfilled.match(result) && result.payload?.authenticated) {
          dispatch(fetchTradeHistory({}));
        }
      })
      .finally(() => setSessionChecked(true));
  }, [dispatch]);

  if (!sessionChecked) return <AppLoader />;
  if (!isAuthenticated) return <AuthPage />;

  return (
    <>
      {clientCode && <OrderNotifications clientCode={clientCode} />}

      <Layout activePage={activePage} onNavigate={setActivePage}>
        <PageRenderer activePage={activePage} onNavigate={setActivePage} />
      </Layout>
    </>
  );
};