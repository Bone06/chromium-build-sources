import { fetchJson, fetchText } from '../http.js'
import { createSource, parseTimestamp } from './github.js'

const BUCKET = 'chromium-browser-snapshots'
const STORAGE_ORIGIN = 'https://storage.googleapis.com'
const GITILES_ORIGIN = 'https://chromium.googlesource.com'

export const SNAPSHOT_CONFIGS = [
  { architecture: 'x64', archive: 'chrome-win.zip', installer: 'mini_installer.exe', platform: 'win64', prefix: 'Win_x64' },
  { architecture: 'arm64', archive: 'chrome-win.zip', installer: 'mini_installer.exe', platform: 'winarm64', prefix: 'Win_Arm64' },
  { architecture: 'x64', archive: 'chrome-mac.zip', platform: 'mac', prefix: 'Mac' },
  { architecture: 'arm64', archive: 'chrome-mac.zip', platform: 'macarm64', prefix: 'Mac_Arm' },
  { architecture: 'x64', archive: 'chrome-linux.zip', platform: 'linux', prefix: 'Linux_x64' }
].map(config => ({ ...config, id: `chromium-snapshot-${config.prefix.toLowerCase().replaceAll('_', '-')}` }))

const decodeXml = value => value
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'")

const element = (xml, name) => {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml)
  return match ? decodeXml(match[1]) : null
}

export const parseSnapshotListing = (xml, config, revision) => {
  if (typeof xml !== 'string' || xml.length > 1024 * 1024) {
    throw new Error('Snapshot listing is invalid or too large')
  }
  const expectedPrefix = `${config.prefix}/${revision}/`
  if (element(xml, 'Prefix') !== expectedPrefix) {
    throw new Error('Snapshot listing prefix is unexpected')
  }
  const objects = [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(match => {
    const key = element(match[1], 'Key')
    const size = Number(element(match[1], 'Size'))
    const lastModified = element(match[1], 'LastModified')
    if (!key?.startsWith(expectedPrefix) || !Number.isSafeInteger(size) || size <= 0) {
      throw new Error('Snapshot object metadata is invalid')
    }
    return { key, lastModified: parseTimestamp(lastModified, `${key}.LastModified`), size }
  })
  const byName = new Map(objects.map(object => [object.key.slice(expectedPrefix.length), object]))
  const required = [['Archive', config.archive], ...(config.installer ? [['Installer', config.installer]] : [])]
  return required.map(([label, name]) => {
    const object = byName.get(name)
    if (!object) throw new Error(`Required snapshot asset is missing: ${name}`)
    return {
      label,
      name,
      publishedAt: object.lastModified,
      size: object.size,
      url: `${STORAGE_ORIGIN}/${BUCKET}/${expectedPrefix}${name}`
    }
  })
}

export const parseSnapshotRevisions = (value, revision) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Snapshot REVISIONS must be an object')
  }
  if (value.chromium_revision !== revision || value.got_revision_cp !== `refs/heads/main@{#${revision}}` ||
      !/^[0-9a-f]{40}$/.test(value.got_revision || '')) {
    throw new Error('Snapshot REVISIONS metadata is inconsistent')
  }
  return value.got_revision
}

export const parseChromiumVersion = encoded => {
  let text
  try {
    text = Buffer.from(encoded.trim(), 'base64').toString('utf8')
  } catch {
    throw new Error('Chromium VERSION is not valid base64')
  }
  const fields = Object.fromEntries(text.trim().split(/\r?\n/).map(line => line.split('=')))
  const values = ['MAJOR', 'MINOR', 'BUILD', 'PATCH'].map(name => fields[name])
  if (values.some(value => !/^\d+$/.test(value || ''))) {
    throw new Error('Chromium VERSION fields are invalid')
  }
  return values.join('.')
}

export const fetchGoogleSnapshot = async (config, options = {}) => {
  const checkedAt = options.checkedAt || new Date().toISOString()
  const base = `${STORAGE_ORIGIN}/${BUCKET}/${config.prefix}`
  const revision = (await fetchText(`${base}/LAST_CHANGE`, options)).trim()
  if (!/^\d+$/.test(revision)) throw new Error('Snapshot LAST_CHANGE is invalid')
  const revisions = await fetchJson(`${base}/${revision}/REVISIONS`, options)
  const commit = parseSnapshotRevisions(revisions, revision)
  const version = parseChromiumVersion(await fetchText(
    `${GITILES_ORIGIN}/chromium/src/+/${commit}/chrome/VERSION?format=TEXT`,
    options
  ))
  const listingUrl = `${STORAGE_ORIGIN}/${BUCKET}/?delimiter=%2F&prefix=${encodeURIComponent(`${config.prefix}/${revision}/`)}`
  const parsedDownloads = parseSnapshotListing(
    await fetchText(listingUrl, options),
    config,
    revision
  )
  const downloads = parsedDownloads
    .map(({ publishedAt: _publishedAt, ...download }) => download)
  const publishedAt = parsedDownloads[0].publishedAt
  const source = createSource({
    checkedAt,
    id: config.id,
    name: `The Chromium Authors/${config.prefix}`,
    repositoryUrl: `${STORAGE_ORIGIN}/${BUCKET}/${config.prefix}/`
  })
  return {
    build: {
      architecture: config.architecture,
      capabilities: { official: false, proprietaryCodecs: false, sync: false, widevine: false },
      channel: 'snapshot',
      displayName: `The Chromium Authors – Snapshot – ${config.architecture === 'arm64' ? 'ARM64' : 'x64'}`,
      downloads,
      id: `${config.id}-snapshot`,
      platform: config.platform,
      publishedAt,
      releaseUrl: listingUrl,
      revision,
      sourceId: config.id,
      tag: 'chromium-authors-snapshot',
      version
    },
    source
  }
}
