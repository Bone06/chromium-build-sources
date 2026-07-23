const DEFAULT_MAX_AGE_SECONDS = 3 * 60 * 60
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000

export const parseMaxAgeSeconds = value => {
  if (value === undefined) return DEFAULT_MAX_AGE_SECONDS
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error('FEED_MAX_AGE_SECONDS must be a positive integer')
  }
  return Number(value)
}

export const getFeedHealth = ({
  feed,
  now = Date.now(),
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS
}) => {
  const generatedAt = Date.parse(feed.generatedAt)
  if (!Number.isFinite(generatedAt)) throw new Error('Invalid feed generatedAt')

  const ageMs = now - generatedAt
  if (ageMs < -MAX_FUTURE_SKEW_MS) {
    throw new Error('Feed generatedAt is unexpectedly in the future')
  }
  if (ageMs > maxAgeSeconds * 1000) {
    throw new Error(
      `Feed is stale: generated ${Math.floor(ageMs / 1000)} seconds ago`
    )
  }

  return {
    ageSeconds: Math.max(0, Math.floor(ageMs / 1000)),
    generatedAt: feed.generatedAt
  }
}

