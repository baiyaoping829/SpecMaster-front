import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as any,
    token: localStorage.getItem('token') || '',
    roles: [] as string[],
    permissions: [] as string[],
    userLevel: 0 // 0: 免费用户, 1: 普通会员, 2: 高级会员, 3: 企业用户
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isVip: (state) => state.userLevel >= 1,
    isEnterprise: (state) => state.userLevel >= 3
  },
  actions: {
    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
    },
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setRoles(roles: string[]) {
      this.roles = roles
    },
    setPermissions(permissions: string[]) {
      this.permissions = permissions
    },
    setUserLevel(level: number) {
      this.userLevel = level
    },
    logout() {
      this.userInfo = null
      this.token = ''
      this.roles = []
      this.permissions = []
      this.userLevel = 0
      localStorage.removeItem('token')
    }
  }
})