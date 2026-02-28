<template>
  <div class="accident-management">
    <div class="accident-search" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div style="display: flex; align-items: center;">
        <el-input
          v-model="searchQuery"
          placeholder="搜索事故名称、类型、责任单位"
          prefix-icon="el-icon-search"
          style="width: 300px;"
        />
        <el-select v-model="filterType" placeholder="事故类型" style="width: 150px; margin-left: 12px;">
          <el-option label="全部" value="" />
          <el-option label="坍塌事故" value="坍塌事故" />
          <el-option label="高处坠落" value="高处坠落" />
          <el-option label="物体打击" value="物体打击" />
          <el-option label="触电事故" value="触电事故" />
          <el-option label="机械伤害" value="机械伤害" />
          <el-option label="其他" value="其他" />
        </el-select>
        <el-button type="primary" style="margin-left: 12px;" @click="handleSearch">搜索</el-button>
        <el-button type="success" style="margin-left: 12px;" @click="addAccident">添加事故案例</el-button>
      </div>
      <div v-if="selectedAccidents.length > 0" style="display: flex; align-items: center;">
        <el-button type="danger" @click="batchDeleteAccidents">批量删除</el-button>
      </div>
    </div>
    
    <div style="max-height: 500px; overflow-y: auto;">
      <el-table :data="pagedAccidents" style="width: 100%;" @selection-change="handleAccidentSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="案例编号" width="100" />
        <el-table-column prop="name" label="事故名称" min-width="200" />
        <el-table-column prop="type" label="事故类型" width="120" />
        <el-table-column prop="accidentDate" label="事故日期" width="120" />
        <el-table-column prop="province" label="所属省份" width="120" />
        <el-table-column prop="level" label="事故等级" width="100" />
        <el-table-column prop="casualties" label="人员伤亡" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewAccident(scope.row)">详情</el-button>
            <el-button size="small" @click="editAccident(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAccident(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredAccidents.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 添加事故案例对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
    >
      <el-form :model="accidentForm" :rules="rules" ref="accidentFormRef" label-width="120px">
        <el-form-item label="事故名称" prop="name" required>
          <el-input v-model="accidentForm.name" placeholder="请输入事故名称" />
        </el-form-item>
        <el-form-item label="事故概要" prop="summary">
          <el-input type="textarea" v-model="accidentForm.summary" placeholder="请输入事故概要" :rows="3" />
        </el-form-item>
        <el-form-item label="事故类型" prop="type" required>
          <el-select v-model="accidentForm.type" placeholder="请选择事故类型">
            <el-option label="坍塌事故" value="坍塌事故" />
            <el-option label="高处坠落" value="高处坠落" />
            <el-option label="物体打击" value="物体打击" />
            <el-option label="触电事故" value="触电事故" />
            <el-option label="机械伤害" value="机械伤害" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="直接原因" prop="directCause">
          <el-input type="textarea" v-model="accidentForm.directCause" placeholder="请输入直接原因" :rows="3" />
        </el-form-item>
        <el-form-item label="间接原因" prop="indirectCause">
          <el-input type="textarea" v-model="accidentForm.indirectCause" placeholder="请输入间接原因" :rows="3" />
        </el-form-item>
        <el-form-item label="责任单位" prop="responsibleUnit">
          <el-input v-model="accidentForm.responsibleUnit" placeholder="请输入责任单位" />
        </el-form-item>
        <el-form-item label="工程类型" prop="projectType">
          <el-select v-model="accidentForm.projectType" placeholder="请选择工程类型">
            <el-option label="建筑工程" value="建筑工程" />
            <el-option label="市政工程" value="市政工程" />
            <el-option label="交通工程" value="交通工程" />
            <el-option label="水利工程" value="水利工程" />
            <el-option label="电力工程" value="电力工程" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="事故日期" prop="accidentDate" required>
          <el-date-picker v-model="accidentForm.accidentDate" type="date" placeholder="选择事故日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="项目信息" prop="projectInfo">
          <el-input type="textarea" v-model="accidentForm.projectInfo" placeholder="请输入项目信息" :rows="3" />
        </el-form-item>
        <el-form-item label="事故等级" prop="level" required>
          <el-select v-model="accidentForm.level" placeholder="请选择事故等级">
            <el-option label="特别重大" value="特别重大" />
            <el-option label="重大" value="重大" />
            <el-option label="较大" value="较大" />
            <el-option label="一般" value="一般" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属省份" prop="province" required>
          <el-input v-model="accidentForm.province" placeholder="请输入所属省份" />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="accidentForm.severity" placeholder="请选择严重程度">
            <el-option label="特别严重" value="特别严重" />
            <el-option label="严重" value="严重" />
            <el-option label="较严重" value="较严重" />
            <el-option label="一般" value="一般" />
          </el-select>
        </el-form-item>
        <el-form-item label="人员伤亡" prop="casualties">
          <el-input v-model="accidentForm.casualties" placeholder="请输入人员伤亡情况" />
        </el-form-item>
        <el-form-item label="经济损失" prop="economicLoss">
          <el-input v-model="accidentForm.economicLoss" placeholder="请输入经济损失" />
        </el-form-item>
        <el-form-item label="事故进展" prop="progress">
          <el-input type="textarea" v-model="accidentForm.progress" placeholder="请输入事故进展" :rows="3" />
        </el-form-item>
        <el-form-item label="经验教训" prop="lessons">
          <el-input type="textarea" v-model="accidentForm.lessons" placeholder="请输入经验教训" :rows="3" />
        </el-form-item>
        <el-form-item label="处罚结果" prop="punishment">
          <el-input type="textarea" v-model="accidentForm.punishment" placeholder="请输入处罚结果" :rows="3" />
        </el-form-item>
        
        <!-- 文件上传 -->
        <el-form-item label="事故调查报告">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :file-list="accidentForm.files.report"
            :limit="3"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传PDF、Word等格式文件，最多3个
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="阅览报告">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :file-list="accidentForm.files.reading"
            :limit="3"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传PDF、Word等格式文件，最多3个
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="媒体报道">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :file-list="accidentForm.files.media"
            :limit="5"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传新闻报告、视频链接等，最多5个
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="info" @click="intelligentFillAccident" style="margin-left: 12px;">智能填表</el-button>
          <el-button type="primary" @click="submitForm" style="margin-left: 12px;">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 事故案例详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="事故案例详情"
      width="900px"
    >
      <div v-if="selectedAccident" class="accident-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案例编号">{{ selectedAccident.id }}</el-descriptions-item>
          <el-descriptions-item label="事故名称">{{ selectedAccident.name }}</el-descriptions-item>
          <el-descriptions-item label="事故类型">{{ selectedAccident.type }}</el-descriptions-item>
          <el-descriptions-item label="事故日期">{{ selectedAccident.accidentDate }}</el-descriptions-item>
          <el-descriptions-item label="所属省份">{{ selectedAccident.province }}</el-descriptions-item>
          <el-descriptions-item label="事故等级">{{ selectedAccident.level }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">{{ selectedAccident.severity }}</el-descriptions-item>
          <el-descriptions-item label="人员伤亡">{{ selectedAccident.casualties }}</el-descriptions-item>
          <el-descriptions-item label="经济损失">{{ selectedAccident.economicLoss }}</el-descriptions-item>
          <el-descriptions-item label="责任单位">{{ selectedAccident.responsibleUnit }}</el-descriptions-item>
          <el-descriptions-item label="工程类型">{{ selectedAccident.projectType }}</el-descriptions-item>
          <el-descriptions-item label="事故概要" :span="2">{{ selectedAccident.summary }}</el-descriptions-item>
          <el-descriptions-item label="直接原因" :span="2">{{ selectedAccident.directCause }}</el-descriptions-item>
          <el-descriptions-item label="间接原因" :span="2">{{ selectedAccident.indirectCause }}</el-descriptions-item>
          <el-descriptions-item label="项目信息" :span="2">{{ selectedAccident.projectInfo }}</el-descriptions-item>
          <el-descriptions-item label="事故进展" :span="2">{{ selectedAccident.progress }}</el-descriptions-item>
          <el-descriptions-item label="经验教训" :span="2">{{ selectedAccident.lessons }}</el-descriptions-item>
          <el-descriptions-item label="处罚结果" :span="2">{{ selectedAccident.punishment }}</el-descriptions-item>
          
          <!-- 文件信息 -->
          <el-descriptions-item label="事故调查报告" :span="2">
            <div v-if="selectedAccident.files && selectedAccident.files.report && selectedAccident.files.report.length > 0">
              <div v-for="(file, index) in selectedAccident.files.report" :key="index" style="margin-bottom: 8px;">
                <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="阅览报告" :span="2">
            <div v-if="selectedAccident.files && selectedAccident.files.reading && selectedAccident.files.reading.length > 0">
              <div v-for="(file, index) in selectedAccident.files.reading" :key="index" style="margin-bottom: 8px;">
                <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="媒体报道" :span="2">
            <div v-if="selectedAccident.files && selectedAccident.files.media && selectedAccident.files.media.length > 0">
              <div v-for="(file, index) in selectedAccident.files.media" :key="index" style="margin-bottom: 8px;">
                <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessageBox } from 'element-plus'

// 搜索和过滤
const searchQuery = ref('')
const filterType = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加事故案例')
const accidentFormRef = ref()

// 详情对话框相关
const detailDialogVisible = ref(false)
const selectedAccident = ref(null)

// 多选相关
const selectedAccidents = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const filteredAccidents = ref([])
const pagedAccidents = ref([])

// 事故表单数据
const accidentForm = reactive({
  id: '',
  name: '',
  summary: '',
  type: '',
  directCause: '',
  indirectCause: '',
  responsibleUnit: '',
  projectType: '',
  accidentDate: '',
  projectInfo: '',
  level: '',
  province: '',
  severity: '',
  casualties: '',
  economicLoss: '',
  progress: '',
  lessons: '',
  punishment: '',
  files: {
    report: [],
    reading: [],
    media: []
  }
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入事故名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择事故类型', trigger: 'change' }],
  accidentDate: [{ required: true, message: '请选择事故日期', trigger: 'change' }],
  level: [{ required: true, message: '请选择事故等级', trigger: 'change' }],
  province: [{ required: true, message: '请输入所属省份', trigger: 'blur' }]
}

// 事故数据（模拟数据）
const accidents = ref([
  {
    id: 'AC001',
    name: '某建筑工地坍塌事故',
    summary: '2023年5月1日，某建筑工地发生坍塌事故，造成3人死亡，5人受伤。',
    type: '坍塌事故',
    directCause: '脚手架搭建不规范，承重能力不足',
    indirectCause: '安全监管不到位，施工单位违规操作',
    responsibleUnit: '某建筑工程有限公司',
    projectType: '建筑工程',
    accidentDate: '2023-05-01',
    projectInfo: '某商业综合体项目，建筑面积5万平方米',
    level: '较大',
    province: '广东省',
    severity: '严重',
    casualties: '3死5伤',
    economicLoss: '约200万元',
    progress: '事故已处理完毕，相关责任人已被问责',
    lessons: '加强安全监管，规范脚手架搭建流程',
    punishment: '对施工单位罚款50万元，项目经理被拘留',
    files: {
      report: [{
        name: '事故调查报告.pdf',
        url: '#'
      }],
      reading: [{
        name: '事故分析报告.docx',
        url: '#'
      }],
      media: [{
        name: '新闻报道链接',
        url: '#'
      }]
    }
  },
  {
    id: 'AC002',
    name: '某桥梁施工高处坠落事故',
    summary: '2023年8月15日，某桥梁施工现场发生高处坠落事故，造成1人死亡。',
    type: '高处坠落',
    directCause: '工人未系安全带，不慎从10米高处坠落',
    indirectCause: '安全培训不到位，现场管理松懈',
    responsibleUnit: '某交通工程有限公司',
    projectType: '交通工程',
    accidentDate: '2023-08-15',
    projectInfo: '某跨江大桥项目，全长2公里',
    level: '一般',
    province: '江苏省',
    severity: '较严重',
    casualties: '1死',
    economicLoss: '约50万元',
    progress: '事故已处理，安全隐患已整改',
    lessons: '加强安全培训，严格执行安全操作规程',
    punishment: '对施工单位罚款20万元，安全负责人被警告',
    files: {
      report: [],
      reading: [],
      media: []
    }
  }
])

// 过滤事故数据
const filterAccidents = () => {
  let result = [...accidents.value]
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase()
    result = result.filter(accident => 
      accident.name.toLowerCase().includes(keyword) ||
      accident.type.toLowerCase().includes(keyword) ||
      accident.responsibleUnit.toLowerCase().includes(keyword)
    )
  }
  
  // 根据事故类型过滤
  if (filterType.value) {
    result = result.filter(accident => accident.type === filterType.value)
  }
  
  filteredAccidents.value = result
  return result
}

// 计算分页数据
const updatePagedAccidents = () => {
  const filtered = filterAccidents()
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  pagedAccidents.value = filtered.slice(start, end)
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置页码
  updatePagedAccidents()
}

// 初始化分页数据
updatePagedAccidents()

// 处理页码变化
const handleSizeChange = (size) => {
  pageSize.value = size
  updatePagedAccidents()
}

// 处理每页大小变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  updatePagedAccidents()
}

// 处理事故选择变化
const handleAccidentSelectionChange = (val) => {
  selectedAccidents.value = val
}

// 批量删除事故
const batchDeleteAccidents = () => {
  if (selectedAccidents.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedAccidents.value.length} 个事故案例吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行批量删除操作
    const idsToDelete = selectedAccidents.value.map((accident) => accident.id)
    accidents.value = accidents.value.filter(accident => !idsToDelete.includes(accident.id))
    selectedAccidents.value = []
    updatePagedAccidents()
    console.log('事故案例批量删除成功')
  }).catch(() => {
    // 取消删除
    console.log('取消删除事故案例')
  })
}

// 添加事故案例
const addAccident = () => {
  dialogTitle.value = '添加事故案例'
  // 重置表单
  Object.assign(accidentForm, {
    id: '',
    name: '',
    summary: '',
    type: '',
    directCause: '',
    indirectCause: '',
    responsibleUnit: '',
    projectType: '',
    accidentDate: '',
    projectInfo: '',
    level: '',
    province: '',
    severity: '',
    casualties: '',
    economicLoss: '',
    progress: '',
    lessons: '',
    punishment: '',
    files: {
      report: [],
      reading: [],
      media: []
    }
  })
  dialogVisible.value = true
}

// 编辑事故案例
const editAccident = (accident) => {
  dialogTitle.value = '编辑事故案例'
  // 填充表单数据
  Object.assign(accidentForm, {
    ...accident,
    files: accident.files || {
      report: [],
      reading: [],
      media: []
    }
  })
  dialogVisible.value = true
}

// 删除事故案例
const deleteAccident = (id) => {
  ElMessageBox.confirm(
    '确定要删除该事故案例吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行删除操作
    const index = accidents.value.findIndex(item => item.id === id)
    if (index !== -1) {
      accidents.value.splice(index, 1)
      updatePagedAccidents()
      console.log('事故案例删除成功:', id)
    }
  }).catch(() => {
    // 取消删除
    console.log('取消删除事故案例:', id)
  })
}

// 查看事故案例详情
const viewAccident = (accident) => {
  selectedAccident.value = accident
  detailDialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!accidentFormRef.value) return
  
  try {
    await accidentFormRef.value.validate()
    
    if (accidentForm.id) {
      // 编辑操作：更新现有事故案例
      const index = accidents.value.findIndex(item => item.id === accidentForm.id)
      if (index !== -1) {
        accidents.value[index] = { ...accidentForm }
        console.log('事故案例编辑成功:', accidentForm)
      }
    } else {
      // 添加操作：创建新事故案例
      const newId = 'AC' + String(accidents.value.length + 1).padStart(3, '0')
      const newAccident = {
        ...accidentForm,
        id: newId
      }
      accidents.value.push(newAccident)
      console.log('事故案例添加成功:', newAccident)
    }
    
    dialogVisible.value = false
    updatePagedAccidents()
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}

// 智能填表
const intelligentFillAccident = async () => {
  // 这里可以集成大语言模型API来实现智能填表功能
  // 示例：基于事故名称自动填充其他信息
  if (accidentForm.name) {
    // 模拟智能填表
    console.log('正在智能填充事故案例信息...')
    // 实际项目中这里会调用API
    setTimeout(() => {
      // 模拟填充结果
      if (!accidentForm.summary) {
        accidentForm.summary = '事故概要信息'
      }
      if (!accidentForm.type) {
        accidentForm.type = '坍塌事故'
      }
      if (!accidentForm.province) {
        accidentForm.province = '北京市'
      }
      if (!accidentForm.level) {
        accidentForm.level = '一般'
      }
      console.log('智能填充完成')
    }, 1000)
  }
}

// 处理文件上传
const handleFileUpload = (file, fileList) => {
  // 实际项目中这里会处理文件上传逻辑
  console.log('文件上传:', file)
}
</script>

<style scoped>
.accident-management {
  padding: 0 20px;
  
  .accident-search {
    margin-bottom: 20px;
  }
  
  .pagination {
    margin-top: 20px;
  }
  
  .accident-detail {
    margin-top: 20px;
  }
}
</style>