import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import DatasetAutomation from './components/DatasetAutomation';
import EcoProjects from './components/EcoProjects';
import BadgeCodes from './components/BadgeCodes';
import Logs from './components/Logs';
import Settings from './components/Settings';
import ExternalScraperFeeds from './components/ExternalScraperFeeds';
import { InstitutionalSignals } from './components/InstitutionalSignals';
import DataHarvestHub from './components/DataHarvestHub';
import DatasetPublisher from './components/DatasetPublisher';

declare global {
  interface Window {
    electronAPI: any;
  }
}

type Tab = 'dashboard' | 'harvest' | 'publisher' | 'automation' | 'eco-projects' | 'badges' | 'logs' | 'settings' | 'scraper-feeds' | 'institutional-signals';

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
    { id: 'harvest', label: '🔍 Data Harvest' },
    { id: 'publisher', label: '🚀 Publisher' },
    { id: 'automation', label: '🤖 Dataset Automation' },
    { id: 'scraper-feeds', label: '🔄 Scraper Feeds' },
    { id: 'institutional-signals', label: '📈 Institutional Signals' },
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
          {activeTab === 'harvest' && <DataHarvestHub />}
          {activeTab === 'publisher' && <DatasetPublisher />}
          {activeTab === 'automation' && <DatasetAutomation config={config} />}
          {activeTab === 'scraper-feeds' && <ExternalScraperFeeds />}
          {activeTab === 'institutional-signals' && <InstitutionalSignals />}
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
