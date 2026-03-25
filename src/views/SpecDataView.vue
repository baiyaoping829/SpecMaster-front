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
      <div class="batch-actions">
        <div class="batch-left">
          <el-button type="primary" @click="handleBatchAddToTree" :disabled="selectedCount === 0">
            <el-icon><folder-add /></el-icon>
            <span class="btn-text">批量添加到目录树</span>
          </el-button>
          <el-button type="primary" @click="handleBatchDownload" :disabled="selectedCount === 0">
            <el-icon><download /></el-icon>
            <span class="btn-text">批量下载</span>
          </el-button>
          <span class="selected-hint">已选择 {{ selectedCount }} 项</span>
        </div>
        <div class="batch-right">
          <el-button type="primary" plain :loading="viewLatestLoading" @click="handleViewSpecifications">
            <el-icon><ViewIcon /></el-icon>
            <span class="btn-text">查看规范</span>
          </el-button>
          <el-button type="danger" plain :loading="deleteLoading" :disabled="selectedCount === 0" @click="handleDeleteSpecifications">
            <el-icon><DeleteIcon /></el-icon>
            <span class="btn-text">删除规范</span>
          </el-button>
        </div>
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
        ref="tableRef"
        :row-key="(row:any) => String(row.id)"
        :reserve-selection="true"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useSpecStore } from '../store/modules/spec'
import { FolderAdd, Upload, Download, View as ViewIcon, Delete as DeleteIcon } from '@element-plus/icons-vue'
import { specApi } from '../api/spec'
import { specificationsApi } from '../api/specifications'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { track } from '../utils/telemetry'
import { buildDeleteConfirmMessage, diffLatestItems, parseLatestCache } from '../features/specificationsActions'

const specStore = useSpecStore()

// 响应式数据
const viewMode = ref<'list' | 'card'>('list')
const loading = ref(false)
const viewLatestLoading = ref(false)
const deleteLoading = ref(false)
const tableRef = ref<any>(null)
const searchForm = reactive({
  name: '',
  code: '',
  type: '',
  level: '',
  status: '',
  keywords: ''
})
const selectedIdSet = ref<Set<string>>(new Set())
const selectedSpecCache = ref<Map<string, any>>(new Map())
const specList = ref<any[]>([])
const tableHeight = ref('500px')

const selectedCount = computed(() => selectedIdSet.value.size)
const selectedSpecs = computed(() => {
  const items: any[] = []
  for (const id of selectedIdSet.value) {
    const item = selectedSpecCache.value.get(String(id))
    if (item) items.push(item)
  }
  return items
})

const clearSelectionState = () => {
  selectedIdSet.value = new Set()
  tableRef.value?.clearSelection?.()
}
// 计算表格高度

// 计算表格高度
const calculateTableHeight = () => {
  // 获取窗口高度
  const windowHeight = window.innerHeight
  // 计算表格高度，确保不少于10行（每行约40px）
  const minHeight = 400 // 10行 * 40px
  const calculatedHeight = windowHeight - 300 // 减去其他元素的高度
  tableHeight.value = `${Math.max(minHeight, calculatedHeight)}px`
}

calculateTableHeight()
window.addEventListener('resize', calculateTableHeight)
onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
// 计算属性：根据当前分类和搜索条件过滤规范标准
const filteredSpecList = computed(() => {
  return specList.value
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 方法
const handleViewModeChange = (mode: 'list' | 'card') => {
  specStore.setViewMode(mode)
}

const loadSpecs = async () => {
  loading.value = true
  try {
    const res = await specApi.getSpecList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      code: searchForm.code || undefined,
      type: searchForm.type || undefined,
      level: searchForm.level || undefined,
      status: searchForm.status || undefined,
      keywords: searchForm.keywords || undefined
    })
    const items = Array.isArray(res.data?.items) ? res.data.items : []
    const mapped = items.map((s: any) => ({
      ...s,
      implementationDate: s.implementation_date || s.implementationDate,
      compilationUnit: s.compilation_unit || s.compilationUnit
    }))
    specList.value = mapped
    for (const row of mapped) {
      selectedSpecCache.value.set(String(row.id), row)
    }
    pagination.total = Number(res.data?.total || 0)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  clearSelectionState()
  loadSpecs()
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
  pagination.page = 1
  clearSelectionState()
  loadSpecs()
}

const handleViewSpecifications = async () => {
  if (viewLatestLoading.value) return
  track({ name: 'spec.view.click' })
  viewLatestLoading.value = true
  const run = async () => {
    const res = await specificationsApi.latest(3000, true)
    const items = Array.isArray(res.data?.items) ? res.data.items : []
    const cacheKey = 'spec_latest_cache'
    const prev = parseLatestCache(localStorage.getItem(cacheKey))
    const { newCount, next } = diffLatestItems(
      prev,
      items.map((it: any) => ({
        id: String(it.id),
        version: Number(it.version || 0),
        uploadTime: String(it.uploadTime || '')
      }))
    )
    localStorage.setItem(cacheKey, JSON.stringify(next))
    if (newCount > 0) {
      ElMessage.success(`发现 ${newCount} 条新规范`)
      track({ name: 'spec.view.success', newCount })
      await loadSpecs()
    } else {
      ElMessage.info('未发现新规范')
      track({ name: 'spec.view.success', newCount: 0 })
    }
  }

  try {
    await run()
  } catch (e: any) {
    track({ name: 'spec.view.failure', message: e?.message || 'error' })
    ElMessage.error('操作失败，请稍后重试')
    try {
      await ElMessageBox.confirm('网络异常或超时（3s）导致失败，是否重试？', '提示', {
        confirmButtonText: '重试',
        cancelButtonText: '取消',
        type: 'warning'
      })
      track({ name: 'spec.view.retry' })
      try {
        await run()
      } catch (e2: any) {
        track({ name: 'spec.view.failure', message: e2?.message || 'error', stage: 'retry' })
        ElMessage.error('操作失败，请稍后重试')
      }
    } catch {
    }
  } finally {
    viewLatestLoading.value = false
  }
}

const handleDeleteSpecifications = async () => {
  if (deleteLoading.value) return
  const ids = Array.from(selectedIdSet.value)
  if (!ids.length) return
  track({ name: 'spec.delete.click', count: ids.length })

  const names = selectedSpecs.value.map((s: any) => String(s?.name || s?.id)).filter(Boolean)
  const message = buildDeleteConfirmMessage(names)

  try {
    await ElMessageBox.confirm(message, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  const run = async () => {
    const res = await specificationsApi.delete(ids, 3000, true)
    const successIds = Array.isArray(res.data?.successIds) ? res.data.successIds : []
    const failed = Array.isArray(res.data?.failed) ? res.data.failed : []
    const successSet = new Set(successIds.map((x: any) => String(x)))
    if (successSet.size) {
      specList.value = (specList.value || []).filter((row: any) => !successSet.has(String(row.id)))
      pagination.total = Math.max(0, Number(pagination.total || 0) - successSet.size)
    }
    ElNotification({
      title: '删除结果',
      message: `成功删除 ${successIds.length} 条，失败 ${failed.length} 条`,
      type: failed.length ? 'warning' : 'success',
      position: 'bottom-right',
      duration: 3000
    })
    track({ name: 'spec.delete.success', success: successIds.length, failed: failed.length })
    clearSelectionState()
    await loadSpecs()
  }

  deleteLoading.value = true
  try {
    await run()
  } catch (e: any) {
    track({ name: 'spec.delete.failure', message: e?.message || 'error' })
    ElMessage.error('操作失败，请稍后重试')
    try {
      await ElMessageBox.confirm('网络异常或超时（3s）导致失败，是否重试？', '提示', {
        confirmButtonText: '重试',
        cancelButtonText: '取消',
        type: 'warning'
      })
      track({ name: 'spec.delete.retry' })
      try {
        await run()
      } catch (e2: any) {
        track({ name: 'spec.delete.failure', message: e2?.message || 'error', stage: 'retry' })
        ElMessage.error('操作失败，请稍后重试')
      }
    } catch {
    }
  } finally {
    deleteLoading.value = false
  }
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
  const currentPageIds = new Set((filteredSpecList.value || []).map((s: any) => String(s.id)))
  const selectedIds = new Set(selection.map((s: any) => String(s.id)))
  const next = new Set(selectedIdSet.value)
  for (const id of currentPageIds) {
    if (!selectedIds.has(id)) next.delete(id)
  }
  for (const id of selectedIds) {
    next.add(id)
  }
  selectedIdSet.value = next
}

const handleAddToTree = (spec: any) => {
  // 添加规范到目录树，在新窗口中打开目录树选择页面
  console.log('添加规范到目录树:', spec)
  
  // 检查是否有多个规范被选择
  if (selectedCount.value > 1) {
    // 如果有多个规范被选择，传递所有被选择的规范ID
    const specIds = Array.from(selectedIdSet.value).join(',')
    window.open(`/spec-data/add-to-tree?specIds=${specIds}`, '_blank', 'width=900,height=700')
  } else {
    // 如果只有一个规范被选择，传递当前规范的ID
    window.open(`/spec-data/add-to-tree?specId=${spec.id}`, '_blank', 'width=900,height=700')
  }
}

const handleBatchAddToTree = () => {
  // 批量添加规范到目录树，在新窗口中打开目录树选择页面
  // 获取选中的规范ID列表
  const specIds = Array.from(selectedIdSet.value).join(',')
  // 在新窗口中打开目录树选择页面
  window.open(`/spec-data/add-to-tree?specIds=${specIds}`, '_blank', 'width=900,height=700')
}

const handleBatchDownload = () => {
  // 批量下载规范，在新窗口中打开下载页面
  // 获取选中的规范ID列表
  const specIds = Array.from(selectedIdSet.value).join(',')
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
  pagination.page = 1
  loadSpecs()
}

const handleCurrentChange = (current: number) => {
  pagination.page = current
  loadSpecs()
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
  loadSpecs()
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

.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
  margin-bottom: 16px;
  overflow-x: auto;
  overflow-y: hidden;
}

.batch-left,
.batch-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  min-width: 0;
}

.selected-hint {
  margin-left: 4px;
  white-space: nowrap;
  color: #606266;
  font-size: 13px;
}

@media (max-width: 900px) {
  .btn-text {
    display: none;
  }

  .selected-hint {
    display: none;
  }
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
