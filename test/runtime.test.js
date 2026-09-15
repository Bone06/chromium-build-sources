import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  assertSupportedNodeVersion,
  isSupportedNodeVersion,
  MINIMUM_NODE_VERSION
} from '../src/runtime.js'

test('runtime accepts the minimum and newer Node.js versions', () => {
  for (const version of ['24.11.0', '24.21.0', '25.0.0', '26.0.0']) {
    assert.equal(isSupportedNodeVersion(version), true)
    assert.doesNotThrow(() => assertSupportedNodeVersion(version))
  }
})

test('runtime rejects Node.js versions below the minimum', () => {
  for (const version of ['20.19.0', '23.99.99', '24.10.99']) {
    assert.equal(isSupportedNodeVersion(version), false)
    assert.throws(
      () => assertSupportedNodeVersion(version),
      new RegExp(`Node\\.js ${MINIMUM_NODE_VERSION} or newer is required`)
    )
  }
})

test('runtime rejects malformed Node.js versions', () => {
  for (const version of ['', '24', '24.11', 'v24.21.0', '24.21.0-rc.1']) {
    assert.throws(() => isSupportedNodeVersion(version), /Invalid Node\.js version/)
  }
})

test('package engine matches the enforced runtime minimum', async () => {
  const packageDocument = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  )
  assert.equal(packageDocument.engines.node, `>=${MINIMUM_NODE_VERSION}`)
})
