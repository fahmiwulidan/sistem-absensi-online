import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { classesApi, teachersApi } from '../../services/api';
import { Plus, Edit2, Trash2, GraduationCap, AlertCircle, CheckCircle2, Users } from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    grade: 10,
    homeroom_teacher_id: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classesData, teachersData] = await Promise.all([
        classesApi.getAll(),
        teachersApi.getAll(),
      ]);
      setClasses(classesData || []);
      setTeachers(teachersData || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedClass(null);
    setFormData({
      name: '',
      grade: 10,
      homeroom_teacher_id: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name || '',
      grade: cls.grade || 10,
      homeroom_teacher_id: cls.homeroom_teacher_id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (cls) => {
    setSelectedClass(cls);
    setIsDeleteModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Nama kelas wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        grade: Number(formData.grade),
        homeroom_teacher_id: formData.homeroom_teacher_id ? Number(formData.homeroom_teacher_id) : null,
      };

      if (selectedClass) {
        await classesApi.update(selectedClass.id, payload);
        setSuccessMsg(`Kelas ${formData.name} berhasil diperbarui.`);
      } else {
        await classesApi.create(payload);
        setSuccessMsg(`Kelas ${formData.name} berhasil dibuat.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data kelas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setIsSaving(true);
    try {
      await classesApi.delete(selectedClass.id);
      setSuccessMsg(`Kelas ${selectedClass.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menghapus kelas');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Kelas</h1>
          <p className="page-subtitle">Kelola pembagian rombel kelas dan penugasan wali kelas</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.375rem' }} /> Tambah Kelas
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

      <Card>
        <Card.Body padding="none">
          {isLoading ? (
            <div className="loading-spinner-box">
              <p>Memuat data kelas...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="empty-state">
              <GraduationCap size={36} />
              <p>Belum ada data kelas yang terdaftar.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama Kelas</th>
                    <th>Tingkat</th>
                    <th>Wali Kelas</th>
                    <th>Jumlah Siswa</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id}>
                      <td><strong>{cls.name}</strong></td>
                      <td>
                        <Badge variant="primary">Kelas {cls.grade}</Badge>
                      </td>
                      <td>
                        {cls.homeroom_teacher_name ? (
                          <strong>{cls.homeroom_teacher_name}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Belum ditentukan</span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Users size={15} style={{ color: 'var(--color-primary-600)' }} />
                          <strong>{cls.student_count || 0}</strong> Siswa
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Edit Kelas"
                            onClick={() => handleOpenEditModal(cls)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon--danger"
                            title="Hapus Kelas"
                            onClick={() => handleOpenDeleteModal(cls)}
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

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
        subtitle="Masukkan nama kelas, tingkat, dan wali kelas"
        maxWidth="500px"
      >
        <form onSubmit={handleSaveClass}>
          {formError && (
            <div className="alert-box alert-box--error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nama Kelas *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: X-1, XI IPA 1, XII IPS 2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Tingkat / Jenjang *</label>
            <select
              className="form-control"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            >
              <option value={10}>Kelas 10</option>
              <option value={11}>Kelas 11</option>
              <option value={12}>Kelas 12</option>
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Wali Kelas</label>
            <select
              className="form-control"
              value={formData.homeroom_teacher_id}
              onChange={(e) => setFormData({ ...formData, homeroom_teacher_id: e.target.value })}
            >
              <option value="">-- Pilih Wali Kelas --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
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
              {selectedClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Kelas"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Apakah Anda yakin ingin menghapus kelas <strong>{selectedClass?.name}</strong>?
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
            onClick={handleDeleteClass}
            isLoading={isSaving}
          >
            Hapus Kelas
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
