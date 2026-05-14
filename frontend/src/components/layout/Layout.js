import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const NAV = [
    { to: '/dashboard', icon: '⚡', label: t('nav.dashboard') },
    { to: '/patients', icon: '👥', label: t('nav.patients') },
    { to: '/doctors', icon: '🩺', label: t('nav.doctors') },
    { to: '/appointments', icon: '📅', label: t('nav.appointments') },
    { to: '/billing', icon: '💳', label: t('nav.billing') },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  const isRtl = i18n.language === 'ar';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: 'var(--surface)',
        borderRight: isRtl ? 'none' : '1px solid var(--border)',
        borderLeft: isRtl ? '1px solid var(--border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, color: 'var(--navy)', fontWeight: 800,
          }}>+</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>MediCore</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--teal)', letterSpacing: '0.1em' }}>HMS</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? 'var(--teal-glow)' : 'transparent',
              color: isActive ? 'var(--teal)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontWeight: isActive ? 600 : 400, fontSize: '0.9rem',
              borderLeft: !isRtl && isActive ? '2px solid var(--teal)' : '2px solid transparent',
              borderRight: isRtl && isActive ? '2px solid var(--teal)' : '2px solid transparent',
            })}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User / Settings / Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            style={{ width: '100%', padding: '8px 12px', marginBottom: 4, background: 'var(--surface-2)', border: 'none', cursor: 'pointer', color: 'var(--teal)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
          >
            <span style={{ fontSize: 16 }}>🌐</span>
            {!collapsed && (i18n.language === 'ar' ? 'English' : 'العربية')}
          </button>

          {!collapsed && user && (
            <div style={{ padding: '10px 12px', marginBottom: 8, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user.role}
              </div>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ width: '100%', padding: '8px 12px', marginBottom: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 16 }}>{collapsed ? (isRtl ? '←' : '→') : (isRtl ? '→' : '←')}</span>
            {!collapsed && (collapsed ? t('nav.expand') : t('nav.collapse'))}
          </button>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--red)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            {!collapsed && t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}

