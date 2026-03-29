import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import SchedulePage from './pages/SchedulePage';
import SchoolsPage from './pages/SchoolsPage';
import TeachersPage from './pages/TeachersPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import { getSettings, saveSettings } from './utils/storage';
import { startNotificationChecker, requestNotificationPermission } from './utils/notifications';
import * as storage from './utils/storage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [settings, setSettings] = useState(getSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Request notification permission on mount
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, []);

  // Start notification checker
  useEffect(() => {
    const interval = startNotificationChecker(
      storage.getLessons,
      storage.getSchools,
      () => settings
    );
    return () => clearInterval(interval);
  }, [settings]);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    saveSettings(merged);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onNavigate={setCurrentPage} />;
      case 'calendar':
        return <CalendarPage key={refreshKey} />;
      case 'schedule':
        return <SchedulePage key={refreshKey} onRefresh={refresh} />;
      case 'schools':
        return <SchoolsPage key={refreshKey} onRefresh={refresh} />;
      case 'teachers':
        return <TeachersPage key={refreshKey} onRefresh={refresh} />;
      case 'payments':
        return <PaymentsPage key={refreshKey} onRefresh={refresh} />;
      case 'settings':
        return <SettingsPage settings={settings} updateSettings={updateSettings} />;
      default:
        return <Dashboard key={refreshKey} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-layout">
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        settings={settings}
      />

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
