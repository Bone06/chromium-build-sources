export const MINIMUM_NODE_VERSION = '24.11.0'

const parseVersion = version => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) throw new Error(`Invalid Node.js version: ${version}`)
  return match.slice(1).map(Number)
}

export const isSupportedNodeVersion = version => {
  const current = parseVersion(version)
  const minimum = parseVersion(MINIMUM_NODE_VERSION)

  for (let index = 0; index < minimum.length; index += 1) {
    if (current[index] > minimum[index]) return true
    if (current[index] < minimum[index]) return false
  }
  return true
}

export const assertSupportedNodeVersion = (
  version = process.versions.node
) => {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(
      `Unsupported Node.js ${version}; ` +
      `Node.js ${MINIMUM_NODE_VERSION} or newer is required.`
    )
  }
}
