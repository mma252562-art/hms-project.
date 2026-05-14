import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/api';

const STATUS_COLORS = { PENDING: 'badge-amber', PAID: 'badge-green', PARTIAL: 'badge-blue', CANCELLED: 'badge-red' };
const STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'];
const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: '' };

export default function BillingPage() {
  const [data, setData] = useState({ bills: [], total: 0, page: 1, pages: 1 });
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ patientId: '', notes: '', discount: 0, tax: 0, items: [{ ...EMPTY_ITEM }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, ...(filterStatus && { status: filterStatus }) });
      const [billsRes, summaryRes] = await Promise.all([
        API.get(`/billing?${params}`),
        API.get('/billing/summary'),
      ]);
      setData(billsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchBills(); }, [fetchBills]);
  useEffect(() => { API.get('/patients?limit=200').then(r => setPatients(r.data.data.patients)).catch(() => {}); }, []);

  const openAdd = () => {
    setForm({ patientId: '', notes: '', discount: 0, tax: 0, items: [{ ...EMPTY_ITEM }] });
    setError(''); setModal('add');
  };
  const openView = async (b) => {
    try {
      const res = await API.get(`/billing/${b.id}`);
      setSelected(res.data.data);
    } catch { setSelected(b); }
    setModal('view');
  };

  const handleForm = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleItem = (i, field, val) => setForm(f => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item),
  }));
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 1), 0);
  const total = subtotal - parseFloat(form.discount || 0) + parseFloat(form.tax || 0);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await API.post('/billing', { ...form, items: form.items.filter(i => i.description && i.unitPrice) });
      setModal(null); fetchBills();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const markPaid = async (id) => {
    try { await API.patch(`/billing/${id}/status`, { status: 'PAID' }); fetchBills(); if (modal === 'view') setModal(null); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const fmtMoney = (n) => '$' + Number(n || 0).toFixed(2);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Invoices & revenue management • {data.total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ New Invoice</button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Revenue', value: fmtMoney(summary.totalRevenue), icon: '💰', color: 'green' },
            { label: 'Pending Revenue', value: fmtMoney(summary.pendingRevenue), icon: '⏳', color: 'amber' },
            { label: 'Pending Bills', value: summary.pendingCount, icon: '🧾', color: 'red' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="filters">
        <select className="select" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><span className="spinner" /><span>Loading bills...</span></div>
        ) : data.bills.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🧾</div><h3>No invoices found</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Bill #</th><th>Patient</th><th>Doctor</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.bills.map(b => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--teal)' }}>{b.billNumber?.slice(0, 8)}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.patient.firstName} {b.patient.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.patient.patientId?.slice(0, 8)}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {b.appointment ? `Dr. ${b.appointment.doctor?.user?.firstName} ${b.appointment.doctor?.user?.lastName}` : '—'}
                    </td>
                    <td style={{ fontWeight: 500 }}>{fmtMoney(b.subtotal)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{fmtMoney(b.tax)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtMoney(b.total)}</td>
                    <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openView(b)}>👁</button>
                        {b.status === 'PENDING' && (
                          <button className="btn btn-primary btn-sm" onClick={() => markPaid(b.id)}>✓ Pay</button>
                        )}
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

      {/* Create Invoice Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>🧾 New Invoice</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="select" name="patientId" value={form.patientId} onChange={handleForm} required>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} – {p.phone}</option>)}
                  </select>
                </div>

                {/* Line Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label" style={{ margin: 0 }}>Line Items</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 80px', gap: 8 }}>
                      {['Description', 'Qty', 'Unit Price', ''].map(h => (
                        <span key={h} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>{h}</span>
                      ))}
                    </div>
                    {form.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 40px', gap: 8, alignItems: 'center' }}>
                        <input className="input" placeholder="Service description" value={item.description} onChange={e => handleItem(i, 'description', e.target.value)} required />
                        <input className="input" type="number" min="1" value={item.quantity} onChange={e => handleItem(i, 'quantity', e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice} onChange={e => handleItem(i, 'unitPrice', e.target.value)} required />
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)} disabled={form.items.length === 1}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                  <div className="form-grid form-grid-2" style={{ marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Discount ($)</label>
                      <input className="input" name="discount" type="number" min="0" step="0.01" value={form.discount} onChange={handleForm} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tax ($)</label>
                      <input className="input" name="tax" type="number" min="0" step="0.01" value={form.tax} onChange={handleForm} />
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[['Subtotal', fmtMoney(subtotal)], ['Discount', `-${fmtMoney(form.discount)}`], ['Tax', fmtMoney(form.tax)]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: 'var(--green)', marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span>Total</span><span>{fmtMoney(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="textarea" name="notes" value={form.notes} onChange={handleForm} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" />Creating...</> : '🧾 Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Invoice Details</h3>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--teal)' }}>{selected.billNumber}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              {/* Patient & Doctor info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Patient', `${selected.patient?.firstName} ${selected.patient?.lastName}`],
                  ['Patient ID', selected.patient?.patientId?.slice(0, 8) || '—'],
                  ['Doctor', selected.appointment ? `Dr. ${selected.appointment.doctor?.user?.firstName} ${selected.appointment.doctor?.user?.lastName}` : '—'],
                  ['Date', new Date(selected.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                  ['Paid At', selected.paidAt ? new Date(selected.paidAt).toLocaleDateString() : '—'],
                  ['Notes', selected.notes || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Line items table */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 10, fontSize: '0.95rem' }}>Line Items</h4>
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {selected.items?.map((item, i) => (
                        <tr key={i}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{fmtMoney(item.unitPrice)}</td>
                          <td style={{ fontWeight: 600 }}>{fmtMoney(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                {[['Subtotal', fmtMoney(selected.subtotal)], ['Discount', `-${fmtMoney(selected.discount)}`], ['Tax', fmtMoney(selected.tax)]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--green)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span>Total</span><span>{fmtMoney(selected.total)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
              {selected.status === 'PENDING' && (
                <button className="btn btn-primary" onClick={() => markPaid(selected.id)}>✓ Mark as Paid</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
