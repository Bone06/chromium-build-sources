import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { getFeedOutputPath } from '../src/paths.js'

test('feed output defaults to the repository dist directory', () => {
  const root = resolve('test-repository')
  assert.equal(
    getFeedOutputPath({ root, env: {} }),
    resolve(root, 'dist', 'versions.json')
  )
})

test('feed output accepts an absolute production staging path', () => {
  const output = resolve('test-state', 'feed.json')
  assert.equal(
    getFeedOutputPath({
      root: resolve('test-repository'),
      env: { FEED_OUTPUT_PATH: output }
    }),
    output
  )
})

test('feed output rejects relative configured paths', () => {
  assert.throws(
    () => getFeedOutputPath({
      root: resolve('test-repository'),
      env: { FEED_OUTPUT_PATH: 'staging/versions.json' }
    }),
    /FEED_OUTPUT_PATH must be an absolute path/
  )
})
