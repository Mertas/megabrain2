#!/bin/bash
# Ночной бэкап Megabrain2 (тариф VDSina — без бэкапов, значит бэкап наш).
# Класть в /srv/megabrain/backup.sh (chmod +x), cron: 27 4 * * * /srv/megabrain/backup.sh >> /srv/megabrain/backup.log 2>&1
set -euo pipefail

BASE=/srv/megabrain
DATA=$BASE/shared/data
OUT=$BASE/backups
KEEP_DAYS=14

mkdir -p "$OUT"
STAMP="$(date +%F_%H%M)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# .backup — безопасно на живой базе (учитывает WAL)
if [ -f "$DATA/megabrain.db" ]; then
  sqlite3 "$DATA/megabrain.db" ".backup '$TMP/megabrain.db'"
fi
[ -f "$BASE/shared/.env" ] && cp "$BASE/shared/.env" "$TMP/env.backup"

tar -czf "$OUT/megabrain-$STAMP.tar.gz" -C "$TMP" .
echo "[backup] $STAMP: $(du -h "$OUT/megabrain-$STAMP.tar.gz" | cut -f1)"

find "$OUT" -name 'megabrain-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
