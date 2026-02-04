# System Architecture

This document describes the architecture of the GraphQL Schema Intelligence & Query Performance Studio.

## Overview

The system consists of three main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Dashboard                          │
│                   (React + D3.js)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │ Schema Graph │  │ Metrics Panel│  │ Query Analyzer   │      │
│  │ Visualization│  │              │  │                  │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Analysis Backend                             │
│                   (Node.js + Express)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │ Introspection│  │ Schema Graph │  │ Complexity       │      │
│  │ Module       │  │ Builder      │  │ Metrics Engine   │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │             Query Analyzer                           │      │
│  └──────────────────────────────────────────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ GraphQL Introspection
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Mock GraphQL API                              │
│               (Node.js + Apollo Server)                         │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Research Publication Platform Schema                │      │
│  │  (User, Publication, Author, Institution, etc.)      │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Mock GraphQL API (Port 4000)

**Purpose:** Provides a realistic GraphQL schema for analysis.

**Technologies:**
- Node.js
- Apollo Server
- GraphQL

**Key Files:**
- `server.js` - Apollo Server setup
- `schema.graphql` - GraphQL type definitions
- `resolvers.js` - Query resolvers
- `mockData.js` - In-memory mock data

**Domain:** Research Publication Platform
- Intentionally complex schema
- Multiple entity types with relationships
- Circular references
- Nested lists

### 2. Analysis Backend (Port 4001)

**Purpose:** Analyzes the GraphQL schema and queries, computing complexity metrics.

**Technologies:**
- Node.js
- Express
- graphql-js

**Modules:**

#### 2.1 Introspection Module (`introspection.js`)
- Executes GraphQL introspection
- Extracts type metadata
- Normalizes schema information

#### 2.2 Schema Graph Builder (`schemaGraph.js`)
- Builds directed graph from schema
- Calculates fan-in/fan-out
- Finds paths between types

#### 2.3 Complexity Metrics Engine (`complexityMetrics.js`)
- Computes complexity scores
- Detects hub types
- Finds deepest paths
- Generates insights

#### 2.4 Query Analyzer (`queryAnalyzer.js`)
- Parses GraphQL AST
- Estimates query cost
- Generates warnings and recommendations

**API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/schema/metrics` | GET | Returns schema complexity metrics |
| `/schema/graph` | GET | Returns graph data for D3 visualization |
| `/query/analyze` | POST | Analyzes a GraphQL query |
| `/health` | GET | Health check |

### 3. Frontend Dashboard (Port 3000)

**Purpose:** Interactive visualization and analysis interface.

**Technologies:**
- React 18
- D3.js
- Axios

**Components:**

#### 3.1 SchemaGraph (`SchemaGraph.jsx`)
- D3 force-directed graph
- Interactive node selection
- Zoom and pan
- Visual encoding of complexity

#### 3.2 MetricsPanel (`MetricsPanel.jsx`)
- Overview metrics cards
- Top complex types ranking
- Hub types display
- Deepest paths visualization
- Expandable insights

#### 3.3 QueryAnalyzer (`QueryAnalyzer.jsx`)
- Query input textarea
- Sample query templates
- Results display with:
  - Cost score badge
  - Metrics grid
  - Warnings list
  - Recommendations

## Data Flow

### Schema Analysis Flow

```
1. Frontend requests /schema/graph
2. Analysis Server reads schema.graphql
3. SchemaIntrospector extracts type metadata
4. SchemaGraphBuilder creates graph representation
5. Response sent to frontend
6. D3.js renders force-directed graph
```

### Query Analysis Flow

```
1. User enters query in QueryAnalyzer
2. POST /query/analyze with query string
3. QueryAnalyzer parses AST
4. Traverses AST collecting metrics
5. Calculates cost score
6. Generates warnings & recommendations
7. Returns analysis report
8. Frontend displays results
```

## Design Decisions

### Why a Separate Analysis Server?

1. **Separation of Concerns:** Analysis logic is decoupled from the GraphQL API
2. **Performance:** Analysis can be computationally intensive
3. **Extensibility:** Easy to add new analysis modules
4. **Testability:** Each module can be tested independently

### Why D3.js for Visualization?

1. **Control:** Full control over graph rendering
2. **Interactivity:** Native support for drag, zoom, hover
3. **Customization:** Can encode complexity in visual properties
4. **Performance:** Efficient for medium-sized graphs

### Why Force-Directed Layout?

1. **Self-organizing:** Automatically positions nodes
2. **Reveals structure:** Clusters related types
3. **Intuitive:** Easy to understand relationships
4. **Interactive:** Can drag nodes to explore

## Deployment Considerations

### Development
```bash
# Terminal 1: GraphQL API
cd backend && npm start

# Terminal 2: Analysis Server
cd backend && npm run start:analysis

# Terminal 3: Frontend
cd frontend && npm start
```

### Production
- Use PM2 or similar for backend processes
- Build frontend with `npm run build`
- Serve static files via nginx
- Consider containerization with Docker
