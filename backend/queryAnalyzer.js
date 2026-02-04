const { parse, visit, TypeInfo, visitWithTypeInfo, buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');

/**
 * Query Cost & Complexity Analyzer
 * Parses GraphQL queries and estimates their cost
 */

class QueryAnalyzer {
  constructor(schemaPath) {
    const schemaString = fs.readFileSync(schemaPath, 'utf-8');
    this.schema = buildSchema(schemaString);
    this.typeInfo = new TypeInfo(this.schema);
    
    // Cost configuration
    this.config = {
      fieldCost: 1,
      listMultiplier: 10, // Assumed average list size
      depthPenalty: 2,
      maxRecommendedDepth: 5,
      maxRecommendedCost: 100,
    };
  }

  /**
   * Analyze a GraphQL query string
   */
  analyzeQuery(queryString) {
    try {
      const ast = parse(queryString);
      const analysis = this.traverseAST(ast);
      return this.buildReport(analysis);
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse query: ${error.message}`,
      };
    }
  }

  /**
   * Traverse the AST and collect metrics
   */
  traverseAST(ast) {
    const metrics = {
      depth: 0,
      maxDepth: 0,
      fieldCount: 0,
      listFields: [],
      nestedLists: 0,
      selectedFields: [],
      pathsAnalyzed: [],
    };

    let currentPath = [];
    let listDepth = 0;

    visit(
      ast,
      visitWithTypeInfo(this.typeInfo, {
        Field: {
          enter: (node) => {
            metrics.fieldCount++;
            metrics.depth++;
            metrics.maxDepth = Math.max(metrics.maxDepth, metrics.depth);

            const fieldName = node.name.value;
            currentPath.push(fieldName);

            const type = this.typeInfo.getType();
            const isListType = this.isListType(type);

            metrics.selectedFields.push({
              name: fieldName,
              path: [...currentPath],
              depth: metrics.depth,
              isList: isListType,
            });

            if (isListType) {
              listDepth++;
              metrics.listFields.push({
                name: fieldName,
                path: currentPath.join('.'),
                listDepth,
              });

              if (listDepth > 1) {
                metrics.nestedLists++;
              }
            }
          },
          leave: () => {
            const fieldName = currentPath.pop();
            const fieldInfo = metrics.selectedFields.find(
              f => f.name === fieldName && f.depth === metrics.depth
            );
            
            if (fieldInfo?.isList) {
              listDepth--;
            }
            
            metrics.depth--;
          },
        },
      })
    );

    return metrics;
  }

  /**
   * Check if a type is a list type
   */
  isListType(type) {
    if (!type) return false;
    const typeString = type.toString();
    return typeString.startsWith('[');
  }

  /**
   * Calculate estimated resolver calls
   */
  calculateResolverCalls(metrics) {
    let calls = 0;
    let multiplier = 1;

    metrics.selectedFields.forEach(field => {
      if (field.isList) {
        multiplier *= this.config.listMultiplier;
      }
      calls += multiplier;
    });

    return calls;
  }

  /**
   * Calculate overall cost score
   */
  calculateCost(metrics) {
    const baseCost = metrics.fieldCount * this.config.fieldCost;
    const depthCost = Math.pow(metrics.maxDepth, this.config.depthPenalty);
    const listCost = metrics.listFields.length * this.config.listMultiplier;
    const nestedListCost = metrics.nestedLists * (this.config.listMultiplier * 5);

    return Math.round(baseCost + depthCost + listCost + nestedListCost);
  }

  /**
   * Build the analysis report
   */
  buildReport(metrics) {
    const cost = this.calculateCost(metrics);
    const resolverCalls = this.calculateResolverCalls(metrics);
    const warnings = this.generateWarnings(metrics, cost);

    return {
      success: true,
      metrics: {
        depth: metrics.maxDepth,
        fieldCount: metrics.fieldCount,
        listFields: metrics.listFields.length,
        nestedLists: metrics.nestedLists,
        estimatedResolverCalls: resolverCalls,
      },
      cost: {
        score: cost,
        level: this.getCostLevel(cost),
      },
      warnings,
      explanation: this.generateExplanation(metrics, cost),
      recommendations: this.generateRecommendations(metrics, cost),
      details: {
        selectedFields: metrics.selectedFields,
        listFieldPaths: metrics.listFields,
      },
    };
  }

  /**
   * Get cost level based on score
   */
  getCostLevel(cost) {
    if (cost < 20) return 'low';
    if (cost < 50) return 'medium';
    if (cost < 100) return 'high';
    return 'critical';
  }

  /**
   * Generate warnings based on analysis
   */
  generateWarnings(metrics, cost) {
    const warnings = [];

    if (metrics.maxDepth > this.config.maxRecommendedDepth) {
      warnings.push({
        type: 'depth',
        severity: 'warning',
        message: `Query depth is ${metrics.maxDepth} (recommended max: ${this.config.maxRecommendedDepth})`,
      });
    }

    if (cost > this.config.maxRecommendedCost) {
      warnings.push({
        type: 'cost',
        severity: 'error',
        message: `Query cost (${cost}) exceeds recommended maximum (${this.config.maxRecommendedCost})`,
      });
    }

    if (metrics.nestedLists > 0) {
      warnings.push({
        type: 'nested-lists',
        severity: 'warning',
        message: `Query contains ${metrics.nestedLists} nested list expansions which can cause performance issues`,
      });
    }

    if (metrics.listFields.length > 3) {
      warnings.push({
        type: 'multiple-lists',
        severity: 'info',
        message: `Query selects ${metrics.listFields.length} list fields - consider pagination`,
      });
    }

    return warnings;
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(metrics, cost) {
    const parts = [];

    if (cost < 20) {
      parts.push('This query is lightweight and should execute quickly.');
    } else if (cost < 50) {
      parts.push('This query has moderate complexity.');
    } else if (cost < 100) {
      parts.push('This query is expensive and may impact performance.');
    } else {
      parts.push('This query is very expensive and could cause performance issues.');
    }

    if (metrics.nestedLists > 0) {
      parts.push(
        `It expands ${metrics.nestedLists} nested list${metrics.nestedLists > 1 ? 's' : ''}, which multiplies the data fetched.`
      );
    }

    parts.push(`It selects ${metrics.fieldCount} fields with a maximum depth of ${metrics.maxDepth}.`);

    if (metrics.listFields.length > 0) {
      const listNames = metrics.listFields.map(l => l.name).slice(0, 3).join(', ');
      parts.push(`List fields: ${listNames}${metrics.listFields.length > 3 ? '...' : ''}.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(metrics, cost) {
    const recommendations = [];

    if (metrics.maxDepth > 5) {
      recommendations.push({
        type: 'reduce-depth',
        message: 'Consider breaking this query into multiple smaller queries',
        priority: 'high',
      });
    }

    if (metrics.nestedLists > 1) {
      recommendations.push({
        type: 'limit-nesting',
        message: 'Avoid deeply nested list selections - fetch related data separately',
        priority: 'high',
      });
    }

    if (metrics.listFields.length > 3) {
      recommendations.push({
        type: 'pagination',
        message: 'Add pagination arguments (first, limit) to list fields',
        priority: 'medium',
      });
    }

    if (metrics.fieldCount > 30) {
      recommendations.push({
        type: 'select-less',
        message: 'Select only the fields you need to reduce payload size',
        priority: 'low',
      });
    }

    return recommendations;
  }
}

module.exports = QueryAnalyzer;

// Allow running directly for testing
if (require.main === module) {
  const schemaPath = path.join(__dirname, 'schema.graphql');
  const analyzer = new QueryAnalyzer(schemaPath);

  // Test with a complex query
  const testQuery = `
    query {
      publications {
        title
        authors {
          name
          institution {
            name
            authors {
              name
              publications {
                title
              }
            }
          }
        }
        citations {
          title
          citations {
            title
          }
        }
        comments {
          content
          author {
            name
          }
        }
      }
    }
  `;

  console.log('=== Query Analysis ===\n');
  console.log('Query:');
  console.log(testQuery);
  console.log('\n--- Results ---\n');

  const result = analyzer.analyzeQuery(testQuery);

  if (result.success) {
    console.log('Metrics:');
    console.log(`  Depth: ${result.metrics.depth}`);
    console.log(`  Field Count: ${result.metrics.fieldCount}`);
    console.log(`  List Fields: ${result.metrics.listFields}`);
    console.log(`  Nested Lists: ${result.metrics.nestedLists}`);
    console.log(`  Estimated Resolver Calls: ${result.metrics.estimatedResolverCalls}`);

    console.log(`\nCost: ${result.cost.score} (${result.cost.level})`);

    console.log('\nExplanation:');
    console.log(`  ${result.explanation}`);

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(w => {
        console.log(`  [${w.severity.toUpperCase()}] ${w.message}`);
      });
    }

    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:');
      result.recommendations.forEach(r => {
        console.log(`  [${r.priority}] ${r.message}`);
      });
    }
  } else {
    console.log('Error:', result.error);
  }
}
