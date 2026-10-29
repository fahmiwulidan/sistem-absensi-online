import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { schedulesApi, classesApi, subjectsApi, teachersApi } from '../../services/api';
import { Plus, Edit2, Trash2, CalendarDays, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
];

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedDay, setSelectedDay] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '07:30',
    end_time: '09:00',
    subject_id: '',
    teacher_id: '',
    class_id: '',
    room: 'R. 101',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [schedData, classData, subData, teachData] = await Promise.all([
        schedulesApi.getAll({
          day_of_week: selectedDay || undefined,
          class_id: selectedClass || undefined,
        }),
        classesApi.getAll(),
        subjectsApi.getAll(),
        teachersApi.getAll(),
      ]);
      setSchedules(schedData || []);
      setClasses(classData || []);
      setSubjects(subData || []);
      setTeachers(teachData || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat jadwal pelajaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDay, selectedClass]);

  const handleOpenCreateModal = () => {
    setSelectedSchedule(null);
    setFormData({
      day_of_week: Number(selectedDay) || 1,
      start_time: '07:30',
      end_time: '09:00',
      subject_id: subjects[0]?.id || '',
      teacher_id: teachers[0]?.id || '',
      class_id: selectedClass || classes[0]?.id || '',
      room: 'R. 101',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sc) => {
    setSelectedSchedule(sc);
    setFormData({
      day_of_week: sc.day_of_week || 1,
      start_time: sc.start_time || '07:30',
      end_time: sc.end_time || '09:00',
      subject_id: sc.subject_id || '',
      teacher_id: sc.teacher_id || '',
      class_id: sc.class_id || '',
      room: sc.room || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (sc) => {
    setSelectedSchedule(sc);
    setIsDeleteModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.subject_id || !formData.teacher_id || !formData.class_id) {
      setFormError('Mata pelajaran, guru pengampu, dan kelas wajib dipilih!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        day_of_week: Number(formData.day_of_week),
        subject_id: Number(formData.subject_id),
        teacher_id: Number(formData.teacher_id),
        class_id: Number(formData.class_id),
      };

      if (selectedSchedule) {
        await schedulesApi.update(selectedSchedule.id, payload);
        setSuccessMsg('Jadwal pelajaran berhasil diperbarui.');
      } else {
        await schedulesApi.create(payload);
        setSuccessMsg('Jadwal pelajaran baru berhasil dibuat.');
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan jadwal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    setIsSaving(true);
    try {
      await schedulesApi.delete(selectedSchedule.id);
      setSuccessMsg('Jadwal pelajaran berhasil dihapus.');
      setIsDeleteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menghapus jadwal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal Pelajaran</h1>
          <p className="page-subtitle">Atur jadwal belajar mengajar mingguan sekolah</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.375rem' }} /> Tambah Jadwal
        </Button>
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

              <select
                className="select-filter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Kelas {cls.grade})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Total: <strong>{schedules.length}</strong> Sesi Jadwal
            </div>
          </div>
        </Card.Body>
      </Card>

      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat jadwal pelajaran...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="empty-state">
                <CalendarDays size={36} />
                <p>Tidak ada jadwal pelajaran untuk filter yang dipilih.</p>
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
                      <th>Guru Pengampu</th>
                      <th>Ruang</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
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
                        <td>{sc.teacher_name}</td>
                        <td>{sc.room || '-'}</td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="btn-icon"
                              title="Edit Jadwal"
                              onClick={() => handleOpenEditModal(sc)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon--danger"
                              title="Hapus Jadwal"
                              onClick={() => handleOpenDeleteModal(sc)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSchedule ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Baru'}
        subtitle="Atur hari, jam, kelas, guru, dan mata pelajaran"
        maxWidth="560px"
      >
        <form onSubmit={handleSaveSchedule}>
          {formError && (
            <div className="alert-box alert-box--error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Hari *</label>
              <select
                className="form-control"
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kelas *</label>
              <select
                className="form-control"
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jam Mulai *</label>
              <input
                type="time"
                className="form-control"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jam Selesai *</label>
              <input
                type="time"
                className="form-control"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Mata Pelajaran *</label>
            <select
              className="form-control"
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Guru Pengampu *</label>
            <select
              className="form-control"
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Guru --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Ruangan</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Lab Komputer, R. 101"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
          </div>

          <Modal.Footer style={{ marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              {selectedSchedule ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Jadwal Pelajaran"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Apakah Anda yakin ingin menghapus jadwal <strong>{selectedSchedule?.subject_name}</strong> ({selectedSchedule?.class_name}, {selectedSchedule?.day_name})?
        </p>
        <Modal.Footer style={{ marginTop: '1.25rem' }}>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSchedule}
            isLoading={isSaving}
          >
            Hapus Jadwal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
