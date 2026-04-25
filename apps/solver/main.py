from fastapi import FastAPI

app = FastAPI(title="UMTAS Solver")


@app.get("/")
async def root() -> dict[str, str]:
	return {"status": "ok", "service": "solver"}

