<template>
  <div class="risk-control-view">
      <div class="page-header">
        <h2>工程风险智控</h2>
        <div class="header-actions">
          <el-button type="primary" @click="createRiskKnowledgeBase">
            <el-icon><folder-add /></el-icon>
            创建风险识别知识库
          </el-button>
        </div>
      </div>

      <!-- 风险识别知识库选择 -->
      <div class="knowledge-base-select">
        <el-form :inline="true" :model="knowledgeBaseForm" class="knowledge-base-form">
          <el-form-item label="选择风险识别知识库">
            <el-select v-model="knowledgeBaseForm.knowledgeBaseId" placeholder="请选择风险识别知识库" clearable>
              <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择规范">
            <el-select v-model="knowledgeBaseForm.specIds" multiple placeholder="请选择规范" clearable>
              <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择案例">
            <el-select v-model="knowledgeBaseForm.caseIds" multiple placeholder="请选择案例" clearable>
              <el-option v-for="caseItem in cases" :key="caseItem.id" :label="caseItem.name" :value="caseItem.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadKnowledgeBase">加载知识库</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 施工方案上传 -->
      <div class="plan-upload">
        <el-card shadow="hover">
          <h3>施工安全专项方案上传</h3>
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
            <el-form-item label="项目信息">
              <el-input v-model="planForm.projectInfo" type="textarea" :rows="3" placeholder="请输入项目信息" />
            </el-form-item>
            <el-form-item label="方案内容">
              <el-input v-model="planForm.planContent" type="textarea" :rows="4" placeholder="请输入方案内容" />
            </el-form-item>
          </el-form>

          <div class="upload-actions">
            <el-button type="primary" @click="startRiskIdentification">开始风险识别</el-button>
          </div>
        </el-card>
      </div>

      <!-- 风险识别结果 -->
      <div v-if="showRiskIdentification" class="risk-identification">
        <el-card shadow="hover">
          <h3>风险识别结果</h3>
          <div class="risk-list">
            <el-table :data="riskList" style="width: 100%">
              <el-table-column prop="id" label="风险ID" width="80" />
              <el-table-column prop="name" label="风险名称" min-width="200" />
              <el-table-column prop="description" label="风险描述" min-width="300" />
              <el-table-column prop="source" label="风险来源" width="150" />
              <el-table-column prop="impact" label="影响程度" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.impact === '高' ? 'danger' : scope.row.impact === '中' ? 'warning' : 'info'">
                    {{ scope.row.impact }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="editRisk(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteRisk(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="identification-actions">
            <el-button @click="addRisk">添加风险</el-button>
            <el-button type="primary" @click="startRiskAssessment">开始风险评估</el-button>
          </div>
        </el-card>
      </div>

      <!-- 风险评估 -->
      <div v-if="showRiskAssessment" class="risk-assessment">
        <el-card shadow="hover">
          <h3>风险评估</h3>
          <div class="assessment-method">
            <el-form :model="assessmentForm" class="assessment-form">
              <el-form-item label="评估方法">
                <el-select v-model="assessmentForm.method" placeholder="请选择评估方法">
                  <el-option label="层次分析法 (AHP)" value="ahp" />
                  <el-option label="风险矩阵法" value="matrix" />
                  <el-option label="模糊层次分析法" value="fuzzy" />
                  <el-option label="贝叶斯网络法" value="bayesian" />
                  <el-option label="蒙特卡洛法" value="montecarlo" />
                  <el-option label="专家调查法" value="expert" />
                </el-select>
              </el-form-item>
              <el-form-item label="算法组合">
                <el-checkbox-group v-model="assessmentForm.combination">
                  <el-checkbox label="ahp">层次分析法</el-checkbox>
                  <el-checkbox label="matrix">风险矩阵法</el-checkbox>
                  <el-checkbox label="fuzzy">模糊层次分析法</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="runAssessment">运行评估</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div v-if="showAssessmentResult" class="assessment-result">
            <h4>评估结果</h4>
            <div class="result-content">
              <el-table :data="assessmentResults" style="width: 100%">
                <el-table-column prop="riskId" label="风险ID" width="80" />
                <el-table-column prop="riskName" label="风险名称" min-width="200" />
                <el-table-column prop="probability" label="发生概率" width="120" />
                <el-table-column prop="impact" label="影响程度" width="120" />
                <el-table-column prop="riskLevel" label="风险等级" width="120">
                  <template #default="scope">
                    <el-tag :type="scope.row.riskLevel === '高' ? 'danger' : scope.row.riskLevel === '中' ? 'warning' : 'info'">
                      {{ scope.row.riskLevel }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="score" label="风险分值" width="100" />
              </el-table>
            </div>

            <div class="assessment-actions">
              <el-button type="primary" @click="startRiskTreatment">开始风险处理</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 风险处理 -->
      <div v-if="showRiskTreatment" class="risk-treatment">
        <el-card shadow="hover">
          <h3>风险处理</h3>
          <div class="treatment-content">
            <el-form :model="treatmentForm" class="treatment-form">
              <el-form-item label="处理策略">
                <el-radio-group v-model="treatmentForm.strategy">
                  <el-radio label="riskAvoidance">风险规避</el-radio>
                  <el-radio label="riskTransfer">风险转移</el-radio>
                  <el-radio label="riskMitigation">风险减轻</el-radio>
                  <el-radio label="riskAcceptance">风险接受</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="处理方案">
                <el-input v-model="treatmentForm.plan" type="textarea" :rows="4" placeholder="请输入处理方案" />
              </el-form-item>
              <el-form-item label="责任分配">
                <el-input v-model="treatmentForm.responsibility" placeholder="请输入责任分配" />
              </el-form-item>
              <el-form-item label="时间计划">
                <el-date-picker
                  v-model="treatmentForm.timeline"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitTreatment">提交处理方案</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// 响应式数据
const knowledgeBaseForm = reactive({
  knowledgeBaseId: '',
  specIds: [] as string[],
  caseIds: [] as string[]
})

const knowledgeBases = ref([
  { id: '1', name: '建筑施工风险识别知识库' },
  { id: '2', name: '结构施工风险识别知识库' },
  { id: '3', name: '安全施工风险识别知识库' }
])

const specs = ref([
  { id: '1', name: '建筑设计防火规范', code: 'GB 50016-2014' },
  { id: '2', name: '混凝土结构设计规范', code: 'GB 50010-2010' },
  { id: '3', name: '建筑抗震设计规范', code: 'GB 50011-2010' }
])

const cases = ref([
  { id: '1', name: '建筑火灾事故案例' },
  { id: '2', name: '结构坍塌事故案例' },
  { id: '3', name: '施工安全事故案例' }
])

const planForm = reactive({
  projectInfo: '',
  planContent: ''
})

const showRiskIdentification = ref(false)
const showRiskAssessment = ref(false)
const showRiskTreatment = ref(false)

// 模拟数据
const riskList = ref([
  {
    id: '1',
    name: '火灾风险',
    description: '施工过程中可能发生火灾，导致人员伤亡和财产损失',
    source: '施工用电',
    impact: '高'
  },
  {
    id: '2',
    name: '结构坍塌风险',
    description: '施工过程中结构可能发生坍塌，导致人员伤亡和财产损失',
    source: '结构设计',
    impact: '高'
  },
  {
    id: '3',
    name: '高处坠落风险',
    description: '施工人员可能从高处坠落，导致人员伤亡',
    source: '安全措施',
    impact: '中'
  },
  {
    id: '4',
    name: '触电风险',
    description: '施工人员可能触电，导致人员伤亡',
    source: '施工用电',
    impact: '中'
  }
])

const assessmentForm = reactive({
  method: '',
  combination: [] as string[]
})

const showAssessmentResult = ref(false)

const assessmentResults = ref([
  {
    riskId: '1',
    riskName: '火灾风险',
    probability: '0.8',
    impact: '高',
    riskLevel: '高',
    score: '8.5'
  },
  {
    riskId: '2',
    riskName: '结构坍塌风险',
    probability: '0.6',
    impact: '高',
    riskLevel: '高',
    score: '7.2'
  },
  {
    riskId: '3',
    riskName: '高处坠落风险',
    probability: '0.5',
    impact: '中',
    riskLevel: '中',
    score: '5.5'
  },
  {
    riskId: '4',
    riskName: '触电风险',
    probability: '0.4',
    impact: '中',
    riskLevel: '中',
    score: '4.8'
  }
])

const treatmentForm = reactive({
  strategy: '',
  plan: '',
  responsibility: '',
  timeline: [] as any[]
})

// 方法
const createRiskKnowledgeBase = () => {
  // 创建风险识别知识库
  console.log('创建风险识别知识库')
}

const loadKnowledgeBase = () => {
  // 加载知识库
  console.log('加载知识库', knowledgeBaseForm)
}

const handleFileChange = (file: any) => {
  // 处理文件上传
  console.log('文件上传', file)
}

const startRiskIdentification = () => {
  // 开始风险识别
  console.log('开始风险识别', planForm)
  showRiskIdentification.value = true
}

const editRisk = (risk: any) => {
  // 编辑风险
  console.log('编辑风险', risk)
}

const deleteRisk = (riskId: string) => {
  // 删除风险
  console.log('删除风险', riskId)
}

const addRisk = () => {
  // 添加风险
  console.log('添加风险')
}

const startRiskAssessment = () => {
  // 开始风险评估
  console.log('开始风险评估')
  showRiskAssessment.value = true
}

const runAssessment = () => {
  // 运行评估
  console.log('运行评估', assessmentForm)
  showAssessmentResult.value = true
}

const startRiskTreatment = () => {
  // 开始风险处理
  console.log('开始风险处理')
  showRiskTreatment.value = true
}

const submitTreatment = () => {
  // 提交处理方案
  console.log('提交处理方案', treatmentForm)
}
</script>

<style lang="scss" scoped>
.risk-control-view {
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

.knowledge-base-select {
  margin-bottom: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.knowledge-base-form {
  width: 100%;
  flex-wrap: wrap;
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

.risk-identification,
.risk-assessment,
.risk-treatment {
  margin-bottom: 24px;
}

.risk-identification h3,
.risk-assessment h3,
.risk-treatment h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.identification-actions,
.assessment-actions {
  margin-top: 24px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.assessment-method {
  margin-bottom: 24px;
}

.assessment-form {
  width: 100%;
}

.assessment-result {
  margin-top: 24px;
}

.assessment-result h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.treatment-form {
  width: 100%;
}

@media (max-width: 768px) {
  .knowledge-base-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .knowledge-base-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .assessment-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .assessment-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .treatment-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .treatment-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>