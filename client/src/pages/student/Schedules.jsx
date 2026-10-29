import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { schedulesApi, dashboardApi } from '../../services/api';
import { CalendarDays, Clock, MapPin, User, AlertCircle, Printer, RefreshCw } from 'lucide-react';

const DAYS = [
  { id: 0, name: 'Semua Hari' },
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
];

export default function StudentSchedules() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [studentInfo, setStudentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get student profile info first to have class_id
      const dashData = await dashboardApi.getStudent();
      const student = dashData?.student;
      setStudentInfo(student);

      if (student?.class_id) {
        const schedData = await schedulesApi.getAll({ class_id: student.class_id });
        setSchedules(Array.isArray(schedData) ? schedData : []);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error load student schedules:', err);
      setError(err.message || 'Gagal memuat jadwal pelajaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Filter schedules by day
  const filteredSchedules = selectedDay === 0 
    ? schedules 
    : schedules.filter(s => s.day_of_week === selectedDay);

  // Group schedules by day for "Semua Hari"
  const groupedByDay = DAYS.slice(1).map(day => ({
    ...day,
    items: schedules.filter(s => s.day_of_week === day.id)
  })).filter(group => selectedDay === 0 ? group.items.length > 0 : group.id === selectedDay);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal Pelajaran</h1>
          <p className="page-subtitle">
            Jadwal kegiatan belajar mengajar {studentInfo?.class_name ? `Kelas ${studentInfo.class_name}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
            <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} style={{ marginRight: '0.25rem' }} /> Cetak Jadwal
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-box--error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs Hari */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        {DAYS.map(day => (
          <button
            key={day.id}
            type="button"
            onClick={() => setSelectedDay(day.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              borderColor: selectedDay === day.id ? 'var(--color-primary-600)' : 'var(--border-color)',
              background: selectedDay === day.id ? 'var(--color-primary-50)' : 'var(--color-white)',
              color: selectedDay === day.id ? 'var(--color-primary-700)' : 'var(--text-secondary)',
              fontWeight: selectedDay === day.id ? 600 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {day.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-spinner-box">
          <p>Memuat jadwal pelajaran kelas...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="empty-state">
              <CalendarDays size={36} />
              <p>Tidak ada jadwal pelajaran untuk hari yang dipilih.</p>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {groupedByDay.map(group => (
            <Card key={group.id}>
              <Card.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarDays size={18} color="var(--color-primary-600)" />
                  <Card.Title>Hari {group.name}</Card.Title>
                </div>
                <Badge variant="primary">{group.items.length} Mata Pelajaran</Badge>
              </Card.Header>
              <Card.Body padding="none">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '140px' }}>Waktu</th>
                        <th>Mata Pelajaran</th>
                        <th>Guru Pengajar</th>
                        <th>Ruangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(sc => (
                        <tr key={sc.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-primary-700)', fontWeight: 600, fontSize: '0.875rem' }}>
                              <Clock size={14} />
                              <span>{sc.start_time?.slice(0, 5)} - {sc.end_time?.slice(0, 5)}</span>
                            </div>
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.9375rem' }}>{sc.subject_name}</strong>
                            {sc.subject_code && (
                              <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                ({sc.subject_code})
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                              <User size={14} />
                              <span>{sc.teacher_name || '-'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                              <MapPin size={14} />
                              <span>{sc.room || 'Kelas'}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
