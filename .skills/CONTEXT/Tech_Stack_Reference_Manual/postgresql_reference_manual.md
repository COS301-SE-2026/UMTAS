# PostgreSQL Reference Manual (v18.0)

## Section 0: Quick Start

Spin up a modern PostgreSQL instance with vector search and JSON support.

```bash
# Start PostgreSQL v18 with pgvector using Docker
docker run --name pg18 -e POSTGRES_PASSWORD=pass -p 5432:5432 -d pgvector/pgvector:pg18

# Connect via psql
psql -h localhost -U postgres

# Create a table with vector and JSONB columns
CREATE TABLE items (id serial PRIMARY KEY, embedding vector(3), data jsonb);
INSERT INTO items (embedding, data) VALUES ('[0.1, 0.2, 0.3]', '{"name": "test"}');
```

Expected output: Table created and one row inserted successfully.

## Section 1: Key Language Terms & Features

- **pgvector** — The industry-standard extension for storing and querying high-dimensional vectors (AI/LLM). | `embedding vector(1536)` | ⚠️ Ensure you create an HNSW or IVFFlat index for fast search.
- **JSONB** — Binary JSON storage that supports indexing and efficient querying of semi-structured data. | `data->>'name'` | ⚠️ Prefer `jsonb` over `json` for almost all use cases due to performance.
- **Common Table Expression (CTE)** — A temporary result set used within a larger query to improve readability. | `WITH regional_sales AS (...)` | ⚠️ Use `MATERIALIZED` to force Postgres to cache the CTE result.
- **Logical Replication** — A method for replicating specific tables or databases to other instances. | `CREATE PUBLICATION my_pub FOR TABLE users;` | ⚠️ Primary keys are required on all replicated tables.
- **Foreign Data Wrapper (FDW)** — A tool to query external data sources (other DBs, CSVs) as if they were tables. | `CREATE SERVER remote_pg ...` | ⚠️ Network latency can significantly impact performance of FDW queries.
- **Partitioning** — Splitting a large table into smaller, more manageable pieces based on a key. | `PARTITION BY RANGE (created_at)` | ⚠️ Global indexes across partitions are not natively supported in all cases.
- **HNSW Index** — A graph-based index for fast approximate nearest neighbor (ANN) search on vectors. | `CREATE INDEX ON items USING hnsw (...)` | ⚠️ Higher `m` and `ef_construction` values improve accuracy but slow down builds.
- **UPSERT** — A syntax for "Update or Insert" that handles conflicts on unique constraints. | `ON CONFLICT (id) DO UPDATE SET ...` | ⚠️ The conflict target must match a unique index or constraint exactly.
- **Transaction Isolation** — Controls how changes in one transaction are visible to others (e.g., Read Committed). | `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;` | ⚠️ Higher isolation levels reduce concurrency and increase retry logic complexity.
- **Window Functions** — Performs calculations across a set of rows related to the current row. | `RANK() OVER (PARTITION BY dept ORDER BY salary DESC)` | ⚠️ They execute after the `WHERE` clause, requiring subqueries for filtering.

## Section 2: Key Commands & Workflows

- `psql -U postgres` — Opens the interactive terminal for database management. | _Executing SQL and admin tasks._
- `pg_dump -d mydb > backup.sql` — Exports a database to a SQL script file. | _Backing up data._
- `pg_restore -d mydb backup.dump` — Restores a database from a custom-format archive. | _Recovering from a backup._
- `EXPLAIN ANALYZE SELECT ...` — Shows the execution plan and actual timing of a query. | _Query performance tuning._
- `VACUUM ANALYZE` — Reclaims storage from deleted rows and updates statistics. | _Routine maintenance._
- `CREATE EXTENSION IF NOT EXISTS vector;` — Enables pgvector support in the current database. | _Enabling AI features._
- `\d table_name` — Displays the schema definition of a specific table. | _Inspecting table structure._
- `SHOW max_connections;` — Displays the current value of a configuration parameter. | _Checking server settings._

## Section 3: Architecture & Component Relationships

```
Client (App)
    ↓ (TCP/IP / Unix Socket)
Postmaster Process (Listener)
    ↓ (Spawns)
Backend Worker Process (Per Connection)
    ↓               ↓
Shared Buffers ←→ WAL Buffer (Write Ahead Log)
    ↓               ↓
Data Files (.db)   WAL Files (.log)
```

**Key Flow:** PostgreSQL uses a **Process-per-Connection** model. Data is first written to the **WAL (Write Ahead Log)** for durability before being synced to the **Shared Buffers** and eventually persisted to disk.

## Section 4: Documentation Links

- [Official PostgreSQL Docs](https://www.postgresql.org/docs/18/) — _The definitive SQL reference._
- [pgvector GitHub](https://github.com/pgvector/pgvector) — _Documentation for vector search._
- [Postgres Weekly](https://postgresweekly.com/) — _Curated news and technical articles._
- [Explained Visually](https://pganalyze.com/blog/visualizing-postgres-query-plans) — _Guide to understanding EXPLAIN output._
- [DB-Engines Postgres](https://db-engines.com/en/system/PostgreSQL) — _Trends and comparisons with other databases._
