import { test, expect } from '@playwright/test'

const login = async (page: any) => {
  await page.goto('/login')
  await page.getByLabel('用户名').fill('admin')
  await page.getByLabel('密码').fill('admin')
  await page.getByRole('button', { name: '登录' }).click()
  const token = await page.evaluate(() => localStorage.getItem('token') || '')
  expect(token).not.toEqual('')
  return token
}

test('事务回滚后数据不可见', async ({ page, request, baseURL }) => {
  const token = await login(page)

  const code = `RB-${Date.now()}`
  const rollbackRes = await request.post(`${baseURL}/api/debug/tx/rollback`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: `Rollback-${Date.now()}`, code }
  })
  await expect(rollbackRes).toBeOK()
  const rollbackBody = await rollbackRes.json()
  expect(rollbackBody.code).toBe(200)

  const listRes = await request.get(`${baseURL}/api/spec/list?code=${encodeURIComponent(code)}`)
  await expect(listRes).toBeOK()
  const listBody = await listRes.json()
  expect(listBody.code).toBe(200)
  expect(listBody.data.total).toBe(0)
})

test('并发写同一记录触发乐观锁冲突', async ({ page, request, baseURL }) => {
  const token = await login(page)

  const specName = `Lock-${Date.now()}`
  const createRes = await request.post(`${baseURL}/api/spec/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: specName, code: `L-${Date.now()}`, type: 'GB', level: 1, status: 1 }
  })
  const created = await createRes.json()
  const id = String(created.data.id)

  const detailRes = await request.get(`${baseURL}/api/spec/detail/${id}`)
  const detailBody = await detailRes.json()
  const version = Number(detailBody.data.version || 0)

  const update1 = request.post(`${baseURL}/api/spec/update/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { version, patch: { name: `${specName}-1` } }
  })
  const update2 = request.post(`${baseURL}/api/spec/update/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { version, patch: { name: `${specName}-2` } }
  })

  const [r1, r2] = await Promise.all([update1, update2])
  const b1 = await r1.json()
  const b2 = await r2.json()

  const codes = [b1.code, b2.code].sort()
  expect(codes).toEqual([200, 409])
})

