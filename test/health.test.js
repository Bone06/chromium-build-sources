import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getFeedHealth, parseMaxAgeSeconds } from '../src/health.js'

test('feed health accepts a recent generation', () => {
  assert.deepEqual(
    getFeedHealth({
      feed: { generatedAt: '2026-07-23T08:00:00.000Z' },
      now: Date.parse('2026-07-23T08:30:00.000Z'),
      maxAgeSeconds: 3600
    }),
    {
      ageSeconds: 1800,
      generatedAt: '2026-07-23T08:00:00.000Z'
    }
  )
})

test('feed health rejects stale and implausibly future generations', () => {
  assert.throws(
    () => getFeedHealth({
      feed: { generatedAt: '2026-07-23T08:00:00.000Z' },
      now: Date.parse('2026-07-23T10:00:01.000Z'),
      maxAgeSeconds: 7200
    }),
    /Feed is stale/
  )
  assert.throws(
    () => getFeedHealth({
      feed: { generatedAt: '2026-07-23T08:06:00.000Z' },
      now: Date.parse('2026-07-23T08:00:00.000Z')
    }),
    /unexpectedly in the future/
  )
})

test('feed health validates the configured maximum age', () => {
  assert.equal(parseMaxAgeSeconds(undefined), 10800)
  assert.equal(parseMaxAgeSeconds('7200'), 7200)
  for (const value of ['', '0', '-1', '1.5', 'seconds']) {
    assert.throws(() => parseMaxAgeSeconds(value), /positive integer/)
  }
})

