import React from 'react';
import { getSchools, getLessons, getPayments } from '../utils/storage';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    ]
  },
  {
    section: 'Management',
    items: [
      { id: 'schedule', label: 'Weekly Schedule', icon: 'clock' },
      { id: 'schools', label: 'Schools', icon: 'building' },
      { id: 'teachers', label: 'Teachers', icon: 'users' },
      { id: 'payments', label: 'Payments', icon: 'dollar' },
    ]
  },
  {
    section: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ]
  }
];

function NavIcon({ name }) {
  const icons = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
  };

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function Sidebar({ currentPage, onNavigate, isOpen, settings }) {
  const payments = getPayments();
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">♪</div>
          <div>
            <h1>MelodyManager</h1>
            <span>{settings?.businessName || 'Music Teaching'}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(section => (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <NavIcon name={item.icon} />
                {item.label}
                {item.id === 'payments' && pendingPayments > 0 && (
                  <span className="nav-badge">{pendingPayments}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          MelodyManager v1.0
        </div>
      </div>
    </aside>
  );
}
