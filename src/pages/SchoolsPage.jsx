import React, { useState } from 'react';
import { getSchools, addSchool, updateSchool, deleteSchool, getLessons, getPayments, addNote, getNotes, deleteNote } from '../utils/storage';
import Modal from '../components/Modal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchoolsPage({ onRefresh }) {
  const schools = getSchools();
  const lessons = getLessons();
  const payments = getPayments();
  const notes = getNotes();
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    color: '#6c5ce7',
  });

  const openAdd = () => {
    setForm({ name: '', address: '', contactName: '', contactEmail: '', contactPhone: '', notes: '', color: '#6c5ce7' });
    setEditingSchool(null);
    setShowModal(true);
  };

  const openEdit = (school) => {
    setForm({
      name: school.name || '',
      address: school.address || '',
      contactName: school.contactName || '',
      contactEmail: school.contactEmail || '',
      contactPhone: school.contactPhone || '',
      notes: school.notes || '',
      color: school.color || '#6c5ce7',
    });
    setEditingSchool(school);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingSchool) {
      updateSchool(editingSchool.id, form);
    } else {
      addSchool(form);
    }
    setShowModal(false);
    onRefresh();
  };

  const handleDelete = (id) => {
    if (confirm('Delete this school? This will also remove all related lessons.')) {
      deleteSchool(id);
      onRefresh();
    }
  };

  const handleAddNote = (schoolId) => {
    if (!newNote.trim()) return;
    addNote({ schoolId, text: newNote });
    setNewNote('');
    onRefresh();
  };

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Schools</h2>
          <p className="page-header-subtitle">Manage the schools you teach at</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Search schools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add School</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/>
            </svg>
            <h3>No Schools Yet</h3>
            <p>Add your first school to start tracking lessons and payments.</p>
            <button className="btn btn-primary" onClick={openAdd}>+ Add School</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(school => {
            const schoolLessons = lessons.filter(l => l.schoolId === school.id);
            const schoolPayments = payments.filter(p => p.schoolId === school.id);
            const totalPaid = schoolPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
            const totalOwed = schoolPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);

            return (
              <div className="card" key={school.id} style={{ cursor: 'pointer' }} onClick={() => setShowDetailModal(school)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: school.color || 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
                    {school.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{school.name}</div>
                    {school.address && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{school.address}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); openEdit(school); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span className="badge badge-purple">{schoolLessons.length} lessons/week</span>
                  {schoolLessons.map(l => (
                    <span className="badge badge-info" key={l.id} style={{ fontSize: 10 }}>
                      {DAY_NAMES[l.dayOfWeek]} {l.startTime}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--bg-success)' }}>Paid: ${totalPaid}</span>
                  <span style={{ color: totalOwed > 0 ? 'var(--bg-danger)' : 'var(--text-tertiary)' }}>Owed: ${totalOwed}</span>
                </div>

                {school.contactName && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Contact: {school.contactName} {school.contactPhone && `- ${school.contactPhone}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editingSchool ? 'Edit School' : 'Add School'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">School Name *</label>
            <input className="form-input" placeholder="e.g., Beth Israel Day School" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" placeholder="123 Main St, City, State" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input className="form-input" placeholder="Principal/Coordinator" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="form-input" placeholder="(555) 123-4567" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input className="form-input" type="email" placeholder="admin@school.edu" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: 50, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="modal-actions">
            {editingSchool && (
              <button className="btn btn-danger" onClick={() => { handleDelete(editingSchool.id); setShowModal(false); }} style={{ marginRight: 'auto' }}>Delete</button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
              {editingSchool ? 'Update' : 'Add School'}
            </button>
          </div>
        </Modal>
      )}

      {/* School Detail Modal */}
      {showDetailModal && (
        <Modal title={showDetailModal.name} onClose={() => setShowDetailModal(null)} width="600px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Address</div>
              <div style={{ fontSize: 14 }}>{showDetailModal.address || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Contact</div>
              <div style={{ fontSize: 14 }}>{showDetailModal.contactName || '-'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{showDetailModal.contactPhone}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{showDetailModal.contactEmail}</div>
            </div>
          </div>

          {/* Schedule */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Weekly Schedule</h4>
            {lessons.filter(l => l.schoolId === showDetailModal.id).length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No lessons scheduled at this school.</p>
            ) : (
              lessons.filter(l => l.schoolId === showDetailModal.id).map(l => (
                <div className="lesson-card" key={l.id}>
                  <div className="lesson-time">{DAY_NAMES[l.dayOfWeek]}: {l.startTime} - {l.endTime}</div>
                  {l.rate && <div className="lesson-details">${l.rate}/lesson</div>}
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Notes</h4>
            {showDetailModal.notes && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
                {showDetailModal.notes}
              </div>
            )}
            <div className="notes-list">
              {notes.filter(n => n.schoolId === showDetailModal.id).map(n => (
                <div className="note-item" key={n.id}>
                  <span className="note-text">{n.text}</span>
                  <span className="note-date">{new Date(n.createdAt).toLocaleDateString()}</span>
                  <button className="btn-icon" style={{ marginLeft: 8, border: 'none' }} onClick={() => { deleteNote(n.id); onRefresh(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="form-input" placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddNote(showDetailModal.id); }} />
              <button className="btn btn-primary btn-sm" onClick={() => handleAddNote(showDetailModal.id)}>Add</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
