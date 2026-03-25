import { test, expect } from '@playwright/test'

test('文件上传→元数据入库→预签名下载', async ({ page, request, baseURL }) => {
  test.skip(process.env.E2E_FULL !== '1', 'requires MINIO+REDIS in env')

  await page.goto('/login')
  await page.getByLabel('用户名').fill('admin')
  await page.getByLabel('密码').fill('admin')
  await page.getByRole('button', { name: '登录' }).click()
  const token = await page.evaluate(() => localStorage.getItem('token') || '')
  expect(token).not.toEqual('')

  const content = Buffer.from('hello specmaster')
  const uploadRes = await request.post(`${baseURL}/api/file/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      file: {
        name: 'hello.txt',
        mimeType: 'text/plain',
        buffer: content
      }
    }
  })
  await expect(uploadRes).toBeOK()
  const uploadBody = await uploadRes.json()
  expect(uploadBody.code).toBe(200)
  expect(uploadBody.data.meta.sha256).toMatch(/^[a-f0-9]{64}$/)
  expect(String(uploadBody.data.url)).toContain('http')

  const listRes = await request.get(`${baseURL}/api/file/list?page=1&pageSize=20`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  await expect(listRes).toBeOK()
  const listBody = await listRes.json()
  expect(listBody.code).toBe(200)
  expect(Array.isArray(listBody.data.items)).toBeTruthy()
})

