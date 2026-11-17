-- BP Financeiro — migration 003
-- Financial journal and import traceability foundation.
-- This file is intentionally committed only to the feature branch.
-- Do not apply to Production until reviewed and explicitly approved.

-- Company-specific chart of accounts. The import routine validates against this table.
create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null check (length(trim(code)) > 0),
  name text not null check (length(trim(name)) > 0),
  account_class text not null check (account_class in ('ativo', 'passivo', 'patrimonio', 'receita', 'custo', 'despesa')),
  nature text not null check (nature in ('devedora', 'credora')),
  level integer not null check (level > 0),
  parent_code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create index if not exists idx_chart_of_accounts_company_active
  on chart_of_accounts(company_id, active, code);

create or replace function seed_company_chart_of_accounts()
returns trigger
language plpgsql
as $seed$
begin
  insert into chart_of_accounts (company_id, code, name, account_class, nature, level, parent_code)
  values
    (new.id, '1', 'Ativo', 'ativo', 'devedora', 1, null),
    (new.id, '1.1', 'Ativo Circulante', 'ativo', 'devedora', 2, '1'),
    (new.id, '1.1.01', 'Caixa e Bancos', 'ativo', 'devedora', 3, '1.1'),
    (new.id, '1.1.02', 'Contas a Receber', 'ativo', 'devedora', 3, '1.1'),
    (new.id, '1.1.03', 'Estoques', 'ativo', 'devedora', 3, '1.1'),
    (new.id, '1.2', 'Ativo Não Circulante', 'ativo', 'devedora', 2, '1'),
    (new.id, '1.2.01', 'Imobilizado', 'ativo', 'devedora', 3, '1.2'),
    (new.id, '2', 'Passivo', 'passivo', 'credora', 1, null),
    (new.id, '2.1', 'Passivo Circulante', 'passivo', 'credora', 2, '2'),
    (new.id, '2.1.01', 'Fornecedores', 'passivo', 'credora', 3, '2.1'),
    (new.id, '2.1.02', 'Obrigações e Tributos', 'passivo', 'credora', 3, '2.1'),
    (new.id, '2.2', 'Passivo Não Circulante', 'passivo', 'credora', 2, '2'),
    (new.id, '2.2.01', 'Empréstimos e Financiamentos', 'passivo', 'credora', 3, '2.2'),
    (new.id, '3', 'Patrimônio Líquido', 'patrimonio', 'credora', 1, null),
    (new.id, '3.1', 'Capital Social', 'patrimonio', 'credora', 2, '3'),
    (new.id, '3.2', 'Lucros/Prejuízos Acumulados', 'patrimonio', 'credora', 2, '3'),
    (new.id, '4', 'Receitas', 'receita', 'credora', 1, null),
    (new.id, '4.1', 'Receita de Vendas', 'receita', 'credora', 2, '4'),
    (new.id, '5', 'Custos', 'custo', 'devedora', 1, null),
    (new.id, '5.1', 'Custo dos Produtos/Serviços', 'custo', 'devedora', 2, '5'),
    (new.id, '6', 'Despesas', 'despesa', 'devedora', 1, null),
    (new.id, '6.1', 'Despesas Operacionais', 'despesa', 'devedora', 2, '6'),
    (new.id, '6.2', 'Despesas Financeiras', 'despesa', 'devedora', 2, '6'),
    (new.id, '6.3', 'Impostos sobre o Resultado', 'despesa', 'devedora', 2, '6'),
    (new.id, '6.4', 'Depreciação', 'despesa', 'devedora', 2, '6')
  on conflict (company_id, code) do nothing;
  return new;
end;
$seed$;

drop trigger if exists trg_seed_company_chart_of_accounts on companies;
create trigger trg_seed_company_chart_of_accounts
after insert on companies
for each row execute function seed_company_chart_of_accounts();

-- Seed the companies that already exist when this migration is applied.
insert into chart_of_accounts (company_id, code, name, account_class, nature, level, parent_code)
select c.id, a.code, a.name, a.account_class, a.nature, a.level, a.parent_code
from companies c
cross join (values
  ('1', 'Ativo', 'ativo', 'devedora', 1, null),
  ('1.1', 'Ativo Circulante', 'ativo', 'devedora', 2, '1'),
  ('1.1.01', 'Caixa e Bancos', 'ativo', 'devedora', 3, '1.1'),
  ('1.1.02', 'Contas a Receber', 'ativo', 'devedora', 3, '1.1'),
  ('1.1.03', 'Estoques', 'ativo', 'devedora', 3, '1.1'),
  ('1.2', 'Ativo Não Circulante', 'ativo', 'devedora', 2, '1'),
  ('1.2.01', 'Imobilizado', 'ativo', 'devedora', 3, '1.2'),
  ('2', 'Passivo', 'passivo', 'credora', 1, null),
  ('2.1', 'Passivo Circulante', 'passivo', 'credora', 2, '2'),
  ('2.1.01', 'Fornecedores', 'passivo', 'credora', 3, '2.1'),
  ('2.1.02', 'Obrigações e Tributos', 'passivo', 'credora', 3, '2.1'),
  ('2.2', 'Passivo Não Circulante', 'passivo', 'credora', 2, '2'),
  ('2.2.01', 'Empréstimos e Financiamentos', 'passivo', 'credora', 3, '2.2'),
  ('3', 'Patrimônio Líquido', 'patrimonio', 'credora', 1, null),
  ('3.1', 'Capital Social', 'patrimonio', 'credora', 2, '3'),
  ('3.2', 'Lucros/Prejuízos Acumulados', 'patrimonio', 'credora', 2, '3'),
  ('4', 'Receitas', 'receita', 'credora', 1, null),
  ('4.1', 'Receita de Vendas', 'receita', 'credora', 2, '4'),
  ('5', 'Custos', 'custo', 'devedora', 1, null),
  ('5.1', 'Custo dos Produtos/Serviços', 'custo', 'devedora', 2, '5'),
  ('6', 'Despesas', 'despesa', 'devedora', 1, null),
  ('6.1', 'Despesas Operacionais', 'despesa', 'devedora', 2, '6'),
  ('6.2', 'Despesas Financeiras', 'despesa', 'devedora', 2, '6'),
  ('6.3', 'Impostos sobre o Resultado', 'despesa', 'devedora', 2, '6'),
  ('6.4', 'Depreciação', 'despesa', 'devedora', 2, '6')
) as a(code, name, account_class, nature, level, parent_code)
on conflict (company_id, code) do nothing;

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

-- Server-side atomic import: validation and all writes run in one PostgreSQL transaction.
create or replace function import_journal_batch(
  p_company_id uuid,
  p_user_id uuid,
  p_file_name text,
  p_file_sha256 text,
  p_idempotency_key text,
  p_entries jsonb
) returns jsonb
language plpgsql
as $$
declare
  v_batch_id uuid;
  v_existing import_batches%rowtype;
  v_entry jsonb;
  v_line jsonb;
  v_entry_id uuid;
  v_line_number integer;
  v_rows integer;
  v_lines integer;
  v_debit numeric(18,2);
  v_credit numeric(18,2);
  v_content_sha256 text;
begin
  if p_company_id is null or p_user_id is null then
    raise exception 'Contexto de empresa/usuário inválido' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_file_name, ''))) = 0 or length(p_file_name) > 255 then
    raise exception 'Nome de arquivo inválido' using errcode = '22023';
  end if;
  if p_file_sha256 !~ '^[a-fA-F0-9]{64}$' then
    raise exception 'Hash do arquivo inválido' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_idempotency_key, ''))) < 8 or length(p_idempotency_key) > 128 then
    raise exception 'Chave de idempotência inválida' using errcode = '22023';
  end if;
  if jsonb_typeof(p_entries) <> 'array' then
    raise exception 'A lista de lançamentos é inválida' using errcode = '22023';
  end if;

  v_rows := jsonb_array_length(p_entries);
  if v_rows < 1 or v_rows > 500 then
    raise exception 'A importação deve conter entre 1 e 500 lançamentos' using errcode = '22023';
  end if;

  -- Validate the entire payload before writing any rows.
  for v_entry in select value from jsonb_array_elements(p_entries)
  loop
    if length(trim(coalesce(v_entry->>'id', ''))) = 0 then
      raise exception 'Todo lançamento precisa de ID externo' using errcode = '22023';
    end if;
    if length(trim(coalesce(v_entry->>'description', ''))) = 0 then
      raise exception 'Todo lançamento precisa de histórico' using errcode = '22023';
    end if;
    perform (v_entry->>'date')::date;
    if jsonb_typeof(v_entry->'lines') <> 'array' or jsonb_array_length(v_entry->'lines') < 2 then
      raise exception 'Cada lançamento precisa de pelo menos duas partidas' using errcode = '22023';
    end if;

    select count(*),
           coalesce(sum((line->>'debit')::numeric), 0),
           coalesce(sum((line->>'credit')::numeric), 0)
      into v_lines, v_debit, v_credit
      from jsonb_array_elements(v_entry->'lines') as line;

    if v_lines < 2 or v_lines > 1000 then
      raise exception 'Quantidade de partidas inválida' using errcode = '22023';
    end if;
    if abs(v_debit - v_credit) >= 0.01 then
      raise exception 'Débitos e créditos não estão balanceados no lançamento %', v_entry->>'id' using errcode = '22023';
    end if;

    for v_line in select value from jsonb_array_elements(v_entry->'lines')
    loop
      if length(trim(coalesce(v_line->>'account', ''))) = 0 then
        raise exception 'Código de conta obrigatório' using errcode = '22023';
      end if;
      if not exists (
        select 1
          from chart_of_accounts coa
         where coa.company_id = p_company_id
           and coa.code = trim(v_line->>'account')
           and coa.active = true
      ) then
        raise exception 'Conta inexistente ou inativa no plano de contas da empresa: %', trim(v_line->>'account') using errcode = '22023';
      end if;
      if (v_line->>'debit')::numeric < 0 or (v_line->>'credit')::numeric < 0 then
        raise exception 'Valores negativos não são permitidos' using errcode = '22023';
      end if;
      if (v_line->>'debit')::numeric > 0 and (v_line->>'credit')::numeric > 0 then
        raise exception 'Uma partida não pode ter débito e crédito simultaneamente' using errcode = '22023';
      end if;
      if (v_line->>'debit')::numeric = 0 and (v_line->>'credit')::numeric = 0 then
        raise exception 'Uma partida precisa ter débito ou crédito' using errcode = '22023';
      end if;
    end loop;
  end loop;

  insert into import_batches (
    company_id, created_by, file_name, file_sha256, idempotency_key,
    status, rows_received, rows_accepted, rows_rejected, metadata, completed_at
  ) values (
    p_company_id, p_user_id, p_file_name, lower(p_file_sha256), p_idempotency_key,
    'processing', v_rows, 0, 0, jsonb_build_object('source', 'csv'), null
  )
  on conflict (company_id, idempotency_key) do nothing
  returning id into v_batch_id;

  if v_batch_id is null then
    select * into v_existing
      from import_batches
      where company_id = p_company_id and idempotency_key = p_idempotency_key
      for update;
    if v_existing.file_sha256 <> lower(p_file_sha256) then
      raise exception 'Chave de idempotência já utilizada por outro arquivo' using errcode = '23505';
    end if;
    if v_existing.status = 'completed' then
      return jsonb_build_object('batchId', v_existing.id, 'status', 'already_completed',
        'accepted', v_existing.rows_accepted, 'rejected', v_existing.rows_rejected);
    end if;
    raise exception 'Já existe uma importação em andamento com esta chave' using errcode = '23505';
  end if;

  for v_entry in select value from jsonb_array_elements(p_entries)
  loop
    v_content_sha256 := encode(digest(v_entry::text, 'sha256'), 'hex');
    insert into journal_entries (
      company_id, import_batch_id, created_by, external_id, entry_date, competence,
      description, document, cost_center, source, content_sha256
    ) values (
      p_company_id, v_batch_id, p_user_id, trim(v_entry->>'id'), (v_entry->>'date')::date,
      case
        when coalesce(v_entry->>'competence', '') ~ '^\d{4}-\d{2}$'
          then ((v_entry->>'competence') || '-01')::date
        when coalesce(v_entry->>'competence', '') <> ''
          then (v_entry->>'competence')::date
        else null
      end,
      trim(v_entry->>'description'), nullif(trim(coalesce(v_entry->>'document', '')), ''),
      nullif(trim(coalesce(v_entry->>'costCenter', '')), ''), 'IMPORTACAO', v_content_sha256
    ) returning id into v_entry_id;

    v_line_number := 0;
    for v_line in select value from jsonb_array_elements(v_entry->'lines')
    loop
      v_line_number := v_line_number + 1;
      insert into journal_lines (entry_id, line_number, account_code, debit, credit)
      values (v_entry_id, v_line_number, trim(v_line->>'account'),
        (v_line->>'debit')::numeric, (v_line->>'credit')::numeric);
    end loop;
  end loop;

  update import_batches
    set status = 'completed', rows_accepted = v_rows, completed_at = now()
    where id = v_batch_id;

  insert into audit_log (company_id, user_id, action, entity, entity_id, metadata)
  values (p_company_id, p_user_id, 'journal.import.completed', 'import_batch', v_batch_id::text,
    jsonb_build_object('fileName', p_file_name, 'fileSha256', lower(p_file_sha256),
      'entries', v_rows, 'source', 'csv'));

  return jsonb_build_object('batchId', v_batch_id, 'status', 'completed',
    'accepted', v_rows, 'rejected', 0);
end;
$$;
