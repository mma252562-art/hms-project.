import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (!res.success) setError(res.message);
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,201,177,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, background: 'var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px', color: 'var(--navy)', fontWeight: 900,
          }}>+</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>MediCore HMS</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>Hospital Management System</p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: '1.25rem' }}>Welcome back</h2>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handle} placeholder="you@hospital.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
              {loading ? <><span className="spinner" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            No account? <Link to="/register">Register here</Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Admin', 'admin@hospital.com', 'admin123'],
              ['Receptionist', 'reception@hospital.com', 'recep123'],
              ['Doctor', 'dr.smith@hospital.com', 'doctor123'],
            ].map(([role, email, pw]) => (
              <button key={role} onClick={() => fill(email, pw)} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '8px 12px', fontSize: '0.8rem', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{role}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
