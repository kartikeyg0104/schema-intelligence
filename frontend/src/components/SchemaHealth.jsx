import React, { useEffect, useState } from 'react';
import { getSchemaMetrics } from '../services/api';

const SchemaHealth = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await getSchemaMetrics();
        if (response.success) {
          setMetrics(response.data);
        }
      } catch (err) {
        setError('Failed to load schema health');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const calculateHealthScore = () => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // Deduct points for high complexity
    if (metrics.overallComplexity > 30) score -= 15;
    else if (metrics.overallComplexity > 20) score -= 8;
    
    // Deduct for too many hub types
    if (metrics.hubTypes?.length > 5) score -= 10;
    else if (metrics.hubTypes?.length > 3) score -= 5;
    
    // Deduct for deep nesting
    const maxDepth = Math.max(...(metrics.deepestPaths?.map(p => p.depth) || [0]));
    if (maxDepth > 6) score -= 15;
    else if (maxDepth > 4) score -= 8;
    
    // Deduct for high relationship count
    const relationshipRatio = metrics.totalRelationships / metrics.totalTypes;
    if (relationshipRatio > 4) score -= 10;
    else if (relationshipRatio > 3) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  };

  const getHealthGrade = (score) => {
    if (score >= 90) return { grade: 'A', label: 'Excellent', color: '#22c55e' };
    if (score >= 80) return { grade: 'B', label: 'Good', color: '#84cc16' };
    if (score >= 70) return { grade: 'C', label: 'Fair', color: '#eab308' };
    if (score >= 60) return { grade: 'D', label: 'Needs Work', color: '#f97316' };
    return { grade: 'F', label: 'Critical', color: '#ef4444' };
  };

  const getRecommendations = () => {
    if (!metrics) return [];
    
    const recommendations = [];
    
    // Always add 4 recommendations for 2x2 grid
    recommendations.push({
      priority: metrics.overallComplexity > 25 ? 'high' : 'success',
      icon: '🔧',
      title: 'Schema Complexity',
      description: metrics.overallComplexity > 25 
        ? 'Consider breaking down complex types into smaller, focused types.'
        : 'Your schema complexity is within acceptable limits.',
      action: metrics.overallComplexity > 25 ? 'Refactor Types' : 'Keep Monitoring',
      metric: metrics.overallComplexity,
      metricLabel: 'Complexity Score',
    });
    
    recommendations.push({
      priority: (metrics.hubTypes?.length || 0) > 3 ? 'medium' : 'success',
      icon: '🔗',
      title: 'Hub Type Analysis',
      description: (metrics.hubTypes?.length || 0) > 3
        ? `${metrics.hubTypes.length} hub types detected. Consider caching strategies.`
        : 'Hub types are well distributed across your schema.',
      action: (metrics.hubTypes?.length || 0) > 3 ? 'Review Hubs' : 'Looking Good',
      metric: metrics.hubTypes?.length || 0,
      metricLabel: 'Hub Types',
    });
    
    const maxDepth = Math.max(...(metrics.deepestPaths?.map(p => p.depth) || [0]));
    recommendations.push({
      priority: maxDepth > 5 ? 'high' : maxDepth > 3 ? 'medium' : 'success',
      icon: '📊',
      title: 'Query Depth Risk',
      description: maxDepth > 5
        ? `Max depth of ${maxDepth} detected. Implement query depth limits.`
        : `Query depth of ${maxDepth} is manageable.`,
      action: maxDepth > 5 ? 'Add Depth Limit' : 'Well Structured',
      metric: maxDepth,
      metricLabel: 'Max Depth',
    });
    
    const relationshipRatio = (metrics.totalRelationships / metrics.totalTypes).toFixed(1);
    recommendations.push({
      priority: relationshipRatio > 4 ? 'medium' : 'success',
      icon: '⚡',
      title: 'Relationship Density',
      description: relationshipRatio > 4
        ? 'High relationship density may impact query performance.'
        : 'Relationship density is optimal for your schema size.',
      action: relationshipRatio > 4 ? 'Optimize Relations' : 'Optimal',
      metric: relationshipRatio,
      metricLabel: 'Ratio',
    });
    
    return recommendations;
  };

  if (loading) {
    return (
      <div className="schema-health loading">
        <div className="spinner"></div>
        <p>Analyzing schema health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schema-health error">
        <p>❌ {error}</p>
      </div>
    );
  }

  const healthScore = calculateHealthScore();
  const healthGrade = getHealthGrade(healthScore);
  const recommendations = getRecommendations();

  return (
    <div className="schema-health">
      {/* Top Section - Score and Stats */}
      <div className="health-top-section">
        {/* Health Score Circle */}
        <div className="health-score-card">
          <div className="health-circle" style={{ '--score-color': healthGrade.color }}>
            <div className="health-score-inner">
              <div className="health-grade" style={{ color: healthGrade.color }}>
                {healthGrade.grade}
              </div>
              <div className="health-score-value">{healthScore}</div>
              <div className="health-label">{healthGrade.label}</div>
            </div>
            <svg className="health-ring" viewBox="0 0 120 120">
              <circle
                className="health-ring-bg"
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                className="health-ring-progress"
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={healthGrade.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${healthScore * 3.39} 339`}
                transform="rotate(-90 60 60)"
              />
            </svg>
          </div>
          <div className="health-score-title">Overall Health Score</div>
        </div>

        {/* Quick Stats */}
        <div className="health-stats">
          <div className="health-stat">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.overallComplexity}</div>
              <div className="stat-label">Avg Complexity</div>
            </div>
          </div>
          <div className="health-stat">
            <div className="stat-icon">🔗</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.totalRelationships}</div>
              <div className="stat-label">Relationships</div>
            </div>
          </div>
          <div className="health-stat">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.totalTypes}</div>
              <div className="stat-label">Types</div>
            </div>
          </div>
          <div className="health-stat">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{metrics.hubTypes?.length || 0}</div>
              <div className="stat-label">Hub Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Recommendations Grid */}
      <div className="health-recommendations">
        <h3>💡 Analysis & Recommendations</h3>
        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card priority-${rec.priority}`}>
              <div className="rec-icon">{rec.icon}</div>
              <div className="rec-content">
                <div className="rec-header">
                  <h4>{rec.title}</h4>
                  <span className={`status-indicator ${rec.priority}`}>
                    {rec.priority === 'high' ? '⚠️' : rec.priority === 'medium' ? '⚡' : '✓'}
                  </span>
                </div>
                <p>{rec.description}</p>
                <div className="rec-footer">
                  <div className="rec-metric">
                    <span className="metric-value">{rec.metric}</span>
                    <span className="metric-label">{rec.metricLabel}</span>
                  </div>
                  <button className={`action-btn ${rec.priority}`}>{rec.action}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Breakdown */}
      <div className="health-bottom-section">
        <div className="health-breakdown">
          <h3>📈 Type Complexity Ranking</h3>
          <div className="breakdown-chart">
            {metrics.topComplexTypes?.slice(0, 6).map((type, index) => (
              <div key={type.typeName} className="breakdown-bar-item">
                <div className="bar-rank">#{index + 1}</div>
                <div className="bar-label">{type.typeName}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${Math.min(100, (type.score / 50) * 100)}%`,
                      backgroundColor: type.score > 35 ? '#ef4444' : type.score > 25 ? '#f97316' : type.score > 15 ? '#eab308' : '#22c55e'
                    }}
                  />
                </div>
                <div className="bar-value">{type.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Deepest Paths */}
        <div className="health-paths">
          <h3>🔍 Deepest Query Paths</h3>
          <div className="paths-list">
            {metrics.deepestPaths?.slice(0, 4).map((pathInfo, index) => (
              <div key={index} className="path-item">
                <div className="path-depth-badge">
                  <span>{pathInfo.depth}</span>
                  <small>depth</small>
                </div>
                <div className="path-nodes">
                  {pathInfo.path.map((node, i) => (
                    <span key={i} className="path-node">
                      {node}
                      {i < pathInfo.path.length - 1 && <span className="path-arrow">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaHealth;
