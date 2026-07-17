const DEFAULT_MAX_BYTES = 1024 * 1024
const DEFAULT_TIMEOUT_MS = 15_000

export const fetchJson = async (
  url,
  {
    fetchImpl = fetch,
    maxBytes = DEFAULT_MAX_BYTES,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = {}
) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${new URL(url).host}`)
    }

    const contentLength = Number(response.headers.get('content-length'))
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Response exceeds ${maxBytes} bytes`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is unavailable')
    }

    const chunks = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      received += value.byteLength
      if (received > maxBytes) {
        await reader.cancel()
        throw new Error(`Response exceeds ${maxBytes} bytes`)
      }
      chunks.push(value)
    }

    const bytes = new Uint8Array(received)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }

    try {
      return JSON.parse(new TextDecoder().decode(bytes))
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`)
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs} ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
