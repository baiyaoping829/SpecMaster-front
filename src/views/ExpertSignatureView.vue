<template>
  <div class="expert-signature-view">
    <div class="page-header">
      <h2>专家签名管理</h2>
      <p>管理和选择专家电子签名</p>
    </div>

    <!-- 专家信息输入区域 -->
    <div class="expert-info-section">
      <el-card shadow="hover">
        <h3>专家信息</h3>
        <el-form :model="expertInfo" label-width="100px" class="expert-info-form">
          <el-form-item label="专家姓名" required>
            <el-input 
              v-model="expertInfo.name" 
              placeholder="请输入专家姓名" 
              maxlength="50" 
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="专家职称">
            <el-input 
              v-model="expertInfo.title" 
              placeholder="请输入专家职称" 
              maxlength="100" 
              show-word-limit
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="associateSignature"
              :disabled="!expertInfo.name || !selectedSignatureId"
            >
              关联签名
            </el-button>
            <el-button 
              type="success" 
              @click="openMobileSignatureDialog"
              :disabled="!expertInfo.name"
            >
              手机签名
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 签名上传区域 -->
    <div class="upload-section">
      <el-card shadow="hover">
        <h3>上传签名</h3>
        <div class="upload-area">
          <el-upload
            class="upload-dragger"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="uploadedFiles"
            :limit="1"
            accept=".jpg,.jpeg,.png"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传 JPG、PNG 格式图片，单个文件不超过 2MB
              </div>
            </template>
          </el-upload>
          <div v-if="uploadError" class="upload-error">
            {{ uploadError }}
          </div>
          <el-button 
            v-if="uploadedFiles.length > 0" 
            type="primary" 
            @click="confirmUpload"
            :loading="isUploading"
          >
            确认上传
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 签名展示区域 -->
    <div class="signature-gallery">
      <el-card shadow="hover">
        <h3>签名库</h3>
        <div class="signature-search">
          <el-input 
            v-model="signatureSearch" 
            placeholder="搜索签名" 
            :prefix-icon="Search"
          />
        </div>
        <div class="signature-grid">
          <div 
            v-for="signature in filteredSignatures" 
            :key="signature.id"
            class="signature-item"
            :class="{ active: selectedSignatureId === signature.id }"
          >
            <div class="signature-image-container" @click="previewSignature(signature)">
              <img :src="signature.url" :alt="signature.name" class="signature-image" />
              <div class="signature-actions">
                <el-button 
                  size="small" 
                  @click.stop="replaceSignature(signature.id)"
                  :loading="isReplacing === signature.id"
                >
                  <el-icon><Edit /></el-icon> 替换
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click.stop="deleteSignature(signature.id)"
                >
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
              <div class="signature-selector" @click.stop="selectSignature(signature.id)">
                <el-icon v-if="selectedSignatureId === signature.id"><Check /></el-icon>
              </div>
            </div>
            <div class="signature-info">
              <span class="signature-name">{{ signature.name }}</span>
              <span class="signature-date">{{ signature.uploadDate }}</span>
            </div>
          </div>
          
          <div v-if="filteredSignatures.length === 0" class="empty-gallery">
            <el-icon class="empty-icon"><Picture /></el-icon>
            <p>暂无签名，请上传签名图片</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 签名清单区域 -->
    <div class="signature-list-section">
      <el-card shadow="hover">
        <h3>签名清单</h3>
        <el-table :data="signatureAssociations" style="width: 100%">
          <el-table-column prop="expertName" label="专家姓名" width="180" />
          <el-table-column prop="expertTitle" label="专家职称" width="200" />
          <el-table-column label="签名" width="120">
            <template #default="scope">
              <el-image 
                :src="scope.row.signatureUrl" 
                :preview-src-list="[scope.row.signatureUrl]"
                style="width: 80px; height: 40px; object-fit: contain"
              />
            </template>
          </el-table-column>
          <el-table-column prop="signatureName" label="签名名称" width="150" />
          <el-table-column prop="associateDate" label="关联日期" width="180" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button 
                size="small" 
                type="danger" 
                @click="removeAssociation(scope.row.id)"
              >
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="signatureAssociations.length === 0" class="empty-list">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>暂无签名关联记录</p>
        </div>
      </el-card>
    </div>

    <!-- 替换签名对话框 -->
    <el-dialog
      v-model="replaceDialogVisible"
      title="替换签名"
      width="500px"
    >
      <div class="replace-upload">
        <el-upload
          class="upload-dragger"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleReplaceFileChange"
          :on-remove="handleReplaceFileRemove"
          :file-list="replaceFileList"
          :limit="1"
          accept=".jpg,.jpeg,.png"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持上传 JPG、PNG 格式图片，单个文件不超过 2MB
            </div>
          </template>
        </el-upload>
        <div v-if="replaceError" class="upload-error">
          {{ replaceError }}
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="replaceDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmReplace"
            :loading="isReplacing !== null"
            :disabled="replaceFileList.length === 0"
          >
            确认替换
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 手机签名对话框 -->
    <el-dialog
      v-model="mobileSignatureDialogVisible"
      title="手机签名"
      width="600px"
    >
      <div class="mobile-signature-container">
        <div class="qrcode-section">
          <h4>扫描二维码在手机端签名</h4>
          <div class="qrcode">
            <img :src="qrcodeUrl" alt="手机签名二维码" class="qrcode-image" />
          </div>
          <p class="qrcode-tip">请使用手机扫描二维码，在手机端完成签名</p>
        </div>
        <div class="signature-preview">
          <h4>签名预览</h4>
          <div class="preview-area" v-if="mobileSignatureData">
            <img :src="mobileSignatureData" alt="手机签名预览" class="preview-image" />
          </div>
          <div class="preview-area empty" v-else>
            <el-icon class="empty-icon"><Picture /></el-icon>
            <p>手机端签名后将显示在这里</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mobileSignatureDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmMobileSignature"
            :disabled="!mobileSignatureData"
          >
            确认签名
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 签名预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="签名预览"
      width="400px"
    >
      <div class="preview-dialog-content">
        <img :src="previewSignatureUrl" alt="签名预览" class="full-signature-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Edit, Delete, Check, Picture, Search } from '@element-plus/icons-vue'

// 全局签名状态管理
const globalSignatureState = {
  selectedSignature: null as Signature | null,
  listeners: [] as ((signature: Signature | null) => void)[],
  
  setSelectedSignature(signature: Signature | null) {
    this.selectedSignature = signature
    this.listeners.forEach(listener => listener(signature))
  },
  
  addListener(listener: (signature: Signature | null) => void) {
    this.listeners.push(listener)
  },
  
  removeListener(listener: (signature: Signature | null) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }
}

// 类型定义
interface Signature {
  id: string
  name: string
  url: string
  uploadDate: string
}

interface SignatureAssociation {
  id: string
  expertName: string
  expertTitle: string
  signatureId: string
  signatureName: string
  signatureUrl: string
  associateDate: string
}

// 响应式数据
const signatures = ref<Signature[]>([
  {
    id: '1',
    name: '专家签名1',
    url: 'https://via.placeholder.com/200x100?text=Signature+1',
    uploadDate: '2026-03-01'
  },
  {
    id: '2',
    name: '专家签名2',
    url: 'https://via.placeholder.com/200x100?text=Signature+2',
    uploadDate: '2026-03-01'
  },
  {
    id: '3',
    name: '专家签名3',
    url: 'https://via.placeholder.com/200x100?text=Signature+3',
    uploadDate: '2026-03-01'
  }
])

const signatureAssociations = ref<SignatureAssociation[]>([])
const selectedSignatureId = ref<string>('1')
const uploadedFiles = ref<any[]>([])
const uploadError = ref('')
const isUploading = ref(false)

const replaceDialogVisible = ref(false)
const replaceFileList = ref<any[]>([])
const replaceError = ref('')
const isReplacing = ref<string | null>(null)
const currentReplaceId = ref<string>('')

// 专家信息
const expertInfo = reactive({
  name: '',
  title: ''
})

// 搜索功能
const signatureSearch = ref('')

// 手机签名相关
const mobileSignatureDialogVisible = ref(false)
const qrcodeUrl = ref('https://via.placeholder.com/200x200?text=QR+Code')
const mobileSignatureData = ref<string>('')

// 签名预览相关
const previewDialogVisible = ref(false)
const previewSignatureUrl = ref('')

// 计算属性
const filteredSignatures = computed(() => {
  if (!signatureSearch.value) {
    return signatures.value
  }
  const searchTerm = signatureSearch.value.toLowerCase()
  return signatures.value.filter(signature => 
    signature.name.toLowerCase().includes(searchTerm)
  )
})

// 处理文件上传
const handleFileChange = (file: any) => {
  // 重置错误信息
  uploadError.value = ''
  
  // 验证文件类型
  const allowedTypes = ['.jpg', '.jpeg', '.png']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(fileExtension)) {
    uploadError.value = '只支持上传 JPG、PNG 格式的图片'
    uploadedFiles.value = []
    return
  }
  
  // 验证文件大小（2MB）
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    uploadError.value = '文件大小不能超过 2MB'
    uploadedFiles.value = []
    return
  }
  
  // 添加文件到上传列表
  uploadedFiles.value = [file]
}

// 处理文件移除
const handleFileRemove = () => {
  uploadedFiles.value = []
  uploadError.value = ''
}

// 确认上传
const confirmUpload = async () => {
  if (uploadedFiles.value.length === 0) {
    ElMessage.error('请选择要上传的签名图片')
    return
  }
  
  isUploading.value = true
  
  try {
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const today = new Date().toISOString().split('T')[0] || ''
    // 创建新签名对象
    const newSignature: Signature = {
      id: String(Date.now()),
      name: uploadedFiles.value[0].name,
      url: URL.createObjectURL(uploadedFiles.value[0].raw),
      uploadDate: today
    }
    
    // 添加到签名列表
    signatures.value.push(newSignature)
    
    // 选择新上传的签名
    selectedSignatureId.value = newSignature.id
    
    // 如果有专家信息，自动关联
    if (expertInfo.name) {
      associateSignatureWithExpert(newSignature)
    }
    
    // 清空上传列表
    uploadedFiles.value = []
    
    ElMessage.success('签名上传成功')
  } catch (error) {
    ElMessage.error('上传失败，请重试')
    console.error('上传错误:', error)
  } finally {
    isUploading.value = false
  }
}

// 选择签名
const selectSignature = (id: string) => {
  selectedSignatureId.value = id
  const selectedSignature = signatures.value.find(s => s.id === id)
  if (selectedSignature) {
    globalSignatureState.setSelectedSignature(selectedSignature)
    ElMessage.success('已选择签名')
  }
}

// 关联签名
const associateSignature = () => {
  if (!expertInfo.name) {
    ElMessage.error('请输入专家姓名')
    return
  }
  if (!selectedSignatureId.value) {
    ElMessage.error('请选择签名')
    return
  }
  
  const selectedSignature = signatures.value.find(s => s.id === selectedSignatureId.value)
  if (selectedSignature) {
    associateSignatureWithExpert(selectedSignature)
  }
}

// 关联签名与专家
const associateSignatureWithExpert = (signature: Signature) => {
  const today = new Date().toISOString().split('T')[0] || ''
  const newAssociation: SignatureAssociation = {
    id: String(Date.now()),
    expertName: expertInfo.name,
    expertTitle: expertInfo.title,
    signatureId: signature.id,
    signatureName: signature.name,
    signatureUrl: signature.url,
    associateDate: today
  }
  
  signatureAssociations.value.push(newAssociation)
  ElMessage.success('签名关联成功')
}

// 移除关联
const removeAssociation = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除这个关联记录吗？',
    '删除关联',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    signatureAssociations.value = signatureAssociations.value.filter(a => a.id !== id)
    ElMessage.success('关联删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 替换签名
const replaceSignature = (id: string) => {
  currentReplaceId.value = id
  replaceFileList.value = []
  replaceError.value = ''
  replaceDialogVisible.value = true
}

// 处理替换文件上传
const handleReplaceFileChange = (file: any) => {
  // 重置错误信息
  replaceError.value = ''
  
  // 验证文件类型
  const allowedTypes = ['.jpg', '.jpeg', '.png']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(fileExtension)) {
    replaceError.value = '只支持上传 JPG、PNG 格式的图片'
    replaceFileList.value = []
    return
  }
  
  // 验证文件大小（2MB）
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    replaceError.value = '文件大小不能超过 2MB'
    replaceFileList.value = []
    return
  }
  
  // 添加文件到上传列表
  replaceFileList.value = [file]
}

// 处理替换文件移除
const handleReplaceFileRemove = () => {
  replaceFileList.value = []
  replaceError.value = ''
}

// 确认替换
const confirmReplace = async () => {
  if (replaceFileList.value.length === 0) {
    ElMessage.error('请选择要替换的签名图片')
    return
  }
  
  isReplacing.value = currentReplaceId.value
  
  try {
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新签名
    const index = signatures.value.findIndex(s => s.id === currentReplaceId.value)
    if (index !== -1) {
      const current = signatures.value[index]
      if (!current) return
      const today = new Date().toISOString().split('T')[0] || ''
      const updatedSignature: Signature = {
        ...current,
        name: replaceFileList.value[0].name,
        url: URL.createObjectURL(replaceFileList.value[0].raw),
        uploadDate: today
      }
      signatures.value[index] = updatedSignature
      
      // 更新关联记录中的签名信息
      signatureAssociations.value.forEach(association => {
        if (association.signatureId === currentReplaceId.value) {
          association.signatureName = updatedSignature.name
          association.signatureUrl = updatedSignature.url
        }
      })
    }
    
    // 关闭对话框
    replaceDialogVisible.value = false
    
    ElMessage.success('签名替换成功')
  } catch (error) {
    ElMessage.error('替换失败，请重试')
    console.error('替换错误:', error)
  } finally {
    isReplacing.value = null
  }
}

// 删除签名
const deleteSignature = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除这个签名吗？删除后相关的关联记录也会被删除。',
    '删除签名',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 模拟删除过程
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 从列表中删除
      signatures.value = signatures.value.filter(s => s.id !== id)
      
      // 删除相关的关联记录
      signatureAssociations.value = signatureAssociations.value.filter(a => a.signatureId !== id)
      
      // 如果删除的是当前选中的签名，选择第一个签名
      if (selectedSignatureId.value === id && signatures.value.length > 0) {
        const first = signatures.value[0]
        if (first) {
          selectedSignatureId.value = first.id
        }
      } else if (signatures.value.length === 0) {
        selectedSignatureId.value = ''
      }
      
      ElMessage.success('签名删除成功')
    } catch (error) {
      ElMessage.error('删除失败，请重试')
      console.error('删除错误:', error)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 打开手机签名对话框
const openMobileSignatureDialog = () => {
  if (!expertInfo.name) {
    ElMessage.error('请输入专家姓名')
    return
  }
  
  // 生成模拟二维码
  qrcodeUrl.value = 'https://via.placeholder.com/200x200?text=Mobile+Signature+QR'
  mobileSignatureData.value = ''
  mobileSignatureDialogVisible.value = true
  
  // 模拟手机签名数据（实际项目中应该通过WebSocket或API接收）
  setTimeout(() => {
    mobileSignatureData.value = 'https://via.placeholder.com/300x100?text=Mobile+Signature'
  }, 3000)
}

// 确认手机签名
const confirmMobileSignature = async () => {
  if (!mobileSignatureData.value) {
    ElMessage.error('请先在手机端完成签名')
    return
  }
  
  try {
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 创建新签名对象
    const today = new Date().toISOString().split('T')[0] || ''
    const newSignature: Signature = {
      id: String(Date.now()),
      name: `${expertInfo.name}的手机签名`,
      url: mobileSignatureData.value,
      uploadDate: today
    }
    
    // 添加到签名列表
    signatures.value.push(newSignature)
    
    // 关联签名
    associateSignatureWithExpert(newSignature)
    
    // 关闭对话框
    mobileSignatureDialogVisible.value = false
    
    ElMessage.success('手机签名成功')
  } catch (error) {
    ElMessage.error('签名失败，请重试')
    console.error('手机签名错误:', error)
  }
}

// 预览签名
const previewSignature = (signature: Signature) => {
  previewSignatureUrl.value = signature.url
  previewDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.expert-signature-view {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;

  .page-header {
    margin-bottom: 30px;

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }

    p {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  .expert-info-section {
    margin-bottom: 30px;

    .expert-info-form {
      margin-top: 20px;
    }
  }

  .upload-section {
    margin-bottom: 30px;

    .upload-area {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .upload-dragger {
        width: 100%;
        border: 2px dashed #d9d9d9;
        border-radius: 8px;
        padding: 40px;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409EFF;
          background-color: #ecf5ff;
        }
      }

      .upload-error {
        color: #f56c6c;
        font-size: 12px;
      }
    }
  }

  .signature-gallery {
    margin-bottom: 30px;

    .signature-search {
      margin-bottom: 20px;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;

      .signature-item {
        background-color: #ffffff;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.3s ease;
        cursor: pointer;

        &:hover {
          border-color: #409EFF;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        &.active {
          border-color: #409EFF;
          background-color: #ecf5ff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }

        .signature-image-container {
          position: relative;
          margin-bottom: 12px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #f0f0f0;

          .signature-image {
            width: 100%;
            height: 120px;
            object-fit: contain;
            background-color: #f9f9f9;
          }

          .signature-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.6);
            padding: 8px;
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            opacity: 0;
            transition: opacity 0.3s ease;

            .signature-item:hover & {
              opacity: 1;
            }
          }

          .signature-selector {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #ffffff;
            border: 2px solid #409EFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #409EFF;

            .el-icon {
              font-weight: bold;
            }
          }
        }

        .signature-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;

          .signature-name {
            font-weight: 500;
            color: #303133;
          }

          .signature-date {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .empty-gallery {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background-color: #fafafa;
        border: 2px dashed #d9d9d9;
        border-radius: 8px;

        .empty-icon {
          font-size: 48px;
          color: #d9d9d9;
          margin-bottom: 16px;
        }

        p {
          font-size: 14px;
          color: #909399;
          margin: 0;
        }
      }
    }
  }

  .signature-list-section {
    margin-bottom: 30px;

    .empty-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background-color: #fafafa;
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      margin-top: 20px;

      .empty-icon {
        font-size: 48px;
        color: #d9d9d9;
        margin-bottom: 16px;
      }

      p {
        font-size: 14px;
        color: #909399;
        margin: 0;
      }
    }
  }

  .replace-upload {
    .upload-dragger {
      width: 100%;
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      padding: 40px;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409EFF;
        background-color: #ecf5ff;
      }
    }

    .upload-error {
      color: #f56c6c;
      font-size: 12px;
      margin-top: 12px;
    }
  }

  .mobile-signature-container {
    display: flex;
    gap: 40px;

    .qrcode-section {
      flex: 1;
      text-align: center;

      h4 {
        margin-bottom: 20px;
      }

      .qrcode {
        margin-bottom: 20px;

        .qrcode-image {
          width: 200px;
          height: 200px;
        }
      }

      .qrcode-tip {
        color: #909399;
        font-size: 14px;
      }
    }

    .signature-preview {
      flex: 1;

      h4 {
        margin-bottom: 20px;
      }

      .preview-area {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 20px;
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f9f9f9;

        &.empty {
          flex-direction: column;

          .empty-icon {
            font-size: 48px;
            color: #d9d9d9;
            margin-bottom: 16px;
          }

          p {
            font-size: 14px;
            color: #909399;
            margin: 0;
          }
        }

        .preview-image {
          max-width: 100%;
          max-height: 120px;
          object-fit: contain;
        }
      }
    }
  }

  .preview-dialog-content {
    text-align: center;

    .full-signature-image {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }
  }
}
</style>
