<template>
  <div class="spec-data-preview">
    <div class="preview-container">
      <div class="preview-header">
        <h2>规范标准预览</h2>
        <el-button type="primary" @click="handleClose">关闭</el-button>
      </div>
      <div class="preview-content">
        <div v-if="loading" class="loading-container">
          <el-spinner size="large" />
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="error-container">
          <el-icon class="error-icon"><warning-filled /></el-icon>
          <p>{{ error }}</p>
          <el-button type="primary" @click="loadPDF">重试</el-button>
        </div>
        <div v-else class="pdf-container">
          <iframe :src="pdfUrl" frameborder="0" width="100%" height="100%"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'

// 响应式数据
const route = useRoute()
const loading = ref(true)
const error = ref('')
const pdfUrl = ref('')

// 模拟PDF文件URL，实际项目中应该从服务器获取
const mockPdfFiles: Record<string, string> = {
  '1': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '2': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '3': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '4': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '5': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '6': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '7': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '8': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '9': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  '10': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
}

// 加载PDF文件
const loadPDF = () => {
  loading.value = true
  error.value = ''
  
  // 获取规范ID
  const specId = route.params.id as string
  
  // 模拟加载过程
  setTimeout(() => {
    // 检查是否有对应的PDF文件
    if (mockPdfFiles[specId]) {
      pdfUrl.value = mockPdfFiles[specId]
    } else {
      // 使用默认的测试PDF文件
      pdfUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    }
    loading.value = false
  }, 1000)
}

// 关闭窗口
const handleClose = () => {
  window.close()
}

// 生命周期
onMounted(() => {
  loadPDF()
})
</script>

<style lang="scss" scoped>
.spec-data-preview {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
}

.preview-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f9f9f9;
}

.preview-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.preview-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 0 24px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: #F56C6C;
}

.pdf-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>