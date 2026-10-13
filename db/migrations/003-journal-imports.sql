-- BP Financeiro — migration 003
-- Financial journal and import traceability foundation.
-- This file is intentionally committed only to the feature branch.
-- Do not apply to Production until reviewed and explicitly approved.

create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  created_by uuid not null references users(id) on delete restrict,
  file_name text not null,
  file_sha256 text not null,
  idempotency_key text not null,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'completed_with_errors', 'failed')),
  rows_received integer not null check (rows_received >= 0),
  rows_accepted integer not null default 0 check (rows_accepted >= 0),
  rows_rejected integer not null default 0 check (rows_rejected >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (company_id, idempotency_key),
  check (rows_accepted + rows_rejected <= rows_received)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  import_batch_id uuid references import_batches(id) on delete restrict,
  created_by uuid not null references users(id) on delete restrict,
  external_id text,
  entry_date date not null,
  competence date,
  description text not null check (length(trim(description)) > 0),
  document text,
  cost_center text,
  source text not null default 'IMPORTACAO'
    check (source in ('MANUAL', 'IMPORTACAO', 'INTEGRACAO')),
  content_sha256 text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_journal_entries_company_external_id
  on journal_entries(company_id, external_id)
  where external_id is not null and length(trim(external_id)) > 0;

create index if not exists idx_journal_entries_company_date
  on journal_entries(company_id, entry_date desc);

create index if not exists idx_journal_entries_import_batch
  on journal_entries(import_batch_id)
  where import_batch_id is not null;

create table if not exists journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  line_number integer not null check (line_number > 0),
  account_code text not null check (length(trim(account_code)) > 0),
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  created_at timestamptz not null default now(),
  unique (entry_id, line_number),
  check (not (debit > 0 and credit > 0)),
  check (debit > 0 or credit > 0)
);

create index if not exists idx_journal_lines_entry on journal_lines(entry_id);
create index if not exists idx_journal_lines_account on journal_lines(account_code);

create index if not exists idx_import_batches_company_created
  on import_batches(company_id, created_at desc);
