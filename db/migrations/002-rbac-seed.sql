-- BP Financeiro — identity/RBAC seed
-- Reference roles and permissions. Application data is not seeded here.

insert into roles (key, name, scope) values
  ('admin', 'Administrador', 'system'),
  ('manager', 'Gestor Financeiro', 'company'),
  ('analyst', 'Analista Financeiro', 'company'),
  ('viewer', 'Visualizador', 'company')
on conflict (key) do nothing;

insert into permissions (key, name) values
  ('dashboard.view', 'Visualizar painel executivo'),
  ('financial.read', 'Consultar dados financeiros'),
  ('financial.write', 'Editar dados financeiros'),
  ('forecast.manage', 'Gerir forecast e cenários'),
  ('company.manage', 'Gerir empresa e utilizadores'),
  ('audit.read', 'Consultar auditoria')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.key = 'admin'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key in ('dashboard.view','financial.read','financial.write','forecast.manage','audit.read')
where r.key = 'manager'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key in ('dashboard.view','financial.read','forecast.manage')
where r.key = 'analyst'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key in ('dashboard.view','financial.read')
where r.key = 'viewer'
on conflict do nothing;
