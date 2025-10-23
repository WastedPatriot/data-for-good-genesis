import React, { useState, useEffect } from 'react';

interface SettingsProps {
  config: any;
  onConfigUpdate: () => void;
}

export default function Settings({ config, onConfigUpdate }: SettingsProps) {
  const [formData, setFormData] = useState({
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    INGEST_SECRET: '',
    DATA_PRICE: 99.99,
    BADGE_CODE_COUNT: 50,
    CATEGORY: 'environmental',
    MIN_RECORDS_FOR_DATASET: 100,
    POLL_INTERVAL_MINUTES: 60
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const result = await window.electronAPI.saveConfig(formData);

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Configuration saved successfully!' });
      onConfigUpdate();
    } else {
      setMessage({ type: 'error', text: `❌ Failed to save: ${result.error}` });
    }

    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!formData.SUPABASE_URL || !formData.INGEST_SECRET) {
      setMessage({ type: 'error', text: 'Please fill in Supabase URL and Ingest Secret first' });
      return;
    }

    setMessage({ type: 'info', text: 'Testing connection...' });

    try {
      const result = await window.electronAPI.querySupabase('datasets?select=count');
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Connection successful!' });
      } else {
        setMessage({ type: 'error', text: `❌ Connection failed: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Connection failed: ${error}` });
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Settings</h1>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '24px' }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>Supabase Connection</h2>
        <div className="form-group">
          <label>Supabase URL</label>
          <input 
            type="text"
            value={formData.SUPABASE_URL}
            onChange={e => handleChange('SUPABASE_URL', e.target.value)}
            placeholder="https://your-project.supabase.co"
          />
        </div>
        <div className="form-group">
          <label>Supabase Anon Key</label>
          <input 
            type="password"
            value={formData.SUPABASE_ANON_KEY}
            onChange={e => handleChange('SUPABASE_ANON_KEY', e.target.value)}
            placeholder="Anon/Publishable key"
          />
        </div>
        <div className="form-group">
          <label>Ingest Secret</label>
          <input 
            type="password"
            value={formData.INGEST_SECRET}
            onChange={e => handleChange('INGEST_SECRET', e.target.value)}
            placeholder="Your secret key"
          />
        </div>
        <button className="secondary" onClick={handleTestConnection}>
          🔌 Test Connection
        </button>
      </div>

      <div className="card">
        <h2>Dataset Configuration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Default Category</label>
            <select 
              value={formData.CATEGORY}
              onChange={e => handleChange('CATEGORY', e.target.value)}
            >
              <option value="environmental">Environmental</option>
              <option value="climate">Climate</option>
              <option value="energy">Energy</option>
              <option value="sustainability">Sustainability</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dataset Price ($)</label>
            <input 
              type="number"
              step="0.01"
              value={formData.DATA_PRICE}
              onChange={e => handleChange('DATA_PRICE', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Minimum Records for Dataset</label>
            <input 
              type="number"
              value={formData.MIN_RECORDS_FOR_DATASET}
              onChange={e => handleChange('MIN_RECORDS_FOR_DATASET', parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Badge Codes per Dataset</label>
            <input 
              type="number"
              value={formData.BADGE_CODE_COUNT}
              onChange={e => handleChange('BADGE_CODE_COUNT', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Automation Settings</h2>
        <div className="form-group">
          <label>Poll Interval (minutes)</label>
          <input 
            type="number"
            value={formData.POLL_INTERVAL_MINUTES}
            onChange={e => handleChange('POLL_INTERVAL_MINUTES', parseInt(e.target.value))}
            min="1"
            max="1440"
          />
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
            How often the agent checks for new records to publish (1-1440 minutes)
          </p>
        </div>
      </div>

      <div className="button-group">
        <button 
          className="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '💾 Saving...' : '💾 Save Configuration'}
        </button>
      </div>

      <div className="card">
        <h2>Configuration Guide</h2>
        <ol style={{ color: '#94a3b8', lineHeight: '2', paddingLeft: '20px' }}>
          <li>Enter your Supabase project URL from the DataForEarth project</li>
          <li>Add your INGEST_SECRET (found in Supabase secrets)</li>
          <li>Test the connection to verify credentials</li>
          <li>Configure dataset defaults and automation settings</li>
          <li>Save the configuration to persist settings</li>
          <li>Start the automation from the Dataset Automation tab</li>
        </ol>
      </div>
    </div>
  );
}
