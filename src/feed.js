const isObject = value =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const requireIsoTimestamp = (value, label) => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp`)
  }
}

export const validateFeed = feed => {
  if (!isObject(feed) || feed.schemaVersion !== 1) {
    throw new Error('Feed must use schemaVersion 1')
  }
  requireIsoTimestamp(feed.generatedAt, 'generatedAt')

  if (!Array.isArray(feed.sources) || !Array.isArray(feed.builds)) {
    throw new Error('Feed sources and builds must be arrays')
  }
  if (!feed.sources.length || !feed.builds.length) {
    throw new Error('Feed must contain at least one source and build')
  }

  const sourceIds = new Set()
  for (const source of feed.sources) {
    if (!isObject(source) || typeof source.id !== 'string' || !source.id) {
      throw new Error('Every source must have an id')
    }
    if (sourceIds.has(source.id)) {
      throw new Error(`Duplicate source id: ${source.id}`)
    }
    sourceIds.add(source.id)
    requireIsoTimestamp(source.checkedAt, `${source.id}.checkedAt`)
    requireIsoTimestamp(source.lastSuccessAt, `${source.id}.lastSuccessAt`)
    if (typeof source.stale !== 'boolean') {
      throw new Error(`${source.id}.stale must be boolean`)
    }
  }

  const buildIds = new Set()
  for (const build of feed.builds) {
    if (!isObject(build) || typeof build.id !== 'string' || !build.id) {
      throw new Error('Every build must have an id')
    }
    if (buildIds.has(build.id)) {
      throw new Error(`Duplicate build id: ${build.id}`)
    }
    buildIds.add(build.id)
    if (!sourceIds.has(build.sourceId)) {
      throw new Error(`Unknown source id: ${build.sourceId}`)
    }
    if (!/^\d+(?:\.\d+){3}$/.test(build.version)) {
      throw new Error(`${build.id}.version is invalid`)
    }
    requireIsoTimestamp(build.publishedAt, `${build.id}.publishedAt`)
    if (!Array.isArray(build.downloads) || !build.downloads.length) {
      throw new Error(`${build.id}.downloads must not be empty`)
    }
    for (const download of build.downloads) {
      const url = new URL(download.url)
      if (url.protocol !== 'https:') {
        throw new Error(`${build.id} has a non-HTTPS download`)
      }
    }
  }

  return feed
}

export const createFeed = ({ builds, generatedAt, sources }) =>
  validateFeed({
    builds,
    generatedAt: new Date(generatedAt).toISOString(),
    schemaVersion: 1,
    sources
  })
