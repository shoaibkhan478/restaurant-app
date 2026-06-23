import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/manager/tables', icon: '🪑', label: 'Tables' },
  { path: '/manager/menu', icon: '🍽️', label: 'Menu' },
  { path: '/manager/reports', icon: '📊', label: 'Reports' },
  { path: '/manager/qr', icon: '📱', label: 'QR Codes' },
  { path: '/kitchen', icon: '👨‍🍳', label: 'Kitchen' },
];

export default function ManagerLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-lg">🍽️</div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Restaurant</h1>
              <p className="text-xs text-slate-500 capitalize">{role} panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                location.pathname === item.path ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-200">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition">
            <span className="text-lg">🚪</span>
            Logout
          </button>
        </div>
      </div>
      <div className="ml-64 flex-1 p-8">{children}</div>
    </div>
  );
}