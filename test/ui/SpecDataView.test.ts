import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('element-plus', () => {
  return {
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    },
    ElNotification: vi.fn()
  }
})

const trackMock = vi.fn()
vi.mock('../../src/utils/telemetry', () => ({
  track: (evt: any) => trackMock(evt)
}))

const getSpecListMock = vi.fn()
vi.mock('../../src/api/spec', () => ({
  specApi: {
    getSpecList: (...args: any[]) => getSpecListMock(...args)
  }
}))

const latestMock = vi.fn()
const deleteMock = vi.fn()
vi.mock('../../src/api/specifications', () => ({
  specificationsApi: {
    latest: (...args: any[]) => latestMock(...args),
    delete: (...args: any[]) => deleteMock(...args)
  }
}))

import SpecDataView from '../../src/views/SpecDataView.vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

const ElButtonStub = defineComponent({
  name: 'ElButton',
  props: {
    disabled: Boolean,
    loading: Boolean
  },
  emits: ['click'],
  setup(props, { emit, slots }) {
    return () =>
      h(
        'button',
        {
          disabled: props.disabled || props.loading,
          onClick: () => {
            if (props.disabled || props.loading) return
            emit('click')
          }
        },
        slots.default ? slots.default() : []
      )
  }
})

const SlotStub = defineComponent({
  name: 'SlotStub',
  setup(_, { slots }) {
    return () => h('div', {}, slots.default ? slots.default() : [])
  }
})

const NoSlotStub = defineComponent({
  name: 'NoSlotStub',
  setup() {
    return () => null
  }
})

describe('SpecDataView - 查看/删除规范', () => {
  beforeEach(() => {
    localStorage.clear()
    trackMock.mockClear()
    getSpecListMock.mockReset()
    latestMock.mockReset()
    deleteMock.mockReset()
    ;(ElMessage.success as any).mockClear()
    ;(ElMessage.error as any).mockClear()
    ;(ElMessage.info as any).mockClear()
    ;(ElMessageBox.confirm as any).mockReset()
    ;(ElNotification as any).mockReset()

    setActivePinia(createPinia())
    getSpecListMock.mockResolvedValue({
      data: { items: [], total: 0 }
    })
  })

  const mountView = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = shallowMount(SpecDataView, {
      global: {
        plugins: [pinia],
        stubs: {
          'el-button': ElButtonStub,
          'el-card': SlotStub,
          'el-form': SlotStub,
          'el-form-item': SlotStub,
          'el-select': SlotStub,
          'el-option': SlotStub,
          'el-input': SlotStub,
          'el-table': SlotStub,
          'el-table-column': NoSlotStub,
          'el-tag': SlotStub,
          'el-dropdown': SlotStub,
          'el-dropdown-menu': SlotStub,
          'el-dropdown-item': SlotStub,
          'el-pagination': SlotStub,
          'el-icon': SlotStub,
          RouterLink: SlotStub
        }
      }
    })
    await wrapper.vm.$nextTick()
    return wrapper
  }

  it('查看规范：发现新规范时提示并刷新列表', async () => {
    const wrapper = await mountView()
    latestMock.mockResolvedValueOnce({
      data: { items: [{ id: '1', name: 'A', version: 1, uploader: 'u', uploadTime: 't1' }] }
    })

    await (wrapper.vm as any).handleViewSpecifications()

    expect(ElMessage.success).toHaveBeenCalledWith('发现 1 条新规范')
    expect(getSpecListMock).toHaveBeenCalledTimes(2)
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.view.click' })
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.view.success', newCount: 1 })
  })

  it('查看规范：无新增时仅提示且不刷新列表', async () => {
    localStorage.setItem('spec_latest_cache', JSON.stringify({ '1': { version: 1, uploadTime: 't1' } }))
    const wrapper = await mountView()
    latestMock.mockResolvedValueOnce({
      data: { items: [{ id: '1', name: 'A', version: 1, uploader: 'u', uploadTime: 't1' }] }
    })

    await (wrapper.vm as any).handleViewSpecifications()

    expect(ElMessage.info).toHaveBeenCalledWith('未发现新规范')
    expect(getSpecListMock).toHaveBeenCalledTimes(1)
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.view.success', newCount: 0 })
  })

  it('查看规范：失败后可重试并记录埋点', async () => {
    const wrapper = await mountView()
    latestMock.mockRejectedValueOnce(new Error('timeout'))
    latestMock.mockResolvedValueOnce({
      data: { items: [{ id: '1', name: 'A', version: 1, uploader: 'u', uploadTime: 't1' }] }
    })
    ;(ElMessageBox.confirm as any).mockResolvedValueOnce(undefined)

    await (wrapper.vm as any).handleViewSpecifications()

    expect(ElMessage.error).toHaveBeenCalledWith('操作失败，请稍后重试')
    expect(ElMessageBox.confirm).toHaveBeenCalledTimes(1)
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.view.failure', message: 'timeout' })
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.view.retry' })
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.view.success', newCount: 1 })
  })

  it('删除规范：无选中时按钮禁用', async () => {
    const wrapper = await mountView()
    const btns = wrapper.findAll('button')
    const deleteBtn = btns.find((b) => b.text().includes('删除规范'))
    expect(deleteBtn).toBeTruthy()
    expect(deleteBtn!.attributes('disabled')).toBeDefined()
  })

  it('删除规范：支持部分失败并清空已选项', async () => {
    const wrapper = await mountView()
    ;(wrapper.vm as any).selectedIdSet = new Set(['a', 'b'])
    ;(wrapper.vm as any).selectedSpecCache = new Map([
      ['a', { id: 'a', name: '规范A' }],
      ['b', { id: 'b', name: '规范B' }]
    ])
    await wrapper.vm.$nextTick()

    ;(ElMessageBox.confirm as any).mockResolvedValueOnce(undefined)
    deleteMock.mockResolvedValueOnce({
      data: { successIds: ['a'], failed: [{ id: 'b', reason: 'not found' }] }
    })

    await (wrapper.vm as any).handleDeleteSpecifications()

    expect(ElNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '删除结果',
        message: '成功删除 1 条，失败 1 条',
        position: 'bottom-right'
      })
    )
    expect((wrapper.vm as any).selectedCount).toBe(0)
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.delete.click', count: 2 })
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.delete.success', success: 1, failed: 1 })
    expect(getSpecListMock).toHaveBeenCalledTimes(2)
  })

  it('删除规范：失败后可重试并记录埋点', async () => {
    const wrapper = await mountView()
    ;(wrapper.vm as any).selectedIdSet = new Set(['a'])
    ;(wrapper.vm as any).selectedSpecCache = new Map([['a', { id: 'a', name: '规范A' }]])
    await wrapper.vm.$nextTick()

    ;(ElMessageBox.confirm as any).mockResolvedValueOnce(undefined)
    deleteMock.mockRejectedValueOnce(new Error('net'))
    ;(ElMessageBox.confirm as any).mockResolvedValueOnce(undefined)
    deleteMock.mockResolvedValueOnce({
      data: { successIds: ['a'], failed: [] }
    })

    await (wrapper.vm as any).handleDeleteSpecifications()

    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.delete.failure', message: 'net' })
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.delete.retry' })
    expect(trackMock).toHaveBeenCalledWith({ name: 'spec.delete.success', success: 1, failed: 0 })
  })
})

