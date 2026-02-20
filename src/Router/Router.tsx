import React from 'react';
import { NavPage } from '../types/type';

import { DashboardPage }       from '../pages/Dashboard/Dashboard';
import { ClientManagementPage }from '../pages/ClientManagement/ClientManagementPage';
import { BulkTradingPage }     from '../pages/BulkTrading/Bulktradingpage';
import { TradeHistoryPage }    from '../pages/TradeHistory/Tradehistorypage';
import { OrderLogsPage }       from '../pages/Orderlogs/Orderlogspage';
import { SettingsPage }        from '../pages/Settings/Settingspage';

interface RouterProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export const Router: React.FC<RouterProps> = ({ activePage, onNavigate }) => {
  switch (activePage) {
    case 'dashboard':     return <DashboardPage onNavigate={onNavigate} />;
    case 'clients':       return <ClientManagementPage />;
    case 'bulk-trading':  return <BulkTradingPage />;
    case 'trade-history': return <TradeHistoryPage />;
    case 'order-logs':    return <OrderLogsPage />;
    case 'settings':      return <SettingsPage />;
    default:              return <DashboardPage onNavigate={onNavigate} />;
  }
};