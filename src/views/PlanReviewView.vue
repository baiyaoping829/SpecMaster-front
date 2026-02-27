<template>
  <div class="plan-review-view">
    <div class="page-header">
      <h2>方案智审</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createReviewStandard">
          <el-icon><folder-add /></el-icon>
          创建审查标准库
        </el-button>
      </div>
    </div>

    <!-- 审查标准库选择 -->
    <div class="standard-select">
      <el-form :inline="true" :model="standardForm" class="standard-form">
        <el-form-item label="选择审查标准库">
          <el-select v-model="standardForm.standardId" placeholder="请选择审查标准库" clearable>
            <el-option v-for="standard in standards" :key="standard.id" :label="standard.name" :value="standard.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择规范">
          <el-select v-model="standardForm.specIds" multiple placeholder="请选择规范" clearable>
            <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStandard">加载标准库</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 方案上传 -->
    <div class="plan-upload">
      <el-card shadow="hover">
        <h3>方案上传</h3>
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持上传 PDF、DOCX 格式文件，单个文件不超过 50MB
            </div>
          </template>
        </el-upload>

        <el-form :model="planForm" class="plan-form">
          <el-form-item label="项目概要">
            <el-input v-model="planForm.projectSummary" type="textarea" :rows="3" placeholder="请输入项目概要" />
          </el-form-item>
          <el-form-item label="编制依据">
            <el-input v-model="planForm.basis" type="textarea" :rows="2" placeholder="请输入编制依据" />
          </el-form-item>
          <el-form-item label="方案用途">
            <el-input v-model="planForm.purpose" placeholder="请输入方案用途" />
          </el-form-item>
          <el-form-item label="关键词">
            <el-select v-model="planForm.keywords" multiple placeholder="请输入关键词">
              <el-option v-for="keyword in planForm.keywords" :key="keyword" :label="keyword" :value="keyword" />
            </el-select>
            <el-input v-model="newKeyword" placeholder="输入关键词后按回车" @keyup.enter="addKeyword" style="margin-top: 8px;" />
          </el-form-item>
        </el-form>

        <div class="upload-actions">
          <el-button type="primary" @click="startReview">开始审查</el-button>
        </div>
      </el-card>
    </div>

    <!-- 审查结果 -->
    <div v-if="showReviewResult" class="review-result">
      <el-card shadow="hover">
        <h3>审查结果</h3>
        <div class="review-content">
          <h4>审查意见</h4>
          <div class="review-opinion">
            {{ reviewOpinion }}
          </div>

          <h4>修改建议</h4>
          <div class="review-suggestions">
            <el-collapse>
              <el-collapse-item v-for="(suggestion, index) in reviewSuggestions" :key="index" :title="`问题 ${index + 1}: ${suggestion.issue}`">
                <div class="suggestion-content">
                  <p><strong>问题描述：</strong>{{ suggestion.issue }}</p>
                  <p><strong>修改建议：</strong>{{ suggestion.suggestion }}</p>
                  <p><strong>依据标准：</strong>{{ suggestion.standard }}</p>
                  <p><strong>风险等级：</strong>
                    <el-tag :type="getRiskLevelType(suggestion.riskLevel)">
                      {{ suggestion.riskLevel }}
                    </el-tag>
                  </p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <div class="review-actions">
            <el-button @click="downloadReport">下载审查报告</el-button>
            <el-button type="primary" @click="confirmReview">确认审查</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { FolderAdd, UploadFilled } from '@element-plus/icons-vue'

// 响应式数据
const standardForm = reactive({
  standardId: '',
  specIds: [] as string[]
})

const standards = ref([
  { id: '1', name: '建筑施工方案审查标准库' },
  { id: '2', name: '结构施工方案审查标准库' },
  { id: '3', name: '安全施工方案审查标准库' }
])

const specs = ref([
  { id: '1', name: '建筑设计防火规范', code: 'GB 50016-2014' },
  { id: '2', name: '混凝土结构设计规范', code: 'GB 50010-2010' },
  { id: '3', name: '建筑抗震设计规范', code: 'GB 50011-2010' }
])

const planForm = reactive({
  projectSummary: '',
  basis: '',
  purpose: '',
  keywords: [] as string[]
})

const newKeyword = ref('')
const showReviewResult = ref(false)

// 模拟数据
const reviewOpinion = ref(`根据审查标准库和相关规范，对该施工方案进行了全面审查，发现以下问题：

1. 方案中对防火措施的描述不够详细，未明确防火等级和具体措施
2. 混凝土结构设计参数不符合规范要求，需要重新计算
3. 安全措施不全面，缺少应急预案
4. 施工进度安排不合理，可能影响整体工期

建议对以上问题进行修改后重新提交审查。`)

const reviewSuggestions = ref([
  {
    issue: '防火措施描述不够详细',
    suggestion: '应明确防火等级，增加具体的防火措施和消防设施布置',
    standard: '建筑设计防火规范 (GB 50016-2014)',
    riskLevel: '高'
  },
  {
    issue: '混凝土结构设计参数不符合规范要求',
    suggestion: '根据混凝土结构设计规范 (GB 50010-2010) 重新计算结构参数',
    standard: '混凝土结构设计规范 (GB 50010-2010)',
    riskLevel: '高'
  },
  {
    issue: '安全措施不全面',
    suggestion: '增加详细的安全措施和应急预案',
    standard: '建筑施工安全检查标准 (JGJ59-2011)',
    riskLevel: '中'
  },
  {
    issue: '施工进度安排不合理',
    suggestion: '重新调整施工进度计划，确保各工序合理衔接',
    standard: '建设工程项目管理规范 (GB/T50326-2017)',
    riskLevel: '低'
  }
])

// 方法
const getRiskLevelType = (level: string): string => {
  switch (level) {
    case '高':
      return 'danger'
    case '中':
      return 'warning'
    default:
      return 'info'
  }
}

const createReviewStandard = () => {
  // 创建审查标准库
  console.log('创建审查标准库')
}

const loadStandard = () => {
  // 加载标准库
  console.log('加载标准库', standardForm)
}

const handleFileChange = (file: any) => {
  // 处理文件上传
  console.log('文件上传', file)
}

const addKeyword = () => {
  if (newKeyword.value.trim()) {
    planForm.keywords.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

const startReview = () => {
  // 开始审查
  console.log('开始审查', planForm)
  showReviewResult.value = true
}

const downloadReport = () => {
  // 下载审查报告
  console.log('下载审查报告')
}

const confirmReview = () => {
  // 确认审查
  console.log('确认审查')
}
</script>

<style lang="scss" scoped>
.plan-review-view {
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

.standard-select {
  margin-bottom: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.standard-form {
  width: 100%;
}

.plan-upload {
  margin-bottom: 24px;
}

.plan-upload h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.plan-form {
  margin-top: 24px;
}

.upload-actions {
  margin-top: 24px;
  text-align: right;
}

.review-result {
  margin-bottom: 24px;
}

.review-result h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.review-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  margin-top: 24px;
}

.review-opinion {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #606266;
}

.review-suggestions {
  margin-top: 16px;
}

.suggestion-content {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  line-height: 1.6;
  color: #606266;
}

.suggestion-content p {
  margin-bottom: 8px;
}

.review-actions {
  margin-top: 24px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .standard-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .standard-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>