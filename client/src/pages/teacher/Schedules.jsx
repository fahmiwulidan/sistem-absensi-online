import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { schedulesApi } from '../../services/api';
import { CalendarDays, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
];

export default function TeacherSchedules() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await schedulesApi.getAll({
        teacher_id: user?.ref_id || user?.id,
        day_of_week: selectedDay || undefined,
      });
      setSchedules(data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat jadwal mengajar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedDay]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal Mengajar</h1>
          <p className="page-subtitle">Daftar jadwal pelajaran mingguan Anda sebagai guru pengampu</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
          <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="alert-box alert-box--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <Card.Body>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="filter-group">
              <select
                className="select-filter"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="">Semua Hari</option>
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Total: <strong>{schedules.length}</strong> Sesi Jadwal Mengajar
            </div>
          </div>
        </Card.Body>
      </Card>

      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat jadwal mengajar...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="empty-state">
                <CalendarDays size={36} />
                <p>Tidak ada jadwal mengajar ditemukan.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hari</th>
                      <th>Waktu</th>
                      <th>Kelas</th>
                      <th>Mata Pelajaran</th>
                      <th>Ruang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((sc) => (
                      <tr key={sc.id}>
                        <td>
                          <strong>{sc.day_name}</strong>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                            {sc.start_time} - {sc.end_time}
                          </span>
                        </td>
                        <td>
                          <Badge variant="primary">{sc.class_name}</Badge>
                        </td>
                        <td>
                          <strong>{sc.subject_name}</strong> ({sc.subject_code})
                        </td>
                        <td>{sc.room || '-'}</td>
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
