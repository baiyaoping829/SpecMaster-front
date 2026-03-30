import { accidentApi } from '../api/accident'
import request from '../utils/request'

// Mock axios
jest.mock('../utils/request')

const mockRequest = request as jest.MockedFunction<typeof request>

describe('Accident API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 测试获取事故列表
  describe('list', () => {
    it('should return accident list successfully', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: 'AC001',
              case_no: 'AC001',
              title: '河北承德国恩老年公寓重大火灾事故',
              content: '{"type": "火灾事故", "directCause": "电气线路老化，短路引发火灾"}',
              attachment_keys: ['report1.pdf'],
              unit_name: '国恩老年公寓',
              occurred_year: 2025,
              version: 1,
              created_at: '2025-04-08T00:00:00Z',
              updated_at: '2025-04-08T00:00:00Z'
            }
          ],
          total: 1,
          page: 1,
          size: 10
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.list({ page: 1, size: 10 })
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/v1/accidents/',
        method: 'get',
        params: { page: 1, size: 10 }
      })
    })

    it('should handle empty list', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 1,
          size: 10
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.list({ page: 1, size: 10 })
      expect(result).toEqual(mockResponse)
      expect(result.data.items).toHaveLength(0)
    })

    it('should handle API error', async () => {
      const mockError = new Error('API Error')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.list({ page: 1, size: 10 })).rejects.toThrow('API Error')
    })
  })

  // 测试创建事故
  describe('create', () => {
    it('should create accident successfully', async () => {
      const payload = {
        case_no: 'AC002',
        title: '测试事故',
        content: '{"type": "测试类型", "directCause": "测试原因"}',
        attachment_keys: ['test.pdf']
      }

      const mockResponse = {
        data: {
          id: 'AC002',
          case_no: 'AC002',
          title: '测试事故',
          content: '{"type": "测试类型", "directCause": "测试原因"}',
          attachment_keys: ['test.pdf'],
          version: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.create(payload)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/v1/accidents/',
        method: 'post',
        data: payload
      })
    })

    it('should handle missing required fields', async () => {
      const payload = {
        case_no: '',
        title: '',
        content: ''
      }

      const mockError = new Error('Missing required fields')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.create(payload)).rejects.toThrow('Missing required fields')
    })
  })

  // 测试获取事故详情
  describe('detail', () => {
    it('should get accident detail successfully', async () => {
      const accidentId = 'AC001'

      const mockResponse = {
        data: {
          id: 'AC001',
          case_no: 'AC001',
          title: '河北承德国恩老年公寓重大火灾事故',
          content: '{"type": "火灾事故", "directCause": "电气线路老化，短路引发火灾"}',
          attachment_keys: ['report1.pdf'],
          unit_name: '国恩老年公寓',
          occurred_year: 2025,
          version: 1,
          created_at: '2025-04-08T00:00:00Z',
          updated_at: '2025-04-08T00:00:00Z'
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.detail(accidentId)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: `/v1/accidents/${encodeURIComponent(accidentId)}`,
        method: 'get'
      })
    })

    it('should handle non-existent accident', async () => {
      const accidentId = 'NON_EXISTENT'

      const mockError = new Error('Accident not found')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.detail(accidentId)).rejects.toThrow('Accident not found')
    })
  })

  // 测试更新事故
  describe('update', () => {
    it('should update accident successfully', async () => {
      const accidentId = 'AC001'
      const payload = {
        version: 1,
        case_no: 'AC001',
        title: '更新后的事故名称',
        content: '{"type": "火灾事故", "directCause": "更新后的原因"}',
        attachment_keys: ['report1.pdf', 'report2.pdf']
      }

      const mockResponse = {
        data: {
          id: 'AC001',
          case_no: 'AC001',
          title: '更新后的事故名称',
          content: '{"type": "火灾事故", "directCause": "更新后的原因"}',
          attachment_keys: ['report1.pdf', 'report2.pdf'],
          version: 2,
          created_at: '2025-04-08T00:00:00Z',
          updated_at: '2025-04-09T00:00:00Z'
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.update(accidentId, payload)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: `/v1/accidents/${encodeURIComponent(accidentId)}`,
        method: 'put',
        data: payload
      })
    })

    it('should handle version conflict', async () => {
      const accidentId = 'AC001'
      const payload = {
        version: 1,
        title: '更新后的事故名称'
      }

      const mockError = new Error('Version conflict')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.update(accidentId, payload)).rejects.toThrow('Version conflict')
    })
  })

  // 测试删除事故
  describe('remove', () => {
    it('should delete accident successfully', async () => {
      const accidentId = 'AC001'

      const mockResponse = { data: { success: true } }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.remove(accidentId)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: `/v1/accidents/${encodeURIComponent(accidentId)}`,
        method: 'delete'
      })
    })

    it('should handle deletion of non-existent accident', async () => {
      const accidentId = 'NON_EXISTENT'

      const mockError = new Error('Accident not found')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.remove(accidentId)).rejects.toThrow('Accident not found')
    })
  })

  // 测试上传附件
  describe('uploadAttachments', () => {
    it('should upload attachments successfully', async () => {
      const accidentId = 'AC001'
      const files = [new File(['test content'], 'test.pdf', { type: 'application/pdf' })]

      const mockResponse = {
        data: { attachment_keys: ['test.pdf'] }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.uploadAttachments(accidentId, files)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({
        url: `/v1/accidents/${encodeURIComponent(accidentId)}/attachments`,
        method: 'post',
        headers: { 'Content-Type': 'multipart/form-data' }
      }))
    })

    it('should handle empty files', async () => {
      const accidentId = 'AC001'
      const files: File[] = []

      const mockError = new Error('No files provided')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.uploadAttachments(accidentId, files)).rejects.toThrow('No files provided')
    })
  })

  // 测试获取附件预签名URL
  describe('presignAttachment', () => {
    it('should get presigned URL successfully', async () => {
      const accidentId = 'AC001'
      const key = 'test.pdf'

      const mockResponse = {
        data: { url: 'https://example.com/presigned-url' }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.presignAttachment(accidentId, key)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: `/v1/accidents/${encodeURIComponent(accidentId)}/attachments/presign`,
        method: 'get',
        params: { key }
      })
    })

    it('should handle invalid key', async () => {
      const accidentId = 'AC001'
      const key = ''

      const mockError = new Error('Invalid key')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.presignAttachment(accidentId, key)).rejects.toThrow('Invalid key')
    })
  })

  // 测试删除附件
  describe('deleteAttachment', () => {
    it('should delete attachment successfully', async () => {
      const accidentId = 'AC001'
      const key = 'test.pdf'

      const mockResponse = { data: { success: true } }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.deleteAttachment(accidentId, key)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: `/v1/accidents/${encodeURIComponent(accidentId)}/attachments`,
        method: 'delete',
        params: { key }
      })
    })

    it('should handle deletion of non-existent attachment', async () => {
      const accidentId = 'AC001'
      const key = 'non-existent.pdf'

      const mockError = new Error('Attachment not found')
      mockRequest.mockRejectedValue(mockError)

      await expect(accidentApi.deleteAttachment(accidentId, key)).rejects.toThrow('Attachment not found')
    })
  })

  // 测试外部案例搜索
  describe('externalSearch', () => {
    it('should search external candidates successfully', async () => {
      const params = { q: '火灾事故', limit: 10 }

      const mockResponse = {
        data: {
          items: [
            {
              case_no: 'EXT001',
              title: '外部火灾事故案例',
              occurred_at: '2024-01-01',
              location: '北京市',
              industry: '建筑',
              level: '重大',
              deaths: 5,
              injuries: 10,
              direct_economic_loss_cny: 1000000,
              overview: '事故概述',
              direct_cause: '直接原因',
              indirect_cause: '间接原因',
              rectification: '整改措施',
              accountability: '责任认定',
              source_url: 'https://example.com',
              published_at: '2024-01-02'
            }
          ]
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.externalSearch(params)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/v1/accidents/external/search',
        method: 'get',
        params
      })
    })

    it('should handle empty search results', async () => {
      const params = { q: '不存在的事故', limit: 10 }

      const mockResponse = {
        data: { items: [] }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.externalSearch(params)
      expect(result).toEqual(mockResponse)
      expect(result.data.items).toHaveLength(0)
    })
  })

  // 测试外部案例导入
  describe('externalImport', () => {
    it('should import external candidates successfully', async () => {
      const payload = {
        unit_name: '测试单位',
        items: [
          {
            case_no: 'EXT001',
            title: '外部火灾事故案例',
            occurred_at: '2024-01-01',
            location: '北京市',
            industry: '建筑',
            level: '重大',
            deaths: 5,
            injuries: 10,
            direct_economic_loss_cny: 1000000,
            overview: '事故概述',
            direct_cause: '直接原因',
            indirect_cause: '间接原因',
            rectification: '整改措施',
            accountability: '责任认定',
            source_url: 'https://example.com',
            published_at: '2024-01-02'
          }
        ]
      }

      const mockResponse = {
        data: {
          inserted: ['EXT001'],
          skipped_existing: [],
          errors: []
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.externalImport(payload)
      expect(result).toEqual(mockResponse)
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/v1/accidents/external/import',
        method: 'post',
        data: payload
      })
    })

    it('should handle import errors', async () => {
      const payload = {
        unit_name: '测试单位',
        items: [
          {
            case_no: 'EXT001',
            title: '', // 空标题
            occurred_at: '2024-01-01',
            location: '北京市',
            industry: '建筑',
            level: '重大',
            deaths: 5,
            injuries: 10,
            direct_economic_loss_cny: 1000000,
            overview: '事故概述',
            direct_cause: '直接原因',
            indirect_cause: '间接原因',
            rectification: '整改措施',
            accountability: '责任认定',
            source_url: 'https://example.com',
            published_at: '2024-01-02'
          }
        ]
      }

      const mockResponse = {
        data: {
          inserted: [],
          skipped_existing: [],
          errors: [
            { case_no: 'EXT001', error: 'Missing title' }
          ]
        }
      }

      mockRequest.mockResolvedValue(mockResponse)

      const result = await accidentApi.externalImport(payload)
      expect(result).toEqual(mockResponse)
      expect(result.data.errors).toHaveLength(1)
    })
  })
})
