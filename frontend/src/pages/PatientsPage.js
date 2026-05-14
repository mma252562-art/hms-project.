import React, { useEffect, useState, useCallback, useRef } from 'react';
import API from '../utils/api';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'MALE', address: '', bloodGroup: '', allergies: '', emergencyContact: '', emergencyPhone: '' };

export default function PatientsPage() {
  const [data, setData] = useState({ patients: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, ...(search && { search }) });
      const res = await API.get(`/patients?${params}`);
      setData(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const onSearchChange = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(''); setModal('add'); };
  const openEdit = (p) => {
    const { id, patientId, createdAt, updatedAt, _count, appointments, bills, ...rest } = p;
    setForm({ ...rest, dateOfBirth: rest.dateOfBirth?.split('T')[0] || '' });
    setEditId(id);
    setError('');
    setModal('edit');
  };
  const openView = async (p) => {
    try {
      const res = await API.get(`/patients/${p.id}`);
      setSelected(res.data.data);
      setModal('view');
    } catch { setSelected(p); setModal('view'); }
  };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await API.post('/patients', form);
      else await API.put(`/patients/${editId}`, form);
      setModal(null); fetchPatients();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this patient?')) return;
    try { await API.delete(`/patients/${id}`); fetchPatients(); } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient records • {data.total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Add Patient</button>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search by name, email, phone, ID..." defaultValue={search}
            onChange={e => onSearchChange(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><span className="spinner" /><span>Loading patients...</span></div>
        ) : data.patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No patients found</h3>
            <p>Try adjusting your search or add a new patient.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th><th>Name</th><th>Contact</th><th>DOB / Gender</th><th>Blood</th><th>Appts</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--teal)' }}>{p.patientId?.slice(0, 8)}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.email || '—'}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.phone}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'} / {p.gender}
                    </td>
                    <td>
                      {p.bloodGroup ? <span className="badge badge-red">{p.bloodGroup}</span> : '—'}
                    </td>
                    <td><span className="badge badge-blue">{p._count?.appointments || 0}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openView(p)}>👁</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deactivate(p.id)}>🗑</button>
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

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{modal === 'add' ? 'Add New Patient' : 'Edit Patient'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid form-grid-2">
                  <div className="form-group"><label className="form-label">First Name *</label><input className="input" name="firstName" value={form.firstName} onChange={handle} required /></div>
                  <div className="form-group"><label className="form-label">Last Name *</label><input className="input" name="lastName" value={form.lastName} onChange={handle} required /></div>
                </div>
                <div className="form-grid form-grid-2">
                  <div className="form-group"><label className="form-label">Email</label><input className="input" name="email" type="email" value={form.email} onChange={handle} /></div>
                  <div className="form-group"><label className="form-label">Phone *</label><input className="input" name="phone" value={form.phone} onChange={handle} required /></div>
                </div>
                <div className="form-grid form-grid-3">
                  <div className="form-group"><label className="form-label">Date of Birth *</label><input className="input" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handle} required /></div>
                  <div className="form-group"><label className="form-label">Gender *</label>
                    <select className="select" name="gender" value={form.gender} onChange={handle}>
                      {GENDERS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Blood Group</label>
                    <select className="select" name="bloodGroup" value={form.bloodGroup} onChange={handle}>
                      <option value="">Select...</option>
                      {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Address</label><input className="input" name="address" value={form.address} onChange={handle} /></div>
                <div className="form-group"><label className="form-label">Allergies</label><textarea className="textarea" name="allergies" value={form.allergies} onChange={handle} rows={2} /></div>
                <div className="form-grid form-grid-2">
                  <div className="form-group"><label className="form-label">Emergency Contact</label><input className="input" name="emergencyContact" value={form.emergencyContact} onChange={handle} /></div>
                  <div className="form-group"><label className="form-label">Emergency Phone</label><input className="input" name="emergencyPhone" value={form.emergencyPhone} onChange={handle} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" />Saving...</> : modal === 'add' ? '➕ Add Patient' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{selected.firstName} {selected.lastName}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--teal)', fontFamily: 'monospace' }}>{selected.patientId}</span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Email', selected.email || '—'], ['Phone', selected.phone],
                  ['DOB', selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : '—'],
                  ['Gender', selected.gender], ['Blood Group', selected.bloodGroup || '—'],
                  ['Address', selected.address || '—'],
                  ['Emergency Contact', selected.emergencyContact || '—'],
                  ['Emergency Phone', selected.emergencyPhone || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.allergies && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>⚠ Allergies</div>
                  <div style={{ fontSize: '0.875rem' }}>{selected.allergies}</div>
                </div>
              )}
              {selected.appointments?.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 12, fontSize: '0.95rem' }}>Recent Appointments</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selected.appointments.slice(0, 5).map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.doctor?.specialization?.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(a.scheduledAt).toLocaleDateString()}</div>
                          <span className={`badge ${a.status === 'COMPLETED' ? 'badge-green' : a.status === 'CANCELLED' ? 'badge-red' : 'badge-blue'}`}>{a.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setModal(null); setTimeout(() => openEdit(selected), 50); }}>✏️ Edit</button>            </div>
          </div>
        </div>
      )}
    </div>
  );
}
