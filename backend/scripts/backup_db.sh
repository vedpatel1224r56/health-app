#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DB_PATH="${DB_PATH:-$ROOT_DIR/database/health.db}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/database/backups}"
TS="$(date +"%Y%m%d-%H%M%S")"
OUT="$BACKUP_DIR/health-$TS.db"

mkdir -p "$BACKUP_DIR"
if [ ! -f "$DB_PATH" ]; then
  echo "Database file not found: $DB_PATH" >&2
  exit 1
fi

cp "$DB_PATH" "$OUT"
gzip -f "$OUT"
echo "Backup created: $OUT.gz"
