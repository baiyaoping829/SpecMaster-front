import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

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

test.describe('事故案例采集数据导入（前端交互模拟）', () => {
  test('批量导入采集 JSON（含PDF附件上传）', async ({ page }) => {
    const dir = process.env.E2E_IMPORT_DIR || 'tools/accident_collector/output/frontend'
    const limit = Number(process.env.E2E_IMPORT_LIMIT || '10')
    const absDir = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
    const files = fs
      .readdirSync(absDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .slice(0, limit)

    expect(files.length).toBeGreaterThan(0)

    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    for (const f of files) {
      const raw = fs.readFileSync(path.join(absDir, f), 'utf-8')
      const payload = JSON.parse(raw)

      await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
      const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
      await expect(dialog).toBeVisible()

      await dialog.getByPlaceholder('请输入事故名称').fill(String(payload.title || ''))
      await intelligentFill(dialog)
      await dialog.getByPlaceholder('选择事故日期').fill(String(payload?.content?.date || '2020-01-01'))

      const atts = payload.attachments || []
      const pdf = atts.find((a) => a.kind === 'report_pdf' && a.local_path)
      if (pdf?.local_path && fs.existsSync(pdf.local_path)) {
        const input = dialog.locator('input[type="file"]').first()
        await input.setInputFiles(pdf.local_path)
      }

      await dialog.locator('button').filter({ hasText: '确定' }).first().click()
      await expect(dialog).toBeHidden()
      await expect(page.locator('.el-message__content').filter({ hasText: '保存成功' }).first()).toBeVisible()
    }
  })
})

