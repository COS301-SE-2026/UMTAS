# Locust Reference Manual (v2.32.x)

## Section 0: Quick Start

Immediate hands-on path for load testing.

```python
# locustfile.py
from locust import HttpUser, task

class HelloWorldUser(HttpUser):
    @task
    def hello_world(self):
        self.client.get("/hello")
```

```bash
# Run locust
locust -f locustfile.py
```

Visit `http://localhost:8089` → Enter number of users and spawn rate → Start swarming.

---

## Section 1: Key Language Terms & Features

- **User Class** — Defines the behavior of a simulated user | `class MyUser(HttpUser):` | ⚠️ Every user runs in its own greenlet (micro-thread).
- **Task** — A specific action a user performs | `@task` | ⚠️ Use weights (`@task(3)`) to make some tasks more frequent than others.
- **Wait Time** — The time a user waits between tasks | `wait_time = between(1, 5)` | ⚠️ Realistic wait times are crucial for accurate load simulation.
- **Self.client** — An HTTP client (wrapper around `requests`) that keeps track of success/failure | `self.client.get("/")` | ⚠️ Use `with self.client.get(...) as response:` to manually validate responses.
- **Host** — The base URL of the target system | `host = "https://api.myapp.com"` | ⚠️ Can be set in the class or via the command line.
- **On_start / On_stop** — Methods called when a user starts or stops running | `def on_start(self):` | ⚠️ Perfect for logging in or cleaning up session data.
- **Greenlets** — Lightweight cooperative threads used by Locust to simulate thousands of users | `gevent` | ⚠️ Avoid using blocking I/O inside tasks; use Locust's async clients if needed.
- **Distributed Mode** — Running Locust across multiple machines to generate massive load | `--master`, `--worker` | ⚠️ Ensure all workers have the same version of the `locustfile.py`.

---

## Section 2: Key Commands & Workflows

- `locust -f <file>` — Starts Locust with a specific test file | _Primary command._
- `locust --headless` — Runs Locust without the web UI | _Best for CI/CD pipelines._
- `locust --users 100 --spawn-rate 10` — Sets user count and spawn rate via CLI | _Headless execution._
- `locust --run-time 10m` — Automatically stops the test after a certain duration | _Automated testing._
- `locust --master` — Starts Locust in master mode | _Distributed testing._
- `locust --worker --master-host <ip>` — Starts a worker and connects to a master | _Distributed testing._
- `locust --csv <filename>` — Exports test results to CSV files | _Data analysis._
- `locust -H <url>` — Overrides the host URL | _Testing different environments._

---

## Section 3: Architecture & Component Relationships

Locust uses an event-driven architecture based on `gevent` to simulate many users concurrently on a single machine or across a cluster.

```text
Locust Master (Web UI / Stats)
       ↑ (ZeroMQ)
  [ Locust Workers ]
       ↓ (Greenlets)
  [ Simulated Users ]
       ↓ (HTTP/Custom)
   Target System (SUT)
```

---

## Section 4: Documentation Links

- [Official Documentation](https://docs.locust.io/) — _Getting started and advanced guides._
- [Writing a locustfile](https://docs.locust.io/en/stable/writing-a-locustfile.html) — _Deep dive into task definition._
- [Distributed Execution](https://docs.locust.io/en/stable/running-locust-distributed.html) — _Scaling your tests._
- [Locust GitHub](https://github.com/locustio/locust) — _Source code and examples._
- [Community Plugins](https://github.com/SvenskaSpel/locust-plugins) — _Useful extensions for different protocols._
