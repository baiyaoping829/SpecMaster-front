<template>
  <div class="spec-reader-sidebar">
    <div class="sidebar-header">
      <h3>规范智阅</h3>
    </div>
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      router
    >
      <el-menu-item index="/spec-reader">
        <el-icon><Reading /></el-icon>
        <span>规范阅读</span>
      </el-menu-item>
      <el-menu-item index="/spec-reader/recent">
        <el-icon><Timer /></el-icon>
        <span>最近阅读</span>
      </el-menu-item>
      <el-menu-item index="/spec-reader/favorites">
        <el-icon><Star /></el-icon>
        <span>收藏规范</span>
      </el-menu-item>
      <el-menu-item index="/spec-reader/history">
        <el-icon><Clock /></el-icon>
        <span>阅读历史</span>
      </el-menu-item>
      <el-menu-item index="/spec-reader/search">
        <el-icon><Search /></el-icon>
        <span>规范搜索</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Reading, Timer, Star, Clock, Search } from '@element-plus/icons-vue'

const route = useRoute()

// 计算当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})
</script>

<style lang="scss" scoped>
.spec-reader-sidebar {
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