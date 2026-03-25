import { Page, expect } from '@playwright/test'

export const humanType = async (page: Page, locator: any, text: string) => {
  await locator.click({ clickCount: 3 })
  await locator.type(text, { delay: 25 })
}

export const humanClick = async (locator: any) => {
  await locator.scrollIntoViewIfNeeded()
  await locator.click()
}

export const ensureLoggedIn = async ({
  page,
  request,
  baseURL
}: {
  page: Page
  request: any
  baseURL: string
}) => {
  await page.goto('/login')
  await humanType(page, page.getByLabel('用户名'), 'admin')
  await humanType(page, page.getByLabel('密码'), 'admin')
  await humanClick(page.locator('.login-card').getByRole('button', { name: '登录', exact: true }))

  const token = await page.evaluate(() => localStorage.getItem('token') || '')
  if (token) return token

  const res = await request.post(`${baseURL}/api/test/whitelist/token`, {
    headers: { 'x-e2e-key': process.env.E2E_KEY || '', 'Content-Type': 'application/json' },
    data: { username: 'admin', role: 'admin' }
  })
  await expect(res).toBeOK()
  const body = await res.json()
  const token2 = String(body?.data?.token || '')
  await page.addInitScript((t) => localStorage.setItem('token', t), token2)
  await page.goto('/')
  return token2
}

