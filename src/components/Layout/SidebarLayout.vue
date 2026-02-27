<template>
  <div class="sidebar-layout">
    <div class="sidebar">
      <div class="sidebar-content">
        <!-- 目录树 -->
        <div class="tree-container">
          <el-tree
            :data="treeData"
            node-key="id"
            default-expand-all
            @node-click="handleNodeClick"
            @node-contextmenu="handleContextMenu"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span>{{ node.label }}</span>
                <span v-if="data.isSpec" class="spec-tag">规范</span>
              </div>
            </template>
          </el-tree>
        </div>
        
        <!-- 操作按钮 -->
        <div class="tree-actions">
          <el-button size="small" @click="addNode">添加节点</el-button>
          <el-button size="small" @click="deleteNode">删除节点</el-button>
          <el-button size="small" @click="renameNode">重命名节点</el-button>
        </div>
        
        <!-- 右键菜单 -->
        <el-dropdown
          v-if="contextMenuVisible"
          :show-timeout="0"
          :hide-on-click="false"
          @visible-change="handleContextMenuVisibleChange"
        >
          <div class="context-menu" :style="contextMenuStyle"></div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="addChildNode">添加子节点</el-dropdown-item>
              <el-dropdown-item @click="addSiblingNode">添加兄弟节点</el-dropdown-item>
              <el-dropdown-item @click="deleteSelectedNode">删除节点</el-dropdown-item>
              <el-dropdown-item @click="renameSelectedNode">重命名节点</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 目录树数据
const treeData = ref([
  {
    id: '1',
    label: '建筑工程',
    children: [
      {
        id: '1-1',
        label: '设计规范',
        children: [
          {
            id: '1-1-1',
            label: '建筑设计防火规范',
            isSpec: true,
            specId: '1'
          },
          {
            id: '1-1-2',
            label: '混凝土结构设计规范',
            isSpec: true,
            specId: '2'
          }
        ]
      },
      {
        id: '1-2',
        label: '施工规范',
        children: []
      }
    ]
  },
  {
    id: '2',
    label: '市政工程',
    children: []
  },
  {
    id: '3',
    label: '水利工程',
    children: []
  }
])

// 选中的节点
const selectedNode = ref(null)

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuStyle = reactive<{ left?: string; top?: string }>({})
const contextMenuPosition = reactive({ x: 0, y: 0 })

// 处理节点点击
const handleNodeClick = (data: any, _node: any) => {
  selectedNode.value = data
  if (data.isSpec && data.specId) {
    // 导航到规范详情页
    router.push(`/spec-data/detail/${data.specId}`)
  }
}

// 处理右键菜单
const handleContextMenu = (event: MouseEvent, data: any, _node: any, _tree: any) => {
  event.preventDefault()
  selectedNode.value = data
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuStyle.left = `${contextMenuPosition.x}px`
  contextMenuStyle.top = `${contextMenuPosition.y}px`
  contextMenuVisible.value = true
}

// 处理右键菜单显示/隐藏
const handleContextMenuVisibleChange = (visible: boolean) => {
  contextMenuVisible.value = visible
}

// 添加节点
const addNode = () => {
  // 这里可以打开添加节点的对话框
  console.log('添加节点')
}

// 删除节点
const deleteNode = () => {
  if (selectedNode.value) {
    console.log('删除节点:', selectedNode.value)
    // 这里可以实现删除节点的逻辑
  }
}

// 重命名节点
const renameNode = () => {
  if (selectedNode.value) {
    console.log('重命名节点:', selectedNode.value)
    // 这里可以打开重命名节点的对话框
  }
}

// 添加子节点
const addChildNode = () => {
  if (selectedNode.value) {
    console.log('添加子节点到:', selectedNode.value)
    // 这里可以实现添加子节点的逻辑
  }
}

// 添加兄弟节点
const addSiblingNode = () => {
  if (selectedNode.value) {
    console.log('添加兄弟节点到:', selectedNode.value)
    // 这里可以实现添加兄弟节点的逻辑
  }
}

// 删除选中节点
const deleteSelectedNode = () => {
  deleteNode()
  contextMenuVisible.value = false
}

// 重命名选中节点
const renameSelectedNode = () => {
  renameNode()
  contextMenuVisible.value = false
}
</script>

<style lang="scss" scoped>
.sidebar-layout {
  display: flex;
  height: 100%;
  min-height: 600px;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  height: 100%;
  overflow-y: auto;
  position: sticky;
  top: 0;
  align-self: flex-start;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.spec-tag {
  font-size: 10px;
  color: #409EFF;
  background-color: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.tree-actions {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 8px;
}

.content {
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.context-menu {
  position: fixed;
  width: 10px;
  height: 10px;
  background: transparent;
  z-index: 1000;
}
</style>