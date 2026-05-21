#!/usr/bin/env bash

set -euo pipefail

MAILSERVER_DOMAIN="${MAILSERVER_DOMAIN:-capstone-vigil.dns.net.za}"
MAILSERVER_CONTAINER="${MAILSERVER_CONTAINER:-mailserver}"

TEAM_USERS=(
  michael
  wilmar
  marcel
  johan
  aidan
)

usage() {
  cat <<EOF
Usage: $0 <provision|add-user|add-alias|list-users|status|logs>

Commands:
  provision          Add all team mailboxes and aliases
  add-user <email>   Add a single mailbox (prompts for password)
  add-alias <alias> <target>
  list-users
  status
  logs

Environment overrides:
  MAILSERVER_DOMAIN      (default: capstone-vigil.dns.net.za)
  MAILSERVER_CONTAINER   (default: mailserver)
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

exec_setup() {
  docker exec -it "$MAILSERVER_CONTAINER" setup "$@"
}

provision() {
  printf 'Adding team mailboxes for @%s\n' "$MAILSERVER_DOMAIN"
  for user in "${TEAM_USERS[@]}"; do
    printf '\n--- %s@%s ---\n' "$user" "$MAILSERVER_DOMAIN"
    exec_setup email add "${user}@${MAILSERVER_DOMAIN}"
  done

  printf '\n--- noreply@%s ---\n' "$MAILSERVER_DOMAIN"
  exec_setup email add "noreply@${MAILSERVER_DOMAIN}"

  printf '\nAdding team@ aliases\n'
  for user in "${TEAM_USERS[@]}"; do
    exec_setup alias add "team@${MAILSERVER_DOMAIN}" "${user}@${MAILSERVER_DOMAIN}"
  done

  printf '\nDone. Verify with: %s list-users\n' "$0"
}

add_user() {
  local address="${1:-}"
  [[ -n "$address" ]] || die "Usage: $0 add-user user@${MAILSERVER_DOMAIN}"
  exec_setup email add "$address"
}

add_alias() {
  local alias="${1:-}"
  local target="${2:-}"
  [[ -n "$alias" && -n "$target" ]] || die "Usage: $0 add-alias alias@${MAILSERVER_DOMAIN} target@${MAILSERVER_DOMAIN}"
  exec_setup alias add "$alias" "$target"
}

list_users() {
  exec_setup email list
}

status() {
  docker ps --filter "name=${MAILSERVER_CONTAINER}"
}

logs() {
  docker logs --tail 100 "$MAILSERVER_CONTAINER"
}

main() {
  local command="${1:-}"
  case "$command" in
    provision)
      provision
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
