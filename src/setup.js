import fs from 'fs';
import path from 'path';
import pool from './db.js';

async function setupDatabase() {
  console.log('🔧 Setting up database...');
  
  try {
    
    const schemaPath = path.join(process.cwd(), 'db_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const client = await pool.connect();
    try {
      await client.query(schema);
      console.log('✅ Database schema created successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
  }
}


if (process.env.NODE_ENV === 'production') {
  setupDatabase();
}
