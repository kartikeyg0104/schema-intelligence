import React from 'react';

const MLPredictions = ({ predictions }) => {
  if (!predictions || !predictions.mlEnabled) {
    return (
      <div className="ml-predictions-panel">
        <h3>🤖 ML Predictions</h3>
        <div className="no-predictions">
          <p>ML models not loaded. Please train the models first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-predictions-panel">
      <h3>🤖 ML Predictions</h3>
      
      {/* Complexity Prediction */}
      {predictions.complexity?.success && (
        <div className="prediction-section">
          <h4>Complexity Prediction</h4>
          <div className="prediction-content">
            <div className="main-score">
              <span className="score-label">Complexity Score:</span>
              <span className={`score-value level-${predictions.complexity.level.toLowerCase()}`}>
                {(predictions.complexity.score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="level-indicator">
              <span className="level-badge">{predictions.complexity.level}</span>
              <span className="confidence">Confidence: {predictions.complexity.confidence}%</span>
            </div>
            <p className="interpretation">{predictions.complexity.interpretation}</p>
          </div>
        </div>
      )}

      {/* Performance Prediction */}
      {predictions.performance?.success && (
        <div className="prediction-section">
          <h4>Performance Prediction</h4>
          <div className="prediction-content">
            <div className="main-score">
              <span className="score-label">Estimated Time:</span>
              <span className={`score-value level-${predictions.performance.performanceLevel.toLowerCase().replace(' ', '-')}`}>
                {predictions.performance.estimatedTimeMs}ms
              </span>
            </div>
            <div className="level-indicator">
              <span className="level-badge">{predictions.performance.performanceLevel}</span>
              <span className="confidence">Confidence: {predictions.performance.confidence}%</span>
            </div>
            <p className="interpretation">{predictions.performance.interpretation}</p>
          </div>
        </div>
      )}

      {/* Anomaly Detection */}
      {predictions.anomaly?.success && (
        <div className="prediction-section">
          <h4>Anomaly Detection</h4>
          <div className="prediction-content">
            <div className="main-score">
              <span className="score-label">Status:</span>
              <span className={`score-value ${predictions.anomaly.isAnomaly ? 'anomaly' : 'normal'}`}>
                {predictions.anomaly.isAnomaly ? 'Anomaly Detected' : 'Normal Pattern'}
              </span>
            </div>
            <div className="level-indicator">
              <span className="anomaly-score">
                Anomaly Score: {(predictions.anomaly.anomalyScore * 100).toFixed(1)}%
              </span>
            </div>
            <p className="interpretation">{predictions.anomaly.interpretation}</p>
            
            {predictions.anomaly.reasons && predictions.anomaly.reasons.length > 0 && (
              <div className="anomaly-reasons">
                <strong>Reasons:</strong>
                <ul>
                  {predictions.anomaly.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {predictions.recommendations && predictions.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h4>ML-Based Recommendations</h4>
          <div className="recommendations-list">
            {predictions.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation severity-${rec.severity}`}>
                <div className="rec-header">
                  <span className="rec-type">{rec.type}</span>
                  <span className="rec-severity">{rec.severity}</span>
                </div>
                <p className="rec-message">{rec.message}</p>
                {rec.suggestions && (
                  <ul className="rec-suggestions">
                    {rec.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .ml-predictions-panel {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
        }

        h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 20px;
        }

        h4 {
          margin: 0 0 10px 0;
          color: #555;
          font-size: 16px;
        }

        .no-predictions {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
          text-align: center;
          color: #666;
        }

        .prediction-section {
          margin-bottom: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
        }

        .prediction-section h4 {
          color: white;
          margin-bottom: 15px;
        }

        .prediction-content {
          background: rgba(255, 255, 255, 0.95);
          padding: 15px;
          border-radius: 6px;
          color: #333;
        }

        .main-score {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }

        .score-label {
          font-weight: 600;
          color: #666;
          font-size: 14px;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
        }

        .score-value.level-low,
        .score-value.level-excellent,
        .score-value.normal {
          color: #28a745;
        }

        .score-value.level-medium,
        .score-value.level-good {
          color: #ffc107;
        }

        .score-value.level-high,
        .score-value.level-fair,
        .score-value.level-slow {
          color: #fd7e14;
        }

        .score-value.level-very-high,
        .score-value.level-very-slow,
        .score-value.anomaly {
          color: #dc3545;
        }

        .level-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .level-badge {
          display: inline-block;
          padding: 5px 12px;
          background: #007bff;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .confidence,
        .anomaly-score {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        .interpretation {
          margin: 10px 0 0 0;
          color: #555;
          font-size: 14px;
          line-height: 1.5;
        }

        .anomaly-reasons {
          margin-top: 15px;
          padding: 10px;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }

        .anomaly-reasons strong {
          color: #856404;
        }

        .anomaly-reasons ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .anomaly-reasons li {
          margin: 5px 0;
          color: #856404;
        }

        .recommendations-section {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .recommendation {
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .recommendation.severity-high {
          background: #f8d7da;
          border-color: #dc3545;
        }

        .recommendation.severity-medium {
          background: #fff3cd;
          border-color: #ffc107;
        }

        .recommendation.severity-low {
          background: #d1ecf1;
          border-color: #17a2b8;
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .rec-type {
          font-weight: 700;
          text-transform: uppercase;
          font-size: 12px;
        }

        .rec-severity {
          padding: 3px 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .rec-message {
          margin: 8px 0;
          font-weight: 500;
        }

        .rec-suggestions {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .rec-suggestions li {
          margin: 5px 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default MLPredictions;
