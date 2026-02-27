import { defineStore } from 'pinia'

export interface Theme {
  id: string
  name: string
  description: string
  specs: Spec[]
  specCount: number
  createdAt: string
  popularity?: number
  importance?: number
}

export interface Spec {
  id: string
  name: string
  code: string
  issueDate: string
  effectiveDate: string
  note: string
}

export const useReaderStore = defineStore('reader', {
  state: () => ({
    themes: [] as Theme[],
    currentTheme: null as Theme | null,
    availableSpecs: [] as Spec[]
  }),
  getters: {
    getThemeById: (state) => (id: string) => {
      return state.themes.find(theme => theme.id === id)
    },
    getThemesWithSpecCount: (state) => {
      return state.themes.map(theme => ({
        ...theme,
        specCount: theme.specs.length
      }))
    }
  },
  actions: {
    // 初始化主题数据
    initializeThemes() {
      // 从localStorage加载主题数据
      const storedThemes = localStorage.getItem('readerThemes')
      if (storedThemes) {
        this.themes = JSON.parse(storedThemes)
      } else {
        // 默认主题数据
        this.themes = [
          {
            id: '1',
            name: '建筑设计规范',
            description: '建筑设计相关规范',
            specs: [
              {
                id: '1',
                name: '建筑设计防火规范',
                code: 'GB 50016-2014',
                issueDate: '2014-08-27',
                effectiveDate: '2015-05-01',
                note: '适用于建筑设计防火'
              },
              {
                id: '2',
                name: '混凝土结构设计规范',
                code: 'GB 50010-2010',
                issueDate: '2010-08-18',
                effectiveDate: '2011-07-01',
                note: '适用于混凝土结构设计'
              }
            ],
            specCount: 2,
            createdAt: '2024-01-01 10:00:00'
          },
          {
            id: '2',
            name: '结构设计规范',
            description: '结构设计相关规范',
            specs: [
              {
                id: '3',
                name: '建筑抗震设计规范',
                code: 'GB 50011-2010',
                issueDate: '2010-05-31',
                effectiveDate: '2010-12-01',
                note: '适用于建筑抗震设计'
              }
            ],
            specCount: 1,
            createdAt: '2024-01-02 14:30:00'
          },
          {
            id: '3',
            name: '施工安全规范',
            description: '施工安全相关规范',
            specs: [],
            specCount: 0,
            createdAt: '2024-01-03 09:15:00'
          }
        ]
        // 保存到localStorage
        this.saveThemes()
      }

      // 初始化可用规范数据
      this.availableSpecs = [
        {
          id: '1',
          name: '建筑设计防火规范',
          code: 'GB 50016-2014',
          issueDate: '2014-08-27',
          effectiveDate: '2015-05-01',
          note: ''
        },
        {
          id: '2',
          name: '混凝土结构设计规范',
          code: 'GB 50010-2010',
          issueDate: '2010-08-18',
          effectiveDate: '2011-07-01',
          note: ''
        },
        {
          id: '3',
          name: '建筑抗震设计规范',
          code: 'GB 50011-2010',
          issueDate: '2010-05-31',
          effectiveDate: '2010-12-01',
          note: ''
        },
        {
          id: '4',
          name: '建筑地基基础设计规范',
          code: 'GB 50007-2011',
          issueDate: '2011-07-26',
          effectiveDate: '2012-08-01',
          note: ''
        },
        {
          id: '5',
          name: '砌体结构设计规范',
          code: 'GB 50003-2011',
          issueDate: '2011-07-26',
          effectiveDate: '2012-08-01',
          note: ''
        }
      ]
    },

    // 保存主题数据到localStorage
    saveThemes() {
      localStorage.setItem('readerThemes', JSON.stringify(this.themes))
    },

    // 添加主题
    addTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'specCount'>) {
      const newTheme: Theme = {
        ...theme,
        id: (this.themes.length + 1).toString(),
        specs: [],
        specCount: 0,
        createdAt: new Date().toLocaleString()
      }
      this.themes.push(newTheme)
      this.saveThemes()
      return newTheme
    },

    // 更新主题
    updateTheme(theme: Theme) {
      const index = this.themes.findIndex(t => t.id === theme.id)
      if (index !== -1) {
        const updatedTheme = {
          ...theme,
          specCount: theme.specs.length
        }
        // 使用splice方法确保响应式更新
        this.themes.splice(index, 1, updatedTheme)
        this.saveThemes()
      }
    },

    // 删除主题
    deleteTheme(id: string) {
      const index = this.themes.findIndex(t => t.id === id)
      if (index !== -1) {
        this.themes.splice(index, 1)
        this.saveThemes()
      }
    },

    // 设置当前主题
    setCurrentTheme(theme: Theme | null) {
      this.currentTheme = theme
    },

    // 添加规范到主题
    addSpecsToTheme(themeId: string, specIds: string[]) {
      const theme = this.themes.find(t => t.id === themeId)
      if (theme) {
        // 过滤出选择的规范
        const selectedSpecs = this.availableSpecs.filter(spec => specIds.includes(spec.id))
        
        // 去重添加
        selectedSpecs.forEach(spec => {
          if (!theme.specs.some(s => s.id === spec.id)) {
            theme.specs.push({ ...spec })
          }
        })
        
        // 更新规范数量
        theme.specCount = theme.specs.length
        
        // 保存到localStorage
        this.saveThemes()
      }
    },

    // 从主题中移除规范
    removeSpecFromTheme(themeId: string, specId: string) {
      const theme = this.themes.find(t => t.id === themeId)
      if (theme) {
        const specIndex = theme.specs.findIndex(s => s.id === specId)
        if (specIndex !== -1) {
          theme.specs.splice(specIndex, 1)
          theme.specCount = theme.specs.length
          this.saveThemes()
        }
      }
    },

    // 编辑规范附注
    editSpecNote(themeId: string, specId: string, note: string) {
      const theme = this.themes.find(t => t.id === themeId)
      if (theme) {
        const spec = theme.specs.find(s => s.id === specId)
        if (spec) {
          spec.note = note
          this.saveThemes()
        }
      }
    }
  }
})