import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { 
  classesApi, schedulesApi, studentsApi, attendancesApi, apiRequest 
} from '../../services/api';
import { 
  ClipboardCheck, CheckCircle2, AlertCircle, Clock, Save, 
  Calendar, Check, UserCheck, AlertTriangle 
} from 'lucide-react';

export default function Attendance() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // student_id -> { status: 'hadir', notes: '' }

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'history'
  const [historyList, setHistoryList] = useState([]);

  // Load classes initially
  useEffect(() => {
    classesApi.getAll()
      .then((cls) => {
        setClasses(cls || []);
        if (cls && cls.length > 0) {
          setSelectedClass(cls[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // When selectedClass or date changes, load schedules for this class
  useEffect(() => {
    if (!selectedClass) return;

    // Calculate day_of_week for selected date (1=Mon ... 6=Sat)
    const dateObj = new Date(date);
    let day = dateObj.getDay();
    if (day === 0) day = 7;

    schedulesApi.getAll({ class_id: selectedClass })
      .then((sc) => {
        setSchedules(sc || []);
        if (sc && sc.length > 0) {
          // If any schedule matches the day of the date, prefer it, otherwise pick first
          const dayMatch = sc.find((item) => item.day_of_week === day);
          setSelectedSchedule(dayMatch ? dayMatch.id : sc[0].id);
        } else {
          setSelectedSchedule('');
        }
      })
      .catch((err) => setError(err.message));
  }, [selectedClass, date]);

  // When class and schedule are selected, load students and any existing attendance for that date
  const loadClassAttendance = async () => {
    if (!selectedClass || !selectedSchedule) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get students for the class
      const studentList = await apiRequest(`/classes/${selectedClass}/students`);
      setStudents(studentList || []);

      // 2. Check if attendance already recorded
      const checkRes = await apiRequest(`/attendances/check/${selectedSchedule}/${date}`);
      
      const newMap = {};
      if (checkRes && checkRes.exists && Array.isArray(checkRes.attendances)) {
        checkRes.attendances.forEach((att) => {
          newMap[att.student_id] = {
            status: att.status,
            notes: att.notes || '',
            id: att.id,
          };
        });
      } else {
        // Default all to hadir
        studentList.forEach((st) => {
          newMap[st.id] = { status: 'hadir', notes: '' };
        });
      }

      setAttendanceMap(newMap);

      // Also load history for selected class & date
      const historyRes = await attendancesApi.getAll({ class_id: selectedClass, date });
      setHistoryList(historyRes || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data absensi kelas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSchedule) {
      loadClassAttendance();
    }
  }, [selectedClass, selectedSchedule, date]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleSetAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status: 'hadir' };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchedule || !date || students.length === 0) {
      setError('Jadwal dan data siswa harus tersedia.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        schedule_id: Number(selectedSchedule),
        date,
        attendances: students.map((st) => ({
          student_id: st.id,
          status: attendanceMap[st.id]?.status || 'hadir',
          notes: attendanceMap[st.id]?.notes || null,
        })),
      };

      await attendancesApi.bulkCreate(payload);
      setSuccessMsg(`Absensi tanggal ${date} berhasil disimpan (${students.length} siswa).`);
      loadClassAttendance();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan absensi');
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculation for current sheet
  const hadirCount = Object.values(attendanceMap).filter((a) => a.status === 'hadir').length;
  const izinCount = Object.values(attendanceMap).filter((a) => a.status === 'izin').length;
  const sakitCount = Object.values(attendanceMap).filter((a) => a.status === 'sakit').length;
  const alpaCount = Object.values(attendanceMap).filter((a) => a.status === 'alpa').length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Absensi Siswa</h1>
          <p className="page-subtitle">Input dan pantau kehadiran siswa per kelas dan jadwal pelajaran</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={activeTab === 'input' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('input')}
          >
            <ClipboardCheck size={18} style={{ marginRight: '0.375rem' }} /> Input Absensi
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('history')}
          >
            <Calendar size={18} style={{ marginRight: '0.375rem' }} /> Riwayat Hari Ini
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="alert-box alert-box--success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-box--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Control Panel Filter */}
      <Card>
        <Card.Body>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Tanggal Absensi</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kelas</label>
              <select
                className="form-control"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Tingkat {cls.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mata Pelajaran & Jadwal</label>
              <select
                className="form-control"
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                disabled={schedules.length === 0}
              >
                {schedules.length === 0 ? (
                  <option value="">Tidak ada jadwal di kelas ini</option>
                ) : (
                  schedules.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.subject_name} ({sc.day_name}, {sc.start_time}-{sc.end_time}) - {sc.teacher_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {activeTab === 'input' ? (
        <div style={{ marginTop: '1.25rem' }}>
          {/* Summary Badges & Action */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '1rem 1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total: {students.length} Siswa
              </span>
              <Badge variant="success">Hadir: {hadirCount}</Badge>
              <Badge variant="warning">Izin: {izinCount}</Badge>
              <Badge variant="info">Sakit: {sakitCount}</Badge>
              <Badge variant="danger">Alpa: {alpaCount}</Badge>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" onClick={handleSetAllPresent}>
                <UserCheck size={16} style={{ marginRight: '0.25rem' }} /> Semua Hadir
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAttendance}
                isLoading={isSaving}
                disabled={students.length === 0 || !selectedSchedule}
              >
                <Save size={16} style={{ marginRight: '0.25rem' }} /> Simpan Absensi
              </Button>
            </div>
          </div>

          <Card>
            <Card.Body padding="none">
              {isLoading ? (
                <div className="loading-spinner-box">
                  <p>Memuat daftar absensi siswa...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="empty-state">
                  <p>Tidak ada data siswa pada kelas ini.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>No</th>
                        <th style={{ width: '120px' }}>NIS</th>
                        <th>Nama Siswa</th>
                        <th style={{ width: '80px' }}>L/P</th>
                        <th style={{ textAlign: 'center', width: '280px' }}>Status Kehadiran</th>
                        <th>Keterangan / Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st, index) => {
                        const currentStatus = attendanceMap[st.id]?.status || 'hadir';
                        const currentNotes = attendanceMap[st.id]?.notes || '';

                        return (
                          <tr key={st.id}>
                            <td>{index + 1}</td>
                            <td><strong>{st.nis}</strong></td>
                            <td><strong>{st.name}</strong></td>
                            <td>
                              <Badge variant={st.gender === 'L' ? 'info' : 'warning'}>
                                {st.gender || 'L'}
                              </Badge>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                                {[
                                  { key: 'hadir', label: 'Hadir', activeClass: 'success' },
                                  { key: 'izin', label: 'Izin', activeClass: 'warning' },
                                  { key: 'sakit', label: 'Sakit', activeClass: 'info' },
                                  { key: 'alpa', label: 'Alpa', activeClass: 'danger' },
                                ].map((opt) => {
                                  const isSelected = currentStatus === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => handleStatusChange(st.id, opt.key)}
                                      style={{
                                        padding: '0.3125rem 0.625rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-md)',
                                        border: isSelected 
                                          ? `2px solid var(--color-${opt.activeClass}-600)` 
                                          : '1px solid var(--border-color)',
                                        backgroundColor: isSelected 
                                          ? `var(--color-${opt.activeClass}-50)` 
                                          : 'var(--bg-surface)',
                                        color: isSelected 
                                          ? `var(--color-${opt.activeClass}-600)` 
                                          : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                style={{ padding: '0.3125rem 0.5rem', fontSize: '0.8125rem' }}
                                placeholder={currentStatus !== 'hadir' ? 'Masukkan alasan/keterangan' : 'Opsional'}
                                value={currentNotes}
                                onChange={(e) => handleNotesChange(st.id, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      ) : (
        /* History Tab */
        <div style={{ marginTop: '1.25rem' }}>
          <Card>
            <Card.Header>
              <Card.Title>Data Absensi Tercatat pada {date}</Card.Title>
            </Card.Header>
            <Card.Body padding="none">
              {historyList.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={36} />
                  <p>Belum ada rekaman absensi pada tanggal dan kelas ini.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NIS</th>
                        <th>Nama Siswa</th>
                        <th>Mata Pelajaran</th>
                        <th>Status</th>
                        <th>Keterangan</th>
                        <th>Waktu Input</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map((att) => (
                        <tr key={att.id}>
                          <td><strong>{att.nis}</strong></td>
                          <td><strong>{att.student_name}</strong></td>
                          <td>{att.subject_name} ({att.teacher_name})</td>
                          <td>
                            <Badge 
                              variant={
                                att.status === 'hadir' ? 'success' :
                                att.status === 'izin' ? 'warning' :
                                att.status === 'sakit' ? 'info' : 'danger'
                              }
                            >
                              {att.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td>{att.notes || '-'}</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {att.created_at ? new Date(att.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}
