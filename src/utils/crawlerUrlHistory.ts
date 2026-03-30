type UrlHistoryItem = {
  site_url: string
  last_used_at: number
}

const DB_NAME = 'accident_crawler'
const DB_VERSION = 1
const STORE = 'url_history'
const MAX_ITEMS = 30

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'site_url' })
        store.createIndex('last_used_at', 'last_used_at', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

const txDone = (tx: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const crawlerUrlHistory = {
  async add(siteUrl: string) {
    const url = String(siteUrl || '').trim()
    if (!url) return
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put({ site_url: url, last_used_at: Date.now() } satisfies UrlHistoryItem)
    await txDone(tx)
    db.close()
    await this.trim()
  },

  async list(prefix: string = ''): Promise<string[]> {
    const q = String(prefix || '').trim().toLowerCase()
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    const items: UrlHistoryItem[] = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []) as UrlHistoryItem[])
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()

    const sorted = items
      .filter((x) => x && x.site_url)
      .sort((a, b) => Number(b.last_used_at || 0) - Number(a.last_used_at || 0))
      .map((x) => x.site_url)

    if (!q) return sorted.slice(0, MAX_ITEMS)
    return sorted.filter((u) => u.toLowerCase().includes(q)).slice(0, MAX_ITEMS)
  },

  async clearAll() {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    await txDone(tx)
    db.close()
  },

  async trim() {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.getAll()
    const items: UrlHistoryItem[] = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []) as UrlHistoryItem[])
      req.onerror = () => reject(req.error)
    })
    const sorted = items
      .filter((x) => x && x.site_url)
      .sort((a, b) => Number(b.last_used_at || 0) - Number(a.last_used_at || 0))
    const toDelete = sorted.slice(MAX_ITEMS)
    for (const it of toDelete) store.delete(it.site_url)
    await txDone(tx)
    db.close()
  }
}

