import { test, expect } from '@playwright/test'
import Database from 'better-sqlite3'
import { join } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { ensureLoggedIn, humanClick, humanType } from './helpers/human'
import { createSimplePdfBytes } from './helpers/pdf'

test('前端页面上传/编辑/删除触发落库（SQLite）', async ({ page, request, baseURL }) => {
  await ensureLoggedIn({ page, request, baseURL: String(baseURL) })

  const sqliteFile = join(process.cwd(), 'server', 'dev.sqlite')
  const db = new Database(sqliteFile, { readonly: true })

  await mkdir(join(process.cwd(), 'reports', 'raw'), { recursive: true })
  const pdfPath = join(process.cwd(), 'reports', 'raw', `e2e-ui-${Date.now()}.pdf`)
  const pdfBytes = createSimplePdfBytes('ui db verify')
  await writeFile(pdfPath, pdfBytes)

  const name0 = `UI-DB-${Date.now()}`
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
  await humanType(page, page.getByLabel('关键词'), 'e2e,ui,db')
  await humanType(page, page.getByLabel('规范描述'), 'e2e ui db verify')

  await page.locator('input[type="file"]').first().setInputFiles(pdfPath)

  const fileUploadResp = page.waitForResponse((r) => r.url().includes('/api/file/upload') && r.request().method() === 'POST')
  const uploadResp = page.waitForResponse((r) => r.url().includes('/api/spec/upload') && r.request().method() === 'POST')
  await humanClick(page.getByRole('button', { name: '确定' }))
  const fileUploadBody = await (await fileUploadResp).json()
  expect(fileUploadBody.code).toBe(200)
  const uploadRes = await uploadResp
  const uploadBody = await uploadRes.json()
  expect(uploadBody.code).toBe(200)
  const id = String(uploadBody.data.id)

  const rowAfterUpload = db.prepare('select id, name, code, version from specs where id = ?').get(id) || null
  expect(rowAfterUpload).toBeTruthy()

  const name1 = `${name0}-EDITED`
  await page.goto(`/spec-data/edit/${encodeURIComponent(id)}`)
  await expect(page.getByText('编辑规范标准')).toBeVisible()
  await humanType(page, page.getByLabel('规范名称'), name1)

  const updateResp = page.waitForResponse((r) => r.url().includes(`/api/spec/update/${id}`) && r.request().method() === 'POST')
  await humanClick(page.getByRole('button', { name: '保存' }))
  const updateRes = await updateResp
  const updateBody = await updateRes.json()
  expect(updateBody.code).toBe(200)

  const rowAfterEdit = db.prepare('select id, name, version from specs where id = ?').get(id) || null
  expect(rowAfterEdit?.name).toBe(name1)
  expect(Number(rowAfterEdit?.version)).toBe(Number(rowAfterUpload?.version) + 1)

  await page.goto('/spec-data')
  await humanType(page, page.getByPlaceholder('请输入规范名称'), name1)
  await humanClick(page.getByRole('button', { name: '搜索' }))
  await expect(page.getByText(name1)).toBeVisible()

  await humanClick(page.locator('.el-table__body-wrapper .el-checkbox').first())
  await expect(page.getByRole('button', { name: '删除规范' })).toBeEnabled()

  const delResp = page.waitForResponse((r) => r.url().includes('/api/specifications') && r.request().method() === 'DELETE')
  await humanClick(page.getByRole('button', { name: '删除规范' }))
  await humanClick(page.locator('.el-message-box').getByRole('button', { name: '删除', exact: true }))
  const delRes = await delResp
  const delBody = await delRes.json()
  expect(delBody.code).toBe(200)
  expect(Array.isArray(delBody.data.successIds)).toBeTruthy()

  const rowAfterDelete = db.prepare('select id, name, version from specs where id = ?').get(id) || null
  expect(rowAfterDelete).toBeNull()

  const report = {
    ok: true,
    sqliteFile,
    id,
    upload: { name: name0, code: code0, rowAfterUpload },
    edit: { name: name1, rowAfterEdit },
    delete: { successIds: delBody.data.successIds, rowAfterDelete }
  }

  await mkdir(join(process.cwd(), 'reports', 'raw'), { recursive: true })
  await writeFile(join(process.cwd(), 'reports', 'raw', 'ui-db-verify.json'), JSON.stringify(report, null, 2), 'utf8')
})

