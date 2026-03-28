import { defineStore } from 'pinia'
import { accidentApi, type AccidentCaseVO, type AccidentCaseListVO } from '../../api/accident'

const safeJsonParse = (raw: any) => {
  if (!raw) return null
  try {
    return JSON.parse(String(raw))
  } catch {
    return null
  }
}

const toUiAccident = (vo: AccidentCaseVO) => {
  const obj = safeJsonParse(vo.content) || {}
  const files = {
    report: (vo.attachment_keys || []).map((k) => ({
      name: String(k).split('/').pop() || String(k),
      url: '#',
      key: k
    })),
    reading: [],
    media: []
  }
  return {
    id: vo.id,
    caseNo: vo.case_no || vo.id,
    name: vo.title,
    ...obj,
    files,
    _vo: vo
  }
}

const toBackendPayload = (accident: any) => {
  const { id, caseNo, name, _vo, ...rest } = accident || {}
  const base = safeJsonParse(_vo?.content) || {}
  const merged = { ...base, ...rest }
  return {
    case_no: String(caseNo || ''),
    title: String(name || ''),
    content: JSON.stringify(merged),
    attachment_keys: Array.isArray(_vo?.attachment_keys) ? _vo.attachment_keys : []
  }
}

export const useAccidentStore = defineStore('accident', {
  state: () => ({
    accidents: [] as any[],
    total: 0,
    page: 1,
    size: 20
  }),
  actions: {
    async fetchList(page = 1, size = 50) {
      const res = await accidentApi.list({ page, size })
      const data = res.data as AccidentCaseListVO
      this.page = data.page
      this.size = data.size
      this.total = data.total
      this.accidents = (data.items || []).map(toUiAccident)
      return this.accidents
    },
    async createAccident(accident: any) {
      const payload = toBackendPayload(accident)
      const res = await accidentApi.create(payload)
      const vo = res.data as AccidentCaseVO
      await this.fetchList(1, this.size)
      return toUiAccident(vo)
    },
    async updateAccident(accident: any) {
      const vo: AccidentCaseVO | undefined = accident?._vo
      if (!vo?.id) throw new Error('missing id')
      const payload = toBackendPayload(accident)
      const res = await accidentApi.legacyUpdate(vo.id, { version: vo.version, ...payload })
      const updated = res.data as AccidentCaseVO
      await this.fetchList(this.page, this.size)
      return toUiAccident(updated)
    },
    async deleteAccident(id: string) {
      await accidentApi.remove(id)
      await this.fetchList(this.page, this.size)
    },
    async refreshCase(id: string) {
      const res = await accidentApi.detail(id)
      const vo = res.data as AccidentCaseVO
      const ui = toUiAccident(vo)
      const idx = this.accidents.findIndex((x: any) => x?.id === id)
      if (idx >= 0) this.accidents.splice(idx, 1, ui)
      return ui
    },
    async uploadAttachments(id: string, files: File[]) {
      const res = await accidentApi.uploadAttachments(id, files)
      const keys = (res.data as any)?.attachment_keys || []
      await this.refreshCase(id)
      return keys as string[]
    },
    async presignAttachment(id: string, key: string) {
      const res = await accidentApi.presignAttachment(id, key)
      return String((res.data as any)?.url || '')
    },
    async deleteAttachment(id: string, key: string) {
      await accidentApi.deleteAttachment(id, key)
      await this.refreshCase(id)
    }
  }
})

