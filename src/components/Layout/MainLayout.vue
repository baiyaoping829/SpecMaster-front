<template>
  <div class="main-layout">
    <!-- 顶部导航栏 -->
    <header class="main-header">
      <div class="header-left">
        <el-button type="primary" plain @click="drawerVisible = true" class="menu-button">
          <el-icon><Menu /></el-icon>
        </el-button>
        <div class="logo">
          <h1>SpecMaster</h1>
        </div>
        <el-scrollbar class="main-nav-scroll">
          <el-tabs v-model="activeTab" class="main-nav" @tab-click="handleTabClick">
            <el-tab-pane label="首页" name="home">
              <router-link to="/" class="tab-link">首页</router-link>
            </el-tab-pane>
            <el-tab-pane label="规标大数据" name="spec-data">
              <router-link to="/spec-data" class="tab-link">规标大数据</router-link>
            </el-tab-pane>
            <el-tab-pane label="规范智阅" name="spec-reader">
              <router-link to="/spec-reader" class="tab-link">规范智阅</router-link>
            </el-tab-pane>
            <el-tab-pane label="规范智答" name="spec-qa">
              <router-link to="/spec-qa" class="tab-link">规范智答</router-link>
            </el-tab-pane>
            <el-tab-pane label="方案智审" name="plan-review">
              <router-link to="/plan-review" class="tab-link">方案智审</router-link>
            </el-tab-pane>
            <el-tab-pane label="工程风险智控" name="risk-control">
              <router-link to="/risk-control" class="tab-link">工程风险智控</router-link>
            </el-tab-pane>
            <el-tab-pane label="工程合同智审" name="contract-review">
              <router-link to="/contract-review" class="tab-link">工程合同智审</router-link>
            </el-tab-pane>
            <el-tab-pane label="工程事故案例库" name="accident-cases">
              <router-link to="/accident-cases" class="tab-link">工程事故案例库</router-link>
            </el-tab-pane>
            <el-tab-pane label="工程领域知识库" name="knowledge-base">
              <router-link to="/knowledge-base" class="tab-link">工程领域知识库</router-link>
            </el-tab-pane>
            <el-tab-pane label="工程单位及专家管理" name="company-expert">
              <router-link to="/company-expert" class="tab-link">工程单位及专家管理</router-link>
            </el-tab-pane>
            <el-tab-pane label="用户角色管理" name="user-role">
              <router-link to="/user-role" class="tab-link">用户角色管理</router-link>
            </el-tab-pane>
          </el-tabs>
        </el-scrollbar>
      </div>
      <div class="header-right">
        <el-dropdown>
          <span class="user-info">
            <el-avatar :size="32" icon="el-icon-user" />
            <span class="username">{{ userStore.userInfo?.username || '未登录' }}</span>
            <el-icon class="el-icon-arrow-down" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item>会员中心</el-dropdown-item>
              <el-dropdown-item divided @click="userStore.logout()">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <ModuleLayout>
            <component :is="Component" />
          </ModuleLayout>
        </transition>
      </router-view>
    </main>
    
    <!-- 抽屉式侧边栏 -->
    <el-drawer
      v-model="drawerVisible"
      title="规范标准目录"
      direction="ltr"
      size="300px"
      :before-close="handleClose"
    >
      <SidebarLayout />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '../../store/modules/user'
import { useRoute, useRouter } from 'vue-router'
import SidebarLayout from './SidebarLayout.vue'
import ModuleLayout from './ModuleLayout.vue'
import { Menu } from '@element-plus/icons-vue'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const drawerVisible = ref(false)
const activeTab = ref('home')

const handleClose = () => {
  drawerVisible.value = false
}

const handleTabClick = (tab: any) => {
  const tabName = tab.props.name
  activeTab.value = tabName
  const path = tabName === 'home' ? '/' : `/${tabName}`
  router.push(path)
}

// 监听路由变化，更新activeTab
watch(() => route.path, (path) => {
  const pathName = path === '/' ? 'home' : path.substring(1)
  activeTab.value = pathName
})

// 初始化时设置activeTab
onMounted(() => {
  const pathName = route.path === '/' ? 'home' : route.path.substring(1)
  activeTab.value = pathName
})
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-button {
  margin-right: 16px;
}

.logo {
  margin-right: 40px;
}

.logo h1 {
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
  margin: 0;
}

.main-nav-scroll {
  flex: 1;
  height: 64px;
  
  .el-scrollbar__wrap {
    overflow-x: auto;
    overflow-y: hidden;
  }
}

.main-nav {
  width: fit-content;
  
  .el-tabs__header {
    margin: 0;
  }
  
  .el-tabs__nav {
    border-bottom: none;
  }
  
  .el-tabs__item {
    padding: 0 16px;
    height: 64px;
    line-height: 64px;
    font-size: 14px;
    color: #606266;
    
    &:hover {
      color: #409EFF;
    }
    
    &.is-active {
      color: #409EFF;
      font-weight: 500;
    }
  }
  
  .el-tabs__active-bar {
    background-color: #409EFF;
  }
}

.tab-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f5f7fa;
  }
}

.username {
  margin-left: 8px;
  margin-right: 4px;
  font-size: 14px;
  color: #606266;
}

.main-content {
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 600px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>