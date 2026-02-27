<template>
  <div class="spec-data-sidebar">
    <div class="sidebar-header">
      <h3>规范标准目录</h3>
      <div class="header-actions">
        <el-button size="small" type="primary" @click="handleSmartMatch" style="margin-right: 8px;">
          智能匹配
        </el-button>
        <div class="sort-options">
          <el-dropdown @command="handleSort">
            <span class="sort-button">
              排序方式 <el-icon class="el-icon-arrow-down"></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="latest">最新使用</el-dropdown-item>
                <el-dropdown-item command="popular">最受欢迎</el-dropdown-item>
                <el-dropdown-item command="important">最重要性</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
    
    <!-- 目录树 -->
    <div class="tree-container">
      <el-tree
        :data="treeData"
        node-key="id"
        :default-expanded-keys="defaultExpandedKeys"
        :show-checkbox="false"
        :indent="20"
        @node-click="handleNodeClick"
        @node-dblclick="handleNodeDblClick"
        @node-contextmenu="handleContextMenu"
        :default-expand-all="false"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div class="tree-node" :style="{ color: data.color }">
            <span>{{ node.label }}</span>
            <span v-if="data.isSpec" class="spec-tag">规范</span>
          </div>
        </template>
      </el-tree>
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

    <!-- 智能匹配对话框 -->
    <el-dialog
      v-model="smartMatchDialogVisible"
      title="智能规范匹配"
      width="800px"
    >
      <div class="smart-match-content">
        <el-form :model="smartMatchForm" label-width="120px">
          <el-form-item label="匹配方式">
            <el-radio-group v-model="smartMatchForm.matchMode">
              <el-radio-button label="auto">自动匹配</el-radio-button>
              <el-radio-button label="manual">手动选择</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="匹配范围">
            <el-select v-model="smartMatchForm.matchScope" multiple placeholder="请选择匹配范围">
              <el-option label="分类" value="category" />
              <el-option label="关键词" value="keyword" />
              <el-option label="编制单位" value="unit" />
            </el-select>
          </el-form-item>
          <el-form-item label="客户配置">
            <el-select v-model="smartMatchForm.customerConfig" placeholder="请选择客户配置">
              <el-option label="默认配置" value="default" />
              <el-option label="客户A" value="customerA" />
              <el-option label="客户B" value="customerB" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="match-result" v-if="matchResults.length > 0">
          <h4>匹配结果</h4>
          <el-table :data="matchResults" style="width: 100%">
            <el-table-column prop="specName" label="规范名称" width="200" />
            <el-table-column prop="matchNode" label="匹配节点" width="200" />
            <el-table-column prop="matchScore" label="匹配度" width="100" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="confirmMatch(scope.row)">确认匹配</el-button>
                <el-button size="small" @click="cancelMatch(scope.row)">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="match-loading" v-loading="isMatching">
          正在进行智能匹配，请稍候...
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="smartMatchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="startSmartMatch" :loading="isMatching">开始匹配</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSpecStore } from '../../../store/modules/spec'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const specStore = useSpecStore()

// 目录树数据
const treeData = ref([
  {
    id: '1',
    label: '建筑工程',
    color: '#409EFF',
    children: [
      {
        id: '1-1',
        label: '综合规范',
        color: '#67C23A',
        children: [
          {
            id: '1-1-1',
            label: '建筑工程施工质量验收统一标准',
            isSpec: true,
            specId: '11'
          },
          {
            id: '1-1-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-1-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-2',
        label: '测绘规范',
        color: '#67C23A',
        children: [
          {
            id: '1-2-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-2-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-3',
        label: '勘察规范',
        color: '#67C23A',
        children: [
          {
            id: '1-3-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-3-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-4',
        label: '设计规范',
        color: '#67C23A',
        children: [
          {
            id: '1-4-1',
            label: '建筑设计防火规范',
            isSpec: true,
            specId: '1'
          },
          {
            id: '1-4-2',
            label: '混凝土结构设计规范',
            isSpec: true,
            specId: '2'
          },
          {
            id: '1-4-3',
            label: '建筑抗震设计规范',
            isSpec: true,
            specId: '3'
          },
          {
            id: '1-4-4',
            label: '建筑地基基础设计规范',
            isSpec: true,
            specId: '4'
          },
          {
            id: '1-4-5',
            label: '砌体结构设计规范',
            isSpec: true,
            specId: '5'
          },
          {
            id: '1-4-6',
            label: '钢结构设计标准',
            isSpec: true,
            specId: '6'
          },
          {
            id: '1-4-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-4-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-5',
        label: '施工规范',
        color: '#67C23A',
        children: [
          {
            id: '1-5-1',
            label: '建筑节能工程施工质量验收规范',
            isSpec: true,
            specId: '9'
          },
          {
            id: '1-5-2',
            label: '建筑装饰装修工程质量验收标准',
            isSpec: true,
            specId: '10'
          },
          {
            id: '1-5-3',
            label: '建筑电气工程施工质量验收规范',
            isSpec: true,
            specId: '12'
          },
          {
            id: '1-5-4',
            label: '建筑给水排水及采暖工程施工质量验收规范',
            isSpec: true,
            specId: '13'
          },
          {
            id: '1-5-5',
            label: '通风与空调工程施工质量验收规范',
            isSpec: true,
            specId: '14'
          },
          {
            id: '1-5-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-5-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-6',
        label: '运维规范',
        color: '#67C23A',
        children: [
          {
            id: '1-6-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-6-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-7',
        label: '数字化规范',
        color: '#67C23A',
        children: [
          {
            id: '1-7-1',
            label: '智能建筑工程质量验收规范',
            isSpec: true,
            specId: '15'
          },
          {
            id: '1-7-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '1-7-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '1-99',
        label: '自定义规范',
        color: '#E6A23C',
        children: []
      },
      {
        id: '1-999',
        label: '其他规范',
        color: '#909399',
        children: []
      }
    ]
  },
  {
    id: '2',
    label: '市政工程',
    color: '#F56C6C',
    children: [
      {
        id: '2-1',
        label: '综合规范',
        color: '#67C23A',
        children: [
          {
            id: '2-1-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-1-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-2',
        label: '测绘规范',
        color: '#67C23A',
        children: [
          {
            id: '2-2-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-2-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-3',
        label: '勘察规范',
        color: '#67C23A',
        children: [
          {
            id: '2-3-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-3-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-4',
        label: '设计规范',
        color: '#67C23A',
        children: [
          {
            id: '2-4-1',
            label: '城市道路工程设计规范',
            isSpec: true,
            specId: '17'
          },
          {
            id: '2-4-2',
            label: '城市桥梁设计规范',
            isSpec: true,
            specId: '18'
          },
          {
            id: '2-4-3',
            label: '城镇道路路面设计规范',
            isSpec: true,
            specId: '19'
          },
          {
            id: '2-4-4',
            label: '城市排水工程规划规范',
            isSpec: true,
            specId: '20'
          },
          {
            id: '2-4-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-4-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-5',
        label: '施工规范',
        color: '#67C23A',
        children: [
          {
            id: '2-5-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-5-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-6',
        label: '运维规范',
        color: '#67C23A',
        children: [
          {
            id: '2-6-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-6-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-7',
        label: '数字化规范',
        color: '#67C23A',
        children: [
          {
            id: '2-7-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '2-7-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '2-99',
        label: '自定义规范',
        color: '#E6A23C',
        children: []
      },
      {
        id: '2-999',
        label: '其他规范',
        color: '#909399',
        children: []
      }
    ]
  },
  {
    id: '3',
    label: '水利工程',
    color: '#409EFF',
    children: [
      {
        id: '3-1',
        label: '综合规范',
        color: '#67C23A',
        children: [
          {
            id: '3-1-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-1-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-2',
        label: '测绘规范',
        color: '#67C23A',
        children: [
          {
            id: '3-2-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-2-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-3',
        label: '勘察规范',
        color: '#67C23A',
        children: [
          {
            id: '3-3-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-3-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-4',
        label: '设计规范',
        color: '#67C23A',
        children: [
          {
            id: '3-4-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-4-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-5',
        label: '施工规范',
        color: '#67C23A',
        children: [
          {
            id: '3-5-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-5-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-6',
        label: '运维规范',
        color: '#67C23A',
        children: [
          {
            id: '3-6-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-6-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-7',
        label: '数字化规范',
        color: '#67C23A',
        children: [
          {
            id: '3-7-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '3-7-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '3-99',
        label: '自定义规范',
        color: '#E6A23C',
        children: []
      },
      {
        id: '3-999',
        label: '其他规范',
        color: '#909399',
        children: []
      }
    ]
  },
  {
    id: '4',
    label: '铁路工程',
    color: '#F56C6C',
    children: [
      {
        id: '4-1',
        label: '综合规范',
        color: '#67C23A',
        children: [
          {
            id: '4-1-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-1-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-2',
        label: '测绘规范',
        color: '#67C23A',
        children: [
          {
            id: '4-2-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-2-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-3',
        label: '勘察规范',
        color: '#67C23A',
        children: [
          {
            id: '4-3-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-3-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-4',
        label: '设计规范',
        color: '#67C23A',
        children: [
          {
            id: '4-4-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-4-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-5',
        label: '施工规范',
        color: '#67C23A',
        children: [
          {
            id: '4-5-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-5-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-6',
        label: '运维规范',
        color: '#67C23A',
        children: [
          {
            id: '4-6-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-6-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-7',
        label: '数字化规范',
        color: '#67C23A',
        children: [
          {
            id: '4-7-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '4-7-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '4-99',
        label: '自定义规范',
        color: '#E6A23C',
        children: []
      },
      {
        id: '4-999',
        label: '其他规范',
        color: '#909399',
        children: []
      }
    ]
  },
  {
    id: '5',
    label: '公路工程',
    color: '#409EFF',
    children: [
      {
        id: '5-1',
        label: '综合规范',
        color: '#67C23A',
        children: [
          {
            id: '5-1-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-1-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-2',
        label: '测绘规范',
        color: '#67C23A',
        children: [
          {
            id: '5-2-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-2-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-3',
        label: '勘察规范',
        color: '#67C23A',
        children: [
          {
            id: '5-3-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-3-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-4',
        label: '设计规范',
        color: '#67C23A',
        children: [
          {
            id: '5-4-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-4-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-5',
        label: '施工规范',
        color: '#67C23A',
        children: [
          {
            id: '5-5-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-5-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-6',
        label: '运维规范',
        color: '#67C23A',
        children: [
          {
            id: '5-6-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-6-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-7',
        label: '数字化规范',
        color: '#67C23A',
        children: [
          {
            id: '5-7-99',
            label: '自定义规范',
            color: '#E6A23C',
            children: []
          },
          {
            id: '5-7-999',
            label: '其他规范',
            color: '#909399',
            children: []
          }
        ]
      },
      {
        id: '5-99',
        label: '自定义规范',
        color: '#E6A23C',
        children: []
      },
      {
        id: '5-999',
        label: '其他规范',
        color: '#909399',
        children: []
      }
    ]
  }
])

// 选中的节点
const selectedNode = ref(null)

// 默认展开的节点（仅展开到一级行业分类）
const defaultExpandedKeys = ref([
  '1', // 建筑工程
  '2', // 市政工程
  '3', // 水利工程
  '4', // 铁路工程
  '5'  // 公路工程
])

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuStyle = reactive<{ left?: string; top?: string }>({})
const contextMenuPosition = reactive({ x: 0, y: 0 })

// 排序相关
const currentSortType = ref('latest') // 默认按最新使用排序

// 智能匹配相关
const smartMatchDialogVisible = ref(false)
const isMatching = ref(false)
const smartMatchForm = reactive({
  matchMode: 'auto',
  matchScope: ['category', 'keyword'],
  customerConfig: 'default'
})
const matchResults = ref([])

// 处理节点点击
const handleNodeClick = (data: any, _node: any) => {
  selectedNode.value = data
  if (data.isSpec && data.specId) {
    // 导航到规范详情页
    router.push(`/spec-data/detail/${data.specId}`)
  } else {
    // 设置当前分类，在右侧显示该目录下的规范标准
    specStore.setCurrentCategory(data)
    console.log('设置当前分类:', data)
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

// 处理节点双击事件
const handleNodeDblClick = (data: any) => {
  // 打开重命名对话框
  const newLabel = prompt('请输入新的节点名称:', data.label)
  if (newLabel && newLabel.trim() !== '') {
    data.label = newLabel.trim()
  }
}



// 添加子节点
const addChildNode = () => {
  if (selectedNode.value) {
    const newLabel = prompt('请输入新的子节点名称:')
    if (newLabel && newLabel.trim() !== '') {
      // 确保children数组存在
      if (!selectedNode.value.children) {
        selectedNode.value.children = []
      }
      // 生成唯一ID
      const newId = `${selectedNode.value.id}-${selectedNode.value.children.length + 1}`
      // 添加新节点
      selectedNode.value.children.push({
        id: newId,
        label: newLabel.trim(),
        children: []
      })
    }
  }
  contextMenuVisible.value = false
}

// 添加兄弟节点
const addSiblingNode = () => {
  if (selectedNode.value) {
    const newLabel = prompt('请输入新的兄弟节点名称:')
    if (newLabel && newLabel.trim() !== '') {
      // 找到父节点
      let parentNode = null
      let parentChildren = null
      
      // 递归查找父节点
      const findParent = (nodes: any[], targetId: string) => {
        for (let node of nodes) {
          if (node.children) {
            if (node.children.some((child: any) => child.id === targetId)) {
              parentNode = node
              parentChildren = node.children
              return true
            }
            if (findParent(node.children, targetId)) {
              return true
            }
          }
        }
        return false
      }
      
      findParent(treeData.value, selectedNode.value.id)
      
      if (parentChildren) {
        // 生成唯一ID
        const newId = `${parentNode.id}-${parentChildren.length + 1}`
        // 添加新节点
        parentChildren.push({
          id: newId,
          label: newLabel.trim(),
          children: []
        })
      }
    }
  }
  contextMenuVisible.value = false
}

// 删除选中节点
const deleteSelectedNode = () => {
  if (selectedNode.value) {
    if (confirm('确定要删除这个节点吗？')) {
      // 找到父节点
      let parentNode = null
      let parentChildren = null
      
      // 递归查找父节点
      const findParent = (nodes: any[], targetId: string) => {
        for (let node of nodes) {
          if (node.children) {
            if (node.children.some((child: any) => child.id === targetId)) {
              parentNode = node
              parentChildren = node.children
              return true
            }
            if (findParent(node.children, targetId)) {
              return true
            }
          }
        }
        return false
      }
      
      findParent(treeData.value, selectedNode.value.id)
      
      if (parentChildren) {
        // 找到要删除的节点索引
        const index = parentChildren.findIndex((child: any) => child.id === selectedNode.value.id)
        if (index > -1) {
          // 删除节点
          parentChildren.splice(index, 1)
        }
      }
    }
  }
  contextMenuVisible.value = false
}

// 重命名选中节点
const renameSelectedNode = () => {
  if (selectedNode.value) {
    const newLabel = prompt('请输入新的节点名称:', selectedNode.value.label)
    if (newLabel && newLabel.trim() !== '') {
      selectedNode.value.label = newLabel.trim()
    }
  }
  contextMenuVisible.value = false
}

// 处理排序
const handleSort = (sortType: string) => {
  currentSortType.value = sortType
  sortTreeData(sortType)
}

// 排序树数据
const sortTreeData = (sortType: string) => {
  // 递归排序所有节点
  const sortNodes = (nodes: any[]) => {
    if (!nodes || nodes.length === 0) return
    
    // 按指定类型排序当前节点的子节点
    nodes.sort((a, b) => {
      // 自定义规范和其他规范始终排在最后
      if (a.label === '自定义规范') return 1
      if (b.label === '自定义规范') return -1
      if (a.label === '其他规范') return 1
      if (b.label === '其他规范') return -1
      
      // 根据排序类型进行排序
      switch (sortType) {
        case 'latest':
          // 模拟按最新使用时间排序，这里使用随机数模拟
          return (b.lastUsed || 0) - (a.lastUsed || 0)
        case 'popular':
          // 模拟按受欢迎程度排序，这里使用随机数模拟
          return (b.popularity || 0) - (a.popularity || 0)
        case 'important':
          // 模拟按重要性排序，这里使用随机数模拟
          return (b.importance || 0) - (a.importance || 0)
        default:
          return 0
      }
    })
    
    // 递归排序子节点
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children)
      }
    })
  }
  
  sortNodes(treeData.value)
}

// 为节点添加排序相关属性（模拟数据）
const addSortProperties = (nodes: any[]) => {
  nodes.forEach(node => {
    // 为每个节点添加排序相关属性
    node.lastUsed = Math.random() * 100 // 模拟最后使用时间
    node.popularity = Math.random() * 100 // 模拟受欢迎程度
    node.importance = Math.random() * 100 // 模拟重要性
    
    if (node.children && node.children.length > 0) {
      addSortProperties(node.children)
    }
  })
}

// 初始化时添加排序属性
addSortProperties(treeData.value)

// 过滤掉自定义规范和其他规范节点
const filterTreeData = (nodes: any[]) => {
  return nodes.filter(node => {
    // 过滤掉自定义规范和其他规范节点
    if (node.label === '自定义规范' || node.label === '其他规范') {
      return false
    }
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = filterTreeData(node.children)
    }
    return true
  })
}

// 执行过滤操作
treeData.value = filterTreeData(treeData.value)

// 处理智能匹配
const handleSmartMatch = () => {
  smartMatchDialogVisible.value = true
}

// 开始智能匹配
const startSmartMatch = () => {
  isMatching.value = true
  matchResults.value = []
  
  // 模拟智能匹配过程
  setTimeout(() => {
    // 模拟匹配结果
    matchResults.value = [
      {
        id: 1,
        specName: '建筑设计防火规范',
        matchNode: '建筑工程 > 设计规范',
        matchScore: '95%',
        specId: '1'
      },
      {
        id: 2,
        specName: '混凝土结构设计规范',
        matchNode: '建筑工程 > 设计规范',
        matchScore: '92%',
        specId: '2'
      },
      {
        id: 3,
        specName: '城市道路工程设计规范',
        matchNode: '市政工程 > 设计规范',
        matchScore: '88%',
        specId: '17'
      }
    ]
    isMatching.value = false
  }, 2000)
}

// 确认匹配
const confirmMatch = (result: any) => {
  console.log('确认匹配:', result)
  // 这里可以实现将规范挂接到对应节点的逻辑
  // 并保存到数据库
  
  // 模拟保存到数据库
  setTimeout(() => {
    ElMessage.success(`已将${result.specName}挂接到${result.matchNode}`)
  }, 1000)
}

// 取消匹配
const cancelMatch = (result: any) => {
  console.log('取消匹配:', result)
  // 从匹配结果中移除
  const index = matchResults.value.findIndex((item: any) => item.id === result.id)
  if (index > -1) {
    matchResults.value.splice(index, 1)
  }
}
</script>

<style lang="scss" scoped>
.spec-data-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  max-height: calc(100vh - 80px);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
  .header-actions {
    display: flex;
    align-items: center;
  }
  .sort-options {
    .sort-button {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #606266;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.3s;
      &:hover {
        background-color: #f5f7fa;
        color: #409EFF;
      }
    }
  }
}

.smart-match-content {
  .match-result {
    margin-top: 24px;
    h4 {
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
    }
  }
  .match-loading {
    margin-top: 24px;
    padding: 40px;
    text-align: center;
  }
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



.context-menu {
  position: fixed;
  width: 10px;
  height: 10px;
  background: transparent;
  z-index: 1000;
}

/* 自定义树节点连线样式 */
:deep(.el-tree-node__children) {
  position: relative;
  padding-left: 20px;
}

:deep(.el-tree-node) {
  position: relative;
}

:deep(.el-tree-node::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #d9d9d9;
  transform: scaleX(0.5);
}

:deep(.el-tree-node::after) {
  content: '';
  position: absolute;
  left: 0;
  top: 20px;
  width: 20px;
  height: 1px;
  background-color: #d9d9d9;
  transform: scaleY(0.5);
}

:deep(.el-tree-node:last-child::before) {
  height: 20px;
}
</style>