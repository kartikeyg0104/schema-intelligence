import React, { useState } from 'react';
import { analyzeQuery } from '../services/api';

const QueryAnalyzer = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleQueries = [
    {
      name: 'Simple Query',
      query: `query {
  users {
    id
    name
    email
  }
}`,
    },
    {
      name: 'Moderate Query',
      query: `query {
  publications {
    title
    abstract
    authors {
      name
      institution {
        name
      }
    }
    tags {
      name
    }
  }
}`,
    },
    {
      name: 'Complex Query',
      query: `query {
  publications {
    title
    authors {
      name
      institution {
        name
        authors {
          name
          publications {
            title
          }
        }
      }
    }
    citations {
      title
      citations {
        title
      }
    }
    comments {
      content
      author {
        name
      }
    }
  }
}`,
    },
  ];

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError('Please enter a GraphQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeQuery(query);
      if (response.success) {
        setResult(response);
        // Save to history
        const saved = localStorage.getItem('queryHistory');
        const history = saved ? JSON.parse(saved) : [];
        const newEntry = {
          id: Date.now(),
          query,
          result: response,
          timestamp: new Date().toISOString(),
        };
        const updated = [newEntry, ...history].slice(0, 20);
        localStorage.setItem('queryHistory', JSON.stringify(updated));
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to analyze query');
    } finally {
      setLoading(false);
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

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'error': return 'severity-error';
      case 'warning': return 'severity-warning';
      case 'info': return 'severity-info';
      default: return '';
    }
  };

  return (
    <div className="query-analyzer">
      <h2>Query Analyzer</h2>
      
      <div className="query-input-section">
        <div className="sample-queries">
          <span>Try a sample:</span>
          {sampleQueries.map((sample) => (
            <button
              key={sample.name}
              className="sample-btn"
              onClick={() => setQuery(sample.query)}
            >
              {sample.name}
            </button>
          ))}
        </div>

        <textarea
          className="query-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste your GraphQL query here..."
          rows={12}
        />

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Query'}
        </button>
      </div>

      {error && (
        <div className="query-error">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="query-results">
          {/* Cost Score */}
          <div className={`cost-badge ${getCostLevelClass(result.cost.level)}`}>
            <div className="cost-score">{result.cost.score}</div>
            <div className="cost-label">Cost Score ({result.cost.level})</div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-value">{result.metrics.depth}</div>
              <div className="metric-label">Depth</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{result.metrics.fieldCount}</div>
              <div className="metric-label">Fields</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{result.metrics.listFields}</div>
              <div className="metric-label">List Fields</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{result.metrics.nestedLists}</div>
              <div className="metric-label">Nested Lists</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{result.metrics.estimatedResolverCalls}</div>
              <div className="metric-label">Est. Resolver Calls</div>
            </div>
          </div>

          {/* Explanation */}
          <div className="explanation-section">
            <h4>📝 Explanation</h4>
            <p>{result.explanation}</p>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>⚠️ Warnings</h4>
              <ul className="warnings-list">
                {result.warnings.map((warning, index) => (
                  <li key={index} className={getSeverityClass(warning.severity)}>
                    <span className="warning-type">[{warning.type}]</span>
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h4>💡 Recommendations</h4>
              <ul className="recommendations-list">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className={`priority-${rec.priority}`}>
                    <span className="rec-priority">[{rec.priority}]</span>
                    {rec.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Field Details */}
          {result.details?.listFieldPaths?.length > 0 && (
            <div className="details-section">
              <h4>📋 List Field Paths</h4>
              <div className="field-paths">
                {result.details.listFieldPaths.map((field, index) => (
                  <div key={index} className="field-path">
                    <code>{field.path}</code>
                    <span className="list-depth-badge">depth: {field.listDepth}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryAnalyzer;
