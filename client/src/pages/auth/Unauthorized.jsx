import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--color-danger-500)' }}>403</h1>
      <h2 style={{ marginBottom: '1rem' }}>Akses Ditolak</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button onClick={() => navigate('/')}>
        Kembali ke Beranda
      </Button>
    </div>
  );
}
