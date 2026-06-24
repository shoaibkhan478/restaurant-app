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
    <div style={{minHeight:"100vh", background:"#f8fafc"}}>

      {/* Desktop Sidebar */}
      <div style={{display:"none"}} className="desktop-sidebar">
        <style>{`
          @media (min-width: 768px) {
            .desktop-sidebar { display: flex !important; }
            .mobile-bottom-nav { display: none !important; }
            .main-content { margin-left: 240px !important; padding: 32px !important; }
          }
          @media (max-width: 767px) {
            .desktop-sidebar { display: none !important; }
            .mobile-bottom-nav { display: flex !important; }
            .main-content { margin-left: 0 !important; padding: 16px 12px 80px 12px !important; }
          }
        `}</style>
        <div style={{width:"240px", background:"white", borderRight:"1px solid #e2e8f0", position:"fixed", height:"100vh", display:"flex", flexDirection:"column", zIndex:10}}>
          <div style={{padding:"20px 24px", borderBottom:"1px solid #e2e8f0"}}>
            <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
              <div style={{width:"36px", height:"36px", background:"#f97316", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px"}}>🍽️</div>
              <div>
                <h1 style={{fontSize:"14px", fontWeight:"bold", color:"#0f172a", margin:0}}>Restaurant</h1>
                <p style={{fontSize:"12px", color:"#64748b", margin:0, textTransform:"capitalize"}}>{role} Panel</p>
              </div>
            </div>
          </div>
          <nav style={{flex:1, padding:"12px", display:"flex", flexDirection:"column", gap:"4px"}}>
            {navItems.map(item => (
              <Link key={item.path} to={item.path} style={{
                display:"flex", alignItems:"center", gap:"12px", padding:"10px 12px",
                borderRadius:"12px", fontSize:"14px", fontWeight:"500", textDecoration:"none",
                background: location.pathname === item.path ? "#fff7ed" : "transparent",
                color: location.pathname === item.path ? "#f97316" : "#475569",
              }}>
                <span style={{fontSize:"18px"}}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div style={{padding:"12px", borderTop:"1px solid #e2e8f0"}}>
            <button onClick={handleLogout} style={{
              width:"100%", display:"flex", alignItems:"center", gap:"12px",
              padding:"10px 12px", borderRadius:"12px", fontSize:"14px", fontWeight:"500",
              color:"#ef4444", background:"transparent", border:"none", cursor:"pointer"
            }}>
              <span style={{fontSize:"18px"}}>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{marginLeft:0, padding:"16px 12px 80px 12px"}}>
        <style>{`
          @media (min-width: 768px) {
            .main-content { margin-left: 240px !important; padding: 32px !important; }
          }
        `}</style>

        {/* Mobile Top Bar */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", padding:"12px 16px", background:"white", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
            <div style={{width:"32px", height:"32px", background:"#f97316", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px"}}>🍽️</div>
            <div>
              <h1 style={{fontSize:"14px", fontWeight:"bold", color:"#0f172a", margin:0}}>Restaurant</h1>
              <p style={{fontSize:"11px", color:"#64748b", margin:0, textTransform:"capitalize"}}>{role} Panel</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{background:"#fff1f2", border:"none", cursor:"pointer", padding:"8px 12px", borderRadius:"10px", fontSize:"12px", fontWeight:"600", color:"#ef4444"}}>
            Logout
          </button>
        </div>

        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav" style={{
        display:"flex", position:"fixed", bottom:0, left:0, right:0,
        background:"white", borderTop:"1px solid #e2e8f0", zIndex:50,
        padding:"8px 4px", gap:"4px"
      }}>
        <style>{`
          @media (min-width: 768px) {
            .mobile-bottom-nav { display: none !important; }
          }
        `}</style>
        {navItems.map(item => (
          <Link key={item.path} to={item.path} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", padding:"6px 4px", borderRadius:"12px",
            textDecoration:"none", gap:"2px",
            background: location.pathname === item.path ? "#fff7ed" : "transparent",
          }}>
            <span style={{fontSize:"20px"}}>{item.icon}</span>
            <span style={{fontSize:"10px", fontWeight:"600", color: location.pathname === item.path ? "#f97316" : "#94a3b8"}}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

    </div>
  );
}