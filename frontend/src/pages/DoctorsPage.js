import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EMPTY_FORM = { email: '', password: '', firstName: '', lastName: '', phone: '', specializationId: '', licenseNumber: '', experience: 0, consultationFee: 0, bio: '' };

export default function DoctorsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [data, setData] = useState({ doctors: [], total: 0, page: 1, pages: 1 });
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, ...(search && { search }), ...(filterSpec && { specialization: filterSpec }) });
      const res = await API.get(`/doctors?${params}`);
      setData(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, filterSpec]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    API.get('/doctors/specializations').then(r => setSpecs(r.data.data)).catch(() => {});
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setError(''); setModal('add'); };
  const openEdit = (d) => {
    setForm({
      firstName: d.user?.firstName || '',
      lastName: d.user?.lastName || '',
      phone: d.user?.phone || '',
      email: d.user?.email || '',
      specializationId: d.specializationId || '',
      licenseNumber: d.licenseNumber || '',
      experience: d.experience || 0,
      consultationFee: d.consultationFee || 0,
      bio: d.bio || '',
      isAvailable: d.isAvailable ?? true,
      password: '',
    });
    setSelected(d); setError(''); setModal('edit');
  };
  const openView = async (d) => {
    try {
      const res = await API.get(`/doctors/${d.id}`);
      setSelected(res.data.data);
    } catch { setSelected(d); }
    setModal('view');
  };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await API.post('/doctors', form);
      else await API.put(`/doctors/${selected.id}`, form);
      setModal(null); fetchDoctors();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">Medical staff directory • {data.total} total</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>➕ Add Doctor</button>}
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input className="input" placeholder="Search by name or license..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="select" style={{ maxWidth: 200 }} value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1); }}>
          <option value="">All Specializations</option>
          {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><span className="spinner" /><span>Loading doctors...</span></div>
        ) : data.doctors.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🩺</div><h3>No doctors found</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Doctor</th><th>Specialization</th><th>License</th><th>Experience</th><th>Fee</th><th>Appts</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.doctors.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>Dr. {d.user.firstName} {d.user.lastName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.user.email}</div>
                    </td>
                    <td><span className="badge badge-purple">{d.specialization?.name}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--teal)' }}>{d.licenseNumber}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{d.experience} yrs</td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>${Number(d.consultationFee).toFixed(0)}</td>
                    <td><span className="badge badge-blue">{d._count?.appointments || 0}</span></td>
                    <td><span className={`badge ${d.isAvailable ? 'badge-green' : 'badge-red'}`}>{d.isAvailable ? 'Available' : 'Unavailable'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openView(d)}>👁</button>
                        {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>✏️</button>}
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
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{modal === 'add' ? 'Add New Doctor' : 'Edit Doctor'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid form-grid-2">
                  <div className="form-group"><label className="form-label">First Name *</label><input className="input" name="firstName" value={form.firstName} onChange={handle} required /></div>
                  <div className="form-group"><label className="form-label">Last Name *</label><input className="input" name="lastName" value={form.lastName} onChange={handle} required /></div>
                </div>
                {modal === 'add' && (
                  <div className="form-grid form-grid-2">
                    <div className="form-group"><label className="form-label">Email *</label><input className="input" name="email" type="email" value={form.email} onChange={handle} required /></div>
                    <div className="form-group"><label className="form-label">Password</label><input className="input" name="password" type="password" value={form.password} onChange={handle} placeholder="doctor123" /></div>
                  </div>
                )}
                <div className="form-grid form-grid-2">
                  <div className="form-group"><label className="form-label">Phone</label><input className="input" name="phone" value={form.phone} onChange={handle} /></div>
                  <div className="form-group"><label className="form-label">License Number *</label><input className="input" name="licenseNumber" value={form.licenseNumber} onChange={handle} required /></div>
                </div>
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <select className="select" name="specializationId" value={form.specializationId} onChange={handle} required>
                      <option value="">Select...</option>
                      {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Experience (yrs)</label><input className="input" name="experience" type="number" min="0" value={form.experience} onChange={handle} /></div>
                  <div className="form-group"><label className="form-label">Consultation Fee ($)</label><input className="input" name="consultationFee" type="number" min="0" step="0.01" value={form.consultationFee} onChange={handle} /></div>
                </div>
                <div className="form-group"><label className="form-label">Bio</label><textarea className="textarea" name="bio" value={form.bio} onChange={handle} rows={3} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" />Saving...</> : modal === 'add' ? '➕ Add Doctor' : '💾 Save Changes'}
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
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Dr. {selected.user?.firstName} {selected.user?.lastName}</h3>
                <span className="badge badge-purple">{selected.specialization?.name}</span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Email', selected.user?.email], ['Phone', selected.user?.phone || '—'],
                  ['License', selected.licenseNumber], ['Experience', `${selected.experience} years`],
                  ['Consultation Fee', `$${Number(selected.consultationFee).toFixed(2)}`],
                  ['Status', selected.isAvailable ? '✅ Available' : '❌ Unavailable'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.bio && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Bio</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{selected.bio}</p>
                </div>
              )}
              {selected.schedules?.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 12, fontSize: '0.95rem' }}>Weekly Schedule</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selected.schedules.filter(s => s.isActive).map(s => (
                      <div key={s.id} style={{ background: 'var(--teal-glow)', border: '1px solid rgba(0,201,177,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{DAYS[s.dayOfWeek]}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{s.startTime} – {s.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
