#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DB_PATH="${DB_PATH:-$ROOT_DIR/database/health.db}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/database/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TS="$(date +"%Y%m%d-%H%M%S")"
OUT="$BACKUP_DIR/health-$TS.db"
LATEST_LINK="$BACKUP_DIR/latest.db.gz"

mkdir -p "$BACKUP_DIR"
if [ ! -f "$DB_PATH" ]; then
  echo "Database file not found: $DB_PATH" >&2
  exit 1
fi

cp "$DB_PATH" "$OUT"
gzip -f "$OUT"
ln -sf "$(basename "$OUT.gz")" "$LATEST_LINK"

find "$BACKUP_DIR" -type f -name "health-*.db.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete || true

echo "Backup created: $OUT.gz"
echo "Latest symlink: $LATEST_LINK"
echo "Retention days: $BACKUP_RETENTION_DAYS"
