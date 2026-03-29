import React, { useState } from 'react';
import { getSchools, getLessons, addLesson, updateLesson, deleteLesson, getTeachers } from '../utils/storage';
import Modal from '../components/Modal';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCY_LABELS = {
  weekly: 'Every Week',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
};

export default function SchedulePage({ onRefresh }) {
  const schools = getSchools();
  const lessons = getLessons();
  const teachers = getTeachers();
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const today = new Date();
  const todayDow = today.getDay();

  const [form, setForm] = useState({
    schoolId: '',
    teacherId: '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    rate: '',
    frequency: 'weekly',
    startDate: today.toISOString().split('T')[0],
  });

  const openAdd = (dow = 0) => {
    setForm({
      schoolId: schools[0]?.id || '',
      teacherId: '',
      dayOfWeek: dow,
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      rate: '',
      frequency: 'weekly',
      startDate: today.toISOString().split('T')[0],
    });
    setEditingLesson(null);
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setForm({
      schoolId: lesson.schoolId,
      teacherId: lesson.teacherId || '',
      dayOfWeek: lesson.dayOfWeek,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      notes: lesson.notes || '',
      rate: lesson.rate || '',
      frequency: lesson.frequency || 'weekly',
      startDate: lesson.startDate || today.toISOString().split('T')[0],
    });
    setEditingLesson(lesson);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.schoolId) return;
    if (editingLesson) {
      updateLesson(editingLesson.id, form);
    } else {
      addLesson(form);
    }
    setShowModal(false);
    onRefresh();
  };

  const handleDelete = (id) => {
    if (confirm('Remove this lesson from the schedule?')) {
      deleteLesson(id);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Weekly Schedule</h2>
          <p className="page-header-subtitle">Your recurring teaching schedule</p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd(todayDow)}>
          + Add Lesson
        </button>
      </div>

      {/* Week View */}
      <div className="week-view">
        {DAY_NAMES.map((name, dow) => {
          const dayLessons = lessons
            .filter(l => l.dayOfWeek === dow)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isToday = dow === todayDow;
          const isShabbat = dow === 6;

          return (
            <div className={`week-day-col ${isToday ? 'today-col' : ''}`} key={dow}>
              <div className={`week-day-name ${isToday ? 'today-name' : ''}`}>
                {name}
                {isToday && <span style={{ fontSize: 10, display: 'block', color: 'var(--bg-accent)' }}>Today</span>}
                {isShabbat && <span style={{ fontSize: 10, display: 'block', color: 'var(--shabbat-color)' }}>Shabbat</span>}
              </div>

              {dayLessons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openAdd(dow)}
                    style={{ fontSize: 12 }}
                  >
                    + Add
                  </button>
                </div>
              ) : (
                <>
                  {dayLessons.map(lesson => {
                    const school = schools.find(s => s.id === lesson.schoolId);
                    const teacher = teachers.find(t => t.id === lesson.teacherId);
                    const freq = lesson.frequency || 'weekly';
                    return (
                      <div className="lesson-card" key={lesson.id} onClick={() => openEdit(lesson)}>
                        <div className="lesson-time">{lesson.startTime} - {lesson.endTime}</div>
                        <div className="lesson-school">{school?.name || 'Unknown'}</div>
                        {teacher && <div className="lesson-details">Teacher: {teacher.name}</div>}
                        {lesson.rate && <div className="lesson-details">${lesson.rate}/lesson</div>}
                        {freq !== 'weekly' && (
                          <div className="lesson-details" style={{ color: 'var(--bg-accent)', fontWeight: 500 }}>
                            {FREQUENCY_LABELS[freq]}
                          </div>
                        )}
                        {lesson.notes && <div className="lesson-details">{lesson.notes}</div>}
                      </div>
                    );
                  })}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openAdd(dow)}
                    style={{ fontSize: 11, width: '100%', marginTop: 4, justifyContent: 'center' }}
                  >
                    + Add
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>Schedule Summary</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>School</th>
                <th>Time</th>
                <th>Frequency</th>
                <th>Teacher</th>
                <th>Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>No lessons scheduled yet. Click "+ Add Lesson" to get started.</td></tr>
              ) : (
                lessons
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
                  .map(lesson => {
                    const school = schools.find(s => s.id === lesson.schoolId);
                    const teacher = teachers.find(t => t.id === lesson.teacherId);
                    const freq = lesson.frequency || 'weekly';
                    return (
                      <tr key={lesson.id}>
                        <td><span className="badge badge-purple">{DAY_NAMES[lesson.dayOfWeek]}</span></td>
                        <td style={{ fontWeight: 500 }}>{school?.name || 'Unknown'}</td>
                        <td>{lesson.startTime} - {lesson.endTime}</td>
                        <td><span className="badge badge-info">{FREQUENCY_LABELS[freq]}</span></td>
                        <td>{teacher?.name || '-'}</td>
                        <td>{lesson.rate ? `$${lesson.rate}` : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(lesson)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lesson.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editingLesson ? 'Edit Lesson' : 'Add Recurring Lesson'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">School *</label>
            <select
              className="form-select"
              value={form.schoolId}
              onChange={e => setForm({ ...form, schoolId: e.target.value })}
            >
              <option value="">Select a school...</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {schools.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--bg-danger)', marginTop: 4 }}>
                Please add a school first in the Schools page.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Teacher (optional)</label>
            <select
              className="form-select"
              value={form.teacherId}
              onChange={e => setForm({ ...form, teacherId: e.target.value })}
            >
              <option value="">No specific teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Day of Week *</label>
            <select
              className="form-select"
              value={form.dayOfWeek}
              onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}{i === 6 ? ' (Shabbat)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Frequency *</label>
            <select
              className="form-select"
              value={form.frequency}
              onChange={e => setForm({ ...form, frequency: e.target.value })}
            >
              <option value="weekly">Every Week</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Once a Month (same week)</option>
            </select>
          </div>

          {form.frequency !== 'weekly' && (
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                {form.frequency === 'biweekly'
                  ? 'Lessons will repeat every 2 weeks starting from this date.'
                  : 'Lessons will repeat on the same week of each month (e.g., 1st Monday).'}
              </p>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="time"
                className="form-input"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="time"
                className="form-input"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rate per Lesson ($)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 75"
              value={form.rate}
              onChange={e => setForm({ ...form, rate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Room number, special instructions, etc."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            {editingLesson && (
              <button className="btn btn-danger" onClick={() => { handleDelete(editingLesson.id); setShowModal(false); }} style={{ marginRight: 'auto' }}>
                Delete
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.schoolId}>
              {editingLesson ? 'Update' : 'Add Lesson'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
