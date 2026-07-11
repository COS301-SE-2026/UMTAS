default:
    @just --list

# combine dev into easy to use profile
dev:
    just sync
    just both

# Umtas local dev commands

# backend + phase injection
back:
    phase run -- pnpm --filter backend run start:dev

# frontend + phase injection
front:
    phase run -- pnpm --filter frontend run dev

# both + phase
both:
    phase run -- pnpm --parallel --filter backend --filter frontend run dev

# spin up local versions 
dev-infra:
   phase run -- docker compose up -d postgres redis minio solver mailhog

# compelete reset
sync:
    phase run -- docker compose down -v
    just dev-infra
    sleep 5
    pnpm install
    phase run -- pnpm --filter backend db:generate
    phase run -- pnpm --filter backend db:migrate

# shared proxy stack
proxy-up:
    phase run -- docker compose -f docker-compose.traefik.yml up -d --remove-orphans

proxy-down:
    phase run -- docker compose -f docker-compose.traefik.yml down

staging-up:
    phase run -- docker compose -f docker-compose.staging.yml up -d --remove-orphans

staging-down:
    phase run -- docker compose -f docker-compose.staging.yml down

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

# prod server commands 

# db backup
prod-db-backup:
    @echo "Creating database backup..."
    mkdir -p ./backups
    phase run --env production -- docker compose -f docker-compose.prod.yml exec -T postgres sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" "$$POSTGRES_DB"' > ./backups/prod_backup_$(date +%F_%H%M%S).sql

# start prod to specific release tag
prod-up release_tag:
    phase run --env production -- env IMAGE_TAG={{release_tag}} docker compose -f docker-compose.prod.yml up -d --remove-orphans

prod-down:
    phase run --env production -- docker compose -f docker-compose.prod.yml down

# execute migrations on prod
prod-migrate:
    phase run --env production -- docker compose -f docker-compose.prod.yml exec -T backend npx drizzle-kit migrate

# manual prod deployment

# deploy specific version
deploy-prod release_tag:
    just prod-db-backup
    just prod-up {{release_tag}}
    @echo "Production successfully deployed version {{release_tag}}"

# rollback to specific tag
rollback-prod PREVIOUS_TAG:
    @echo "Rolling back production to version {{PREVIOUS_TAG}}..."
    just prod-server-up {{PREVIOUS_TAG}}
    @echo "Rollback complete. Traefik is routing to {{PREVIOUS_TAG}}"

############################## Backend specific

#Complete restart of backend, I'm getting lazy
backendRestart:
    just dockerClean
    just sync
    just back

#lint-staged
lintBack:
    pnpm run lint-staged

#Docker cleanup
dockerClean:
    phase run -- pnpm --filter backend docker:clean

# generate | example: just generate This_change_to_this_migration
generate NAME:
    phase run -- pnpm --filter backend db:generate --name={{NAME}}

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

############################## END_Backend specific
