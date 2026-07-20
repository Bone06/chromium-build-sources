import assert from 'node:assert/strict'
import test from 'node:test'
import { parseHibbikiReleases } from '../src/adapters/hibbiki-win64.js'
import { MACCHROME_CONFIGS, parseMacchromeReleases } from '../src/adapters/macchrome.js'
import { parseRobRichReleases } from '../src/adapters/robrich.js'

const checkedAt = '2026-07-20T12:00:00Z'
const asset = (repository, tag, name) => ({
  browser_download_url: `https://github.com/${repository}/releases/download/${tag}/${name}`,
  name,
  size: 1024
})
const release = (repository, tag, names, publishedAt = checkedAt) => ({
  assets: names.map(name => asset(repository, tag, name)),
  draft: false,
  html_url: `https://github.com/${repository}/releases/tag/${tag}`,
  prerelease: false,
  published_at: publishedAt,
  tag_name: tag
})

test('Hibbiki selects the numerically newest release instead of API order', () => {
  const olderTag = 'v149.0.1.1-r100'
  const newerTag = 'v150.0.1.1-r200'
  const names = ['chrome.7z', 'mini_installer.exe', 'policy_templates.zip']
  const result = parseHibbikiReleases([
    release('Hibbiki/chromium-win64', olderTag, names),
    release('Hibbiki/chromium-win64', newerTag, names)
  ], checkedAt)
  assert.equal(result.build.version, '150.0.1.1')
  assert.deepEqual(result.build.downloads.map(item => item.label), ['Archive', 'Installer'])
})

test('macchrome adapters recognize Windows, macOS and Linux releases', () => {
  const fixtures = [
    ['v150.7871.177-M150.0.7871.177-r1639810-Win64-2', ['150.0.7871.177-2_ungoogled_mini_installer.exe', 'ungoogled-chromium-150.0.7871.177-2_Win64.7z']],
    ['v150.7871.92-M150.0.7871.92-r1639810-macOS', ['Chromium.app.ungoogled-150.0.7871.92.tar.xz']],
    ['v150.7871.92-M150.0.7871.92-r1639810-portable-ungoogled-Lin64', ['ungoogled-chromium_150.0.7871.92_1.vaapi_linux.tar.xz']]
  ]
  for (let index = 0; index < fixtures.length; index += 1) {
    const config = MACCHROME_CONFIGS[index]
    const [tag, names] = fixtures[index]
    const result = parseMacchromeReleases([release(config.repository, tag, names)], config, checkedAt)
    assert.equal(result.build.platform, config.platform)
    assert.equal(result.build.sourceId, config.id)
    assert.equal(result.build.displayName.startsWith('Marmaduke – '), true)
  }
})

test('RobRich adapter requires and separates all seven approved variants', () => {
  const version = '151.0.7874.0'
  const revision = '1641382'
  const definitions = [
    ['win64-avx', ['chrome.zip', 'mini_installer.exe']],
    ['win64-avx2', ['chrome.zip', 'mini_installer.exe']],
    ['win64-avx512', ['chrome.zip', 'mini_installer.exe']],
    ['linux64-deb-avx', [`chromium-browser-unstable_${version}-1_amd64.deb`]],
    ['linux64-deb-avx2', [`chromium-browser-unstable_${version}-1_amd64.deb`]],
    ['linux64-rpm-avx', [`chromium-browser-unstable-${version}-1.x86_64.rpm`]],
    ['linux64-rpm-avx2', [`chromium-browser-unstable-${version}-1.x86_64.rpm`]]
  ]
  const releases = definitions.map(([variant, names]) => {
    const tag = `v${version}-r${revision}-${variant}`
    return release('RobRich999/Chromium_Clang', tag, [...names, 'unexpected.txt'])
  })
  const result = parseRobRichReleases(releases, checkedAt)
  assert.equal(result.builds.length, 7)
  assert.equal(result.builds.every(build => build.displayName.startsWith('RobRich – ')), true)
  assert.equal(result.builds.some(build => build.tag === 'robrich-dev-modified-codecs-avx512'), true)
  assert.deepEqual(
    result.builds
      .filter(build => build.platform === 'linux')
      .map(build => build.downloads[0].label),
    ['Package (deb)', 'Package (deb)', 'Package (rpm)', 'Package (rpm)']
  )
  assert.equal(result.builds.flatMap(build => build.downloads).some(item => item.name === 'unexpected.txt'), false)
})

test('RobRich adapter fails visibly when an approved variant is missing', () => {
  assert.throws(
    () => parseRobRichReleases([], checkedAt),
    /No matching published release/
  )
})
