import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/api';

const STATUS_COLORS = {
  SCHEDULED: 'badge-blue', CONFIRMED: 'badge-teal', IN_PROGRESS: 'badge-amber',
  COMPLETED: 'badge-green', CANCELLED: 'badge-red', NO_SHOW: 'badge-gray',
};
const STATUSES = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const EMPTY = { patientId: '', doctorId: '', scheduledAt: '', duration: 30, reason: '', notes: '' };

export default function AppointmentsPage() {
  const [data, setData] = useState({ appointments: [], total: 0, page: 1, pages: 1 });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAppts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 10,
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterDate && { date: filterDate }),
      });
      const res = await API.get(`/appointments?${params}`);
      setData(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterDate]);

  useEffect(() => { fetchAppts(); }, [fetchAppts]);

  useEffect(() => {
    API.get('/patients?limit=200').then(r => setPatients(r.data.data.patients)).catch(() => {});
    API.get('/doctors?limit=100').then(r => setDoctors(r.data.data.doctors)).catch(() => {});
  }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setSelected(null); setModal('add'); };
  const openEdit = (a) => {
    setSelected(a);
    // Convert UTC to local datetime-local string
    const localDT = new Date(a.scheduledAt);
    const pad = n => String(n).padStart(2, '0');
    const localStr = `${localDT.getFullYear()}-${pad(localDT.getMonth()+1)}-${pad(localDT.getDate())}T${pad(localDT.getHours())}:${pad(localDT.getMinutes())}`;
    setForm({
      patientId: a.patientId, doctorId: a.doctorId,
      scheduledAt: localStr,
      duration: a.duration, reason: a.reason || '', notes: a.notes || '',
      status: a.status, diagnosis: a.diagnosis || '', prescription: a.prescription || '',
    });
    setError(''); setModal('edit');
  };
  const openView = (a) => { setSelected(a); setModal('view'); };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await API.post('/appointments', form);
      else await API.put(`/appointments/${selected.id}`, form);
      setModal(null); fetchAppts();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const cancelAppt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await API.patch(`/appointments/${id}/cancel`); fetchAppts(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage bookings & schedules • {data.total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Book Appointment</button>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search by patient name or ID..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="select" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <input className="input" type="date" style={{ maxWidth: 180 }} value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(1); }} />
        {filterDate && <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>✕ Clear date</button>}
        <button className="btn btn-secondary btn-sm" onClick={() => { setFilterDate(today); setPage(1); }}>Today</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><span className="spinner" /><span>Loading appointments...</span></div>
        ) : data.appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No appointments found</h3>
            <p>Book a new appointment to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Patient</th><th>Doctor</th><th>Date & Time</th>
                  <th>Duration</th><th>Status</th><th>Reason</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.appointments.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--teal)' }}>{a.appointmentId?.slice(0, 8)}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.patient.firstName} {a.patient.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.patient.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.doctor.specialization?.name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{a.duration} min</td>
                    <td><span className={`badge ${STATUS_COLORS[a.status] || 'badge-gray'}`}>{a.status}</span></td>
                    <td style={{ maxWidth: 160 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {a.reason || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openView(a)}>👁</button>
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>✏️</button>
                        )}
                        {a.status === 'SCHEDULED' || a.status === 'CONFIRMED' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => cancelAppt(a.id)}>✕</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.pages > 1 && (
          <div className="pagination" style={{ padding: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {data.page} of {data.pages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Book / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                {modal === 'add' ? '📅 Book Appointment' : '✏️ Edit Appointment'}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select className="select" name="patientId" value={form.patientId} onChange={handle} required>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} – {p.phone}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Doctor *</label>
                    <select className="select" name="doctorId" value={form.doctorId} onChange={handle} required>
                      <option value="">Select doctor...</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName} – {d.specialization?.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Date & Time *</label>
                    <input className="input" name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={handle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <select className="select" name="duration" value={form.duration} onChange={handle}>
                      {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Visit</label>
                  <input className="input" name="reason" value={form.reason} onChange={handle} placeholder="Chief complaint..." />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="textarea" name="notes" value={form.notes} onChange={handle} rows={2} placeholder="Additional notes..." />
                </div>

                {modal === 'edit' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="select" name="status" value={form.status} onChange={handle}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Diagnosis</label>
                      <textarea className="textarea" name="diagnosis" value={form.diagnosis} onChange={handle} rows={2} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prescription</label>
                      <textarea className="textarea" name="prescription" value={form.prescription} onChange={handle} rows={2} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" />Saving...</> : modal === 'add' ? '📅 Book' : '💾 Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Appointment Details</h3>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--teal)' }}>{selected.appointmentId}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  ['Patient', `${selected.patient?.firstName} ${selected.patient?.lastName}`],
                  ['Doctor', `Dr. ${selected.doctor?.user?.firstName} ${selected.doctor?.user?.lastName}`],
                  ['Specialization', selected.doctor?.specialization?.name || '—'],
                  ['Date', new Date(selected.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                  ['Time', new Date(selected.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })],
                  ['Duration', `${selected.duration} minutes`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              {[['Reason', selected.reason], ['Notes', selected.notes], ['Diagnosis', selected.diagnosis], ['Prescription', selected.prescription]]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k}</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{v}</p>
                  </div>
                ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
              {selected.status !== 'CANCELLED' && selected.status !== 'COMPLETED' && (
                <button className="btn btn-primary" onClick={() => { setModal(null); setTimeout(() => openEdit(selected), 50); }}>✏️ Edit</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
