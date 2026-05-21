#!/usr/bin/env bash

set -euo pipefail

MAILSERVER_ROOT="${MAILSERVER_ROOT:-/opt/mailserver}"
MAILSERVER_DOMAIN="${MAILSERVER_DOMAIN:-capstone-vigil.dns.net.za}"
MAILSERVER_HOSTNAME="${MAILSERVER_HOSTNAME:-mail.${MAILSERVER_DOMAIN}}"
MAILSERVER_POSTMASTER_ADDRESS="${MAILSERVER_POSTMASTER_ADDRESS:-postmaster@${MAILSERVER_DOMAIN}}"
MAILSERVER_NETWORK="${MAILSERVER_NETWORK:-gateway}"
MAILSERVER_CERTS_DIR="${MAILSERVER_CERTS_DIR:-/etc/letsencrypt}"
MAILSERVER_IMAGE="${MAILSERVER_IMAGE:-ghcr.io/docker-mailserver/docker-mailserver:latest}"

usage() {
  cat <<EOF
Usage: $0 <bootstrap|add-user|add-alias|list-users|status|logs>

Environment overrides:
  MAILSERVER_ROOT
  MAILSERVER_DOMAIN
  MAILSERVER_HOSTNAME
  MAILSERVER_POSTMASTER_ADDRESS
  MAILSERVER_NETWORK
  MAILSERVER_CERTS_DIR
  MAILSERVER_IMAGE
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

ensure_network() {
  docker network inspect "$MAILSERVER_NETWORK" >/dev/null 2>&1 || die "Docker network '$MAILSERVER_NETWORK' does not exist"
}

write_compose() {
  local compose_file="$MAILSERVER_ROOT/docker-compose.yml"
  cat >"$compose_file" <<EOF
version: "3.8"

services:
  mailserver:
    image: ${MAILSERVER_IMAGE}
    container_name: mailserver
    hostname: ${MAILSERVER_HOSTNAME}
    env_file: mailserver.env
    ports:
      - "25:25"
      - "465:465"
      - "587:587"
      - "993:993"
    volumes:
      - ./data/mail:/var/mail
      - ./data/mail-state:/var/mail-state
      - ./data/logs:/var/log/mail
      - ./config:/tmp/docker-mailserver
      - ${MAILSERVER_CERTS_DIR}:/etc/letsencrypt:ro
    restart: always
    stop_grace_period: 1m
    cap_add:
      - NET_ADMIN
    healthcheck:
      test: "ss --listening --tcp | grep -P 'LISTEN.+:smtp' || exit 1"
      timeout: 3s
      retries: 5
    networks:
      - traefik_network

networks:
  traefik_network:
    external: true
    name: ${MAILSERVER_NETWORK}
EOF
}

write_env() {
  local env_file="$MAILSERVER_ROOT/mailserver.env"
  cat >"$env_file" <<EOF
# General
OVERRIDE_HOSTNAME=${MAILSERVER_HOSTNAME}
DOMAINNAME=${MAILSERVER_DOMAIN}
POSTMASTER_ADDRESS=${MAILSERVER_POSTMASTER_ADDRESS}

# TLS — uses certificates managed by Traefik / Let's Encrypt
SSL_TYPE=letsencrypt

# Authentication
ENABLE_SASLAUTHD=0
PERMIT_DOCKER=network

# Postfix
POSTFIX_INET_PROTOCOLS=ipv4

# Dovecot
ENABLE_DOVECOT=1
DOVECOT_MAILBOX_FORMAT=maildir

# Spam / Virus (disable for now, enable later if needed)
ENABLE_SPAMASSASSIN=0
ENABLE_CLAMAV=0
ENABLE_FAIL2BAN=0

# Logs
LOG_LEVEL=info
EOF
}

bootstrap() {
  require_cmd docker
  require_cmd mkdir
  ensure_network

  mkdir -p \
    "$MAILSERVER_ROOT/config" \
    "$MAILSERVER_ROOT/data/mail" \
    "$MAILSERVER_ROOT/data/mail-state" \
    "$MAILSERVER_ROOT/data/logs"

  write_compose
  write_env

  cd "$MAILSERVER_ROOT"
  if docker compose version >/dev/null 2>&1; then
    docker compose up -d
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d
  else
    die "Docker Compose is not installed"
  fi

  printf 'Mailserver configured in %s\n' "$MAILSERVER_ROOT"
  printf 'Add mailboxes with:\n'
  printf '  %s setup email add user@%s\n' "docker exec -it mailserver" "$MAILSERVER_DOMAIN"
}

add_user() {
  local address="${1:-}"
  [[ -n "$address" ]] || die "Usage: $0 add-user user@${MAILSERVER_DOMAIN}"
  docker exec -it mailserver setup email add "$address"
}

add_alias() {
  local alias="${1:-}"
  local target="${2:-}"
  [[ -n "$alias" && -n "$target" ]] || die "Usage: $0 add-alias alias@${MAILSERVER_DOMAIN} target@${MAILSERVER_DOMAIN}"
  docker exec -it mailserver setup alias add "$alias" "$target"
}

list_users() {
  docker exec -it mailserver setup email list
}

status() {
  docker ps --filter name=mailserver
}

logs() {
  docker logs --tail 100 mailserver
}

main() {
  local command="${1:-}"
  case "$command" in
    bootstrap|setup|init)
      bootstrap
      ;;
    add-user)
      add_user "${2:-}"
      ;;
    add-alias)
      add_alias "${2:-}" "${3:-}"
      ;;
    list-users)
      list_users
      ;;
    status)
      status
      ;;
    logs)
      logs
      ;;
    ""|-h|--help|help)
      usage
      ;;
    *)
      die "Unknown command: $command"
      ;;
  esac
}

main "$@"
