import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusColor = {
  SCHEDULED: 'badge-blue', CONFIRMED: 'badge-teal', IN_PROGRESS: 'badge-amber',
  COMPLETED: 'badge-green', CANCELLED: 'badge-red', NO_SHOW: 'badge-gray',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/stats')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><span className="spinner" /><span>Loading dashboard...</span></div>;

  const cards = [
    { label: 'Total Patients', value: fmt(stats?.totalPatients), icon: '👥', color: 'teal', link: '/patients' },
    { label: 'Active Doctors', value: fmt(stats?.totalDoctors), icon: '🩺', color: 'blue', link: '/doctors' },
    { label: "Today's Appointments", value: fmt(stats?.todayAppointments), icon: '📅', color: 'amber', link: '/appointments' },
    { label: 'This Month Appts', value: fmt(stats?.monthAppointments), icon: '📊', color: 'purple', link: '/appointments' },
    { label: 'Total Revenue', value: fmtMoney(stats?.totalRevenue), icon: '💰', color: 'green', link: '/billing' },
    { label: 'Pending Bills', value: fmt(stats?.pendingBills), icon: '🧾', color: 'red', link: '/billing' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span style={{ color: 'var(--teal)' }}>{user?.firstName}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Here's what's happening at MediCore today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {cards.map(({ label, value, icon, color, link }) => (
          <Link to={link} key={label} style={{ textDecoration: 'none' }}>
            <div className={`stat-card ${color}`} style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Appointments */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Recent Appointments</h3>
            <Link to="/appointments" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {stats?.recentAppointments?.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No appointments yet</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentAppointments?.map(appt => (
                    <tr key={appt.id}>
                      <td style={{ fontWeight: 500 }}>{appt.patient.firstName} {appt.patient.lastName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(appt.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><span className={`badge ${statusColor[appt.status] || 'badge-gray'}`}>{appt.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Appointment Status Breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Appointment Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(stats?.appointmentsByStatus || {}).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No appointment data yet.</p>
            ) : Object.entries(stats.appointmentsByStatus).map(([status, count]) => {
              const total = stats?.totalAppointments || 1;
              const pct = Math.round((count / total) * 100);
              const colors = { COMPLETED: 'var(--green)', SCHEDULED: 'var(--blue)', CONFIRMED: 'var(--teal)', CANCELLED: 'var(--red)', IN_PROGRESS: 'var(--amber)', NO_SHOW: 'var(--text-dim)' };
              const color = colors[status] || 'var(--text-dim)';
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{status.toLowerCase().replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/patients', icon: '➕', label: 'Add New Patient', desc: 'Register a patient' },
              { to: '/appointments', icon: '📅', label: 'Book Appointment', desc: 'Schedule a visit' },
              { to: '/billing', icon: '🧾', label: 'Create Invoice', desc: 'Generate a bill' },
              { to: '/doctors', icon: '🩺', label: 'Manage Doctors', desc: 'View doctor roster' },
            ].map(({ to, icon, label, desc }) => (
              <Link to={to} key={label} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', transition: 'all 0.15s',
                border: '1px solid transparent',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--teal-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--surface-2)'; }}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
