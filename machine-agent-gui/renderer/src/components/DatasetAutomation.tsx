import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DatasetAutomationProps {
  config: any;
}

export default function DatasetAutomation({ config }: DatasetAutomationProps) {
  const [category, setCategory] = useState('environmental');
  const [minRecords, setMinRecords] = useState(100);
  const [badgeCount, setBadgeCount] = useState(50);
  const [price, setPrice] = useState(99.99);
  const [pendingRecords, setPendingRecords] = useState<any[]>([]);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [isAutomating, setIsAutomating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (config) {
      fetchPendingRecords();
      window.electronAPI.onAutomationTick(() => {
        addLog('info', 'Automation tick triggered');
        handleAutomatedPublish();
      });
    }
  }, [config]);

  const addLog = (level: string, message: string) => {
    const timestamp = format(new Date(), 'HH:mm:ss');
    setStatusLogs(prev => [`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...prev].slice(0, 50));
  };

  const fetchPendingRecords = async () => {
    addLog('info', 'Fetching pending records...');
    const result = await window.electronAPI.fetchProcessedRecords();
    
    if (result.success) {
      setPendingRecords(result.data.records || []);
      addLog('success', `Fetched ${result.data.records?.length || 0} pending records`);
    } else {
      addLog('error', `Failed to fetch records: ${result.error}`);
    }
  };

  const handleAutomatedPublish = async () => {
    if (pendingRecords.length >= minRecords) {
      addLog('info', 'Threshold met, publishing dataset...');
      await handlePublishNow();
    } else {
      addLog('info', `Not enough records: ${pendingRecords.length}/${minRecords}`);
    }
  };

  const handlePublishNow = async () => {
    if (pendingRecords.length === 0) {
      addLog('warning', 'No pending records to publish');
      return;
    }

    setIsPublishing(true);
    const datasetName = `${category}-dataset-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`;
    
    addLog('info', `Publishing dataset: ${datasetName}`);

    const payload = {
      name: datasetName,
      description: `Automated dataset for ${category} category`,
      category,
      price,
      data: pendingRecords.slice(0, minRecords),
      badgeCodeCount: badgeCount
    };

    const result = await window.electronAPI.publishDataset(payload);

    if (result.success) {
      addLog('success', `✅ Dataset published successfully: ${datasetName}`);
      await fetchPendingRecords(); // Refresh after publishing
    } else {
      addLog('error', `❌ Failed to publish: ${result.error}`);
    }

    setIsPublishing(false);
  };

  const handleStartAutomation = async () => {
    addLog('info', 'Starting automation...');
    const result = await window.electronAPI.startAutomation();
    if (result.success) {
      setIsAutomating(true);
      addLog('success', 'Automation started');
    }
  };

  const handleStopAutomation = async () => {
    addLog('info', 'Stopping automation...');
    const result = await window.electronAPI.stopAutomation();
    if (result.success) {
      setIsAutomating(false);
      addLog('success', 'Automation stopped');
    }
  };

  if (!config) {
    return (
      <div className="card">
        <h2>⚠️ Configuration Required</h2>
        <p>Please configure the agent in the Settings tab.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Dataset Automation</h1>

      <div className="card">
        <h2>Configuration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="environmental">Environmental</option>
              <option value="climate">Climate</option>
              <option value="energy">Energy</option>
              <option value="sustainability">Sustainability</option>
            </select>
          </div>
          <div className="form-group">
            <label>Minimum Records Threshold</label>
            <input 
              type="number" 
              value={minRecords} 
              onChange={e => setMinRecords(parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Badge Codes to Generate</label>
            <input 
              type="number" 
              value={badgeCount} 
              onChange={e => setBadgeCount(parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Dataset Price ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={price} 
              onChange={e => setPrice(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="button-group">
          <button className="primary" onClick={handlePublishNow} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : '🚀 Publish Now'}
          </button>
          <button className="secondary" onClick={fetchPendingRecords}>
            🔄 Refresh Records
          </button>
          {!isAutomating ? (
            <button className="primary" onClick={handleStartAutomation}>
              ▶️ Start Automation
            </button>
          ) : (
            <button className="danger" onClick={handleStopAutomation}>
              ⏹️ Stop Automation
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Pending Records ({pendingRecords.length})</h2>
        <div style={{ 
          maxHeight: '300px', 
          overflow: 'auto',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '6px'
        }}>
          {pendingRecords.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Quality Score</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {pendingRecords.slice(0, 20).map((record, i) => (
                  <tr key={i}>
                    <td>{record.id?.slice(0, 8)}...</td>
                    <td>{record.category || 'N/A'}</td>
                    <td>{record.quality_score || 'N/A'}</td>
                    <td>{record.created_at ? format(new Date(record.created_at), 'MMM dd, HH:mm') : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              No pending records available
            </p>
          )}
        </div>
        {pendingRecords.length >= minRecords && (
          <div className="alert success" style={{ marginTop: '16px' }}>
            ✅ Threshold met! Ready to publish {minRecords} records.
          </div>
        )}
      </div>

      <div className="card">
        <h2>Status Logs</h2>
        <div className="logs-container" style={{ maxHeight: '250px' }}>
          {statusLogs.map((log, i) => {
            const level = log.includes('[ERROR]') ? 'error' : log.includes('[WARNING]') ? 'warning' : 'info';
            return (
              <div key={i} className={`log-entry ${level}`}>
                {log}
              </div>
            );
          })}
          {statusLogs.length === 0 && (
            <p style={{ color: '#64748b' }}>No logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
