const fs = require('fs');
const path = require('path');

// Use pure JavaScript neural network implementation (no native dependencies)
const { NeuralNetwork, LSTMNetwork } = require('./neuralNetwork');

/**
 * Machine Learning Predictor for GraphQL Query Analysis
 * Loads trained models and makes predictions
 */

class MLPredictor {
  constructor() {
    this.disabled = false;
    this.modelsDir = path.join(__dirname, 'models');
    this.models = {
      complexity: null,
      performance: null,
      anomaly: null,
    };
    this.modelsLoaded = false;
    this.metadata = null;
    console.log('✅ ML Predictor initialized with pure JavaScript neural networks');
  }

  /**
   * Load all trained models from disk
   */
  loadModels() {
    try {
      // Load complexity model
      const complexityPath = path.join(this.modelsDir, 'complexity-model.json');
      if (fs.existsSync(complexityPath)) {
        const complexityJson = JSON.parse(fs.readFileSync(complexityPath, 'utf-8'));
        this.models.complexity = new NeuralNetwork({});
        this.models.complexity.fromJSON(complexityJson);
        console.log('✓ Complexity model loaded');
      }

      // Load performance model
      const performancePath = path.join(this.modelsDir, 'performance-model.json');
      if (fs.existsSync(performancePath)) {
        const performanceJson = JSON.parse(fs.readFileSync(performancePath, 'utf-8'));
        this.models.performance = new NeuralNetwork({});
        this.models.performance.fromJSON(performanceJson);
        console.log('✓ Performance model loaded');
      }

      // Load anomaly model
      const anomalyPath = path.join(this.modelsDir, 'anomaly-model.json');
      if (fs.existsSync(anomalyPath)) {
        const anomalyJson = JSON.parse(fs.readFileSync(anomalyPath, 'utf-8'));
        this.models.anomaly = new LSTMNetwork({});
        this.models.anomaly.fromJSON(anomalyJson);
        console.log('✓ Anomaly detection model loaded');
      }

      // Load metadata
      const metadataPath = path.join(this.modelsDir, 'training-metadata.json');
      if (fs.existsSync(metadataPath)) {
        this.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        console.log('✓ Model metadata loaded');
      }

      this.modelsLoaded = this.models.complexity || this.models.performance || this.models.anomaly;
      
      if (this.modelsLoaded) {
        console.log('ML models loaded successfully!');
      } else {
        console.log('No trained models found. Please train models first.');
      }

      return this.modelsLoaded;
    } catch (error) {
      console.error('Error loading models:', error);
      return false;
    }
  }

  /**
   * Extract and normalize features from query analysis
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
   * Normalize features for neural network input
   */
  normalizeFeatures(features) {
    const maxValues = {
      depth: 15,
      fieldCount: 100,
      listFieldCount: 20,
      nestedLists: 5,
      estimatedCost: 1000,
      hasArguments: 1,
      hasFragments: 1,
      avgFieldsPerLevel: 20,
    };

    const normalized = {};
    for (const [key, value] of Object.entries(features)) {
      normalized[key] = Math.min(value / (maxValues[key] || 1), 1);
    }

    return normalized;
  }

  /**
   * Predict query complexity using ML model
   */
  predictComplexity(queryAnalysis) {
    if (!this.models.complexity) {
      return {
        success: false,
        error: 'Complexity model not loaded',
      };
    }

    try {
      const features = this.extractFeatures(queryAnalysis);
      const normalized = this.normalizeFeatures(features);
      const prediction = this.models.complexity.run(normalized);
      
      const complexityScore = prediction.complexity;
      const level = this.getComplexityLevel(complexityScore);
      const confidence = this.calculateConfidence(prediction);

      return {
        success: true,
        score: complexityScore,
        level,
        confidence,
        interpretation: this.interpretComplexity(complexityScore),
        features,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Predict query execution time using ML model
   */
  predictPerformance(queryAnalysis) {
    if (!this.models.performance) {
      return {
        success: false,
        error: 'Performance model not loaded',
      };
    }

    try {
      const features = this.extractFeatures(queryAnalysis);
      const normalized = this.normalizeFeatures(features);
      const prediction = this.models.performance.run(normalized);
      
      // Denormalize execution time (max 10 seconds)
      const estimatedTimeMs = prediction.executionTime * 10000;
      const performanceLevel = this.getPerformanceLevel(estimatedTimeMs);
      const confidence = this.calculateConfidence(prediction);

      return {
        success: true,
        estimatedTimeMs: Math.round(estimatedTimeMs),
        performanceLevel,
        confidence,
        interpretation: this.interpretPerformance(estimatedTimeMs),
        features,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect if query is anomalous
   */
  detectAnomaly(queryAnalysis) {
    if (!this.models.anomaly) {
      return {
        success: false,
        error: 'Anomaly detection model not loaded',
      };
    }

    try {
      const features = this.extractFeatures(queryAnalysis);
      const featureString = JSON.stringify(features);
      const prediction = this.models.anomaly.run(featureString);
      
      const isAnomaly = prediction === 'anomaly';
      const anomalyScore = this.calculateAnomalyScore(features);

      return {
        success: true,
        isAnomaly,
        prediction,
        anomalyScore,
        interpretation: this.interpretAnomaly(isAnomaly, anomalyScore),
        features,
        reasons: this.getAnomalyReasons(features),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive ML-based analysis
   */
  analyzeQuery(queryAnalysis) {
    if (!this.modelsLoaded) {
      this.loadModels();
    }

    const predictions = {
      timestamp: new Date().toISOString(),
      mlEnabled: this.modelsLoaded ? true : false,
    };

    if (this.models.complexity) {
      predictions.complexity = this.predictComplexity(queryAnalysis);
    }

    if (this.models.performance) {
      predictions.performance = this.predictPerformance(queryAnalysis);
    }

    if (this.models.anomaly) {
      predictions.anomaly = this.detectAnomaly(queryAnalysis);
    }

    // Generate recommendations based on predictions
    predictions.recommendations = this.generateRecommendations(predictions);

    return predictions;
  }

  /**
   * Calculate complexity level from score
   */
  getComplexityLevel(score) {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Medium';
    if (score < 0.8) return 'High';
    return 'Very High';
  }

  /**
   * Calculate performance level from execution time
   */
  getPerformanceLevel(timeMs) {
    if (timeMs < 100) return 'Excellent';
    if (timeMs < 500) return 'Good';
    if (timeMs < 1000) return 'Fair';
    if (timeMs < 3000) return 'Slow';
    return 'Very Slow';
  }

  /**
   * Calculate confidence score for predictions
   */
  calculateConfidence(prediction) {
    // Simple confidence calculation based on prediction values
    const values = Object.values(prediction);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Higher confidence if prediction is further from 0.5 (more certain)
    const certainty = Math.abs(avg - 0.5) * 2;
    return Math.round(certainty * 100);
  }

  /**
   * Calculate anomaly score from features
   */
  calculateAnomalyScore(features) {
    let score = 0;
    
    // High depth is suspicious
    if (features.depth > 8) score += 0.3;
    
    // Many list fields
    if (features.listFieldCount > 7) score += 0.25;
    
    // Nested lists
    if (features.nestedLists > 2) score += 0.25;
    
    // High field count
    if (features.fieldCount > 50) score += 0.2;

    return Math.min(score, 1);
  }

  /**
   * Interpret complexity score
   */
  interpretComplexity(score) {
    if (score < 0.3) {
      return 'Simple query with minimal resource requirements';
    } else if (score < 0.6) {
      return 'Moderate complexity - acceptable for most use cases';
    } else if (score < 0.8) {
      return 'Complex query - may impact server performance';
    } else {
      return 'Very complex query - consider optimization or caching';
    }
  }

  /**
   * Interpret performance prediction
   */
  interpretPerformance(timeMs) {
    if (timeMs < 100) {
      return 'Expected to execute very quickly';
    } else if (timeMs < 500) {
      return 'Good performance expected';
    } else if (timeMs < 1000) {
      return 'Acceptable performance but room for optimization';
    } else if (timeMs < 3000) {
      return 'Slow execution expected - optimization recommended';
    } else {
      return 'Very slow execution - significant optimization needed';
    }
  }

  /**
   * Interpret anomaly detection
   */
  interpretAnomaly(isAnomaly, score) {
    if (!isAnomaly) {
      return 'Query follows normal patterns';
    } else if (score < 0.5) {
      return 'Slightly unusual query pattern detected';
    } else if (score < 0.8) {
      return 'Unusual query pattern - review recommended';
    } else {
      return 'Highly anomalous query - potential security concern or error';
    }
  }

  /**
   * Get reasons why query is flagged as anomalous
   */
  getAnomalyReasons(features) {
    const reasons = [];
    
    if (features.depth > 8) {
      reasons.push(`Excessive nesting depth (${features.depth} levels)`);
    }
    
    if (features.listFieldCount > 7) {
      reasons.push(`High number of list fields (${features.listFieldCount})`);
    }
    
    if (features.nestedLists > 2) {
      reasons.push(`Multiple nested lists (${features.nestedLists})`);
    }
    
    if (features.fieldCount > 50) {
      reasons.push(`Very large field count (${features.fieldCount})`);
    }

    if (features.avgFieldsPerLevel > 15) {
      reasons.push(`High field density (${features.avgFieldsPerLevel.toFixed(1)} fields per level)`);
    }

    return reasons;
  }

  /**
   * Generate recommendations based on predictions
   */
  generateRecommendations(predictions) {
    const recommendations = [];

    // Complexity recommendations
    if (predictions.complexity?.success && predictions.complexity.score > 0.6) {
      recommendations.push({
        type: 'complexity',
        severity: predictions.complexity.score > 0.8 ? 'high' : 'medium',
        message: 'Consider reducing query depth or field count',
        suggestions: [
          'Use pagination for list fields',
          'Split into multiple smaller queries',
          'Add query result caching',
        ],
      });
    }

    // Performance recommendations
    if (predictions.performance?.success && predictions.performance.estimatedTimeMs > 1000) {
      recommendations.push({
        type: 'performance',
        severity: predictions.performance.estimatedTimeMs > 3000 ? 'high' : 'medium',
        message: 'Query may be slow to execute',
        suggestions: [
          'Add database indexes for referenced fields',
          'Implement DataLoader for N+1 query prevention',
          'Consider using persisted queries',
        ],
      });
    }

    // Anomaly recommendations
    if (predictions.anomaly?.success && predictions.anomaly.isAnomaly) {
      recommendations.push({
        type: 'anomaly',
        severity: predictions.anomaly.anomalyScore > 0.7 ? 'high' : 'medium',
        message: 'Unusual query pattern detected',
        suggestions: [
          'Review query for potential issues',
          'Check if query matches intended use case',
          'Consider implementing query whitelisting',
        ],
        reasons: predictions.anomaly.reasons,
      });
    }

    return recommendations;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      modelsLoaded: this.modelsLoaded ? true : false,
      availableModels: {
        complexity: !!this.models.complexity,
        performance: !!this.models.performance,
        anomaly: !!this.models.anomaly,
      },
      metadata: this.metadata,
    };
  }
}

module.exports = MLPredictor;
