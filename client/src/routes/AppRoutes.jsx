import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';

// Pages - Dashboard Utama
import Login from '../pages/auth/Login';
import Unauthorized from '../pages/auth/Unauthorized';
import AdminDashboard from '../pages/admin/Dashboard';
import TeacherDashboard from '../pages/teacher/Dashboard';
import StudentDashboard from '../pages/student/Dashboard';
import StudentSchedules from '../pages/student/Schedules';
import StudentAttendance from '../pages/student/Attendance';
import StudentSettings from '../pages/student/Settings';
import ParentDashboard from '../pages/parent/Dashboard';
import PrincipalDashboard from '../pages/principal/Dashboard';
import PrincipalReports from '../pages/principal/Reports';

// === 1. IMPORT SEMUA HALAMAN SUB-FITUR ADMIN ===
import Students from '../pages/admin/Students';
import Teachers from '../pages/admin/Teachers';
import Parents from '../pages/admin/Parents';
import Classes from '../pages/admin/Classes';
import Subjects from '../pages/admin/Subjects';
import Schedules from '../pages/admin/Schedules';
import Attendance from '../pages/admin/Attendance';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

// Teacher Pages
import TeacherSchedules from '../pages/teacher/Schedules';
import TeacherAttendance from '../pages/teacher/Attendance';
import TeacherSettings from '../pages/teacher/Settings';
import TeacherReports from '../pages/teacher/Reports';

// Parent Pages
import ParentAttendance from '../pages/parent/Attendance';
import ParentHistory from '../pages/parent/History';
import ParentSettings from '../pages/parent/Settings';

export default function AppRoutes() {
  const { user } = useAuth();

  // Root redirect based on role
  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'guru': return '/teacher';
      case 'siswa': return '/student';
      case 'orangtua': return '/parent';
      case 'kepsek': return '/principal';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/" element={
        user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Navigate to="/login" replace />
      } />

      <Route element={<MainLayout />}>
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />

          {/* === 2. SEMUA RUTE SUB-FITUR ADMIN DIDAFTARKAN DI SINI === */}
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/teachers" element={<Teachers />} />
          <Route path="/admin/parents" element={<Parents />} />
          <Route path="/admin/classes" element={<Classes />} />
          <Route path="/admin/subjects" element={<Subjects />} />
          <Route path="/admin/schedules" element={<Schedules />} />
          <Route path="/admin/attendance" element={<Attendance />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['guru']} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/schedules" element={<TeacherSchedules />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/reports" element={<TeacherReports />} />
          <Route path="/teacher/settings" element={<TeacherSettings />} />
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['siswa']} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/schedules" element={<StudentSchedules />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/settings" element={<StudentSettings />} />
        </Route>

        {/* Parent Routes */}
        <Route element={<ProtectedRoute allowedRoles={['orangtua']} />}>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/attendance" element={<ParentAttendance />} />
          <Route path="/parent/history" element={<ParentHistory />} />
          <Route path="/parent/settings" element={<ParentSettings />} />
        </Route>

        {/* Principal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['kepsek']} />}>
          <Route path="/principal" element={<PrincipalDashboard />} />
          <Route path="/principal/reports" element={<PrincipalReports />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}