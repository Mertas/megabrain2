#!/bin/bash
# Первичная настройка сервера под Megabrain2 (запускать ОДИН раз от root).
# Раскладывает каталоги, bare-репо, sudoers, systemd-юнит, nginx-конфиг и скрипты деплоя.
# Файлы megabrain.service / nginx-megabrain.conf / post-receive / rollback.sh / backup.sh
# должны лежать в /tmp перед запуском (их кладёт deploy-скрипт).
set -euo pipefail

BASE=/srv/megabrain
REPO=/srv/megabrain.git
USER_NAME=gds

echo "[1/7] проверки"
id "$USER_NAME" >/dev/null || { echo "НЕТ пользователя $USER_NAME — сначала создай его"; exit 1; }
which node npm >/dev/null || { echo "нет node/npm"; exit 1; }

echo "[2/7] sqlite3 CLI (для ночных бэкапов)"
if ! which sqlite3 >/dev/null; then
  apt-get update -qq && apt-get install -y -qq sqlite3
fi

echo "[3/7] каталоги и bare-репозиторий"
mkdir -p "$BASE/releases" "$BASE/shared/data" "$BASE/backups"
[ -d "$REPO" ] || git init --bare "$REPO"

echo "[4/7] sudoers (только наш сервис)"
cat > /etc/sudoers.d/megabrain <<'EOF'
gds ALL=(root) NOPASSWD: /bin/systemctl restart megabrain, /bin/systemctl is-active megabrain
EOF
chmod 440 /etc/sudoers.d/megabrain
visudo -c

echo "[5/7] systemd-юнит + nginx"
install -m 644 /tmp/megabrain.service /etc/systemd/system/megabrain.service
systemctl daemon-reload
systemctl enable megabrain >/dev/null
install -m 644 /tmp/nginx-megabrain.conf /etc/nginx/sites-available/megabrain
ln -sfn /etc/nginx/sites-available/megabrain /etc/nginx/sites-enabled/megabrain
nginx -t
systemctl reload nginx

echo "[6/7] скрипты деплоя"
install -m 755 /tmp/post-receive "$REPO/hooks/post-receive"
install -m 755 /tmp/rollback.sh "$BASE/rollback.sh"
install -m 755 /tmp/backup.sh "$BASE/backup.sh"

echo "[7/7] владелец и права"
chown -R "$USER_NAME:$USER_NAME" "$BASE" "$REPO"
chmod 755 "$REPO/hooks/post-receive"

echo "OK: сервер подготовлен"
ls -la "$REPO/hooks/post-receive" "$BASE"
