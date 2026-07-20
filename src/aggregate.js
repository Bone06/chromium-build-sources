import { createFeed, validateFeed } from './feed.js'

const normalizeResult = result => ({
  builds: result.builds || [result.build],
  source: result.source
})

const safeError = error => {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/[\r\n]+/g, ' ').slice(0, 500) || 'Unknown source error'
}

export const aggregateSources = async ({ generatedAt, previousFeed, tasks }) => {
  let previous = null
  try {
    if (previousFeed) previous = validateFeed(previousFeed)
  } catch {
    previous = null
  }

  const settled = await Promise.allSettled(tasks.map(task => task.run()))
  const builds = []
  const sources = []
  const errors = []

  settled.forEach((result, index) => {
    const task = tasks[index]
    if (result.status === 'fulfilled') {
      const normalized = normalizeResult(result.value)
      sources.push(normalized.source)
      builds.push(...normalized.builds)
      return
    }

    const error = safeError(result.reason)
    errors.push({ error, sourceId: task.sourceId })
    const previousSource = previous?.sources.find(source => source.id === task.sourceId)
    const previousBuilds = previous?.builds.filter(build => build.sourceId === task.sourceId) || []
    if (!previousSource || !previousBuilds.length) return
    sources.push({
      ...previousSource,
      checkedAt: new Date(generatedAt).toISOString(),
      error,
      stale: true
    })
    builds.push(...previousBuilds)
  })

  return {
    errors,
    feed: createFeed({ builds, generatedAt, sources })
  }
}
