import React, { useEffect, useState } from 'react';
import { getSchemaGraph } from '../services/api';

const TypeExplorer = () => {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await getSchemaGraph();
        if (response.success) {
          setTypes(response.data.nodes);
          if (response.data.nodes.length > 0) {
            setSelectedType(response.data.nodes[0]);
          }
        }
      } catch (err) {
        setError('Failed to load types');
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const getTypeCategory = (type) => {
    if (type.name === 'Query' || type.name === 'Mutation' || type.name === 'Subscription') {
      return 'root';
    }
    if (type.fanIn > 3) return 'hub';
    if (type.fanOut > 4) return 'complex';
    return 'standard';
  };

  const filteredTypes = types.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || getTypeCategory(type) === filter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'root': return '🌟';
      case 'hub': return '🔗';
      case 'complex': return '⚡';
      default: return '📦';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'root': return '#8b5cf6';
      case 'hub': return '#f97316';
      case 'complex': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="type-explorer loading">
        <div className="spinner"></div>
        <p>Loading types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="type-explorer error">
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="type-explorer">
      <h2>Type Explorer</h2>
      
      <div className="explorer-layout">
        {/* Sidebar - Type List */}
        <div className="explorer-sidebar">
          <div className="explorer-search">
            <input
              type="text"
              placeholder="Search types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="explorer-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({types.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'root' ? 'active' : ''}`}
              onClick={() => setFilter('root')}
            >
              🌟 Root
            </button>
            <button 
              className={`filter-btn ${filter === 'hub' ? 'active' : ''}`}
              onClick={() => setFilter('hub')}
            >
              🔗 Hub
            </button>
            <button 
              className={`filter-btn ${filter === 'complex' ? 'active' : ''}`}
              onClick={() => setFilter('complex')}
            >
              ⚡ Complex
            </button>
          </div>
          
          <div className="type-list">
            {filteredTypes.map(type => {
              const category = getTypeCategory(type);
              return (
                <div
                  key={type.id}
                  className={`type-list-item ${selectedType?.id === type.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(type)}
                >
                  <span className="type-icon" style={{ color: getCategoryColor(category) }}>
                    {getCategoryIcon(category)}
                  </span>
                  <span className="type-name">{type.name}</span>
                  <span className="type-field-count">{type.totalFields} fields</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content - Type Details */}
        <div className="explorer-content">
          {selectedType ? (
            <>
              <div className="type-header">
                <div className="type-title">
                  <span 
                    className="type-category-badge"
                    style={{ backgroundColor: getCategoryColor(getTypeCategory(selectedType)) }}
                  >
                    {getCategoryIcon(getTypeCategory(selectedType))} {getTypeCategory(selectedType)}
                  </span>
                  <h3>{selectedType.name}</h3>
                </div>
              </div>

              {/* Type Metrics */}
              <div className="type-metrics">
                <div className="type-metric">
                  <div className="metric-icon">📤</div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedType.fanOut}</div>
                    <div className="metric-label">Fan Out</div>
                  </div>
                </div>
                <div className="type-metric">
                  <div className="metric-icon">📥</div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedType.fanIn}</div>
                    <div className="metric-label">Fan In</div>
                  </div>
                </div>
                <div className="type-metric">
                  <div className="metric-icon">📋</div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedType.totalFields}</div>
                    <div className="metric-label">Total Fields</div>
                  </div>
                </div>
                <div className="type-metric">
                  <div className="metric-icon">🔄</div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedType.objectFields}</div>
                    <div className="metric-label">Object Fields</div>
                  </div>
                </div>
                <div className="type-metric">
                  <div className="metric-icon">📚</div>
                  <div className="metric-info">
                    <div className="metric-value">{selectedType.listFields}</div>
                    <div className="metric-label">List Fields</div>
                  </div>
                </div>
              </div>

              {/* Fields List */}
              <div className="type-fields-section">
                <h4>Fields</h4>
                <div className="fields-list">
                  {selectedType.fields?.map((field, index) => (
                    <div key={index} className="field-item">
                      <div className="field-name">{field.name}</div>
                      <div className="field-type">
                        <span className={`field-type-badge ${field.isList ? 'list' : ''} ${field.isNullable ? 'nullable' : 'required'}`}>
                          {field.isList && '['}
                          {field.typeName}
                          {field.isList && ']'}
                          {!field.isNullable && '!'}
                        </span>
                      </div>
                      <div className="field-flags">
                        {field.isList && <span className="flag list">List</span>}
                        {field.isObjectType && <span className="flag object">Object</span>}
                        {!field.isNullable && <span className="flag required">Required</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complexity Analysis */}
              <div className="type-complexity-section">
                <h4>Complexity Analysis</h4>
                <div className="complexity-details">
                  <div className="complexity-item">
                    <span className="complexity-label">Query Depth Risk:</span>
                    <span className={`complexity-value ${selectedType.fanOut > 3 ? 'high' : selectedType.fanOut > 1 ? 'medium' : 'low'}`}>
                      {selectedType.fanOut > 3 ? 'High' : selectedType.fanOut > 1 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div className="complexity-item">
                    <span className="complexity-label">Reference Hotspot:</span>
                    <span className={`complexity-value ${selectedType.fanIn > 3 ? 'high' : selectedType.fanIn > 1 ? 'medium' : 'low'}`}>
                      {selectedType.fanIn > 3 ? 'Yes' : selectedType.fanIn > 1 ? 'Moderate' : 'No'}
                    </span>
                  </div>
                  <div className="complexity-item">
                    <span className="complexity-label">List Expansion Risk:</span>
                    <span className={`complexity-value ${selectedType.listFields > 2 ? 'high' : selectedType.listFields > 0 ? 'medium' : 'low'}`}>
                      {selectedType.listFields > 2 ? 'High' : selectedType.listFields > 0 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-type-selected">
              <p>Select a type from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypeExplorer;
