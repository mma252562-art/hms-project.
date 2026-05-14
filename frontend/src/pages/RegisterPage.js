import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'RECEPTIONIST', phone: '' });
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(form);
    if (!res.success) setError(res.message);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px', color: 'var(--navy)', fontWeight: 900 }}>+</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.875rem' }}>MediCore Hospital Management System</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="input" name="firstName" value={form.firstName} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="input" name="lastName" value={form.lastName} onChange={handle} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" name="password" type="password" value={form.password} onChange={handle} minLength={6} required />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="input" name="phone" value={form.phone} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="select" name="role" value={form.role} onChange={handle}>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="NURSE">Nurse</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? <><span className="spinner" />Creating account...</> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
