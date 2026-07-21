import { readFile } from 'node:fs/promises'
import { validateFeed } from './feed.js'
import { fetchJson } from './http.js'

export const getPreviousFeed = async ({
  localPath,
  previousFeedUrl,
  fetchImpl
}) => {
  if (previousFeedUrl) {
    const url = new URL(previousFeedUrl)
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('PREVIOUS_FEED_URL must be an HTTPS URL without credentials')
    }
    try {
      return validateFeed(await fetchJson(url, { fetchImpl }))
    } catch (error) {
      console.warn(`Remote previous feed ignored: ${error.message}`)
    }
  }

  try {
    return validateFeed(JSON.parse(await readFile(localPath, 'utf8')))
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Local previous feed ignored: ${error.message}`)
    }
    return null
  }
}
