#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost:8081/api/health}"
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
TIMEOUT="${HEALTH_TIMEOUT_SECONDS:-5}"

if curl -fsS --max-time "$TIMEOUT" "$HEALTH_URL" >/dev/null; then
  echo "OK: $HEALTH_URL"
  exit 0
fi

MSG="ALERT: health check failed for $HEALTH_URL at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "$MSG" >&2

if [ -n "$ALERT_WEBHOOK_URL" ]; then
  curl -sS -X POST "$ALERT_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$MSG\"}" >/dev/null || true
fi

exit 1
