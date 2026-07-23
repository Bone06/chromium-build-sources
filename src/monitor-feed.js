import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyFeedFiles } from './feed-files.js'
import { getFeedHealth, parseMaxAgeSeconds } from './health.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const feedPath = process.env.PRODUCTION_FEED_PATH ||
  '/srv/chromium-build-sources/chromium/versions.json'
const maxAgeSeconds = parseMaxAgeSeconds(process.env.FEED_MAX_AGE_SECONDS)
const feed = await verifyFeedFiles({
  feedPath,
  publicKeyPath: resolve(root, 'keys', 'feed-public-key.json')
})
const health = getFeedHealth({ feed, maxAgeSeconds })

console.log(
  `Healthy signed feed: ${feed.builds.length} builds, ` +
  `generated ${health.generatedAt}, age ${health.ageSeconds} seconds.`
)

