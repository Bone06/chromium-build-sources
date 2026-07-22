import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateSources } from '../src/aggregate.js'
import { createFeed } from '../src/feed.js'

const firstSuccess = '2026-07-20T10:00:00.000Z'
const nextAttempt = '2026-07-20T11:00:00.000Z'

const source = id => ({
  checkedAt: firstSuccess,
  error: null,
  id,
  lastSuccessAt: firstSuccess,
  name: id,
  repository: `https://github.com/example/${id}/`,
  stale: false
})

const build = (id, sourceId, version = '150.0.0.1') => ({
  architecture: 'x64',
  capabilities: {
    official: true,
    proprietaryCodecs: false,
    sync: false,
    widevine: false
  },
  channel: 'stable',
  downloads: [{ label: 'Archive', name: 'chrome.zip', size: 1, url: 'https://github.com/example/archive.zip' }],
  id,
  platform: 'win64',
  publishedAt: firstSuccess,
  releaseUrl: 'https://github.com/example/release',
  revision: '1',
  sourceId,
  tag: 'stable',
  version
})

test('aggregation keeps failed source cache while updating successful sources', async () => {
  const previousFeed = createFeed({
    builds: [build('cached-build', 'failed-source')],
    generatedAt: firstSuccess,
    sources: [source('failed-source')]
  })
  const result = await aggregateSources({
    generatedAt: nextAttempt,
    previousFeed,
    tasks: [
      { sourceId: 'failed-source', run: async () => { throw new Error('temporary failure\nwith details') } },
      { sourceId: 'working-source', run: async () => ({ build: build('fresh-build', 'working-source', '151.0.0.1'), source: source('working-source') }) }
    ]
  })

  assert.equal(result.feed.builds.length, 2)
  const failed = result.feed.sources.find(item => item.id === 'failed-source')
  assert.equal(failed.stale, true)
  assert.equal(failed.checkedAt, nextAttempt)
  assert.equal(failed.lastSuccessAt, firstSuccess)
  assert.equal(failed.error, 'temporary failure with details')
})

test('aggregation skips a never-successful source without blocking others', async () => {
  const result = await aggregateSources({
    generatedAt: nextAttempt,
    tasks: [
      { sourceId: 'failed-source', run: async () => { throw new Error('offline') } },
      { sourceId: 'working-source', run: async () => ({ build: build('fresh-build', 'working-source'), source: source('working-source') }) }
    ]
  })
  assert.deepEqual(result.feed.sources.map(item => item.id), ['working-source'])
  assert.deepEqual(result.errors, [{ error: 'offline', sourceId: 'failed-source' }])
})

test('aggregation refuses to replace the feed when every uncached source fails', async () => {
  await assert.rejects(
    aggregateSources({
      generatedAt: nextAttempt,
      tasks: [{ sourceId: 'failed-source', run: async () => { throw new Error('offline') } }]
    }),
    /at least one source and build/
  )
})
