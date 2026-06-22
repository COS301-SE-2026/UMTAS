default:
    @just --list

# combine dev into easy to use profile
dev:
    just dev-infra
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

# cicd for runners

# dependencies
install:
    pnpm install

# linting
lint:
    turbo run lint

# all tests
test:
    turbo run test

# unit tests
test-unit:
    turbo run test --filter=!./apps/e2e -- --coverage

# run production build
build:
    turbo run build

# global ci tasks 
ci:
    turbo run ci

# prod server commands 

# db backup
prod-db-backup:
    @echo "Creating database backup..."
    mkdir -p ./backups
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres pg_dumpall -U postgres > ./backups/prod_backup_$(date +%F_%H%M%S).sql

# start prod to specific tag
prod-server-up TAG="latest":
    TAG={{TAG}} docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server up -d

# execute migrations on prod
prod-migrate:
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend pnpm run db:migrate

# manual prod deployment

# deploy specific version
deploy-prod TAG:
    just prod-db-backup
    just prod-server-up {{TAG}}
    just prod-migrate
    @echo "Production successfully deployed version {{TAG}}"

# rollback to specific tag
rollback-prod PREVIOUS_TAG:
    @echo "Rolling back production to version {{PREVIOUS_TAG}}..."
    just prod-server-up {{PREVIOUS_TAG}}
    @echo "Rollback complete. Traefik is routing to {{PREVIOUS_TAG}}"