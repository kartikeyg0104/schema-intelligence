const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const resolvers = require('./resolvers');

// Read schema from file
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable introspection for schema analysis
  });

  await server.start();

  app.use(cors());
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server));

  const PORT = process.env.PORT || process.env.GRAPHQL_PORT || 4000;
  
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📊 Introspection enabled for schema analysis`);
  });
}

startServer().catch(console.error);
