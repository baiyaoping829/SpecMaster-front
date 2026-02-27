<template>
  <div class="module-layout">
    <!-- 左侧栏 -->
    <div class="sidebar-container" :class="{ collapsed: sidebarCollapsed }" :style="{ width: sidebarCollapsed ? '60px' : sidebarWidth + 'px' }">
      <!-- 抽屉式伸缩按钮 -->
      <div class="sidebar-toggle" @click="toggleSidebar">
        <el-icon>{{ sidebarCollapsed ? 'ArrowRight' : 'ArrowLeft' }}</el-icon>
      </div>
      <!-- 根据当前路由显示不同的左侧栏 -->
      <component :is="currentSidebar" />
      <!-- 宽度调整手柄 -->
      <div class="resize-handle" @mousedown="startResize"></div>
    </div>
    
    <!-- 主内容区 -->
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import SpecDataSidebar from './sidebars/SpecDataSidebar.vue'
import SpecReaderSidebar from './sidebars/SpecReaderSidebar.vue'
import DefaultSidebar from './sidebars/DefaultSidebar.vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()

// 侧边栏宽度
const sidebarWidth = ref(240)
// 侧边栏折叠状态
const sidebarCollapsed = ref(false)
// 调整大小状态
const isResizing = ref(false)

// 根据当前路由计算应该显示的左侧栏组件
const currentSidebar = computed(() => {
  const path = route.path
  
  // 为不同模块返回不同的左侧栏组件
  switch (true) {
    case path.startsWith('/spec-data'):
      return SpecDataSidebar
    case path.startsWith('/spec-reader'):
      return SpecReaderSidebar
    // 其他模块使用默认左侧栏
    default:
      return DefaultSidebar
  }
})

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 开始调整大小
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

// 处理调整大小
const handleResize = (event: MouseEvent) => {
  if (isResizing.value && !sidebarCollapsed.value) {
    // 获取sidebar-container元素
    const sidebarContainer = document.querySelector('.sidebar-container') as HTMLElement
    if (sidebarContainer) {
      const rect = sidebarContainer.getBoundingClientRect()
      const newWidth = event.clientX - rect.left
      if (newWidth > 150 && newWidth < 400) {
        sidebarWidth.value = newWidth
      }
    }
  }
}

// 停止调整大小
const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 生命周期
onMounted(() => {
  // 可以从localStorage中恢复侧边栏宽度和折叠状态
  const savedWidth = localStorage.getItem('sidebarWidth')
  const savedCollapsed = localStorage.getItem('sidebarCollapsed')
  if (savedWidth) {
    sidebarWidth.value = parseInt(savedWidth)
  }
  if (savedCollapsed) {
    sidebarCollapsed.value = savedCollapsed === 'true'
  }
})

onUnmounted(() => {
  // 保存侧边栏宽度和折叠状态到localStorage
  localStorage.setItem('sidebarWidth', sidebarWidth.value.toString())
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
  // 清理事件监听器
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style lang="scss" scoped>
.module-layout {
  display: flex;
  height: 100%;
  min-height: 600px;
  width: 100%;
  position: relative;
}

.sidebar-container {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  height: 100%;
  overflow-y: auto;
  transition: width 0.3s ease;
  position: relative;
  flex-shrink: 0;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f5f7fa;
  }
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #409EFF;
  }
  
  &:active {
    background-color: #409EFF;
  }
}

.content {
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  overflow-y: auto;
  transition: all 0.3s ease;
}

// 折叠状态的样式
.sidebar-container.collapsed {
  width: 60px !important;
}

.sidebar-container.collapsed .sidebar-toggle {
  right: -10px;
}

.sidebar-container.collapsed .resize-handle {
  display: none;
}
</style>