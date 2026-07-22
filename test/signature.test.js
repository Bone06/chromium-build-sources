import assert from 'node:assert/strict'
import {
  createPublicKey,
  generateKeyPairSync,
  verify,
  webcrypto
} from 'node:crypto'
import test from 'node:test'
import { signFeed, validateSignatureDocument } from '../src/signature.js'

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
  publicKeyEncoding: { format: 'jwk' }
})

test('signFeed creates a browser-compatible detached P-256 signature', async () => {
  const feedText = '{"schemaVersion":1}\n'
  const document = signFeed({
    feedText, keyId: 'test-key', privateKey, publicJwk: publicKey
  })
  assert.equal(document.algorithm, 'ECDSA-P256-SHA256')
  assert.equal(document.signature.length, 86)
  const verificationKey = createPublicKey({ format: 'jwk', key: publicKey })
  assert.equal(verify('sha256', Buffer.from(feedText), {
    dsaEncoding: 'ieee-p1363',
    key: verificationKey
  }, Buffer.from(document.signature, 'base64url')), true)
  assert.equal(verify('sha256', Buffer.from(`${feedText} `), {
    dsaEncoding: 'ieee-p1363',
    key: verificationKey
  }, Buffer.from(document.signature, 'base64url')), false)
  const webKey = await webcrypto.subtle.importKey(
    'jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
  )
  assert.equal(await webcrypto.subtle.verify(
    { hash: 'SHA-256', name: 'ECDSA' },
    webKey,
    Buffer.from(document.signature, 'base64url'),
    new TextEncoder().encode(feedText)
  ), true)
})

test('signature document rejects unknown fields and malformed values', () => {
  assert.throws(() => validateSignatureDocument({
    algorithm: 'ECDSA-P256-SHA256', extra: true, keyId: 'test',
    schemaVersion: 1, signature: 'a'.repeat(86)
  }), /Invalid feed signature document/)
})
