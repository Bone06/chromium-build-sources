import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const feedPath = resolve(root, 'dist', 'versions.json')
const host = '127.0.0.1'
const port = Number.parseInt(process.env.PORT || '8787', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' || request.url !== '/versions.json') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found\n')
    return
  }

  try {
    const body = await readFile(feedPath)
    const etag = `"${createHash('sha256').update(body).digest('hex')}"`

    if (request.headers['if-none-match'] === etag) {
      response.writeHead(304)
      response.end()
      return
    }

    response.writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Length': body.byteLength,
      'Content-Type': 'application/json; charset=utf-8',
      ETag: etag
    })
    response.end(body)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(`Feed unavailable: ${error.message}\n`)
  }
})

server.listen(port, host, () => {
  console.log(`Serving ${feedPath} at http://${host}:${port}/versions.json`)
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
