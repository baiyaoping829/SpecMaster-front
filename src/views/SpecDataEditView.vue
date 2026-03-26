<template>
  <div class="spec-data-edit">
    <div class="edit-container">
      <h2>编辑规范标准</h2>
      <el-form :model="editForm" label-width="120px" class="edit-form">
        <el-form-item label="规范名称" required>
          <el-input v-model="editForm.name" placeholder="请输入规范名称" />
        </el-form-item>
        <el-form-item label="规范编号" required>
          <el-input v-model="editForm.code" placeholder="请输入规范编号" />
        </el-form-item>
        <el-form-item label="规范类型" required>
          <el-select v-model="editForm.type" placeholder="请选择规范类型">
            <el-option label="国家标准" value="GB" />
            <el-option label="行业标准" value="HB" />
            <el-option label="地方标准" value="DB" />
            <el-option label="企业标准" value="QB" />
            <el-option label="国际标准" value="ISO" />
          </el-select>
        </el-form-item>
        <el-form-item label="规范等级" required>
          <el-select v-model="editForm.level" placeholder="请选择规范等级">
            <el-option label="强制性标准" value="1" />
            <el-option label="推荐性标准" value="2" />
            <el-option label="指导性标准" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option label="有效" value="1" />
            <el-option label="废止" value="0" />
            <el-option label="修订中" value="2" />
            <el-option label="待实施" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="实施日期" required>
          <el-date-picker
            v-model="editForm.implementationDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="编制单位" required>
          <el-input v-model="editForm.compilationUnit" placeholder="请输入编制单位" />
        </el-form-item>
        <el-form-item label="规范描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规范描述"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="editForm.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
        </el-form-item>
        <el-form-item label="智能校正">
          <el-button type="info" @click="autoCorrect" :loading="isAutoCorrecting">
            智能校正
          </el-button>
          <span class="auto-correct-tip">点击后系统将自动校正表单内容</span>
        </el-form-item>
        <el-form-item v-if="correctionResult" label="校正结果">
          <div class="correction-result">
            <el-alert
              v-for="(item, index) in correctionResult"
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
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { specApi } from '../api/spec'

// 响应式数据
const route = useRoute()
const editForm = reactive({
  id: '',
  version: 0,
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
const isAutoCorrecting = ref(false)
const isSubmitting = ref(false)
const correctionResult = ref<any[]>([])

const toFormDate = (value: any) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : String(value)
}

const normalizeDate = (value: any) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

const loadSpecData = async () => {
  const specId = route.params.id as string
  try {
    const res = await specApi.getSpecDetail(specId)
    const s = res.data
    Object.assign(editForm, {
      id: String(s?.id || specId),
      version: Number(s?.version || 0),
      name: String(s?.name || ''),
      code: String(s?.code || ''),
      type: String(s?.type || ''),
      level: String(s?.level ?? ''),
      status: Number(s?.status ?? 1),
      implementationDate: toFormDate(s?.implementation_date || s?.implementationDate || ''),
      compilationUnit: String(s?.compilation_unit || s?.compilationUnit || ''),
      description: String(s?.description || ''),
      keywords: String(s?.keywords || '')
    })
  } catch (e: any) {
    ElMessage.error(e?.message || '未找到规范数据')
  }
}

// 智能校正
const autoCorrect = () => {
  isAutoCorrecting.value = true
  correctionResult.value = []
  
  // 模拟智能校正过程
  setTimeout(() => {
    // 模拟校正结果
    const results = []
    
    // 检查规范名称
    if (editForm.name && editForm.name.length < 5) {
      results.push({
        field: '规范名称',
        suggestion: '规范名称过短，建议补充完整名称',
        type: 'warning'
      })
    }
    
    // 检查规范编号
    if (editForm.code && !/^[A-Z]+\s+\d+-\d+$/.test(editForm.code)) {
      results.push({
        field: '规范编号',
        suggestion: '规范编号格式不正确，建议使用标准格式（如：GB 50016-2014）',
        type: 'error'
      })
    }
    
    // 检查实施日期
    if (editForm.implementationDate) {
      const date = new Date(editForm.implementationDate)
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
    if (editForm.keywords && editForm.keywords.split(',').length > 10) {
      results.push({
        field: '关键词',
        suggestion: '关键词数量过多，建议控制在10个以内',
        type: 'warning'
      })
    }
    
    // 检查描述
    if (editForm.description && editForm.description.length < 20) {
      results.push({
        field: '规范描述',
        suggestion: '规范描述过短，建议详细描述规范的适用范围和内容',
        type: 'warning'
      })
    }
    
    correctionResult.value = results
    isAutoCorrecting.value = false
    
    if (results.length === 0) {
      ElMessage.success('未发现需要校正的内容')
    }
  }, 1500)
}

// 保存修改
const handleSubmit = async () => {
  // 验证表单
  if (!editForm.name || !editForm.code || !editForm.type || !editForm.level || !editForm.status || !editForm.implementationDate || !editForm.compilationUnit) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  
  isSubmitting.value = true
  try {
    const id = String(editForm.id || route.params.id || '')
    await specApi.updateSpec(id, {
      version: Number(editForm.version || 0),
      patch: {
        name: editForm.name,
        code: editForm.code,
        type: editForm.type,
        level: Number(editForm.level),
        status: Number(editForm.status),
        implementation_date: normalizeDate(editForm.implementationDate),
        compilation_unit: editForm.compilationUnit,
        description: editForm.description,
        keywords: editForm.keywords
      }
    })
    ElMessage.success('保存成功')
    try {
      window.close()
    } catch {
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    isSubmitting.value = false
  }
}

// 取消
const handleCancel = () => {
  // 关闭窗口
  window.close()
}

// 生命周期
onMounted(() => {
  loadSpecData()
})
</script>

<style lang="scss" scoped>
.spec-data-edit {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
}

.edit-container {
  background-color: white;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-container h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  text-align: center;
}

.edit-form {
  margin-bottom: 24px;
}

.auto-correct-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.correction-result {
  margin-top: 8px;
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
