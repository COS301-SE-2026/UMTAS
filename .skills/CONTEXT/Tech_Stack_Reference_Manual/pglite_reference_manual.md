# PGLite Reference Manual (v0.4.4)

## Section 0: Quick Start

Run a fully functional PostgreSQL instance directly in your browser or Node.js environment.

```bash
# Install PGLite
pnpm add @electric-sql/pglite

# Initialize and query a database in-memory
import { PGLite } from "@electric-sql/pglite";
const db = new PGLite();
await db.query("CREATE TABLE test (id SERIAL PRIMARY KEY, name TEXT);");
await db.query("INSERT INTO test (name) VALUES ('PGLite');");
const result = await db.query("SELECT * FROM test;");
```

Expected output: Result object containing the row `{ id: 1, name: 'PGLite' }`.

## Section 1: Key Language Terms & Features

- **WASM Postgres** — A complete PostgreSQL engine compiled to WebAssembly for execution in non-native environments. | `new PGLite()` | ⚠️ Does not support all extensions; check compatibility before using `CREATE EXTENSION`.
- **In-Memory Storage** — Default storage mode where all data is lost when the process or page is refreshed. | `new PGLite()` | ⚠️ Use a persistence provider for production data.
- **IndexedDB Persistence** — Browser-native storage that persists data across sessions. | `new PGLite("idb://my-db")` | ⚠️ Browser storage limits (quota) apply; handling "out of space" errors is required.
- **File System Persistence** — Node.js-specific storage for saving data to the local disk. | `new PGLite("./path/to/db")` | ⚠️ Ensure the process has write permissions for the target directory.
- **Electric-SQL Sync** — Integration with Electric-SQL for real-time data synchronization with a central Postgres. | `plugins: [electricSync()]` | ⚠️ Requires an active Electric-SQL server and correctly configured replication.
- **Extensions Support** — Support for common Postgres extensions like `pgvector` and `PostGIS` (v0.4+). | `CREATE EXTENSION vector;` | ⚠️ Extensions must be pre-compiled into the WASM bundle.
- **Postgres Protocol** — Supports a subset of the standard wire protocol for connection from existing tools. | `db.listen(...)` | ⚠️ Not all client libraries are supported due to the lack of raw TCP/IP in browsers.
- **Transaction Support** — Full ACID transactions just like native PostgreSQL. | `db.transaction(async (tx) => { ... })` | ⚠️ Transactions are local to the instance; they do not span multiple PGLite objects.
- **Decoupled initdb** — (New in v0.4) Optimization that separates database initialization from the main process. | (Internal) | ⚠️ Significantly reduces startup time for subsequent loads of an existing DB.
- **Query Parameterization** — Prevents SQL injection by using placeholders for variables. | `db.query("SELECT * FROM u WHERE id = $1", [1])` | ⚠️ Always use parameterization; never concatenate strings into SQL queries.

## Section 2: Key Commands & Workflows

- `pnpm add @electric-sql/pglite` — Installs the library. | _Project initialization._
- `new PGLite(path)` — Creates or opens a database instance. | _Loading the database._
- `db.query(sql, params)` — Executes a single SQL query. | _Data interaction._
- `db.exec(sql)` — Executes multiple SQL statements separated by semicolons. | _Schema migration or batch scripts._
- `db.close()` — Safely shuts down the database engine. | _Resource cleanup._
- `db.onNotification(channel, callback)` — Listens for `LISTEN/NOTIFY` events. | _Real-time updates._
- `db.dump()` — Creates a binary backup of the entire database. | _Exporting data._
- `db.load(data)` — Restores a database from a binary dump. | _Importing data._

## Section 3: Architecture & Component Relationships

```
Application Logic (JS/TS)
       ↓
PGLite Client API
       ↓
[PostgreSQL WASM Engine] ← [Extensions (pgvector, PostGIS)]
       ↓
Storage Layer (Memory / IndexedDB / Node-FS)
```

**Key Flow:** The **PGLite Client** sends queries to the **WASM Engine**, which executes them against the **Storage Layer**. If **Extensions** are used, they are invoked within the WASM sandbox to provide additional functionality.

## Section 4: Documentation Links

- [Official PGLite Site](https://pglite.dev/) — _Introduction and core concepts._
- [GitHub Repository](https://github.com/electric-sql/pglite) — _Source code and technical discussions._
- [Electric-SQL Documentation](https://electric-sql.com/docs) — _Guide to synchronization and replication._
- [WASM Postgres Reference](https://pglite.dev/docs/wasm) — _Understanding the limitations of WASM-based DBs._
- [Extension Guide](https://pglite.dev/docs/extensions) — _How to enable and use pgvector/PostGIS._
