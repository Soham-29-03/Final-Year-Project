import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export let pool;

export function getPool() {
  if (!pool) {
    const connStr = env.databaseUrl || process.env.DATABASE_URL;
    if (!connStr) {
      throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env.");
    }
    pool = new Pool({
      connectionString: connStr,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
    });

    pool.on("error", (err) => {
      console.error("Postgres pool error", err.message);
    });
  }
  return pool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

async function migrate() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name            text NOT NULL,
      email           text UNIQUE NOT NULL,
      password        text NOT NULL,
      created_at      timestamptz DEFAULT now(),
      avatar_color    text NOT NULL DEFAULT '#0c8b7c'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS forms (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title           text NOT NULL DEFAULT 'Untitled Form',
      description     text NOT NULL DEFAULT '',
      theme           text NOT NULL DEFAULT 'modern',
      status          text NOT NULL DEFAULT 'draft',
      slug            text UNIQUE NOT NULL,
      questions       jsonb NOT NULL DEFAULT '[]'::jsonb,
      settings        jsonb NOT NULL DEFAULT '{}'::jsonb,
      views           integer NOT NULL DEFAULT 0,
      response_count  integer NOT NULL DEFAULT 0,
      is_favorite     boolean NOT NULL DEFAULT false,
      is_archived     boolean NOT NULL DEFAULT false,
      published_at    timestamptz,
      created_at      timestamptz NOT NULL DEFAULT now(),
      updated_at      timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS responses (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      form            uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      answers         jsonb NOT NULL DEFAULT '{}'::jsonb,
      completion_time integer NOT NULL DEFAULT 0,
      meta            jsonb NOT NULL DEFAULT '{}'::jsonb,
      submitted_at    timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_forms_owner ON forms(owner, is_archived, updated_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_responses_form ON responses(form, submitted_at DESC);`);
}

export async function connectDB() {
  try {
    const { rows } = await query("SELECT current_database() AS db;");
    console.log(`Postgres connected: ${rows[0].db}`);
    await migrate();
    console.log("Schema ready");
  } catch (error) {
    console.error("Postgres connection error:", error.message);
    process.exit(1);
  }
}