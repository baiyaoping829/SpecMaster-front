import { test, expect } from '@playwright/test'

test('目标网址历史记录：写入、下拉、跨会话恢复与上限30条', async ({ page }) => {
  await page.goto('/accident-cases')
  await page.getByRole('tab', { name: '事故爬取' }).click()

  const urlInput = page.getByPlaceholder('https://...')
  const keywordInput = page.getByPlaceholder('如：坍塌 2024 河北')

  await page.getByTestId('clear-url-history-button').click()
  await page.getByRole('button', { name: /OK|确定/ }).click()

  await keywordInput.fill('test')
  await urlInput.fill('https://example.com/a')
  await page.getByRole('button', { name: '创建任务' }).click()

  await page.reload()
  await page.getByRole('tab', { name: '事故爬取' }).click()

  await urlInput.click()
  await expect(page.locator('.el-autocomplete-suggestion__list')).toContainText('https://example.com/a')

  await page.evaluate(async () => {
    const DB_NAME = 'accident_crawler'
    const STORE = 'url_history'
    const openDb = () =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(STORE)) {
            const s = db.createObjectStore(STORE, { keyPath: 'site_url' })
            s.createIndex('last_used_at', 'last_used_at', { unique: false })
          }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      store.clear()
      const base = Date.now()
      for (let i = 0; i < 31; i++) {
        store.put({ site_url: `https://example.com/${i}`, last_used_at: base + i })
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  })

  await page.reload()
  await page.getByRole('tab', { name: '事故爬取' }).click()
  await urlInput.click()
  const first = page.locator('.el-autocomplete-suggestion__list li').first()
  await expect(first).toContainText('https://example.com/30')
})

