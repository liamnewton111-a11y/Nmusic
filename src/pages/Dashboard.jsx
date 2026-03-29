import React from 'react';
import { getSchools, getLessons, getPayments, getTeachers } from '../utils/storage';
import { getHebrewDateString, getHebrewDateStringEng, getUpcomingHolidays, getParsha } from '../utils/jewishCalendar';

export default function Dashboard({ onNavigate }) {
  const schools = getSchools();
  const lessons = getLessons();
  const payments = getPayments();
  const teachers = getTeachers();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Payment stats
  const totalOwed = payments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const overduePayments = payments.filter(p => p.status === 'overdue').length;

  // Hebrew date
  const hebrewDate = getHebrewDateStringEng(today);
  const hebrewDateHeb = getHebrewDateString(today);
  const parsha = getParsha(today);

  // Upcoming holidays
  const upcomingHolidays = getUpcomingHolidays(6);

  // Weekly lesson count
  const weeklyLessonCount = lessons.length;

  return (
    <div>
      {/* Today Banner - just dates, no lesson count */}
      <div className="today-banner">
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'}!</h3>
          <p>{dayNames[dayOfWeek]}, {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <div className="hebrew-today">{hebrewDateHeb}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{hebrewDate}</div>
          {dayOfWeek === 6 && parsha && <div style={{ marginTop: 6, fontSize: 14 }}>Shabbat Shalom! Parashat {parsha}</div>}
          {dayOfWeek === 5 && parsha && <div style={{ marginTop: 6, fontSize: 14 }}>Shabbat starts soon · Parashat {parsha}</div>}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigate('schools')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{schools.length}</h3>
            <p>Active Schools</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('schedule')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{weeklyLessonCount}</h3>
            <p>Weekly Lessons</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('payments')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>${totalPaid.toLocaleString()}</h3>
            <p>Total Collected</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('payments')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>${totalOwed.toLocaleString()}</h3>
            <p>Outstanding{overduePayments > 0 ? ` (${overduePayments} overdue)` : ''}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Holidays */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upcoming Holidays</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('calendar')}>Calendar</button>
        </div>
        <div className="holiday-list">
          {upcomingHolidays.map((h, i) => {
            const hDate = new Date(h.date + 'T12:00:00');
            const diffDays = Math.ceil((hDate - today) / (1000 * 60 * 60 * 24));
            return (
              <div className="holiday-item" key={i}>
                <div className={`holiday-dot ${h.type}`}></div>
                <div className="holiday-info">
                  <div className="holiday-name">{h.name}</div>
                  <div className="holiday-date-text">
                    {hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {diffDays === 0 ? ' (Today!)' : diffDays === 1 ? ' (Tomorrow)' : ` (in ${diffDays} days)`}
                  </div>
                </div>
                <div>
                  {h.noWork && <span className="badge badge-warning" style={{ fontSize: 10 }}>No School</span>}
                  <span className={`holiday-type ${h.type === 'jewish' ? 'badge badge-gold' : 'badge badge-info'}`} style={{ fontSize: 10 }}>
                    {h.type === 'jewish' ? 'Jewish' : 'American'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teachers Overview */}
      {teachers.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Teachers</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('teachers')}>Manage</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Instrument</th>
                  <th>Phone</th>
                  <th>Active Lessons</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => {
                  const teacherLessons = lessons.filter(l => l.teacherId === t.id);
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td>{t.instrument || '-'}</td>
                      <td>{t.phone || '-'}</td>
                      <td>
                        <span className="badge badge-purple">{teacherLessons.length} lessons/week</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
