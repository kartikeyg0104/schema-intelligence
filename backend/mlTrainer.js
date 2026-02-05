const fs = require('fs');
const path = require('path');

// Use pure JavaScript neural network implementation (no native dependencies)
const { NeuralNetwork, LSTMNetwork } = require('./neuralNetwork');

/**
 * Machine Learning Trainer for GraphQL Query Analysis
 * Implements multiple ML models for different prediction tasks
 * Using pure JavaScript neural networks for cross-platform compatibility
 */

class MLTrainer {
  constructor() {
    this.disabled = false;
    this.modelsDir = path.join(__dirname, 'models');
    this.trainingData = {
      complexity: [],
      performance: [],
      anomalies: [],
    };
    
    // Neural network for query complexity prediction
    this.complexityNN = new NeuralNetwork({
      inputSize: 8,
      hiddenLayers: [10, 8, 6],
      outputSize: 1,
      activation: 'sigmoid',
      learningRate: 0.3,
    });

    // Neural network for performance prediction
    this.performanceNN = new NeuralNetwork({
      inputSize: 8,
      hiddenLayers: [12, 8, 4],
      outputSize: 1,
      activation: 'sigmoid',
      learningRate: 0.3,
    });

    // LSTM-like network for anomaly detection
    this.anomalyLSTM = new LSTMNetwork({
      inputSize: 8,
      hiddenSize: 20,
      outputSize: 1,
      learningRate: 0.1,
    });

    this.ensureModelsDirectory();
    console.log('✅ ML Trainer initialized with pure JavaScript neural networks');
  }

  ensureModelsDirectory() {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  /**
   * Extract features from query analysis for ML training
   */
  extractFeatures(queryAnalysis) {
    const features = {
      depth: queryAnalysis.maxDepth || 0,
      fieldCount: queryAnalysis.fieldCount || 0,
      listFieldCount: queryAnalysis.listFields?.length || 0,
      nestedLists: queryAnalysis.nestedLists || 0,
      estimatedCost: queryAnalysis.estimatedCost || 0,
      hasArguments: queryAnalysis.hasArguments ? 1 : 0,
      hasFragments: queryAnalysis.hasFragments ? 1 : 0,
      avgFieldsPerLevel: queryAnalysis.fieldCount / (queryAnalysis.maxDepth || 1),
    };

    return features;
  }

  /**
   * Normalize features for neural network input (0-1 range)
   */
  normalizeFeatures(features, maxValues = null) {
    if (!maxValues) {
      maxValues = {
        depth: 15,
        fieldCount: 100,
        listFieldCount: 20,
        nestedLists: 5,
        estimatedCost: 1000,
        hasArguments: 1,
        hasFragments: 1,
        avgFieldsPerLevel: 20,
      };
    }

    const normalized = {};
    for (const [key, value] of Object.entries(features)) {
      normalized[key] = Math.min(value / (maxValues[key] || 1), 1);
    }

    return normalized;
  }

  /**
   * Add training data for complexity prediction
   * @param {Object} queryAnalysis - Analysis result from QueryAnalyzer
   * @param {Number} actualComplexity - Actual complexity score (0-1)
   */
  addComplexityTrainingData(queryAnalysis, actualComplexity) {
    const features = this.extractFeatures(queryAnalysis);
    const normalized = this.normalizeFeatures(features);
    
    this.trainingData.complexity.push({
      input: normalized,
      output: { complexity: actualComplexity },
    });

    console.log(`Added complexity training data. Total samples: ${this.trainingData.complexity.length}`);
  }

  /**
   * Add training data for performance prediction
   * @param {Object} queryAnalysis - Analysis result
   * @param {Number} executionTimeMs - Actual execution time in milliseconds
   */
  addPerformanceTrainingData(queryAnalysis, executionTimeMs) {
    const features = this.extractFeatures(queryAnalysis);
    const normalized = this.normalizeFeatures(features);
    
    // Normalize execution time (assuming max 10 seconds)
    const normalizedTime = Math.min(executionTimeMs / 10000, 1);
    
    this.trainingData.performance.push({
      input: normalized,
      output: { executionTime: normalizedTime },
    });

    console.log(`Added performance training data. Total samples: ${this.trainingData.performance.length}`);
  }

  /**
   * Add training data for anomaly detection
   * @param {Object} queryAnalysis - Analysis result
   * @param {Boolean} isAnomaly - Whether the query is anomalous
   */
  addAnomalyTrainingData(queryAnalysis, isAnomaly) {
    const features = this.extractFeatures(queryAnalysis);
    const featureString = JSON.stringify(features);
    
    this.trainingData.anomalies.push({
      input: featureString,
      output: isAnomaly ? 'anomaly' : 'normal',
    });

    console.log(`Added anomaly training data. Total samples: ${this.trainingData.anomalies.length}`);
  }

  /**
   * Train the complexity prediction model
   */
  async trainComplexityModel(options = {}) {
    if (this.trainingData.complexity.length < 10) {
      // Generate synthetic data if insufficient real data
      this.generateSyntheticComplexityData(50);
    }

    console.log(`Training complexity model with ${this.trainingData.complexity.length} samples...`);

    const trainingOptions = {
      iterations: options.iterations || 2000,
      errorThresh: options.errorThresh || 0.005,
      log: true,
      logPeriod: 100,
      learningRate: 0.01,
    };

    const result = this.complexityNN.train(this.trainingData.complexity, trainingOptions);
    
    const modelPath = path.join(this.modelsDir, 'complexity-model.json');
    const modelJson = this.complexityNN.toJSON();
    fs.writeFileSync(modelPath, JSON.stringify(modelJson, null, 2));

    console.log('Complexity model training complete!');
    console.log('Final error:', result.error);
    console.log('Iterations:', result.iterations);

    return {
      success: true,
      error: result.error,
      iterations: result.iterations,
      samples: this.trainingData.complexity.length,
      modelPath,
    };
  }

  /**
   * Train the performance prediction model
   */
  async trainPerformanceModel(options = {}) {
    if (this.trainingData.performance.length < 10) {
      this.generateSyntheticPerformanceData(50);
    }

    console.log(`Training performance model with ${this.trainingData.performance.length} samples...`);

    const trainingOptions = {
      iterations: options.iterations || 2000,
      errorThresh: options.errorThresh || 0.005,
      log: true,
      logPeriod: 100,
      learningRate: 0.02,
    };

    const result = this.performanceNN.train(this.trainingData.performance, trainingOptions);
    
    const modelPath = path.join(this.modelsDir, 'performance-model.json');
    const modelJson = this.performanceNN.toJSON();
    fs.writeFileSync(modelPath, JSON.stringify(modelJson, null, 2));

    console.log('Performance model training complete!');
    console.log('Final error:', result.error);
    console.log('Iterations:', result.iterations);

    return {
      success: true,
      error: result.error,
      iterations: result.iterations,
      samples: this.trainingData.performance.length,
      modelPath,
    };
  }

  /**
   * Train the anomaly detection model
   */
  async trainAnomalyModel(options = {}) {
    if (this.trainingData.anomalies.length < 10) {
      this.generateSyntheticAnomalyData(50);
    }

    console.log(`Training anomaly detection model with ${this.trainingData.anomalies.length} samples...`);

    const trainingOptions = {
      iterations: options.iterations || 1500,
      errorThresh: options.errorThresh || 0.01,
      log: true,
      logPeriod: 100,
    };

    const result = this.anomalyLSTM.train(this.trainingData.anomalies, trainingOptions);
    
    const modelPath = path.join(this.modelsDir, 'anomaly-model.json');
    const modelJson = this.anomalyLSTM.toJSON();
    fs.writeFileSync(modelPath, JSON.stringify(modelJson, null, 2));

    console.log('Anomaly detection model training complete!');
    console.log('Final error:', result.error);
    console.log('Iterations:', result.iterations);

    return {
      success: true,
      error: result.error,
      iterations: result.iterations,
      samples: this.trainingData.anomalies.length,
      modelPath,
    };
  }

  /**
   * Train all models
   */
  async trainAllModels(options = {}) {
    console.log('Starting comprehensive ML model training...');
    
    const results = {
      complexity: await this.trainComplexityModel(options),
      performance: await this.trainPerformanceModel(options),
      anomaly: await this.trainAnomalyModel(options),
    };

    // Save metadata
    const metadataPath = path.join(this.modelsDir, 'training-metadata.json');
    const metadata = {
      trainedAt: new Date().toISOString(),
      results,
      totalSamples: {
        complexity: this.trainingData.complexity.length,
        performance: this.trainingData.performance.length,
        anomalies: this.trainingData.anomalies.length,
      },
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('All models trained successfully!');
    return results;
  }

  /**
   * Generate synthetic training data for complexity prediction
   */
  generateSyntheticComplexityData(count) {
    console.log(`Generating ${count} synthetic complexity samples...`);
    
    for (let i = 0; i < count; i++) {
      const depth = Math.floor(Math.random() * 10) + 1;
      const fieldCount = Math.floor(Math.random() * 50) + 1;
      const listFieldCount = Math.floor(Math.random() * 10);
      const nestedLists = Math.floor(Math.random() * 3);
      
      // Calculate synthetic complexity based on heuristics
      const complexity = (
        depth * 0.1 +
        fieldCount * 0.01 +
        listFieldCount * 0.05 +
        nestedLists * 0.15
      );

      const features = {
        depth,
        fieldCount,
        listFieldCount,
        nestedLists,
        estimatedCost: depth * fieldCount,
        hasArguments: Math.random() > 0.5 ? 1 : 0,
        hasFragments: Math.random() > 0.7 ? 1 : 0,
        avgFieldsPerLevel: fieldCount / depth,
      };

      this.trainingData.complexity.push({
        input: this.normalizeFeatures(features),
        output: { complexity: Math.min(complexity, 1) },
      });
    }
  }

  /**
   * Generate synthetic training data for performance prediction
   */
  generateSyntheticPerformanceData(count) {
    console.log(`Generating ${count} synthetic performance samples...`);
    
    for (let i = 0; i < count; i++) {
      const depth = Math.floor(Math.random() * 10) + 1;
      const fieldCount = Math.floor(Math.random() * 50) + 1;
      const listFieldCount = Math.floor(Math.random() * 10);
      const nestedLists = Math.floor(Math.random() * 3);
      
      // Simulate execution time based on query characteristics
      const baseTime = 50; // ms
      const executionTime = baseTime + 
        depth * 20 + 
        fieldCount * 5 + 
        listFieldCount * 30 + 
        nestedLists * 100 +
        Math.random() * 100;

      const features = {
        depth,
        fieldCount,
        listFieldCount,
        nestedLists,
        estimatedCost: depth * fieldCount,
        hasArguments: Math.random() > 0.5 ? 1 : 0,
        hasFragments: Math.random() > 0.7 ? 1 : 0,
        avgFieldsPerLevel: fieldCount / depth,
      };

      this.trainingData.performance.push({
        input: this.normalizeFeatures(features),
        output: { executionTime: Math.min(executionTime / 10000, 1) },
      });
    }
  }

  /**
   * Generate synthetic training data for anomaly detection
   */
  generateSyntheticAnomalyData(count) {
    console.log(`Generating ${count} synthetic anomaly samples...`);
    
    for (let i = 0; i < count; i++) {
      const isAnomaly = Math.random() > 0.7; // 30% anomalies
      
      let depth, fieldCount, listFieldCount, nestedLists;
      
      if (isAnomaly) {
        // Anomalous patterns: very deep, many lists, unusual ratios
        depth = Math.floor(Math.random() * 10) + 10; // Deep queries
        fieldCount = Math.floor(Math.random() * 100) + 50;
        listFieldCount = Math.floor(Math.random() * 15) + 10;
        nestedLists = Math.floor(Math.random() * 5) + 3;
      } else {
        // Normal patterns
        depth = Math.floor(Math.random() * 5) + 1;
        fieldCount = Math.floor(Math.random() * 30) + 1;
        listFieldCount = Math.floor(Math.random() * 5);
        nestedLists = Math.floor(Math.random() * 2);
      }

      const features = {
        depth,
        fieldCount,
        listFieldCount,
        nestedLists,
        estimatedCost: depth * fieldCount,
        hasArguments: Math.random() > 0.5 ? 1 : 0,
        hasFragments: Math.random() > 0.7 ? 1 : 0,
        avgFieldsPerLevel: fieldCount / depth,
      };

      this.trainingData.anomalies.push({
        input: JSON.stringify(features),
        output: isAnomaly ? 'anomaly' : 'normal',
      });
    }
  }

  /**
   * Save training data to disk
   */
  saveTrainingData() {
    const dataPath = path.join(this.modelsDir, 'training-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(this.trainingData, null, 2));
    console.log(`Training data saved to ${dataPath}`);
  }

  /**
   * Load training data from disk
   */
  loadTrainingData() {
    const dataPath = path.join(this.modelsDir, 'training-data.json');
    if (fs.existsSync(dataPath)) {
      this.trainingData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      console.log(`Training data loaded from ${dataPath}`);
      return true;
    }
    return false;
  }

  /**
   * Get training statistics
   */
  getTrainingStats() {
    return {
      complexity: {
        samples: this.trainingData.complexity.length,
        avgComplexity: this.trainingData.complexity.reduce((sum, d) => 
          sum + d.output.complexity, 0) / this.trainingData.complexity.length || 0,
      },
      performance: {
        samples: this.trainingData.performance.length,
        avgExecutionTime: this.trainingData.performance.reduce((sum, d) => 
          sum + d.output.executionTime, 0) / this.trainingData.performance.length || 0,
      },
      anomalies: {
        samples: this.trainingData.anomalies.length,
        anomalyCount: this.trainingData.anomalies.filter(d => 
          d.output === 'anomaly').length,
        normalCount: this.trainingData.anomalies.filter(d => 
          d.output === 'normal').length,
      },
    };
  }
}

module.exports = MLTrainer;
