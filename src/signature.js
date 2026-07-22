import { createPublicKey, sign, verify } from 'node:crypto'
import { readFile } from 'node:fs/promises'

export const SIGNATURE_ALGORITHM = 'ECDSA-P256-SHA256'

export const validateSignatureDocument = document => {
  if (
    !document || typeof document !== 'object' || Array.isArray(document) ||
    Object.keys(document).sort().join(',') !==
      'algorithm,keyId,schemaVersion,signature' ||
    document.schemaVersion !== 1 ||
    document.algorithm !== SIGNATURE_ALGORITHM ||
    !/^[a-z0-9]+(?:[a-z0-9_-]*[a-z0-9])?$/.test(document.keyId || '') ||
    !/^[A-Za-z0-9_-]{86}$/.test(document.signature || '')
  ) throw new Error('Invalid feed signature document')
  return document
}

const validatePublicKeyConfiguration = publicKey => {
  if (
    publicKey?.algorithm !== SIGNATURE_ALGORITHM ||
    typeof publicKey.keyId !== 'string' ||
    publicKey.jwk?.kty !== 'EC' || publicKey.jwk?.crv !== 'P-256' ||
    typeof publicKey.jwk.x !== 'string' || typeof publicKey.jwk.y !== 'string'
  ) throw new Error('Invalid feed public key configuration')
  return publicKey
}

export const verifyFeedSignature = ({
  feedText,
  signatureDocument,
  trustedPublicKeys
}) => {
  const document = validateSignatureDocument(signatureDocument)
  const publicJwk = trustedPublicKeys?.[document.keyId]
  if (!publicJwk) throw new Error(`Untrusted feed signing key: ${document.keyId}`)
  const publicKey = createPublicKey({ format: 'jwk', key: publicJwk })
  if (!verify('sha256', Buffer.from(feedText), {
    dsaEncoding: 'ieee-p1363', key: publicKey
  }, Buffer.from(document.signature, 'base64url'))) {
    throw new Error('Feed signature verification failed')
  }
  return true
}

export const signFeed = ({ feedText, keyId, privateKey, publicJwk }) => {
  const signature = sign('sha256', Buffer.from(feedText), {
    dsaEncoding: 'ieee-p1363',
    key: privateKey
  })
  const publicKey = createPublicKey({ format: 'jwk', key: publicJwk })
  if (!verify('sha256', Buffer.from(feedText), {
    dsaEncoding: 'ieee-p1363', key: publicKey
  }, signature)) throw new Error('Signing key does not match the configured public key')

  return validateSignatureDocument({
    algorithm: SIGNATURE_ALGORITHM,
    keyId,
    schemaVersion: 1,
    signature: signature.toString('base64url')
  })
}

export const loadSigningMaterial = async ({ privateKeyPath, publicKeyPath }) => {
  const [privateKey, publicKeyText] = await Promise.all([
    readFile(privateKeyPath, 'utf8'),
    readFile(publicKeyPath, 'utf8')
  ])
  const publicKey = validatePublicKeyConfiguration(JSON.parse(publicKeyText))
  return {
    algorithm: publicKey.algorithm,
    keyId: publicKey.keyId,
    privateKey,
    publicJwk: publicKey.jwk
  }
}
