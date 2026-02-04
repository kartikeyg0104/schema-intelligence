const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const SchemaGraphBuilder = require('./schemaGraph');
const ComplexityMetricsEngine = require('./complexityMetrics');
const QueryAnalyzer = require('./queryAnalyzer');

const app = express();
app.use(cors());
app.use(express.json());

const schemaPath = path.join(__dirname, 'schema.graphql');

// Initialize analysis engines
const graphBuilder = new SchemaGraphBuilder(schemaPath);
const metricsEngine = new ComplexityMetricsEngine(schemaPath);
const queryAnalyzer = new QueryAnalyzer(schemaPath);

/**
 * GET /schema/metrics
 * Returns schema complexity metrics
 */
app.get('/schema/metrics', (req, res) => {
  try {
    const metrics = metricsEngine.getMetricsSummary();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /schema/graph
 * Returns schema graph data for visualization
 */
app.get('/schema/graph', (req, res) => {
  try {
    const graph = graphBuilder.buildGraph();
    res.json({
      success: true,
      data: graph,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /schema/raw
 * Returns the raw GraphQL schema
 */
app.get('/schema/raw', (req, res) => {
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    res.json({
      success: true,
      data: {
        content: schemaContent,
        filename: 'schema.graphql',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /schema/export
 * Exports full schema analysis as JSON
 */
app.get('/schema/export', (req, res) => {
  try {
    const metrics = metricsEngine.getMetricsSummary();
    const graph = graphBuilder.buildGraph();
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      schema: schemaContent,
      metrics,
      graph,
      summary: {
        totalTypes: metrics.totalTypes,
        totalRelationships: metrics.totalRelationships,
        overallComplexity: metrics.overallComplexity,
        hubTypesCount: metrics.hubTypes?.length || 0,
        maxDepth: Math.max(...(metrics.deepestPaths?.map(p => p.depth) || [0])),
      },
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=schema-analysis.json');
    res.json(exportData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /query/analyze
 * Analyzes a GraphQL query and returns complexity metrics
 */
app.post('/query/analyze', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const analysis = queryAnalyzer.analyzeQuery(query);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /query/compare
 * Compares multiple queries
 */
app.post('/query/compare', (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries || !Array.isArray(queries) || queries.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 queries are required',
      });
    }

    const analyses = queries.map((query, index) => ({
      index,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      analysis: queryAnalyzer.analyzeQuery(query),
    }));
    
    // Find the most efficient query
    const sorted = analyses
      .filter(a => a.analysis.success)
      .sort((a, b) => (a.analysis.cost?.score || 0) - (b.analysis.cost?.score || 0));
    
    res.json({
      success: true,
      comparisons: analyses,
      recommendation: sorted.length > 0 ? {
        mostEfficient: sorted[0].index,
        lowestCost: sorted[0].analysis.cost?.score,
        leastEfficient: sorted[sorted.length - 1].index,
        highestCost: sorted[sorted.length - 1].analysis.cost?.score,
      } : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

const PORT = process.env.ANALYSIS_PORT || 4001;

app.listen(PORT, () => {
  console.log(`📊 Analysis Server ready at http://localhost:${PORT}`);
  console.log(`   GET  /schema/metrics  - Get schema complexity metrics`);
  console.log(`   GET  /schema/graph    - Get schema graph for visualization`);
  console.log(`   GET  /schema/raw      - Get raw GraphQL schema`);
  console.log(`   GET  /schema/export   - Export full analysis as JSON`);
  console.log(`   POST /query/analyze   - Analyze GraphQL query complexity`);
  console.log(`   POST /query/compare   - Compare multiple queries`);
});
