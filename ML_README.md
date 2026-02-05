# Machine Learning Integration for GraphQL Schema Intelligence

## Overview

This project now includes comprehensive machine learning capabilities for GraphQL query analysis, prediction, and optimization. The ML system uses neural networks to predict query complexity, performance, and detect anomalous queries.

## ML Features

### 1. Query Complexity Prediction
- **Neural Network**: 3-layer feedforward network (10-8-6 neurons)
- **Predicts**: Complexity score (0-1 scale) and complexity level (Low/Medium/High/Very High)
- **Features Used**:
  - Query depth
  - Field count
  - List field count
  - Nested lists
  - Estimated cost
  - Arguments presence
  - Fragments presence
  - Average fields per level

### 2. Performance Prediction
- **Neural Network**: 3-layer feedforward network (12-8-4 neurons)
- **Predicts**: Estimated execution time in milliseconds
- **Performance Levels**: Excellent (<100ms), Good (<500ms), Fair (<1s), Slow (<3s), Very Slow (>3s)

### 3. Anomaly Detection
- **LSTM Network**: Recurrent network for pattern recognition
- **Detects**: Unusual query patterns that may indicate issues or security concerns
- **Provides**: Anomaly score and detailed reasons for flagging

## Architecture

```
backend/
├── mlTrainer.js        # Training module with synthetic data generation
├── mlPredictor.js      # Prediction module with trained models
├── queryAnalyzer.js    # Enhanced query analyzer with ML integration
├── analysisServer.js   # REST API with ML endpoints
└── models/             # Trained model storage (auto-created)
    ├── complexity-model.json
    ├── performance-model.json
    ├── anomaly-model.json
    └── training-metadata.json

frontend/
└── src/
    └── components/
        ├── MLTrainer.jsx        # ML training UI
        └── MLPredictions.jsx    # ML predictions display
```

## ML Libraries Used

- **brain.js**: JavaScript neural network library for training and prediction
- **@tensorflow/tfjs-node**: TensorFlow.js for advanced ML operations
- **ml-regression**: Regression analysis utilities
- **natural**: Natural language processing support

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- brain.js ^2.0.0-beta.23
- @tensorflow/tfjs-node ^4.17.0
- ml-regression ^6.0.1
- natural ^6.10.4

### 2. Start the Backend Server

```bash
cd backend
npm start
```

The server will start on port 4001 with ML endpoints available.

### 3. Train the Models

#### Option A: Via UI
1. Navigate to the frontend: `http://localhost:3000`
2. Click on the "ML Trainer" tab (🤖)
3. Configure training parameters:
   - Iterations: 2000 (default)
   - Error Threshold: 0.005 (default)
4. Click "Train All Models" button
5. Wait for training to complete (typically 30-60 seconds)

#### Option B: Via API
```bash
# Train all models at once
curl -X POST http://localhost:4001/ml/train/all \
  -H "Content-Type: application/json" \
  -d '{"iterations": 2000, "errorThresh": 0.005}'

# Or train individual models
curl -X POST http://localhost:4001/ml/train/complexity \
  -H "Content-Type: application/json" \
  -d '{"iterations": 2000}'
```

### 4. Use ML Predictions

Once models are trained, predictions will automatically be included in query analysis:

```bash
# Analyze a query with ML predictions
curl -X POST http://localhost:4001/query/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { users { id name posts { title comments { text } } } }"
  }'
```

Response includes:
```json
{
  "success": true,
  "metrics": { ... },
  "cost": { ... },
  "mlPredictions": {
    "complexity": {
      "score": 0.65,
      "level": "High",
      "confidence": 85,
      "interpretation": "Complex query - may impact server performance"
    },
    "performance": {
      "estimatedTimeMs": 450,
      "performanceLevel": "Good",
      "confidence": 78
    },
    "anomaly": {
      "isAnomaly": false,
      "anomalyScore": 0.2,
      "prediction": "normal"
    },
    "recommendations": [...]
  }
}
```

## ML API Endpoints

### Training Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ml/train/all` | Train all ML models |
| POST | `/ml/train/complexity` | Train complexity prediction model |
| POST | `/ml/train/performance` | Train performance prediction model |
| POST | `/ml/train/anomaly` | Train anomaly detection model |
| POST | `/ml/training-data/add` | Add custom training data |

### Prediction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ml/predict` | Get ML predictions for a query |
| GET | `/ml/stats` | Get training statistics |
| GET | `/ml/models/info` | Get model information and status |

## Training Data

### Initial Training
The system generates synthetic training data on first training:
- **50 complexity samples**: Based on query characteristics
- **50 performance samples**: Simulated execution times
- **50 anomaly samples**: Mix of normal and anomalous patterns

### Adding Real Training Data

As you analyze real queries, you can add actual data to improve model accuracy:

```javascript
// Add complexity training data
await fetch('http://localhost:4001/ml/training-data/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'complexity',
    queryAnalysis: {
      maxDepth: 5,
      fieldCount: 20,
      listFields: { length: 3 },
      nestedLists: 1,
      estimatedCost: 85
    },
    actualValue: 0.7  // Actual complexity score (0-1)
  })
});

// Add performance training data
await fetch('http://localhost:4001/ml/training-data/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'performance',
    queryAnalysis: { ... },
    actualValue: 250  // Actual execution time in ms
  })
});

// Add anomaly training data
await fetch('http://localhost:4001/ml/training-data/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'anomaly',
    queryAnalysis: { ... },
    actualValue: true  // true if anomalous, false if normal
  })
});
```

## Model Improvement Workflow

1. **Start with synthetic data**: Initial training uses generated data
2. **Analyze real queries**: Use the Query Analyzer to process actual queries
3. **Collect feedback**: Record actual complexity, execution time, and issues
4. **Add training data**: Use the `/ml/training-data/add` endpoint
5. **Retrain models**: Periodically retrain with accumulated real data
6. **Monitor accuracy**: Check ML Stats to see improvements

## ML Predictions in UI

The Query Analyzer now displays ML predictions automatically:

1. Enter or paste a GraphQL query
2. Click "Analyze Query"
3. View traditional metrics (depth, cost, etc.)
4. Scroll down to see "🤖 ML Predictions" section with:
   - Complexity prediction with confidence level
   - Performance estimation
   - Anomaly detection results
   - ML-based recommendations

## Configuration

### Training Parameters

```javascript
{
  iterations: 2000,      // Training iterations (100-10000)
  errorThresh: 0.005     // Target error threshold (0.001-0.1)
}
```

**Recommendations**:
- **Quick training**: iterations=500, errorThresh=0.01
- **Standard training**: iterations=2000, errorThresh=0.005
- **High accuracy**: iterations=5000, errorThresh=0.001

### Model Storage

Models are saved in `backend/models/`:
- JSON format for easy inspection
- Automatically loaded on server start
- Persist across restarts

## ML Concepts Used

### 1. Supervised Learning
- Training data consists of input features and expected outputs
- Models learn to map query characteristics to outcomes

### 2. Feature Engineering
- Normalized input features (0-1 scale)
- Composite features (e.g., avgFieldsPerLevel)
- Domain-specific feature selection

### 3. Neural Network Architecture
- **Feedforward networks**: For complexity and performance
- **Recurrent networks (LSTM)**: For anomaly detection
- **Multiple hidden layers**: Feature extraction and pattern recognition

### 4. Synthetic Data Generation
- Heuristic-based generation for initial training
- Covers diverse query patterns
- Includes edge cases (very deep, many lists)

### 5. Confidence Scoring
- Measures prediction certainty
- Helps identify when more training data is needed

### 6. Ensemble Recommendations
- Combines traditional analysis with ML predictions
- Provides comprehensive recommendations

## Performance Considerations

- **Training Time**: 30-60 seconds for all models (2000 iterations)
- **Prediction Time**: <10ms per query
- **Model Size**: ~200KB total for all three models
- **Memory Usage**: ~50MB during training, ~10MB at runtime

## Troubleshooting

### Models Not Loading
```bash
# Check if models exist
ls backend/models/

# If missing, train models
curl -X POST http://localhost:4001/ml/train/all
```

### Poor Prediction Accuracy
1. Add more real training data
2. Increase training iterations
3. Lower error threshold
4. Retrain models with updated data

### Training Failures
- Check Node.js version (requires v14+)
- Ensure sufficient memory (recommended 2GB+)
- Verify all dependencies installed

## Future Enhancements

- [ ] Online learning (continuous model updates)
- [ ] Query clustering and pattern recognition
- [ ] Automated performance optimization suggestions
- [ ] Multi-model ensemble predictions
- [ ] Transfer learning from other GraphQL schemas
- [ ] Real-time anomaly alerting
- [ ] Query cost prediction for different data volumes

## Contributing

To contribute ML improvements:

1. Test new features with various query patterns
2. Document model architecture changes
3. Include training data examples
4. Update this README with new capabilities

## License

MIT License - Same as parent project
