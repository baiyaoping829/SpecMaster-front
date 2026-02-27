<template>
  <div class="spec-data-upload">
    <div class="upload-container">
      <h2>上传规范标准</h2>
      <el-form :model="uploadForm" label-width="120px" class="upload-form">
        <el-form-item label="规范名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入规范名称" />
        </el-form-item>
        <el-form-item label="规范编号" required>
          <el-input v-model="uploadForm.code" placeholder="请输入规范编号" />
        </el-form-item>
        <el-form-item label="规范类型" required>
          <el-select v-model="uploadForm.type" placeholder="请选择规范类型">
            <el-option label="国家标准" value="GB" />
            <el-option label="行业标准" value="HB" />
            <el-option label="地方标准" value="DB" />
            <el-option label="企业标准" value="QB" />
            <el-option label="国际标准" value="ISO" />
          </el-select>
        </el-form-item>
        <el-form-item label="规范等级" required>
          <el-select v-model="uploadForm.level" placeholder="请选择规范等级">
            <el-option label="强制性标准" value="1" />
            <el-option label="推荐性标准" value="2" />
            <el-option label="指导性标准" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="uploadForm.status" placeholder="请选择状态">
            <el-option label="有效" value="1" />
            <el-option label="废止" value="0" />
            <el-option label="修订中" value="2" />
            <el-option label="待实施" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="实施日期" required>
          <el-date-picker
            v-model="uploadForm.implementationDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="编制单位" required>
          <el-input v-model="uploadForm.compilationUnit" placeholder="请输入编制单位" />
        </el-form-item>
        <el-form-item label="规范描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规范描述"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="uploadForm.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
        </el-form-item>
        <el-form-item label="上传文件" required>
          <el-upload
            class="upload-demo drag-upload"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            accept=".pdf,.doc,.docx,.html"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传PDF、DOC、DOCX、HTML格式的规范文件，系统将自动提取信息进行智能填充
              </div>
            </template>
          </el-upload>
          <div v-if="selectedFile" class="selected-file">
            <el-tag>{{ selectedFile.name }}</el-tag>
            <el-button size="small" type="danger" @click="selectedFile = null">删除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="智能填充">
          <el-button type="info" @click="autoFillFromPDF" :loading="isAutoFilling">
            从文件提取信息
          </el-button>
          <span class="auto-fill-tip">点击后系统将自动从上传的文件中提取信息填充表单</span>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">确定</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

// 响应式数据
const uploadForm = reactive({
  name: '',
  code: '',
  type: '',
  level: '',
  status: 1,
  implementationDate: '',
  compilationUnit: '',
  description: '',
  keywords: ''
})

const selectedFile = ref<File | null>(null)
const isAutoFilling = ref(false)
const isSubmitting = ref(false)

// 方法
const handleFileUpload = (file: any) => {
  // 处理文件上传
  console.log('上传文件:', file)
  selectedFile.value = file.raw
}

const autoFillFromPDF = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择PDF文件')
    return
  }
  
  isAutoFilling.value = true
  
  // 模拟智能填充过程
  setTimeout(() => {
    // 模拟从PDF中提取的信息
    uploadForm.name = '智能填充的规范名称'
    uploadForm.code = 'GB 12345-2024'
    uploadForm.type = 'GB'
    uploadForm.level = '1'
    uploadForm.implementationDate = '2024-01-01'
    uploadForm.compilationUnit = '智能填充的编制单位'
    uploadForm.description = '智能填充的规范描述'
    uploadForm.keywords = '智能,填充,规范'
    
    ElMessage.success('智能填充完成')
    isAutoFilling.value = false
  }, 2000)
}

const handleSubmit = () => {
  // 验证表单
  if (!uploadForm.name || !uploadForm.code || !uploadForm.type || !uploadForm.level || !uploadForm.status || !uploadForm.implementationDate || !uploadForm.compilationUnit) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  
  if (!selectedFile.value) {
    ElMessage.warning('请上传PDF文件')
    return
  }
  
  isSubmitting.value = true
  
  // 模拟提交过程
  setTimeout(() => {
    console.log('上传规范标准:', uploadForm)
    ElMessage.success('上传成功')
    // 关闭窗口
    window.close()
  }, 2000)
}

const handleCancel = () => {
  // 关闭窗口
  window.close()
}
</script>

<style lang="scss" scoped>
.spec-data-upload {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
}

.upload-container {
  background-color: white;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.upload-container h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  text-align: center;
}

.upload-form {
  margin-bottom: 24px;
}

.selected-file {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-fill-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.drag-upload {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #409EFF;
    background-color: #f0f9ff;
  }
  
  .el-upload__text {
    color: #606266;
    margin-top: 16px;
  }
  
  .el-upload__tip {
    margin-top: 16px;
    font-size: 12px;
    color: #909399;
  }
}
</style>