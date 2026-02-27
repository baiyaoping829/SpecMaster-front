<template>
  <div class="default-sidebar">
    <div class="sidebar-header">
      <h3>功能导航</h3>
    </div>
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      router
    >
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="/spec-data">
        <el-icon><Document /></el-icon>
        <span>规标大数据</span>
      </el-menu-item>
      <el-menu-item index="/spec-reader">
        <el-icon><Reading /></el-icon>
        <span>规范智阅</span>
      </el-menu-item>
      <el-menu-item index="/spec-qa">
        <el-icon><Message /></el-icon>
        <span>规范智答</span>
      </el-menu-item>
      <el-menu-item index="/plan-review">
        <el-icon><Check /></el-icon>
        <span>方案智审</span>
      </el-menu-item>
      <el-menu-item index="/risk-control">
        <el-icon><Warning /></el-icon>
        <span>风险智控</span>
      </el-menu-item>
      <el-menu-item index="/contract-review">
        <el-icon><Files /></el-icon>
        <span>合同智审</span>
      </el-menu-item>
      <el-menu-item index="/accident-cases">
        <el-icon><Alert /></el-icon>
        <span>事故案例</span>
      </el-menu-item>
      <el-menu-item index="/knowledge-base">
        <el-icon><Document /></el-icon>
        <span>工程知识</span>
      </el-menu-item>
      <el-menu-item index="/company-expert">
        <el-icon><UserFilled /></el-icon>
        <span>专家管理</span>
      </el-menu-item>
      <el-menu-item index="/user-role">
        <el-icon><Setting /></el-icon>
        <span>权限设置</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { House, Document, Reading, Message, Check, Warning, Files, Warning as Alert, UserFilled, Setting } from '@element-plus/icons-vue'

const route = useRoute()

// 计算当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})
</script>

<style lang="scss" scoped>
.default-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  .el-menu-item {
    height: 48px;
    line-height: 48px;
    margin: 0 16px;
    border-radius: 4px;
    &:hover {
      background-color: #f5f7fa;
    }
  }
  .el-menu-item.is-active {
    background-color: #ecf5ff;
    color: #409EFF;
  }
  .el-icon {
    margin-right: 12px;
  }
}
</style>