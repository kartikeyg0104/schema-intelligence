/**
 * Pure JavaScript Neural Network Implementation
 * No external dependencies required - works everywhere
 */

class NeuralNetwork {
  constructor(options = {}) {
    this.inputSize = options.inputSize || 10;
    this.hiddenLayers = options.hiddenLayers || [8, 6];
    this.outputSize = options.outputSize || 1;
    this.learningRate = options.learningRate || 0.3;
    this.iterations = options.iterations || 2000;
    this.errorThresh = options.errorThresh || 0.005;
    this.activation = options.activation || 'sigmoid';
    
    this.weights = [];
    this.biases = [];
    this.trained = false;
    this.error = 1;
    this.trainingIterations = 0;
    
    this._initializeNetwork();
  }

  _initializeNetwork() {
    const layers = [this.inputSize, ...this.hiddenLayers, this.outputSize];
    
    for (let i = 0; i < layers.length - 1; i++) {
      // Xavier initialization for better convergence
      const scale = Math.sqrt(2.0 / (layers[i] + layers[i + 1]));
      
      // Initialize weights
      this.weights.push(
        Array(layers[i + 1]).fill(null).map(() =>
          Array(layers[i]).fill(null).map(() => (Math.random() * 2 - 1) * scale)
        )
      );
      
      // Initialize biases
      this.biases.push(
        Array(layers[i + 1]).fill(null).map(() => (Math.random() * 2 - 1) * scale)
      );
    }
  }

  _sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  _sigmoidDerivative(x) {
    return x * (1 - x);
  }

  _relu(x) {
    return Math.max(0, x);
  }

  _reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }

  _tanh(x) {
    return Math.tanh(x);
  }

  _tanhDerivative(x) {
    return 1 - x * x;
  }

  _activate(x) {
    switch (this.activation) {
      case 'relu': return this._relu(x);
      case 'tanh': return this._tanh(x);
      default: return this._sigmoid(x);
    }
  }

  _activateDerivative(x) {
    switch (this.activation) {
      case 'relu': return this._reluDerivative(x);
      case 'tanh': return this._tanhDerivative(x);
      default: return this._sigmoidDerivative(x);
    }
  }

  _forward(input) {
    const activations = [input];
    let current = input;

    for (let i = 0; i < this.weights.length; i++) {
      const next = [];
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < current.length; k++) {
          sum += current[k] * this.weights[i][j][k];
        }
        next.push(this._activate(sum));
      }
      current = next;
      activations.push(current);
    }

    return activations;
  }

  _backward(activations, target) {
    const deltas = [];
    const numLayers = activations.length;

    // Calculate output layer error
    const outputLayer = activations[numLayers - 1];
    const outputDelta = [];
    for (let i = 0; i < outputLayer.length; i++) {
      const error = target[i] - outputLayer[i];
      outputDelta.push(error * this._activateDerivative(outputLayer[i]));
    }
    deltas.unshift(outputDelta);

    // Calculate hidden layer errors (backpropagation)
    for (let i = this.weights.length - 1; i > 0; i--) {
      const layerDelta = [];
      const layer = activations[i];
      
      for (let j = 0; j < layer.length; j++) {
        let error = 0;
        for (let k = 0; k < deltas[0].length; k++) {
          error += deltas[0][k] * this.weights[i][k][j];
        }
        layerDelta.push(error * this._activateDerivative(layer[j]));
      }
      deltas.unshift(layerDelta);
    }

    // Update weights and biases
    for (let i = 0; i < this.weights.length; i++) {
      for (let j = 0; j < this.weights[i].length; j++) {
        for (let k = 0; k < this.weights[i][j].length; k++) {
          this.weights[i][j][k] += this.learningRate * deltas[i][j] * activations[i][k];
        }
        this.biases[i][j] += this.learningRate * deltas[i][j];
      }
    }
  }

  train(data) {
    if (!data || data.length === 0) {
      throw new Error('Training data is required');
    }

    let totalError = 1;
    let iteration = 0;

    while (iteration < this.iterations && totalError > this.errorThresh) {
      totalError = 0;

      // Shuffle data for each epoch
      const shuffled = [...data].sort(() => Math.random() - 0.5);

      for (const sample of shuffled) {
        const input = Array.isArray(sample.input) ? sample.input : Object.values(sample.input);
        const target = Array.isArray(sample.output) ? sample.output : Object.values(sample.output);

        const activations = this._forward(input);
        this._backward(activations, target);

        // Calculate error
        const output = activations[activations.length - 1];
        for (let i = 0; i < target.length; i++) {
          totalError += Math.pow(target[i] - output[i], 2);
        }
      }

      totalError /= data.length;
      iteration++;

      // Log progress every 100 iterations
      if (iteration % 100 === 0) {
        console.log(`  Iteration ${iteration}: error = ${totalError.toFixed(6)}`);
      }
    }

    this.trained = true;
    this.error = totalError;
    this.trainingIterations = iteration;

    return {
      error: totalError,
      iterations: iteration
    };
  }

  run(input) {
    const inputArray = Array.isArray(input) ? input : Object.values(input);
    const activations = this._forward(inputArray);
    return activations[activations.length - 1];
  }

  toJSON() {
    return {
      inputSize: this.inputSize,
      hiddenLayers: this.hiddenLayers,
      outputSize: this.outputSize,
      learningRate: this.learningRate,
      activation: this.activation,
      weights: this.weights,
      biases: this.biases,
      trained: this.trained,
      error: this.error,
      trainingIterations: this.trainingIterations
    };
  }

  fromJSON(json) {
    this.inputSize = json.inputSize;
    this.hiddenLayers = json.hiddenLayers;
    this.outputSize = json.outputSize;
    this.learningRate = json.learningRate;
    this.activation = json.activation;
    this.weights = json.weights;
    this.biases = json.biases;
    this.trained = json.trained;
    this.error = json.error;
    this.trainingIterations = json.trainingIterations;
    return this;
  }
}

/**
 * LSTM Network for sequence/anomaly detection
 * Simplified implementation for anomaly detection
 */
class LSTMNetwork {
  constructor(options = {}) {
    this.inputSize = options.inputSize || 10;
    this.hiddenSize = options.hiddenSize || 20;
    this.outputSize = options.outputSize || 1;
    this.learningRate = options.learningRate || 0.1;
    this.iterations = options.iterations || 1000;
    this.errorThresh = options.errorThresh || 0.01;
    
    this.trained = false;
    this.error = 1;
    this.trainingIterations = 0;
    
    // For anomaly detection, we'll use a simpler approach
    // Store patterns and detect deviations
    this.patterns = [];
    this.threshold = 0.5;
    this.meanPattern = null;
    this.stdPattern = null;
  }

  train(data) {
    if (!data || data.length === 0) {
      throw new Error('Training data is required');
    }

    // Extract patterns from training data
    this.patterns = data.map(sample => {
      const input = Array.isArray(sample.input) ? sample.input : Object.values(sample.input);
      return input;
    });

    // Calculate mean pattern
    const numFeatures = this.patterns[0].length;
    this.meanPattern = Array(numFeatures).fill(0);
    this.stdPattern = Array(numFeatures).fill(0);

    // Calculate mean
    for (const pattern of this.patterns) {
      for (let i = 0; i < numFeatures; i++) {
        this.meanPattern[i] += pattern[i];
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      this.meanPattern[i] /= this.patterns.length;
    }

    // Calculate standard deviation
    for (const pattern of this.patterns) {
      for (let i = 0; i < numFeatures; i++) {
        this.stdPattern[i] += Math.pow(pattern[i] - this.meanPattern[i], 2);
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      this.stdPattern[i] = Math.sqrt(this.stdPattern[i] / this.patterns.length) || 0.1;
    }

    // Calculate threshold based on training data distances
    const distances = this.patterns.map(p => this._calculateDistance(p));
    const meanDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const stdDist = Math.sqrt(
      distances.reduce((a, d) => a + Math.pow(d - meanDist, 2), 0) / distances.length
    );
    this.threshold = meanDist + 2 * stdDist;

    this.trained = true;
    this.error = 0;
    this.trainingIterations = 1;

    return {
      error: 0,
      iterations: 1,
      threshold: this.threshold
    };
  }

  _calculateDistance(input) {
    if (!this.meanPattern) return 1;
    
    let distance = 0;
    for (let i = 0; i < input.length; i++) {
      const normalized = (input[i] - this.meanPattern[i]) / this.stdPattern[i];
      distance += normalized * normalized;
    }
    return Math.sqrt(distance / input.length);
  }

  run(input) {
    const inputArray = Array.isArray(input) ? input : Object.values(input);
    const distance = this._calculateDistance(inputArray);
    const anomalyScore = Math.min(1, distance / (this.threshold * 2));
    
    return [anomalyScore];
  }

  toJSON() {
    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      meanPattern: this.meanPattern,
      stdPattern: this.stdPattern,
      threshold: this.threshold,
      trained: this.trained,
      error: this.error,
      trainingIterations: this.trainingIterations
    };
  }

  fromJSON(json) {
    this.inputSize = json.inputSize;
    this.hiddenSize = json.hiddenSize;
    this.outputSize = json.outputSize;
    this.meanPattern = json.meanPattern;
    this.stdPattern = json.stdPattern;
    this.threshold = json.threshold;
    this.trained = json.trained;
    this.error = json.error;
    this.trainingIterations = json.trainingIterations;
    return this;
  }
}

module.exports = {
  NeuralNetwork,
  LSTMNetwork
};
