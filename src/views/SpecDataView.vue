<template>
  <div class="spec-data-view">
    <div class="page-header">
      <h2>规范标准</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleUpload">
          <el-icon><upload /></el-icon>
          上传规范标准
        </el-button>
        <div class="view-switch">
          <el-radio-group v-model="viewMode" @change="handleViewModeChange">
            <el-radio-button label="list">列表视图</el-radio-button>
            <el-radio-button label="card">卡片视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="规范名称">
          <el-input v-model="searchForm.name" placeholder="请输入规范名称" clearable @input="handleSearch" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="规范编号">
          <el-input v-model="searchForm.code" placeholder="请输入规范编号" clearable @input="handleSearch" style="width: 150px;" />
        </el-form-item>
        <el-form-item label="规范类型">
          <el-select v-model="searchForm.type" placeholder="请选择规范类型" clearable style="width: 150px;" @change="handleSearch">
            <el-option label="国家标准" value="GB" />
            <el-option label="行业标准" value="HB" />
            <el-option label="地方标准" value="DB" />
            <el-option label="企业标准" value="QB" />
            <el-option label="国际标准" value="ISO" />
          </el-select>
        </el-form-item>
        <el-form-item label="规范等级">
          <el-select v-model="searchForm.level" placeholder="请选择规范等级" clearable style="width: 150px;" @change="handleSearch">
            <el-option label="强制性标准" value="1" />
            <el-option label="推荐性标准" value="2" />
            <el-option label="指导性标准" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px;" @change="handleSearch">
            <el-option label="有效" value="1" />
            <el-option label="废止" value="0" />
            <el-option label="修订中" value="2" />
            <el-option label="待实施" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keywords" placeholder="请输入关键词" clearable @input="handleSearch" style="width: 150px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表视图 -->
    <el-card v-if="viewMode === 'list'" class="spec-list">
      <div class="batch-actions" style="margin-bottom: 16px;">
        <el-button type="primary" @click="handleBatchAddToTree" :disabled="selectedSpecs.length === 0">
          <el-icon><folder-add /></el-icon>
          批量添加到目录树
        </el-button>
        <el-button type="primary" @click="handleBatchDownload" :disabled="selectedSpecs.length === 0">
          <el-icon><download /></el-icon>
          批量下载
        </el-button>
        <span style="margin-left: 16px;">已选择 {{ selectedSpecs.length }} 项</span>
      </div>
      <el-table 
        :data="filteredSpecList" 
        style="width: 100%" 
        @selection-change="handleSelectionChange"
        stripe
        border
        :header-cell-style="{ backgroundColor: '#f5f7fa' }"
        :row-class-name="rowClassName"
        :height="tableHeight"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="规范名称" min-width="200">
          <template #default="scope">
            <router-link :to="`/spec-data/detail/${scope.row.id}`" class="spec-name">
              {{ scope.row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="规范编号" width="150" />
        <el-table-column prop="type" label="规范类型" width="120">
          <template #default="scope">
            <el-tag size="small">{{ getTypeText(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="规范等级" width="120">
          <template #default="scope">
            <el-tag size="small" type="warning">{{ getLevelText(scope.row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="implementationDate" label="实施日期" width="120" />
        <el-table-column prop="compilationUnit" label="编制单位" min-width="150" />
        <el-table-column prop="keywords" label="关键词" min-width="150">
          <template #default="scope">
            <el-tag size="small" v-for="keyword in (scope.row.keywords || '').split(',')" :key="keyword" class="keyword-tag">
              {{ keyword }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handlePreview(scope.row)">
                预览
              </el-button>
              <el-button size="small" @click="handleEdit(scope.row)">
                编辑
              </el-button>
              <el-dropdown>
                <el-button size="small">
                  更多 <el-icon class="el-icon-arrow-down"></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handlePreview(scope.row)">预览</el-dropdown-item>
                    <el-dropdown-item @click="handleHistory(scope.row)">历史版本</el-dropdown-item>
                    <el-dropdown-item @click="handleDownload(scope.row)">下载</el-dropdown-item>
                    <el-dropdown-item @click="handleConvert(scope.row)">格式转换</el-dropdown-item>
                    <el-dropdown-item @click="handleAddToTree(scope.row)">添加到目录树</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 卡片视图 -->
    <div v-else-if="viewMode === 'card'" class="spec-card-grid">
      <el-card v-for="spec in filteredSpecList" :key="spec.id" class="spec-card">
        <div class="spec-card-header">
          <h3 class="spec-card-title">
            <router-link :to="`/spec-data/detail/${spec.id}`">{{ spec.name }}</router-link>
          </h3>
          <el-tag :type="getStatusType(spec.status)">{{ getStatusText(spec.status) }}</el-tag>
        </div>
        <div class="spec-card-body">
          <p class="spec-code">规范编号：{{ spec.code }}</p>
          <p class="spec-type">规范类型：{{ getTypeText(spec.type) }}</p>
          <p class="spec-level">规范等级：{{ getLevelText(spec.level) }}</p>
          <p class="spec-date">实施日期：{{ spec.implementationDate }}</p>
          <p class="spec-unit">编制单位：{{ spec.compilationUnit }}</p>
          <div v-if="spec.keywords" class="spec-keywords">
            <span>关键词：</span>
            <el-tag size="small" v-for="keyword in spec.keywords.split(',')" :key="keyword" class="keyword-tag">
              {{ keyword }}
            </el-tag>
          </div>
          <p class="spec-desc" v-if="spec.description">{{ spec.description }}</p>
        </div>
        <div class="spec-card-footer">
          <el-button size="small" @click="handlePreview(spec)">预览</el-button>
          <el-button size="small" @click="handleEdit(spec)">编辑</el-button>
        </div>
      </el-card>
    </div>
    

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpecStore } from '../store/modules/spec'
import { FolderAdd, Upload, Download } from '@element-plus/icons-vue'

const router = useRouter()
const specStore = useSpecStore()

// 响应式数据
const viewMode = ref<'list' | 'card'>('list')
const searchForm = reactive({
  name: '',
  code: '',
  type: '',
  level: '',
  status: '',
  keywords: ''
})
const selectedSpecs = ref<any[]>([])
const tableHeight = ref('500px')

// 计算表格高度
const calculateTableHeight = () => {
  // 获取窗口高度
  const windowHeight = window.innerHeight
  // 计算表格高度，确保不少于10行（每行约40px）
  const minHeight = 400 // 10行 * 40px
  const calculatedHeight = windowHeight - 300 // 减去其他元素的高度
  tableHeight.value = `${Math.max(minHeight, calculatedHeight)}px`
}

// 初始化时计算表格高度
calculateTableHeight()

// 监听窗口大小变化
window.addEventListener('resize', calculateTableHeight)
// 计算属性：根据当前分类和搜索条件过滤规范标准
const filteredSpecList = computed(() => {
  let result = specList.value
  
  // 根据搜索条件过滤
  if (searchForm.name) {
    const name = searchForm.name.toLowerCase()
    result = result.filter(spec => spec.name.toLowerCase().includes(name))
  }
  
  if (searchForm.code) {
    const code = searchForm.code.toLowerCase()
    result = result.filter(spec => spec.code.toLowerCase().includes(code))
  }
  
  if (searchForm.type) {
    result = result.filter(spec => spec.type === searchForm.type)
  }
  
  if (searchForm.level) {
    result = result.filter(spec => spec.level === parseInt(searchForm.level))
  }
  
  if (searchForm.status) {
    result = result.filter(spec => spec.status === parseInt(searchForm.status))
  }
  
  if (searchForm.keywords) {
    const keywords = searchForm.keywords.toLowerCase()
    result = result.filter(spec => spec.keywords && spec.keywords.toLowerCase().includes(keywords))
  }
  
  // 根据当前分类过滤
  const currentCategory = specStore.currentCategory
  if (currentCategory && !currentCategory.isSpec) {
    // 这里可以根据分类ID或其他属性过滤规范标准
    // 暂时返回所有规范标准
  }
  
  return result
})

const specList = ref([
  {
    id: 1,
    name: '建筑设计防火规范',
    code: 'GB 50016-2014',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2015-05-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于新建、扩建和改建的建筑设计防火。',
    keywords: '建筑,防火,设计'
  },
  {
    id: 2,
    name: '混凝土结构设计规范',
    code: 'GB 50010-2010',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2011-07-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于房屋和一般构筑物的混凝土结构设计。'
  },
  {
    id: 3,
    name: '建筑抗震设计规范',
    code: 'GB 50011-2010',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2010-12-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于抗震设防烈度为6度至9度地区的建筑抗震设计。'
  },
  {
    id: 4,
    name: '建筑地基基础设计规范',
    code: 'GB 50007-2011',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2012-08-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于工业与民用建筑地基基础的设计。'
  },
  {
    id: 5,
    name: '砌体结构设计规范',
    code: 'GB 50003-2011',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2012-08-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于建筑工程的砌体结构和底部框架-抗震墙砌体房屋的设计。'
  },
  {
    id: 6,
    name: '钢结构设计标准',
    code: 'GB 50017-2017',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2018-07-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本标准适用于工业与民用建筑和一般构筑物的钢结构设计。'
  },
  {
    id: 7,
    name: '建筑结构荷载规范',
    code: 'GB 50009-2012',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2012-10-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于工业与民用建筑和一般构筑物的结构设计。'
  },
  {
    id: 8,
    name: '建筑抗震设防分类标准',
    code: 'GB 50223-2008',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2008-07-30',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本标准适用于新建、扩建、改建建筑工程的抗震设防分类。'
  },
  {
    id: 9,
    name: '建筑节能工程施工质量验收规范',
    code: 'GB 50411-2019',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2020-01-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于建筑节能工程施工质量的验收。'
  },
  {
    id: 10,
    name: '建筑装饰装修工程质量验收标准',
    code: 'GB 50210-2018',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2018-12-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本标准适用于建筑装饰装修工程的质量验收。'
  },
  {
    id: 11,
    name: '建筑工程施工质量验收统一标准',
    code: 'GB 50300-2013',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2014-06-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本标准适用于建筑工程施工质量的验收。'
  },
  {
    id: 12,
    name: '建筑电气工程施工质量验收规范',
    code: 'GB 50303-2015',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2016-08-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于建筑电气工程的施工质量验收。'
  },
  {
    id: 13,
    name: '建筑给水排水及采暖工程施工质量验收规范',
    code: 'GB 50242-2002',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2002-04-01',
    compilationUnit: '中华人民共和国建设部',
    description: '本规范适用于建筑给水排水及采暖工程的施工质量验收。'
  },
  {
    id: 14,
    name: '通风与空调工程施工质量验收规范',
    code: 'GB 50243-2016',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2017-07-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于通风与空调工程的施工质量验收。'
  },
  {
    id: 15,
    name: '智能建筑工程质量验收规范',
    code: 'GB 50339-2013',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2014-02-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于智能建筑工程的质量验收。'
  },
  {
    id: 16,
    name: '建筑边坡工程技术规范',
    code: 'GB 50330-2013',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2014-06-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于建筑边坡工程的设计、施工和检测。'
  },
  {
    id: 17,
    name: '城市道路工程设计规范',
    code: 'CJJ 37-2012',
    type: 'CJJ',
    level: 2,
    status: 1,
    implementationDate: '2012-10-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于城市道路工程的设计。'
  },
  {
    id: 18,
    name: '城市桥梁设计规范',
    code: 'CJJ 11-2011',
    type: 'CJJ',
    level: 2,
    status: 1,
    implementationDate: '2012-04-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于城市桥梁的设计。'
  },
  {
    id: 19,
    name: '城镇道路路面设计规范',
    code: 'CJJ 169-2012',
    type: 'CJJ',
    level: 2,
    status: 1,
    implementationDate: '2012-10-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于城镇道路路面的设计。'
  },
  {
    id: 20,
    name: '城市排水工程规划规范',
    code: 'GB 50318-2017',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2017-12-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于城市排水工程的规划。'
  }
])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 20
})

// 方法
const handleViewModeChange = (mode: 'list' | 'card') => {
  specStore.setViewMode(mode)
}

const handleSearch = () => {
  // 执行搜索逻辑
  console.log('搜索参数:', searchForm)
  // 由于使用了计算属性，过滤会自动执行
  // 这里可以调用API获取数据
}

const resetForm = () => {
  Object.assign(searchForm, {
    name: '',
    code: '',
    type: '',
    level: '',
    status: '',
    keywords: ''
  })
}

const handleUpload = () => {
  // 在新窗口中打开上传页面
  window.open('/spec-data/upload', '_blank', 'width=800,height=600')
}

const handleEdit = (spec: any) => {
  // 编辑规范，在新窗口中打开编辑页面
  console.log('编辑规范:', spec)
  // 模拟在新窗口中打开编辑页面
  window.open(`/spec-data/edit/${spec.id}`, '_blank', 'width=800,height=600')
}

const handleSelectionChange = (selection: any[]) => {
  selectedSpecs.value = selection
}

const handleAddToTree = (spec: any) => {
  // 添加规范到目录树，在新窗口中打开目录树选择页面
  console.log('添加规范到目录树:', spec)
  
  // 检查是否有多个规范被选择
  if (selectedSpecs.value.length > 1) {
    // 如果有多个规范被选择，传递所有被选择的规范ID
    const specIds = selectedSpecs.value.map((s: any) => s.id).join(',')
    window.open(`/spec-data/add-to-tree?specIds=${specIds}`, '_blank', 'width=900,height=700')
  } else {
    // 如果只有一个规范被选择，传递当前规范的ID
    window.open(`/spec-data/add-to-tree?specId=${spec.id}`, '_blank', 'width=900,height=700')
  }
}

const handleBatchAddToTree = () => {
  // 批量添加规范到目录树，在新窗口中打开目录树选择页面
  console.log('批量添加规范到目录树:', selectedSpecs.value)
  // 获取选中的规范ID列表
  const specIds = selectedSpecs.value.map((spec: any) => spec.id).join(',')
  // 在新窗口中打开目录树选择页面
  window.open(`/spec-data/add-to-tree?specIds=${specIds}`, '_blank', 'width=900,height=700')
}

const handleBatchDownload = () => {
  // 批量下载规范，在新窗口中打开下载页面
  console.log('批量下载规范:', selectedSpecs.value)
  // 获取选中的规范ID列表
  const specIds = selectedSpecs.value.map((spec: any) => spec.id).join(',')
  // 模拟在新窗口中打开下载页面
  window.open(`/spec-data/download?specIds=${specIds}`, '_blank', 'width=800,height=600')
}

const handlePreview = (spec: any) => {
  // 预览规范，在新窗口中打开PDF
  console.log('预览规范:', spec)
  // 模拟在新窗口中打开PDF
  window.open(`/spec-data/preview/${spec.id}`, '_blank', 'width=1000,height=800')
}

const handleHistory = (spec: any) => {
  // 查看历史版本，在新窗口中打开历史版本管理页面
  console.log('查看历史版本:', spec)
  // 模拟在新窗口中打开历史版本管理页面
  window.open(`/spec-data/history/${spec.id}`, '_blank', 'width=800,height=600')
}

const handleDownload = (spec: any) => {
  // 下载规范，在新窗口中打开下载页面
  console.log('下载规范:', spec)
  // 模拟在新窗口中打开下载页面
  window.open(`/spec-data/download?specId=${spec.id}`, '_blank', 'width=800,height=600')
}

const handleConvert = (spec: any) => {
  // 格式转换，在新窗口中打开格式转换页面
  console.log('格式转换:', spec)
  // 模拟在新窗口中打开格式转换页面
  window.open(`/spec-data/convert/${spec.id}`, '_blank', 'width=800,height=600')
}

const rowClassName = ({ rowIndex }: any) => {
  // 为偶数行添加不同的样式
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  // 重新获取数据
}

const handleCurrentChange = (current: number) => {
  pagination.page = current
  // 重新获取数据
}

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

const getLevelText = (level: number) => {
  const levelMap: Record<number, string> = {
    1: '强制性标准',
    2: '推荐性标准',
    3: '指导性标准'
  }
  return levelMap[level] || level
}

const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '废止',
    1: '有效',
    2: '修订中',
    3: '待实施'
  }
  return statusMap[status] || status
}

const getStatusType = (status: number) => {
  const statusTypeMap: Record<number, string> = {
    0: 'danger',
    1: 'success',
    2: 'warning',
    3: 'info'
  }
  return statusTypeMap[status] || ''
}

// 生命周期
onMounted(() => {
  // 初始化加载数据
  specStore.loadViewMode()
  viewMode.value = specStore.viewMode
})
</script>

<style lang="scss" scoped>
.spec-data-view {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-filter {
  margin-bottom: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.search-form {
  width: 100%;
}

.view-switch {
  margin-bottom: 0;
}

.spec-list {
  margin-bottom: 24px;
}

/* 自定义滚动条样式 */
.el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
}

.el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.pagination {
  margin-top: 24px;
  text-align: right;
}

.spec-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.spec-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  border: 2px solid transparent;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #409EFF, #67C23A, #E6A23C, #F56C6C);
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
    border-color: #409EFF;
    z-index: 10;
  }
}

.spec-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 20px 20px 0;
}

.spec-card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  margin-right: 12px;
  
  a {
    color: #303133;
    text-decoration: none;
    display: block;
    transition: all 0.3s ease;
    
    &:hover {
      color: #409EFF;
      transform: translateX(4px);
    }
  }
}

.spec-card-body {
  margin-bottom: 20px;
  padding: 0 20px;
  transition: all 0.3s ease;
}

.spec-card:hover .spec-card-body {
  transform: scale(1.05);
}

.spec-card-body p {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.spec-card-body p::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #409EFF;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.spec-card:hover .spec-card-body p::before {
  background-color: #67C23A;
  transform: scale(1.2);
}

.spec-code,
.spec-type,
.spec-level,
.spec-date,
.spec-unit {
  font-weight: 500;
  color: #303133;
}

.spec-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  border-left: 4px solid #409EFF;
  transition: all 0.3s ease;
}

.spec-card:hover .spec-desc {
  -webkit-line-clamp: 5;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.spec-keywords {
  margin: 16px 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  span {
    font-weight: 500;
    color: #303133;
  }
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.spec-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
  border-top: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.spec-card:hover .spec-card-footer {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.spec-card-footer .el-button {
  transition: all 0.3s ease;
  border-radius: 6px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.spec-name {
  color: #409EFF;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

/* 表格行样式 */
:deep(.even-row) {
  background-color: #f9f9f9;
}

:deep(.odd-row) {
  background-color: #ffffff;
}

/* 表格悬停效果 */
:deep(.el-table__row:hover) {
  background-color: #ecf5ff !important;
}
</style>