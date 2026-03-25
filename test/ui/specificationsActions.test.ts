import { describe, expect, it } from 'vitest'
import { buildDeleteConfirmMessage, diffLatestItems, parseLatestCache } from '../../src/features/specificationsActions'

describe('specificationsActions', () => {
  it('parseLatestCache returns empty object for invalid input', () => {
    expect(parseLatestCache(null)).toEqual({})
    expect(parseLatestCache('')).toEqual({})
    expect(parseLatestCache('{bad')).toEqual({})
    expect(parseLatestCache('123')).toEqual({})
  })

  it('parseLatestCache returns object for valid json', () => {
    expect(parseLatestCache('{"a":{"version":1,"uploadTime":"t"}}')).toEqual({ a: { version: 1, uploadTime: 't' } })
  })

  it('diffLatestItems counts new and updated items', () => {
    const prev = {
      a: { version: 1, uploadTime: 't1' },
      b: { version: 1, uploadTime: 't1' }
    }
    const { newCount, next } = diffLatestItems(prev, [
      { id: 'a', version: 1, uploadTime: 't1' },
      { id: 'b', version: 2, uploadTime: 't1' },
      { id: 'c', version: 1, uploadTime: 't2' }
    ])
    expect(newCount).toBe(2)
    expect(next.a).toEqual({ version: 1, uploadTime: 't1' })
    expect(next.b).toEqual({ version: 2, uploadTime: 't1' })
    expect(next.c).toEqual({ version: 1, uploadTime: 't2' })
  })

  it('diffLatestItems normalizes falsy fields', () => {
    const { newCount, next } = diffLatestItems({}, [{ id: 'x', version: undefined as any, uploadTime: undefined as any }])
    expect(newCount).toBe(1)
    expect(next.x).toEqual({ version: 0, uploadTime: '' })
  })

  it('buildDeleteConfirmMessage formats preview and remainder', () => {
    expect(buildDeleteConfirmMessage([])).toBe('将删除 0 条规范')
    expect(buildDeleteConfirmMessage(undefined as any)).toBe('将删除 0 条规范')
    expect(buildDeleteConfirmMessage(['A'])).toBe('将删除 1 条规范：A')
    const many = Array.from({ length: 12 }).map((_, i) => `N${i + 1}`)
    expect(buildDeleteConfirmMessage(many)).toContain('将删除 12 条规范：')
    expect(buildDeleteConfirmMessage(many)).toContain('等2条')
  })
})

