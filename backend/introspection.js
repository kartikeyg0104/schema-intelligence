const { buildSchema, introspectionFromSchema, getIntrospectionQuery } = require('graphql');
const fs = require('fs');
const path = require('path');

/**
 * Schema Introspection Module
 * Executes GraphQL introspection and extracts normalized schema metadata
 */

class SchemaIntrospector {
  constructor(schemaPath) {
    const schemaString = fs.readFileSync(schemaPath, 'utf-8');
    this.schema = buildSchema(schemaString);
    this.introspectionResult = introspectionFromSchema(this.schema);
  }

  /**
   * Get all types from the schema (excluding built-in types)
   */
  getTypes() {
    const types = this.introspectionResult.__schema.types;
    return types.filter(type => 
      !type.name.startsWith('__') && 
      !['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name)
    );
  }

  /**
   * Get object types only (excluding enums, scalars, etc.)
   */
  getObjectTypes() {
    return this.getTypes().filter(type => type.kind === 'OBJECT');
  }

  /**
   * Get enum types
   */
  getEnumTypes() {
    return this.getTypes().filter(type => type.kind === 'ENUM');
  }

  /**
   * Extract normalized metadata for a type
   */
  getTypeMetadata(typeName) {
    const type = this.getTypes().find(t => t.name === typeName);
    if (!type) return null;

    const metadata = {
      name: type.name,
      kind: type.kind,
      fields: [],
      totalFields: 0,
      scalarFields: 0,
      objectFields: 0,
      listFields: 0,
      nullableFields: 0,
      nonNullableFields: 0,
    };

    if (type.fields) {
      metadata.totalFields = type.fields.length;
      
      type.fields.forEach(field => {
        const fieldInfo = this.analyzeField(field);
        metadata.fields.push(fieldInfo);

        if (fieldInfo.isScalar) metadata.scalarFields++;
        if (fieldInfo.isObject) metadata.objectFields++;
        if (fieldInfo.isList) metadata.listFields++;
        if (fieldInfo.isNullable) metadata.nullableFields++;
        else metadata.nonNullableFields++;
      });
    }

    return metadata;
  }

  /**
   * Analyze a field and extract its properties
   */
  analyzeField(field) {
    const info = {
      name: field.name,
      isNullable: true,
      isList: false,
      isScalar: false,
      isObject: false,
      typeName: null,
      baseType: null,
    };

    let currentType = field.type;

    // Unwrap the type
    while (currentType) {
      if (currentType.kind === 'NON_NULL') {
        info.isNullable = false;
        currentType = currentType.ofType;
      } else if (currentType.kind === 'LIST') {
        info.isList = true;
        currentType = currentType.ofType;
      } else {
        info.typeName = currentType.name;
        info.baseType = currentType.kind;
        info.isScalar = ['SCALAR', 'ENUM'].includes(currentType.kind);
        info.isObject = currentType.kind === 'OBJECT';
        break;
      }
    }

    return info;
  }

  /**
   * Get relationships between types (which type references which)
   */
  getTypeRelationships() {
    const relationships = {};
    const objectTypes = this.getObjectTypes();

    objectTypes.forEach(type => {
      const typeName = type.name;
      relationships[typeName] = [];

      if (type.fields) {
        type.fields.forEach(field => {
          const fieldInfo = this.analyzeField(field);
          if (fieldInfo.isObject && fieldInfo.typeName !== typeName) {
            if (!relationships[typeName].includes(fieldInfo.typeName)) {
              relationships[typeName].push(fieldInfo.typeName);
            }
          }
        });
      }
    });

    return relationships;
  }

  /**
   * Get complete normalized schema metadata
   */
  getSchemaMetadata() {
    const objectTypes = this.getObjectTypes();
    
    return {
      totalTypes: objectTypes.length,
      types: objectTypes.map(type => this.getTypeMetadata(type.name)),
      relationships: this.getTypeRelationships(),
      enums: this.getEnumTypes().map(e => ({
        name: e.name,
        values: e.enumValues.map(v => v.name),
      })),
    };
  }
}

// Export for use in other modules
module.exports = SchemaIntrospector;

// Allow running directly for testing
if (require.main === module) {
  const schemaPath = path.join(__dirname, 'schema.graphql');
  const introspector = new SchemaIntrospector(schemaPath);
  
  console.log('=== Schema Introspection Results ===\n');
  
  const metadata = introspector.getSchemaMetadata();
  console.log(`Total Object Types: ${metadata.totalTypes}\n`);
  
  console.log('Type Summary:');
  metadata.types.forEach(type => {
    console.log(`  ${type.name}: ${type.totalFields} fields (${type.objectFields} objects, ${type.listFields} lists)`);
  });
  
  console.log('\nType Relationships:');
  Object.entries(metadata.relationships).forEach(([type, refs]) => {
    if (refs.length > 0) {
      console.log(`  ${type} → ${refs.join(', ')}`);
    }
  });
}
