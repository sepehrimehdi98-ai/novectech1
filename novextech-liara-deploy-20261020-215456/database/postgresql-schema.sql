-- Novextech production PostgreSQL target schema (design/migration artifact).
-- IMPORTANT: current server/store.mjs still uses node:sqlite. Do not point the
-- application at PostgreSQL until the planned PostgreSQL store adapter exists.
-- Requires PostgreSQL with pgvector extension available to the database owner.

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS admins (
  email       text PRIMARY KEY,
  salt        text NOT NULL,
  password_hash text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  text PRIMARY KEY,
  email       text NOT NULL REFERENCES admins(email) ON DELETE CASCADE,
  csrf_token  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS posts (
  id          text PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  status      text NOT NULL CHECK (status IN ('draft', 'published')),
  revision    integer NOT NULL CHECK (revision > 0),
  updated_at  timestamptz NOT NULL,
  document    jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object')
);
CREATE INDEX IF NOT EXISTS posts_published_updated_idx
  ON posts (updated_at DESC) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       text NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key         text PRIMARY KEY,
  hit_count   integer NOT NULL CHECK (hit_count > 0),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx ON rate_limits (expires_at);

CREATE TABLE IF NOT EXISTS rag_documents (
  id                  text PRIMARY KEY,
  source_type         text NOT NULL CHECK (source_type IN
    ('company_fact','service','process_timeline','technical_explainer','faq','case_study')),
  knowledge_scope     text NOT NULL CHECK (knowledge_scope IN ('company_specific','general_industry')),
  title               text NOT NULL,
  language            text NOT NULL CHECK (language IN ('en','fa')),
  topics              text[] NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','archived')),
  client_confirmed    boolean NOT NULL DEFAULT false,
  body                text NOT NULL,
  references_json     jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by         text,
  approved_at         timestamptz,
  approval_checklist  jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at    date,
  review_due_at       date,
  version             integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rag_documents_review_idx
  ON rag_documents (status, review_due_at, updated_at DESC);

-- The default BGE-M3 vector length is 1024. If a different embedding model is
-- selected, migrate this column and all stored vectors to that model's dimension.
CREATE TABLE IF NOT EXISTS rag_chunks (
  id              text PRIMARY KEY,
  document_id     text NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  source_type     text NOT NULL CHECK (source_type IN
    ('company_fact','service','process_timeline','technical_explainer','faq','case_study')),
  knowledge_scope text NOT NULL CHECK (knowledge_scope IN ('company_specific','general_industry')),
  language        text NOT NULL CHECK (language IN ('en','fa')),
  topics          text[] NOT NULL DEFAULT '{}',
  chunk_index     integer NOT NULL CHECK (chunk_index >= 0),
  content         text NOT NULL,
  content_norm    text NOT NULL,
  embedding       vector(1024),
  embedding_model text,
  is_active       boolean NOT NULL DEFAULT false,
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS rag_chunks_active_filter_idx
  ON rag_chunks (language, knowledge_scope, source_type, document_id)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS rag_chunks_topics_idx
  ON rag_chunks USING gin (topics);
CREATE INDEX IF NOT EXISTS rag_chunks_content_trgm_idx
  ON rag_chunks USING gin (content_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS rag_chunks_vector_hnsw_idx
  ON rag_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE is_active = true AND embedding IS NOT NULL;

COMMIT;

-- After import, create separate runtime roles and grant only the privileges
-- each service needs. Keep DDL/schema migrations on a separate deployment role.
