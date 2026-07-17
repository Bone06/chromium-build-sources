import assert from 'node:assert/strict'
import test from 'node:test'
import { parseHibbikiRelease } from '../src/adapters/hibbiki-win64.js'
import { createFeed, validateFeed } from '../src/feed.js'

const tag = 'v150.0.7871.125-r1639810'
const release = {
  assets: [
    ['chrome.7z', 429635541],
    ['mini_installer.exe', 117995520],
    ['policy_templates.zip', 118586535]
  ].map(([name, size]) => ({
    browser_download_url:
      `https://github.com/Hibbiki/chromium-win64/releases/download/${tag}/${name}`,
    name,
    size,
    state: 'uploaded'
  })),
  draft: false,
  html_url: `https://github.com/Hibbiki/chromium-win64/releases/tag/${tag}`,
  prerelease: false,
  published_at: '2026-07-15T12:59:00Z',
  tag_name: tag
}

test('Hibbiki adapter normalizes a release into source and build records', () => {
  const result = parseHibbikiRelease(release, '2026-07-17T12:00:00Z')

  assert.equal(result.build.platform, 'win64')
  assert.equal(result.build.tag, 'stable-codecs-sync')
  assert.equal(result.build.version, '150.0.7871.125')
  assert.equal(result.build.revision, '1639810')
  assert.deepEqual(
    result.build.downloads.map(({ name }) => name),
    ['chrome.7z', 'mini_installer.exe']
  )
  assert.equal(
    result.build.downloads.some(({ name }) => name === 'policy_templates.zip'),
    false
  )
  assert.equal(result.source.stale, false)
})

test('Hibbiki adapter rejects unexpected tags and incomplete releases', () => {
  assert.throws(
    () => parseHibbikiRelease({ ...release, tag_name: 'latest' }),
    /tag does not match/
  )
  assert.throws(
    () => parseHibbikiRelease({ ...release, assets: release.assets.slice(1) }),
    /chrome\.7z/
  )
})

test('Hibbiki adapter rejects unsafe repository and download URLs', () => {
  assert.throws(
    () => parseHibbikiRelease({ ...release, html_url: 'https://example.test/release' }),
    /outside the allowed repository/
  )

  const assets = structuredClone(release.assets)
  assets[0].browser_download_url = 'https://example.test/chrome.7z'
  assert.throws(
    () => parseHibbikiRelease({ ...release, assets }),
    /outside the allowed release/
  )
})

test('feed creation validates source references and versions', () => {
  const { build, source } = parseHibbikiRelease(
    release,
    '2026-07-17T12:00:00Z'
  )
  const feed = createFeed({
    builds: [build],
    generatedAt: '2026-07-17T12:00:00Z',
    sources: [source]
  })

  assert.equal(validateFeed(feed), feed)
  assert.throws(
    () => validateFeed({ ...feed, builds: [{ ...build, sourceId: 'unknown' }] }),
    /Unknown source id/
  )
  assert.throws(
    () => validateFeed({ ...feed, builds: [{ ...build, version: '150' }] }),
    /version is invalid/
  )
})
