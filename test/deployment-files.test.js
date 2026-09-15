import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const deploymentFiles = [
  'chromium-build-sources-health.service',
  'chromium-build-sources-health.timer',
  'chromium-build-sources.service',
  'chromium-build-sources.timer',
  'migrate-publish-layout.sh',
  'publish-feed.sh',
  'setup-host.sh'
]

test('deployment files use Unix line endings', async () => {
  for (const name of deploymentFiles) {
    const content = await readFile(new URL(`../deploy/${name}`, import.meta.url))
    assert.equal(content.includes(13), false, `${name} contains a CR byte`)
  }
})
