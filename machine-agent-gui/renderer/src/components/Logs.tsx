import React, { useState, useEffect } from 'react';

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadLogs = async () => {
    const result = await window.electronAPI.readLogs();
    if (result.success) {
      const logLines = result.logs.split('\n').filter((line: string) => line.trim());
      setLogs(logLines.reverse());
    }
  };

  const getFilteredLogs = () => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.toLowerCase().includes(`[${filter}]`));
  };

  const getLogLevel = (log: string): string => {
    if (log.includes('[error]') || log.includes('[ERROR]')) return 'error';
    if (log.includes('[warning]') || log.includes('[WARNING]')) return 'warning';
    return 'info';
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>System Logs</h1>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Filter:</label>
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              color: '#cbd5e1',
              marginLeft: '16px'
            }}>
              <input 
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (5s)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary" onClick={loadLogs}>
              🔄 Refresh
            </button>
            <button className="danger" onClick={handleClearLogs}>
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="logs-container" style={{ maxHeight: '600px' }}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <div 
                key={index} 
                className={`log-entry ${getLogLevel(log)}`}
              >
                {log}
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              No logs to display
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Log Statistics</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Entries</div>
            <div className="stat-value" style={{ fontSize: '24px' }}>{logs.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Errors</div>
            <div className="stat-value" style={{ fontSize: '24px', color: '#ef4444' }}>
              {logs.filter(log => getLogLevel(log) === 'error').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Warnings</div>
            <div className="stat-value" style={{ fontSize: '24px', color: '#eab308' }}>
              {logs.filter(log => getLogLevel(log) === 'warning').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Info</div>
            <div className="stat-value" style={{ fontSize: '24px', color: '#3b82f6' }}>
              {logs.filter(log => getLogLevel(log) === 'info').length}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Log Information</h2>
        <ul style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li><strong>Location:</strong> Logs are stored in the application's user data directory</li>
          <li><strong>Retention:</strong> Logs are kept until manually cleared</li>
          <li><strong>Auto-refresh:</strong> Enable to automatically update logs every 5 seconds</li>
          <li><strong>Filtering:</strong> Use filters to focus on specific log levels</li>
        </ul>
      </div>
    </div>
  );
}
