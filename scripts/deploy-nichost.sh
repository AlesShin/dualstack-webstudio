#!/usr/bin/env bash

set -euo pipefail

HOST="${HOST:-ssh.ale7551132.nichost.ru}"
USER_NAME="${USER_NAME:-ale7551132}"
REMOTE_PATH="${REMOTE_PATH:-/home/ale7551132/webstudio.ru/docs}"
SSH_PORT="${SSH_PORT:-22}"
SKIP_BUILD="${SKIP_BUILD:-0}"

SSH_COMMON_OPTS=(
  -o HostKeyAlgorithms=+ssh-rsa
  -o PubkeyAcceptedAlgorithms=+ssh-rsa
  -o StrictHostKeyChecking=accept-new
  -o PreferredAuthentications=password
  -o PubkeyAuthentication=no
)

remote_parent_dir() {
  dirname "$1"
}

remote_storage_path() {
  local remote_path="$1"
  local remote_base
  remote_base="$(basename "$remote_path")"

  case "$remote_base" in
    docs|public|public_html|www|htdocs|httpdocs)
      printf '%s/portal-data' "$(remote_parent_dir "$remote_path")"
      ;;
    *)
      printf '%s/portal-data' "$remote_path"
      ;;
  esac
}

if [[ "${SKIP_BUILD}" != "1" ]]; then
  echo "Building production files..."
  npm run build:host
else
  if [[ ! -f "dist/index.html" ]]; then
    echo "dist/index.html not found. Build first: npm run build:host"
    exit 1
  fi
  echo "Skipping build. Using existing dist/ contents."
fi

REMOTE_STORAGE_PATH="${REMOTE_STORAGE_PATH:-$(remote_storage_path "${REMOTE_PATH}")}"

echo "Preparing remote directory: ${REMOTE_PATH}"
ssh -p "${SSH_PORT}" "${SSH_COMMON_OPTS[@]}" "${USER_NAME}@${HOST}" \
  "mkdir -p '${REMOTE_PATH}/assets' '${REMOTE_STORAGE_PATH}' && rm -f '${REMOTE_PATH}/index.html' '${REMOTE_PATH}/.htaccess' && rm -rf '${REMOTE_PATH}/assets'/*"

echo "Uploading dist/* to ${USER_NAME}@${HOST}:${REMOTE_PATH}/"
scp -O -P "${SSH_PORT}" "${SSH_COMMON_OPTS[@]}" -r dist/* "${USER_NAME}@${HOST}:${REMOTE_PATH}/"

if [[ -f "dist/.htaccess" ]]; then
  echo "Uploading dist/.htaccess to ${USER_NAME}@${HOST}:${REMOTE_PATH}/.htaccess"
  scp -O -P "${SSH_PORT}" "${SSH_COMMON_OPTS[@]}" "dist/.htaccess" "${USER_NAME}@${HOST}:${REMOTE_PATH}/.htaccess"
fi

echo "Deploy complete."
