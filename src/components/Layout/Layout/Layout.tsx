import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Navbar } from '../Navbar/Navbar';
import { NavPage } from '../../../types/type';
import './Layout.scss';

interface LayoutProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activePage, onNavigate, children }) => {
  return (
    <div className="layout">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <Navbar activePage={activePage} />
      <main className="layout__main">
        {children}
      </main>
    </div>
  );
};