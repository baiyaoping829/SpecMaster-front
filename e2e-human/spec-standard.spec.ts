import { test, expect } from '@playwright/test'
import { ensureLoggedIn, humanClick, humanType } from './helpers/human'
import { seedSpecs, whitelistToken } from './helpers/whitelist'

test.describe('规范标准模块（拟人化）', () => {
  test('列表检索→跨页选择→删除规范（部分失败）→查看最新规范', async ({ page, request, baseURL }) => {
    const token = await ensureLoggedIn({ page, request, baseURL: String(baseURL) })
    const adminToken = token || (await whitelistToken({ request, baseURL: String(baseURL) }))

    await seedSpecs({ request, baseURL: String(baseURL), count: 25, token: adminToken })

    await page.goto('/spec-data')
    await expect(page).toHaveTitle(/规范标准.*SpecMaster|SpecMaster/)

    await humanType(page, page.getByPlaceholder('请输入规范名称'), 'E2E-Seed-')
    await humanClick(page.getByRole('button', { name: '搜索' }))

    await expect(page.locator('.el-table')).toBeVisible()

    const firstCheckbox = page.locator('.el-table__body-wrapper .el-checkbox').first()
    await humanClick(firstCheckbox)

    const page2 = page.locator('.el-pagination').locator('li.number', { hasText: '2' })
    if ((await page2.count()) > 0) {
      await humanClick(page2.first())
      const page2Checkbox = page.locator('.el-table__body-wrapper .el-checkbox').first()
      await humanClick(page2Checkbox)
    }

    const deleteBtn = page.getByRole('button', { name: '删除规范' })
    await expect(deleteBtn).toBeEnabled()

    await page.route('**/api/specifications', async (route) => {
      const req = route.request()
      if (req.method() !== 'DELETE') return route.continue()
      const body = req.postData() || '[]'
      let ids: string[] = []
      try {
        ids = JSON.parse(body)
      } catch {
        ids = []
      }
      const successIds = ids.slice(0, 1)
      const failed = ids.slice(1).map((id) => ({ id, reason: 'simulated failure' }))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'ok', data: { successIds, failed } })
      })
    })

    await humanClick(deleteBtn)
    await humanClick(page.locator('.el-message-box').getByRole('button', { name: '删除', exact: true }))
    await expect(page.getByText(/成功删除 1 条，失败/)).toBeVisible()

    const viewBtn = page.getByRole('button', { name: '查看规范' })
    await humanClick(viewBtn)
    await expect(page.getByText(/发现 \d+ 条新规范|未发现新规范/)).toBeVisible()
  })

  test('网络异常→3s内提示→允许重试（查看最新规范）', async ({ page, request, baseURL }) => {
    await ensureLoggedIn({ page, request, baseURL: String(baseURL) })
    await page.goto('/spec-data')

    await page.route('**/api/specifications/latest', async (route) => {
      await route.abort()
    })

    await humanClick(page.getByRole('button', { name: '查看规范' }))
    await expect(page.getByText('操作失败，请稍后重试')).toBeVisible()
    await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
    await humanClick(page.getByRole('button', { name: '取消' }))
  })
})

