import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateFeed } from './feed.js'
import { getFeedOutputPath } from './paths.js'
import { verifyFeedSignature } from './signature.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const feedPath = getFeedOutputPath({ root })
const [feedText, signatureText, publicKeyText] = await Promise.all([
  readFile(feedPath, 'utf8'),
  readFile(`${feedPath}.sig`, 'utf8'),
  readFile(resolve(root, 'keys', 'feed-public-key.json'), 'utf8')
])
const publicKey = JSON.parse(publicKeyText)

verifyFeedSignature({
  feedText,
  signatureDocument: JSON.parse(signatureText),
  trustedPublicKeys: { [publicKey.keyId]: publicKey.jwk }
})
const feed = validateFeed(JSON.parse(feedText))

console.log(
  `Verified ${feedPath}: ${feed.builds.length} builds, generated ${feed.generatedAt}.`
)

