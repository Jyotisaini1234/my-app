import React, { useState, useEffect } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close sidebar on mobile when navigating
  const handleNavigate = (page: NavPage) => {
    onNavigate(page);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  // Close on outside click (mobile overlay)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(e.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarOpen]);

  return (
    <div className={`layout ${sidebarCollapsed ? 'layout--collapsed' : ''} ${sidebarOpen ? 'layout--sidebar-open' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="layout__overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={sidebarOpen}
      />

      <div className="layout__right">
        <Navbar
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="layout__main">
          {children}
        </main>
      </div>
    </div>
  );
};