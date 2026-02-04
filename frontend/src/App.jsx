import React, { useState, useEffect } from 'react';
import SchemaGraph from './components/SchemaGraph';
import MetricsPanel from './components/MetricsPanel';
import QueryAnalyzer from './components/QueryAnalyzer';
import SchemaHealth from './components/SchemaHealth';
import TypeExplorer from './components/TypeExplorer';
import QueryHistory from './components/QueryHistory';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('health');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  const tabs = [
    { id: 'health', label: 'Health', icon: '💊' },
    { id: 'graph', label: 'Schema Graph', icon: '🔗' },
    { id: 'explorer', label: 'Type Explorer', icon: '🔎' },
    { id: 'metrics', label: 'Metrics', icon: '📊' },
    { id: 'analyzer', label: 'Query Analyzer', icon: '⚡' },
    { id: 'history', label: 'History', icon: '📜' },
  ];

  useEffect(() => {
    // Check server status
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:4001/health');
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch {
        setServerStatus('offline');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="logo">⚡</span>
            GraphQL Schema Intelligence
          </h1>
          <p className="tagline">Analyze schema complexity & query performance</p>
        </div>
        <div className="header-controls">
          <div className={`server-status ${serverStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {serverStatus === 'online' ? 'Server Online' : serverStatus === 'checking' ? 'Checking...' : 'Server Offline'}
            </span>
          </div>
          <button 
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <nav className="app-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'health' && <SchemaHealth />}
        {activeTab === 'graph' && <SchemaGraph />}
        {activeTab === 'explorer' && <TypeExplorer />}
        {activeTab === 'metrics' && <MetricsPanel />}
        {activeTab === 'analyzer' && <QueryAnalyzer />}
        {activeTab === 'history' && <QueryHistory />}
      </main>

      <footer className="app-footer">
        <p>
          GraphQL Schema Intelligence & Query Performance Studio
          <span className="separator">•</span>
          Built with React, D3.js, and Apollo Server
        </p>
      </footer>
    </div>
  );
}

export default App;
