import { test, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { ensureLoggedIn, humanClick, humanType } from './helpers/human'
import { createSimplePdfBytes } from './helpers/pdf'

test('上传PDF到MinIO并可在预览页查看（含编辑后仍可预览）', async ({ page, request, baseURL }) => {
  await ensureLoggedIn({ page, request, baseURL: String(baseURL) })
  const token = await page.evaluate(() => localStorage.getItem('token') || '')

  const pdfPath = join(process.cwd(), 'reports', 'raw', `e2e-${Date.now()}.pdf`)
  await mkdir(join(process.cwd(), 'reports', 'raw'), { recursive: true })
  const pdfBytes = createSimplePdfBytes('minio pdf preview')
  await writeFile(pdfPath, pdfBytes)

  const name0 = `UI-MINIO-${Date.now()}`
  const code0 = `UI-${Date.now()}`

  await page.goto('/spec-data/upload')
  await humanType(page, page.getByLabel('规范名称'), name0)
  await humanType(page, page.getByLabel('规范编号'), code0)

  const typeSelect = page.locator('.el-form-item').filter({ hasText: '规范类型' }).locator('.el-select')
  await humanClick(typeSelect)
  await humanClick(page.getByRole('option', { name: '国家标准' }))

  const levelSelect = page.locator('.el-form-item').filter({ hasText: '规范等级' }).locator('.el-select')
  await humanClick(levelSelect)
  await humanClick(page.getByRole('option', { name: '强制性标准' }))

  const statusSelect = page.locator('.el-form-item').filter({ hasText: '状态' }).locator('.el-select')
  await humanClick(statusSelect)
  await humanClick(page.getByRole('option', { name: '有效' }))

  const dateInput = page.locator('.el-date-editor input').first()
  await dateInput.fill('2024-01-01')

  await humanType(page, page.getByLabel('编制单位'), 'E2E-UNIT')
  await humanType(page, page.getByLabel('关键词'), 'e2e,minio,pdf')
  await humanType(page, page.getByLabel('规范描述'), 'minio pdf preview verify')

  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(pdfPath)

  const fileUploadResp = page.waitForResponse((r) => r.url().includes('/api/file/upload') && r.request().method() === 'POST')
  const specUploadResp = page.waitForResponse((r) => r.url().includes('/api/spec/upload') && r.request().method() === 'POST')
  await humanClick(page.getByRole('button', { name: '确定' }))

  const fileUploadBody = await (await fileUploadResp).json()
  expect(fileUploadBody.code).toBe(200)
  const fileObjectId = String(fileUploadBody.data?.meta?.id || '')
  expect(fileObjectId).toBeTruthy()

  const specUploadBody = await (await specUploadResp).json()
  expect(specUploadBody.code).toBe(200)
  const specId = String(specUploadBody.data?.id || '')
  expect(specId).toBeTruthy()

  const sqliteFile = join(process.cwd(), 'server', 'dev.sqlite')
  const db = new Database(sqliteFile, { readonly: true })
  const specRow = db.prepare('select id, file_object_id from specs where id = ?').get(specId) || null
  expect(specRow?.file_object_id).toBe(fileObjectId)
  const fileRow = db.prepare('select id, bucket, object_key, sha256 from file_objects where id = ? and deleted_at is null').get(fileObjectId) || null
  expect(fileRow).toBeTruthy()

  const presignRes = await request.get(`${String(baseURL)}/api/file/presign/${encodeURIComponent(fileObjectId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  await expect(presignRes).toBeOK()
  const presignBody = await presignRes.json()
  expect(presignBody.code).toBe(200)
  const url = String(presignBody.data?.url || '')
  expect(url).toContain('http')

  const pdfFetch = await request.get(url)
  await expect(pdfFetch).toBeOK()
  const pdfHead = (await pdfFetch.body()).subarray(0, 4).toString('utf8')
  expect(pdfHead).toBe('%PDF')

  const name1 = `${name0}-EDITED`
  await page.goto(`/spec-data/edit/${encodeURIComponent(specId)}`)
  await expect(page.getByText('编辑规范标准')).toBeVisible()
  await humanType(page, page.getByLabel('规范名称'), name1)
  const updateResp = page.waitForResponse((r) => r.url().includes(`/api/spec/update/${specId}`) && r.request().method() === 'POST')
  await humanClick(page.getByRole('button', { name: '保存' }))
  const updateBody = await (await updateResp).json()
  expect(updateBody.code).toBe(200)

  await page.goto(`/spec-data/preview/${encodeURIComponent(specId)}`)
  await expect(page.getByTestId('pdf-meta')).toContainText('页')
  const canvas = page.getByTestId('pdf-canvas')
  const iframe = page.getByTestId('pdf-iframe')
  await expect(canvas.or(iframe)).toBeVisible()
})

