import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getSchemaGraph, getSchemaMetrics } from '../services/api';

const SchemaGraph = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleReset = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const [graphResponse, metricsResponse] = await Promise.all([
          getSchemaGraph(),
          getSchemaMetrics()
        ]);
        if (graphResponse.success) {
          setGraphData(graphResponse.data);
        }
        if (metricsResponse.success) {
          setMetrics(metricsResponse.data);
        }
      } catch (err) {
        setError('Failed to load schema graph');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // Use 70% of container width for the graph, leaving space for the sidebar
        const containerWidth = containerRef.current.clientWidth;
        setDimensions({
          width: Math.floor(containerWidth * 0.65),
          height: Math.max(600, window.innerHeight - 300),
        });
      }
    };

    updateDimensions();
    // Small delay to ensure container is properly measured
    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zoom
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Color scale based on complexity (fan-in + fan-out)
    const complexityScale = d3.scaleLinear()
      .domain([0, d3.max(graphData.nodes, d => d.fanIn + d.fanOut)])
      .range([0, 1]);

    // Orange color scale for nodes
    const colorScale = (value) => {
      const colors = ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c'];
      const index = Math.min(Math.floor(value * colors.length), colors.length - 1);
      return colors[index];
    };

    // Size scale based on fan-in (smaller nodes)
    const sizeScale = d3.scaleLinear()
      .domain([0, d3.max(graphData.nodes, d => d.fanIn)])
      .range([18, 42]);

    // Create force simulation with more spacing
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.edges)
        .id(d => d.id)
        .distance(320)
        .strength(0.2))
      .force('charge', d3.forceManyBody().strength(-1500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => sizeScale(d.fanIn) + 80))
      .force('x', d3.forceX(width / 2).strength(0.03))
      .force('y', d3.forceY(height / 2).strength(0.03));

    // Create defs for filters and markers
    const defs = svg.append('defs');
    
    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#a1a1aa')
      .style('stroke', 'none');

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('stroke', '#d4d4d8')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => d.isList ? 2 : 1)
      .attr('stroke-dasharray', d => d.isNullable ? '6,4' : 'none')
      .attr('marker-end', 'url(#arrowhead)');

    // Create node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add shadow circles
    node.append('circle')
      .attr('r', d => sizeScale(d.fanIn) + 4)
      .attr('fill', 'rgba(249, 115, 22, 0.15)')
      .attr('filter', 'url(#glow)');

    // Add main circles to nodes
    node.append('circle')
      .attr('r', d => sizeScale(d.fanIn))
      .attr('fill', d => colorScale(complexityScale(d.fanIn + d.fanOut)))
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .on('mouseover', function(event, d) {
        setHoveredNode(d);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke', '#f97316')
          .attr('stroke-width', 4)
          .attr('r', sizeScale(d.fanIn) + 3);
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke', '#fff')
          .attr('stroke-width', 3)
          .attr('r', sizeScale(d.fanIn));
      });

    // Add labels to nodes
    node.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#1a1a1a')
      .style('pointer-events', 'none');

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions]);

  const displayNode = selectedNode || hoveredNode;

  const getComplexityColor = (score) => {
    if (score < 20) return '#22c55e';
    if (score < 40) return '#eab308';
    if (score < 60) return '#f97316';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="schema-graph loading">
        <div className="spinner"></div>
        <p>Loading schema graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schema-graph error">
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="schema-graph-container" ref={containerRef}>
      <div className="graph-panel">
        <div className="graph-header">
          <h2>Schema Graph</h2>
          <div className="graph-controls">
            <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
            <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
            <button className="zoom-btn reset" onClick={handleReset} title="Reset View">⟲</button>
          </div>
          <div className="graph-legend">
            <span><span className="legend-dot small"></span> Low fan-in</span>
            <span><span className="legend-dot large"></span> High fan-in</span>
            <span><span className="legend-line solid"></span> Required</span>
            <span><span className="legend-line dashed"></span> Nullable</span>
          </div>
        </div>
        
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="graph-svg"
        />
      </div>

      <div className="graph-sidebar">
        {/* Schema Overview */}
        <div className="sidebar-section">
          <h3>📊 Schema Overview</h3>
          {metrics && (
            <div className="sidebar-stats">
              <div className="sidebar-stat">
                <span className="stat-value">{metrics.totalTypes}</span>
                <span className="stat-label">Types</span>
              </div>
              <div className="sidebar-stat">
                <span className="stat-value">{metrics.totalRelationships}</span>
                <span className="stat-label">Relations</span>
              </div>
              <div className="sidebar-stat">
                <span className="stat-value" style={{ color: getComplexityColor(metrics.overallComplexity) }}>
                  {metrics.overallComplexity}
                </span>
                <span className="stat-label">Complexity</span>
              </div>
            </div>
          )}
        </div>

        {/* Node Details */}
        <div className="sidebar-section">
          <h3>🔍 {displayNode ? 'Type Details' : 'Select a Node'}</h3>
          {displayNode ? (
            <div className="node-details">
              <div className="node-name">{displayNode.name}</div>
              <div className="node-metrics">
                <div className="node-metric">
                  <span className="metric-icon">📥</span>
                  <span className="metric-info">
                    <span className="metric-value">{displayNode.fanIn}</span>
                    <span className="metric-label">Fan-in</span>
                  </span>
                </div>
                <div className="node-metric">
                  <span className="metric-icon">📤</span>
                  <span className="metric-info">
                    <span className="metric-value">{displayNode.fanOut}</span>
                    <span className="metric-label">Fan-out</span>
                  </span>
                </div>
                <div className="node-metric">
                  <span className="metric-icon">📋</span>
                  <span className="metric-info">
                    <span className="metric-value">{displayNode.totalFields}</span>
                    <span className="metric-label">Fields</span>
                  </span>
                </div>
                <div className="node-metric">
                  <span className="metric-icon">📦</span>
                  <span className="metric-info">
                    <span className="metric-value">{displayNode.objectFields}</span>
                    <span className="metric-label">Objects</span>
                  </span>
                </div>
              </div>
              
              {displayNode.fields && displayNode.fields.length > 0 && (
                <div className="node-fields">
                  <h4>Fields</h4>
                  <ul>
                    {displayNode.fields.slice(0, 8).map((f, i) => (
                      <li key={i} className={f.isObject ? 'object-field' : 'scalar-field'}>
                        <span className="field-name">{f.name}</span>
                        <span className="field-type">
                          {f.typeName}{f.isList ? '[]' : ''}{!f.isNullable ? '!' : ''}
                        </span>
                      </li>
                    ))}
                    {displayNode.fields.length > 8 && (
                      <li className="more-fields">+ {displayNode.fields.length - 8} more fields</li>
                    )}
                  </ul>
                </div>
              )}

              {selectedNode && (
                <button className="close-selection" onClick={() => setSelectedNode(null)}>
                  Clear Selection
                </button>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <p>👆 Hover or click on a node to see its details</p>
            </div>
          )}
        </div>

        {/* Top Complex Types */}
        {metrics && metrics.topComplexTypes && (
          <div className="sidebar-section">
            <h3>⚡ Top Complex Types</h3>
            <div className="complex-types-list">
              {metrics.topComplexTypes.slice(0, 4).map((type, i) => (
                <div key={i} className="complex-type-row">
                  <span className="rank">#{i + 1}</span>
                  <span className="type-name">{type.typeName}</span>
                  <span 
                    className="complexity-badge"
                    style={{ background: getComplexityColor(type.score) }}
                  >
                    {type.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hub Types */}
        {metrics && metrics.hubTypes && metrics.hubTypes.length > 0 && (
          <div className="sidebar-section">
            <h3>🔗 Hub Types</h3>
            <div className="hub-types-list">
              {metrics.hubTypes.slice(0, 3).map((hub, i) => (
                <div key={i} className="hub-type-row">
                  <span className="hub-name">{hub.typeName}</span>
                  <span className="hub-fanin">{hub.fanIn} refs</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaGraph;
