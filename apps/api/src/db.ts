import { Pool, QueryResultRow } from 'pg';
import { env } from './config/env';
import { hashPassword } from './services/authService';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return pool.query<T>(text, params);
}

export async function initializeDatabase() {
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  const schema = `
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      company_name VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      assigned_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
      subject VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      priority VARCHAR(50) NOT NULL DEFAULT 'normal',
      source VARCHAR(50) NOT NULL DEFAULT 'email',
      ai_intent VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_type VARCHAR(50) NOT NULL,
      sender_id UUID,
      body TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id UUID,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
    CREATE INDEX IF NOT EXISTS idx_conversations_priority ON conversations(priority);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON conversation_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_tags ON knowledge_articles USING GIN(tags);
  `;

  await query(schema);
}

export async function seedDefaultAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@support.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await hashPassword(password);

  await query(
    `INSERT INTO admins (email, name, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'admin', true)
     ON CONFLICT (email) DO NOTHING;`,
    [email, 'Support Administrator', passwordHash],
  );

  return { email, password };
}
