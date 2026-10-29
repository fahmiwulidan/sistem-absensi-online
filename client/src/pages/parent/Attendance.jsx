import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { attendancesApi, dashboardApi } from '../../services/api';
import {
  CheckCircle2, Clock, AlertCircle, XCircle,
  RotateCcw, Printer, RefreshCw, FileText, Calendar, Search, X, Layers
} from 'lucide-react';

export default function ParentAttendance() {
  const { user } = useAuth();
  const [childrenData, setChildrenData] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [rawAttendances, setRawAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get parent dashboard data (which children)
      const dashData = await dashboardApi.getParent();
      const children = dashData?.children || [];
      setChildrenData(children);

      // 2. Set first child as selected if none selected
      if (children.length > 0 && !selectedChildId) {
        setSelectedChildId(children[0].id);
      }

      // 3. Fetch attendance for selected child
      if (selectedChildId) {
        const attData = await attendancesApi.getAll({ student_id: selectedChildId });
        setRawAttendances(Array.isArray(attData) ? attData : []);
      }
    } catch (err) {
      console.error('Error load parent attendance:', err);
      setError(err.message || 'Gagal memuat data kehadiran anak');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload attendance when selected child changes
  useEffect(() => {
    if (selectedChildId) {
      const loadChildAttendance = async () => {
        setIsLoading(true);
        try {
          const attData = await attendancesApi.getAll({ student_id: selectedChildId });
          setRawAttendances(Array.isArray(attData) ? attData : []);
        } catch (err) {
          console.error('Error load child attendance:', err);
          setError(err.message || 'Gagal memuat data kehadiran');
        } finally {
          setIsLoading(false);
        }
      };
      loadChildAttendance();
    }
  }, [selectedChildId]);

  // Helper to extract clean YYYY-MM-DD string
  const cleanDateStr = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.slice(0, 10);
    }
    try {
      return new Date(dateVal).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  // Helper to format date into Indonesian localized format
  const formatIndoDate = (dateVal) => {
    const raw = cleanDateStr(dateVal);
    if (!raw) return '-';
    try {
      const [year, month, day] = raw.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return raw;
    }
  };

  // Filter based on Date Range
  const dateFilteredList = useMemo(() => {
    return rawAttendances.filter((item) => {
      const itemDate = cleanDateStr(item.date);
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo && itemDate > dateTo) return false;
      return true;
    });
  }, [rawAttendances, dateFrom, dateTo]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = dateFilteredList.length;
    const hadir = dateFilteredList.filter((a) => a.status === 'hadir').length;
    const izin = dateFilteredList.filter((a) => a.status === 'izin').length;
    const sakit = dateFilteredList.filter((a) => a.status === 'sakit').length;
    const alpa = dateFilteredList.filter((a) => a.status === 'alpa').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, izin, sakit, alpa, percentage };
  }, [dateFilteredList]);

  // Final filtered list for table
  const displayList = useMemo(() => {
    return dateFilteredList.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSub = item.subject_name?.toLowerCase().includes(q);
        const matchTeacher = item.teacher_name?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchSub && !matchTeacher && !matchNotes) return false;
      }
      return true;
    });
  }, [dateFilteredList, statusFilter, searchQuery]);

  const handleCardClick = (status) => {
    if (statusFilter === status) {
      setStatusFilter('');
    } else {
      setStatusFilter(status);
    }
  };

  const handleResetFilter = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedChild = childrenData.find((c) => c.id === selectedChildId);

  return (
    <div className="page">
      <div className="page-header flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="page-title">Kehadiran Anak</h1>
          <p className="page-subtitle">
            Monitor kehadiran anak di sekolah • Tingkat Kehadiran: <strong style={{ color: 'var(--color-success-600)' }}>{stats.percentage}%</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading}>
            <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} style={{ marginRight: '0.25rem' }} /> Cetak
          </Button>
        </div>
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
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Pilih Anak
            </label>
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
          {/* Quick Filter Stat Cards */}
          <div style={{ marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              ⚡ Filter Cepat Berdasarkan Status (Klik salah satu kartu):
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {/* Semua Sesi */}
              <div
                onClick={() => handleCardClick('')}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  border: statusFilter === '' ? '2px solid var(--color-primary-600)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: statusFilter === '' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'var(--shadow-sm)',
                  background: statusFilter === '' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))' : 'var(--bg-surface)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: statusFilter === '' ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-primary-50)',
                      color: 'var(--color-primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Layers size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      Semua Sesi
                    </p>
                    <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hadir */}
              <div
                onClick={() => handleCardClick('hadir')}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  border: statusFilter === 'hadir' ? '2px solid var(--color-success-600)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: statusFilter === 'hadir' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'var(--shadow-sm)',
                  background: statusFilter === 'hadir' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))' : 'var(--bg-surface)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: statusFilter === 'hadir' ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-success-50)',
                      color: 'var(--color-success-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      Total Hadir
                    </p>
                    <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-success-600)', margin: 0, lineHeight: 1.2 }}>
                      {stats.hadir}
                    </p>
                  </div>
                </div>
              </div>

              {/* Izin */}
              <div
                onClick={() => handleCardClick('izin')}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  border: statusFilter === 'izin' ? '2px solid var(--color-warning-500)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: statusFilter === 'izin' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'var(--shadow-sm)',
                  background: statusFilter === 'izin' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02))' : 'var(--bg-surface)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: statusFilter === 'izin' ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-warning-50)',
                      color: 'var(--color-warning-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Clock size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      Izin
                    </p>
                    <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-warning-600)', margin: 0, lineHeight: 1.2 }}>
                      {stats.izin}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sakit */}
              <div
                onClick={() => handleCardClick('sakit')}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  border: statusFilter === 'sakit' ? '2px solid var(--color-info-500)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: statusFilter === 'sakit' ? '0 4px 12px rgba(6, 182, 212, 0.2)' : 'var(--shadow-sm)',
                  background: statusFilter === 'sakit' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.02))' : 'var(--bg-surface)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: statusFilter === 'sakit' ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-info-50)',
                      color: 'var(--color-info-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      Sakit
                    </p>
                    <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-info-600)', margin: 0, lineHeight: 1.2 }}>
                      {stats.sakit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alpa */}
              <div
                onClick={() => handleCardClick('alpa')}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  border: statusFilter === 'alpa' ? '2px solid var(--color-danger-500)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: statusFilter === 'alpa' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'var(--shadow-sm)',
                  background: statusFilter === 'alpa' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02))' : 'var(--bg-surface)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: statusFilter === 'alpa' ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-danger-50)',
                      color: 'var(--color-danger-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <XCircle size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                      Alpa
                    </p>
                    <p style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-danger-600)', margin: 0, lineHeight: 1.2 }}>
                      {stats.alpa}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filter Card */}
          <Card style={{ marginTop: '1.25rem' }}>
            <Card.Body>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  alignItems: 'flex-end'
                }}
              >
                <div className="form-group" style={{ flex: '1 1 180px' }}>
                  <label className="form-label">Status Kehadiran</label>
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Semua Status ({stats.total})</option>
                    <option value="hadir">Hadir ({stats.hadir})</option>
                    <option value="izin">Izin ({stats.izin})</option>
                    <option value="sakit">Sakit ({stats.sakit})</option>
                    <option value="alpa">Alpa ({stats.alpa})</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">Dari Tanggal</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">Sampai Tanggal</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">Cari Mata Pelajaran / Guru</label>
                  <div className="search-input-wrapper" style={{ margin: 0, maxWidth: '100%', minWidth: '100%' }}>
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Misal: Matematika..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ padding: '0.5rem 0.75rem 0.5rem 2.25rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: '0 0 auto', minWidth: '100px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResetFilter}
                    style={{ width: '100%' }}
                  >
                    <RotateCcw size={16} style={{ marginRight: '0.25rem' }} /> Reset
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Attendance History Table */}
          <div style={{ marginTop: '1.25rem' }}>
            <Card>
              <Card.Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-primary-600)" />
                  <Card.Title>Daftar Kehadiran</Card.Title>
                </div>
                <Badge variant={statusFilter ? (statusFilter === 'hadir' ? 'success' : statusFilter === 'izin' ? 'warning' : statusFilter === 'sakit' ? 'info' : 'danger') : 'primary'}>
                  {displayList.length} dari {rawAttendances.length}
                </Badge>
              </Card.Header>
              <Card.Body padding="none">
                {isLoading ? (
                  <div className="loading-spinner-box" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary-600)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Memuat catatan kehadiran...</p>
                  </div>
                ) : displayList.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                    <FileText size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Tidak ada data kehadiran</h4>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1rem', fontSize: '0.875rem' }}>
                      Tidak ada catatan kehadiran yang sesuai kriteria filter.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleResetFilter}>
                      Reset Filter
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '140px' }}>Tanggal</th>
                          <th>Mata Pelajaran</th>
                          <th>Guru Pengajar</th>
                          <th style={{ width: '120px' }}>Waktu Sesi</th>
                          <th style={{ width: '100px' }}>Status</th>
                          <th>Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayList.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                  {formatIndoDate(item.date)}
                                </strong>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  {cleanDateStr(item.date)}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--color-primary-700)', fontSize: '0.875rem' }}>
                                {item.subject_name || '-'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                              {item.teacher_name || '-'}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                              {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                            </td>
                            <td>
                              <Badge variant={item.status}>
                                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : '-'}
                              </Badge>
                            </td>
                            <td style={{ color: item.notes ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.8125rem' }}>
                              {item.notes || '-'}
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
        </>
      )}
    </div>
  );
}
