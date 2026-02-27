import { defineStore } from 'pinia'

export const useSpecStore = defineStore('spec', {
  state: () => ({
    specs: [] as any[],
    currentSpec: null as any,
    categories: [] as any[],
    currentCategory: null as any,
    searchParams: {
      keyword: '',
      type: '',
      level: '',
      status: '',
      dateRange: [] as any[]
    },
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0
    },
    viewMode: 'list' as 'list' | 'card'
  }),
  getters: {
    filteredSpecs: (state) => {
      // 这里可以添加过滤逻辑
      return state.specs
    }
  },
  actions: {
    setSpecs(specs: any[]) {
      this.specs = specs
    },
    setCurrentSpec(spec: any) {
      this.currentSpec = spec
    },
    setCategories(categories: any[]) {
      this.categories = categories
    },
    setCurrentCategory(category: any) {
      this.currentCategory = category
    },
    setSearchParams(params: any) {
      this.searchParams = { ...this.searchParams, ...params }
    },
    setPagination(pagination: any) {
      this.pagination = { ...this.pagination, ...pagination }
    },
    setViewMode(mode: 'list' | 'card') {
      this.viewMode = mode
      localStorage.setItem('specViewMode', mode)
    },
    loadViewMode() {
      const mode = localStorage.getItem('specViewMode') as 'list' | 'card'
      if (mode) {
        this.viewMode = mode
      }
    }
  }
})