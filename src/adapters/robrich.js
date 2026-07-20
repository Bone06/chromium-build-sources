import { fetchJson } from '../http.js'
import { createSource, parseAsset, parseRelease, selectLatest } from './github.js'

const REPOSITORY = 'RobRich999/Chromium_Clang'
const TAG_PATTERN = /^v(\d+\.\d+\.\d+\.\d+)-r(\d+)-(win64)-(avx|avx2|avx512)$|^v(\d+\.\d+\.\d+\.\d+)-r(\d+)-(linux64)-(deb|rpm)-(avx|avx2)$/

export const parseRobRichReleases = (input, checkedAt) => {
  if (!Array.isArray(input)) throw new Error('GitHub releases must be an array')
  const groups = new Map()
  for (const release of input) {
    const record = parseRelease(release, { repository: REPOSITORY, tagPattern: TAG_PATTERN })
    if (!record) continue
    const windows = Boolean(record.match[1])
    const version = record.match[1] || record.match[5]
    const revision = record.match[2] || record.match[6]
    const platform = windows ? 'win64' : 'linux'
    const packageType = windows ? null : record.match[8]
    const cpu = windows ? record.match[4] : record.match[9]
    const key = [platform, packageType, cpu].filter(Boolean).join('-')
    const candidate = { ...record, cpu, key, packageType, platform, revision, version }
    groups.set(key, [...(groups.get(key) || []), candidate])
  }
  const expected = ['win64-avx', 'win64-avx2', 'win64-avx512', 'linux-deb-avx', 'linux-deb-avx2', 'linux-rpm-avx', 'linux-rpm-avx2']
  const source = createSource({ checkedAt, id: 'robrich-chromium-clang', name: REPOSITORY, repository: REPOSITORY })
  const builds = expected.map(key => {
    const latest = selectLatest(groups.get(key) || [])
    const windows = latest.platform === 'win64'
    const assets = windows
      ? [['Archive', /^chrome\.zip$/], ['Installer', /^mini_installer\.exe$/]]
      : [[latest.packageType.toUpperCase(), latest.packageType === 'deb' ? /^chromium-browser-unstable_.+_amd64\.deb$/ : /^chromium-browser-unstable-.+\.x86_64\.rpm$/]]
    const tag = windows
      ? `dev-modified-codecs-${latest.cpu}`
      : `dev-modified-codecs-${latest.cpu}-${latest.packageType}`
    return {
      architecture: 'x64', capabilities: { official: false, proprietaryCodecs: true, sync: false, widevine: true },
      channel: 'dev', downloads: assets.map(([label, pattern]) => parseAsset({ label, pattern, record: latest })),
      id: `robrich-${key}`, platform: latest.platform, publishedAt: latest.publishedAt,
      releaseUrl: latest.releaseUrl, revision: latest.revision, sourceId: source.id,
      tag, version: latest.version
    }
  })
  return { builds, source }
}

export const fetchRobRichSource = async options => parseRobRichReleases(
  await fetchJson(`https://api.github.com/repos/${REPOSITORY}/releases?per_page=30`, options),
  options?.checkedAt
)
