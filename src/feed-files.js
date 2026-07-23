import { readFile } from 'node:fs/promises'
import { validateFeed } from './feed.js'
import { verifyFeedSignature } from './signature.js'

export const verifyFeedFiles = async ({ feedPath, publicKeyPath }) => {
  const [feedText, signatureText, publicKeyText] = await Promise.all([
    readFile(feedPath, 'utf8'),
    readFile(`${feedPath}.sig`, 'utf8'),
    readFile(publicKeyPath, 'utf8')
  ])
  const publicKey = JSON.parse(publicKeyText)

  verifyFeedSignature({
    feedText,
    signatureDocument: JSON.parse(signatureText),
    trustedPublicKeys: { [publicKey.keyId]: publicKey.jwk }
  })
  return validateFeed(JSON.parse(feedText))
}

