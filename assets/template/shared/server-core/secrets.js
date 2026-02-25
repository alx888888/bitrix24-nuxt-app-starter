import crypto from 'node:crypto'

function getKey() {
  const raw = process.env.APP_SECRETS_KEY || ''
  if (!raw) throw new Error('APP_SECRETS_KEY is not configured')
  return crypto.createHash('sha256').update(raw).digest()
}

export function encryptSecret(plainText) {
  if (!plainText) return null
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptSecret(cipherText) {
  if (!cipherText) return ''
  const key = getKey()
  const buf = Buffer.from(String(cipherText), 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
