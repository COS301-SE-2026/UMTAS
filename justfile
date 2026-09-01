default:
    @just --list

# combine dev into easy to use profile
dev:
    just dev-infra
    just both

# Umtas local dev commands


# SimService
simservInit:
    cd apps/simulation-service \
      && python3 -m venv .venv \
      && source .venv/bin/activate \
      && python3 -m pip install -r requirements.txt

[private]
rebuild-packages:
    pnpm --filter shared-types run build

# backend + phase injection
back: rebuild-packages
    phase run -- pnpm --filter backend run start:dev

# frontend + phase injection
front: rebuild-packages
    phase run -- pnpm --filter frontend run dev

# both + phase
both: rebuild-packages
    phase run -- pnpm --parallel --filter backend --filter frontend run dev

# spin up local versions
dev-infra:
    WORKER_BACKEND_URL=http://host.docker.internal:3000 phase run -- docker compose --profile dev-infra up -d --build postgres redis minio mailhog pdf-parser-worker solver-worker

# compelete reset
sync:
    just dev-infra
    sleep 5
    pnpm install
    phase run -- pnpm --filter backend db:migrate

# Safe reset keeps local volumes and migration sources.
reset:
    just sync

# Explicitly destroy local data before rebuilding the development stack.
reset-volumes:
    phase run -- docker compose down -v
    just sync

# shared proxy stack
proxy-up:
  phase run --env staging -- docker compose -p umtas-proxy -f docker-compose.traefik.yml up 

proxy-down:
   phase run --env staging  -- docker compose -p umtas-proxy -f docker-compose.traefik.yml down

staging-up:
    phase run --env staging -- docker compose -p umtas-staging -f docker-compose.staging.yml up -d --remove-orphans 

staging-down:
    phase run --env staging -- docker compose -p umtas-staging -f docker-compose.staging.yml down

# cicd for runners

# dependencies
install:
    pnpm install

# linting
lint:
    phase run --  pnpm turbo run lint

# all tests
test:
    phase run -- pnpm turbo run test

# unit tests
test-unit:
    phase run -- pnpm turbo run test --filter=!./apps/e2e -- --coverage

# run production build
build:
    pnpm turbo run build

# global ci tasks
ci:
    pnpm turbo run ci

# Full local release gate: config, tests, image smoke, Compose E2E, and audit.
validate:
    pnpm validate

# prod server commands

# db backup
prod-db-backup:
    @echo "Creating database backup..."
    mkdir -p ./backups
    phase run --env production -- docker compose -f docker-compose.prod.yml exec -T postgres sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" "$$POSTGRES_DB"' > ./backups/prod_backup_$(date +%F_%H%M%S).sql

# start prod to specific release tag
prod-up release_tag:
    IMAGE_TAG={{ release_tag }} phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml up -d --remove-orphans

prod-down release_tag:
     IMAGE_TAG={{ release_tag }} phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml down

# execute migrations on prod
prod-migrate:
    phase run --env production -- docker compose -f docker-compose.prod.yml exec -T backend npx drizzle-kit migrate

# manual prod deployment

# deploy specific version
deploy-prod release_tag:
    just prod-db-backup
    just prod-up {{ release_tag }}
    @echo "Production successfully deployed version {{ release_tag }}"

# rollback to specific tag
rollback-prod PREVIOUS_TAG:
    @echo "Rolling back production to version {{ PREVIOUS_TAG }}..."
    just prod-up {{ PREVIOUS_TAG }}
    @echo "Rollback complete. Traefik is routing to {{ PREVIOUS_TAG }}"

############################## Worker operations

# Build the PDF parser worker image
pdf-worker-build:
    pnpm docker:build:pdf-parser-worker

# Start/stop/restart the PDF parser worker for native backend development
pdf-worker-up:
    WORKER_BACKEND_URL=http://host.docker.internal:3000 phase run -- docker compose up -d pdf-parser-worker

pdf-worker-down:
    docker compose stop pdf-parser-worker

pdf-worker-restart:
    WORKER_BACKEND_URL=http://host.docker.internal:3000 phase run -- docker compose up -d --force-recreate pdf-parser-worker

pdf-worker-logs:
    docker compose logs -f pdf-parser-worker

pdf-worker-status:
    docker compose ps pdf-parser-worker

# Run the PDF worker natively after verifying its Python dependency
pdf-worker-native:
    python3 -c "import fitz"
    phase run -- sh -c 'REDIS_URL="redis://:${REDIS_PASSWORD}@127.0.0.1:6379" MINIO_ENDPOINT=http://127.0.0.1:9000 WORKER_BACKEND_URL=http://127.0.0.1:3000 PDF_PARSE_CLI_CWD={{ justfile_directory() }}/apps/pdf_parser exec pnpm --filter pdf-parser-worker dev'

# Build the solver worker image
solver-worker-build:
    pnpm docker:build:solver-worker

# Start/stop/restart the solver worker for native backend development
solver-worker-up:
    WORKER_BACKEND_URL=http://host.docker.internal:3000 phase run -- docker compose up -d solver-worker

solver-worker-down:
    docker compose stop solver-worker

solver-worker-restart:
    WORKER_BACKEND_URL=http://host.docker.internal:3000 phase run -- docker compose up -d --force-recreate solver-worker

solver-worker-logs:
    docker compose logs -f solver-worker

solver-worker-status:
    docker compose ps solver-worker

# Run the solver worker natively after verifying the C++ executable
solver-worker-native:
    test -x {{ justfile_directory() }}/apps/preference-solver/GA_BIN
    phase run -- sh -c 'REDIS_URL="redis://:${REDIS_PASSWORD}@127.0.0.1:6379" WORKER_BACKEND_URL=http://127.0.0.1:3000 SOLVER_CLI_COMMAND={{ justfile_directory() }}/apps/preference-solver/GA_BIN exec pnpm --filter solver-worker dev'

# Validate every Compose model with its matching Phase environment
compose-validate-local:
    phase run -- docker compose --profile dev-infra config --quiet

compose-validate-staging:
    phase run --env staging -- docker compose -f docker-compose.staging.yml config --quiet

compose-validate-prod:
    phase run --env production -- docker compose -f docker-compose.prod.yml config --quiet

compose-validate: compose-validate-local compose-validate-staging compose-validate-prod

worker-images-build:
    pnpm docker:build:workers:native

worker-tests:
    pnpm workers:test

worker-smoke:
    pnpm workers:smoke

worker-e2e:
    pnpm workers:e2e

docker-build-native:
    pnpm docker:build:all:native

docker-build-multiarch image_tag registry="vigilcs/umtas":
    DOCKER_REGISTRY={{ registry }} IMAGE_TAG={{ image_tag }} pnpm docker:build:all:multiarch

############################## Backend specific

#Complete restart of backend, I'm getting lazy
resetBack:
    just dockerClean
    just sync
    just back

#lint-staged
lintBack:
    pnpm run lint-staged

# Docker cleanup
dockerClean:
    phase run -- pnpm --filter backend docker:clean

# generate | example: just generate This_change_to_this_migration
generate NAME:
    phase run -- pnpm --filter backend db:generate --name={{ NAME }}

# migrate
migrate:
    phase run -- pnpm --filter backend db:migrate

# Drizzle studio
studio:
    phase run -- pnpm --filter backend db:studio

# Connect to db
db_sql:
    docker exec -it umtas-postgres-1 psql -U umtas_dev_user -d umtas_db

#Migration problem solution
# DROP SCHEMA public CASCADE; CREATE SCHEMA public; then quite
# then you can delete all migrations and meta from drizzle and regenerate and migrate


runsim:
    cd apps/simulation-service && phase run --env development -- docker compose up --build


nfr-start:
    cd apps/NFR && phase run --env development -- docker compose up -d nfr-tester

nfr-stop:
    cd apps/NFR && phase run --env development -- docker compose stop nfr-tester



nfr-upload:
    cd apps/NFR && phase run --env development -- docker compose exec nfr-tester \
        locust -f /apps/NFR/upload_locustfile.py \
        --host http://host.docker.internal:3000 \
        --users 50 \
        --spawn-rate 10 \
        --run-time 2m \
        --headless \


staging-migrate:
    phase run --env staging -- docker compose -p umtas-staging -f docker-compose.staging.yml run --rm backend node dist/db/migrate.js




# Backend testing
# unit test
backend-unit:
    phase run -- pnpm --filter backend test --coverage

# full-stack integration tests with backend c8 coverage
backend-integration-coverage:
    pnpm test:integration
    @echo "Coverage report: {{ justfile_directory() }}/apps/backend/coverage/integration/index.html"
############################## END_Backend specific
