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

test.describe('事故管理异常场景（前端交互模拟）', () => {
  test('文件格式错误：上传非PDF应提示失败', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
    const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('请输入事故名称').fill(`E2E-非法附件-${Date.now()}`)
    await intelligentFill(dialog)
    await dialog.getByPlaceholder('选择事故日期').fill('2025-01-02')

    const input = dialog.locator('input[type="file"]').first()
    await input.setInputFiles({
      name: 'bad.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a pdf')
    })

    await dialog.locator('button').filter({ hasText: '确定' }).first().click()
    await expect(page.locator('.el-message__content').first()).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('网络中断：提交时中断 /api/v1 请求应提示失败', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto('/accident-cases')
    await page.getByRole('tab', { name: '事故管理' }).click()

    await page.route('**/api/v1/**', (route) => route.abort())

    await page.getByRole('button', { name: '添加事故案例' }).click({ force: true })
    const dialog = page.locator('.el-dialog').filter({ hasText: '添加事故案例' }).first()
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('请输入事故名称').fill(`E2E-断网-${Date.now()}`)
    await intelligentFill(dialog)
    await dialog.getByPlaceholder('选择事故日期').fill('2025-01-02')

    await dialog.locator('button').filter({ hasText: '确定' }).first().click()
    await expect(page.locator('.el-message__content').first()).toBeVisible()
    await expect(dialog).toBeVisible()
  })
})

