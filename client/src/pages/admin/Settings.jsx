import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { settingsApi, authApi } from '../../services/api';
import { Settings as SettingsIcon, Save, CheckCircle2, AlertCircle, Building2, KeyRound } from 'lucide-react';

export default function Settings() {
  const [formData, setFormData] = useState({
    school_name: '',
    school_address: '',
    school_city: '',
    school_province: '',
    school_phone: '',
    school_email: '',
    school_principal: '',
  });

  const [resetData, setResetData] = useState({
    identifier: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [error, setError] = useState(null);
  const [resetError, setResetError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    settingsApi.get()
      .then((data) => {
        if (data) {
          setFormData({
            school_name: data.school_name || data.name || '',
            school_address: data.school_address || data.address || '',
            school_city: data.school_city || data.city || '',
            school_province: data.school_province || data.province || '',
            school_phone: data.school_phone || data.phone || '',
            school_email: data.school_email || data.email || '',
            school_principal: data.school_principal || data.principal || '',
          });
        }
      })
      .catch((err) => setError(err.message || 'Gagal memuat pengaturan'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await settingsApi.update(formData);
      setSuccessMsg('Pengaturan profil sekolah berhasil diperbarui ke database!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess('');

    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetError('Konfirmasi password baru tidak cocok');
      return;
    }

    if (resetData.newPassword.length < 6) {
      setResetError('Password baru minimal 6 karakter');
      return;
    }

    setIsResetting(true);
    try {
      const res = await authApi.adminResetPassword({
        identifier: resetData.identifier,
        newPassword: resetData.newPassword,
      });
      setResetSuccess(res.message || 'Password akun berhasil di-reset!');
      setResetData({ identifier: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setResetSuccess(''), 5000);
    } catch (err) {
      setResetError(err.message || 'Gagal mereset password pengguna');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Sistem & Keamanan</h1>
          <p className="page-subtitle">Konfigurasi identitas lembaga dan reset password pengguna</p>
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

      <Card style={{ marginBottom: '2rem' }}>
        <Card.Header>
          <Card.Title>Profil Lembaga / Sekolah</Card.Title>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="loading-spinner-box">
              <p>Memuat konfigurasi sistem...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Sekolah *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nama lengkap beserta gelar kepala sekolah"
                  value={formData.school_principal}
                  onChange={(e) => setFormData({ ...formData, school_principal: e.target.value })}
                />
              </div>

              <div className="form-grid form-grid-2" style={{ marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Nomor Telepon Sekolah</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.school_phone}
                    onChange={(e) => setFormData({ ...formData, school_phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Resmi Sekolah</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.school_email}
                    onChange={(e) => setFormData({ ...formData, school_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Alamat Lengkap</label>
                <textarea
                  className="form-control"
                  value={formData.school_address}
                  onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
                />
              </div>

              <div className="form-grid form-grid-2" style={{ marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Kota / Kabupaten</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.school_city}
                    onChange={(e) => setFormData({ ...formData, school_city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Provinsi</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.school_province}
                    onChange={(e) => setFormData({ ...formData, school_province: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
                  <Save size={18} style={{ marginRight: '0.375rem' }} /> Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Reset Password Pengguna</Card.Title>
        </Card.Header>
        <Card.Body>
          {resetSuccess && (
            <div className="alert-box alert-box--success" style={{ marginBottom: '1.25rem' }}>
              <CheckCircle2 size={18} />
              <span>{resetSuccess}</span>
            </div>
          )}

          {resetError && (
            <div className="alert-box alert-box--error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} />
              <span>{resetError}</span>
            </div>
          )}

          <form onSubmit={handleAdminResetPassword}>
            <div className="form-group">
              <label className="form-label">Identitas Target (Username / NIS / NIP / Email) *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: siswa1 atau 24001 atau NIP guru"
                value={resetData.identifier}
                onChange={(e) => setResetData({ ...resetData, identifier: e.target.value })}
                required
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Admin mereset password siswa atau guru yang lupa password tanpa memerlukan password lama.
              </small>
            </div>

            <div className="form-grid form-grid-2" style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Password Baru * (Min. 6 Karakter)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password baru untuk user"
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ulangi password baru"
                  value={resetData.confirmPassword}
                  onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="md" isLoading={isResetting}>
                <KeyRound size={16} style={{ marginRight: '0.375rem' }} /> Reset Password Pengguna
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
}
