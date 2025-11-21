import React, { useEffect, useState } from 'react';
import { Header } from '../components/Layout/Header/Header';
import { Tabs } from '../components/Layout/Tabs/Tabs';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import './Dashboard.scss';
import { ClientsList } from '../components/ClientList/ClientsList/ClientsList';
import { fetchClients } from '../store/slice/clientsSlice/clientsSlice';
import { Client, TabType, TradeLog } from '../types/type';
import { AddClientModal } from '../components/ClientList/AddClientModal.tsx/AddClientModal';
import { ClientsTab } from '../components/ClientList/ClientsTab/ClientsTab';
import { LogsTab } from '../components/Logs/LogsTab./LogsTab';
import { OrderModal } from '../components/Orders/OrderModal/OrderModal';
import { OrdersTab } from '../components/Orders/OrdersTab';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
   const [clients, setClients] = useState<Record<string, Client>>({});
   const [activeTab, setActiveTab] = useState<TabType>('clients');
   const [loading, setLoading] = useState(false);
   const [showAddModal, setShowAddModal] = useState(false);
   const [showOrderModal, setShowOrderModal] = useState(false);
   const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
   const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
 
   useEffect(() => {
     loadClients();
   }, []);
 
   const loadClients = async () => {
     setLoading(true);
     try {
       const data = await api.fetchClients();
       if (data.status === 'SUCCESS') {
         setClients(data.clients);
       }
     } catch (err) {
       console.error('Failed to load clients', err);
       alert('Failed to load clients. Please check if backend is running.');
     } finally {
       setLoading(false);
     }
   };
 
   const handleAuthClient = async (clientCode: string) => {
     try {
       await api.authenticateClient(clientCode);
       await loadClients();
     } catch (err) {
       console.error('Authentication failed', err);
       alert('Authentication failed for ' + clientCode);
     }
   };
 
   const handleAuthAll = async () => {
     try {
       await api.authenticateAll();
       await loadClients();
     } catch (err) {
       console.error('Authentication failed', err);
       alert('Failed to authenticate all clients');
     }
   };
 
   const handleDeleteClient = async (clientCode: string) => {
     if (window.confirm(`Are you sure you want to delete ${clientCode}?`)) {
       try {
         await api.deleteClient(clientCode);
         await loadClients();
       } catch (err) {
         console.error('Delete failed', err);
         alert('Failed to delete client');
       }
     }
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
     <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
       <Header clients={clientsList} />
       <Tabs 
         activeTab={activeTab} 
         logsCount={tradeLogs.length} 
         onTabChange={setActiveTab} 
       />
 
       <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
         {activeTab === 'clients' && (
           <ClientsTab 
             clients={clientsList} 
             loading={loading}
             onRefresh={loadClients}
             onAuthClient={handleAuthClient}
             onAuthAll={handleAuthAll}
             onDelete={handleDeleteClient}
             onAddClient={() => setShowAddModal(true)}
           />
         )}
         
         {activeTab === 'orders' && (
           <OrdersTab 
             clients={clientsList}
             selectedClients={selectedClients}
             onToggleClient={toggleClientSelection}
             onPlaceOrder={() => setShowOrderModal(true)}
           />
         )}
         
         {activeTab === 'logs' && <LogsTab/>}
       </main>
 
       {showAddModal && (
         <AddClientModal 
           onClose={() => setShowAddModal(false)} 
           onSuccess={loadClients} 
         />
       )}
       
       {showOrderModal && (
         <OrderModal 
           selectedClients={Array.from(selectedClients)}
           clients={clients}
           onClose={() => setShowOrderModal(false)}
           onSuccess={(log) => {
             addTradeLog(log);
             setShowOrderModal(false);
             setActiveTab('logs'); // Auto-switch to logs tab
           }}
         />
       )}
     </div>
   );
};