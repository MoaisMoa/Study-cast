#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="ap-northeast-2"
ECR_REGISTRY="505853672168.dkr.ecr.ap-northeast-2.amazonaws.com"
APP_DIR="/home/ubuntu/studycast"
COMPOSE_FILE="${APP_DIR}/docker-compose.aws-ec2.yml"
LEGACY_SERVICE="studycast"

echo "=== StudyCast Docker deploy started ==="

echo "1. Login to ECR"
/usr/local/bin/aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

echo "2. Stop legacy systemd service if running"
if systemctl is-active --quiet "${LEGACY_SERVICE}"; then
  systemctl stop "${LEGACY_SERVICE}"
fi

echo "3. Pull latest Docker image"
docker compose -f "${COMPOSE_FILE}" pull

echo "4. Start backend container"
docker compose -f "${COMPOSE_FILE}" up -d

echo "5. Wait for backend"
sleep 10

echo "6. Health check"
if curl -fsS http://localhost:8080/api/main/rooms > /tmp/studycast-health-check.json; then
  echo "Health check success"
  cat /tmp/studycast-health-check.json
else
  echo "Health check failed. Rolling back to legacy systemd service."

  docker compose -f "${COMPOSE_FILE}" down || true

  if systemctl list-unit-files | grep -q "^${LEGACY_SERVICE}.service"; then
    systemctl start "${LEGACY_SERVICE}" || true
  fi

  exit 1
fi

echo "7. Disable legacy systemd service after Docker success"
systemctl disable "${LEGACY_SERVICE}" || true

echo "8. Docker status"
docker compose -f "${COMPOSE_FILE}" ps

echo "=== StudyCast Docker deploy finished ==="
