# Redis Reference Manual (v8.0.0)

## Section 0: Quick Start

Start a secure Redis 8 instance and perform basic operations.

```bash
# Start Redis 8 using Docker with a password
docker run --name redis8 -p 6379:6379 -d redis:8 --requirepass "yourpass"

# Connect via redis-cli
redis-cli -a yourpass

# Basic operations
SET mykey "hello"
GET mykey
EXPIRE mykey 60
```

Expected output: `OK`, `"hello"`, and `1` (success).

## Section 1: Key Language Terms & Features

- **Data Structures** — Supports Strings, Lists, Sets, Sorted Sets, Hashes, Bitmaps, and HyperLogLogs. | `HSET user:1 name "Bob"` | ⚠️ Choosing the wrong structure (e.g., List vs Set) can lead to O(n) performance issues.
- **Eviction Policy** — Strategy for removing keys when the memory limit is reached (e.g., allkeys-lru). | `CONFIG SET maxmemory-policy allkeys-lru` | ⚠️ Default is `noeviction`, which returns errors when memory is full.
- **Persistence** — Methods for saving data to disk: RDB (snapshots) and AOF (append-only log). | `SAVE` / `BGSAVE` | ⚠️ AOF provides better durability but results in larger files and slower restarts.
- **Pub/Sub** — A messaging paradigm where senders (publishers) send messages to channels. | `SUBSCRIBE news_channel` | ⚠️ Messages are fire-and-forget; if a subscriber is offline, they miss the message.
- **Streams** — An append-only log data structure that supports consumer groups and persistence. | `XADD mystream * sensor-id 123` | ⚠️ Much more robust than Pub/Sub for message queuing and history.
- **Lua Scripting** — Allows executing multiple commands atomically on the server. | `EVAL "return redis.call('get', KEYS[1])" 1 mykey` | ⚠️ Scripts must be deterministic and fast to avoid blocking the single-threaded engine.
- **Redis Functions** — A modern alternative to Lua scripts that are stored and managed by the server. | `FUNCTION LOAD ...` | ⚠️ Preferred over `EVAL` for better code organization and reuse.
- **ACL (Access Control List)** — Granular security for users, commands, and keys. | `ACL SETUSER alice on >pass ~* +get` | ⚠️ Essential for multi-tenant or production environments to limit blast radius.
- **Pipelining** — Sending multiple commands to the server without waiting for individual replies. | `(echo -en "SET a b\r\nSET c d\r\n"; sleep 1) | nc localhost 6379` | ⚠️ Significantly reduces network latency overhead for batch operations.
- **Transactions** — Grouping commands into an atomic block using `MULTI`/`EXEC`. | `MULTI ... EXEC` | ⚠️ Redis transactions do not support rollbacks if a command fails after `EXEC`.
- **Field Expiration** — (New in v8) Ability to set TTL on individual fields within a Hash. | `HEXPIRE myhash 60 FIELDS 2 field1 field2` | ⚠️ Great for managing granular cache lifecycles without splitting hashes.

## Section 2: Key Commands & Workflows

- `SET key value [EX seconds]` — Sets a key with an optional expiration. | _Basic caching._
- `GET key` — Retrieves the value of a key. | _Data retrieval._
- `DEL key` — Deletes a key from the database. | _Cache invalidation._
- `INCR counter` — Atomically increments an integer value. | _Rate limiting and counters._
- `HSET hash field value` — Sets a field in a hash. | _Storing objects/profiles._
- `LPUSH list value` — Adds a value to the head of a list. | _Task queues and history._
- `SADD set member` — Adds a member to an unordered set. | _Unique collections._
- `ZADD zset score member` — Adds a member to a sorted set with a score. | _Leaderboards and priority queues._
- `SCAN 0` — Iterates through the keyspace without blocking the server. | _Safe inspection of large databases._
- `INFO` — Returns comprehensive server statistics and metrics. | _Monitoring and health checks._
- `MONITOR` — Streams every command processed by the server in real-time. | _Debugging and auditing (heavy performance cost)._

## Section 3: Architecture & Component Relationships

```
Client App (Jedis, ioredis, redis-py)
       ↓ (RESP3 Protocol)
Redis Server (Single-Threaded Event Loop)
       ↓             ↓
Memory (Primary)    Storage (RDB/AOF Persistence)
       ↓             ↓
Replication (Leader-Follower)
       ↓
Redis Sentinel (HA) or Redis Cluster (Sharding)
```

**Key Flow:** Redis processes commands sequentially in a **Single-Threaded Event Loop**, ensuring atomicity. Data is primarily served from **Memory**, with background processes handling **Persistence** and **Replication** to ensure durability and high availability.

## Section 4: Documentation Links

- [Official Redis Docs](https://redis.io/documentation) — _The complete command and feature reference._
- [Redis Commands](https://redis.io/commands) — _Searchable list of every Redis command._
- [Redis University](https://university.redis.com/) — _Free online courses for all skill levels._
- [Redis Best Practices](https://redislabs.com/redis-best-practices/) — _Guides on scaling, security, and modeling._
- [Redis GitHub](https://github.com/redis/redis) — _Source code and development roadmap._
