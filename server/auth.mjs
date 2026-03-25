import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'

const textEncoder = new TextEncoder()

export const hashPassword = (password) => {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 32)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export const verifyPassword = (password, encoded) => {
  const parts = String(encoded || '').split('$')
  if (parts.length !== 3) return false
  const salt = Buffer.from(parts[1], 'base64')
  const key = Buffer.from(parts[2], 'base64')
  const computed = scryptSync(password, salt, 32)
  return timingSafeEqual(key, computed)
}

export const signToken = async ({ secret, ttlSeconds, payload }) => {
  const key = textEncoder.encode(secret)
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(key)
}

export const verifyToken = async ({ secret, token }) => {
  const key = textEncoder.encode(secret)
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
  return payload
}

export const getBearerToken = (req) => {
  const header = req.headers?.authorization || req.headers?.Authorization
  if (!header) return null
  const value = Array.isArray(header) ? header[0] : header
  const m = String(value).match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

