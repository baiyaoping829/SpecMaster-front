import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import AccidentCrawlerAdmin from '../../src/views/accident-cases/AccidentCrawlerAdmin.vue'

vi.mock('element-plus', async () => {
  return {
    ElMessage: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    ElMessageBox: { confirm: vi.fn().mockResolvedValue(true) }
  }
})

vi.mock('../../src/api/crawler', async () => {
  return {
    crawlerApi: {
      listTasks: vi.fn().mockResolvedValue({ data: { items: [], total: 0, page: 1, size: 50 } }),
      createTask: vi.fn().mockResolvedValue({ data: {} }),
      runTask: vi.fn().mockResolvedValue({ data: {} }),
      listReports: vi.fn().mockResolvedValue({ data: { items: [], total: 0, page: 1, size: 20 } }),
      deleteReport: vi.fn().mockResolvedValue({ data: {} }),
      reparseReport: vi.fn().mockResolvedValue({ data: {} }),
      getTaskLog: vi.fn().mockResolvedValue({ data: { text: '' } })
    }
  }
})

vi.mock('../../src/api/favorite', async () => {
  return {
    favoriteApi: {
      lookup: vi.fn().mockResolvedValue({ data: { found: false } }),
      create: vi.fn().mockResolvedValue({ data: { item: { id: '1' }, existed: false } }),
      list: vi.fn().mockResolvedValue({ data: { items: [], total: 0, page: 1, size: 20 } }),
      update: vi.fn().mockResolvedValue({ data: {} }),
      remove: vi.fn().mockResolvedValue({ data: {} })
    }
  }
})

vi.mock('../../src/utils/crawlerUrlHistory', async () => {
  return {
    crawlerUrlHistory: {
      add: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
      clearAll: vi.fn().mockResolvedValue(undefined)
    }
  }
})

describe('AccidentCrawlerAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountView = () => {
    return shallowMount(AccidentCrawlerAdmin, {
      global: {
        stubs: {
          'el-table-column': {
            template: '<div><slot :row=\"{success_count:0,fail_count:0}\" :scope=\"{row:{success_count:0,fail_count:0}}\" /></div>'
          },
          'el-table': { template: '<div><slot /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-card': { template: '<div><slot /><slot name=\"header\" /></div>' },
          'el-dialog': { template: '<div><slot /><slot name=\"footer\" /></div>' },
          'el-button': { template: '<button><slot /></button>' },
          'el-input': { template: '<input />' },
          'el-autocomplete': { template: '<input />' },
          'el-select': { template: '<select><slot /></select>' },
          'el-option': { template: '<option><slot /></option>' },
          'el-date-picker': { template: '<input />' },
          'el-pagination': { template: '<div />' },
          'el-link': { template: '<a><slot /></a>' },
          'el-skeleton': { template: '<div />' },
          'el-icon': { template: '<i><slot /></i>' },
          star: { template: '<i />' },
          'el-tag': { template: '<span><slot /></span>' }
        }
      }
    })
  }

  it('打开收藏弹窗：目标网址为空时提示错误', async () => {
    const wrapper = mountView()
    await (wrapper.vm as any).openFavoriteDialog()
    const { ElMessage } = await import('element-plus')
    expect(ElMessage.error).toHaveBeenCalled()
  })

  it('打开收藏弹窗：目标网址存在时进入弹窗状态', async () => {
    const wrapper = mountView()
    ;(wrapper.vm as any).taskForm.targetUrl = 'https://example.com'
    await (wrapper.vm as any).openFavoriteDialog()
    expect((wrapper.vm as any).favoriteDialogVisible).toBe(true)
    expect((wrapper.vm as any).favoriteForm.site_url).toBe('https://example.com')
  })

  it('清除历史：触发二次确认并调用 clearAll', async () => {
    const wrapper = mountView()
    await (wrapper.vm as any).clearUrlHistory()
    const { ElMessageBox } = await import('element-plus')
    const { crawlerUrlHistory } = await import('../../src/utils/crawlerUrlHistory')
    expect(ElMessageBox.confirm).toHaveBeenCalled()
    expect(crawlerUrlHistory.clearAll).toHaveBeenCalled()
  })
})

