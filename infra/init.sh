#!/usr/bin/env bash
# Bootstrap a fresh production server by writing root .env
# Usage: bash infra/init.sh
# Requires: openssl (standard on all Linux servers)

set -uo pipefail

ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env"

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
gen_secret() {
    local length="${1:-32}"
    openssl rand -base64 48 | tr -d '/+=' | cut -c1-"${length}"
}

prompt_required() {
    local var="$1"
    local desc="$2"
    local default="${3:-}"
    local value=""
    while [[ -z "$value" ]]; do
        if [[ -n "$default" ]]; then
            printf "${CYAN}%s${RESET} [%s]: " "$desc" "$default"
        else
            printf "${CYAN}%s${RESET}: " "$desc"
        fi
        read -r value
        if [[ -z "$value" && -n "$default" ]]; then
            value="$default"
        fi
        if [[ -z "$value" ]]; then
            printf "${RED}Required. Cannot be empty.${RESET}\n"
        fi
    done
    printf -v "$var" '%s' "$value"
}

prompt_optional() {
    local var="$1"
    local desc="$2"
    printf "${CYAN}%s${RESET} (leave blank to skip): " "$desc"
    read -r value
    printf -v "$var" '%s' "${value:-}"
}

prompt_secret() {
    local var="$1"
    local desc="$2"
    local value=""
    while [[ -z "$value" ]]; do
        printf "${CYAN}%s${RESET}: " "$desc"
        read -rs value
        printf "\n"
        if [[ -z "$value" ]]; then
            printf "${RED}Required. Cannot be empty.${RESET}\n"
        fi
    done
    printf -v "$var" '%s' "$value"
}

write_env() {
    local file="$1"
    local content="$2"
    printf '%s\n' "$content" > "$file"
    chmod 600 "$file"
}

section() {
    printf "\n${BOLD}${CYAN}━━━ %s ━━━${RESET}\n\n" "$1"
}

# ─── Secret generation ────────────────────────────────────────────────────────
generate_secrets() {
    DB_PASSWORD="$(gen_secret 32)"
    MINIO_ROOT_PASSWORD="$(gen_secret 32)"
    REDIS_PASSWORD="$(gen_secret 32)"
    GRAFANA_ADMIN_PASSWORD="$(gen_secret 32)"
    BETTER_AUTH_SECRET="$(gen_secret 48)"
    WATCHTOWER_HTTP_API_TOKEN="$(gen_secret 32)"
}

# ─── Setup sections ───────────────────────────────────────────────────────────
setup_infra() {
    section "Infrastructure"

    prompt_required DOMAIN "Domain (e.g. example.com)"
    prompt_required LETSENCRYPT_EMAIL "Let's Encrypt email"
    printf "${YELLOW}Hint: generate with: htpasswd -nb admin YOUR_PASSWORD | sed -e 's/\\\$/\\\$\\\$/g'${RESET}\n"
    prompt_required TRAEFIK_DASHBOARD_CREDENTIALS "Traefik dashboard credentials (htpasswd hash)"
    prompt_required DOCKERHUB_USERNAME "Docker Hub username"
    prompt_required DOCKERHUB_TOKEN "Docker Hub access token"
    printf "${YELLOW}Hint: Shoutrrr format — discord://TOKEN@WEBHOOK_ID (not the https:// URL)${RESET}\n"
    prompt_optional WATCHTOWER_DISCORD_URL "Watchtower Discord webhook URL (discord://TOKEN@WEBHOOK_ID)"
}

setup_app() {
    section "Application"

    local default_auth_url="https://api.${DOMAIN}/api/auth"
    local default_origins="https://${DOMAIN}"

    prompt_required BETTER_AUTH_URL "Better Auth URL" "$default_auth_url"
    prompt_required BETTER_AUTH_TRUSTED_ORIGINS "Better Auth trusted origins" "$default_origins"
    prompt_required CORS_ORIGIN "CORS origin" "$default_origins"
    prompt_optional GOOGLE_CLIENT_ID "Google OAuth client ID"
    if [[ -n "${GOOGLE_CLIENT_ID:-}" ]]; then
        prompt_optional GOOGLE_CLIENT_SECRET "Google OAuth client secret"
    else
        GOOGLE_CLIENT_SECRET=""
    fi
}

setup_seeding() {
    section "Database Seeding"

    local seed_val=""
    while [[ "$seed_val" != "TRUE" && "$seed_val" != "FALSE" ]]; do
        printf "${CYAN}Seed database on first start? (TRUE/FALSE)${RESET}: "
        read -r seed_val
        seed_val="${seed_val^^}"
        if [[ "$seed_val" != "TRUE" && "$seed_val" != "FALSE" ]]; then
            printf "${RED}Must be TRUE or FALSE.${RESET}\n"
        fi
    done
    SEED="$seed_val"

    if [[ "$SEED" == "TRUE" ]]; then
        prompt_required SEED_SYSTEM_ADMIN_NAME "System admin display name" "System Admin"
        prompt_required SEED_SYSTEM_ADMIN_EMAIL "System admin email"
        prompt_secret SEED_SYSTEM_ADMIN_PASSWORD "System admin password"
    else
        SEED_SYSTEM_ADMIN_NAME="System Admin"
        SEED_SYSTEM_ADMIN_EMAIL="system-admin@local.umtas"
        SEED_SYSTEM_ADMIN_PASSWORD="DISABLED"
    fi
}

# ─── Validation ───────────────────────────────────────────────────────────────
validate_all() {
    local errors=0
    local warnings=0

    printf "\n${BOLD}Validating...${RESET}\n"

    # Required fields
    local required_vars=(
        DOMAIN LETSENCRYPT_EMAIL TRAEFIK_DASHBOARD_CREDENTIALS
        DOCKERHUB_USERNAME DOCKERHUB_TOKEN
        BETTER_AUTH_URL BETTER_AUTH_TRUSTED_ORIGINS CORS_ORIGIN
        DB_PASSWORD MINIO_ROOT_PASSWORD REDIS_PASSWORD
        GRAFANA_ADMIN_PASSWORD BETTER_AUTH_SECRET WATCHTOWER_HTTP_API_TOKEN
        SEED
    )
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            printf "${RED}  ERROR: %s is empty${RESET}\n" "$var"
            ((errors++))
        fi
    done

    # Secret length checks
    local secret_vars=(DB_PASSWORD MINIO_ROOT_PASSWORD REDIS_PASSWORD GRAFANA_ADMIN_PASSWORD WATCHTOWER_HTTP_API_TOKEN)
    for var in "${secret_vars[@]}"; do
        local val="${!var:-}"
        if [[ ${#val} -lt 16 ]]; then
            printf "${RED}  ERROR: %s too short (%d chars, need ≥16)${RESET}\n" "$var" "${#val}"
            ((errors++))
        fi
    done
    if [[ ${#BETTER_AUTH_SECRET} -lt 32 ]]; then
        printf "${RED}  ERROR: BETTER_AUTH_SECRET too short (%d chars, need ≥32)${RESET}\n" "${#BETTER_AUTH_SECRET}"
        ((errors++))
    fi

    # Domain format
    if [[ ! "${DOMAIN:-}" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]]; then
        printf "${RED}  ERROR: DOMAIN '%s' invalid format${RESET}\n" "${DOMAIN:-}"
        ((errors++))
    fi

    # Email format
    if [[ ! "${LETSENCRYPT_EMAIL:-}" =~ @ ]]; then
        printf "${RED}  ERROR: LETSENCRYPT_EMAIL '%s' missing @${RESET}\n" "${LETSENCRYPT_EMAIL:-}"
        ((errors++))
    fi

    # SEED value
    if [[ "${SEED:-}" != "TRUE" && "${SEED:-}" != "FALSE" ]]; then
        printf "${RED}  ERROR: SEED must be TRUE or FALSE, got '%s'${RESET}\n" "${SEED:-}"
        ((errors++))
    fi

    # Google OAuth partial config
    if [[ -n "${GOOGLE_CLIENT_ID:-}" && -z "${GOOGLE_CLIENT_SECRET:-}" ]]; then
        printf "${YELLOW}  WARN: GOOGLE_CLIENT_ID set but GOOGLE_CLIENT_SECRET empty — OAuth will fail${RESET}\n"
        ((warnings++))
    fi

    if [[ $errors -gt 0 ]]; then
        printf "\n${RED}${BOLD}Validation FAILED: %d error(s), %d warning(s)${RESET}\n" "$errors" "$warnings"
        return 1
    elif [[ $warnings -gt 0 ]]; then
        printf "${YELLOW}${BOLD}Validation passed with %d warning(s)${RESET}\n" "$warnings"
    else
        printf "${GREEN}${BOLD}Validation passed.${RESET}\n"
    fi
}

# ─── Build .env content ───────────────────────────────────────────────────────
build_env_content() {
    cat <<EOF
# =========================================================
# Root environment — generated by infra/init.sh
# Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')
# =========================================================

# ─── Infrastructure ───────────────────────────────────────
DOMAIN=${DOMAIN}
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}

PROJECT_NAME=umtas
DOCKER_REGISTRY=${DOCKERHUB_USERNAME}/umtas

TRAEFIK_DASHBOARD_CREDENTIALS=${TRAEFIK_DASHBOARD_CREDENTIALS}

# ─── Docker Hub ───────────────────────────────────────────
DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME}
DOCKERHUB_TOKEN=${DOCKERHUB_TOKEN}

WATCHTOWER_DISCORD_URL=${WATCHTOWER_DISCORD_URL:-}
WATCHTOWER_HTTP_API_TOKEN=${WATCHTOWER_HTTP_API_TOKEN}

# ─── Ports ────────────────────────────────────────────────
BACKEND_PORT=3000
FRONTEND_PORT=3001

# ─── Database ─────────────────────────────────────────────
DB_USER=capstone_admin
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=umtas_db
DB_MODE=DATABASE

# ─── Storage (MinIO) ──────────────────────────────────────
MINIO_ROOT_USER=storage_admin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}

# ─── Cache (Redis) ────────────────────────────────────────
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# ─── Monitoring (Grafana) ─────────────────────────────────
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}

# ─── Backend application ──────────────────────────────────
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=${BETTER_AUTH_URL}
BETTER_AUTH_TRUSTED_ORIGINS=${BETTER_AUTH_TRUSTED_ORIGINS}
CORS_ORIGIN=${CORS_ORIGIN}

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}

# ─── Seeding ──────────────────────────────────────────────
SEED=${SEED}
SEED_TASKS=default-system-admin
SEED_SYSTEM_ADMIN_NAME=${SEED_SYSTEM_ADMIN_NAME}
SEED_SYSTEM_ADMIN_EMAIL=${SEED_SYSTEM_ADMIN_EMAIL}
SEED_SYSTEM_ADMIN_PASSWORD=${SEED_SYSTEM_ADMIN_PASSWORD}
SYSTEM_ADMIN_USER_IDS=seed-system-admin
EOF
}

# ─── Print secrets table ──────────────────────────────────────────────────────
print_secrets() {
    printf "\n${BOLD}${YELLOW}━━━ GENERATED SECRETS — SAVE THESE NOW ━━━${RESET}\n\n"
    printf "  %-30s %s\n" "Variable" "Value"
    printf "  %-30s %s\n" "──────────────────────────────" "────────────────────────────────────────────────"
    printf "  %-30s %s\n" "DB_PASSWORD"                 "$DB_PASSWORD"
    printf "  %-30s %s\n" "MINIO_ROOT_PASSWORD"         "$MINIO_ROOT_PASSWORD"
    printf "  %-30s %s\n" "REDIS_PASSWORD"              "$REDIS_PASSWORD"
    printf "  %-30s %s\n" "GRAFANA_ADMIN_PASSWORD"      "$GRAFANA_ADMIN_PASSWORD"
    printf "  %-30s %s\n" "BETTER_AUTH_SECRET"          "$BETTER_AUTH_SECRET"
    printf "  %-30s %s\n" "WATCHTOWER_HTTP_API_TOKEN"   "$WATCHTOWER_HTTP_API_TOKEN"
    printf "\n${YELLOW}These values will NOT be shown again. Store them in a password manager.${RESET}\n"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
    printf "${BOLD}${CYAN}"
    printf "╔══════════════════════════════════════════╗\n"
    printf "║       UMTAS Production Server Init       ║\n"
    printf "╚══════════════════════════════════════════╝\n"
    printf "${RESET}\n"

    # Detect existing .env
    if [[ -f "$ENV_FILE" ]]; then
        printf "${YELLOW}WARNING: %s already exists.${RESET}\n" "$ENV_FILE"
        printf "Overwrite? This will destroy existing configuration. (yes/no): "
        read -r confirm
        if [[ "$confirm" != "yes" ]]; then
            printf "Aborted.\n"
            exit 0
        fi
    fi

    # Generate all secrets upfront
    generate_secrets

    # Collect prompted values
    setup_infra
    setup_app
    setup_seeding

    # Validate
    if ! validate_all; then
        printf "${RED}Aborting — fix errors above and re-run.${RESET}\n"
        exit 1
    fi

    # Write file
    local content
    content="$(build_env_content)"
    write_env "$ENV_FILE" "$content"

    printf "\n${GREEN}Written: %s (chmod 600)${RESET}\n" "$ENV_FILE"

    # Print secrets table
    print_secrets

    # Next steps
    printf "\n${BOLD}${GREEN}━━━ Next Step ━━━${RESET}\n\n"
    printf "  docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile server up -d\n\n"
}

main "$@"
