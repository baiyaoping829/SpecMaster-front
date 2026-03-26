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
          <div class="pdf-meta" data-testid="pdf-meta">
            <span>共 {{ pageCount }} 页</span>
            <span v-if="renderHint" class="pdf-hint">{{ renderHint }}</span>
          </div>
          <div class="pdf-render">
            <canvas v-if="renderMode === 'pdfjs'" ref="canvasRef" data-testid="pdf-canvas"></canvas>
            <iframe v-else :src="iframeUrl || pdfUrl" frameborder="0" width="100%" height="100%" data-testid="pdf-iframe"></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfjsWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { specApi } from '../api/spec'
import { filesApi } from '../api/files'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc

// 响应式数据
const route = useRoute()
const loading = ref(true)
const error = ref('')
const pdfUrl = ref('')
const iframeUrl = ref('')
const pageCount = ref(0)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const pdfDoc = ref<any>(null)
const renderMode = ref<'pdfjs' | 'iframe'>('pdfjs')
const renderHint = ref('')
let renderTask: any = null
let lastRenderedDoc: any = null

// 加载PDF文件
const loadPDF = async () => {
  loading.value = true
  error.value = ''
  renderHint.value = ''
  renderMode.value = 'pdfjs'
  iframeUrl.value = ''
  
  // 获取规范ID
  const specId = route.params.id as string
  let shouldRender = false
  try {
    const detail = await specApi.getSpecDetail(specId)
    const fileObjectId = String(detail.data?.file_object_id || detail.data?.fileObjectId || '')
    if (!fileObjectId) {
      error.value = '该规范未关联PDF文件'
      return
    }
    const token = localStorage.getItem('token') || ''
    const url = `/api/file/content/${encodeURIComponent(fileObjectId)}`
    pdfUrl.value = url
    try {
      const presigned = await filesApi.presign(fileObjectId, 5000, true)
      iframeUrl.value = String(presigned.data?.url || '')
    } catch {
      iframeUrl.value = ''
    }

    if (renderTask) {
      try {
        await renderTask.cancel()
      } catch {
      }
      renderTask = null
    }
    if (pdfDoc.value) {
      try {
        await pdfDoc.value.destroy()
      } catch {
      }
      pdfDoc.value = null
    }

    const task = pdfjsLib.getDocument({
      url,
      httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      disableWorker: true,
      cMapUrl: '/api/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/api/pdfjs/standard_fonts/'
    } as any)
    pdfDoc.value = await task.promise
    pageCount.value = Number(pdfDoc.value?.numPages || 0)
    shouldRender = true
  } catch (e: any) {
    const msg = String(e?.message || '加载失败')
    if (msg.includes('Invalid PDF structure')) {
      error.value = '无效的PDF结构（请确认上传的是PDF且文件未损坏）'
    } else if (msg.includes('toHex is not a function')) {
      error.value = 'PDF解析失败（字体/编码解析异常），请重试或更换PDF文件'
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }

  if (shouldRender && !error.value) {
    await nextTick()
    try {
      await renderFirstPage()
    } catch (e: any) {
      console.error(e)
      renderMode.value = 'iframe'
      renderHint.value = 'PDF渲染失败，已切换为浏览器预览'
    }
  }
}

const renderFirstPage = async () => {
  if (!pdfDoc.value || !canvasRef.value) return
  const page = await pdfDoc.value.getPage(1)
  const viewport = page.getViewport({ scale: 1.25 })

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  renderTask = page.render({ canvasContext: ctx, viewport } as any)
  await renderTask.promise
}

watchEffect(() => {
  if (loading.value) return
  if (error.value) return
  if (!pdfDoc.value) return
  if (!canvasRef.value) return
  if (lastRenderedDoc === pdfDoc.value) return
  lastRenderedDoc = pdfDoc.value
  void (async () => {
    try {
      await renderFirstPage()
    } catch (e: any) {
      console.error(e)
      renderMode.value = 'iframe'
      renderHint.value = 'PDF渲染失败，已切换为浏览器预览'
    }
  })()
})

// 关闭窗口
const handleClose = () => {
  window.close()
}

// 生命周期
onMounted(() => {
  loadPDF()
})

onUnmounted(() => {
  if (renderTask) {
    try {
      renderTask.cancel()
    } catch {
    }
  }
  if (pdfDoc.value) {
    try {
      pdfDoc.value.destroy()
    } catch {
    }
  }
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
  display: flex;
  flex-direction: column;
}

.pdf-meta {
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  color: #606266;
  font-size: 13px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pdf-hint {
  color: #b42318;
}

.pdf-render {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: flex;
  justify-content: center;
  background: #f5f7fa;
}
</style>
