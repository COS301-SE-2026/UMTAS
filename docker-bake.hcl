variable "CI_BACKEND_IMAGE" {
  default = "umtas-ci-backend:local"
}

variable "CI_PDF_PARSER_IMAGE" {
  default = "umtas-ci-pdf-parser:local"
}

variable "CI_SOLVER_IMAGE" {
  default = "umtas-ci-solver:local"
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
