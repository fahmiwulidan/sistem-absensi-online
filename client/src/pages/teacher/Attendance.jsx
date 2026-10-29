import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  schedulesApi, attendancesApi, apiRequest
} from '../../services/api';
import {
  ClipboardCheck, CheckCircle2, AlertCircle, Save,
  Calendar, UserCheck
} from 'lucide-react';

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone

  const [date, setDate] = useState(todayStr);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(searchParams.get('scheduleId') || '');

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [submittedMap, setSubmittedMap] = useState({}); // student_id -> has_been_submitted

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'history'
  const [historyList, setHistoryList] = useState([]);

  // Load teacher's schedules on mount
  useEffect(() => {
    if (!user) return;
    schedulesApi.getAll({ teacher_id: user.ref_id || user.id })
      .then((sc) => {
        setSchedules(sc || []);
        if (sc && sc.length > 0) {
          // Prefer scheduleId param if present
          const scheduleIdParam = searchParams.get('scheduleId');
          if (scheduleIdParam) {
            const matchById = sc.find(s => String(s.id) === scheduleIdParam);
            if (matchById) {
              setSelectedScheduleId(matchById.id);
              return;
            }
          }
          // Fallback to room param (room or roomId)
          const roomParam = searchParams.get('room') || searchParams.get('roomId');
          if (roomParam) {
            const matching = sc.find(s => {
              const roomVal = s.room ?? s.room_name ?? '';
              return roomVal && String(roomVal).toLowerCase() === String(roomParam).toLowerCase();
            });
            if (matching) {
              setSelectedScheduleId(matching.id);
              return;
            }
          }
          // Default to first schedule
          setSelectedScheduleId(sc[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, [user]);

  // Auto-select schedule based on selected date's day
  useEffect(() => {
    if (!date || schedules.length === 0) return;
    // If schedule already selected (e.g., via room param), keep it
    if (selectedScheduleId) return;

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const selectedDate = new Date(date + 'T00:00:00');
    const dayIndex = selectedDate.getDay();
    const dayName = dayNames[dayIndex];

    const matchingSchedule = schedules.find(sc => sc.day_name === dayName);
    if (matchingSchedule) {
      setSelectedScheduleId(matchingSchedule.id);
    }
  }, [date, schedules, selectedScheduleId]);

  const selectedSchedule = schedules.find(s => String(s.id) === String(selectedScheduleId));

  const loadAttendanceData = useCallback(async () => {
    if (!selectedSchedule) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get students for class in selected schedule
      const studentList = await apiRequest(`/classes/${selectedSchedule.class_id}/students`);
      setStudents(studentList || []);

      // 2. Check existing attendance
      const checkRes = await apiRequest(`/attendances/check/${selectedSchedule.id}/${date}`);

      const newMap = {};
      const submitted = {};
      if (checkRes && checkRes.exists && Array.isArray(checkRes.attendances)) {
        checkRes.attendances.forEach((att) => {
          newMap[att.student_id] = {
            status: att.status,
            notes: att.notes || '',
            id: att.id,
          };
          submitted[att.student_id] = true;
        });
      }
      (studentList || []).forEach((st) => {
        if (!submitted[st.id]) {
          submitted[st.id] = false;
          newMap[st.id] = { status: 'hadir', notes: '' };
        }
      });
      setAttendanceMap(newMap);
      setSubmittedMap(submitted);

      // 3. Load history
      const historyRes = await attendancesApi.getAll({ schedule_id: selectedSchedule.id, date });
      setHistoryList(historyRes || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data absensi');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSchedule, date]);

  useEffect(() => {
    if (selectedSchedule && date) {
      loadAttendanceData();
    }
  }, [loadAttendanceData, selectedSchedule, date]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
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
    if (!selectedSchedule || !date || students.length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        schedule_id: Number(selectedSchedule.id),
        date,
        attendances: students.map((st) => ({
          student_id: st.id,
          status: attendanceMap[st.id]?.status || 'hadir',
          notes: attendanceMap[st.id]?.notes || null,
        })),
      };

      // Use bulk endpoint that handles both create and update
      await apiRequest('/attendances/bulk', {
        method: 'POST',
        body: payload,
      });

      setSuccessMsg(`Absensi kelas ${selectedSchedule.class_name} (${selectedSchedule.subject_name}) tanggal ${date} berhasil disimpan.`);
      loadAttendanceData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan absensi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditModeToggle = (studentId) => {
    setAttendanceMap((prev) => {
      const current = prev[studentId] || { status: 'hadir', notes: '' };
      const newEditable = !current.isEditable;
      return {
        ...prev,
        [studentId]: { ...current, isEditable: newEditable }
      };
    });
  };

  const handleSaveSingleAttendance = async (studentId) => {
    const att = attendanceMap[studentId];
    if (!att) return;

    try {
      const checkRes = await apiRequest(`/attendances/check/${selectedSchedule.id}/${date}`);
      const existing = checkRes?.attendances?.find(a => Number(a.student_id) === Number(studentId));

      if (existing) {
        await apiRequest(`/attendances/${existing.id}`, {
          method: 'PUT',
          body: { status: att.status, notes: att.notes },
        });
      } else {
        await apiRequest('/attendances/bulk', {
          method: 'POST',
          body: {
            schedule_id: Number(selectedSchedule.id),
            date,
            attendances: [{
              student_id: studentId,
              status: att.status,
              notes: att.notes,
            }],
          },
        });
      }

      setSuccessMsg(`Absensi siswa berhasil diperbarui.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadAttendanceData();
    } catch (err) {
      setError(`Gagal menyimpan perubahan: ${err.message}`);
    }
  };

  const hadirCount = Object.values(attendanceMap).filter(a => a.status === 'hadir').length;
  const izinCount = Object.values(attendanceMap).filter(a => a.status === 'izin').length;
  const sakitCount = Object.values(attendanceMap).filter(a => a.status === 'sakit').length;
  const alpaCount = Object.values(attendanceMap).filter(a => a.status === 'alpa').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Input Absensi Kelas</h1>
          <p className="page-subtitle">Catat kehadiran siswa untuk jadwal mengajar Anda</p>
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

      <Card>
        <Card.Body>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Tanggal Absensi</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Pilih Jadwal Mengajar</label>
              <select
                className="form-control"
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                disabled={schedules.length === 0}
              >
                {schedules.length === 0 ? (
                  <option value="">Tidak ada jadwal mengajar</option>
                ) : (
                  schedules.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      [{sc.day_name}, {sc.start_time?.slice(0, 5)}-{sc.end_time?.slice(0, 5)}] {sc.subject_name} — Kelas {sc.class_name} ({sc.room || 'Ruang Kelas'})
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
                disabled={students.length === 0 || !selectedScheduleId}
              >
                <Save size={16} style={{ marginRight: '0.25rem' }} /> Simpan Absensi
              </Button>
            </div>
          </div>

          <Card>
            <Card.Body padding="none">
              {isLoading ? (
                <div className="loading-spinner-box">
                  <p>Memuat daftar siswa...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="empty-state">
                  <p>Pilih jadwal mengajar yang valid terlebih dahulu.</p>
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
                        <th>Keterangan</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st, index) => {
                        const currentStatus = attendanceMap[st.id]?.status || 'hadir';
                        const currentNotes = attendanceMap[st.id]?.notes || '';
                        const isSubmitted = submittedMap[st.id] || false;
                        const isEditable = attendanceMap[st.id]?.isEditable || !isSubmitted;

                        return (
                          <tr key={st.id} className={isSubmitted ? 'row-submitted' : ''}>
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
                                      onClick={() => isEditable && handleStatusChange(st.id, opt.key)}
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
                                        cursor: isEditable ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.15s ease',
                                        opacity: isEditable ? 1 : 0.5,
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
                                placeholder="Keterangan opsional"
                                value={currentNotes}
                                onChange={(e) => isEditable && handleNotesChange(st.id, e.target.value)}
                                disabled={!isEditable}
                                style={{ padding: '0.3125rem 0.5rem', fontSize: '0.8125rem' }}
                              />
                            </td>
                            <td>
                              {isSubmitted && !attendanceMap[st.id]?.isEditable ? (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleEditModeToggle(st.id)}
                                >
                                  Edit
                                </Button>
                              ) : isSubmitted && attendanceMap[st.id]?.isEditable ? (
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => {
                                      handleEditModeToggle(st.id);
                                    }}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    onClick={() => handleSaveSingleAttendance(st.id)}
                                  >
                                    Simpan
                                  </Button>
                                </div>
                              ) : null}
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
        <div style={{ marginTop: '1.25rem' }}>
          <Card>
            <Card.Header>
              <Card.Title>Riwayat Absensi {selectedSchedule?.subject_name} ({date})</Card.Title>
            </Card.Header>
            <Card.Body padding="none">
              {historyList.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={36} />
                  <p>Belum ada data absensi untuk jadwal dan tanggal ini.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NIS</th>
                        <th>Nama Siswa</th>
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
