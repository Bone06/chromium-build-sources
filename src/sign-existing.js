import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateFeed } from './feed.js'
import { getFeedOutputPath } from './paths.js'
import { loadSigningMaterial, signFeed } from './signature.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const feedPath = getFeedOutputPath({ root })
const signaturePath = `${feedPath}.sig`
const temporaryPath = `${signaturePath}.tmp`
const feedText = await readFile(feedPath, 'utf8')
validateFeed(JSON.parse(feedText))
const signingMaterial = await loadSigningMaterial({
  privateKeyPath: process.env.FEED_SIGNING_PRIVATE_KEY_PATH ||
    resolve(root, '.secrets', 'feed-signing-private.pem'),
  publicKeyPath: resolve(root, 'keys', 'feed-public-key.json')
})
const signature = signFeed({ feedText, ...signingMaterial })
await writeFile(temporaryPath, `${JSON.stringify(signature, null, 2)}\n`, 'utf8')
await rename(temporaryPath, signaturePath)
console.log(`Signed ${feedPath}`)
