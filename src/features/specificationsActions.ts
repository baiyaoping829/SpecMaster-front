export type LatestCacheRecord = Record<string, { version: number; uploadTime: string }>

export const parseLatestCache = (raw: string | null | undefined): LatestCacheRecord => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as LatestCacheRecord
  } catch {
    return {}
  }
}

export const diffLatestItems = (
  prev: LatestCacheRecord,
  items: Array<{ id: string; version: number; uploadTime: string }>
) => {
  let newCount = 0
  const next: LatestCacheRecord = {}
  for (const it of items) {
    const id = String(it.id)
    const version = Number(it.version || 0)
    const uploadTime = String(it.uploadTime || '')
    next[id] = { version, uploadTime }
    const old = prev[id]
    if (!old || old.version !== version || old.uploadTime !== uploadTime) newCount += 1
  }
  return { newCount, next }
}

export const buildDeleteConfirmMessage = (names: string[]) => {
  const safeNames = (names || []).map((x) => String(x)).filter(Boolean)
  const previewNames = safeNames.slice(0, 10)
  const more = safeNames.length - previewNames.length
  if (!safeNames.length) return '将删除 0 条规范'
  return more > 0
    ? `将删除 ${safeNames.length} 条规范：${previewNames.join('、')} 等${more}条`
    : `将删除 ${safeNames.length} 条规范：${previewNames.join('、')}`
}

