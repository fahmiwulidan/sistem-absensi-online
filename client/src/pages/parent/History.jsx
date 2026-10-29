import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { dashboardApi, attendancesApi } from '../../services/api';
import { FileText, RefreshCw, Calendar, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';

export default function ParentHistory() {
  const { user } = useAuth();
  const [childrenData, setChildrenData] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get parent dashboard data
      const dashData = await dashboardApi.getParent();
      const children = dashData?.children || [];
      setChildrenData(children);

      // Set first child as selected if none selected
      if (children.length > 0 && !selectedChildId) {
        setSelectedChildId(children[0].id);
      }

      // Load monthly summary for selected child
      if (selectedChildId) {
        await loadMonthlyData(selectedChildId);
      }
    } catch (err) {
      console.error('Error load parent history:', err);
      setError(err.message || 'Gagal memuat data riwayat');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyData = async (childId) => {
    try {
      // Fetch all attendance for this child
      const attData = await attendancesApi.getAll({ student_id: childId });
      const attendances = Array.isArray(attData) ? attData : [];

      // Group by month
      const monthlyMap = {};
      attendances.forEach((att) => {
        if (!att.date) return;
        const dateStr = typeof att.date === 'string' ? att.date.slice(0, 7) : new Date(att.date).toISOString().slice(0, 7);
        if (!monthlyMap[dateStr]) {
          monthlyMap[dateStr] = { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
        }
        monthlyMap[dateStr].total++;
        if (att.status === 'hadir') monthlyMap[dateStr].hadir++;
        if (att.status === 'izin') monthlyMap[dateStr].izin++;
        if (att.status === 'sakit') monthlyMap[dateStr].sakit++;
        if (att.status === 'alpa') monthlyMap[dateStr].alpa++;
      });

      // Convert to array and sort by month desc
      const monthly = Object.keys(monthlyMap)
        .map((month) => ({
          month,
          ...monthlyMap[month],
          percentage: monthlyMap[month].total > 0 ? Math.round((monthlyMap[month].hadir / monthlyMap[month].total) * 100) : 0
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      setMonthlyData(monthly);
    } catch (err) {
      console.error('Error load monthly data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload when selected child changes
  useEffect(() => {
    if (selectedChildId) {
      loadMonthlyData(selectedChildId);
    }
  }, [selectedChildId]);

  const formatMonthYear = (monthStr) => {
    if (!monthStr) return '-';
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const d = new Date(year, month - 1);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const selectedChild = childrenData.find((c) => c.id === selectedChildId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Kehadiran</h1>
          <p className="page-subtitle">Rekap kehadiran bulanan anak di sekolah</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
          <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="alert-box alert-box--error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Child Selector */}
      {childrenData.length > 0 && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <Card.Body>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {childrenData.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: selectedChildId === child.id ? '2px solid var(--color-primary-600)' : '1px solid var(--border-color)',
                    background: selectedChildId === child.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    fontWeight: selectedChildId === child.id ? 600 : 500,
                    color: selectedChildId === child.id ? 'var(--color-primary-700)' : 'var(--text-primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {childrenData.length === 0 ? (
        <Card>
          <Card.Body>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              Belum ada anak yang terhubung. Hubungi administrator sekolah.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Selected Child Info */}
          {selectedChild && (
            <Card style={{ marginBottom: '1.25rem' }}>
              <Card.Body style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  {selectedChild.name?.charAt(0) || 'S'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                    {selectedChild.name}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    NIS: {selectedChild.nis || '-'} · Kelas {selectedChild.class_name || '-'}
                  </p>
                </div>
                <Badge variant="primary">
                  {selectedChild.stats?.percentage || 0}% Kehadiran
                </Badge>
              </Card.Body>
            </Card>
          )}

          {/* Monthly Summary Table */}
          <Card>
            <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="var(--color-primary-600)" />
              <Card.Title>Rekap Bulanan</Card.Title>
            </Card.Header>
            <Card.Body padding="none">
              {isLoading ? (
                <div className="loading-spinner-box" style={{ padding: '2.5rem' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary-600)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Memuat riwayat bulanan...</p>
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                  <FileText size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
                  <h4 style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Belum ada riwayat</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Belum ada catatan kehadiran untuk anak ini.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bulan</th>
                        <th style={{ textAlign: 'center' }}>Total Sesi</th>
                        <th style={{ textAlign: 'center' }}>Hadir</th>
                        <th style={{ textAlign: 'center' }}>Izin</th>
                        <th style={{ textAlign: 'center' }}>Sakit</th>
                        <th style={{ textAlign: 'center' }}>Alpa</th>
                        <th style={{ textAlign: 'center' }}>Persentase Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={16} style={{ color: 'var(--color-primary-600)' }} />
                              <strong>{formatMonthYear(item.month)}</strong>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.total}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant="success">{item.hadir}</Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant="warning">{item.izin}</Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant="info">{item.sakit}</Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant="danger">{item.alpa}</Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  width: '80px',
                                  height: '8px',
                                  borderRadius: '999px',
                                  background: 'var(--color-gray-200)',
                                  overflow: 'hidden',
                                  position: 'relative'
                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    height: '100%',
                                    width: `${item.percentage}%`,
                                    background: item.percentage >= 75 ? 'var(--color-success-500)' : item.percentage >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)',
                                    transition: 'width 0.3s'
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: item.percentage >= 75 ? 'var(--color-success-600)' : item.percentage >= 50 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }}>
                                {item.percentage}%
                              </span>
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

          {/* Summary Stats */}
          {monthlyData.length > 0 && (
            <Card style={{ marginTop: '1.25rem' }}>
              <Card.Header style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--color-primary-600)" />
                <Card.Title>Ringkasan Keseluruhan</Card.Title>
              </Card.Header>
              <Card.Body>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                      Total Pertemuan
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {monthlyData.reduce((sum, m) => sum + m.total, 0)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                      Total Hadir
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success-600)' }}>
                      {monthlyData.reduce((sum, m) => sum + m.hadir, 0)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                      Total Izin
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-warning-600)' }}>
                      {monthlyData.reduce((sum, m) => sum + m.izin, 0)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                      Total Sakit
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-info-600)' }}>
                      {monthlyData.reduce((sum, m) => sum + m.sakit, 0)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                      Total Alpa
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-danger-600)' }}>
                      {monthlyData.reduce((sum, m) => sum + m.alpa, 0)}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
