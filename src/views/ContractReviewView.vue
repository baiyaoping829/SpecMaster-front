<template>
  <div class="contract-review-view">
      <div class="page-header">
        <h2>工程合同智审</h2>
      </div>

      <!-- 合同上传 -->
      <div class="contract-upload">
        <el-card shadow="hover">
          <h3>合同上传</h3>
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

          <el-form :model="contractForm" class="contract-form">
            <el-form-item label="合同名称">
              <el-input v-model="contractForm.name" placeholder="请输入合同名称" />
            </el-form-item>
            <el-form-item label="合同类型">
              <el-select v-model="contractForm.type" placeholder="请选择合同类型">
                <el-option label="施工合同" value="construction" />
                <el-option label="设计合同" value="design" />
                <el-option label="监理合同" value="supervision" />
                <el-option label="采购合同" value="purchase" />
              </el-select>
            </el-form-item>
            <el-form-item label="合同金额">
              <el-input v-model="contractForm.amount" placeholder="请输入合同金额" />
            </el-form-item>
            <el-form-item label="合同期限">
              <el-date-picker
                v-model="contractForm.term"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
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

            <h4>条款分析</h4>
            <div class="clause-analysis">
              <el-collapse>
                <el-collapse-item v-for="(clause, index) in clauseAnalysis" :key="index" :title="`条款 ${index + 1}: ${clause.title}`">
                  <div class="clause-content">
                    <p><strong>条款内容：</strong>{{ clause.content }}</p>
                    <p><strong>存在问题：</strong>{{ clause.issues }}</p>
                    <p><strong>修改建议：</strong>{{ clause.suggestions }}</p>
                    <p><strong>依据标准：</strong>{{ clause.standards }}</p>
                    <p><strong>风险等级：</strong>
                      <el-tag :type="clause.riskLevel === '高' ? 'danger' : clause.riskLevel === '中' ? 'warning' : 'info'">
                        {{ clause.riskLevel }}
                      </el-tag>
                    </p>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <h4>合同对比</h4>
            <div class="contract-compare">
              <el-form :model="compareForm" class="compare-form">
                <el-form-item label="选择对比版本">
                  <el-select v-model="compareForm.versionId" placeholder="请选择对比版本">
                    <el-option label="版本 1.0" value="1" />
                    <el-option label="版本 2.0" value="2" />
                    <el-option label="版本 3.0" value="3" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="compareVersions">对比版本</el-button>
                </el-form-item>
              </el-form>

              <div v-if="showCompareResult" class="compare-result">
                <el-table :data="compareResults" style="width: 100%">
                  <el-table-column prop="clause" label="条款" min-width="200" />
                  <el-table-column prop="currentVersion" label="当前版本" min-width="300" />
                  <el-table-column prop="compareVersion" label="对比版本" min-width="300" />
                  <el-table-column prop="changeType" label="变更类型" width="120">
                    <template #default="scope">
                      <el-tag :type="scope.row.changeType === '新增' ? 'success' : scope.row.changeType === '修改' ? 'warning' : 'danger'">
                        {{ scope.row.changeType }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
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

// 响应式数据
const contractForm = reactive({
  name: '',
  type: '',
  amount: '',
  term: [] as any[]
})

const showReviewResult = ref(false)

// 模拟数据
const reviewOpinion = ref(`根据审查，该合同存在以下问题：

1. 合同条款不完整，缺少争议解决条款
2. 付款条款不够明确，可能导致付款纠纷
3. 违约责任条款不够详细，不利于保护合同双方权益
4. 知识产权条款缺失，可能导致知识产权纠纷

建议对以上问题进行修改后重新提交审查。`)

const clauseAnalysis = ref([
  {
    title: '合同主体',
    content: '甲方：XX建筑公司，乙方：XX建设单位',
    issues: '合同主体信息不完整，缺少法定代表人、联系方式等信息',
    suggestions: '补充合同主体的完整信息，包括法定代表人、联系方式、地址等',
    standards: '《中华人民共和国合同法》',
    riskLevel: '中'
  },
  {
    title: '付款条款',
    content: '甲方应在工程竣工验收后30日内支付工程款',
    issues: '付款条款不够明确，未约定具体的付款比例和时间节点',
    suggestions: '明确约定付款比例和时间节点，如工程进度款、竣工验收款、质保金等',
    standards: '《建设工程施工合同示范文本》',
    riskLevel: '高'
  },
  {
    title: '违约责任',
    content: '任何一方违约，应承担违约责任',
    issues: '违约责任条款不够详细，未约定具体的违约金额和计算方式',
    suggestions: '明确约定具体的违约金额和计算方式，如违约金比例、赔偿范围等',
    standards: '《中华人民共和国合同法》',
    riskLevel: '高'
  },
  {
    title: '争议解决',
    content: '合同争议由双方协商解决',
    issues: '争议解决条款不够完整，未约定协商不成的解决方式',
    suggestions: '补充约定协商不成的解决方式，如仲裁或诉讼',
    standards: '《中华人民共和国仲裁法》',
    riskLevel: '中'
  }
])

const compareForm = reactive({
  versionId: ''
})

const showCompareResult = ref(false)

const compareResults = ref([
  {
    clause: '付款条款',
    currentVersion: '甲方应在工程竣工验收后30日内支付工程款',
    compareVersion: '甲方应在工程竣工验收后15日内支付工程款',
    changeType: '修改'
  },
  {
    clause: '违约责任',
    currentVersion: '任何一方违约，应承担违约责任',
    compareVersion: '任何一方违约，应承担违约责任，违约金为合同金额的5%',
    changeType: '修改'
  },
  {
    clause: '争议解决',
    currentVersion: '合同争议由双方协商解决，协商不成的，提交仲裁委员会仲裁',
    compareVersion: '合同争议由双方协商解决',
    changeType: '修改'
  },
  {
    clause: '知识产权',
    currentVersion: '乙方享有本合同项下工程的知识产权',
    compareVersion: '',
    changeType: '新增'
  }
])

// 方法
const handleFileChange = (file: any) => {
  // 处理文件上传
  console.log('文件上传', file)
}

const startReview = () => {
  // 开始审查
  console.log('开始审查', contractForm)
  showReviewResult.value = true
}

const compareVersions = () => {
  // 对比版本
  console.log('对比版本', compareForm)
  showCompareResult.value = true
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
.contract-review-view {
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

.contract-upload {
  margin-bottom: 24px;
}

.contract-upload h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.contract-form {
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

.clause-analysis {
  margin-top: 16px;
}

.clause-content {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  line-height: 1.6;
  color: #606266;
}

.clause-content p {
  margin-bottom: 8px;
}

.contract-compare {
  margin-top: 24px;
}

.compare-form {
  margin-bottom: 24px;
}

.compare-result {
  margin-top: 16px;
}

.review-actions {
  margin-top: 24px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .contract-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .contract-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .compare-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .compare-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>