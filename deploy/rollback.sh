#!/bin/bash
# Откат Megabrain2 на предыдущий релиз. Класть в /srv/megabrain/rollback.sh (chmod +x).
set -euo pipefail

BASE=/srv/megabrain
PORT=3042

cur="$(readlink -f "$BASE/current" 2>/dev/null || true)"
prev="$(ls -1dt "$BASE"/releases/*/ 2>/dev/null | sed 's:/$::' | grep -v "^${cur}$" | head -1 || true)"

if [ -z "$prev" ]; then
  echo "нет предыдущего релиза — откатывать некуда"
  exit 1
fi

echo "откатываюсь: $cur → $prev"
ln -sfn "$prev" "$BASE/current"
sudo systemctl restart megabrain

for _ in $(seq 1 15); do
  if curl -fsS --max-time 3 "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo "откат выполнен, сервис отвечает"
    exit 0
  fi
  sleep 1
done

echo "сервис не отвечает и после отката — смотрите journalctl -u megabrain -n 100"
exit 1
