import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { ClipboardCheck, CalendarDays, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { dashboardApi, authApi, schedulesApi } from '../../services/api';
import '../admin/Dashboard.css';

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTeacherData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getTeacher();
      setData(res);
    } catch (err) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeacherData();
    // Auto refresh setiap 10 detik agar statistik terupdate setelah absen
    const interval = setInterval(loadTeacherData, 10000);
    return () => clearInterval(interval);
  }, [loadTeacherData]);

  const todaySchedules = data?.todaySchedules || [];
  const stats = data?.stats || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  const doneCount = todaySchedules.filter(s => s.attendance_count > 0).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Guru</h1>
          <p className="page-subtitle">Selamat datang, {user?.name || user?.username} · {today}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="page-badge-label">Guru Pengajar</span>
          <Button variant="outline" size="sm" onClick={loadTeacherData} isLoading={isLoading}>
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
        <StatCard icon={CalendarDays} label="Jadwal Hari Ini" value={`${todaySchedules.length} Kelas`} color="primary" />
        <StatCard icon={CheckCircle2} label="Sudah Diabsen" value={doneCount} color="success" />
        <StatCard icon={ClipboardCheck} label="Belum Diabsen" value={todaySchedules.length - doneCount} color="warning" />
        <StatCard icon={Clock} label="Total Hadir Siswa" value={stats.hadir} color="info" />
      </div>

      <div className="dashboard-grid">
        {/* Today's Schedule */}
        <Card>
          <Card.Header>
            <Card.Title>Jadwal Mengajar Hari Ini</Card.Title>
          </Card.Header>
          <Card.Body>
            {todaySchedules.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                Tidak ada jadwal mengajar hari ini.
              </p>
            ) : (
              <ul className="schedule-list">
                {todaySchedules.map(sc => {
                  const isDone = sc.attendance_count > 0;
                  return (
                    <li key={sc.id} className={`schedule-item ${isDone ? 'schedule-item--done' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div onClick={() => navigate(`/teacher/attendance?scheduleId=${sc.id}`)} style={{ cursor: 'pointer' }}>
                          <div className="schedule-time">{sc.start_time?.slice(0, 5)} - {sc.end_time?.slice(0, 5)}</div>
                          <div className="schedule-info">
                            <p className="schedule-subject">{sc.subject_name}</p>
                            <p className="schedule-class">{sc.class_name} · {sc.room || 'Ruang Kelas'}</p>
                          </div>
                        </div>
                        {isDone ? (
                          <Badge variant="success">Selesai</Badge>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => navigate(`/teacher/attendance?room=${encodeURIComponent(sc.room || '')}&scheduleId=${sc.id}`)}>
                            Input Absen
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
