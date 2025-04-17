import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile } from 'fs/promises';
import pool from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsDir = join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of migration files
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    // Get executed migrations
    const { rows: executedMigrations } = await client.query('SELECT name FROM migrations');
    const executedMigrationNames = new Set(executedMigrations.map(m => m.name));

    // Run pending migrations
    for (const file of sqlFiles) {
      if (!executedMigrationNames.has(file)) {
        console.log(`Running migration: ${file}`);
        const filePath = join(migrationsDir, file);
        const sql = await readFile(filePath, 'utf8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Successfully executed migration: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error executing migration ${file}:`, error);
          throw error;
        }
      }
    }

    console.log('All migrations completed successfully');
  } finally {
    client.release();
  }
}

runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 