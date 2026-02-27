const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Rayleigh',
    multipleStatements: true
  });

  try {
    const dbName = process.env.DB_NAME || 'smart_study_buddy';
    
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await connection.query(schema);
    
    console.log('✅ Database setup completed successfully!');
    console.log(`   Database: ${dbName}`);
    console.log('   All tables created.');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();