import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createFeed } from '../src/feed.js'
import { getPreviousFeed } from '../src/previous-feed.js'

const feed = createFeed({
  generatedAt: '2026-07-21T12:00:00Z',
  sources: [{
    checkedAt: '2026-07-21T12:00:00Z', error: null, id: 'source',
    lastSuccessAt: '2026-07-21T12:00:00Z', name: 'Source',
    repository: 'https://example.com/repo', stale: false
  }],
  builds: [{
    architecture: 'x64', capabilities: {
      official: true, proprietaryCodecs: false, sync: false, widevine: false
    }, channel: 'stable', downloads: [{
      label: 'Archive', name: 'build.zip', size: 1,
      url: 'https://example.com/build.zip'
    }], id: 'build', platform: 'win64', publishedAt: '2026-07-21T12:00:00Z',
    releaseUrl: 'https://example.com/release', sourceId: 'source',
    tag: 'stable', version: '1.2.3.4'
  }]
})

test('getPreviousFeed prefers a valid HTTPS production feed', async () => {
  const result = await getPreviousFeed({
    localPath: join(await mkdtemp(join(tmpdir(), 'feed-')), 'missing.json'),
    previousFeedUrl: 'https://example.com/versions.json',
    fetchImpl: async () => new Response(JSON.stringify(feed))
  })
  assert.deepEqual(result, feed)
})

test('getPreviousFeed rejects an insecure production URL', async () => {
  await assert.rejects(() => getPreviousFeed({
    localPath: 'missing.json', previousFeedUrl: 'http://example.com/feed.json'
  }), /must be an HTTPS URL/)
})

test('getPreviousFeed falls back to a validated local feed', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feed-'))
  const localPath = join(directory, 'versions.json')
  await writeFile(localPath, JSON.stringify(feed))
  const result = await getPreviousFeed({
    fetchImpl: async () => new Response('{}'), localPath,
    previousFeedUrl: 'https://example.com/versions.json'
  })
  assert.deepEqual(result, feed)
})
