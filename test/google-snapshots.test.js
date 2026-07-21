import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchGoogleSnapshot,
  parseChromiumVersion,
  parseSnapshotListing,
  parseSnapshotRevisions,
  SNAPSHOT_CONFIGS
} from '../src/adapters/google-snapshots.js'

const config = SNAPSHOT_CONFIGS.find(item => item.prefix === 'Win_x64')
const revision = '1665181'
const listing = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Prefix>Win_x64/1665181/</Prefix>
  <Contents><Key>Win_x64/1665181/chrome-win.zip</Key><LastModified>2026-07-21T05:57:45.892Z</LastModified><Size>343778502</Size></Contents>
  <Contents><Key>Win_x64/1665181/mini_installer.exe</Key><LastModified>2026-07-21T06:02:09.545Z</LastModified><Size>168414720</Size></Contents>
  <Contents><Key>Win_x64/1665181/content-shell.zip</Key><LastModified>2026-07-21T06:01:14.756Z</LastModified><Size>105352430</Size></Contents>
</ListBucketResult>`

test('snapshot metadata resolves a commit position and Chromium version', () => {
  assert.equal(
    parseSnapshotRevisions({
      chromium_revision: revision,
      got_revision: 'c41468295a2e7aa7664fd20fa7515c0fae5f93df',
      got_revision_cp: `refs/heads/main@{#${revision}}`
    }, revision),
    'c41468295a2e7aa7664fd20fa7515c0fae5f93df'
  )
  const encoded = Buffer.from('MAJOR=152\nMINOR=0\nBUILD=7964\nPATCH=0\n').toString('base64')
  assert.equal(parseChromiumVersion(encoded), '152.0.7964.0')
})

test('snapshot listing publishes only approved browser assets', () => {
  const downloads = parseSnapshotListing(listing, config, revision)
  assert.deepEqual(downloads.map(item => item.label), ['Archive', 'Installer'])
  assert.equal(downloads.some(item => item.name === 'content-shell.zip'), false)
  assert.equal(downloads.every(item => item.url.startsWith('https://storage.googleapis.com/')), true)
})

test('snapshot parsers reject inconsistent metadata and missing assets', () => {
  assert.throws(
    () => parseSnapshotRevisions({ chromium_revision: revision, got_revision: 'bad' }, revision),
    /inconsistent/
  )
  assert.throws(
    () => parseSnapshotListing(listing.replace('mini_installer.exe', 'driver.zip'), config, revision),
    /mini_installer\.exe/
  )
  assert.throws(
    () => parseSnapshotListing(listing.replaceAll('Win_x64', 'Android'), config, revision),
    /prefix is unexpected/
  )
})

test('snapshot adapter resolves metadata without downloading build archives', async () => {
  const requests = []
  const commit = 'c41468295a2e7aa7664fd20fa7515c0fae5f93df'
  const encoded = Buffer.from('MAJOR=152\nMINOR=0\nBUILD=7964\nPATCH=0\n').toString('base64')
  const fetchImpl = async url => {
    requests.push(url)
    if (url.endsWith('/LAST_CHANGE')) return new Response(revision)
    if (url.endsWith('/REVISIONS')) {
      return Response.json({
        chromium_revision: revision,
        got_revision: commit,
        got_revision_cp: `refs/heads/main@{#${revision}}`
      })
    }
    if (url.includes('/chrome/VERSION')) return new Response(encoded)
    if (url.includes('prefix=')) return new Response(listing)
    throw new Error(`Unexpected URL: ${url}`)
  }

  const result = await fetchGoogleSnapshot(config, {
    checkedAt: '2026-07-21T08:00:00Z',
    fetchImpl
  })
  assert.equal(result.build.version, '152.0.7964.0')
  assert.equal(result.build.revision, revision)
  assert.equal(result.build.platform, 'win64')
  assert.equal(result.source.repository, 'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/')
  assert.equal(requests.length, 4)
  assert.equal(requests.some(url => url.endsWith('.zip') || url.endsWith('.exe')), false)
})
