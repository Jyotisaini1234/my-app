import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout/Header/Header';
import { Tabs } from '../components/Layout/Tabs/Tabs';
import './Dashboard.scss';
import { Client, TabType, TradeLog } from '../types/type';
import { AddClientModal } from '../components/ClientList/AddClientModal.tsx/AddClientModal';
import { ClientsTab } from '../components/ClientList/ClientsTab/ClientsTab';
import { LogsTab } from '../components/Logs/LogsTab./LogsTab';
import { OrderModal } from '../components/Orders/OrderModal/OrderModal';
import { OrdersTab } from '../components/Orders/OrdersTab';
import { clientService } from '../api/clientService';
import { CustomAlert } from '../components/Alert/CustomAlert/CustomAlert';
import { CustomConfirm } from '../components/Alert/CustomConfirm/CustomConfirm';

interface AlertState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ConfirmState {
  show: boolean;
  message: string;
  onConfirm: () => void;
}

export const Dashboard: React.FC = () => {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: '',
    type: 'info'
  });
  
  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    message: '',
    onConfirm: () => {}
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setAlert({ show: true, message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirm({ show: true, message, onConfirm });
  };

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientService.list();
      if (data.status === 'SUCCESS' && data.clients) {
        setClients(data.clients as Record<string, Client>);
      }
    } catch (err) {
      console.error('Failed to load clients', err);
      showAlert('Failed to load clients. Please check if backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthClient = async (clientCode: string) => {
    try {
      await clientService.authenticate(clientCode);
      await loadClients();
      showAlert(`${clientCode} authenticated successfully!`, 'success');
    } catch (err) {
      console.error('Authentication failed', err);
      showAlert(`Authentication failed for ${clientCode}`, 'error');
    }
  };

  const handleAuthAll = async () => {
    try {
      await clientService.authenticateAll();
      await loadClients();
      showAlert('All clients authenticated successfully!', 'success');
    } catch (err) {
      console.error('Authentication failed', err);
      showAlert('Failed to authenticate all clients', 'error');
    }
  };

  const handleDeleteClient = async (clientCode: string) => {
    showConfirm(
      `Are you sure you want to delete ${clientCode}?`,
      async () => {
        try {
          await clientService.delete(clientCode);
          await loadClients();
          showAlert(`${clientCode} deleted successfully!`, 'success');
        } catch (err) {
          console.error('Delete failed', err);
          showAlert('Failed to delete client', 'error');
        }
        setConfirm({ ...confirm, show: false });
      }
    );
  };

  const toggleClientSelection = (clientCode: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientCode)) {
      newSelection.delete(clientCode);
    } else {
      newSelection.add(clientCode);
    }
    setSelectedClients(newSelection);
  };

  const addTradeLog = (log: TradeLog) => {
    setTradeLogs(prev => [log, ...prev].slice(0, 100));
  };

  const clientsList = Object.values(clients);

  return (
    <div className="dashboard">
      <Header clients={clientsList} />
      <Tabs activeTab={activeTab} logsCount={tradeLogs.length} onTabChange={setActiveTab} />

      <main className="dashboard__content">
        {activeTab === 'clients' && (
          <ClientsTab  clients={clientsList}  loading={loading}  onRefresh={loadClients} onAuthClient={handleAuthClient}   onAuthAll={handleAuthAll}  onDelete={handleDeleteClient}  onAddClient={() => setShowAddModal(true)} />
        )}
        
        {activeTab === 'orders' && (
          <OrdersTab  clients={clientsList} selectedClients={selectedClients}  onToggleClient={toggleClientSelection}  onPlaceOrder={() => setShowOrderModal(true)}   /> )}
        
        {activeTab === 'logs' && <LogsTab/>}
      </main>

      {showAddModal && (
        <AddClientModal  onClose={() => setShowAddModal(false)} onSuccess={loadClients} />
      )}
      
      {showOrderModal && (
        <OrderModal   selectedClients={Array.from(selectedClients)}   clients={clients}   onClose={() => setShowOrderModal(false)} onSuccess={(log) => {addTradeLog(log);  setShowOrderModal(false); setActiveTab('logs');}} /> 
      )}

      {alert.show && (
        <CustomAlert message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, show: false })} />
      )}

      {confirm.show && (
        <CustomConfirm message={confirm.message} onConfirm={confirm.onConfirm}onCancel={() => setConfirm({ ...confirm, show: false })} />
      )}
    </div>
  );
};