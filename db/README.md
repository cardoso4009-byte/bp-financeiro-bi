# Database foundation

The BP Financeiro database will use PostgreSQL.

Phase 1 establishes the identity and governance foundation:
- companies
- users
- company_users
- sessions
- audit_log

The application authentication currently remains environment-based. This schema is intentionally prepared for the later migration to multi-user authentication and company-level access control.

## Environment

Use `DATABASE_URL` for the PostgreSQL connection string.

Do not commit credentials, connection strings, production data, or generated environment files.

## Migration principle

Financial tables should be introduced only after the identity/tenant boundary is validated. Each future migration must preserve the distinction between:
1. official realized/accounting data;
2. managerial forecasts and scenarios;
3. audit/governance history.
