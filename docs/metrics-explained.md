# Metrics Explained

This document provides detailed explanations of all metrics computed by the GraphQL Schema Intelligence tool.

## Schema-Level Metrics

### 1. Fan-Out

**Definition:** The number of other types that a type references through its fields.

**Formula:** `fan_out(T) = |{F ∈ fields(T) : type(F) is ObjectType}|`

**Example:**
```graphql
type Publication {
  id: ID!
  title: String!
  authors: [Author!]!     # → Author
  citations: [Publication!] # → Publication
  tags: [Tag!]            # → Tag
}
```
Fan-out of Publication = 3 (Author, Publication, Tag)

**Why It Matters:**
- High fan-out indicates a type has many dependencies
- Changes to referenced types may impact this type
- Queries selecting this type can branch in many directions

---

### 2. Fan-In

**Definition:** The number of other types that reference this type through their fields.

**Formula:** `fan_in(T) = |{T' : T ∈ referenced_types(T')}|`

**Example:**
If `Author` is referenced by:
- Publication.authors
- Comment.author
- Institution.authors

Fan-in of Author = 3

**Why It Matters:**
- High fan-in indicates a "hub" type
- These types are central to the schema
- Performance bottleneck if not optimized
- Good candidates for caching

---

### 3. Maximum Nesting Depth

**Definition:** The longest path of object references reachable from a type.

**Algorithm:** Depth-First Search (DFS) with cycle detection

**Example:**
```
Query → Publication → Author → Institution → Author (cycle, stop)
```
Maximum depth from Query = 4

**Why It Matters:**
- Deep nesting allows expensive queries
- Each level multiplies resolver calls
- Consider limiting depth in production

---

### 4. List Expansion Risk

**Definition:** The number of list-type fields reachable from a type.

**Formula:** Count of fields where type is wrapped in `[...]`

**Example:**
```graphql
type Publication {
  authors: [Author!]!    # +1
  citations: [Publication!] # +1
  tags: [Tag!]          # +1
}
```
List fields = 3

From Publication, if Author has:
```graphql
type Author {
  publications: [Publication!]!  # +1
  coAuthors: [Author!]!         # +1
}
```
Reachable list fields = 5

**Why It Matters:**
- Lists multiply data exponentially
- Nested lists: 10 × 10 × 10 = 1000 items
- Always consider pagination

---

### 5. Hub Type Detection

**Definition:** Types with fan-in above a threshold (default: 2)

**Identification Criteria:**
- Referenced by 2+ other types
- Central to the schema graph
- Often represent core domain entities

**Example Hub Types:**
- User (referenced by Comment, Publication, etc.)
- Publication (referenced by Author, Tag, etc.)

**Why It Matters:**
- Hub types need efficient resolvers
- Good candidates for DataLoader batching
- Consider caching strategies

---

## Query-Level Metrics

### 6. Query Depth

**Definition:** Maximum nesting level in a query.

**Example:**
```graphql
query {                          # Depth 0
  publications {                 # Depth 1
    authors {                    # Depth 2
      institution {              # Depth 3
        authors {                # Depth 4
          name                   # Depth 5
        }
      }
    }
  }
}
```
Query Depth = 5

**Recommended Maximum:** 5

---

### 7. Field Count

**Definition:** Total number of fields selected in the query.

**Example:**
```graphql
query {
  publications {      # 1
    title            # 2
    abstract         # 3
    authors {        # 4
      name           # 5
      email          # 6
    }
  }
}
```
Field Count = 6

---

### 8. List Fields

**Definition:** Number of list-returning fields in the query.

**Example:**
```graphql
query {
  publications {      # List field 1
    authors {         # List field 2
      publications {  # List field 3
        title
      }
    }
  }
}
```
List Fields = 3

---

### 9. Nested Lists

**Definition:** Number of times a list field appears inside another list field.

**Example:**
```graphql
query {
  publications {          # First list
    authors {             # Nested list (1)
      publications {      # Nested list (2)
        citations {       # Nested list (3)
          title
        }
      }
    }
  }
}
```
Nested Lists = 3

**Why It's Critical:**
- Each nesting multiplies data
- 10 pubs × 3 authors × 5 pubs × 10 citations = 1,500 items!

---

### 10. Estimated Resolver Calls

**Definition:** Approximate number of resolver function invocations.

**Calculation:**
```javascript
let calls = 0;
let multiplier = 1;

for (field of selectedFields) {
  if (field.isList) {
    multiplier *= 10; // Assumed average list size
  }
  calls += multiplier;
}
```

---

### 11. Cost Score

**Definition:** Weighted complexity score for the query.

**Formula:**
```javascript
cost = 
  fieldCount × 1 +
  maxDepth² × 2 +
  listFields × 10 +
  nestedLists × 50;
```

**Interpretation:**
| Score | Level | Description |
|-------|-------|-------------|
| 0-20 | Low | Lightweight query |
| 20-50 | Medium | Moderate complexity |
| 50-100 | High | May impact performance |
| 100+ | Critical | Likely to cause issues |

---

## Complexity Score Formula

The overall type complexity score combines multiple factors:

```javascript
complexity = 
  fanOut × 2 +
  fanIn × 1.5 +
  objectFields × 1 +
  listFields × 3 +
  maxDepth × 2 +
  listExpansionRisk × 0.5;
```

**Weight Rationale:**
- `fanOut × 2`: Types with many dependencies are complex
- `fanIn × 1.5`: Hub types need extra attention
- `objectFields × 1`: Each relationship adds complexity
- `listFields × 3`: Lists multiply data significantly
- `maxDepth × 2`: Deep nesting enables expensive queries
- `listExpansionRisk × 0.5`: Reachable lists compound risk

---

## Best Practices Based on Metrics

### High Fan-Out Types
- Use field-level resolvers (not monolithic)
- Consider DataLoader for batching
- Review if all fields are necessary

### High Fan-In Types (Hubs)
- Implement caching (Redis, in-memory)
- Use DataLoader aggressively
- Consider denormalization

### Deep Nesting Paths
- Implement query depth limiting
- Consider complexity limits
- Educate API consumers

### List Expansion Risk
- Always implement pagination
- Set reasonable default limits
- Consider cursor-based pagination

### High Cost Queries
- Add query complexity analysis middleware
- Reject queries above threshold
- Provide optimization guidance
