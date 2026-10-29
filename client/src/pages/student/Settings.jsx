import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { dashboardApi, authApi } from '../../services/api';
import { Lock, User, CheckCircle2, AlertCircle, Shield, KeyRound, RefreshCw } from 'lucide-react';

export default function StudentSettings() {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password state
  const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const dashData = await dashboardApi.getStudent();
      setStudentInfo(dashData?.student);
    } catch (err) {
      console.error('Error load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdError('Konfirmasi password baru tidak cocok');
      return;
    }

    if (pwdData.newPassword.length < 6) {
      setPwdError('Password baru minimal 6 karakter');
      return;
    }

    setIsChangingPwd(true);
    try {
      await authApi.changePassword({
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });
      setPwdSuccess('Password akun Anda berhasil diperbarui!');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err) {
      setPwdError(err.message || 'Gagal mengubah password');
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Akun</h1>
          <p className="page-subtitle">Informasi profil siswa dan keamanan akun Anda</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadProfile} isLoading={isLoading}>
          <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="var(--color-primary-600)" />
          <Card.Title>Informasi Profil Siswa</Card.Title>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="loading-spinner-box">
              <p>Memuat profil siswa...</p>
            </div>
          ) : (
            <div className="form-grid form-grid-3">
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Nama Lengkap
                </p>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {studentInfo?.name || user?.name || '-'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  NIS / NISN
                </p>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {studentInfo?.nis || '-'} / {studentInfo?.nisn || '-'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Kelas Saat Ini
                </p>
                <Badge variant="primary" size="md">
                  {studentInfo?.class_name ? `Kelas ${studentInfo.class_name}` : 'Siswa'}
                </Badge>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Jenis Kelamin
                </p>
                <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {studentInfo?.gender === 'L' ? 'Laki-Laki' : studentInfo?.gender === 'P' ? 'Perempuan' : '-'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Tempat, Tanggal Lahir
                </p>
                <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {studentInfo?.birth_place || '-'}, {studentInfo?.birth_date || '-'}
                </p>
              </div>

            </div>
          )}
        </Card.Body>
      </Card>

      {/* Security & Password Card */}
      <Card style={{ marginTop: '1.5rem' }}>
        <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={18} color="var(--color-primary-600)" />
          <Card.Title>Keamanan Akun & Ubah Password</Card.Title>
        </Card.Header>
        <Card.Body>
          {pwdSuccess && (
            <div className="alert-box alert-box--success" style={{ marginBottom: '1.25rem' }}>
              <CheckCircle2 size={18} />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="alert-box alert-box--error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Password Lama *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password saat ini"
                  value={pwdData.currentPassword}
                  onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru * (Min. 6 Karakter)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password baru"
                  value={pwdData.newPassword}
                  onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ulangi password baru"
                  value={pwdData.confirmPassword}
                  onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="md" isLoading={isChangingPwd}>
                <Lock size={16} style={{ marginRight: '0.375rem' }} /> Simpan Password Baru
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
}
