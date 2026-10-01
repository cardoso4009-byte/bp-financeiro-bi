# Database foundation

The BP Financeiro database will use PostgreSQL.

Phase 1 establishes the identity and governance foundation:
- companies
- users
- roles and permissions
- company_users
- sessions
- audit_log

The application authentication currently remains environment-based. The RBAC model is prepared with system/company scopes and explicit permissions; database-backed authentication is a later step. This schema is intentionally prepared for the later migration to multi-user authentication and company-level access control.\n\n## Connection foundation\n\nThe application expects `DATABASE_URL` to be a PostgreSQL connection string using the `postgres://` or `postgresql://` protocol. The current phase validates configuration only; it does not yet replace production authentication or write financial data.\n\nThe PostgreSQL driver will be introduced after the production database provider is provisioned and its connection is validated, keeping the current login stable during the migration.

## Environment

Use `DATABASE_URL` for the PostgreSQL connection string.

Do not commit credentials, connection strings, production data, or generated environment files.

## Migration principle

Financial tables should be introduced only after the identity/tenant boundary is validated. Each future migration must preserve the distinction between:
1. official realized/accounting data;
2. managerial forecasts and scenarios;
3. audit/governance history.
