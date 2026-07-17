# Chromium Build Sources

This project will collect Chromium build metadata from independently maintained
sources, validate and normalize it, and publish a versioned static JSON feed for
Chromium Update Notifications.

The project is intentionally separate from the browser extension. Its first
phase is source discovery and contract design; no production feed exists yet.

Before making changes, read `AI_CONTEXT.md` and the canonical cross-project
contract in `INTEGRATION.md`.

## Single-source experiment

The `experiment/single-source` branch contains a dependency-free Node.js
prototype for `Hibbiki/chromium-win64`.

```text
npm run check
npm run generate
npm run serve
```

The local server binds only to `127.0.0.1` and exposes:

```text
http://127.0.0.1:8787/versions.json
```

`npm run generate` validates the latest public GitHub release and atomically
replaces `dist/versions.json`. A failed request or validation does not overwrite
the previous feed.
