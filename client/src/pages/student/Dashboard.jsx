import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CheckCircle2, XCircle, Clock, AlertCircle, CalendarDays, RefreshCw } from 'lucide-react';
import { dashboardApi } from '../../services/api';
import '../admin/Dashboard.css';
import './Dashboard.css';

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
      const res = await dashboardApi.getStudent();
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

  const student = data?.student || {};
  const stats = data?.stats || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0, percentage: 0 };
  const todaySchedule = data?.todaySchedule || [];
  const recentHistory = data?.recentHistory || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Siswa</h1>
          <p className="page-subtitle">Halo, {user?.name || user?.username} · {today}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="page-badge-label">{student.class_name ? `Kelas ${student.class_name}` : 'Siswa'}</span>
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
        <StatCard icon={CheckCircle2} label="Total Hadir"  value={stats.hadir}  color="success" />
        <StatCard icon={Clock}        label="Izin"         value={stats.izin}   color="warning" />
        <StatCard icon={AlertCircle}  label="Sakit"        value={stats.sakit}  color="info" />
        <StatCard icon={XCircle}      label="Alpa"         value={stats.alpa}   color="danger" />
      </div>

      {/* Attendance Percentage Ring */}
      <Card>
        <Card.Body>
          <div className="student-percentage-row">
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Persentase Kehadiran Total
              </p>
              <div className="percentage-big">
                <span>{stats.percentage}%</span>
                <span className="percentage-label">dari {stats.total} pertemuan tercatat</span>
              </div>
            </div>
            <div className="percentage-ring-wrap">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-gray-200)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-success-500)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 32 * stats.percentage / 100} ${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * 0.25}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
                <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-success-600)">{stats.percentage}%</text>
              </svg>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="dashboard-grid">
        {/* Today's Schedule */}
        <Card>
          <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={18} style={{ color: 'var(--color-primary-600)' }} />
            <Card.Title>Jadwal Hari Ini</Card.Title>
          </Card.Header>
          <Card.Body>
            {todaySchedule.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                Tidak ada jadwal pelajaran hari ini.
              </p>
            ) : (
              <ul className="schedule-list">
                {todaySchedule.map(sc => (
                  <li key={sc.id} className="schedule-item">
                    <div className="schedule-time">{sc.start_time?.slice(0, 5)} - {sc.end_time?.slice(0, 5)}</div>
                    <div className="schedule-info">
                      <p className="schedule-subject">{sc.subject_name}</p>
                      <p className="schedule-class">{sc.teacher_name || 'Guru Pengajar'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>

        {/* Recent History */}
        <Card>
          <Card.Header>
            <Card.Title>Riwayat Absensi Terbaru</Card.Title>
          </Card.Header>
          <Card.Body>
            {recentHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                Belum ada riwayat absensi.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Mata Pelajaran</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHistory.map((h, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.8rem' }}>{h.date}</td>
                        <td style={{ fontWeight: 500 }}>{h.subject_name}</td>
                        <td><Badge variant={h.status}>{h.status?.charAt(0).toUpperCase() + h.status?.slice(1)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
