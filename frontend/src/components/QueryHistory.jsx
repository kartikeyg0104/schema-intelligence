import React, { useState, useEffect } from 'react';
import { analyzeQuery } from '../services/api';

const QueryHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    // Load history from localStorage
    const saved = localStorage.getItem('queryHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (query, result) => {
    const newEntry = {
      id: Date.now(),
      query,
      result,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem('queryHistory', JSON.stringify(updated));
  };

  const deleteEntry = (id) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('queryHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('queryHistory');
    setSelectedQueries([]);
    setCompareMode(false);
  };

  const toggleQuerySelection = (entry) => {
    if (selectedQueries.find(q => q.id === entry.id)) {
      setSelectedQueries(selectedQueries.filter(q => q.id !== entry.id));
    } else if (selectedQueries.length < 3) {
      setSelectedQueries([...selectedQueries, entry]);
    }
  };

  const getCostLevelClass = (level) => {
    switch (level) {
      case 'low': return 'cost-low';
      case 'medium': return 'cost-medium';
      case 'high': return 'cost-high';
      case 'critical': return 'cost-critical';
      default: return '';
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const getQueryPreview = (query) => {
    const lines = query.trim().split('\n');
    return lines.slice(0, 2).join(' ').substring(0, 50) + '...';
  };

  return (
    <div className="query-history">
      <div className="history-header">
        <h2>Query History & Comparison</h2>
        <div className="history-actions">
          <button 
            className={`compare-btn ${compareMode ? 'active' : ''}`}
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedQueries([]);
            }}
          >
            {compareMode ? 'Exit Compare' : '⚖️ Compare Mode'}
          </button>
          <button className="clear-btn" onClick={clearHistory}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="compare-instructions">
          <p>Select up to 3 queries to compare. Selected: {selectedQueries.length}/3</p>
        </div>
      )}

      {/* Comparison View */}
      {compareMode && selectedQueries.length > 1 && (
        <div className="comparison-view">
          <h3>📊 Query Comparison</h3>
          <div className="comparison-grid" style={{ gridTemplateColumns: `repeat(${selectedQueries.length}, 1fr)` }}>
            {selectedQueries.map(entry => (
              <div key={entry.id} className="comparison-column">
                <div className="comparison-header">
                  <div className="comparison-time">{formatTimestamp(entry.timestamp)}</div>
                  <div className={`comparison-cost ${getCostLevelClass(entry.result.cost?.level)}`}>
                    Cost: {entry.result.cost?.score}
                  </div>
                </div>
                <div className="comparison-metrics">
                  <div className="comp-metric">
                    <span className="comp-label">Depth</span>
                    <span className="comp-value">{entry.result.metrics?.depth}</span>
                  </div>
                  <div className="comp-metric">
                    <span className="comp-label">Fields</span>
                    <span className="comp-value">{entry.result.metrics?.fieldCount}</span>
                  </div>
                  <div className="comp-metric">
                    <span className="comp-label">Lists</span>
                    <span className="comp-value">{entry.result.metrics?.listFields}</span>
                  </div>
                  <div className="comp-metric">
                    <span className="comp-label">Resolver Calls</span>
                    <span className="comp-value">{entry.result.metrics?.estimatedResolverCalls}</span>
                  </div>
                </div>
                <div className="comparison-query">
                  <pre>{entry.query}</pre>
                </div>
              </div>
            ))}
          </div>
          
          {/* Winner Badge */}
          <div className="comparison-winner">
            {(() => {
              const sorted = [...selectedQueries].sort((a, b) => 
                (a.result.cost?.score || 0) - (b.result.cost?.score || 0)
              );
              const winner = sorted[0];
              return (
                <div className="winner-badge">
                  🏆 Most Efficient: Query from {formatTimestamp(winner.timestamp)} (Cost: {winner.result.cost?.score})
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* History List */}
      <div className="history-list">
        <h3>📜 Recent Queries ({history.length})</h3>
        {history.length === 0 ? (
          <div className="no-history">
            <p>No queries analyzed yet. Go to Query Analyzer to analyze some queries!</p>
          </div>
        ) : (
          <div className="history-items">
            {history.map(entry => (
              <div 
                key={entry.id} 
                className={`history-item ${selectedQueries.find(q => q.id === entry.id) ? 'selected' : ''}`}
                onClick={() => compareMode && toggleQuerySelection(entry)}
              >
                {compareMode && (
                  <div className="selection-checkbox">
                    <input 
                      type="checkbox" 
                      checked={!!selectedQueries.find(q => q.id === entry.id)}
                      onChange={() => toggleQuerySelection(entry)}
                    />
                  </div>
                )}
                <div className="history-content">
                  <div className="history-meta">
                    <span className="history-time">{formatTimestamp(entry.timestamp)}</span>
                    <span className={`history-cost ${getCostLevelClass(entry.result.cost?.level)}`}>
                      Cost: {entry.result.cost?.score} ({entry.result.cost?.level})
                    </span>
                  </div>
                  <div className="history-preview">
                    <code>{getQueryPreview(entry.query)}</code>
                  </div>
                  <div className="history-stats">
                    <span>Depth: {entry.result.metrics?.depth}</span>
                    <span>Fields: {entry.result.metrics?.fieldCount}</span>
                    <span>Warnings: {entry.result.warnings?.length || 0}</span>
                  </div>
                </div>
                {!compareMode && (
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntry(entry.id);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Export the saveToHistory function for use in QueryAnalyzer
export const useQueryHistory = () => {
  const saveToHistory = (query, result) => {
    const saved = localStorage.getItem('queryHistory');
    const history = saved ? JSON.parse(saved) : [];
    const newEntry = {
      id: Date.now(),
      query,
      result,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 20);
    localStorage.setItem('queryHistory', JSON.stringify(updated));
  };
  
  return { saveToHistory };
};

export default QueryHistory;
