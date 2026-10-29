import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { teachersApi, subjectsApi } from '../../services/api';
import { Plus, Search, Edit2, Trash2, UserSquare2, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    email: '',
    phone: '',
    gender: 'L',
    is_active: 1,
    subject_ids: [],
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teachersData, subjectsData] = await Promise.all([
        teachersApi.getAll({ search: search || undefined }),
        subjectsApi.getAll(),
      ]);
      setTeachers(teachersData || []);
      setSubjects(subjectsData || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data guru');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreateModal = () => {
    setSelectedTeacher(null);
    setFormData({
      nip: '',
      name: '',
      email: '',
      phone: '',
      gender: 'L',
      is_active: 1,
      subject_ids: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      nip: teacher.nip || '',
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      gender: teacher.gender || 'L',
      is_active: teacher.is_active !== undefined ? teacher.is_active : 1,
      subject_ids: (teacher.subjects || []).map(s => s.subject_id),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData((prev) => {
      const exists = prev.subject_ids.includes(subjectId);
      if (exists) {
        return { ...prev, subject_ids: prev.subject_ids.filter((id) => id !== subjectId) };
      } else {
        return { ...prev, subject_ids: [...prev.subject_ids, subjectId] };
      }
    });
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Nama guru wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedTeacher) {
        await teachersApi.update(selectedTeacher.id, {
          ...formData,
          is_active: Number(formData.is_active),
        });
        setSuccessMsg(`Data guru ${formData.name} berhasil diperbarui.`);
      } else {
        await teachersApi.create(formData);
        setSuccessMsg(`Guru ${formData.name} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data guru');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    setIsSaving(true);
    try {
      await teachersApi.delete(selectedTeacher.id);
      setSuccessMsg(`Guru ${selectedTeacher.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menghapus guru');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Guru</h1>
          <p className="page-subtitle">Kelola informasi tenaga pendidik dan pengajar</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.375rem' }} /> Tambah Guru
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
            <form onSubmit={handleSearchSubmit} className="filter-group">
              <div className="search-input-wrapper">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIP, atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Cari
              </Button>
            </form>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Total: <strong>{teachers.length}</strong> Guru
            </div>
          </div>
        </Card.Body>
      </Card>

      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat data guru...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="empty-state">
                <UserSquare2 size={36} />
                <p>Tidak ada data guru yang ditemukan.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>NIP</th>
                      <th>Nama Lengkap</th>
                      <th>L/P</th>
                      <th>Mata Pelajaran yang Diampu</th>
                      <th>Kontak</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.nip || '-'}</strong></td>
                        <td>
                          <div><strong>{t.name}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email || '-'}</div>
                        </td>
                        <td>
                          <Badge variant={t.gender === 'L' ? 'info' : 'warning'}>
                            {t.gender === 'L' ? 'L' : 'P'}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {t.subjects && t.subjects.length > 0 ? (
                              t.subjects.map((sub) => (
                                <Badge key={sub.subject_id} variant="neutral">
                                  {sub.name}
                                </Badge>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Belum diatur</span>
                            )}
                          </div>
                        </td>
                        <td>{t.phone || '-'}</td>
                        <td>
                          <Badge variant={t.is_active ? 'success' : 'neutral'}>
                            {t.is_active ? 'Aktif' : 'Non-Aktif'}
                          </Badge>
                        </td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="btn-icon"
                              title="Edit Guru"
                              onClick={() => handleOpenEditModal(t)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon--danger"
                              title="Hapus Guru"
                              onClick={() => handleOpenDeleteModal(t)}
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

      {/* Modal Form Tambah / Edit Guru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        subtitle="Isi biodata guru dan pilih mata pelajaran yang diampu"
        maxWidth="600px"
      >
        <form onSubmit={handleSaveTeacher}>
          {formError && (
            <div className="alert-box alert-box--error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">NIP</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 198501012010011001"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Budi Santoso, S.Pd."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="email@sekolah.sch.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">No. Telepon</label>
              <input
                type="text"
                className="form-control"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
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

            {selectedTeacher && (
              <div className="form-group">
                <label className="form-label">Status Keaktifan</label>
                <select
                  className="form-control"
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                >
                  <option value={1}>Aktif Mengajar</option>
                  <option value={0}>Non-Aktif</option>
                </select>
              </div>
            )}
          </div>

          {/* Mapel Checkboxes */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Mata Pelajaran yang Diampu</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.5rem',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '160px',
              overflowY: 'auto',
            }}>
              {subjects.map((sub) => (
                <label
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.subject_ids.includes(sub.id)}
                    onChange={() => handleSubjectToggle(sub.id)}
                  />
                  <span>{sub.name} ({sub.code})</span>
                </label>
              ))}
            </div>
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
              {selectedTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data Guru"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Apakah Anda yakin ingin menghapus data guru <strong>{selectedTeacher?.name}</strong>? Tindakan ini dapat mempengaruhi jadwal dan kelas yang diampu.
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
            onClick={handleDeleteTeacher}
            isLoading={isSaving}
          >
            Hapus Guru
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}