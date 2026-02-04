const SchemaIntrospector = require('./introspection');
const path = require('path');

/**
 * Schema Graph Builder
 * Builds a directed graph representation of the GraphQL schema
 */

class SchemaGraphBuilder {
  constructor(schemaPath) {
    this.introspector = new SchemaIntrospector(schemaPath);
    this.metadata = this.introspector.getSchemaMetadata();
  }

  /**
   * Build nodes for the graph (one per type)
   */
  buildNodes() {
    return this.metadata.types.map(type => ({
      id: type.name,
      name: type.name,
      totalFields: type.totalFields,
      scalarFields: type.scalarFields,
      objectFields: type.objectFields,
      listFields: type.listFields,
      fields: type.fields,
    }));
  }

  /**
   * Build edges for the graph (relationships between types)
   */
  buildEdges() {
    const edges = [];
    const relationships = this.metadata.relationships;

    Object.entries(relationships).forEach(([source, targets]) => {
      targets.forEach(target => {
        // Find the field that creates this relationship
        const sourceType = this.metadata.types.find(t => t.name === source);
        const field = sourceType?.fields.find(f => f.typeName === target);
        
        edges.push({
          source,
          target,
          fieldName: field?.name || 'unknown',
          isList: field?.isList || false,
          isNullable: field?.isNullable || true,
        });
      });
    });

    return edges;
  }

  /**
   * Calculate fan-in for each node (how many types reference it)
   */
  calculateFanIn() {
    const fanIn = {};
    const edges = this.buildEdges();
    
    // Initialize all types with 0
    this.metadata.types.forEach(type => {
      fanIn[type.name] = 0;
    });

    // Count incoming edges
    edges.forEach(edge => {
      if (fanIn[edge.target] !== undefined) {
        fanIn[edge.target]++;
      }
    });

    return fanIn;
  }

  /**
   * Calculate fan-out for each node (how many types it references)
   */
  calculateFanOut() {
    const fanOut = {};
    
    Object.entries(this.metadata.relationships).forEach(([type, refs]) => {
      fanOut[type] = refs.length;
    });

    return fanOut;
  }

  /**
   * Build complete graph data structure for visualization
   */
  buildGraph() {
    const nodes = this.buildNodes();
    const edges = this.buildEdges();
    const fanIn = this.calculateFanIn();
    const fanOut = this.calculateFanOut();

    // Enrich nodes with fan-in and fan-out
    const enrichedNodes = nodes.map(node => ({
      ...node,
      fanIn: fanIn[node.id] || 0,
      fanOut: fanOut[node.id] || 0,
    }));

    return {
      nodes: enrichedNodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        averageFanIn: Object.values(fanIn).reduce((a, b) => a + b, 0) / nodes.length,
        averageFanOut: Object.values(fanOut).reduce((a, b) => a + b, 0) / nodes.length,
      },
    };
  }

  /**
   * Get adjacency list representation
   */
  getAdjacencyList() {
    return this.metadata.relationships;
  }

  /**
   * Get reverse adjacency list (for finding what types point to a given type)
   */
  getReverseAdjacencyList() {
    const reverse = {};
    
    this.metadata.types.forEach(type => {
      reverse[type.name] = [];
    });

    Object.entries(this.metadata.relationships).forEach(([source, targets]) => {
      targets.forEach(target => {
        if (reverse[target]) {
          reverse[target].push(source);
        }
      });
    });

    return reverse;
  }

  /**
   * Find all paths from one type to another
   */
  findPaths(from, to, maxDepth = 5) {
    const adjacencyList = this.getAdjacencyList();
    const paths = [];

    const dfs = (current, target, path, visited) => {
      if (path.length > maxDepth) return;
      if (current === target) {
        paths.push([...path]);
        return;
      }

      const neighbors = adjacencyList[current] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          path.push(neighbor);
          dfs(neighbor, target, path, visited);
          path.pop();
          visited.delete(neighbor);
        }
      }
    };

    const visited = new Set([from]);
    dfs(from, to, [from], visited);

    return paths;
  }
}

module.exports = SchemaGraphBuilder;

// Allow running directly for testing
if (require.main === module) {
  const schemaPath = path.join(__dirname, 'schema.graphql');
  const builder = new SchemaGraphBuilder(schemaPath);
  
  console.log('=== Schema Graph ===\n');
  
  const graph = builder.buildGraph();
  
  console.log('Nodes:');
  graph.nodes.forEach(node => {
    console.log(`  ${node.name}: fan-in=${node.fanIn}, fan-out=${node.fanOut}, fields=${node.totalFields}`);
  });
  
  console.log('\nEdges:');
  graph.edges.forEach(edge => {
    const listMarker = edge.isList ? '[]' : '';
    console.log(`  ${edge.source} --[${edge.fieldName}${listMarker}]--> ${edge.target}`);
  });
  
  console.log('\nSummary:', graph.summary);
  
  console.log('\n=== Paths from Query to Author ===');
  const paths = builder.findPaths('Query', 'Author');
  paths.forEach((p, i) => {
    console.log(`  Path ${i + 1}: ${p.join(' → ')}`);
  });
}
