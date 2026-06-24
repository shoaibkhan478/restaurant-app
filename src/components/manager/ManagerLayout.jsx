import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/manager/tables', icon: '🪑', label: 'Tables' },
  { path: '/manager/menu', icon: '🍽️', label: 'Menu' },
  { path: '/manager/reports', icon: '📊', label: 'Reports' },
  { path: '/manager/qr', icon: '📱', label: 'QR Codes' },
  { path: '/kitchen', icon: '👨‍🍳', label: 'Kitchen' },
];

const SIDEBAR_W = 220;
const ACCENT = '#f97316';
const ACCENT_LIGHT = '#fff7ed';
const BORDER = '#e2e8f0';
const TEXT_MAIN = '#0f172a';
const TEXT_MUTED = '#64748b';
const TEXT_NAV = '#475569';

export default function ManagerLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Sidebar (desktop only) ── */
        .mgr-sidebar {
          display: none;
        }

        /* ── Main content ── */
        .mgr-content {
          min-height: 100vh;
          background: #f8fafc;
          padding: 16px 12px 80px; /* bottom = bottom-nav height */
        }

        /* ── Mobile top-bar ── */
        .mgr-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border-radius: 16px;
          padding: 10px 14px;
          margin-bottom: 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.07);
        }

        /* ── Bottom nav (mobile only) ── */
        .mgr-bottom-nav {
          display: flex;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: white;
          border-top: 1px solid ${BORDER};
          z-index: 100;
          padding: 6px 2px;
          gap: 2px;
        }
        .mgr-bottom-nav a {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5px 2px;
          border-radius: 10px;
          text-decoration: none;
          gap: 2px;
          transition: background 0.15s;
        }
        .mgr-bottom-nav a.active {
          background: ${ACCENT_LIGHT};
        }
        .mgr-bottom-nav .nav-icon { font-size: 20px; line-height: 1; }
        .mgr-bottom-nav .nav-label {
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }
        .mgr-bottom-nav a.active .nav-label { color: ${ACCENT}; }

        /* ── Desktop overrides ── */
        @media (min-width: 768px) {
          .mgr-sidebar {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0; left: 0;
            width: ${SIDEBAR_W}px;
            height: 100vh;
            background: white;
            border-right: 1px solid ${BORDER};
            z-index: 100;
          }

          .mgr-content {
            margin-left: ${SIDEBAR_W}px;
            padding: 28px 28px 28px;
          }

          .mgr-topbar { display: none; }   /* hide mobile topbar on desktop */
          .mgr-bottom-nav { display: none !important; }
        }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside className="mgr-sidebar">
        {/* Brand */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: ACCENT, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>🍽️</div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT_MAIN }}>Restaurant</p>
            <p style={{ margin: 0, fontSize: 11, color: TEXT_MUTED, textTransform: 'capitalize' }}>{role} Panel</p>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, fontSize: 13,
              fontWeight: 500, textDecoration: 'none',
              background: isActive(item.path) ? ACCENT_LIGHT : 'transparent',
              color: isActive(item.path) ? ACCENT : TEXT_NAV,
              transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px', borderTop: `1px solid ${BORDER}` }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, fontSize: 13,
            fontWeight: 500, color: '#ef4444', background: 'transparent',
            border: 'none', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 17 }}>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="mgr-content">
        {/* Mobile Top Bar */}
        <div className="mgr-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: ACCENT, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
            }}>🍽️</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_MAIN }}>Restaurant</p>
              <p style={{ margin: 0, fontSize: 10, color: TEXT_MUTED, textTransform: 'capitalize' }}>{role} Panel</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: '#fff1f2', border: 'none', cursor: 'pointer',
            padding: '7px 13px', borderRadius: 8, fontSize: 12,
            fontWeight: 600, color: '#ef4444'
          }}>Logout</button>
        </div>

        {children}
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mgr-bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={isActive(item.path) ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
