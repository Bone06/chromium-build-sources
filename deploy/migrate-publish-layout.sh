#!/bin/sh

set -eu

SERVICE_USER="chromium-feed"
SERVICE_GROUP="chromium-feed"
PUBLISH_ROOT="/srv/chromium-build-sources"
ACTIVE_PATH="${PUBLISH_ROOT}/chromium"
RELEASES_DIR="${PUBLISH_ROOT}/releases"

if [ "$(id -u)" -ne 0 ]; then
	printf '%s\n' "This script must be run as root (for example: sudo $0)." >&2
	exit 1
fi

if [ -L "${ACTIVE_PATH}" ]; then
	printf '%s\n' "${ACTIVE_PATH} is already an atomic release symlink."
	exit 0
fi

if [ ! -d "${ACTIVE_PATH}" ]; then
	printf '%s\n' "Expected existing feed directory: ${ACTIVE_PATH}" >&2
	exit 1
fi

if [ ! -f "${ACTIVE_PATH}/versions.json" ] ||
	[ ! -f "${ACTIVE_PATH}/versions.json.sig" ]; then
	printf '%s\n' \
		"Refusing to migrate: the existing feed or signature is missing." >&2
	exit 1
fi

install -d -o "${SERVICE_USER}" -g "${SERVICE_GROUP}" -m 0755 "${RELEASES_DIR}"

release_name="release-bootstrap-$(date -u +%Y%m%dT%H%M%SZ)"
release_path="${RELEASES_DIR}/${release_name}"
next_link="${PUBLISH_ROOT}/.chromium.next.$$"

if [ -e "${release_path}" ]; then
	printf '%s\n' "Release path already exists: ${release_path}" >&2
	exit 1
fi

mv "${ACTIVE_PATH}" "${release_path}"
chown -R "${SERVICE_USER}:${SERVICE_GROUP}" "${release_path}"
chmod 0755 "${release_path}"
chmod 0644 "${release_path}/versions.json" "${release_path}/versions.json.sig"
ln -s "releases/${release_name}" "${next_link}"
mv -T "${next_link}" "${ACTIVE_PATH}"

printf '%s\n' \
	"Existing feed migrated to ${release_path}." \
	"Active feed link: ${ACTIVE_PATH} -> releases/${release_name}"

