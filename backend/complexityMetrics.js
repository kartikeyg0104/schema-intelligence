const SchemaGraphBuilder = require('./schemaGraph');
const path = require('path');

/**
 * Complexity Metrics Engine
 * Computes explainable schema-level metrics
 */

class ComplexityMetricsEngine {
  constructor(schemaPath) {
    this.graphBuilder = new SchemaGraphBuilder(schemaPath);
    this.graph = this.graphBuilder.buildGraph();
    this.adjacencyList = this.graphBuilder.getAdjacencyList();
    this.reverseAdjacencyList = this.graphBuilder.getReverseAdjacencyList();
  }

  /**
   * Calculate maximum nesting depth from a given type using DFS
   */
  calculateMaxDepth(startType, visited = new Set()) {
    if (visited.has(startType)) {
      return 0; // Cycle detected
    }

    visited.add(startType);
    const neighbors = this.adjacencyList[startType] || [];
    
    if (neighbors.length === 0) {
      return 1;
    }

    let maxChildDepth = 0;
    for (const neighbor of neighbors) {
      const depth = this.calculateMaxDepth(neighbor, new Set(visited));
      maxChildDepth = Math.max(maxChildDepth, depth);
    }

    return 1 + maxChildDepth;
  }

  /**
   * Calculate list expansion risk for a type
   * Counts how many list fields are reachable from this type
   */
  calculateListExpansionRisk(startType, visited = new Set()) {
    if (visited.has(startType)) {
      return 0;
    }

    visited.add(startType);
    
    const node = this.graph.nodes.find(n => n.id === startType);
    if (!node) return 0;

    let listCount = node.listFields;
    
    const neighbors = this.adjacencyList[startType] || [];
    for (const neighbor of neighbors) {
      listCount += this.calculateListExpansionRisk(neighbor, visited);
    }

    return listCount;
  }

  /**
   * Detect hub types (types with high fan-in)
   */
  detectHubTypes(threshold = 2) {
    return this.graph.nodes
      .filter(node => node.fanIn >= threshold)
      .sort((a, b) => b.fanIn - a.fanIn)
      .map(node => ({
        name: node.name,
        fanIn: node.fanIn,
        referencedBy: this.reverseAdjacencyList[node.name] || [],
      }));
  }

  /**
   * Calculate complexity score for a type
   */
  calculateTypeComplexity(typeName) {
    const node = this.graph.nodes.find(n => n.id === typeName);
    if (!node) return null;

    const maxDepth = this.calculateMaxDepth(typeName);
    const listRisk = this.calculateListExpansionRisk(typeName);

    // Weighted complexity formula
    const complexity = (
      node.fanOut * 2 +
      node.fanIn * 1.5 +
      node.objectFields * 1 +
      node.listFields * 3 +
      maxDepth * 2 +
      listRisk * 0.5
    );

    return {
      typeName,
      score: Math.round(complexity * 10) / 10,
      breakdown: {
        fanOut: node.fanOut,
        fanIn: node.fanIn,
        objectFields: node.objectFields,
        listFields: node.listFields,
        maxDepth,
        listExpansionRisk: listRisk,
      },
    };
  }

  /**
   * Get all metrics for the entire schema
   */
  getSchemaMetrics() {
    const typeMetrics = this.graph.nodes.map(node => 
      this.calculateTypeComplexity(node.id)
    ).sort((a, b) => b.score - a.score);

    const hubTypes = this.detectHubTypes();
    
    // Find deepest paths
    const deepestPaths = this.findDeepestPaths();

    // Calculate overall schema complexity
    const overallScore = typeMetrics.reduce((sum, t) => sum + t.score, 0) / typeMetrics.length;

    return {
      overallComplexity: Math.round(overallScore * 10) / 10,
      totalTypes: this.graph.nodes.length,
      totalRelationships: this.graph.edges.length,
      typeMetrics,
      hubTypes,
      deepestPaths,
      insights: this.generateInsights(typeMetrics, hubTypes, deepestPaths),
    };
  }

  /**
   * Find the deepest paths in the schema
   */
  findDeepestPaths() {
    const allPaths = [];
    
    // Start from Query type
    this.findAllPaths('Query', [], new Set(), allPaths);

    // Sort by length and return top 5
    return allPaths
      .sort((a, b) => b.length - a.length)
      .slice(0, 5)
      .map(path => ({
        path,
        depth: path.length,
      }));
  }

  /**
   * DFS to find all paths
   */
  findAllPaths(current, path, visited, allPaths, maxDepth = 8) {
    if (path.length >= maxDepth || visited.has(current)) {
      if (path.length > 0) {
        allPaths.push([...path]);
      }
      return;
    }

    visited.add(current);
    path.push(current);

    const neighbors = this.adjacencyList[current] || [];
    
    if (neighbors.length === 0) {
      allPaths.push([...path]);
    } else {
      for (const neighbor of neighbors) {
        this.findAllPaths(neighbor, path, new Set(visited), allPaths, maxDepth);
      }
    }

    path.pop();
  }

  /**
   * Generate human-readable insights
   */
  generateInsights(typeMetrics, hubTypes, deepestPaths) {
    const insights = [];

    // Most complex types
    const topComplex = typeMetrics.slice(0, 3);
    if (topComplex.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Most Complex Types',
        message: `${topComplex.map(t => t.typeName).join(', ')} have the highest complexity scores.`,
        details: topComplex.map(t => `${t.typeName}: score ${t.score}`),
      });
    }

    // Hub types
    if (hubTypes.length > 0) {
      insights.push({
        type: 'info',
        title: 'Hub Types Detected',
        message: `${hubTypes.map(h => h.name).join(', ')} are referenced by many other types.`,
        details: hubTypes.map(h => `${h.name}: referenced by ${h.referencedBy.join(', ')}`),
      });
    }

    // Deep nesting
    if (deepestPaths.length > 0 && deepestPaths[0].depth > 4) {
      insights.push({
        type: 'warning',
        title: 'Deep Nesting Detected',
        message: `Schema allows nesting up to ${deepestPaths[0].depth} levels deep.`,
        details: [`Deepest path: ${deepestPaths[0].path.join(' → ')}`],
      });
    }

    // List expansion risk
    const highListRisk = typeMetrics.filter(t => t.breakdown.listExpansionRisk > 5);
    if (highListRisk.length > 0) {
      insights.push({
        type: 'warning',
        title: 'High List Expansion Risk',
        message: `${highListRisk.map(t => t.typeName).join(', ')} can trigger many list expansions.`,
        details: highListRisk.map(t => `${t.typeName}: ${t.breakdown.listExpansionRisk} reachable list fields`),
      });
    }

    return insights;
  }

  /**
   * Get metrics summary for API response
   */
  getMetricsSummary() {
    const metrics = this.getSchemaMetrics();
    return {
      overallComplexity: metrics.overallComplexity,
      totalTypes: metrics.totalTypes,
      totalRelationships: metrics.totalRelationships,
      topComplexTypes: metrics.typeMetrics.slice(0, 5),
      hubTypes: metrics.hubTypes,
      deepestPaths: metrics.deepestPaths,
      insights: metrics.insights,
    };
  }
}

module.exports = ComplexityMetricsEngine;

// Allow running directly for testing
if (require.main === module) {
  const schemaPath = path.join(__dirname, 'schema.graphql');
  const engine = new ComplexityMetricsEngine(schemaPath);
  
  console.log('=== Schema Complexity Metrics ===\n');
  
  const metrics = engine.getSchemaMetrics();
  
  console.log(`Overall Complexity Score: ${metrics.overallComplexity}`);
  console.log(`Total Types: ${metrics.totalTypes}`);
  console.log(`Total Relationships: ${metrics.totalRelationships}`);
  
  console.log('\nType Complexity Rankings:');
  metrics.typeMetrics.slice(0, 5).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.typeName}: ${t.score}`);
    console.log(`     fan-out: ${t.breakdown.fanOut}, fan-in: ${t.breakdown.fanIn}, depth: ${t.breakdown.maxDepth}`);
  });
  
  console.log('\nHub Types:');
  metrics.hubTypes.forEach(h => {
    console.log(`  ${h.name} (fan-in: ${h.fanIn}) ← ${h.referencedBy.join(', ')}`);
  });
  
  console.log('\nDeepest Paths:');
  metrics.deepestPaths.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.path.join(' → ')} (depth: ${p.depth})`);
  });
  
  console.log('\nInsights:');
  metrics.insights.forEach(insight => {
    console.log(`  [${insight.type.toUpperCase()}] ${insight.title}`);
    console.log(`    ${insight.message}`);
  });
}
