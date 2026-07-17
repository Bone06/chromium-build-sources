import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchHibbikiRelease } from './adapters/hibbiki-win64.js'
import { createFeed } from './feed.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'dist', 'versions.json')
const temporaryOutput = `${output}.tmp`
const generatedAt = new Date().toISOString()

const { build, source } = await fetchHibbikiRelease({ checkedAt: generatedAt })
const feed = createFeed({
  builds: [build],
  generatedAt,
  sources: [source]
})

await mkdir(dirname(output), { recursive: true })
await writeFile(temporaryOutput, `${JSON.stringify(feed, null, 2)}\n`, 'utf8')
await rename(temporaryOutput, output)

console.log(`Generated ${output} with ${feed.builds.length} build.`)
