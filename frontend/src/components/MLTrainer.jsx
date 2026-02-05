import React, { useState, useEffect } from 'react';
import { 
  trainAllModels, 
  trainComplexityModel, 
  trainPerformanceModel, 
  trainAnomalyModel,
  getMLStats,
  getMLModelInfo 
} from '../services/api';

const MLTrainer = () => {
  const [loading, setLoading] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);
  const [iterations, setIterations] = useState(2000);
  const [errorThreshold, setErrorThreshold] = useState(0.005);

  useEffect(() => {
    loadStats();
    loadModelInfo();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getMLStats();
      if (response.success) {
        setStats(response.data.trainingStats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadModelInfo = async () => {
    try {
      const response = await getMLModelInfo();
      if (response.success) {
        setModelInfo(response.data);
      }
    } catch (err) {
      console.error('Failed to load model info:', err);
    }
  };

  const handleTrainAll = async () => {
    setLoading(true);
    setError(null);
    setTrainingProgress('Training all models...');
    
    try {
      const response = await trainAllModels({
        iterations,
        errorThresh: errorThreshold,
      });
      
      if (response.success) {
        setTrainingProgress('Training complete!');
        await loadStats();
        await loadModelInfo();
        setTimeout(() => setTrainingProgress(null), 3000);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async (modelType) => {
    setLoading(true);
    setError(null);
    setTrainingProgress(`Training ${modelType} model...`);
    
    try {
      let response;
      const options = { iterations, errorThresh: errorThreshold };
      
      switch (modelType) {
        case 'complexity':
          response = await trainComplexityModel(options);
          break;
        case 'performance':
          response = await trainPerformanceModel(options);
          break;
        case 'anomaly':
          response = await trainAnomalyModel(options);
          break;
        default:
          throw new Error('Invalid model type');
      }
      
      if (response.success) {
        setTrainingProgress(`${modelType} model training complete!`);
        await loadStats();
        await loadModelInfo();
        setTimeout(() => setTrainingProgress(null), 3000);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-trainer-panel">
      <h2>🤖 Machine Learning Model Trainer</h2>
      
      {/* Disabled Warning */}
      {modelInfo?.disabled && (
        <div className="disabled-warning">
          <h3>⚠️ ML Currently Unavailable</h3>
          <p>{modelInfo.message}</p>
          <p>
            The ML features require brain.js dependencies to be fully installed. 
            To enable ML capabilities, run: <code>npm rebuild</code> in the backend directory.
          </p>
        </div>
      )}
      
      {/* Model Status */}
      <div className="model-status">
        <h3>Model Status</h3>
        {modelInfo ? (
          <div className="status-grid">
            <div className={`status-item ${modelInfo.availableModels?.complexity ? 'trained' : 'untrained'}`}>
              <span className="icon">{modelInfo.availableModels?.complexity ? '✓' : '✗'}</span>
              <span>Complexity Model</span>
            </div>
            <div className={`status-item ${modelInfo.availableModels?.performance ? 'trained' : 'untrained'}`}>
              <span className="icon">{modelInfo.availableModels?.performance ? '✓' : '✗'}</span>
              <span>Performance Model</span>
            </div>
            <div className={`status-item ${modelInfo.availableModels?.anomaly ? 'trained' : 'untrained'}`}>
              <span className="icon">{modelInfo.availableModels?.anomaly ? '✓' : '✗'}</span>
              <span>Anomaly Detection Model</span>
            </div>
          </div>
        ) : (
          <p>Loading model status...</p>
        )}
      </div>

      {/* Training Configuration */}
      <div className="training-config">
        <h3>Training Configuration</h3>
        <div className="config-inputs">
          <div className="input-group">
            <label>Iterations:</label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              min="100"
              max="10000"
              step="100"
            />
          </div>
          <div className="input-group">
            <label>Error Threshold:</label>
            <input
              type="number"
              value={errorThreshold}
              onChange={(e) => setErrorThreshold(Number(e.target.value))}
              min="0.001"
              max="0.1"
              step="0.001"
            />
          </div>
        </div>
      </div>

      {/* Training Actions */}
      <div className="training-actions">
        <h3>Training Actions</h3>
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleTrainAll}
            disabled={loading || modelInfo?.disabled}
          >
            Train All Models
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleTrainModel('complexity')}
            disabled={loading || modelInfo?.disabled}
          >
            Train Complexity
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleTrainModel('performance')}
            disabled={loading || modelInfo?.disabled}
          >
            Train Performance
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleTrainModel('anomaly')}
            disabled={loading || modelInfo?.disabled}
          >
            Train Anomaly
          </button>
        </div>
      </div>

      {/* Training Progress */}
      {trainingProgress && (
        <div className="training-progress">
          <div className="progress-message">
            {loading ? '⏳ ' : '✓ '}
            {trainingProgress}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Training Statistics */}
      {stats && (
        <div className="training-stats">
          <h3>Training Statistics</h3>
          
          <div className="stat-section">
            <h4>Complexity Model</h4>
            <div className="stat-grid">
              <div className="stat">
                <span className="label">Samples:</span>
                <span className="value">{stats.complexity?.samples || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Avg Complexity:</span>
                <span className="value">{(stats.complexity?.avgComplexity || 0).toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="stat-section">
            <h4>Performance Model</h4>
            <div className="stat-grid">
              <div className="stat">
                <span className="label">Samples:</span>
                <span className="value">{stats.performance?.samples || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Avg Execution Time:</span>
                <span className="value">{(stats.performance?.avgExecutionTime || 0).toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="stat-section">
            <h4>Anomaly Detection Model</h4>
            <div className="stat-grid">
              <div className="stat">
                <span className="label">Total Samples:</span>
                <span className="value">{stats.anomalies?.samples || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Anomalies:</span>
                <span className="value">{stats.anomalies?.anomalyCount || 0}</span>
              </div>
              <div className="stat">
                <span className="label">Normal:</span>
                <span className="value">{stats.anomalies?.normalCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ml-trainer-panel {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .disabled-warning {
          padding: 20px;
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .disabled-warning h3 {
          color: #856404;
          margin: 0 0 10px 0;
        }

        .disabled-warning p {
          color: #856404;
          margin: 10px 0;
        }

        .disabled-warning code {
          background: #fff;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-weight: bold;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        h3 {
          margin: 20px 0 10px 0;
          color: #555;
          font-size: 18px;
        }

        h4 {
          margin: 10px 0;
          color: #666;
          font-size: 16px;
        }

        .model-status, .training-config, .training-actions, .training-stats {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .status-item {
          padding: 15px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-item.trained {
          background: #d4edda;
          border: 1px solid #c3e6cb;
        }

        .status-item.untrained {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        }

        .status-item .icon {
          font-size: 20px;
        }

        .config-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .input-group label {
          font-weight: 600;
          color: #555;
        }

        .input-group input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .training-progress {
          padding: 15px;
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .progress-message {
          color: #0c5460;
          font-weight: 500;
        }

        .error-message {
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          color: #721c24;
          margin-bottom: 20px;
        }

        .stat-section {
          margin-bottom: 15px;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .stat .label {
          font-weight: 600;
          color: #666;
        }

        .stat .value {
          color: #007bff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default MLTrainer;
