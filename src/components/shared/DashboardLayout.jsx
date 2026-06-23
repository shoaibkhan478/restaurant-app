import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/owner', roles: ['owner'] },
  { label: 'Menu categories', path: '/menu-management', roles: ['owner', 'manager'] },
  { label: 'Menu items', path: '/menu-items', roles: ['owner', 'manager'] },
  { label: 'Tables', path: '/table-management', roles: ['owner', 'manager'] },
  { label: 'Orders', path: '/order-management', roles: ['owner', 'manager'] },
  { label: 'Kitchen', path: '/kitchen', roles: ['owner', 'manager', 'kitchen'] },
];

export default function DashboardLayout({ children, title, subtitle }) {
  const { role, logout } = useAuthStore();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-44 shrink-0 bg-surface border-r border-border p-3 flex flex-col gap-1">
        <p className="text-sm font-semibold px-2 mb-4">Khan's Kitchen</p>
        {visibleItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm ${
                active ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-background'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="mt-auto px-3 py-2 text-sm text-text-secondary hover:text-status-soldout text-left"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="text-xl font-semibold text-text-primary">{title}</h1>}
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}