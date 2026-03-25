import { test, expect } from '@playwright/test'
import { ensureLoggedIn } from './helpers/human'
import { seedSpecs, whitelistToken } from './helpers/whitelist'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

test('全模块深度遍历（拟人化导览）', async ({ page, request, baseURL }) => {
  const token = await ensureLoggedIn({ page, request, baseURL: String(baseURL) })
  const adminToken = token || (await whitelistToken({ request, baseURL: String(baseURL) }))

  const datasetPath = process.env.E2E_DATASET || join(process.cwd(), 'e2e-human', 'datasets', 'spec-basic.json')
  const dataset = JSON.parse(await readFile(datasetPath, 'utf8'))
  const seedCount = Number(dataset?.seedSpecs || 0)
  if (seedCount) await seedSpecs({ request, baseURL: String(baseURL), count: seedCount, token: adminToken })

  const routes: string[] = Array.isArray(dataset?.routes) ? dataset.routes : []
  for (const path of routes) {
    await page.goto(path)
    await expect(page).toHaveTitle(/SpecMaster/)
    await expect(page.locator('#app')).toBeVisible()
  }
})

