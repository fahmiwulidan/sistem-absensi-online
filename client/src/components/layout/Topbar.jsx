import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <div className="topbar-breadcrumb">
          <span className="text-capitalize">{user?.role}</span> Dashboard
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="topbar-badge">3</span>
        </button>
        
        <div className="topbar-divider"></div>
        
        <button className="topbar-icon-btn" aria-label="Profile">
          <User size={20} />
        </button>
        
        <button className="topbar-icon-btn topbar-logout-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
