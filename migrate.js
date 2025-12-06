// Simple migration script: create tables if not exists
const db = require('./db');

function migrate(){
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'member',
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT,
      owner_id TEXT,
      contribution INTEGER DEFAULT 0,
      frequency TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      group_id TEXT,
      user_id TEXT,
      name TEXT,
      contact TEXT,
      joined_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      group_id TEXT,
      order_json TEXT,
      idx INTEGER DEFAULT 0,
      started_at INTEGER,
      frequency TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      group_id TEXT,
      member_id TEXT,
      user_id TEXT,
      amount INTEGER,
      date INTEGER,
      round INTEGER,
      status TEXT DEFAULT 'pending',
      external_ref TEXT
    );
  `);
  console.log('Migrations applied.');
}

migrate();
