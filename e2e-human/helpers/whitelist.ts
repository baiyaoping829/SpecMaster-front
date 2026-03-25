import { APIRequestContext, expect } from '@playwright/test'

export const getE2EKey = () => {
  const key = process.env.E2E_KEY || ''
  if (!key) throw new Error('E2E_KEY missing')
  return key
}

export const whitelistToken = async ({
  request,
  baseURL,
  username = 'admin',
  role = 'admin'
}: {
  request: APIRequestContext
  baseURL: string
  username?: string
  role?: string
}) => {
  const res = await request.post(`${baseURL}/api/test/whitelist/token`, {
    headers: { 'x-e2e-key': getE2EKey(), 'Content-Type': 'application/json' },
    data: { username, role }
  })
  await expect(res).toBeOK()
  const body = await res.json()
  if (body?.code !== 200) throw new Error('whitelist token failed')
  return String(body.data.token || '')
}

export const seedSpecs = async ({
  request,
  baseURL,
  count,
  token
}: {
  request: APIRequestContext
  baseURL: string
  count: number
  token: string
}) => {
  const res = await request.post(`${baseURL}/api/test/whitelist/seed/specs`, {
    headers: { 'x-e2e-key': getE2EKey(), 'Content-Type': 'application/json' },
    data: { count, token }
  })
  await expect(res).toBeOK()
  const body = await res.json()
  if (body?.code !== 200) throw new Error('seed specs failed')
  return Array.isArray(body.data?.ids) ? body.data.ids.map((x: any) => String(x)) : []
}

export const getProcessStats = async ({ request, baseURL }: { request: APIRequestContext; baseURL: string }) => {
  const res = await request.get(`${baseURL}/api/test/whitelist/process`, {
    headers: { 'x-e2e-key': getE2EKey() }
  })
  await expect(res).toBeOK()
  const body = await res.json()
  if (body?.code !== 200) throw new Error('process stats failed')
  return body.data
}

