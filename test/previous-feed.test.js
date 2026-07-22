import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createFeed } from '../src/feed.js'
import { getPreviousFeed } from '../src/previous-feed.js'
import { signFeed } from '../src/signature.js'

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
const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
  publicKeyEncoding: { format: 'jwk' }
})
const keyId = 'cache-test-key'
const trustedPublicKeys = { [keyId]: publicKey }
const feedText = JSON.stringify(feed)
const signatureText = JSON.stringify(signFeed({
  feedText, keyId, privateKey, publicJwk: publicKey
}))

const signedFetch = async url => new Response(
  String(url).endsWith('.sig') ? signatureText : feedText
)

const writeSignedFeed = async (localPath, text = feedText) => {
  await Promise.all([
    writeFile(localPath, text),
    writeFile(`${localPath}.sig`, signatureText)
  ])
}

test('getPreviousFeed prefers a valid HTTPS production feed', async () => {
  const result = await getPreviousFeed({
    localPath: join(await mkdtemp(join(tmpdir(), 'feed-')), 'missing.json'),
    previousFeedUrl: 'https://example.com/versions.json',
    fetchImpl: signedFetch,
    trustedPublicKeys
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
  await writeSignedFeed(localPath)
  const result = await getPreviousFeed({
    fetchImpl: async url => new Response(
      String(url).endsWith('.sig') ? 'not-json' : '{}'
    ),
    localPath,
    previousFeedUrl: 'https://example.com/versions.json',
    trustedPublicKeys
  })
  assert.deepEqual(result, feed)
})

test('getPreviousFeed rejects a modified local feed with an old signature', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feed-'))
  const localPath = join(directory, 'versions.json')
  await writeSignedFeed(localPath, `${feedText} `)
  assert.equal(await getPreviousFeed({ localPath, trustedPublicKeys }), null)
})

test('getPreviousFeed rejects missing signatures and unknown keys', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'feed-'))
  const localPath = join(directory, 'versions.json')
  await writeFile(localPath, feedText)
  assert.equal(await getPreviousFeed({ localPath, trustedPublicKeys }), null)

  const unknownSignature = JSON.stringify(signFeed({
    feedText, keyId: 'unknown-key', privateKey, publicJwk: publicKey
  }))
  assert.equal(await getPreviousFeed({
    fetchImpl: async url => new Response(
      String(url).endsWith('.sig') ? unknownSignature : feedText
    ),
    localPath: join(directory, 'missing.json'),
    previousFeedUrl: 'https://example.com/versions.json',
    trustedPublicKeys
  }), null)
})
