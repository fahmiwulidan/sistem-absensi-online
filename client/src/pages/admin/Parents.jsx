import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { parentsApi, studentsApi } from '../../services/api';
import { Plus, Search, Edit2, Trash2, Users2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Parents() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'Ayah',
    student_ids: [],
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [parentsData, studentsData] = await Promise.all([
        parentsApi.getAll({ search: search || undefined }),
        studentsApi.getAll(),
      ]);
      setParents(parentsData || []);
      setStudents(studentsData || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data orang tua');
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
    setSelectedParent(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: 'Ayah',
      student_ids: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (parent) => {
    setSelectedParent(parent);
    setFormData({
      name: parent.name || '',
      phone: parent.phone || '',
      email: parent.email || '',
      relationship: parent.relationship || 'Ayah',
      student_ids: (parent.children || []).map((c) => c.student_id),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (parent) => {
    setSelectedParent(parent);
    setIsDeleteModalOpen(true);
  };

  const handleStudentToggle = (studentId) => {
    setFormData((prev) => {
      const exists = prev.student_ids.includes(studentId);
      if (exists) {
        return { ...prev, student_ids: prev.student_ids.filter((id) => id !== studentId) };
      } else {
        return { ...prev, student_ids: [...prev.student_ids, studentId] };
      }
    });
  };

  const handleSaveParent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Nama orang tua / wali wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedParent) {
        await parentsApi.update(selectedParent.id, formData);
        setSuccessMsg(`Data orang tua ${formData.name} berhasil diperbarui.`);
      } else {
        await parentsApi.create(formData);
        setSuccessMsg(`Data orang tua ${formData.name} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data orang tua');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParent = async () => {
    if (!selectedParent) return;
    setIsSaving(true);
    try {
      await parentsApi.delete(selectedParent.id);
      setSuccessMsg(`Data orang tua ${selectedParent.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menghapus data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Orang Tua</h1>
          <p className="page-subtitle">Kelola informasi akun orang tua / wali murid</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.375rem' }} /> Tambah Orang Tua
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
                  placeholder="Cari berdasarkan nama, telepon, atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Cari
              </Button>
            </form>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Total: <strong>{parents.length}</strong> Orang Tua
            </div>
          </div>
        </Card.Body>
      </Card>

      <div style={{ marginTop: '1.25rem' }}>
        <Card>
          <Card.Body padding="none">
            {isLoading ? (
              <div className="loading-spinner-box">
                <p>Memuat data orang tua...</p>
              </div>
            ) : parents.length === 0 ? (
              <div className="empty-state">
                <Users2 size={36} />
                <p>Tidak ada data orang tua yang ditemukan.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Lengkap</th>
                      <th>Hubungan</th>
                      <th>No. Telepon / WhatsApp</th>
                      <th>Email</th>
                      <th>Anak (Siswa) Terhubung</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parents.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>
                          <Badge variant="primary">{p.relationship || 'Wali'}</Badge>
                        </td>
                        <td>{p.phone || '-'}</td>
                        <td>{p.email || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {p.children && p.children.length > 0 ? (
                              p.children.map((child) => (
                                <Badge key={child.student_id} variant="neutral">
                                  {child.student_name} ({child.class_name || 'Tanpa Kelas'})
                                </Badge>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Belum terhubung</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="btn-icon"
                              title="Edit Orang Tua"
                              onClick={() => handleOpenEditModal(p)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon--danger"
                              title="Hapus Orang Tua"
                              onClick={() => handleOpenDeleteModal(p)}
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
        title={selectedParent ? 'Edit Data Orang Tua' : 'Tambah Orang Tua Baru'}
        subtitle="Isi kontak dan hubungkan akun dengan siswa"
        maxWidth="600px"
      >
        <form onSubmit={handleSaveParent}>
          {formError && (
            <div className="alert-box alert-box--error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Hendra Wijaya"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hubungan Keluarga</label>
              <select
                className="form-control"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              >
                <option value="Ayah">Ayah</option>
                <option value="Ibu">Ibu</option>
                <option value="Wali">Wali</option>
              </select>
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">No. Telepon / WhatsApp</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="ortu@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Student Selector */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Hubungkan Siswa (Anak)</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '180px',
              overflowY: 'auto',
            }}>
              {students.map((st) => (
                <label
                  key={st.id}
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
                    checked={formData.student_ids.includes(st.id)}
                    onChange={() => handleStudentToggle(st.id)}
                  />
                  <span>{st.name} ({st.class_name || 'Tanpa Kelas'})</span>
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
              {selectedParent ? 'Simpan Perubahan' : 'Tambah Orang Tua'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data Orang Tua"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Apakah Anda yakin ingin menghapus data <strong>{selectedParent?.name}</strong>?
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
            onClick={handleDeleteParent}
            isLoading={isSaving}
          >
            Hapus
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
