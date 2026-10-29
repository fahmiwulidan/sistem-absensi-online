import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, Users, UserSquare2, GraduationCap, 
  BookOpen, CalendarDays, ClipboardCheck, FileBarChart, 
  Settings, X, Users2
} from 'lucide-react';
import './Sidebar.css';

const roleNavMap = {
  admin: [
    { title: 'Dashboard',       path: '/admin',            icon: LayoutDashboard, end: true },
    { title: 'Data Siswa',      path: '/admin/students',   icon: Users },
    { title: 'Data Guru',       path: '/admin/teachers',   icon: UserSquare2 },
    { title: 'Orang Tua',       path: '/admin/parents',    icon: Users2 },
    { title: 'Kelas',           path: '/admin/classes',    icon: GraduationCap },
    { title: 'Mata Pelajaran',  path: '/admin/subjects',   icon: BookOpen },
    { title: 'Jadwal',          path: '/admin/schedules',  icon: CalendarDays },
    { title: 'Absensi',         path: '/admin/attendance', icon: ClipboardCheck },
    { title: 'Laporan',         path: '/admin/reports',    icon: FileBarChart },
    { title: 'Pengaturan',      path: '/admin/settings',   icon: Settings },
  ],
  guru: [
    { title: 'Dashboard',         path: '/teacher',             icon: LayoutDashboard, end: true },
    { title: 'Jadwal Mengajar',   path: '/teacher/schedules',   icon: CalendarDays },
    { title: 'Absensi Kelas',     path: '/teacher/attendance',  icon: ClipboardCheck },
    { title: 'Rekap Kelas',       path: '/teacher/reports',     icon: FileBarChart },
    { title: 'Pengaturan',        path: '/teacher/settings',    icon: Settings },
  ],
  siswa: [
    { title: 'Dashboard',         path: '/student',             icon: LayoutDashboard, end: true },
    { title: 'Jadwal Pelajaran',  path: '/student/schedules',   icon: CalendarDays },
    { title: 'Kehadiran Saya',    path: '/student/attendance',  icon: ClipboardCheck },
    { title: 'Pengaturan',        path: '/student/settings',    icon: Settings },
  ],
  orangtua: [
    { title: 'Dashboard',       path: '/parent',              icon: LayoutDashboard, end: true },
    { title: 'Kehadiran Anak',  path: '/parent/attendance',   icon: ClipboardCheck },
    { title: 'Riwayat',         path: '/parent/history',      icon: FileBarChart },
    { title: 'Pengaturan',      path: '/parent/settings',     icon: Settings },
  ],
  kepsek: [
    { title: 'Dashboard',         path: '/principal',           icon: LayoutDashboard, end: true },
    { title: 'Rekap Absensi',     path: '/principal/reports',   icon: FileBarChart },
  ],
};

const roleLabelMap = {
  admin: 'Admin / TU',
  guru: 'Guru',
  siswa: 'Siswa',
  orangtua: 'Orang Tua',
  kepsek: 'Kepala Sekolah',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const navLinks = roleNavMap[user?.role] || [];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BookOpen size={18} />
          </div>
          <span className="sidebar-title">SMA Harapan Bangsa</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Tutup menu">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <p className="sidebar-nav-heading">MENU UTAMA</p>
          <ul className="sidebar-menu">
            {navLinks.map((link) => (
              <li key={link.path} className="sidebar-menu-item">
                <NavLink 
                  to={link.path} 
                  end={link.end === true}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <link.icon size={18} className="sidebar-link-icon" />
                  <span>{link.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* User Info Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <p className="sidebar-user-role">{roleLabelMap[user?.role] || user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
