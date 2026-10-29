import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authApi, dashboardApi } from '../../services/api';
import { Lock, User, CheckCircle2, AlertCircle, KeyRound, RefreshCw, Users } from 'lucide-react';

export default function ParentSettings() {
  const { user } = useAuth();
  const [childrenData, setChildrenData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Password state
  const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const dashData = await dashboardApi.getParent();
      setChildrenData(dashData?.children || []);
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
          <p className="page-subtitle">Informasi profil orang tua dan keamanan akun</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadProfile} isLoading={isLoading}>
          <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="var(--color-primary-600)" />
          <Card.Title>Informasi Profil Orang Tua</Card.Title>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="loading-spinner-box">
              <p>Memuat profil...</p>
            </div>
          ) : (
            <div className="form-grid form-grid-3">
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Nama Lengkap
                </p>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {user?.name || '-'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Username
                </p>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {user?.username || '-'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Role
                </p>
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Orang Tua
                </p>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Children Info Card */}
      {childrenData.length > 0 && (
        <Card style={{ marginTop: '1.5rem' }}>
          <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--color-primary-600)" />
            <Card.Title>Data Anak yang Terhubung</Card.Title>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {childrenData.map((child, idx) => (
                <div
                  key={child.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-base)'
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--color-primary-100)',
                      color: 'var(--color-primary-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {child.name?.charAt(0) || 'S'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                      {child.name}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      NIS: {child.nis || '-'} · Kelas {child.class_name || '-'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                      Kehadiran
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-600)' }}>
                      {child.stats?.percentage || 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

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
