import React, { useState, useEffect } from 'react';

interface BadgeCodesProps {
  config: any;
}

export default function BadgeCodes({ config }: BadgeCodesProps) {
  const [badgeCount, setBadgeCount] = useState(0);
  const [generateCount, setGenerateCount] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [recentCodes, setRecentCodes] = useState<any[]>([]);

  useEffect(() => {
    if (config) {
      loadBadgeCodes();
      const interval = setInterval(loadBadgeCodes, 30000);
      return () => clearInterval(interval);
    }
  }, [config]);

  const loadBadgeCodes = async () => {
    try {
      const result = await window.electronAPI.querySupabase('badge_codes?select=*&claimed=eq.false&limit=10&order=created_at.desc');
      
      if (result.success) {
        const unclaimed = result.data || [];
        setBadgeCount(unclaimed.length);
        setRecentCodes(unclaimed.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load badge codes:', error);
    }
  };

  const handleGenerateCodes = async () => {
    if (!config) {
      setMessage({ type: 'error', text: 'Configuration required' });
      return;
    }

    setIsGenerating(true);
    setMessage({ type: 'info', text: `Generating ${generateCount} badge codes...` });

    // Use latest dataset or null
    const datasetsResult = await window.electronAPI.querySupabase('datasets?select=id&order=created_at.desc&limit=1');
    const datasetId = datasetsResult.success && datasetsResult.data?.[0]?.id || null;

    const result = await window.electronAPI.generateBadgeCodes(generateCount, datasetId);

    if (result.success) {
      setMessage({ type: 'success', text: `✅ Generated ${generateCount} badge codes successfully!` });
      await loadBadgeCodes();
    } else {
      setMessage({ type: 'error', text: `❌ Failed to generate codes: ${result.error}` });
    }

    setIsGenerating(false);
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
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Badge Code Management</h1>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '24px' }}>
          {message.text}
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Unclaimed Badge Codes</div>
          <div 
            className="stat-value" 
            style={{ color: badgeCount < 10 ? '#ef4444' : '#3b82f6' }}
          >
            {badgeCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inventory Status</div>
          <div 
            className="stat-value" 
            style={{ 
              fontSize: '18px',
              color: badgeCount < 10 ? '#ef4444' : badgeCount < 50 ? '#eab308' : '#22c55e' 
            }}
          >
            {badgeCount < 10 ? '🔴 Critical' : badgeCount < 50 ? '🟡 Low' : '🟢 Healthy'}
          </div>
        </div>
      </div>

      {badgeCount < 10 && (
        <div className="alert warning" style={{ marginBottom: '24px' }}>
          ⚠️ <strong>Low Inventory Alert!</strong> Only {badgeCount} badge codes remaining. 
          Generate more codes immediately to avoid service disruption.
        </div>
      )}

      <div className="card">
        <h2>Generate Badge Codes</h2>
        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
          Badge codes are used to reward users who contribute data to the platform.
          Each code can be claimed once to unlock exclusive content.
        </p>
        <div className="form-group">
          <label>Number of Codes to Generate</label>
          <input 
            type="number" 
            value={generateCount}
            onChange={e => setGenerateCount(parseInt(e.target.value))}
            min="1"
            max="1000"
          />
        </div>
        <button 
          className="primary"
          onClick={handleGenerateCodes}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ Generating...' : '🏆 Generate Codes'}
        </button>
      </div>

      <div className="card">
        <h2>Recent Unclaimed Codes</h2>
        <div style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {recentCodes.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Created</th>
                  <th>Dataset</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCodes.map(code => (
                  <tr key={code.id}>
                    <td style={{ fontFamily: 'monospace', color: '#3b82f6' }}>
                      {code.code}
                    </td>
                    <td>
                      {new Date(code.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {code.dataset_id ? code.dataset_id.slice(0, 8) + '...' : 'General'}
                    </td>
                    <td>
                      <span style={{
                        background: '#22c55e',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              No unclaimed codes. Generate new codes to get started.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Usage Guidelines</h2>
        <ul style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>Badge codes are automatically linked to the most recent dataset</li>
          <li>Each code can only be claimed once by a unique user</li>
          <li>Maintain an inventory of at least 50 codes for smooth operations</li>
          <li>Generate new codes after each major dataset publication</li>
          <li>Monitor the inventory daily to prevent stockouts</li>
        </ul>
      </div>
    </div>
  );
}
