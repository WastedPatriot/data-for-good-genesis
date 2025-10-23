import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import DatasetAutomation from './components/DatasetAutomation';
import EcoProjects from './components/EcoProjects';
import BadgeCodes from './components/BadgeCodes';
import Logs from './components/Logs';
import Settings from './components/Settings';

declare global {
  interface Window {
    electronAPI: any;
  }
}

type Tab = 'dashboard' | 'automation' | 'eco-projects' | 'badges' | 'logs' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const result = await window.electronAPI.loadConfig();
    setConfig(result);
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'automation', label: '🤖 Dataset Automation' },
    { id: 'eco-projects', label: '🌱 Eco Projects' },
    { id: 'badges', label: '🏆 Badge Codes' },
    { id: 'logs', label: '📝 Logs' },
    { id: 'settings', label: '⚙️ Settings' }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌍 DataForEarth Machine Agent</h1>
        <div className="status-indicator">
          <span className={config ? 'status-dot active' : 'status-dot'}></span>
          {config ? 'Connected' : 'Not Configured'}
        </div>
      </header>

      <div className="app-layout">
        <nav className="sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as Tab)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="content">
          {activeTab === 'dashboard' && <Dashboard config={config} />}
          {activeTab === 'automation' && <DatasetAutomation config={config} />}
          {activeTab === 'eco-projects' && <EcoProjects config={config} />}
          {activeTab === 'badges' && <BadgeCodes config={config} />}
          {activeTab === 'logs' && <Logs />}
          {activeTab === 'settings' && <Settings config={config} onConfigUpdate={loadConfig} />}
        </main>
      </div>
    </div>
  );
}

export default App;
