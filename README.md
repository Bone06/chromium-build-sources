# Chromium Build Sources

Dependency-free Node.js aggregator for the signed Chromium build feed consumed
by Chromium Update Notifications. It normalizes independently maintained build
sources, isolates upstream failures and publishes a frozen, versioned contract.

Before changing the feed contract, read `AI_CONTEXT.md` and the canonical
cross-project contract in `INTEGRATION.md`.

## Supported sources

The current feed contains 16 builds from Hibbiki, macchrome, RobRich and the
official Google Chromium snapshot buckets. Supported platforms are Windows x64
and ARM64, macOS Intel and Apple Silicon, and Linux x64. The validated source,
tag and asset rules are documented in `SOURCE_MATRIX.md`.

## Commands

```text
npm test
npm run generate
npm run sign
npm run serve
```

The loopback server binds only to `127.0.0.1` and exposes:

```text
http://127.0.0.1:8787/versions.json
http://127.0.0.1:8787/versions.json.sig
```

`npm run generate` fetches and validates current upstream metadata, isolates
source failures, reuses only correctly signed cache data, and atomically writes
a new signed feed. `npm run sign` signs an existing validated feed without
fetching upstream sources.

## Feed contract and signing

The frozen v1 contracts are defined by:

- `schema/feed-v1.schema.json`
- `schema/feed-signature-v1.schema.json`

Incompatible changes require a new `schemaVersion`. The detached signature is
ECDSA P-256/SHA-256 in IEEE P1363 format and covers the exact feed bytes.

`npm run keygen` is a one-time operation. It creates a private key under the
Git-ignored `.secrets` directory and a distributable public key under `keys`.
Back up the private key securely and never commit or publish it. Production may
provide another private-key path through `FEED_SIGNING_PRIVATE_KEY_PATH`.

## Production host layout

The Debian host uses the non-login `chromium-feed` system account. Initialize
the production account and directories with:

```sh
sudo sh ./deploy/setup-host.sh
```

The idempotent script creates the system account when absent, but never changes
an existing account or creates, copies or replaces signing keys. Application
code is installed under `/opt/chromium-build-sources`, private runtime state
under `/var/lib/chromium-build-sources`, and the Caddy-readable feed under
`/srv/chromium-build-sources/chromium`. The complete production procedure and
systemd units are documented in `deploy/README.md`.

## Production status

The signed feed is generated hourly by a hardened systemd service and published
through an atomic release switch at
`https://bone06.ddns.net/chromium/versions.json`. Caddy cache and content
headers, restricted signing-key storage, external signature verification and
an extension-validator smoke test are complete. A sandboxed systemd monitor
checks the active signature, schema and freshness every 15 minutes. External
failure notification delivery remains to be configured.

## Documentation language

Some internal and contract documents are currently Hungarian. Translating the
complete public documentation to English is a tracked task before the project
is presented as a finished open-source release.
