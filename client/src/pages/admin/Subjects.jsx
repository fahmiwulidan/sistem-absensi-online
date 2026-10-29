import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { subjectsApi } from '../../services/api';
import { Plus, Edit2, Trash2, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat mata pelajaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedSubject(null);
    setFormData({ code: '', name: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setSelectedSubject(sub);
    setFormData({ code: sub.code || '', name: sub.name || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (sub) => {
    setSelectedSubject(sub);
    setIsDeleteModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.code || !formData.name) {
      setFormError('Kode dan Nama mata pelajaran wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedSubject) {
        await subjectsApi.update(selectedSubject.id, formData);
        setSuccessMsg(`Mata pelajaran ${formData.name} berhasil diperbarui.`);
      } else {
        await subjectsApi.create(formData);
        setSuccessMsg(`Mata pelajaran ${formData.name} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan mata pelajaran');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    setIsSaving(true);
    try {
      await subjectsApi.delete(selectedSubject.id);
      setSuccessMsg(`Mata pelajaran ${selectedSubject.name} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mata Pelajaran</h1>
          <p className="page-subtitle">Kelola kurikulum dan daftar mata pelajaran sekolah</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal}>
          <Plus size={18} style={{ marginRight: '0.375rem' }} /> Tambah Mapel
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
              <p>Memuat mata pelajaran...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} />
              <p>Belum ada mata pelajaran.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '140px' }}>Kode Mapel</th>
                    <th>Nama Mata Pelajaran</th>
                    <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <Badge variant="primary">{sub.code}</Badge>
                      </td>
                      <td>
                        <strong>{sub.name}</strong>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Edit Mapel"
                            onClick={() => handleOpenEditModal(sub)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon--danger"
                            title="Hapus Mapel"
                            onClick={() => handleOpenDeleteModal(sub)}
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
        title={selectedSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
        subtitle="Masukkan kode unik dan nama mata pelajaran"
        maxWidth="480px"
      >
        <form onSubmit={handleSaveSubject}>
          {formError && (
            <div className="alert-box alert-box--error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Kode Mata Pelajaran *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: MTK, BIN, BIG, FIS"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Nama Mata Pelajaran *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Matematika Wajib"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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
              {selectedSubject ? 'Simpan Perubahan' : 'Tambah Mapel'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Mata Pelajaran"
        maxWidth="440px"
      >
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Apakah Anda yakin ingin menghapus mata pelajaran <strong>{selectedSubject?.name}</strong> ({selectedSubject?.code})?
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
            onClick={handleDeleteSubject}
            isLoading={isSaving}
          >
            Hapus
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
