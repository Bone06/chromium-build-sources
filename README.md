# Chromium Build Sources

This project will collect Chromium build metadata from independently maintained
sources, validate and normalize it, and publish a versioned static JSON feed for
Chromium Update Notifications.

The project is intentionally separate from the browser extension. Its first
phase is source discovery and contract design; no production feed exists yet.

Before making changes, read `AI_CONTEXT.md` and the canonical cross-project
contract in `INTEGRATION.md`.

## Multi-source migration

The `migration/multi-source` branch extends the dependency-free Node.js
prototype to the approved Hibbiki, macchrome and RobRich build sources.

```text
npm run check
npm run generate
npm run serve
```

The local server binds only to `127.0.0.1` and exposes:

```text
http://127.0.0.1:8787/versions.json
```

`npm run generate` validates recent public GitHub releases, selects the newest
Chromium version for every approved build variant and atomically replaces
`dist/versions.json`. Source failures are isolated: cached builds are retained
and marked stale, while a completely unusable generation does not overwrite the
previous feed.

The migration also supports official Chromium CI snapshots for Windows x64 and
ARM64, macOS Intel and ARM64, and Linux x64. Snapshot versions are resolved from
`LAST_CHANGE` through `REVISIONS` and Chromium's `chrome/VERSION` metadata; the
large browser archives are never downloaded during feed generation.
