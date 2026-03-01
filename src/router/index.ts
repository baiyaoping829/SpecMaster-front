import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/spec-data',
      name: 'SpecData',
      component: () => import('../views/SpecDataView.vue'),
      meta: { title: '规范标准' }
    },
    {
      path: '/spec-data/upload',
      name: 'SpecDataUpload',
      component: () => import('../views/SpecDataUploadView.vue'),
      meta: { title: '上传规范标准' }
    },
    {
      path: '/spec-data/add-to-tree',
      name: 'SpecDataAddToTree',
      component: () => import('../views/SpecDataAddToTreeView.vue'),
      meta: { title: '添加规范到目录树' }
    },
    {
      path: '/spec-data/preview/:id',
      name: 'SpecDataPreview',
      component: () => import('../views/SpecDataPreviewView.vue'),
      meta: { title: '规范标准预览' }
    },
    {
      path: '/spec-data/edit/:id',
      name: 'SpecDataEdit',
      component: () => import('../views/SpecDataEditView.vue'),
      meta: { title: '编辑规范标准' }
    },
    {
      path: '/spec-data/history/:id',
      name: 'SpecDataHistory',
      component: () => import('../views/SpecDataHistoryView.vue'),
      meta: { title: '规范标准历史版本管理' }
    },
    {
      path: '/spec-data/convert/:id',
      name: 'SpecDataConvert',
      component: () => import('../views/SpecDataConvertView.vue'),
      meta: { title: '规范标准格式转换' }
    },
    {
      path: '/spec-reader',
      name: 'SpecReader',
      component: () => import('../views/SpecReaderView.vue'),
      meta: { title: '规范智阅' }
    },
    {
    path: '/spec-reader-theme',
    name: 'SpecReaderTheme',
    component: () => import('../views/SpecReaderThemeView.vue'),
    meta: { title: '创建阅览主题' }
  },
  {
    path: '/similar-clauses',
    name: 'SimilarClauses',
    component: () => import('../views/SimilarClausesView.vue'),
    meta: { title: '相似条款检索' }
  },
    {
      path: '/spec-qa',
      name: 'SpecQA',
      component: () => import('../views/IntelligentQAView.vue'),
      meta: { title: '规范智答' }
    },
    {
      path: '/plan-review',
      name: 'PlanReview',
      component: () => import('../views/PlanReviewView.vue'),
      meta: { title: '方案智审' }
    },
    {
      path: '/risk-control',
      name: 'RiskControl',
      component: () => import('../views/RiskControlView.vue'),
      meta: { title: '风险智控' }
    },
    {
      path: '/contract-review',
      name: 'ContractReview',
      component: () => import('../views/ContractReviewView.vue'),
      meta: { title: '合同智审' }
    },
    {
      path: '/accident-cases',
      name: 'AccidentCases',
      component: () => import('../views/AccidentCasesView.vue'),
      meta: { title: '事故案例' }
    },
    {
      path: '/knowledge-base',
      name: 'KnowledgeBase',
      component: () => import('../views/KnowledgeBaseView.vue'),
      meta: { title: '工程知识' }
    },
    {
      path: '/company-expert',
      name: 'CompanyExpert',
      component: () => import('../views/CompanyExpertView.vue'),
      meta: { title: '专家管理' }
    },
    {
      path: '/user-role',
      name: 'UserRole',
      component: () => import('../views/UserRoleView.vue'),
      meta: { title: '权限设置' }
    }
  ]
})

// 路由守卫，设置页面标题
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - SpecMaster`
  } else {
    document.title = 'SpecMaster'
  }
  next()
})

export default router