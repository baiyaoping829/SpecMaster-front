import { test, expect } from '@playwright/test'

const loginIfNeeded = async (page) => {
  await page.goto('/login')
  const title = await page.title().catch(() => '')
  if (!String(title).includes('登录')) return
  await page.getByRole('textbox', { name: '用户名' }).fill('admin')
  await page.getByRole('textbox', { name: '密码' }).fill('admin')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/')
}

const intelligentFill = async (dialog) => {
  await dialog.locator('button').filter({ hasText: '智能填表' }).first().click()
  await dialog.page().waitForTimeout(1200)
}

const makeMinimalPdf = (text) => {
  const raw = String(text)
  const esc = raw.split('\\').join('\\\\').split('(').join('\\(').split(')').join('\\)')
  const parts = []
  parts.push('%PDF-1.4\\n')
  const offsets = [0]

  const pushObj = (s) => {
    offsets.push(parts.join('').length)
    parts.push(s)
  }

  pushObj('1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj\\n')
  pushObj('2 0 obj\\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\\nendobj\\n')
  pushObj('3 0 obj\\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\\nendobj\\n')
  pushObj('4 0 obj\\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\\nendobj\\n')
  const stream = `BT\\n/F1 18 Tf\\n72 760 Td\\n(${esc}) Tj\\nET\\n`
  pushObj(`5 0 obj\\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\\nstream\\n${stream}endstream\\nendobj\\n`)

  const xrefOffset = parts.join('').length
  parts.push('xref\\n0 6\\n')
  parts.push('0000000000 65535 f \\n')
  for (let i = 1; i <= 5; i++) {
    const off = String(offsets[i]).padStart(10, '0')
    parts.push(`${off} 00000 n \\n`)
  }
  parts.push('trailer\\n<< /Size 6 /Root 1 0 R >>\\n')
  parts.push('startxref\\n')
  parts.push(String(xrefOffset) + '\\n')
  parts.push('%%EOF\\n')
  return Buffer.from(parts.join(''), 'utf8')
}

test.describe('事故案例-事故管理（人工回放脚本）', () => {
  test('必填校验：空表单保存应提示', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
    const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
    await expect(dialog).toBeVisible()
    await dialog.locator('button').filter({ hasText: '确定' }).first().click()

    await expect(dialog.locator('.el-form-item__error').filter({ hasText: '请输入案例编号' })).toBeVisible()
    await expect(dialog.locator('.el-form-item__error').filter({ hasText: '请输入事故名称' })).toBeVisible()
    await expect(dialog.locator('.el-form-item__error').filter({ hasText: '请选择事故类型' })).toBeVisible()
    await expect(dialog.locator('.el-form-item__error').filter({ hasText: '请选择事故日期' })).toBeVisible()
    await expect(dialog.locator('.el-form-item__error').filter({ hasText: '请选择事故等级' })).toBeVisible()
    await expect(dialog.locator('.el-form-item__error').filter({ hasText: '请输入所属省份' })).toBeVisible()
  })

  test('新增-编辑-删除：核心流程可用', async ({ page }) => {
    test.skip(!process.env.E2E_FULL, '需完整后端/数据环境，默认跳过')
    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    const name = `E2E-事故-${Date.now()}`

    await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
    const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('请输入事故名称').fill(name)
    await intelligentFill(dialog)

    const caseNoInput = dialog.getByPlaceholder('允许 1-50 位数字、字母、短横线、斜杠')
    if ((await caseNoInput.inputValue().catch(() => '')) === '') {
      await caseNoInput.fill(`E2E-${Date.now()}`)
    }
    await dialog.getByPlaceholder('选择事故日期').fill('2025-01-02')

    await dialog.locator('button').filter({ hasText: '确定' }).first().click()
    await expect(dialog).toBeHidden()

    await page.getByPlaceholder('搜索事故名称、类型、责任单位').fill(name)
    await page.getByRole('button', { name: '搜索' }).click()
    const row = page.locator('tbody tr').first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: '编辑' }).click({ force: true })
    await expect(row.getByRole('button', { name: '确认' })).toBeVisible()
    const provinceInput = row.locator('input.el-input__inner:not([disabled])').filter({ hasValue: /北京/ }).first()
    await expect(provinceInput).toBeVisible()
    await provinceInput.fill('北京市-EDITED')
    await row.getByRole('button', { name: '确认' }).click()
    await expect(page.locator('.el-message__content').filter({ hasText: '保存成功' }).first()).toBeVisible()

    await row.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await expect(page.locator('tbody tr')).toHaveCount(0)
  })

  test('附件上传：仅验证 UI file-list（现状为占位上传）', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
    const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('请输入事故名称').fill(`E2E-附件-${Date.now()}`)
    await intelligentFill(dialog)
    const caseNoInput = dialog.getByPlaceholder('允许 1-50 位数字、字母、短横线、斜杠')
    if ((await caseNoInput.inputValue().catch(() => '')) === '') {
      await caseNoInput.fill(`E2E-${Date.now()}`)
    }
    await dialog.getByPlaceholder('选择事故日期').fill('2025-01-02')

    const input = dialog.locator('input[type="file"]').first()
    await input.setInputFiles({
      name: 'e2e.pdf',
      mimeType: 'application/pdf',
      buffer: makeMinimalPdf('hello')
    })

    await expect(page.getByText('e2e.pdf')).toBeVisible()
  })

  test('附件上传端到端：上传后后端返回 attachment_keys', async ({ page, request }) => {
    test.skip(!process.env.E2E_WITH_MINIO, '需要 MINIO/上传链路环境')
    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    const name = `E2E-附件E2E-${Date.now()}`

    await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
    const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('请输入事故名称').fill(name)
    await intelligentFill(dialog)
    const caseNoInput = dialog.getByPlaceholder('允许 1-50 位数字、字母、短横线、斜杠')
    if ((await caseNoInput.inputValue().catch(() => '')) === '') {
      await caseNoInput.fill(`E2E-${Date.now()}`)
    }
    await dialog.getByPlaceholder('选择事故日期').fill('2025-01-02')

    const input = dialog.locator('input[type="file"]').first()
    await input.setInputFiles({
      name: 'e2e-attachment.pdf',
      mimeType: 'application/pdf',
      buffer: makeMinimalPdf('hello attachment')
    })

    await dialog.locator('button').filter({ hasText: '确定' }).first().click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('.el-message__content').filter({ hasText: '保存成功' }).first()).toBeVisible()

    const marker = name.split('-')[2]
    await expect(page.locator('tbody tr').filter({ hasText: marker }).first()).toBeVisible()

    const listResp = await request.get('http://127.0.0.1:8001/api/v1/accidents/?page=1&size=200')
    expect(listResp.ok()).toBeTruthy()
    const body = await listResp.json()
    const items = body?.data?.items || []
    const found = items.find((x) => x.title === name)
    expect(found).toBeTruthy()
    expect(Array.isArray(found.attachment_keys)).toBeTruthy()
    expect(found.attachment_keys.length).toBeGreaterThan(0)
  })
})

