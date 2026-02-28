<template>
  <div class="spec-reader-theme-view">
    <div class="page-header">
      <h2>创建阅览主题</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addTheme">
          <el-icon><plus /></el-icon>
          新增主题
        </el-button>
      </div>
    </div>

    <!-- 主题管理区域 -->
    <div class="theme-management">
      <el-card shadow="hover" class="theme-card">
        <template #header>
          <div class="theme-header">
            <span>阅览主题库</span>
            <el-radio-group v-model="displayMode" size="small">
              <el-radio-button label="list">列表模式</el-radio-button>
              <el-radio-button label="folder">文件夹模式</el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <!-- 列表模式 -->
        <div v-if="displayMode === 'list'" class="theme-list">
          <el-table :data="themes" style="width: 100%">
            <el-table-column prop="name" label="主题名称" width="200" />
            <el-table-column prop="description" label="主题描述" />
            <el-table-column prop="specCount" label="规范数量" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="editTheme(scope.row)">
                  <el-icon><edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="deleteTheme(scope.row.id)">
                  <el-icon><delete /></el-icon>
                  删除
                </el-button>
                <el-button size="small" @click="openTheme(scope.row)">
                  <el-icon><folder-opened /></el-icon>
                  打开
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 文件夹模式 -->
        <div v-else class="theme-folders">
          <div class="folder-grid">
            <div v-for="theme in themes" :key="theme.id" class="folder-item" @click="openTheme(theme)">
              <div class="folder-icon">
                <el-icon class="icon"><folder /></el-icon>
              </div>
              <div class="folder-name">{{ theme.name }}</div>
              <div class="folder-info">{{ theme.specCount }} 个规范</div>
              <div class="folder-actions">
                <el-button size="small" circle @click.stop="editTheme(theme)">
                  <el-icon><edit /></el-icon>
                </el-button>
                <el-button size="small" circle type="danger" @click.stop="deleteTheme(theme.id)">
                  <el-icon><delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主题详情区域 -->
    <div v-if="currentTheme" class="theme-detail">
      <el-card shadow="hover" class="detail-card">
        <template #header>
          <div class="detail-header">
            <span>{{ currentTheme.name }} - 阅读清单</span>
            <el-button type="primary" size="small" @click="addSpecsToTheme">
              <el-icon><plus /></el-icon>
              添加规范
            </el-button>
          </div>
        </template>

        <el-table :data="currentTheme.specs" style="width: 100%">
          <el-table-column prop="name" label="规范名称" />
          <el-table-column prop="code" label="规范编号" width="150" />
          <el-table-column prop="issueDate" label="发布日期" width="120" />
          <el-table-column prop="effectiveDate" label="实施日期" width="120" />
          <el-table-column prop="note" label="附注" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="editSpecNote(scope.row)">
                <el-icon><edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="removeSpecFromTheme(scope.row.id)">
                <el-icon><delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 新增/编辑主题对话框 -->
    <el-dialog
      v-model="themeDialogVisible"
      :title="isEditingTheme ? '编辑主题' : '新增主题'"
      width="500px"
    >
      <el-form :model="themeForm" label-width="80px">
        <el-form-item label="主题名称">
          <el-input v-model="themeForm.name" placeholder="请输入主题名称" />
        </el-form-item>
        <el-form-item label="主题描述">
          <el-input v-model="themeForm.description" type="textarea" placeholder="请输入主题描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="themeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTheme">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加规范到主题对话框 -->
    <el-dialog
      v-model="addSpecDialogVisible"
      title="添加规范到主题"
      width="1000px"
      height="80vh"
    >
      <div class="add-spec-dialog-content">
        <div class="theme-selection">
          <h3>选择主题</h3>
          <el-select
            v-model="addSpecForm.themeIds"
            multiple
            placeholder="请选择要添加到的主题"
            style="width: 100%"
          >
            <el-option
              v-for="theme in themes"
              :key="theme.id"
              :label="theme.name"
              :value="theme.id"
            />
          </el-select>
        </div>
        
        <!-- 拖拽上传区域 -->
        <div class="upload-section">
          <h3>上传文档</h3>
          <el-upload
            class="upload-dragger"
            action="#"
            drag
            :auto-upload="false"
            :on-change="handleFileUpload"
            :file-list="uploadFiles"
            multiple
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传 PDF、DOCX、HTML 等格式的文档
              </div>
            </template>
          </el-upload>
          <el-checkbox v-model="addSpecForm.addToSpecData" style="margin-top: 16px;">
            将上传的文档添加到规范标准模块
          </el-checkbox>
          <el-button type="primary" style="margin-top: 16px;" @click="handleAddUploadedDocs">
            <el-icon><plus /></el-icon>
            添加上传文档功能
          </el-button>
        </div>
        
        <div class="spec-selection">
          <div class="spec-header">
            <h3>规范标准记录</h3>
            <div class="batch-actions">
              <el-button type="primary" @click="addSelectedSpecs" :disabled="selectedSpecs.length === 0">
                <el-icon><plus /></el-icon>
                添加选中规范
              </el-button>
              <span style="margin-left: 16px;">已选择 {{ selectedSpecs.length }} 项</span>
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
              <el-form-item>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 规范列表 -->
          <el-table 
            :data="filteredSpecList" 
            style="width: 100%"
            @selection-change="handleSpecSelectionChange"
            stripe
            border
            :header-cell-style="{ backgroundColor: '#f5f7fa' }"
            height="400"
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
            <el-table-column prop="level" label="规范等级" width="120">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.level === 1 ? 'danger' : 'info'">
                  {{ getLevelText(scope.row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag size="small" :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="implementationDate" label="实施日期" width="150" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="saveSpecsToTheme">完成</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑规范附注对话框 -->
    <el-dialog
      v-model="editNoteDialogVisible"
      title="编辑附注"
      width="500px"
    >
      <el-form :model="editNoteForm" label-width="80px">
        <el-form-item label="规范名称">
          <el-input v-model="editNoteForm.name" disabled />
        </el-form-item>
        <el-form-item label="附注">
          <el-input v-model="editNoteForm.note" type="textarea" placeholder="请输入附注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editNoteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSpecNote">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useReaderStore, Theme, Spec } from '../store/modules/reader'

// 响应式数据
const displayMode = ref('list')

// 使用reader store
const readerStore = useReaderStore()

// 计算属性获取主题列表
const themes = computed(() => readerStore.themes)

// 当前主题
const currentTheme = ref<Theme | null>(null)

// 对话框相关
const themeDialogVisible = ref(false)
const isEditingTheme = ref(false)
const themeForm = reactive({
  id: '',
  name: '',
  description: ''
})

const addSpecDialogVisible = ref(false)
const addSpecForm = reactive({
  themeIds: [] as string[],
  specIds: [] as string[],
  addToSpecData: false
})

// 上传文件列表
const uploadFiles = ref<any[]>([])

const editNoteDialogVisible = ref(false)
const editNoteForm = reactive({
  id: '',
  name: '',
  note: ''
})

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  type: '',
  level: '',
  status: ''
})

// 规范数据
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
    description: '本规范适用于新建、扩建和改建的建筑设计防火。'
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
    description: '本规范适用于钢筋混凝土和预应力混凝土结构的设计。'
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
    description: '本规范适用于建筑抗震设计。'
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
    description: '本规范适用于建筑地基基础的设计。'
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
    description: '本规范适用于砌体结构的设计。'
  },
  {
    id: 6,
    name: '建筑结构荷载规范',
    code: 'GB 50009-2012',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2012-10-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于建筑结构荷载的设计。'
  },
  {
    id: 7,
    name: '钢结构设计规范',
    code: 'GB 50017-2003',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2003-12-01',
    compilationUnit: '中华人民共和国建设部',
    description: '本规范适用于钢结构的设计。'
  },
  {
    id: 8,
    name: '建筑给水排水设计规范',
    code: 'GB 50015-2003',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2003-09-01',
    compilationUnit: '中华人民共和国建设部',
    description: '本规范适用于建筑给水排水的设计。'
  },
  {
    id: 9,
    name: '建筑照明设计标准',
    code: 'GB 50034-2013',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2014-06-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本标准适用于建筑照明的设计。'
  },
  {
    id: 10,
    name: '民用建筑热工设计规范',
    code: 'GB 50176-2016',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2017-04-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于民用建筑的热工设计。'
  },
  {
    id: 11,
    name: '建筑地面设计规范',
    code: 'GB 50037-2013',
    type: 'GB',
    level: 1,
    status: 1,
    implementationDate: '2014-06-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于建筑地面的设计。'
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

// 筛选后的规范列表
const filteredSpecList = computed(() => {
  return specList.value.filter(spec => {
    if (searchForm.name && !spec.name.includes(searchForm.name)) {
      return false
    }
    if (searchForm.code && !spec.code.includes(searchForm.code)) {
      return false
    }
    if (searchForm.type && spec.type !== searchForm.type) {
      return false
    }
    if (searchForm.level && spec.level !== parseInt(searchForm.level)) {
      return false
    }
    if (searchForm.status && spec.status !== parseInt(searchForm.status)) {
      return false
    }
    return true
  })
})

// 选择的规范
const selectedSpecs = ref<any[]>([])

// 可用规范（用于下拉选择）
const availableSpecs = computed(() => {
  return readerStore.availableSpecs
})

const loadingSpecs = ref(false)

// 生命周期钩子
onMounted(() => {
  // 初始化主题数据
  readerStore.initializeThemes()
  
  // 监听localStorage变化，确保跨窗口数据同步
  window.addEventListener('storage', (event) => {
    if (event.key === 'readerThemes') {
      readerStore.initializeThemes()
      // 如果当前正在查看某个主题，更新当前主题数据
      if (currentTheme.value) {
        const updatedTheme = readerStore.getThemeById(currentTheme.value.id)
        if (updatedTheme) {
          currentTheme.value = { ...updatedTheme }
        }
      }
    }
  })
})

// 方法
const addTheme = () => {
  isEditingTheme.value = false
  themeForm.id = ''
  themeForm.name = ''
  themeForm.description = ''
  themeDialogVisible.value = true
}

const editTheme = (theme: Theme) => {
  isEditingTheme.value = true
  themeForm.id = theme.id
  themeForm.name = theme.name
  themeForm.description = theme.description
  themeDialogVisible.value = true
}

const saveTheme = () => {
  if (isEditingTheme.value) {
    // 编辑主题
    const theme = readerStore.getThemeById(themeForm.id)
    if (theme) {
      const updatedTheme: Theme = {
        ...theme,
        name: themeForm.name,
        description: themeForm.description
      }
      readerStore.updateTheme(updatedTheme)
    }
  } else {
    // 新增主题
    readerStore.addTheme({
      name: themeForm.name,
      description: themeForm.description,
      specs: []
    })
  }
  themeDialogVisible.value = false
}

const deleteTheme = (id: string) => {
  readerStore.deleteTheme(id)
  if (currentTheme.value && currentTheme.value.id === id) {
    currentTheme.value = null
  }
}

const openTheme = (theme: Theme) => {
  currentTheme.value = { ...theme }
  readerStore.setCurrentTheme(theme)
}

const addSpecsToTheme = () => {
  addSpecForm.themeIds = []
  addSpecForm.specIds = []
  addSpecDialogVisible.value = true
}

const remoteSearchSpecs = (query: string) => {
  loadingSpecs.value = true
  // 模拟远程搜索
  setTimeout(() => {
    // 这里可以根据query过滤规范
    loadingSpecs.value = false
  }, 1000)
}

const saveSpecsToTheme = () => {
  // 检查是否选择了主题
  if (addSpecForm.themeIds.length === 0) {
    ElMessage.warning('请选择要添加到的主题')
    return
  }
  
  let successCount = 0
  
  // 处理选择的规范
  if (addSpecForm.specIds.length > 0) {
    // 遍历选中的主题，将规范添加到每个主题中
    addSpecForm.themeIds.forEach(themeId => {
      readerStore.addSpecsToTheme(themeId, addSpecForm.specIds)
      successCount += addSpecForm.specIds.length
    })
  }
  
  // 处理上传的文件
  if (uploadFiles.value.length > 0) {
    uploadFiles.value.forEach(file => {
      // 为上传的文件创建一个临时规范对象
      const newSpec: Spec = {
        id: `upload_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: file.name,
        code: '',
        issueDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        note: `上传文件: ${file.name}`
      }
      
      // 遍历选中的主题，将上传的文件添加到每个主题中
      addSpecForm.themeIds.forEach(themeId => {
        const theme = readerStore.getThemeById(themeId)
        if (theme) {
          // 检查是否已存在
          if (!theme.specs.some(s => s.id === newSpec.id)) {
            theme.specs.push(newSpec)
            theme.specCount = theme.specs.length
            readerStore.updateTheme(theme)
            successCount++
          }
        }
      })
      
      // 如果需要添加到规范标准模块
      if (addSpecForm.addToSpecData) {
        // 打开规范标准模块的上传页面
        setTimeout(() => {
          window.open('/spec-data/upload', '_blank', 'width=800,height=600')
        }, 1000)
      }
    })
  }
  
  // 显示成功提示
  if (successCount > 0) {
    ElMessage.success(`成功添加 ${successCount} 个规范到主题`)
  } else {
    ElMessage.warning('没有添加任何规范')
    return
  }
  
  // 重置表单
  addSpecForm.themeIds = []
  addSpecForm.specIds = []
  addSpecForm.addToSpecData = false
  uploadFiles.value = []
  selectedSpecs.value = []
  
  // 更新当前主题数据
  if (currentTheme.value) {
    const updatedTheme = readerStore.getThemeById(currentTheme.value.id)
    if (updatedTheme) {
      currentTheme.value = { ...updatedTheme }
    }
  }
  
  addSpecDialogVisible.value = false
}

// 处理文件上传
const handleFileUpload = (file: any) => {
  uploadFiles.value.push(file)
}

// 添加上传文档功能
const handleAddUploadedDocs = () => {
  // 检查是否选择了主题
  if (addSpecForm.themeIds.length === 0) {
    ElMessage.warning('请选择要添加到的主题')
    return
  }
  
  // 检查是否有上传的文件
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请先上传文档')
    return
  }
  
  let successCount = 0
  
  // 处理上传的文件
  uploadFiles.value.forEach(file => {
    // 为上传的文件创建一个临时规范对象
    const newSpec: Spec = {
      id: `upload_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: file.name,
      code: '',
      issueDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      note: `上传文件: ${file.name}`
    }
    
    // 遍历选中的主题，将上传的文件添加到每个主题中
    addSpecForm.themeIds.forEach(themeId => {
      const theme = readerStore.getThemeById(themeId)
      if (theme) {
        // 检查是否已存在
        if (!theme.specs.some(s => s.id === newSpec.id)) {
          theme.specs.push(newSpec)
          theme.specCount = theme.specs.length
          readerStore.updateTheme(theme)
          successCount++
        }
      }
    })
    
    // 如果需要添加到规范标准模块
    if (addSpecForm.addToSpecData) {
      // 打开规范标准模块的上传页面
      setTimeout(() => {
        window.open('/spec-data/upload', '_blank', 'width=800,height=600')
      }, 1000)
    }
  })
  
  // 显示成功提示
  if (successCount > 0) {
    ElMessage.success(`成功添加 ${successCount} 个文档到主题`)
  } else {
    ElMessage.warning('没有添加任何文档')
    return
  }
  
  // 重置上传文件列表
  uploadFiles.value = []
  
  // 更新当前主题数据
  if (currentTheme.value) {
    const updatedTheme = readerStore.getThemeById(currentTheme.value.id)
    if (updatedTheme) {
      currentTheme.value = { ...updatedTheme }
    }
  }
}

const editSpecNote = (spec: Spec) => {
  editNoteForm.id = spec.id
  editNoteForm.name = spec.name
  editNoteForm.note = spec.note
  editNoteDialogVisible.value = true
}

const saveSpecNote = () => {
  if (currentTheme.value) {
    // 使用reader store编辑规范附注
    readerStore.editSpecNote(currentTheme.value.id, editNoteForm.id, editNoteForm.note)
    
    // 更新当前主题数据
    const updatedTheme = readerStore.getThemeById(currentTheme.value.id)
    if (updatedTheme) {
      currentTheme.value = { ...updatedTheme }
    }
  }
  editNoteDialogVisible.value = false
}

const removeSpecFromTheme = (specId: string) => {
  if (currentTheme.value) {
    // 使用reader store从主题中移除规范
    readerStore.removeSpecFromTheme(currentTheme.value.id, specId)
    
    // 更新当前主题数据
    const updatedTheme = readerStore.getThemeById(currentTheme.value.id)
    if (updatedTheme) {
      currentTheme.value = { ...updatedTheme }
    }
  }
}

// 处理规范选择
const handleSpecSelectionChange = (selection: any[]) => {
  selectedSpecs.value = selection
}

// 添加选中的规范
const addSelectedSpecs = () => {
  // 将选中的规范ID添加到addSpecForm.specIds中
  const selectedSpecIds = selectedSpecs.value.map(spec => spec.id.toString())
  // 去重添加
  selectedSpecIds.forEach(id => {
    if (!addSpecForm.specIds.includes(id)) {
      addSpecForm.specIds.push(id)
    }
  })
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在filteredSpecList计算属性中实现
  console.log('搜索参数:', searchForm)
}

// 重置搜索表单
const resetForm = () => {
  Object.assign(searchForm, {
    name: '',
    code: '',
    type: '',
    level: '',
    status: ''
  })
}

// 获取规范类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'GB': '国家标准',
    'HB': '行业标准',
    'DB': '地方标准',
    'QB': '企业标准',
    'ISO': '国际标准',
    'CJJ': '行业标准'
  }
  return typeMap[type] || type
}

// 获取规范等级文本
const getLevelText = (level: number) => {
  const levelMap: Record<number, string> = {
    1: '强制性标准',
    2: '推荐性标准',
    3: '指导性标准'
  }
  return levelMap[level] || level.toString()
}

// 获取规范状态文本
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '废止',
    1: '有效',
    2: '修订中',
    3: '待实施'
  }
  return statusMap[status] || status.toString()
}

// 获取规范状态类型（用于标签样式）
const getStatusType = (status: number) => {
  const statusTypeMap: Record<number, string> = {
    0: 'danger',
    1: 'success',
    2: 'warning',
    3: 'info'
  }
  return statusTypeMap[status] || 'info'
}
</script>

<style lang="scss" scoped>
.spec-reader-theme-view {
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

.theme-management {
  margin-bottom: 24px;
}

.theme-card {
  margin-bottom: 24px;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.theme-folders {
  padding: 16px 0;
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.folder-item {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.folder-icon {
  margin-bottom: 16px;

  .icon {
    font-size: 48px;
    color: #409eff;
  }
}

.folder-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.folder-info {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}

.folder-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;

  .folder-item:hover & {
    opacity: 1;
  }
}

.theme-detail {
  margin-top: 24px;
}

.detail-card {
  width: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.add-spec-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 70vh;
  overflow-y: auto;
}

.theme-selection {
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.spec-selection {
  flex: 1;

  .spec-header {
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

    .batch-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .search-filter {
    margin-bottom: 16px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;
  }

  .search-form {
    width: 100%;
  }
}

.upload-section {
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .upload-dragger {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .folder-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .theme-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .spec-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .add-spec-dialog-content {
    height: 60vh;
  }
}
</style>