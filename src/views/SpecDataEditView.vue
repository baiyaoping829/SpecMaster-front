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

// 响应式数据
const route = useRoute()
const editForm = reactive({
  id: '',
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

// 模拟规范数据
const mockSpecs = [
  {
    id: '1',
    name: '建筑设计防火规范',
    code: 'GB 50016-2014',
    type: 'GB',
    level: '1',
    status: 1,
    implementationDate: '2015-05-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于新建、扩建和改建的建筑设计防火。',
    keywords: '建筑,防火,设计'
  },
  {
    id: '2',
    name: '混凝土结构设计规范',
    code: 'GB 50010-2010',
    type: 'GB',
    level: '1',
    status: 1,
    implementationDate: '2011-07-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于房屋和一般构筑物的混凝土结构设计。',
    keywords: '混凝土,结构,设计'
  },
  {
    id: '3',
    name: '建筑抗震设计规范',
    code: 'GB 50011-2010',
    type: 'GB',
    level: '1',
    status: 1,
    implementationDate: '2010-12-01',
    compilationUnit: '中华人民共和国住房和城乡建设部',
    description: '本规范适用于抗震设防烈度为6度至9度地区的建筑抗震设计。',
    keywords: '建筑,抗震,设计'
  }
]

// 加载规范数据
const loadSpecData = () => {
  const specId = route.params.id as string
  
  // 模拟加载过程
  setTimeout(() => {
    const spec = mockSpecs.find(s => s.id === specId)
    if (spec) {
      Object.assign(editForm, spec)
    } else {
      ElMessage.error('未找到规范数据')
    }
  }, 500)
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
const handleSubmit = () => {
  // 验证表单
  if (!editForm.name || !editForm.code || !editForm.type || !editForm.level || !editForm.status || !editForm.implementationDate || !editForm.compilationUnit) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  
  isSubmitting.value = true
  
  // 模拟提交过程
  setTimeout(() => {
    console.log('保存规范标准:', editForm)
    ElMessage.success('保存成功')
    // 关闭窗口
    window.close()
  }, 1500)
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