<template>
  <div class="spec-data-add-to-tree">
    <div class="add-to-tree-container">
      <h2>添加规范到目录树</h2>
      
      <div class="main-content">
        <!-- 左侧目录树 -->
        <div class="tree-section">
          <h3>规范标准目录</h3>
          <div class="tree-container">
            <el-tree
              :data="treeData"
              node-key="id"
              @node-click="handleTreeNodeClick"
              :default-expanded-keys="defaultExpandedKeys"
            >
              <template #default="{ node, data }">
                <div class="tree-node" :style="{ color: data.color }">
                  <span>{{ node.label }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
        
        <!-- 右侧内容 -->
        <div class="right-content">
          <!-- 选择的规范标准清单 -->
          <div class="spec-list-section">
            <div class="list-header">
              <h3>已选择的规范标准</h3>
              <el-button size="small" type="danger" @click="deleteSelectedSpecs" :disabled="selectedSpecRows.length === 0">
                删除选中
              </el-button>
            </div>
            <el-table 
              :data="selectedSpecs" 
              style="width: 100%" 
              border 
              stripe
              @selection-change="handleSpecSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="规范名称" min-width="200" />
              <el-table-column prop="code" label="规范编号" width="150" />
              <el-table-column prop="type" label="规范类型" width="120">
                <template #default="scope">
                  <el-tag size="small">{{ getTypeText(scope.row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button size="small" type="danger" @click="deleteSpec(scope.row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 分类选择 -->
          <div class="category-section">
            <h3>选择目录分类</h3>
            <el-form :model="categoryForm" label-width="120px" class="category-form">
              <el-form-item label="行业分类" required>
                <el-select v-model="categoryForm.industry" placeholder="请选择行业分类" style="width: 200px;">
                  <el-option label="建筑工程" value="1" />
                  <el-option label="市政工程" value="2" />
                  <el-option label="水利工程" value="3" />
                  <el-option label="铁路工程" value="4" />
                  <el-option label="公路工程" value="5" />
                </el-select>
              </el-form-item>
              <el-form-item label="规范用途" required>
                <el-select v-model="categoryForm.purpose" placeholder="请选择规范用途" style="width: 200px;">
                  <el-option label="综合规范" value="1" />
                  <el-option label="测绘规范" value="2" />
                  <el-option label="勘察规范" value="3" />
                  <el-option label="设计规范" value="4" />
                  <el-option label="施工规范" value="5" />
                  <el-option label="运维规范" value="6" />
                  <el-option label="数字化规范" value="7" />
                </el-select>
              </el-form-item>
              <el-form-item label="三级分类">
                <el-input v-model="categoryForm.thirdLevel" placeholder="请输入三级分类名称（可选）" style="width: 200px;" />
              </el-form-item>
              <el-form-item label="智能匹配">
                <el-button type="info" @click="smartMatch" :loading="isMatching">
                  智能匹配分类
                </el-button>
                <span class="match-tip">点击后系统将根据规范内容智能推荐分类</span>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">确认挂接</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const selectedSpecs = ref<any[]>([])
const selectedSpecRows = ref<any[]>([])
const isSubmitting = ref(false)
const isMatching = ref(false)
const categoryForm = reactive({
  industry: '',
  purpose: '',
  thirdLevel: ''
})

// 目录树数据
const treeData = ref([
  {
    id: '1',
    label: '建筑工程',
    color: '#409EFF',
    level: 1,
    children: [
      {
        id: '1-1',
        label: '综合规范',
        color: '#67C23A',
        level: 2,
        children: [
          {
            id: '1-1-1',
            label: '建筑工程施工质量验收统一标准',
            isSpec: true,
            specId: '11'
          }
        ]
      },
      {
        id: '1-2',
        label: '测绘规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '1-3',
        label: '勘察规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '1-4',
        label: '设计规范',
        color: '#67C23A',
        level: 2,
        children: [
          {
            id: '1-4-1',
            label: '建筑设计防火规范',
            isSpec: true,
            specId: '1'
          }
        ]
      },
      {
        id: '1-5',
        label: '施工规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '1-6',
        label: '运维规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '1-7',
        label: '数字化规范',
        color: '#67C23A',
        level: 2,
        children: []
      }
    ]
  },
  {
    id: '2',
    label: '市政工程',
    color: '#F56C6C',
    level: 1,
    children: [
      {
        id: '2-1',
        label: '综合规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '2-2',
        label: '测绘规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '2-3',
        label: '勘察规范',
        color: '#67C23A',
        level: 2,
        children: []
      },
      {
        id: '2-4',
        label: '设计规范',
        color: '#67C23A',
        level: 2,
        children: []
      }
    ]
  },
  {
    id: '3',
    label: '水利工程',
    color: '#409EFF',
    level: 1,
    children: [
      {
        id: '3-1',
        label: '综合规范',
        color: '#67C23A',
        level: 2,
        children: []
      }
    ]
  },
  {
    id: '4',
    label: '铁路工程',
    color: '#F56C6C',
    level: 1,
    children: [
      {
        id: '4-1',
        label: '综合规范',
        color: '#67C23A',
        level: 2,
        children: []
      }
    ]
  },
  {
    id: '5',
    label: '公路工程',
    color: '#409EFF',
    level: 1,
    children: [
      {
        id: '5-1',
        label: '综合规范',
        color: '#67C23A',
        level: 2,
        children: []
      }
    ]
  }
])

// 默认展开的节点
const defaultExpandedKeys = ref(['1', '2', '3', '4', '5'])

// 方法
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'GB': '国家标准',
    'HB': '行业标准',
    'DB': '地方标准',
    'QB': '企业标准',
    'ISO': '国际标准'
  }
  return typeMap[type] || type
}

const handleSubmit = () => {
  // 验证表单
  if (!categoryForm.industry || !categoryForm.purpose) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  
  if (selectedSpecs.value.length === 0) {
    ElMessage.warning('请选择规范标准')
    return
  }
  
  isSubmitting.value = true
  
  // 模拟提交过程
  setTimeout(() => {
    console.log('挂接规范标准:', selectedSpecs.value)
    console.log('分类信息:', categoryForm)
    ElMessage.success(`成功挂接 ${selectedSpecs.value.length} 个规范标准到目录树`)
    // 关闭窗口
    window.close()
  }, 2000)
}

const handleCancel = () => {
  // 关闭窗口
  window.close()
}

// 处理表格选择变化
const handleSpecSelectionChange = (selection: any[]) => {
  selectedSpecRows.value = selection
}

// 删除单个规范
const deleteSpec = (spec: any) => {
  const index = selectedSpecs.value.findIndex(s => s.id === spec.id)
  if (index > -1) {
    selectedSpecs.value.splice(index, 1)
    ElMessage.success('已删除规范')
  }
}

// 删除选中的规范
const deleteSelectedSpecs = () => {
  if (selectedSpecRows.value.length === 0) {
    ElMessage.warning('请选择要删除的规范')
    return
  }
  
  const selectedIds = selectedSpecRows.value.map(spec => spec.id)
  selectedSpecs.value = selectedSpecs.value.filter(spec => !selectedIds.includes(spec.id))
  selectedSpecRows.value = []
  ElMessage.success(`已删除 ${selectedIds.length} 个规范`)
}

// 智能匹配分类
const smartMatch = () => {
  if (selectedSpecs.value.length === 0) {
    ElMessage.warning('请选择规范标准')
    return
  }
  
  isMatching.value = true
  
  // 模拟智能匹配过程
  setTimeout(() => {
    // 模拟智能匹配结果
    // 这里可以根据规范内容进行实际的智能匹配
    categoryForm.industry = '1' // 建筑工程
    categoryForm.purpose = '4' // 设计规范
    categoryForm.thirdLevel = '结构设计'
    
    ElMessage.success('智能匹配完成，请确认分类信息')
    isMatching.value = false
  }, 2000)
}

// 处理目录树节点点击
const handleTreeNodeClick = (data: any) => {
  // 只处理非规范节点
  if (data.isSpec) {
    return
  }
  
  // 根据节点层级填充分类信息
  if (data.level === 1) {
    // 行业分类
    categoryForm.industry = data.id
    categoryForm.purpose = ''
    categoryForm.thirdLevel = ''
  } else if (data.level === 2) {
    // 规范用途
    const industryId = data.id.split('-')[0]
    categoryForm.industry = industryId
    
    // 根据规范用途设置对应的值
    const purposeMap: Record<string, string> = {
      '综合规范': '1',
      '测绘规范': '2',
      '勘察规范': '3',
      '设计规范': '4',
      '施工规范': '5',
      '运维规范': '6',
      '数字化规范': '7'
    }
    categoryForm.purpose = purposeMap[data.label] || ''
    categoryForm.thirdLevel = ''
  } else if (data.level === 3) {
    // 三级分类
    const idParts = data.id.split('-')
    const industryId = idParts[0]
    const purposeId = idParts[1]
    
    categoryForm.industry = industryId
    
    // 根据规范用途设置对应的值
    const purposeMap: Record<string, string> = {
      '1': '1', // 综合规范
      '2': '2', // 测绘规范
      '3': '3', // 勘察规范
      '4': '4', // 设计规范
      '5': '5', // 施工规范
      '6': '6', // 运维规范
      '7': '7'  // 数字化规范
    }
    categoryForm.purpose = purposeMap[purposeId] || ''
    categoryForm.thirdLevel = data.label
  }
  
  ElMessage.success(`已选择分类：${data.label}`)
}

// 生命周期
onMounted(() => {
  // 从URL参数中获取选择的规范ID
  const urlParams = new URLSearchParams(window.location.search)
  const specIdsStr = urlParams.get('specIds') || urlParams.get('specId')
  
  if (specIdsStr) {
    const specIds = specIdsStr.split(',').map(id => parseInt(id))
    console.log('Selected spec IDs:', specIds)
    
    // 模拟获取规范数据
    // 实际项目中应该从API获取
    const mockSpecs = [
      { id: 1, name: '建筑设计防火规范', code: 'GB 50016-2014', type: 'GB' },
      { id: 2, name: '混凝土结构设计规范', code: 'GB 50010-2010', type: 'GB' },
      { id: 3, name: '建筑抗震设计规范', code: 'GB 50011-2010', type: 'GB' },
      { id: 4, name: '建筑地基基础设计规范', code: 'GB 50007-2011', type: 'GB' },
      { id: 5, name: '砌体结构设计规范', code: 'GB 50003-2011', type: 'GB' },
      { id: 6, name: '钢结构设计标准', code: 'GB 50017-2017', type: 'GB' },
      { id: 7, name: '建筑结构荷载规范', code: 'GB 50009-2012', type: 'GB' },
      { id: 8, name: '建筑抗震设防分类标准', code: 'GB 50223-2008', type: 'GB' },
      { id: 9, name: '建筑节能工程施工质量验收规范', code: 'GB 50411-2019', type: 'GB' },
      { id: 10, name: '建筑装饰装修工程质量验收标准', code: 'GB 50210-2018', type: 'GB' },
      { id: 11, name: '建筑工程施工质量验收统一标准', code: 'GB 50300-2013', type: 'GB' },
      { id: 12, name: '建筑电气工程施工质量验收规范', code: 'GB 50303-2015', type: 'GB' },
      { id: 13, name: '建筑给水排水及采暖工程施工质量验收规范', code: 'GB 50242-2002', type: 'GB' },
      { id: 14, name: '通风与空调工程施工质量验收规范', code: 'GB 50243-2016', type: 'GB' },
      { id: 15, name: '智能建筑工程质量验收规范', code: 'GB 50339-2013', type: 'GB' },
      { id: 16, name: '建筑边坡工程技术规范', code: 'GB 50330-2013', type: 'GB' },
      { id: 17, name: '城市道路工程设计规范', code: 'CJJ 37-2012', type: 'CJJ' },
      { id: 18, name: '城市桥梁设计规范', code: 'CJJ 11-2011', type: 'CJJ' },
      { id: 19, name: '城镇道路路面设计规范', code: 'CJJ 169-2012', type: 'CJJ' },
      { id: 20, name: '城市排水工程规划规范', code: 'GB 50318-2017', type: 'GB' }
    ]
    
    // 过滤出选择的规范
    selectedSpecs.value = mockSpecs.filter(spec => specIds.includes(spec.id))
    console.log('Filtered specs:', selectedSpecs.value)
  }
})
</script>

<style lang="scss" scoped>
.spec-data-add-to-tree {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
}

.add-to-tree-container {
  background-color: white;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.main-content {
  display: flex;
  gap: 32px;
  margin-top: 24px;
}

.tree-section {
  width: 300px;
  flex-shrink: 0;
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
  }
  .tree-container {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    height: 500px;
    overflow-y: auto;
  }
  .tree-node {
    display: flex;
    align-items: center;
    width: 100%;
  }
}

.right-content {
  flex: 1;
  min-width: 0;
}

.add-to-tree-container h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  text-align: center;
}

.spec-list-section {
  margin-bottom: 32px;
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }
}

.match-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.category-section {
  margin-bottom: 32px;
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
  }
}

.category-form {
  margin-bottom: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}
</style>