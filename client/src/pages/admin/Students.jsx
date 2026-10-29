import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { studentsApi, classesApi } from '../../services/api';
import { Plus, Search, Edit2, Trash2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    birth_place: '',
    birth_date: '',
    address: '',
    phone: '',
    class_id: '',
    is_active: 1,
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsData, classesData] = await Promise.all([
        studentsApi.getAll({
          search: search || undefined,
          class_id: selectedClass || undefined,
        }),
        classesApi.getAll(),
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (err) {
      setError(err.message || 'Gagal mengambil data siswa');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreateModal = () => {
    setSelectedStudent(null);
    setFormData({
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      birth_place: '',
      birth_date: '',
      address: '',
      phone: '',
      class_id: classes[0]?.id || '',
      is_active: 1,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      nis: student.nis || '',
      nisn: student.nisn || '',
      name: student.name || '',
      gender: student.gender || 'L',
      birth_place: student.birth_place || '',
      birth_date: student.birth_date || '',
      address: student.address || '',
      phone: student.phone || '',
      class_id: student.class_id || '',
      is_active: student.is_active !== undefined ? student.is_active : 1,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nis || !formData.name) {
      setFormError('NIS dan Nama Siswa wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedStudent) {
        // Update
        await studentsApi.update(selectedStudent.id, {
          ...formData,
          class_id: formData.class_id ? Number(formData.class_id) : null,
          is_active: Number(formData.is_active),
        });
        setSuccessMsg(`Data siswa ${formData.name} berhasil diperbarui.`);
      } else {
        // Create
        await studentsApi.create({
          ...formData,
          class_id: formData.class_id ? Number(formData.class_id) : null,
        });
        setSuccessMsg(`Siswa ${formData.name} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data siswa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      await studentsApi.delete(selectedStudent.id);
      setSuccessMsg(`Siswa ${selectedStudent.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menghapus siswa');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Siswa</h1>
          <p className="page-subtitle">Kelola dan input data seluruh siswa di sekolah</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.375rem' }} /> Tambah Siswa
        </Button>
      </div>

      {/* Alert Notification */}
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
            <form onSubmit={handleSearchSubmit} className="filter-group">
              <div className="search-input-wrapper">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIS, atau NISN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
              <Button type="submit" variant="secondary" size="md">
                Cari
              </Button>
            </form>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Total: <strong>{students.length}</strong> Siswa
            </div>
          </div>
        </Card.Body>
      </Card>

      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat data siswa...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <Users size={36} />
                <p>Tidak ada data siswa yang cocok.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>NIS / NISN</th>
                      <th>Nama Siswa</th>
                      <th>L/P</th>
                      <th>Kelas</th>
                      <th>No. Telepon</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => (
                      <tr key={st.id}>
                        <td>
                          <div><strong>{st.nis}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.nisn || '-'}</div>
                        </td>
                        <td>
                          <strong>{st.name}</strong>
                          {st.birth_date && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {st.birth_place ? `${st.birth_place}, ` : ''}{st.birth_date}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge variant={st.gender === 'L' ? 'info' : 'warning'}>
                            {st.gender === 'L' ? 'L' : 'P'}
                          </Badge>
                        </td>
                        <td>
                          {st.class_name ? (
                            <Badge variant="primary">{st.class_name}</Badge>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Belum ada</span>
                          )}
                        </td>
                        <td>{st.phone || '-'}</td>
                        <td>
                          <Badge variant={st.is_active ? 'success' : 'neutral'}>
                            {st.is_active ? 'Aktif' : 'Non-Aktif'}
                          </Badge>
                        </td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="btn-icon"
                              title="Edit Siswa"
                              onClick={() => handleOpenEditModal(st)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon--danger"
                              title="Hapus Siswa"
                              onClick={() => handleOpenDeleteModal(st)}
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

      {/* Modal Form Tambah / Edit Siswa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        subtitle="Isi informasi data siswa secara lengkap"
        maxWidth="640px"
      >
        <form onSubmit={handleSaveStudent}>
          {formError && (
            <div className="alert-box alert-box--error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">NIS *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 24001"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">NISN</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 0071234567"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Nama Lengkap *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nama lengkap siswa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <select
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kelas</label>
              <select
                className="form-control"
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Tingkat {cls.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tempat Lahir</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Tangerang"
                value={formData.birth_place}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Lahir</label>
              <input
                type="date"
                className="form-control"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">No. Telepon</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {selectedStudent && (
              <div className="form-group">
                <label className="form-label">Status Siswa</label>
                <select
                  className="form-control"
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                >
                  <option value={1}>Aktif</option>
                  <option value={0}>Non-Aktif</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Alamat</label>
            <textarea
              className="form-control"
              placeholder="Alamat tempat tinggal siswa"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              {selectedStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data Siswa"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Apakah Anda yakin ingin menghapus data siswa <strong>{selectedStudent?.name}</strong> (NIS: {selectedStudent?.nis})? Tindakan ini tidak dapat dibatalkan.
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
            onClick={handleDeleteStudent}
            isLoading={isSaving}
          >
            Hapus Siswa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}