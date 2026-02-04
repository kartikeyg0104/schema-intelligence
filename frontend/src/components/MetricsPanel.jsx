import React, { useEffect, useState } from 'react';
import { getSchemaMetrics } from '../services/api';

const MetricsPanel = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedInsight, setExpandedInsight] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await getSchemaMetrics();
        if (response.success) {
          setMetrics(response.data);
        }
      } catch (err) {
        setError('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const getComplexityColor = (score) => {
    if (score < 15) return '#22c55e';
    if (score < 30) return '#eab308';
    if (score < 50) return '#f97316';
    return '#ef4444';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="metrics-panel loading">
        <div className="spinner"></div>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-panel error">
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="metrics-panel">
      <h2>Schema Metrics & Insights</h2>

      {/* Overview Cards */}
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-value">{metrics.overallComplexity}</div>
          <div className="metric-label">Overall Complexity</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.totalTypes}</div>
          <div className="metric-label">Total Types</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.totalRelationships}</div>
          <div className="metric-label">Relationships</div>
        </div>
      </div>

      {/* Top Complex Types */}
      <div className="metrics-section">
        <h3>🏆 Top Complex Types</h3>
        <div className="complex-types-list">
          {metrics.topComplexTypes?.map((type, index) => (
            <div key={type.typeName} className="complex-type-item">
              <div className="type-rank">#{index + 1}</div>
              <div className="type-info">
                <div className="type-name">{type.typeName}</div>
                <div className="type-breakdown">
                  Fan-out: {type.breakdown.fanOut} | 
                  Fan-in: {type.breakdown.fanIn} | 
                  Depth: {type.breakdown.maxDepth}
                </div>
              </div>
              <div 
                className="type-score"
                style={{ backgroundColor: getComplexityColor(type.score) }}
              >
                {type.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hub Types */}
      {metrics.hubTypes?.length > 0 && (
        <div className="metrics-section">
          <h3>🔗 Hub Types</h3>
          <p className="section-description">
            These types are referenced by many other types (potential hotspots)
          </p>
          <div className="hub-types-list">
            {metrics.hubTypes.map((hub) => (
              <div key={hub.name} className="hub-type-item">
                <div className="hub-name">{hub.name}</div>
                <div className="hub-details">
                  <span className="fan-in-badge">Fan-in: {hub.fanIn}</span>
                  <span className="referenced-by">
                    ← {hub.referencedBy.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deepest Paths */}
      {metrics.deepestPaths?.length > 0 && (
        <div className="metrics-section">
          <h3>📏 Deepest Nesting Paths</h3>
          <div className="paths-list">
            {metrics.deepestPaths.map((pathInfo, index) => (
              <div key={index} className="path-item">
                <div className="path-depth">Depth: {pathInfo.depth}</div>
                <div className="path-display">
                  {pathInfo.path.map((node, i) => (
                    <span key={i}>
                      <span className="path-node">{node}</span>
                      {i < pathInfo.path.length - 1 && <span className="path-arrow">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {metrics.insights?.length > 0 && (
        <div className="metrics-section">
          <h3>💡 Insights</h3>
          <div className="insights-list">
            {metrics.insights.map((insight, index) => (
              <div 
                key={index} 
                className={`insight-item ${insight.type}`}
                onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
              >
                <div className="insight-header">
                  <span className="insight-icon">{getInsightIcon(insight.type)}</span>
                  <span className="insight-title">{insight.title}</span>
                  <span className="insight-expand">
                    {expandedInsight === index ? '▼' : '▶'}
                  </span>
                </div>
                <div className="insight-message">{insight.message}</div>
                {expandedInsight === index && insight.details && (
                  <div className="insight-details">
                    <ul>
                      {insight.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;
