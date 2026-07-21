import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchHibbikiRelease } from './adapters/hibbiki-win64.js'
import { fetchGoogleSnapshot, SNAPSHOT_CONFIGS } from './adapters/google-snapshots.js'
import { fetchMacchromeSource, MACCHROME_CONFIGS } from './adapters/macchrome.js'
import { fetchRobRichSource } from './adapters/robrich.js'
import { aggregateSources } from './aggregate.js'
import { getPreviousFeed } from './previous-feed.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'dist', 'versions.json')
const temporaryOutput = `${output}.tmp`
const generatedAt = new Date().toISOString()

const previousFeed = await getPreviousFeed({
  localPath: output,
  previousFeedUrl: process.env.PREVIOUS_FEED_URL
})

const tasks = [
  {
    run: () => fetchHibbikiRelease({ checkedAt: generatedAt }),
    sourceId: 'hibbiki-chromium-win64'
  },
  ...MACCHROME_CONFIGS.map(config => ({
    run: () => fetchMacchromeSource(config, { checkedAt: generatedAt }),
    sourceId: config.id
  })),
  ...SNAPSHOT_CONFIGS.map(config => ({
    run: () => fetchGoogleSnapshot(config, { checkedAt: generatedAt }),
    sourceId: config.id
  })),
  {
    run: () => fetchRobRichSource({ checkedAt: generatedAt }),
    sourceId: 'robrich-chromium-clang'
  }
]

const { errors, feed } = await aggregateSources({ generatedAt, previousFeed, tasks })

await mkdir(dirname(output), { recursive: true })
await writeFile(temporaryOutput, `${JSON.stringify(feed, null, 2)}\n`, 'utf8')
await rename(temporaryOutput, output)

console.log(`Generated ${output} with ${feed.builds.length} build.`)
for (const failure of errors) {
  console.warn(`${failure.sourceId}: ${failure.error}`)
}
