from fastapi import FastAPI

app = FastAPI(title="UMTAS Solver")


@app.get("/")
async def root() -> dict[str, str]:
	return {"status": "ok", "service": "solver"}


@app.get("/health")
async def health() -> dict[str, str]:
	return {"status": "ok"}

