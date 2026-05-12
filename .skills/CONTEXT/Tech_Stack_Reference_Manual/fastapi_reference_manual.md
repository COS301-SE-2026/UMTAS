# FastAPI Reference Manual (v0.136.1)

## Section 0: Quick Start

Immediate setup for a production-ready development environment.

```bash
# Install FastAPI with standard production-ready dependencies
pip install "fastapi[standard]"

# Create a minimal API
echo 'from fastapi import FastAPI
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}' > main.py

# Run the development server
fastapi dev main.py
```

Visit `http://127.0.0.1:8000` → See `{"message": "Hello World"}` response.
Visit `http://127.0.0.1:8000/docs` → Interactive Swagger UI.

## Section 1: Key Language Terms/Features

- **Path Operation** — A function associated with a specific URL path and HTTP method using a decorator. | `@app.get("/items/{id}")` | ⚠️ Ensure function names are unique across your API.
- **Pydantic Model** — Classes defining data schemas for request validation and response serialization. | `class Item(BaseModel): name: str` | ⚠️ Use `response_model` in decorators to filter output data.
- **Annotated** — The standard way to define dependencies, metadata, and validation in function signatures. | `q: Annotated[str | None, Query(max_length=50)]` | ⚠️ Required for clean, modern FastAPI (Python 3.10+).
- **Dependency Injection (DI)** — A system for sharing logic like database sessions or security across routes. | `db: Annotated[Session, Depends(get_db)]` | ⚠️ Prefer DI over global variables for better testability.
- **APIRouter** — A tool to group related endpoints and split large applications into multiple files. | `router = APIRouter(prefix="/users")` | ⚠️ Always include routers in the main `FastAPI` instance.
- **Async/Await** — Support for non-blocking I/O operations (DB, external APIs) using Python concurrency. | `async def read_data(): data = await db.fetch()` | ⚠️ Use `def` (not `async def`) for blocking/CPU-bound tasks.
- **Query Parameters** — Variables extracted from the URL query string (after the `?`). | `def search(page: int = 1): ...` | ⚠️ Use `Annotated` with `Query` for detailed validation like `gt=0`.
- **Path Parameters** — Variables embedded directly within the URL path. | `@app.get("/user/{user_id}")` | ⚠️ Parameters in the path must match the function arguments exactly.
- **Request Body** — JSON data sent by the client, automatically parsed and validated into Pydantic models. | `def create(item: Item): ...` | ⚠️ GET requests should not have a request body by convention.
- **Background Tasks** — Functions scheduled to run after the HTTP response has been sent to the client. | `tasks.add_task(send_email, email)` | ⚠️ Not a replacement for Celery/Redis for heavy, long-running jobs.
- **Middleware** — Functions that execute before every request and after every response. | `app.add_middleware(CORSMiddleware)` | ⚠️ Large middleware can significantly increase request latency.
- **Global Exception Handler** — Centralized logic to catch specific errors and return custom HTTP responses. | `@app.exception_handler(MyError)` | ⚠️ Prevents leaking internal stack traces to the end user.

## Section 2: Key Commands & Workflows

- `pip install "fastapi[standard]"` — Installs FastAPI, Uvicorn, and standard utilities. | _Initial project setup._
- `fastapi dev main.py` — Starts the development server with hot-reload and debugger enabled. | _Active local development._
- `fastapi run main.py` — Starts the server in production mode (multiple workers, no reload). | _Deployment/Staging environments._
- `uvicorn main:app --reload` — The underlying command to run the ASGI server manually. | _Low-level server configuration._
- `pytest` — Runs the test suite; works seamlessly with `httpx` and `TestClient`. | _Verifying API logic._
- `pip freeze > requirements.txt` — Records all installed dependencies and their versions. | _Environment reproducibility._
- `python -m venv .venv` — Creates a localized Python virtual environment. | _Isolation from system Python._

## Section 3: Architecture & Component Relationships

```
Client Request (HTTP)
       ↓
    Uvicorn (ASGI Server)
       ↓
    Starlette (Routing & Base Middleware)
       ↓
    FastAPI (Dependency Injection & Context)
       ↓             ↖
Pydantic (Validation) ← Path Operation Function (Business Logic)
       ↓             ↙
Pydantic (Serialization)
       ↓
Client Response (JSON)
```

**Key Flow:** FastAPI intercepts the request, uses **Pydantic** to validate the body/params against your type hints, injects **Dependencies**, executes your **Path Operation**, and then uses Pydantic again to ensure the response matches your `response_model`.

## Section 4: Documentation Links

- [Official Documentation](https://fastapi.tiangolo.com/) — _Comprehensive guides and API reference._
- [Tutorial - User Guide](https://fastapi.tiangolo.com/tutorial/) — _Step-by-step introduction to core concepts._
- [Deployment Guide](https://fastapi.tiangolo.com/deployment/) — _Best practices for Docker and cloud providers._
- [Pydantic v2 Documentation](https://docs.pydantic.dev/latest/) — _Deep dive into the validation engine._
- [Advanced Middleware/Security](https://fastapi.tiangolo.com/advanced/) — _Handling OAuth2, Scopes, and complex flows._
