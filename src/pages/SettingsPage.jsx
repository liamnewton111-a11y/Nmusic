import React from 'react';
import { requestNotificationPermission, sendTestNotification } from '../utils/notifications';
import { getLessons, getSchools } from '../utils/storage';

export default function SettingsPage({ settings, updateSettings }) {
  const handleThemeToggle = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please allow notifications in your browser settings to enable this feature.');
        return;
      }
    }
    updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      alert('Please allow notifications in your browser settings.');
      return;
    }
    sendTestNotification(getLessons(), getSchools());
  };

  const handleExportData = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('mm_')) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `melodymanager-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        alert('Data imported successfully! The page will reload.');
        window.location.reload();
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      if (confirm('This will permanently erase all schools, lessons, teachers, and payments. Continue?')) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key.startsWith('mm_')) localStorage.removeItem(key);
        }
        window.location.reload();
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="page-header-subtitle">Customize your MelodyManager experience</p>
        </div>
      </div>

      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Appearance */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Appearance</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Theme</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Currently using {settings.theme} mode
              </div>
            </div>
            <button className="theme-toggle" onClick={handleThemeToggle}>
              <span style={{ fontSize: 16 }}>{settings.theme === 'dark' ? '🌙' : '☀️'}</span>
              <div className={`toggle-track ${settings.theme === 'dark' ? 'active' : ''}`}>
                <div className="toggle-thumb"></div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {settings.theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Notifications</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Daily Morning Alert</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Get notified about your schedule each morning
              </div>
            </div>
            <button className="theme-toggle" onClick={handleNotificationToggle}>
              <div className={`toggle-track ${settings.notificationsEnabled ? 'active' : ''}`}>
                <div className="toggle-thumb"></div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {settings.notificationsEnabled ? 'On' : 'Off'}
              </span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Notification Time</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                When to send the daily schedule notification
              </div>
            </div>
            <input
              type="time"
              className="form-input"
              style={{ width: 120 }}
              value={settings.notificationTime || '07:00'}
              onChange={e => updateSettings({ notificationTime: e.target.value })}
            />
          </div>

          <div style={{ padding: '12px 0' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleTestNotification}>
              Send Test Notification
            </button>
          </div>
        </div>

        {/* Business */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Business</h3>

          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              className="form-input"
              value={settings.businessName || ''}
              onChange={e => updateSettings({ businessName: e.target.value })}
              placeholder="Your business name"
            />
          </div>
        </div>

        {/* Data */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Data Management</h3>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExportData}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Backup
            </button>

            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import Backup
              <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>

            <button className="btn btn-danger" onClick={handleClearData}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Clear All Data
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
            All data is stored locally in your browser. Export regularly to keep a backup.
          </div>
        </div>

        {/* About */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 12 }}>About MelodyManager</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            MelodyManager is a business management tool designed for Jewish music teachers.
            It features a Jewish calendar with all holidays, weekly recurring lesson scheduling,
            teacher and payment tracking, and daily notifications.
          </p>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
            Version 1.0 &middot; Built with ♪ and ❤️
          </div>
        </div>
      </div>
    </div>
  );
}
