<template>
  <div class="spec-reader-view">
    <div class="page-header">
      <h2>规范智阅</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createKnowledgeBase">
          <el-icon><folder-add /></el-icon>
          创建阅览主题
        </el-button>
      </div>
    </div>

    <!-- 知识库选择 -->
    <div class="knowledge-base-select">
      <el-form :inline="true" :model="knowledgeBaseForm" class="knowledge-base-form">
        <el-form-item label="选择阅览主题">
          <el-select v-model="knowledgeBaseForm.knowledgeBaseId" placeholder="请选择阅览主题" clearable>
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择规范">
          <el-select v-model="knowledgeBaseForm.specIds" multiple placeholder="请选择规范" clearable>
            <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadKnowledgeBase">加载知识库</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 智能阅读工具栏 -->
    <div class="reader-toolbar">
      <el-card shadow="hover">
        <div class="toolbar-content">
          <div class="toolbar-group">
            <span class="toolbar-label">智能翻译：</span>
            <el-select v-model="readerOptions.translateLanguage" placeholder="选择语言" size="small">
              <el-option label="中文" value="zh" />
              <el-option label="英文" value="en" />
            </el-select>
            <el-button size="small" @click="toggleTranslation">
              {{ readerOptions.showTranslation ? '关闭翻译' : '开启翻译' }}
            </el-button>
          </div>
          <div class="toolbar-group">
            <span class="toolbar-label">智能摘要：</span>
            <el-button size="small" @click="generateSummary">生成摘要</el-button>
          </div>
          <div class="toolbar-group">
            <span class="toolbar-label">思维导图：</span>
            <el-button size="small" @click="generateMindMap">生成导图</el-button>
          </div>
          <div class="toolbar-group">
            <span class="toolbar-label">知识图谱：</span>
            <el-button size="small" @click="generateKnowledgeGraph">生成图谱</el-button>
          </div>
          <div class="toolbar-group">
            <span class="toolbar-label">有声阅读：</span>
            <el-button size="small" @click="toggleAudio">
              {{ readerOptions.audioPlaying ? '停止播放' : '开始播放' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 阅读内容区域 -->
    <div class="reader-content">
      <div class="content-header">
        <h3>{{ currentSpec?.name }} ({{ currentSpec?.code }})</h3>
        <div class="content-actions">
          <el-button size="small" @click="previousSpec">上一个</el-button>
          <el-button size="small" @click="nextSpec">下一个</el-button>
        </div>
      </div>
      <el-card class="content-card">
        <div v-if="readerOptions.showTranslation" class="translation-container">
          <div class="original-content">
            <h4>原文</h4>
            <div class="content-text">
              {{ specContent }}
            </div>
          </div>
          <div class="translated-content">
            <h4>译文</h4>
            <div class="content-text">
              {{ translatedContent }}
            </div>
          </div>
        </div>
        <div v-else class="single-content">
          <div class="content-text">
            {{ specContent }}
          </div>
        </div>
      </el-card>

      <!-- 摘要区域 -->
      <el-card v-if="showSummary" class="summary-card">
        <h4>智能摘要</h4>
        <div class="summary-content">
          {{ summaryContent }}
        </div>
      </el-card>

      <!-- 思维导图区域 -->
      <el-card v-if="showMindMap" class="mindmap-card">
        <h4>思维导图</h4>
        <div class="mindmap-content">
          <div class="mindmap-placeholder">
            <el-icon class="placeholder-icon"><data-analysis /></el-icon>
            <p>思维导图将在这里显示</p>
          </div>
        </div>
      </el-card>

      <!-- 知识图谱区域 -->
      <el-card v-if="showKnowledgeGraph" class="knowledge-graph-card">
        <h4>知识图谱</h4>
        <div class="knowledge-graph-content">
          <div class="knowledge-graph-placeholder">
            <el-icon class="placeholder-icon"><connection /></el-icon>
            <p>知识图谱将在这里显示</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// 响应式数据
const knowledgeBaseForm = reactive({
  knowledgeBaseId: '',
  specIds: [] as string[]
})

const knowledgeBases = ref([
  { id: '1', name: '建筑设计规范' },
  { id: '2', name: '结构设计规范' },
  { id: '3', name: '施工安全规范' }
])

const specs = ref([
  { id: '1', name: '建筑设计防火规范', code: 'GB 50016-2014' },
  { id: '2', name: '混凝土结构设计规范', code: 'GB 50010-2010' },
  { id: '3', name: '建筑抗震设计规范', code: 'GB 50011-2010' }
])

const currentSpecIndex = ref(0)
const currentSpec = computed(() => {
  return specs.value[currentSpecIndex.value]
})

const readerOptions = reactive({
  showTranslation: false,
  translateLanguage: 'en',
  audioPlaying: false
})

const showSummary = ref(false)
const showMindMap = ref(false)
const showKnowledgeGraph = ref(false)

// 模拟数据
const specContent = ref(`1 总则
1.0.1 为了保障建筑工程的消防安全，减少火灾危害，保护人身和财产安全，制定本规范。
1.0.2 本规范适用于新建、扩建和改建的建筑设计防火。
1.0.3 建筑设计防火应遵循国家的有关方针政策，从全局出发，统筹兼顾，做到安全适用、技术先进、经济合理。
1.0.4 建筑设计防火除应符合本规范外，尚应符合国家现行有关标准的规定。

2 术语
2.0.1 建筑高度 建筑物室外设计地面到其檐口或屋面面层的高度。
2.0.2 建筑层数 建筑物的自然层数，按室内地坪±0.00以上计算。
2.0.3 防火墙 防止火灾蔓延至相邻建筑或相邻水平防火分区且耐火极限不低于3.00h的不燃性墙体。
2.0.4 防火隔墙 建筑内防止火灾蔓延至相邻区域且耐火极限不低于规定要求的不燃性墙体。

3 厂房和仓库
3.1 火灾危险性分类
3.1.1 厂房的火灾危险性应根据生产中使用或产生的物质性质及其数量等因素划分，可分为甲、乙、丙、丁、戊类，并应符合表3.1.1的规定。
3.1.2 仓库的火灾危险性应根据储存物品的性质和储存物品中的可燃物数量等因素划分，可分为甲、乙、丙、丁、戊类，并应符合表3.1.3的规定。`)

const translatedContent = ref(`1 General Provisions
1.0.1 This code is formulated to ensure the fire safety of building engineering, reduce fire hazards, and protect personal and property safety.
1.0.2 This code applies to the fire protection design of new, expanded and reconstructed buildings.
1.0.3 Fire protection design of buildings should follow the relevant national policies and guidelines, proceed from the overall situation, make overall plans, and be safe, applicable, technologically advanced and economically reasonable.
1.0.4 Fire protection design of buildings shall not only comply with this code, but also comply with the provisions of other现行 national standards.

2 Terms
2.0.1 Building height The height from the outdoor design ground of the building to its eaves or roof surface.
2.0.2 Number of building stories The natural number of stories of the building, calculated above the indoor floor ±0.00.
2.0.3 Fire wall A non-combustible wall with a fire resistance rating of not less than 3.00h that prevents fire from spreading to adjacent buildings or adjacent horizontal fire compartments.
2.0.4 Fire partition wall A non-combustible wall within a building that prevents fire from spreading to adjacent areas and has a fire resistance rating not less than the specified requirements.

3 Factories and warehouses
3.1 Classification of fire hazards
3.1.1 The fire hazard of a factory building shall be classified according to factors such as the nature and quantity of the substances used or produced in production, and can be divided into Class A, B, C, D, and E, and shall comply with the provisions of Table 3.1.1.
3.1.2 The fire hazard of a warehouse shall be classified according to factors such as the nature of the stored items and the quantity of combustible materials in the stored items, and can be divided into Class A, B, C, D, and E, and shall comply with the provisions of Table 3.1.3.`)

const summaryContent = ref(`本规范主要内容包括：
1. 总则：规定了规范的目的、适用范围和基本原则
2. 术语：定义了建筑高度、建筑层数、防火墙、防火隔墙等术语
3. 厂房和仓库：规定了火灾危险性分类标准

本规范适用于新建、扩建和改建的建筑设计防火，旨在保障建筑工程的消防安全，减少火灾危害，保护人身和财产安全。`)

// 方法
const createKnowledgeBase = () => {
  // 创建阅览主题
  console.log('创建阅览主题')
}

const loadKnowledgeBase = () => {
  // 加载知识库
  console.log('加载知识库', knowledgeBaseForm)
}

const toggleTranslation = () => {
  readerOptions.showTranslation = !readerOptions.showTranslation
}

const generateSummary = () => {
  showSummary.value = true
  // 生成摘要
  console.log('生成摘要')
}

const generateMindMap = () => {
  showMindMap.value = true
  // 生成思维导图
  console.log('生成思维导图')
}

const generateKnowledgeGraph = () => {
  showKnowledgeGraph.value = true
  // 生成知识图谱
  console.log('生成知识图谱')
}

const toggleAudio = () => {
  readerOptions.audioPlaying = !readerOptions.audioPlaying
  // 有声阅读
  console.log('有声阅读', readerOptions.audioPlaying)
}

const previousSpec = () => {
  if (currentSpecIndex.value > 0) {
    currentSpecIndex.value--
  }
}

const nextSpec = () => {
  if (currentSpecIndex.value < specs.value.length - 1) {
    currentSpecIndex.value++
  }
}
</script>

<style lang="scss" scoped>
.spec-reader-view {
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
}

.reader-toolbar {
  margin-bottom: 24px;
}

.toolbar-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.reader-content {
  width: 100%;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.content-card {
  margin-bottom: 24px;
}

.translation-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.original-content,
.translated-content {
  width: 100%;
}

.original-content h4,
.translated-content h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.content-text {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.single-content {
  width: 100%;
}

.summary-card,
.mindmap-card,
.knowledge-graph-card {
  margin-bottom: 24px;
}

.summary-card h4,
.mindmap-card h4,
.knowledge-graph-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.summary-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.mindmap-content,
.knowledge-graph-content {
  height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.mindmap-placeholder,
.knowledge-graph-placeholder {
  text-align: center;
  color: #909399;
}

@media (max-width: 768px) {
  .translation-container {
    grid-template-columns: 1fr;
  }
  
  .toolbar-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .toolbar-group {
    width: 100%;
  }
}
</style>