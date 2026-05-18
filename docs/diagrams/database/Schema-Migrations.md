# Schema Migrations

This diagram illustrates the lifecycle of database schema changes using **DrizzleORM**.

## Migration Workflow

1.  **Modify Schema**: Update TypeScript definitions in `packages/database/schema`.
2.  **Generate**: Run `pnpm run db:generate` to create a new SQL migration file.
3.  **Validate**: Review the SQL file for potential data loss or performance impacts.
4.  **Apply**: Deploy the migration to the environment during the CI/CD pipeline.

---

> [!NOTE]
> The visual diagram for this process is maintained within the `database.drawio` file.
