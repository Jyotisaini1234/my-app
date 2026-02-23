import React from 'react';
import { ClientsList } from '../../components/ClientList/ClientsList/ClientsList';
import { NavPage } from '../../types/type';

interface ClientManagementPageProps {
  onNavigate: (page: NavPage) => void;
}

export const ClientManagementPage: React.FC<ClientManagementPageProps> = ({ onNavigate }) => {
  return <ClientsList onNavigate={onNavigate} />;
};