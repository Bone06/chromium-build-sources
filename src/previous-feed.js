import { readFile } from 'node:fs/promises'
import { validateFeed } from './feed.js'
import { fetchText } from './http.js'
import { verifyFeedSignature } from './signature.js'

const parseVerifiedFeed = ({ feedText, signatureText, trustedPublicKeys }) => {
  let signatureDocument
  try { signatureDocument = JSON.parse(signatureText) } catch {
    throw new Error('Invalid feed signature JSON')
  }
  verifyFeedSignature({ feedText, signatureDocument, trustedPublicKeys })
  return validateFeed(JSON.parse(feedText))
}

export const getPreviousFeed = async ({
  localPath,
  previousFeedUrl,
  fetchImpl,
  trustedPublicKeys
}) => {
  if (previousFeedUrl) {
    const url = new URL(previousFeedUrl)
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('PREVIOUS_FEED_URL must be an HTTPS URL without credentials')
    }
    try {
      const signatureUrl = new URL(url)
      signatureUrl.pathname = `${signatureUrl.pathname}.sig`
      const [feedText, signatureText] = await Promise.all([
        fetchText(url, { fetchImpl }),
        fetchText(signatureUrl, { fetchImpl, maxBytes: 4096 })
      ])
      return parseVerifiedFeed({ feedText, signatureText, trustedPublicKeys })
    } catch (error) {
      console.warn(`Remote previous feed ignored: ${error.message}`)
    }
  }

  try {
    const [feedText, signatureText] = await Promise.all([
      readFile(localPath, 'utf8'),
      readFile(`${localPath}.sig`, 'utf8')
    ])
    return parseVerifiedFeed({ feedText, signatureText, trustedPublicKeys })
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Local previous feed ignored: ${error.message}`)
    }
    return null
  }
}
