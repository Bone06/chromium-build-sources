import { fetchJson } from '../http.js'
import { createSource, parseAsset, parseRelease, selectLatest } from './github.js'

const configs = [
  {
    assets: [
      ['Archive', /^ungoogled-chromium-.+_Win64\.7z$/],
      ['Installer', /^.+_ungoogled_mini_installer\.exe$/]
    ],
    id: 'macchrome-winchrome', platform: 'win64', repository: 'macchrome/winchrome',
    tagPattern: /^v\d+\.\d+\.\d+-M(\d+\.\d+\.\d+\.\d+)-r(\d+)-Win64(?:.*)?$/
  },
  {
    assets: [['Archive', /^Chromium\.app\.ungoogled-.+\.tar\.xz$/]],
    id: 'macchrome-macstable', platform: 'mac', repository: 'macchrome/macstable',
    tagPattern: /^v\d+\.\d+\.\d+-M(\d+\.\d+\.\d+\.\d+)-r(\d+)-macOS$/
  },
  {
    assets: [['Archive', /^ungoogled-chromium_.+\.vaapi_linux\.tar\.xz$/]],
    id: 'macchrome-linchrome', platform: 'linux', repository: 'macchrome/linchrome',
    tagPattern: /^v\d+\.\d+\.\d+-M(\d+\.\d+\.\d+\.\d+)-r(\d+)-portable-ungoogled-Lin64$/
  }
]

export const parseMacchromeReleases = (input, config, checkedAt) => {
  if (!Array.isArray(input)) throw new Error('GitHub releases must be an array')
  const candidates = input.map(release => {
    const record = parseRelease(release, config)
    if (!record) return null
    return { ...record, revision: record.match[2], version: record.match[1] }
  }).filter(Boolean)
  const latest = selectLatest(candidates)
  const source = createSource({ checkedAt, id: config.id, name: config.repository, repository: config.repository })
  return {
    build: {
      architecture: 'x64', capabilities: { official: false, proprietaryCodecs: true, sync: false, widevine: true },
      channel: 'stable', downloads: config.assets.map(([label, pattern]) => parseAsset({ label, pattern, record: latest })),
      id: `${config.id}-stable-ungoogled-codecs`, platform: config.platform,
      publishedAt: latest.publishedAt, releaseUrl: latest.releaseUrl, revision: latest.revision,
      sourceId: config.id, tag: 'stable-ungoogled-codecs', version: latest.version
    },
    source
  }
}

export const fetchMacchromeSources = async options => Promise.all(configs.map(async config =>
  parseMacchromeReleases(
    await fetchJson(`https://api.github.com/repos/${config.repository}/releases?per_page=30`, options),
    config,
    options?.checkedAt
  )
))

export { configs as MACCHROME_CONFIGS }
