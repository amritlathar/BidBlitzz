import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(migrationFile) {
  try {
    const filePath = path.join(__dirname, migrationFile);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    await pool.query(sql);
    console.log(`Successfully ran migration: ${migrationFile}`);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Please provide a migration file path');
  process.exit(1);
}

runMigration(migrationFile); 