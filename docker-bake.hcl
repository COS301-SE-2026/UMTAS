variable "CI_BACKEND_IMAGE" {
  default = "umtas-ci-backend:local"
}

variable "CI_PDF_PARSER_IMAGE" {
  default = "umtas-ci-pdf-parser:local"
}

variable "CI_SOLVER_IMAGE" {
  default = "umtas-ci-solver:local"
}

group "default" {
  targets = ["backend", "pdf-parser-worker", "solver-worker"]
}

target "backend" {
  context    = "."
  dockerfile = "docker/backend/backend.Dockerfile"
  tags       = [CI_BACKEND_IMAGE]
  cache-from = ["type=gha,scope=backend-staging"]
}

target "pdf-parser-worker" {
  context    = "."
  dockerfile = "docker/pdf-parser-worker/pdf-parser-worker.Dockerfile"
  tags       = [CI_PDF_PARSER_IMAGE]
  cache-from = ["type=gha,scope=pdf-parser-staging"]
}

target "solver-worker" {
  context    = "."
  dockerfile = "docker/solver-worker/solver-worker.Dockerfile"
  tags       = [CI_SOLVER_IMAGE]
  cache-from = ["type=gha,scope=solver-worker-staging"]
}

# Local e2e images. Tags match the defaults in apps/e2e/e2e.compose.yml, so
# `docker buildx bake e2e-local` builds everything in parallel with a persistent
# local cache and compose then starts without rebuilding.
group "e2e-local" {
  targets = ["e2e-backend", "e2e-pdf-parser", "e2e-solver", "e2e-frontend", "e2e-runner"]
}

target "_e2e-local" {
  context = "."
}

target "e2e-backend" {
  inherits   = ["_e2e-local"]
  dockerfile = "docker/backend/backend.Dockerfile"
  tags       = ["umtas-e2e-backend"]
  cache-from = ["type=local,src=.buildx-cache/e2e-backend"]
  cache-to   = ["type=local,dest=.buildx-cache/e2e-backend,mode=max"]
}

target "e2e-pdf-parser" {
  inherits   = ["_e2e-local"]
  dockerfile = "docker/pdf-parser-worker/pdf-parser-worker.Dockerfile"
  tags       = ["umtas-e2e-pdf-parser"]
  cache-from = ["type=local,src=.buildx-cache/e2e-pdf-parser"]
  cache-to   = ["type=local,dest=.buildx-cache/e2e-pdf-parser,mode=max"]
}

target "e2e-solver" {
  inherits   = ["_e2e-local"]
  dockerfile = "docker/solver-worker/solver-worker.Dockerfile"
  tags       = ["umtas-e2e-solver"]
  cache-from = ["type=local,src=.buildx-cache/e2e-solver"]
  cache-to   = ["type=local,dest=.buildx-cache/e2e-solver,mode=max"]
}

target "e2e-frontend" {
  inherits   = ["_e2e-local"]
  dockerfile = "docker/frontend/frontend.Dockerfile"
  tags       = ["umtas-e2e-frontend"]
  args = {
    NEXT_PUBLIC_API_URL = "/api"
    API_URL             = "http://backend:3000"
    COOKIE_SECURE       = "false"
    SKIP_ML_MODELS      = "1"
  }
  cache-from = ["type=local,src=.buildx-cache/e2e-frontend"]
  cache-to   = ["type=local,dest=.buildx-cache/e2e-frontend,mode=max"]
}

target "e2e-runner" {
  inherits   = ["_e2e-local"]
  dockerfile = "apps/e2e/Dockerfile"
  tags       = ["umtas-e2e-runner"]
  cache-from = ["type=local,src=.buildx-cache/e2e-runner"]
  cache-to   = ["type=local,dest=.buildx-cache/e2e-runner,mode=max"]
}
