import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { UserCheck, CheckCircle2, Clock, AlertCircle, XCircle, Bell, RefreshCw } from 'lucide-react';
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
      const res = await dashboardApi.getParent();
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

  const childrenList = data?.children || [];
  const child = childrenList[0] || null;
  const stats = child?.stats || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0, percentage: 0 };
  const todayAttendance = child?.todayAttendance || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Orang Tua</h1>
          <p className="page-subtitle">Selamat datang, {user?.name || user?.username} · {today}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

      {!child ? (
        <Card>
          <Card.Body>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              Belum ada data anak yang terhubung dengan akun Anda. Hubungi administrator sekolah.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Child Info Card */}
          <Card>
            <Card.Body style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, flexShrink: 0
              }}>
                {child.name?.charAt(0) || 'S'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>{child.name}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  NIS: {child.nis || '-'} · Kelas {child.class_name || '-'} ({stats.percentage}% Kehadiran)
                </p>
              </div>
              <Badge variant="success">Aktif</Badge>
            </Card.Body>
          </Card>

          {/* Stats */}
          <div className="stats-grid">
            <StatCard icon={CheckCircle2} label="Total Hadir" value={stats.hadir}  color="success" />
            <StatCard icon={Clock}        label="Izin"        value={stats.izin}   color="warning" />
            <StatCard icon={AlertCircle}  label="Sakit"       value={stats.sakit}  color="info" />
            <StatCard icon={XCircle}      label="Alpa"        value={stats.alpa}   color="danger" />
          </div>

          <div className="dashboard-grid">
            {/* Today Status */}
            <Card>
              <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} style={{ color: 'var(--color-primary-600)' }} />
                <Card.Title>Status Kehadiran Hari Ini</Card.Title>
              </Card.Header>
              <Card.Body>
                {todayAttendance.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                    Belum ada absensi tercatat hari ini.
                  </p>
                ) : (
                  <ul className="schedule-list">
                    {todayAttendance.map((s, i) => (
                      <li key={i} className="schedule-item">
                        <div className="schedule-time">{s.date || 'Hari Ini'}</div>
                        <div className="schedule-info">
                          <p className="schedule-subject">{s.subject_name || 'Mata Pelajaran'}</p>
                        </div>
                        <Badge variant={s.status}>{s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>

            {/* Absence Notifications */}
            <Card>
              <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} style={{ color: 'var(--color-warning-600)' }} />
                <Card.Title>Ringkasan Statistik Kehadiran</Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Persentase Kehadiran</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success-600)' }}>{stats.percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${stats.percentage}%` }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Total pertemuan tercatat: <strong>{stats.total}</strong> pertemuan (Hadir: {stats.hadir}, Izin: {stats.izin}, Sakit: {stats.sakit}, Alpa: {stats.alpa}).
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
