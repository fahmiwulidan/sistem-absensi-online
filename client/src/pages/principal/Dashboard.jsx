import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Users, TrendingUp, AlertTriangle, BarChart3, UserSquare2, GraduationCap, AlertCircle, RefreshCw } from 'lucide-react';
import { dashboardApi } from '../../services/api';
import '../admin/Dashboard.css';

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getPrincipal();
      setData(res);
    } catch (err) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStudents = data?.totalStudents || 0;
  const totalTeachers = data?.totalTeachers || 0;
  const totalClasses = data?.totalClasses || 0;
  const todayStats = data?.todayAttendance || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  const todayPresent = todayStats.hadir || 0;
  const todayAlpa = todayStats.alpa || 0;
  const todayIzin = todayStats.izin || 0;

  const attendanceRate = totalStudents > 0 && todayPresent > 0
    ? Math.round((todayPresent / totalStudents) * 100)
    : 0;

  const weeklyTrend = data?.weeklyTrend && data.weeklyTrend.length > 0
    ? data.weeklyTrend.map(d => {
        const dateObj = new Date(d.date);
        return {
          day: dateObj.toLocaleDateString('id-ID', { weekday: 'short' }),
          hadir: d.hadir || 0,
        };
      })
    : [];

  const maxBar = weeklyTrend.length > 0 ? Math.max(...weeklyTrend.map(d => d.hadir), 1) : 1;
  const classStats = data?.classStats || [];
  const monthlyTrend = data?.monthlyTrend || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Kepala Sekolah</h1>
          <p className="page-subtitle">Selamat datang, {user?.name || user?.username} · {today}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="page-badge-label">Akses: Hanya Baca (Read-Only)</span>
          <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
            <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-box--error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={Users}         label="Total Siswa Aktif"    value={totalStudents} color="primary" />
        <StatCard icon={UserSquare2}   label="Total Guru Aktif"     value={totalTeachers} color="info" />
        <StatCard icon={GraduationCap} label="Total Kelas"         value={totalClasses}  color="primary" />
        <StatCard icon={TrendingUp}    label="Kehadiran Hari Ini"   value={`${attendanceRate}%`} color="success" trend={`${todayPresent} dari ${totalStudents} siswa`} />
      </div>

      {/* Alert row */}
      {todayAlpa > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-warning-50)', border: '1px solid #FDE68A',
          color: 'var(--color-warning-600)'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Terdapat <strong>{todayAlpa} siswa alpa</strong> dan <strong>{todayIzin} siswa izin</strong> hari ini.
          </p>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Weekly Trend Chart */}
        <Card>
          <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary-600)' }} />
            <Card.Title>Tren Kehadiran (2 Minggu Terakhir)</Card.Title>
          </Card.Header>
          <Card.Body>
            {weeklyTrend.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                Belum ada data tren kehadiran.
              </p>
            ) : (
              <>
                <div className="bar-chart">
                  {weeklyTrend.map((d, i) => (
                    <div key={i} className="bar-chart__col">
                      <div className="bar-chart__bars">
                        <div className="bar-chart__bar bar-chart__bar--hadir" style={{ height: `${Math.max(8, (d.hadir / maxBar) * 100)}%` }} />
                      </div>
                      <p className="bar-chart__label">{d.day}</p>
                    </div>
                  ))}
                </div>
                <div className="bar-chart__legend">
                  <span><span className="legend-dot legend-dot--hadir" />Hadir</span>
                </div>
              </>
            )}
          </Card.Body>
        </Card>

        {/* Monthly Attendance */}
        <Card>
          <Card.Header>
            <Card.Title>Statistik Bulanan</Card.Title>
          </Card.Header>
          <Card.Body>
            {monthlyTrend.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                Belum ada data statistik bulanan.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {monthlyTrend.map(m => {
                  const rate = m.total > 0 ? Math.round((m.hadir / m.total) * 100) : 0;
                  return (
                    <div key={m.month}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Bulan: {m.month}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success-600)' }}>{rate}% ({m.hadir}/{m.total})</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Per-Class Table */}
      <Card>
        <Card.Header>
          <Card.Title>Kehadiran Per Kelas — Hari Ini</Card.Title>
        </Card.Header>
        <Card.Body padding="none">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kelas</th>
                  <th>Tingkat</th>
                  <th>Total Siswa</th>
                  <th>Hadir</th>
                  <th>Alpa</th>
                  <th>Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {classStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                      Belum ada data kelas hari ini.
                    </td>
                  </tr>
                ) : (
                  classStats.map(cls => {
                    const rate = cls.student_count > 0 ? Math.round((cls.hadir / cls.student_count) * 100) : 0;
                    return (
                      <tr key={cls.id}>
                        <td><strong>{cls.class_name}</strong></td>
                        <td><Badge variant="primary">Kelas {cls.grade}</Badge></td>
                        <td>{cls.student_count}</td>
                        <td><span className="td-success">{cls.hadir || 0}</span></td>
                        <td><span className={cls.alpa > 0 ? 'td-danger' : 'td-success'}>{cls.alpa || 0}</span></td>
                        <td>
                          <div className="progress-cell">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${rate}%`, backgroundColor: rate < 90 ? 'var(--color-warning-500)' : 'var(--color-success-500)' }} />
                            </div>
                            <span>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
