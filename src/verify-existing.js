import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyFeedFiles } from './feed-files.js'
import { getFeedOutputPath } from './paths.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const feedPath = getFeedOutputPath({ root })
const feed = await verifyFeedFiles({
  feedPath,
  publicKeyPath: resolve(root, 'keys', 'feed-public-key.json')
})

console.log(
  `Verified ${feedPath}: ${feed.builds.length} builds, generated ${feed.generatedAt}.`
)
