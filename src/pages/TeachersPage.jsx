import React, { useState } from 'react';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, getLessons, getSchools, getPayments } from '../utils/storage';
import Modal from '../components/Modal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TeachersPage({ onRefresh }) {
  const teachers = getTeachers();
  const lessons = getLessons();
  const schools = getSchools();
  const payments = getPayments();
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    instrument: '',
    hourlyRate: '',
    notes: '',
  });

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', instrument: '', hourlyRate: '', notes: '' });
    setEditingTeacher(null);
    setShowModal(true);
  };

  const openEdit = (teacher) => {
    setForm({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      instrument: teacher.instrument || '',
      hourlyRate: teacher.hourlyRate || '',
      notes: teacher.notes || '',
    });
    setEditingTeacher(teacher);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, form);
    } else {
      addTeacher(form);
    }
    setShowModal(false);
    onRefresh();
  };

  const handleDelete = (id) => {
    if (confirm('Delete this teacher?')) {
      deleteTeacher(id);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Teachers</h2>
          <p className="page-header-subtitle">Manage your teaching staff</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>
      </div>

      {teachers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <h3>No Teachers Yet</h3>
            <p>Add teachers to assign them to lessons and track their payments.</p>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {teachers.map(teacher => {
            const teacherLessons = lessons.filter(l => l.teacherId === teacher.id);
            const teacherPayments = payments.filter(p => p.teacherId === teacher.id);
            const totalPaid = teacherPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
            const totalPending = teacherPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);

            return (
              <div className="card" key={teacher.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 50, background: 'var(--bg-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-accent)', fontWeight: 700, fontSize: 20 }}>
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{teacher.name}</div>
                    {teacher.instrument && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{teacher.instrument}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon" onClick={() => openEdit(teacher)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(teacher.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span className="badge badge-purple">{teacherLessons.length} lessons/week</span>
                  {teacher.hourlyRate && <span className="badge badge-success">${teacher.hourlyRate}/hr</span>}
                </div>

                {teacherLessons.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {teacherLessons.map(l => {
                      const school = schools.find(s => s.id === l.schoolId);
                      return (
                        <div key={l.id} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '3px 0' }}>
                          {DAY_NAMES[l.dayOfWeek]} {l.startTime}-{l.endTime} @ {school?.name || 'Unknown'}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--bg-success)' }}>Paid: ${totalPaid}</span>
                  <span style={{ color: totalPending > 0 ? 'var(--bg-danger)' : 'var(--text-tertiary)' }}>
                    Pending: ${totalPending}
                  </span>
                </div>

                {teacher.phone && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                    {teacher.phone} {teacher.email && ` · ${teacher.email}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" placeholder="Teacher name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Instrument / Specialty</label>
            <input className="form-input" placeholder="e.g., Piano, Violin, Voice" value={form.instrument} onChange={e => setForm({ ...form, instrument: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="teacher@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Hourly Rate ($)</label>
            <input type="number" className="form-input" placeholder="e.g., 50" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Certifications, availability, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="modal-actions">
            {editingTeacher && (
              <button className="btn btn-danger" onClick={() => { handleDelete(editingTeacher.id); setShowModal(false); }} style={{ marginRight: 'auto' }}>Delete</button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
              {editingTeacher ? 'Update' : 'Add Teacher'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
