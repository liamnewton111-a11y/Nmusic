import React, { useState } from 'react';
import { getSchools, getLessons, getClosedDates, addClosedDate, deleteClosedDate, isLessonPaid, markLessonPaid, markLessonUnpaid } from '../utils/storage';
import { getHebrewDateString, getHolidaysForMonth, isShabbat, isSchoolClosed, doesLessonOccurOnDate } from '../utils/jewishCalendar';
import Modal from '../components/Modal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [closedReason, setClosedReason] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [refreshKey, setRefreshKey] = useState(0);

  const schools = getSchools();
  const lessons = getLessons();
  const closedDates = getClosedDates();

  const holidays = getHolidaysForMonth(viewYear, viewMonth + 1);

  // Get the current week's dates
  const getWeekDates = () => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Build calendar grid for month view
  const buildMonthGrid = () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonth = new Date(viewYear, viewMonth, 0);
    const daysInPrevMonth = prevMonth.getDate();

    const calendarDays = [];

    for (let i = startDow - 1; i >= 0; i--) {
      calendarDays.push({ day: daysInPrevMonth - i, otherMonth: true, date: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      calendarDays.push(buildDayInfo(viewYear, viewMonth, d));
    }

    const remaining = 42 - calendarDays.length;
    for (let d = 1; d <= remaining; d++) {
      calendarDays.push({ day: d, otherMonth: true, date: null });
    }

    return calendarDays;
  };

  const buildDayInfo = (year, month, d) => {
    const dateObj = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayHolidays = holidays.filter(h => h.date === dateStr);
    // Filter lessons by frequency
    const dayLessons = lessons.filter(l => doesLessonOccurOnDate(l, dateStr));
    const hebrewStr = getHebrewDateString(dateObj);
    const closed = isSchoolClosed(dateStr, closedDates);
    const isToday = dateObj.toDateString() === today.toDateString();
    const shabbat = isShabbat(dateObj);

    return {
      day: d,
      otherMonth: false,
      date: dateStr,
      dateObj,
      holidays: dayHolidays,
      lessons: dayLessons,
      hebrewDate: hebrewStr,
      closed,
      isToday,
      isShabbat: shabbat,
    };
  };

  const goToMonth = (offset) => {
    let newMonth = viewMonth + offset;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleDayClick = (dayInfo) => {
    if (dayInfo.otherMonth || !dayInfo.date) return;
    setSelectedDate(dayInfo);
  };

  const handleAddClosedDate = () => {
    if (!selectedDate) return;
    addClosedDate({ date: selectedDate.date, reason: closedReason || 'School Closed' });
    setShowClosedModal(false);
    setClosedReason('');
    setSelectedDate(null);
  };

  const handleRemoveClosedDate = (dateStr) => {
    const entry = closedDates.find(d => d.date === dateStr);
    if (entry) deleteClosedDate(entry.id);
    setSelectedDate(null);
  };

  const toggleLessonPaid = (lessonId, dateStr) => {
    if (isLessonPaid(lessonId, dateStr)) {
      markLessonUnpaid(lessonId, dateStr);
    } else {
      markLessonPaid(lessonId, dateStr);
    }
    setRefreshKey(k => k + 1);
  };

  const renderDayCell = (dayInfo, large = false) => {
    if (dayInfo.otherMonth) {
      return (
        <div className={`calendar-day other-month ${large ? 'calendar-day-large' : ''}`} key={dayInfo.day + '_other'}>
          <div className="day-number">{dayInfo.day}</div>
        </div>
      );
    }

    return (
      <div
        className={`calendar-day ${large ? 'calendar-day-large' : ''} ${dayInfo.isToday ? 'today' : ''} ${dayInfo.isShabbat ? 'shabbat' : ''} ${dayInfo.holidays?.some(h => h.type === 'jewish') ? 'holiday' : ''} ${dayInfo.closed?.closed && !dayInfo.isShabbat ? 'school-closed' : ''}`}
        onClick={() => !large && handleDayClick(dayInfo)}
      >
        <div className="day-number">{dayInfo.day}</div>
        {dayInfo.hebrewDate && (
          <div className="hebrew-date">{dayInfo.hebrewDate}</div>
        )}
        <div className="day-events">
          {dayInfo.holidays?.map((h, hi) => (
            <div key={hi} className={`day-event ${h.type === 'jewish' ? 'holiday-event' : 'american-holiday'}`}>
              {h.name}
            </div>
          ))}
          {large ? (
            // In week view, show each lesson individually with paid toggle
            dayInfo.lessons?.map(lesson => {
              if (dayInfo.closed?.closed) return null;
              const school = schools.find(s => s.id === lesson.schoolId);
              const paid = isLessonPaid(lesson.id, dayInfo.date);
              return (
                <div
                  key={lesson.id}
                  className={`day-event lesson ${paid ? 'lesson-paid' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLessonPaid(lesson.id, dayInfo.date);
                  }}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  title={paid ? 'Click to mark as unpaid' : 'Click to mark as paid'}
                >
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{paid ? '\u2705' : '\u23F3'}</span>
                  <span>{lesson.startTime} - {school?.name || 'Unknown'}</span>
                  {lesson.rate && <span style={{ marginLeft: 'auto', opacity: 0.7 }}>${lesson.rate}</span>}
                </div>
              );
            })
          ) : (
            dayInfo.lessons?.length > 0 && !dayInfo.closed?.closed && (
              <div className="day-event lesson">
                {dayInfo.lessons.length} lesson{dayInfo.lessons.length > 1 ? 's' : ''}
              </div>
            )
          )}
          {dayInfo.closed?.closed && !dayInfo.isShabbat && (
            <div className="day-event" style={{ background: 'var(--bg-danger-light)', color: 'var(--bg-danger)', fontSize: 9 }}>
              Closed
            </div>
          )}
        </div>
      </div>
    );
  };

  const weekDates = getWeekDates();

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Calendar</h2>
          <p className="page-header-subtitle">Jewish & American holidays with your teaching schedule</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--shabbat-light)', border: '1px solid var(--shabbat-color)' }}></div> Shabbat
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--jewish-gold-light)', border: '1px solid var(--jewish-gold)' }}></div> Jewish Holiday
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-info-light)', border: '1px solid var(--bg-info)' }}></div> American Holiday
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-accent-light)', border: '1px solid var(--bg-accent)' }}></div> Lesson
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 14 }}>{'\u2705'}</span> Paid
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: 14 }}>{'\u23F3'}</span> Unpaid
        </div>
      </div>

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              This Week
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Click on a lesson to mark it as paid
            </p>
          </div>

          <div className="calendar-grid calendar-grid-week">
            {DAY_NAMES_FULL.map(d => (
              <div className="calendar-day-header" key={d}>{d}</div>
            ))}

            {weekDates.map((date, i) => {
              const y = date.getFullYear();
              const m = date.getMonth();
              const d = date.getDate();
              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

              // Get holidays for this specific date's month
              const allHolidays = getHolidaysForMonth(y, m + 1);
              const dayHolidays = allHolidays.filter(h => h.date === dateStr);
              const dayLessons = lessons.filter(l => doesLessonOccurOnDate(l, dateStr));
              const hebrewStr = getHebrewDateString(date);
              const closed = isSchoolClosed(dateStr, closedDates);
              const isToday = date.toDateString() === today.toDateString();
              const shabbat = isShabbat(date);

              const dayInfo = {
                day: d,
                otherMonth: false,
                date: dateStr,
                dateObj: date,
                holidays: dayHolidays,
                lessons: dayLessons,
                hebrewDate: hebrewStr,
                closed,
                isToday,
                isShabbat: shabbat,
              };

              return renderDayCell(dayInfo, true);
            })}
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => goToMonth(-1)}>
              &larr; Previous
            </button>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => goToMonth(1)}>
              Next &rarr;
            </button>
          </div>

          <div className="calendar-grid">
            {DAY_NAMES.map(d => (
              <div className="calendar-day-header" key={d}>{d}</div>
            ))}

            {buildMonthGrid().map((dayInfo, i) => (
              <div key={i}>{renderDayCell(dayInfo, false)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Day Detail Modal (month view clicks) */}
      {selectedDate && (
        <Modal title={`${MONTH_NAMES[viewMonth]} ${selectedDate.day}, ${viewYear}`} onClose={() => setSelectedDate(null)}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--jewish-gold)', fontSize: 14 }}>{selectedDate.hebrewDate}</span>
          </div>

          {selectedDate.isShabbat && (
            <div className="badge badge-shabbat" style={{ marginBottom: 12 }}>Shabbat</div>
          )}

          {selectedDate.holidays?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Holidays</h4>
              {selectedDate.holidays.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`badge ${h.type === 'jewish' ? 'badge-gold' : 'badge-info'}`}>{h.name}</span>
                  {h.noWork && <span className="badge badge-warning">No School</span>}
                </div>
              ))}
            </div>
          )}

          {selectedDate.lessons?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Lessons {selectedDate.closed?.closed ? '(Cancelled - School Closed)' : ''}
              </h4>
              {selectedDate.lessons.map(lesson => {
                const school = schools.find(s => s.id === lesson.schoolId);
                const paid = isLessonPaid(lesson.id, selectedDate.date);
                return (
                  <div className="lesson-card" key={lesson.id} style={selectedDate.closed?.closed ? { opacity: 0.5, textDecoration: 'line-through' } : {}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="lesson-time">{lesson.startTime} - {lesson.endTime}</div>
                        <div className="lesson-school">{school?.name || 'Unknown'}</div>
                        {lesson.rate && <div className="lesson-details">${lesson.rate}/lesson</div>}
                      </div>
                      {!selectedDate.closed?.closed && (
                        <button
                          className={`btn btn-sm ${paid ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => toggleLessonPaid(lesson.id, selectedDate.date)}
                          style={{ minWidth: 80 }}
                        >
                          {paid ? '\u2705 Paid' : 'Mark Paid'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedDate.closed?.closed && (
            <div style={{ padding: 12, background: 'var(--bg-danger-light)', borderRadius: 8, marginBottom: 12 }}>
              <strong style={{ color: 'var(--bg-danger)' }}>Closed:</strong>{' '}
              <span style={{ color: 'var(--text-primary)' }}>{selectedDate.closed.reason}</span>
            </div>
          )}

          <div className="modal-actions" style={{ justifyContent: 'flex-start', gap: 8 }}>
            {!selectedDate.closed?.closed && !selectedDate.isShabbat && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowClosedModal(true)}>
                Mark as Closed
              </button>
            )}
            {selectedDate.closed?.closed && !selectedDate.isShabbat && !selectedDate.holidays?.some(h => h.noWork) && (
              <button className="btn btn-sm btn-secondary" onClick={() => handleRemoveClosedDate(selectedDate.date)}>
                Remove Closing
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Mark Closed Modal */}
      {showClosedModal && (
        <Modal title="Mark Day as Closed" onClose={() => setShowClosedModal(false)} width="400px">
          <div className="form-group">
            <label className="form-label">Reason</label>
            <input
              className="form-input"
              placeholder="e.g., Snow day, School event..."
              value={closedReason}
              onChange={e => setClosedReason(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowClosedModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddClosedDate}>Mark Closed</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
