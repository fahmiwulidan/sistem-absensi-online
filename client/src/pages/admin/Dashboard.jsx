import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { 
  Users, UserSquare2, GraduationCap, ClipboardCheck,
  TrendingUp, AlertCircle, Clock, RefreshCw
} from 'lucide-react';
import { dashboardApi, classesApi } from '../../services/api';
import Button from '../../components/ui/Button';
import './Dashboard.css';

const today = new Date().toLocaleDateString('id-ID', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, classRes] = await Promise.all([
        dashboardApi.getAdmin(),
        classesApi.getAll().catch(() => []),
      ]);
      setData(dashRes);
      setClasses(classRes || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalStudents = data?.totalStudents || 0;
  const totalTeachers = data?.totalTeachers || 0;
  const totalClasses = data?.totalClasses || 0;

  const todayStats = data?.todayAttendance || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  const todayPresent = todayStats.hadir || 0;
  const todayIzin = todayStats.izin || 0;
  const todaySakit = todayStats.sakit || 0;
  const todayAlpa = todayStats.alpa || 0;

  const attendanceRate = totalStudents > 0 && todayPresent > 0 
    ? Math.round((todayPresent / totalStudents) * 100)
    : 0;

  const weeklyTrend = data?.weeklyTrend && data.weeklyTrend.length > 0 
    ? data.weeklyTrend.map(d => {
        const dateObj = new Date(d.date);
        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
        return {
          day: dayName,
          date: d.date,
          hadir: d.hadir || 0,
          alpa: d.alpa || 0,
          total: d.total || 0,
        };
      })
    : [];

  const maxBar = weeklyTrend.length > 0 
    ? Math.max(...weeklyTrend.map(d => d.hadir), 1) 
    : 1;

  const recentActivity = data?.recentActivity || [];

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Admin</h1>
          <p className="page-subtitle">Selamat datang, {user?.name || 'Administrator'} · {today}</p>
        </div>
        <div className="page-header-meta" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="page-badge-label">Tahun Ajaran 2024/2025</span>
          <Button variant="outline" size="sm" onClick={loadDashboardData} isLoading={isLoading}>
            <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-box--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards Row */}
      <div className="stats-grid">
        <StatCard icon={Users}         label="Total Siswa"     value={totalStudents} color="primary" />
        <StatCard icon={UserSquare2}   label="Total Guru"      value={totalTeachers} color="info" />
        <StatCard icon={GraduationCap} label="Total Kelas"     value={totalClasses}  color="primary" />
        <StatCard icon={TrendingUp}    label="Kehadiran Hari Ini" value={`${attendanceRate}%`} color="success" />
      </div>

      {/* Today Attendance Status Row */}
      <div className="attendance-status-row">
        <div className="attendance-status-card attendance-status-card--hadir">
          <ClipboardCheck size={18} />
          <div>
            <p className="attendance-status-num">{todayPresent}</p>
            <p className="attendance-status-label">Hadir</p>
          </div>
        </div>
        <div className="attendance-status-card attendance-status-card--izin">
          <Clock size={18} />
          <div>
            <p className="attendance-status-num">{todayIzin}</p>
            <p className="attendance-status-label">Izin</p>
          </div>
        </div>
        <div className="attendance-status-card attendance-status-card--sakit">
          <AlertCircle size={18} />
          <div>
            <p className="attendance-status-num">{todaySakit}</p>
            <p className="attendance-status-label">Sakit</p>
          </div>
        </div>
        <div className="attendance-status-card attendance-status-card--alpa">
          <AlertCircle size={18} />
          <div>
            <p className="attendance-status-num">{todayAlpa}</p>
            <p className="attendance-status-label">Alpa</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Weekly Chart */}
        <Card>
          <Card.Header>
            <Card.Title>Tren Kehadiran (7 Hari Terakhir)</Card.Title>
          </Card.Header>
          <Card.Body>
            {weeklyTrend.length === 0 ? (
              <div className="empty-state">
                <p>Belum ada data absensi tercatat dalam 7 hari terakhir.</p>
              </div>
            ) : (
              <>
                <div className="bar-chart">
                  {weeklyTrend.map((d, i) => (
                    <div key={i} className="bar-chart__col">
                      <div className="bar-chart__bars">
                        <div 
                          className="bar-chart__bar bar-chart__bar--hadir" 
                          style={{ height: `${Math.max(8, (d.hadir / maxBar) * 100)}%` }} 
                          title={`Hadir: ${d.hadir}`} 
                        />
                        <div 
                          className="bar-chart__bar bar-chart__bar--alpa"  
                          style={{ height: `${Math.max(4, (d.alpa / maxBar) * 100)}%` }} 
                          title={`Alpa: ${d.alpa}`}  
                        />
                      </div>
                      <p className="bar-chart__label">{d.day}</p>
                    </div>
                  ))}
                </div>
                <div className="bar-chart__legend">
                  <span><span className="legend-dot legend-dot--hadir" />Hadir</span>
                  <span><span className="legend-dot legend-dot--alpa" />Alpa</span>
                </div>
              </>
            )}
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <Card.Title>Aktivitas Absensi Terbaru</Card.Title>
          </Card.Header>
          <Card.Body>
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <p>Belum ada aktivitas absensi terbaru.</p>
              </div>
            ) : (
              <ul className="activity-list">
                {recentActivity.map((act, index) => (
                  <li key={index} className="activity-item">
                    <span className={`activity-dot activity-dot--${act.status}`} />
                    <div className="activity-info">
                      <p className="activity-msg">
                        <strong>{act.student_name}</strong> ({act.class_name}) - {act.subject_name}
                      </p>
                      <p className="activity-time">
                        Status: <strong style={{ textTransform: 'capitalize' }}>{act.status}</strong> · {act.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Class Overview */}
      <Card>
        <Card.Header>
          <Card.Title>Daftar Kelas & Wali Kelas</Card.Title>
        </Card.Header>
        <Card.Body padding="none">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Kelas</th>
                  <th>Tingkat</th>
                  <th>Wali Kelas</th>
                  <th>Total Siswa Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">Belum ada kelas terdaftar</td>
                  </tr>
                ) : (
                  classes.map((cls) => (
                    <tr key={cls.id}>
                      <td><strong>{cls.name}</strong></td>
                      <td><Badge variant="primary">Kelas {cls.grade}</Badge></td>
                      <td>{cls.homeroom_teacher_name || '-'}</td>
                      <td>{cls.student_count || 0} Siswa</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
