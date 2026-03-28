import request from '../utils/request'

export type AccidentCaseVO = {
  id: string
  case_no?: string | null
  title: string
  content: string
  attachment_keys: string[]
  unit_name?: string | null
  occurred_year?: number | null
  version: number
  created_at: string
  updated_at: string
}

export type AccidentCaseListVO = {
  items: AccidentCaseVO[]
  total: number
  page: number
  size: number
}

export type ExternalCandidate = {
  case_no: string
  title: string
  occurred_at: string
  location: string
  industry: string
  level: string
  deaths: number
  injuries: number
  direct_economic_loss_cny?: number | null
  overview: string
  direct_cause: string
  indirect_cause: string
  rectification: string
  accountability: string
  source_url: string
  published_at: string
  report_pdf_local_path?: string | null
}

export type ExternalSearchResp = {
  items: ExternalCandidate[]
}

export type ExternalImportReq = {
  unit_name: string
  items: ExternalCandidate[]
}

export type ExternalImportResp = {
  inserted: string[]
  skipped_existing: string[]
  errors: Array<{ case_no: string; error: string }>
}

export const accidentApi = {
  create(payload: { case_no: string; title: string; content: string; attachment_keys?: string[] }) {
    return request({
      url: '/v1/accidents/',
      method: 'post',
      data: payload
    })
  },
  detail(id: string) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}`,
      method: 'get'
    })
  },
  update(id: string, payload: { version: number; case_no?: string; title?: string; content?: string; attachment_keys?: string[] }) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}`,
      method: 'put',
      data: payload
    })
  },
  legacyUpdate(id: string, payload: { version: number; case_no?: string; title?: string; content?: string; attachment_keys?: string[] }) {
    return request({
      url: `/v1/accident/update`,
      method: 'post',
      params: { case_id: id },
      data: payload
    })
  },
  remove(id: string) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}`,
      method: 'delete'
    })
  },
  list(params: { page?: number; size?: number }) {
    return request({
      url: '/v1/accidents/',
      method: 'get',
      params
    })
  },
  externalSearch(params: { q: string; limit?: number }) {
    return request({
      url: '/v1/accidents/external/search',
      method: 'get',
      params
    })
  },
  externalImport(payload: ExternalImportReq) {
    return request({
      url: '/v1/accidents/external/import',
      method: 'post',
      data: payload
    })
  },
  linkSpec(id: string, specId: string) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}/specs`,
      method: 'post',
      data: { spec_id: specId }
    })
  },
  unlinkSpec(id: string, specId: string) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}/specs/${encodeURIComponent(specId)}`,
      method: 'delete'
    })
  },
  uploadAttachments(id: string, files: File[]) {
    const form = new FormData()
    for (const f of files) form.append('files', f)
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}/attachments`,
      method: 'post',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' }
    } as any)
  },
  presignAttachment(id: string, key: string) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}/attachments/presign`,
      method: 'get',
      params: { key }
    })
  },
  deleteAttachment(id: string, key: string) {
    return request({
      url: `/v1/accidents/${encodeURIComponent(id)}/attachments`,
      method: 'delete',
      params: { key }
    })
  }
}

