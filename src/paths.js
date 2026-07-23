import { isAbsolute, resolve } from 'node:path'

export const getFeedOutputPath = ({ root, env = process.env }) => {
  const configuredPath = env.FEED_OUTPUT_PATH
  if (!configuredPath) return resolve(root, 'dist', 'versions.json')
  if (!isAbsolute(configuredPath)) {
    throw new Error('FEED_OUTPUT_PATH must be an absolute path')
  }
  return configuredPath
}

