import axios from 'axios';

const ANALYSIS_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4001';

const api = axios.create({
  baseURL: ANALYSIS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch schema complexity metrics
 */
export const getSchemaMetrics = async () => {
  try {
    const response = await api.get('/schema/metrics');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch schema metrics:', error);
    throw error;
  }
};

/**
 * Fetch schema graph data for visualization
 */
export const getSchemaGraph = async () => {
  try {
    const response = await api.get('/schema/graph');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch schema graph:', error);
    throw error;
  }
};

/**
 * Fetch raw GraphQL schema
 */
export const getRawSchema = async () => {
  try {
    const response = await api.get('/schema/raw');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch raw schema:', error);
    throw error;
  }
};

/**
 * Export full schema analysis
 */
export const exportSchemaAnalysis = async () => {
  try {
    const response = await api.get('/schema/export');
    return response.data;
  } catch (error) {
    console.error('Failed to export schema analysis:', error);
    throw error;
  }
};

/**
 * Analyze a GraphQL query
 */
export const analyzeQuery = async (query) => {
  try {
    const response = await api.post('/query/analyze', { query });
    return response.data;
  } catch (error) {
    console.error('Failed to analyze query:', error);
    throw error;
  }
};

/**
 * Compare multiple queries
 */
export const compareQueries = async (queries) => {
  try {
    const response = await api.post('/query/compare', { queries });
    return response.data;
  } catch (error) {
    console.error('Failed to compare queries:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * ML API Functions
 */

/**
 * Train all ML models
 */
export const trainAllModels = async (options = {}) => {
  try {
    const response = await api.post('/ml/train/all', options);
    return response.data;
  } catch (error) {
    console.error('Failed to train models:', error);
    throw error;
  }
};

/**
 * Train complexity model
 */
export const trainComplexityModel = async (options = {}) => {
  try {
    const response = await api.post('/ml/train/complexity', options);
    return response.data;
  } catch (error) {
    console.error('Failed to train complexity model:', error);
    throw error;
  }
};

/**
 * Train performance model
 */
export const trainPerformanceModel = async (options = {}) => {
  try {
    const response = await api.post('/ml/train/performance', options);
    return response.data;
  } catch (error) {
    console.error('Failed to train performance model:', error);
    throw error;
  }
};

/**
 * Train anomaly detection model
 */
export const trainAnomalyModel = async (options = {}) => {
  try {
    const response = await api.post('/ml/train/anomaly', options);
    return response.data;
  } catch (error) {
    console.error('Failed to train anomaly model:', error);
    throw error;
  }
};

/**
 * Get ML predictions for a query
 */
export const getMLPredictions = async (query) => {
  try {
    const response = await api.post('/ml/predict', { query });
    return response.data;
  } catch (error) {
    console.error('Failed to get ML predictions:', error);
    throw error;
  }
};

/**
 * Add training data
 */
export const addTrainingData = async (type, queryAnalysis, actualValue) => {
  try {
    const response = await api.post('/ml/training-data/add', {
      type,
      queryAnalysis,
      actualValue,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add training data:', error);
    throw error;
  }
};

/**
 * Get ML training statistics
 */
export const getMLStats = async () => {
  try {
    const response = await api.get('/ml/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to get ML stats:', error);
    throw error;
  }
};

/**
 * Get ML model information
 */
export const getMLModelInfo = async () => {
  try {
    const response = await api.get('/ml/models/info');
    return response.data;
  } catch (error) {
    console.error('Failed to get ML model info:', error);
    throw error;
  }
};

export default api;
