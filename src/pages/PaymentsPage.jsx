import React, { useState } from 'react';
import { getPayments, addPayment, updatePayment, deletePayment, getSchools, getTeachers } from '../utils/storage';
import Modal from '../components/Modal';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PaymentsPage({ onRefresh }) {
  const payments = getPayments();
  const schools = getSchools();
  const teachers = getTeachers();
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'incoming' (from schools) or 'outgoing' (to teachers)

  const [form, setForm] = useState({
    type: 'incoming',
    schoolId: '',
    teacherId: '',
    amount: '',
    status: 'pending',
    dueDate: '',
    paidDate: '',
    description: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const openAdd = () => {
    setForm({
      type: 'incoming',
      schoolId: schools[0]?.id || '',
      teacherId: '',
      amount: '',
      status: 'pending',
      dueDate: '',
      paidDate: '',
      description: '',
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    });
    setEditingPayment(null);
    setShowModal(true);
  };

  const openEdit = (payment) => {
    setForm({
      type: payment.type || 'incoming',
      schoolId: payment.schoolId || '',
      teacherId: payment.teacherId || '',
      amount: payment.amount || '',
      status: payment.status || 'pending',
      dueDate: payment.dueDate || '',
      paidDate: payment.paidDate || '',
      description: payment.description || '',
      month: payment.month ?? new Date().getMonth(),
      year: payment.year ?? new Date().getFullYear(),
    });
    setEditingPayment(payment);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.amount) return;
    if (editingPayment) {
      updatePayment(editingPayment.id, form);
    } else {
      addPayment(form);
    }
    setShowModal(false);
    onRefresh();
  };

  const handleDelete = (id) => {
    if (confirm('Delete this payment record?')) {
      deletePayment(id);
      onRefresh();
    }
  };

  const markAsPaid = (id) => {
    updatePayment(id, { status: 'paid', paidDate: new Date().toISOString().split('T')[0] });
    onRefresh();
  };

  // Filter payments
  let filtered = payments;
  if (filterStatus !== 'all') filtered = filtered.filter(p => p.status === filterStatus);
  if (filterType !== 'all') filtered = filtered.filter(p => (p.type || 'incoming') === filterType);
  filtered.sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.createdAt || '').localeCompare(a.createdAt || ''));

  // Stats
  const incomingPaid = payments.filter(p => (p.type || 'incoming') === 'incoming' && p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const incomingPending = payments.filter(p => (p.type || 'incoming') === 'incoming' && p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const outgoingPaid = payments.filter(p => p.type === 'outgoing' && p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const outgoingPending = payments.filter(p => p.type === 'outgoing' && p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payments</h2>
          <p className="page-header-subtitle">Track income from schools and payments to teachers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Payment</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
          </div>
          <div className="stat-info">
            <h3>${incomingPaid.toLocaleString()}</h3>
            <p>Income Received</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="stat-info">
            <h3>${incomingPending.toLocaleString()}</h3>
            <p>Income Pending{overdueCount > 0 ? ` (${overdueCount} overdue)` : ''}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className="stat-info">
            <h3>${outgoingPaid.toLocaleString()}</h3>
            <p>Paid to Teachers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-info">
            <h3>${(incomingPaid - outgoingPaid).toLocaleString()}</h3>
            <p>Net Profit</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            {[['all', 'All'], ['incoming', 'From Schools'], ['outgoing', 'To Teachers']].map(([val, label]) => (
              <button key={val} className={`tab ${filterType === val ? 'active' : ''}`} onClick={() => setFilterType(val)}>{label}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {['all', 'pending', 'paid', 'overdue'].map(status => (
              <button key={status} className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>School / Teacher</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>No payments found.</td></tr>
              ) : (
                filtered.map(payment => {
                  const school = schools.find(s => s.id === payment.schoolId);
                  const teacher = teachers.find(t => t.id === payment.teacherId);
                  const isIncoming = (payment.type || 'incoming') === 'incoming';

                  return (
                    <tr key={payment.id}>
                      <td>
                        <span className={`badge ${isIncoming ? 'badge-success' : 'badge-info'}`}>
                          {isIncoming ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {isIncoming ? (school?.name || '-') : (teacher?.name || '-')}
                      </td>
                      <td>{MONTHS[payment.month]} {payment.year}</td>
                      <td style={{ fontWeight: 600, color: isIncoming ? 'var(--bg-success)' : 'var(--bg-danger)' }}>
                        {isIncoming ? '+' : '-'}${Number(payment.amount).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${payment.status === 'paid' ? 'badge-success' : payment.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {payment.dueDate || '-'}
                        {payment.paidDate && <div style={{ fontSize: 11, color: 'var(--bg-success)' }}>Paid: {payment.paidDate}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {payment.status !== 'paid' && (
                            <button className="btn btn-sm" style={{ background: 'var(--bg-success-light)', color: 'var(--bg-success)' }} onClick={() => markAsPaid(payment.id)}>
                              Mark Paid
                            </button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(payment)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(payment.id)}>Delete</button>
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
        <Modal title={editingPayment ? 'Edit Payment' : 'Add Payment'} onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Payment Type *</label>
            <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="incoming">Income (from School)</option>
              <option value="outgoing">Expense (to Teacher)</option>
            </select>
          </div>

          {form.type === 'incoming' ? (
            <div className="form-group">
              <label className="form-label">School</label>
              <select className="form-select" value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}>
                <option value="">Select school...</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Teacher</label>
              <select className="form-select" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">Select teacher...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Month</label>
              <select className="form-select" value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input type="number" className="form-input" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount ($) *</label>
              <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Paid Date</label>
              <input type="date" className="form-input" value={form.paidDate} onChange={e => setForm({ ...form, paidDate: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Payment details, invoice number, etc." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="modal-actions">
            {editingPayment && (
              <button className="btn btn-danger" onClick={() => { handleDelete(editingPayment.id); setShowModal(false); }} style={{ marginRight: 'auto' }}>Delete</button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.amount}>
              {editingPayment ? 'Update' : 'Add Payment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
