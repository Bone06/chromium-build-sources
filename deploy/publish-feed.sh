#!/bin/sh

set -eu
umask 077

SERVICE_USER="chromium-feed"
NODE_BINARY="${NODE_BINARY:-/usr/bin/node}"
APP_DIR="/opt/chromium-build-sources"
STATE_DIR="/var/lib/chromium-build-sources"
STAGING_ROOT="${STATE_DIR}/staging"
PRIVATE_KEY="${STATE_DIR}/private/feed-signing-private.pem"
PUBLISH_ROOT="/srv/chromium-build-sources"
ACTIVE_PATH="${PUBLISH_ROOT}/chromium"
RELEASES_DIR="${PUBLISH_ROOT}/releases"

if [ "$(id -un)" != "${SERVICE_USER}" ]; then
	printf '%s\n' "This script must run as ${SERVICE_USER}." >&2
	exit 1
fi

if [ ! -L "${ACTIVE_PATH}" ]; then
	printf '%s\n' \
		"${ACTIVE_PATH} is not an atomic release symlink." \
		"Run deploy/migrate-publish-layout.sh as root first." >&2
	exit 1
fi

if [ ! -r "${PRIVATE_KEY}" ]; then
	printf '%s\n' "Signing key is not readable: ${PRIVATE_KEY}" >&2
	exit 1
fi

if [ ! -x "${NODE_BINARY}" ]; then
	printf '%s\n' "Supported Node.js executable not found: ${NODE_BINARY}" >&2
	exit 1
fi

run_dir="$(mktemp -d "${STAGING_ROOT}/publish.XXXXXX")"
pending_release=""
next_link="${PUBLISH_ROOT}/.chromium.next.$$"

cleanup() {
	rm -rf "${run_dir}"
	if [ -n "${pending_release}" ] && [ -d "${pending_release}" ]; then
		rm -rf "${pending_release}"
	fi
	rm -f "${next_link}"
}
trap cleanup EXIT HUP INT TERM

feed_path="${run_dir}/versions.json"

# Seed the private staging area with the currently trusted pair so individual
# upstream failures can reuse verified previous build records.
if [ -r "${ACTIVE_PATH}/versions.json" ] &&
	[ -r "${ACTIVE_PATH}/versions.json.sig" ]; then
	cp "${ACTIVE_PATH}/versions.json" "${feed_path}"
	cp "${ACTIVE_PATH}/versions.json.sig" "${feed_path}.sig"
fi

FEED_OUTPUT_PATH="${feed_path}" \
FEED_SIGNING_PRIVATE_KEY_PATH="${PRIVATE_KEY}" \
"${NODE_BINARY}" "${APP_DIR}/src/generate.js"

FEED_OUTPUT_PATH="${feed_path}" \
"${NODE_BINARY}" "${APP_DIR}/src/verify-existing.js"

release_name="release-$(date -u +%Y%m%dT%H%M%SZ)-$$"
pending_release="${RELEASES_DIR}/.${release_name}.pending"
release_path="${RELEASES_DIR}/${release_name}"

install -d -m 0755 "${pending_release}"
install -m 0644 "${feed_path}" "${pending_release}/versions.json"
install -m 0644 "${feed_path}.sig" "${pending_release}/versions.json.sig"
mv "${pending_release}" "${release_path}"
pending_release=""

ln -s "releases/${release_name}" "${next_link}"
mv -Tf "${next_link}" "${ACTIVE_PATH}"

printf '%s\n' "Published and activated ${release_path}."
