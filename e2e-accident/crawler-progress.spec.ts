import { test, expect } from '@playwright/test'

test('一键智能爬取：进度条刷新与报告入口展示', async ({ page }) => {
  await page.route(/smart-task$/, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 201,
        msg: 'created',
        data: {
          task: {
            id: 't1',
            keyword: 'k',
            target_url: 'https://example.com',
            batch_id: '',
            engine: 'httpx_bs4',
            concurrency: 10,
            status: 'pending',
            stage: '',
            current: 0,
            total: 10,
            percent: 0,
            trace_id: '',
            max_items: 10,
            max_depth: 1,
            success_count: 0,
            fail_count: 0,
            last_error: null,
            log_path: '',
            started_at: null,
            finished_at: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z'
          },
          strategy: { engine: 'httpx_bs4', concurrency: 10 },
          fingerprint: 'x'
        }
      })
    })
  })

  await page.route(/\/api\/v1\/crawler\/reports(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, msg: 'ok', data: { items: [], total: 0, page: 1, size: 20 } })
    })
  })

  await page.route(/\/api\/v1\/crawler\/tasks\/t1\/run$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, msg: 'ok', data: { queued: true, task_id: 't1' } })
    })
  })

  let tick = 0
  await page.route(/\/api\/progress\/t1$/, async (route) => {
    tick += 1
    const running = tick < 3
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        msg: 'ok',
        data: running
          ? { taskId: 't1', status: 'running', stage: 'crawling', current: tick, total: 10, percent: tick * 10, startTime: '2026-01-01T00:00:00Z', eta: 10, traceId: 'x', lastError: null }
          : {
              taskId: 't1',
              status: 'succeeded',
              stage: 'done',
              current: 10,
              total: 10,
              percent: 100,
              startTime: '2026-01-01T00:00:00Z',
              eta: 0,
              traceId: 'x',
              lastError: null,
              reports: { files: ['report.json'], zip: '/api/v1/crawler/tasks/t1/reports.zip', links: ['/api/v1/crawler/tasks/t1/reports/report.json'] }
            }
      })
    })
  })

  await page.route(/\/api\/v1\/crawler\/tasks\/t1\/reports$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        msg: 'ok',
        data: {
          task_id: 't1',
          files: ['report.json'],
          zip: '/api/v1/crawler/tasks/t1/reports.zip',
          links: ['/api/v1/crawler/tasks/t1/reports/report.json']
        }
      })
    })
  })

  await page.goto('/accident-cases')
  await page.getByRole('tab', { name: '事故爬取' }).click()

  await page.getByPlaceholder('如：坍塌 2024 河北').fill('k')
  await page.getByPlaceholder('https://...').fill('https://example.com')
  await page.getByRole('button', { name: '一键智能爬取' }).click()
  await expect(page.getByText(/阶段：/)).toBeVisible()

  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: '报告' }).first().click()
  await expect(page.getByRole('heading', { name: '下载报告' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下载 ZIP' }).first()).toBeVisible()
})
