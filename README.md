# 🚀 GraphQL Schema Intelligence & Query Performance Studio

A full-stack developer tool that analyzes GraphQL schema structure and query complexity to help teams design maintainable schemas and prevent expensive queries.

## Problem This Project Solves

As GraphQL APIs grow, schemas become increasingly complex. Developers face challenges such as:
- Deeply nested schemas that are hard to reason about
- Certain types becoming unintentional "hotspots"
- Queries becoming slow due to excessive depth or list expansions
- Lack of tooling to explain *why* a query is expensive

This project fills that gap by combining **schema introspection**, **complexity analysis**, **query AST parsing**, and **interactive visualization**.

## System Architecture

```
Mock GraphQL API
(Node.js + Apollo Server)
        ↓
Analysis Backend
(Node.js)
  ├─ Schema Introspection
  ├─ Schema Graph Builder
  ├─ Complexity Metrics Engine
  ├─ Query AST Analyzer
        ↓
Frontend Dashboard
(React + JSX + D3.js)
  ├─ Schema Graph Visualization
  ├─ Metrics & Insights Panel
  ├─ Query Analyzer Interface
```

## Technology Stack

### Backend
- JavaScript (Node.js)
- Apollo Server
- graphql (graphql-js)
- Express

### Frontend
- JavaScript
- React (JSX)
- D3.js
- Axios

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd graphql-schema-intelligence
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Running the Application

1. **Start the Backend Server**
```bash
cd backend
npm start
```
The GraphQL API runs on `http://localhost:4000/graphql`
The Analysis API runs on `http://localhost:4001`

2. **Start the Frontend**
```bash
cd frontend
npm start
```
The dashboard is available at `http://localhost:3000`

## Features

### 1. Schema Graph Visualization
- Interactive D3 force-directed graph
- Nodes represent GraphQL types
- Edges represent field relationships
- Node size indicates fan-in (how many types reference it)
- Node color indicates complexity score

### 2. Metrics & Insights Panel
- Top 5 most complex types
- Hub type detection
- Deepest nesting paths
- Human-readable explanations

### 3. Query Analyzer
- Paste any GraphQL query
- Get instant complexity analysis
- Warnings for expensive queries
- Detailed cost breakdown

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/schema/metrics` | GET | Get schema complexity metrics |
| `/schema/graph` | GET | Get schema relationship graph |
| `/query/analyze` | POST | Analyze query complexity |

## Metrics Explained

- **Fan-out**: Number of types referenced by a type
- **Fan-in**: Number of types that reference a type
- **Maximum Nesting Depth**: Deepest path through the schema (via DFS)
- **List Expansion Risk**: Number of reachable list fields
- **Hub Type**: Types with high fan-in (potential hotspots)

## Project Structure

```
graphql-schema-intelligence/
├── backend/
│   ├── schema.graphql
│   ├── server.js
│   ├── analysisServer.js
│   ├── introspection.js
│   ├── schemaGraph.js
│   ├── complexityMetrics.js
│   ├── queryAnalyzer.js
│   ├── resolvers.js
│   ├── mockData.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SchemaGraph.jsx
│   │   │   ├── MetricsPanel.jsx
│   │   │   └── QueryAnalyzer.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── docs/
│   ├── architecture.md
│   └── metrics-explained.md
├── examples/
│   └── sampleQueries.graphql
└── README.md
```

## Example Queries

### Simple Query
```graphql
query {
  users {
    id
    name
  }
}
```

### Complex Query (Will Trigger Warnings)
```graphql
query {
  publications {
    title
    authors {
      name
      institution {
        name
        authors {
          name
          institution {
            name
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
  }
}
```

## What I Learned

- GraphQL schema introspection and AST parsing
- Graph theory algorithms (DFS, fan-in/fan-out analysis)
- D3.js force-directed graph visualization
- Full-stack architecture design
- Query cost estimation techniques

## License

MIT License
# schema-intelligence
