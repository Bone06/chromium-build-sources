export const requireObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value
}

export const parseTimestamp = (value, label) => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp`)
  }
  return new Date(value).toISOString()
}

export const compareVersions = (left, right) => {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0)
    if (difference) return difference
  }
  return 0
}

export const selectLatest = records => {
  if (!records.length) throw new Error('No matching published release found')
  return records.reduce((latest, candidate) => {
    const versionDifference = compareVersions(candidate.version, latest.version)
    if (versionDifference > 0) return candidate
    if (versionDifference < 0) return latest
    return Date.parse(candidate.publishedAt) > Date.parse(latest.publishedAt)
      ? candidate
      : latest
  })
}

export const parseRelease = (input, { repository, tagPattern }) => {
  const release = requireObject(input, 'Release')
  if (release.draft || release.prerelease) return null
  const match = tagPattern.exec(release.tag_name)
  if (!match) return null
  const releaseUrl = new URL(release.html_url)
  const releasePrefix = `/${repository}/releases/`
  if (releaseUrl.protocol !== 'https:' || releaseUrl.hostname !== 'github.com' ||
      !releaseUrl.pathname.startsWith(releasePrefix)) {
    throw new Error(`Release URL is outside ${repository}`)
  }
  if (!Array.isArray(release.assets)) throw new Error('Release assets must be an array')
  return {
    match,
    publishedAt: parseTimestamp(release.published_at, 'published_at'),
    release,
    releasePrefix,
    releaseUrl: releaseUrl.href
  }
}

export const parseAsset = ({ label, pattern, record }) => {
  const matches = record.release.assets.filter(asset => {
    requireObject(asset, 'Release asset')
    return pattern.test(asset.name)
  })
  if (matches.length !== 1) {
    throw new Error(`${label} must match exactly one release asset`)
  }
  const asset = matches[0]
  if (!Number.isSafeInteger(asset.size) || asset.size <= 0) {
    throw new Error(`${label} has invalid size`)
  }
  const url = new URL(asset.browser_download_url)
  const expectedPrefix = `${record.releasePrefix}download/${record.release.tag_name}/`
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
      !url.pathname.startsWith(expectedPrefix) ||
      decodeURIComponent(url.pathname.split('/').at(-1)) !== asset.name) {
    throw new Error(`${label} URL is outside the allowed release`)
  }
  return { label, name: asset.name, size: asset.size, url: url.href }
}

export const createSource = ({ checkedAt, id, name, repository }) => ({
  checkedAt: parseTimestamp(checkedAt, 'checkedAt'),
  error: null,
  id,
  lastSuccessAt: parseTimestamp(checkedAt, 'checkedAt'),
  name,
  repository: `https://github.com/${repository}/`,
  stale: false
})
