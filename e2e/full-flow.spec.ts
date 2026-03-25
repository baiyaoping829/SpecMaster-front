import { test, expect } from '@playwright/test'

test('登录→写入→缓存→查询', async ({ page, request, baseURL }) => {
  await page.goto('/login')
  await page.getByLabel('用户名').fill('admin')
  await page.getByLabel('密码').fill('admin')
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page).toHaveURL(/\/($|#|\?)/)

  const token = await page.evaluate(() => localStorage.getItem('token') || '')
  expect(token).not.toEqual('')

  const specName = `E2E-${Date.now()}`
  const createRes = await request.post(`${baseURL}/api/spec/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: specName, code: `T-${Date.now()}`, type: 'GB', level: 1, status: 1 }
  })
  await expect(createRes).toBeOK()
  const createBody = await createRes.json()
  expect(createBody.code).toBe(200)

  await page.goto('/spec-data')
  await page.getByPlaceholder('请输入规范名称').fill(specName)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText(specName)).toBeVisible()

  const stats1 = await request.get(`${baseURL}/api/debug/cache/stats`).then((r) => r.json())
  expect(stats1.code).toBe(200)

  await page.reload()
  await page.getByPlaceholder('请输入规范名称').fill(specName)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText(specName)).toBeVisible()

  const stats2 = await request.get(`${baseURL}/api/debug/cache/stats`).then((r) => r.json())
  expect(stats2.code).toBe(200)

  if (process.env.E2E_FULL === '1') {
    expect(stats2.data.hits).toBeGreaterThan(stats1.data.hits)
  }
})

