<template>
  <div class="spec-data-history">
    <div class="history-container">
      <div class="history-header">
        <h2>规范标准历史版本管理</h2>
        <div class="header-actions">
          <el-radio-group v-model="viewMode" @change="handleViewModeChange">
            <el-radio-button label="full">完整信息</el-radio-button>
            <el-radio-button label="simple">简化信息</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="handleAddVersion">
            <el-icon><plus /></el-icon>
            添加版本
          </el-button>
          <el-button type="primary" @click="handleCompareVersions" :disabled="selectedVersions.length !== 2">
            <el-icon><DocumentCopy /></el-icon>
            智能对比
          </el-button>
          <el-button @click="handleClose">关闭</el-button>
        </div>
      </div>
      
      <div class="spec-info">
        <h3>{{ specInfo.name }} ({{ specInfo.code }})</h3>
        <div class="spec-info-actions">
          <p>当前版本: {{ currentVersion?.version }} - {{ currentVersion?.publishDate }}</p>
          <div class="sort-control">
            <span>排序方式:</span>
            <el-select v-model="sortOrder" @change="handleSortChange" style="width: 120px; margin-left: 8px;">
              <el-option label="时间升序" value="asc" />
              <el-option label="时间降序" value="desc" />
            </el-select>
          </div>
        </div>
      </div>
      
      <div class="version-list">
        <el-card v-for="version in versionList" :key="version.id" :class="['version-card', version.status === '有效' ? 'status-active' : version.status === '废止' ? 'status-inactive' : '']">
          <div class="version-header">
            <div class="version-info">
              <h4>版本 {{ version.version }}</h4>
              <p>{{ version.publishDate }} - {{ version.status }}</p>
            </div>
            <div class="version-actions">
              <el-checkbox v-model="version.selected" @change="handleVersionSelect(version)"></el-checkbox>
              <el-button size="small" @click="handleEditVersion(version)">编辑</el-button>
              <el-button size="small" @click="handleUploadPDF(version)">上传PDF</el-button>
              <el-button size="small" type="primary" @click="handlePreviewPDF(version)">预览</el-button>
            </div>
          </div>
          
          <div class="version-content" v-if="viewMode === 'full'">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="规范名称">{{ version.name }}</el-descriptions-item>
              <el-descriptions-item label="规范编号">{{ version.code }}</el-descriptions-item>
              <el-descriptions-item label="规范类型">{{ getTypeText(version.type) }}</el-descriptions-item>
              <el-descriptions-item label="规范等级">{{ getLevelText(version.level) }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ version.status }}</el-descriptions-item>
              <el-descriptions-item label="实施日期">{{ version.implementationDate }}</el-descriptions-item>
              <el-descriptions-item label="编制单位" :span="2">{{ version.compilationUnit }}</el-descriptions-item>
              <el-descriptions-item label="关键词" :span="2">{{ version.keywords }}</el-descriptions-item>
              <el-descriptions-item label="规范描述" :span="2">{{ version.description }}</el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="version-content" v-else-if="viewMode === 'simple'">
            <div class="simple-info">
              <p><strong>规范名称:</strong> {{ version.name }}</p>
              <p><strong>规范编号:</strong> {{ version.code }}</p>
              <p><strong>发布日期:</strong> {{ version.publishDate }}</p>
              <p><strong>状态:</strong> {{ version.status }}</p>
            </div>
          </div>
          
          <div class="version-changes" v-if="version.changes">
            <h5>版本变化:</h5>
            <div class="changes-content">{{ version.changes }}</div>
          </div>
        </el-card>
      </div>
      
      <!-- 智能对比结果 -->
      <el-dialog
        v-model="compareDialogVisible"
        title="版本智能对比结果"
        width="80%"
      >
        <div v-if="compareLoading" class="loading-container">
          <el-spinner size="large" />
          <p>智能对比中...</p>
        </div>
        <div v-else-if="compareResult" class="compare-result">
          <h4>对比结果: {{ compareResult.versions }}</h4>
          <el-divider />
          <div class="compare-section">
            <h5>修订内容:</h5>
            <div class="content-block">{{ compareResult.changes }}</div>
          </div>
          <el-divider />
          <div class="compare-section">
            <h5>使用注意事项:</h5>
            <div class="content-block">{{ compareResult.notices }}</div>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="compareDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 上传PDF对话框 -->
      <el-dialog
        v-model="uploadDialogVisible"
        title="上传PDF文件"
        width="60%"
      >
        <el-upload
          class="upload-demo"
          action="#"
          :on-change="handleFileUpload"
          :auto-upload="false"
          accept=".pdf"
        >
          <el-button type="primary">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              请上传PDF格式的规范文件
            </div>
          </template>
        </el-upload>
        <div v-if="selectedFile" class="selected-file">
          <el-tag>{{ selectedFile.name }}</el-tag>
          <el-button size="small" type="danger" @click="selectedFile = null">删除</el-button>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="uploadDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmUpload" :loading="isUploading">确认上传</el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 添加版本对话框 -->
      <el-dialog
        v-model="addVersionDialogVisible"
        title="添加新版本"
        width="80%"
      >
        <el-form :model="newVersionForm" label-width="120px" class="add-version-form">
          <el-form-item label="版本号" required>
            <el-input v-model="newVersionForm.version" placeholder="请输入版本号" />
          </el-form-item>
          <el-form-item label="规范名称" required>
            <el-input v-model="newVersionForm.name" placeholder="请输入规范名称" />
          </el-form-item>
          <el-form-item label="规范编号" required>
            <el-input v-model="newVersionForm.code" placeholder="请输入规范编号" />
          </el-form-item>
          <el-form-item label="规范类型" required>
            <el-select v-model="newVersionForm.type" placeholder="请选择规范类型">
              <el-option label="国家标准" value="GB" />
              <el-option label="行业标准" value="HB" />
              <el-option label="地方标准" value="DB" />
              <el-option label="企业标准" value="QB" />
              <el-option label="国际标准" value="ISO" />
            </el-select>
          </el-form-item>
          <el-form-item label="规范等级" required>
            <el-select v-model="newVersionForm.level" placeholder="请选择规范等级">
              <el-option label="强制性标准" value="1" />
              <el-option label="推荐性标准" value="2" />
              <el-option label="指导性标准" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" required>
            <el-select v-model="newVersionForm.status" placeholder="请选择状态">
              <el-option label="有效" value="有效" />
              <el-option label="废止" value="废止" />
              <el-option label="修订中" value="修订中" />
              <el-option label="待实施" value="待实施" />
            </el-select>
          </el-form-item>
          <el-form-item label="发布日期" required>
            <el-date-picker
              v-model="newVersionForm.publishDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="实施日期" required>
            <el-date-picker
              v-model="newVersionForm.implementationDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="编制单位" required>
            <el-input v-model="newVersionForm.compilationUnit" placeholder="请输入编制单位" />
          </el-form-item>
          <el-form-item label="规范描述">
            <el-input
              v-model="newVersionForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入规范描述"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="newVersionForm.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
          </el-form-item>
          <el-form-item label="上传PDF文件" required>
            <el-upload
              class="upload-demo"
              action="#"
              :on-change="handleAddVersionFileUpload"
              :auto-upload="false"
              accept=".pdf"
            >
              <el-button type="primary">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  请上传PDF格式的规范文件，系统将自动提取信息进行智能填充
                </div>
              </template>
            </el-upload>
            <div v-if="addVersionFile" class="selected-file">
              <el-tag>{{ addVersionFile.name }}</el-tag>
              <el-button size="small" type="danger" @click="addVersionFile = null">删除</el-button>
            </div>
          </el-form-item>
          <el-form-item label="智能填充">
            <el-button type="info" @click="autoFillFromPDF" :loading="isAutoFilling">
              从PDF提取信息
            </el-button>
            <span class="auto-fill-tip">点击后系统将自动从上传的PDF文件中提取信息填充表单</span>
          </el-form-item>
          <el-form-item label="版本变化">
            <el-input
              v-model="newVersionForm.changes"
              type="textarea"
              :rows="3"
              placeholder="请输入版本变化内容"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addVersionDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleAddVersionConfirm" :loading="isAddingVersion">确认添加</el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 编辑版本对话框 -->
      <el-dialog
        v-model="editVersionDialogVisible"
        title="编辑版本"
        width="80%"
      >
        <el-form :model="editVersionForm" label-width="120px" class="edit-version-form">
          <el-form-item label="版本号" required>
            <el-input v-model="editVersionForm.version" placeholder="请输入版本号" />
          </el-form-item>
          <el-form-item label="规范名称" required>
            <el-input v-model="editVersionForm.name" placeholder="请输入规范名称" />
          </el-form-item>
          <el-form-item label="规范编号" required>
            <el-input v-model="editVersionForm.code" placeholder="请输入规范编号" />
          </el-form-item>
          <el-form-item label="规范类型" required>
            <el-select v-model="editVersionForm.type" placeholder="请选择规范类型">
              <el-option label="国家标准" value="GB" />
              <el-option label="行业标准" value="HB" />
              <el-option label="地方标准" value="DB" />
              <el-option label="企业标准" value="QB" />
              <el-option label="国际标准" value="ISO" />
            </el-select>
          </el-form-item>
          <el-form-item label="规范等级" required>
            <el-select v-model="editVersionForm.level" placeholder="请选择规范等级">
              <el-option label="强制性标准" value="1" />
              <el-option label="推荐性标准" value="2" />
              <el-option label="指导性标准" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" required>
            <el-select v-model="editVersionForm.status" placeholder="请选择状态">
              <el-option label="有效" value="有效" />
              <el-option label="废止" value="废止" />
              <el-option label="修订中" value="修订中" />
              <el-option label="待实施" value="待实施" />
            </el-select>
          </el-form-item>
          <el-form-item label="发布日期" required>
            <el-date-picker
              v-model="editVersionForm.publishDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="实施日期" required>
            <el-date-picker
              v-model="editVersionForm.implementationDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="编制单位" required>
            <el-input v-model="editVersionForm.compilationUnit" placeholder="请输入编制单位" />
          </el-form-item>
          <el-form-item label="规范描述">
            <el-input
              v-model="editVersionForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入规范描述"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="editVersionForm.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
          </el-form-item>
          <el-form-item label="版本变化">
            <el-input
              v-model="editVersionForm.changes"
              type="textarea"
              :rows="3"
              placeholder="请输入版本变化内容"
            />
          </el-form-item>
          <el-form-item label="自动校审">
            <el-button type="info" @click="autoReview" :loading="isReviewing">
              智能校审
            </el-button>
            <span class="auto-fill-tip">点击后系统将自动校审表单内容</span>
          </el-form-item>
          <el-form-item v-if="reviewResult.length > 0" label="校审结果">
            <div class="review-result">
              <el-alert
                v-for="(item, index) in reviewResult"
                :key="index"
                :title="item.field"
                :description="item.suggestion"
                :type="item.type"
                show-icon
                :closable="false"
                style="margin-bottom: 12px"
              />
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editVersionDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleEditVersionConfirm" :loading="isEditingVersion">确认保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, DocumentCopy } from '@element-plus/icons-vue'

// 类型定义
interface Version {
  id: string;
  version: string;
  name: string;
  code: string;
  type: string;
  level: string;
  status: string;
  publishDate: string;
  implementationDate: string;
  compilationUnit: string;
  description: string;
  keywords: string;
  pdfUrl: string;
  selected: boolean;
  changes: string;
}

interface CompareResult {
  versions: string;
  changes: string;
  notices: string;
}

// 响应式数据
const route = useRoute()
const viewMode = ref<'full' | 'simple'>('full')
const selectedVersions = ref<string[]>([])
const compareDialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const addVersionDialogVisible = ref(false)
const editVersionDialogVisible = ref(false)
const compareLoading = ref(false)
const isUploading = ref(false)
const isAutoFilling = ref(false)
const isAddingVersion = ref(false)
const isEditingVersion = ref(false)
const isReviewing = ref(false)
const selectedFile = ref<File | null>(null)
const addVersionFile = ref<File | null>(null)
const currentUploadVersion = ref<Version | null>(null)
const currentEditVersion = ref<Version | null>(null)
const sortOrder = ref<'asc' | 'desc'>('desc')

// 新版本表单
const newVersionForm = reactive({
  version: '',
  name: '',
  code: '',
  type: '',
  level: '',
  status: '有效',
  publishDate: '',
  implementationDate: '',
  compilationUnit: '',
  description: '',
  keywords: '',
  changes: ''
})

// 编辑版本表单
const editVersionForm = reactive({
  version: '',
  name: '',
  code: '',
  type: '',
  level: '',
  status: '有效',
  publishDate: '',
  implementationDate: '',
  compilationUnit: '',
  description: '',
  keywords: '',
  changes: ''
})

// 校审结果
const reviewResult = ref<any[]>([])

// 规范信息
const specInfo = reactive({
  id: '',
  name: '',
  code: ''
})

// 当前版本
const currentVersion = ref<Version | null>(null)

// 版本列表
const versionList = ref<Version[]>([
  {
    id: 'v1',
    version: '1.0',
    name: '建筑设计防火规范',
    code: 'GB 50016-2014',
    type: 'GB',
    level: '1',
    status: '有效',
    publishDate: '2014-08-27',
    implementationDate: '2015-05-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于新建、扩建和改建的建筑设计防火。',
    keywords: '建筑,防火,设计',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    selected: false,
    changes: '首次发布'
  },
  {
    id: 'v2',
    version: '1.1',
    name: '建筑设计防火规范',
    code: 'GB 50016-2014',
    type: 'GB',
    level: '1',
    status: '有效',
    publishDate: '2018-12-31',
    implementationDate: '2019-07-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于新建、扩建和改建的建筑设计防火。增加了部分条款的详细说明。',
    keywords: '建筑,防火,设计,安全',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    selected: false,
    changes: '1. 增加了关于高层建筑防火设计的详细条款\n2. 优化了消防设施配置要求\n3. 调整了部分防火等级划分标准'
  },
  {
    id: 'v3',
    version: '2.0',
    name: '建筑设计防火规范',
    code: 'GB 50016-2022',
    type: 'GB',
    level: '1',
    status: '有效',
    publishDate: '2022-08-27',
    implementationDate: '2023-03-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于新建、扩建和改建的建筑设计防火。全面修订了防火设计标准和要求。',
    keywords: '建筑,防火,设计,安全,标准',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    selected: false,
    changes: '1. 全面修订了建筑防火设计标准\n2. 增加了新型建筑材料的防火要求\n3. 优化了消防系统设计规范\n4. 调整了防火分区划分标准'
  }
])

// 对比结果
const compareResult = ref<CompareResult | null>(null)

// 计算当前版本
const computeCurrentVersion = () => {
  if (versionList.value.length > 0) {
    currentVersion.value = versionList.value[0] || null
  }
}

// 加载规范信息
const loadSpecData = () => {
  const specId = route.params.id as string
  
  // 模拟加载过程
  setTimeout(() => {
    specInfo.id = specId
    specInfo.name = '建筑设计防火规范'
    specInfo.code = 'GB 50016'
    // 排序版本
    sortVersions()
    // 计算当前版本
    computeCurrentVersion()
  }, 500)
}

// 切换视图模式
const handleViewModeChange = (mode: 'full' | 'simple') => {
  viewMode.value = mode
}

// 选择版本
const handleVersionSelect = (version: any) => {
  if (version.selected) {
    if (selectedVersions.value.length < 2) {
      selectedVersions.value.push(version.id)
    } else {
      version.selected = false
      ElMessage.warning('最多只能选择两个版本进行对比')
    }
  } else {
    selectedVersions.value = selectedVersions.value.filter(id => id !== version.id)
  }
}

// 智能对比
const handleCompareVersions = () => {
  if (selectedVersions.value.length !== 2) {
    ElMessage.warning('请选择两个版本进行对比')
    return
  }
  
  compareDialogVisible.value = true
  compareLoading.value = true
  
  // 模拟智能对比过程
  setTimeout(() => {
    compareResult.value = {
      versions: '版本 1.1 vs 版本 2.0',
      changes: '1. 规范编号从 GB 50016-2014 变更为 GB 50016-2022\n2. 全面修订了建筑防火设计标准，提高了防火要求\n3. 增加了新型建筑材料的防火要求，适应现代建筑发展\n4. 优化了消防系统设计规范，提高了系统可靠性\n5. 调整了防火分区划分标准，更加科学合理',
      notices: '1. 新版本对防火设计要求更加严格，设计单位需要重新评估现有设计\n2. 消防设施配置需要按照新规范进行调整\n3. 对于正在建设中的项目，需要根据进度情况决定是否按照新版本执行\n4. 建议组织设计人员学习新版本的主要变化，确保设计符合要求\n5. 新版本实施后，旧版本将逐步废止，请注意及时更新设计依据'
    }
    compareLoading.value = false
  }, 2000)
}

// 预览PDF
const handlePreviewPDF = (version: any) => {
  window.open(version.pdfUrl, '_blank', 'width=1000,height=800')
}

// 上传PDF
const handleUploadPDF = (version: any) => {
  currentUploadVersion.value = version
  uploadDialogVisible.value = true
}

// 处理文件上传
const handleFileUpload = (file: any) => {
  selectedFile.value = file.raw
}

// 确认上传
const handleConfirmUpload = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择PDF文件')
    return
  }
  
  isUploading.value = true
  
  // 模拟上传过程
  setTimeout(() => {
    if (currentUploadVersion.value) {
      currentUploadVersion.value.pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      ElMessage.success('PDF上传成功')
    }
    uploadDialogVisible.value = false
    isUploading.value = false
    selectedFile.value = null
    currentUploadVersion.value = null
  }, 1500)
}



// 处理排序变化
const handleSortChange = (order: 'asc' | 'desc') => {
  sortOrder.value = order
  sortVersions()
}

// 排序版本
const sortVersions = () => {
  versionList.value.sort((a, b) => {
    const dateA = new Date(a.implementationDate).getTime()
    const dateB = new Date(b.implementationDate).getTime()
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
  })
  // 更新当前版本
  computeCurrentVersion()
}

// 处理添加版本文件上传
const handleAddVersionFileUpload = (file: any) => {
  addVersionFile.value = file.raw
}

// 从PDF提取信息
const autoFillFromPDF = () => {
  if (!addVersionFile.value) {
    ElMessage.warning('请先选择PDF文件')
    return
  }
  
  isAutoFilling.value = true
  
  // 模拟智能填充过程
  setTimeout(() => {
    // 模拟从PDF中提取的信息
    newVersionForm.name = '智能填充的规范名称'
    newVersionForm.code = 'GB 12345-2024'
    newVersionForm.type = 'GB'
    newVersionForm.level = '1'
    newVersionForm.publishDate = '2024-01-01'
    newVersionForm.implementationDate = '2024-07-01'
    newVersionForm.compilationUnit = '智能填充的编制单位'
    newVersionForm.description = '智能填充的规范描述'
    newVersionForm.keywords = '智能,填充,规范'
    newVersionForm.changes = '1. 智能填充的版本变化内容\n2. 智能填充的版本变化内容'
    
    ElMessage.success('智能填充完成')
    isAutoFilling.value = false
  }, 2000)
}

// 自动校审
const autoReview = () => {
  isReviewing.value = true
  reviewResult.value = []
  
  // 模拟智能校审过程
  setTimeout(() => {
    // 模拟校审结果
    const results = []
    
    // 检查版本号
    if (editVersionForm.version && !/^\d+\.\d+$/.test(editVersionForm.version)) {
      results.push({
        field: '版本号',
        suggestion: '版本号格式不正确，建议使用数字格式（如：1.0）',
        type: 'warning'
      })
    }
    
    // 检查规范编号
    if (editVersionForm.code && !/^[A-Z]+\s+\d+-\d+$/.test(editVersionForm.code)) {
      results.push({
        field: '规范编号',
        suggestion: '规范编号格式不正确，建议使用标准格式（如：GB 50016-2014）',
        type: 'error'
      })
    }
    
    // 检查实施日期
    if (editVersionForm.implementationDate) {
      const date = new Date(editVersionForm.implementationDate)
      const currentDate = new Date()
      if (date > currentDate) {
        results.push({
          field: '实施日期',
          suggestion: '实施日期不能晚于当前日期',
          type: 'error'
        })
      }
    }
    
    // 检查关键词
    if (editVersionForm.keywords && editVersionForm.keywords.split(',').length > 10) {
      results.push({
        field: '关键词',
        suggestion: '关键词数量过多，建议控制在10个以内',
        type: 'warning'
      })
    }
    
    // 检查描述
    if (editVersionForm.description && editVersionForm.description.length < 20) {
      results.push({
        field: '规范描述',
        suggestion: '规范描述过短，建议详细描述规范的适用范围和内容',
        type: 'warning'
      })
    }
    
    reviewResult.value = results
    isReviewing.value = false
    
    if (results.length === 0) {
      ElMessage.success('未发现需要校审的内容')
    }
  }, 1500)
}

// 确认添加版本
const handleAddVersionConfirm = () => {
  // 验证表单
  if (!newVersionForm.version || !newVersionForm.name || !newVersionForm.code || !newVersionForm.type || !newVersionForm.level || !newVersionForm.status || !newVersionForm.publishDate || !newVersionForm.implementationDate || !newVersionForm.compilationUnit) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  
  if (!addVersionFile.value) {
    ElMessage.warning('请上传PDF文件')
    return
  }
  
  isAddingVersion.value = true
  
  // 模拟添加过程
  setTimeout(() => {
    const newVersion: Version = {
      id: `v${versionList.value.length + 1}`,
      version: newVersionForm.version,
      name: newVersionForm.name,
      code: newVersionForm.code,
      type: newVersionForm.type,
      level: newVersionForm.level,
      status: newVersionForm.status,
      publishDate: newVersionForm.publishDate,
      implementationDate: newVersionForm.implementationDate,
      compilationUnit: newVersionForm.compilationUnit,
      description: newVersionForm.description,
      keywords: newVersionForm.keywords,
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      selected: false,
      changes: newVersionForm.changes
    }
    
    // 如果新版本是有效状态，将其他版本设置为废止
    if (newVersion.status === '有效') {
      versionList.value.forEach(version => {
        version.status = '废止'
      })
    }
    
    // 添加到版本列表
    versionList.value.push(newVersion)
    // 排序版本
    sortVersions()
    // 更新当前版本
    computeCurrentVersion()
    
    ElMessage.success('版本添加成功')
    addVersionDialogVisible.value = false
    isAddingVersion.value = false
    
    // 重置表单
    Object.assign(newVersionForm, {
      version: '',
      name: '',
      code: '',
      type: '',
      level: '',
      status: '有效',
      publishDate: '',
      implementationDate: '',
      compilationUnit: '',
      description: '',
      keywords: '',
      changes: ''
    })
    addVersionFile.value = null
  }, 1500)
}

// 编辑版本
const handleEditVersion = (version: Version) => {
  currentEditVersion.value = version
  // 填充表单
  Object.assign(editVersionForm, {
    version: version.version,
    name: version.name,
    code: version.code,
    type: version.type,
    level: version.level,
    status: version.status,
    publishDate: version.publishDate,
    implementationDate: version.implementationDate,
    compilationUnit: version.compilationUnit,
    description: version.description,
    keywords: version.keywords,
    changes: version.changes
  })
  // 清空校审结果
  reviewResult.value = []
  // 打开编辑对话框
  editVersionDialogVisible.value = true
}

// 确认编辑版本
const handleEditVersionConfirm = () => {
  // 验证表单
  if (!editVersionForm.version || !editVersionForm.name || !editVersionForm.code || !editVersionForm.type || !editVersionForm.level || !editVersionForm.status || !editVersionForm.publishDate || !editVersionForm.implementationDate || !editVersionForm.compilationUnit) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  
  if (!currentEditVersion.value) {
    ElMessage.error('编辑版本失败')
    return
  }
  
  isEditingVersion.value = true
  
  // 模拟编辑过程
  setTimeout(() => {
    // 更新版本信息
    const versionIndex = versionList.value.findIndex(v => v.id === currentEditVersion.value?.id)
    if (versionIndex !== -1 && versionList.value[versionIndex]) {
      // 如果编辑后的版本是有效状态，将其他版本设置为废止
      if (editVersionForm.status === '有效') {
        versionList.value.forEach(version => {
          version.status = '废止'
        })
      }
      
      // 更新当前版本
      const version = versionList.value[versionIndex]
      Object.assign(version, {
        version: editVersionForm.version,
        name: editVersionForm.name,
        code: editVersionForm.code,
        type: editVersionForm.type,
        level: editVersionForm.level,
        status: editVersionForm.status,
        publishDate: editVersionForm.publishDate,
        implementationDate: editVersionForm.implementationDate,
        compilationUnit: editVersionForm.compilationUnit,
        description: editVersionForm.description,
        keywords: editVersionForm.keywords,
        changes: editVersionForm.changes
      })
      
      // 排序版本
      sortVersions()
      // 更新当前版本
      computeCurrentVersion()
      
      ElMessage.success('版本编辑成功')
      editVersionDialogVisible.value = false
      isEditingVersion.value = false
      
      // 重置表单
      Object.assign(editVersionForm, {
        version: '',
        name: '',
        code: '',
        type: '',
        level: '',
        status: '有效',
        publishDate: '',
        implementationDate: '',
        compilationUnit: '',
        description: '',
        keywords: '',
        changes: ''
      })
      currentEditVersion.value = null
      reviewResult.value = []
    }
  }, 1500)
}

// 添加版本
const handleAddVersion = () => {
  addVersionDialogVisible.value = true
}

// 关闭窗口
const handleClose = () => {
  window.close()
}

// 获取类型文本
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

// 获取等级文本
const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    '1': '强制性标准',
    '2': '推荐性标准',
    '3': '指导性标准'
  }
  return levelMap[level] || level
}

// 生命周期
onMounted(() => {
  loadSpecData()
})
</script>

<style lang="scss" scoped>
.spec-data-history {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
}

.history-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f9f9f9;
}

.history-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spec-info {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

.spec-info h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.spec-info-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.spec-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-result {
  margin-top: 8px;
}

.auto-fill-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.version-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.version-card {
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #409EFF;
  }
  
  &.status-active {
    border-color: #67C23A;
    box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
    
    .version-header {
      background-color: #f0f9eb;
    }
  }
  
  &.status-inactive {
    opacity: 0.7;
    filter: grayscale(50%);
    
    .version-header {
      background-color: #f5f5f5;
    }
  }
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f9f9f9;
}

.version-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
}

.version-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.version-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-content {
  padding: 16px;
}

.simple-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.simple-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.version-changes {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.version-changes h5 {
  margin: 0 0 8px 0;
  color: #303133;
}

.changes-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

.compare-result {
  padding: 16px;
}

.compare-section {
  margin-bottom: 24px;
}

.compare-section h5 {
  margin: 0 0 12px 0;
  color: #303133;
}

.content-block {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
}

.selected-file {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-footer {
  text-align: right;
}
</style>