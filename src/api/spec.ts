import request from '../utils/request'

/**
 * 规范标准相关API
 */
export const specApi = {
  /**
   * 获取规范标准列表
   * @param params 查询参数
   */
  getSpecList: (params: any) => {
    return request({
      url: '/spec/list',
      method: 'get',
      params
    })
  },
  /**
   * 获取规范标准详情
   * @param id 规范标准ID
   */
  getSpecDetail: (id: string) => {
    return request({
      url: `/spec/detail/${id}`,
      method: 'get'
    })
  },
  /**
   * 上传规范标准
   * @param data 规范标准数据
   */
  uploadSpec: (data: any) => {
    return request({
      url: '/spec/upload',
      method: 'post',
      data
    })
  },
  /**
   * 获取分类目录树
   */
  getCategoryTree: () => {
    return request({
      url: '/spec/category/tree',
      method: 'get'
    })
  },
  /**
   * 保存分类目录
   * @param data 分类目录数据
   */
  saveCategory: (data: any) => {
    return request({
      url: '/spec/category/save',
      method: 'post',
      data
    })
  }
}