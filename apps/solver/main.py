from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="UMTAS Solver")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])


@app.get("/")
async def root() -> dict[str, str]:
	return {"status": "ok", "service": "solver"}


@app.get("/health")
async def health() -> dict[str, str]:
	return {"status": "ok"}

