import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { MATERIAL_OPTIONS } from '../components/MaterialPicker';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const materialEmoji = {};
  MATERIAL_OPTIONS.forEach((m) => (materialEmoji[m.key] = m.emoji));

  const fetchLogs = async (p) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/log?page=${p}&limit=20`);
      setLogs(data.logs);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Remove this log entry?')) return;
    try {
      await apiFetch(`/log/${id}`, { method: 'DELETE' });
      toast('Log entry removed.');
      fetchLogs(page);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading && logs.length === 0) return <div className="page loading">Loading...</div>;

  return (
    <div className="page history">
      <h1>Log History</h1>
      {total === 0 ? (
        <div className="empty-state">
          <p>Nothing here yet. Every recycled item tells a story — start yours today!</p>
        </div>
      ) : (
        <>
          <p className="total-count">{total} total entries</p>
          <div className="log-list">
            {logs.map((log) => (
              <div key={log.id} className="log-row">
                <div className="log-info">
                  <span className="log-material">
                    {materialEmoji[log.material_type] || '♻️'} {log.item_count}x {log.material_type}
                  </span>
                  <span className="log-impact">
                    {parseFloat(log.carbon_saved_kg).toFixed(3)} kg CO2 | {parseFloat(log.water_saved_l).toFixed(1)} L water
                  </span>
                  <span className="log-date">{new Date(log.logged_at).toLocaleString()}</span>
                </div>
                <button className="btn-delete" onClick={() => handleDelete(log.id)}>Remove</button>
              </div>
            ))}
          </div>
          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => fetchLogs(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
