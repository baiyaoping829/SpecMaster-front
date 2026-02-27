<template>
  <div class="similar-clauses-view">
    <div class="page-header">
      <h2>相似条款检索</h2>
      <el-button type="primary" @click="closePage">关闭页面</el-button>
    </div>

    <!-- 搜索参数配置 -->
    <el-card class="config-card">
      <h3>搜索配置</h3>
      <el-form :inline="true" :model="searchConfig" class="config-form">
        <el-form-item label="相似度阈值">
          <el-slider 
            v-model="searchConfig.similarityThreshold" 
            :min="0" 
            :max="100" 
            :step="5"
            show-input
          />
          <span class="threshold-value">{{ searchConfig.similarityThreshold }}%</span>
        </el-form-item>
        <el-form-item label="搜索范围">
          <el-select v-model="searchConfig.searchScope" placeholder="选择搜索范围" style="width: auto; min-width: 120px;">
            <el-option label="当前规范" value="current" />
            <el-option label="所有规范" value="all" />
            <el-option label="指定主题库" value="themes" />
            <el-option label="指定规范" value="specific" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="searchConfig.searchScope === 'themes'" label="目标主题库">
          <el-select v-model="searchConfig.targetThemes" multiple placeholder="选择主题库" style="width: auto; min-width: 200px;">
            <el-option v-for="theme in availableThemes" :key="theme.id" :label="theme.name" :value="theme.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="searchConfig.searchScope === 'specific'" label="指定规范">
          <el-autocomplete
            v-model="searchConfig.specificSpec"
            :fetch-suggestions="querySearch"
            placeholder="输入规范名称"
            style="width: auto; min-width: 200px;"
            @select="handleSelect"
          />
        </el-form-item>
        <el-form-item label="算法选择">
          <el-select v-model="searchConfig.algorithm" placeholder="选择算法" style="width: auto; min-width: 180px;">
            <el-option label="大语言模型推荐" value="llm" />
            <el-option label="语句向量相似度" value="vector" />
            <el-option label="ES关键词匹配" value="es" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="searchConfig.algorithm === 'llm'" label="大语言模型">
          <el-select v-model="searchConfig.llmModel" placeholder="选择模型" style="width: auto; min-width: 120px;">
            <el-option label="通义千问 (qwen)" value="qwen" />
            <el-option label="深度求索 (Deepseek)" value="deepseek" />
            <el-option label="豆包 (doubao)" value="doubao" />
            <el-option label="GLM" value="glm" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="searchConfig.algorithm === 'llm'" label="模型版本">
          <el-input v-model="searchConfig.llmVersion" placeholder="输入模型版本" style="width: auto; min-width: 100px;" />
        </el-form-item>
        <el-form-item label="结果条数">
          <el-select v-model="searchConfig.resultCount" placeholder="选择结果条数" style="width: auto; min-width: 100px;">
            <el-option label="5条" value="5" />
            <el-option label="10条" value="10" />
            <el-option label="20条" value="20" />
            <el-option label="50条" value="50" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchSimilarClauses">开始检索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 原条款信息 -->
    <el-card v-for="originalClause in originalClauses" :key="originalClause.id" class="original-clause-card">
      <h3>原条款信息 - {{ originalClause.id }}</h3>
      <div class="original-clause">
        <div class="clause-id">{{ originalClause.id }}</div>
        <div class="clause-content">{{ originalClause.content }}</div>
      </div>
    </el-card>

    <!-- 相似条款结果 -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><loading /></el-icon>
      <span>正在检索相似条款...</span>
    </div>
    <div v-else-if="Object.keys(filteredSimilarClausesByOriginal).length === 0" class="no-results">
      <el-icon><warning /></el-icon>
      <span>未找到相似条款</span>
    </div>
    <el-card 
      v-else 
      v-for="(clauses, originalId) in filteredSimilarClausesByOriginal" 
      :key="originalId" 
      class="similar-results-card"
    >
      <h3>相似条款结果 - 原条款 {{ originalId }}</h3>
      <div class="original-clause">
        <div class="clause-id">原条款编号：{{ originalId }}</div>
        <div class="clause-content">原条款内容：{{ getOriginalClauseContent(originalId) }}</div>
      </div>
      <div class="similar-results-wrapper">
        <el-table :data="clauses" style="width: 100%"><el-table-column prop="similarity" label="相似度" width="120">
            <template #default="scope">
              <div class="similarity-bar">
                <div 
                  class="similarity-fill" 
                  :style="{ width: scope.row.similarity + '%' }"
                  :class="getSimilarityClass(scope.row.similarity)"
                ></div>
                <span class="similarity-text">{{ scope.row.similarity }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="specName" label="规范名称" width="200">
            <template #default="scope">
              <div :class="{ 'low-similarity-text': scope.row.similarity < searchConfig.similarityThreshold }">
                {{ scope.row.specName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="clauseId" label="条款编号" width="120">
            <template #default="scope">
              <div :class="{ 'low-similarity-text': scope.row.similarity < searchConfig.similarityThreshold }">
                {{ scope.row.clauseId }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="条款内容">
            <template #default="scope">
              <div 
                class="clause-content-text" 
                :class="{ 'low-similarity-text': scope.row.similarity < searchConfig.similarityThreshold }"
              >
                {{ scope.row.content }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <div class="clause-actions">
                <el-button 
                  size="small" 
                  type="info" 
                  @click="searchSimilarForClause(scope.row)"
                  :class="{ 'low-similarity-btn': scope.row.similarity < searchConfig.similarityThreshold }"
                >
                  <el-icon><search /></el-icon>
                  二次检索
                </el-button>
                <el-button 
                  size="small" 
                  type="success" 
                  @click="addRelation(scope.row)"
                  :disabled="scope.row.related || scope.row.similarity < searchConfig.similarityThreshold"
                  :class="{ 'low-similarity-btn': scope.row.similarity < searchConfig.similarityThreshold }"
                >
                  {{ scope.row.related ? '已关联' : '关联到图谱' }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 原条款信息
const originalClauses = ref<any[]>([])

// 搜索配置
const searchConfig = reactive({
  similarityThreshold: 70,
  searchScope: 'current' as 'current' | 'all' | 'themes' | 'specific',
  targetThemes: [] as string[],
  specificSpec: '',
  algorithm: 'llm' as 'llm' | 'vector' | 'es',
  llmModel: 'qwen' as 'qwen' | 'deepseek' | 'doubao' | 'glm',
  llmVersion: 'latest',
  resultCount: 10
})

// 可用主题库
const availableThemes = ref([
  { id: '1', name: '桥梁设计' },
  { id: '2', name: '隧道设计' },
  { id: '3', name: '风险评估' },
  { id: '4', name: '建筑防火' }
])

// 相似条款，按原条款分组
const similarClausesByOriginal = ref<Record<string, any[]>>({})
const loading = ref(false)

// 所有相似条款
const allSimilarClauses = computed(() => {
  return Object.values(similarClausesByOriginal.value).flat()
})

// 过滤后的相似条款，按原条款分组
const filteredSimilarClausesByOriginal = computed(() => {
  const result: Record<string, any[]> = {}
  Object.entries(similarClausesByOriginal.value).forEach(([originalId, clauses]) => {
    const filtered = clauses.filter(clause => clause.similarity >= searchConfig.similarityThreshold)
    if (filtered.length > 0) {
      result[originalId] = filtered
    }
  })
  return result
})

// 生命周期钩子
onMounted(() => {
  // 从URL参数获取原条款信息
  const urlParams = new URLSearchParams(window.location.search)
  
  // 支持多个原条款，格式为 clauseId1,clauseId2,... 和 content1,content2,...
  const clauseIds = urlParams.get('clauseId')?.split(',') || []
  const contents = urlParams.get('content')?.split('|||') || []
  
  // 构建原条款数组
  originalClauses.value = clauseIds.map((id, index) => ({
    id,
    content: contents[index] ? decodeURIComponent(contents[index]) : ''
  })).filter(clause => clause.id && clause.content)
  
  // 如果没有原条款，添加一个默认的
  if (originalClauses.value.length === 0) {
    originalClauses.value = [{
      id: '1.0.1',
      content: '为了保障建筑工程的消防安全，减少火灾危害，保护人身和财产安全，制定本规范。'
    }]
  }
  
  // 加载保存的配置
  loadSavedConfig()
  
  // 自动开始搜索
  searchSimilarClauses()
})

// 加载保存的配置
const loadSavedConfig = () => {
  const savedConfig = localStorage.getItem('similarClausesConfig')
  if (savedConfig) {
    const config = JSON.parse(savedConfig)
    Object.assign(searchConfig, config)
  }
}

// 保存配置
const saveConfig = () => {
  localStorage.setItem('similarClausesConfig', JSON.stringify(searchConfig))
}

// 规范列表，用于自动推荐
const specList = [
  '建筑设计防火规范',
  '混凝土结构设计规范',
  '建筑抗震设计规范',
  '建筑地基基础设计规范',
  '建筑节能设计标准',
  '建筑结构荷载规范',
  '建筑地基处理技术规范',
  '建筑边坡工程技术规范',
  '建筑桩基技术规范',
  '建筑工程抗震设防分类标准'
];

// 自动推荐规范名称
const querySearch = (queryString: string, cb: (data: any[]) => void) => {
  const results = queryString
    ? specList.filter(spec => spec.toLowerCase().includes(queryString.toLowerCase()))
    : [];
  // 调用 callback 返回建议列表
  cb(results.map(spec => ({ value: spec })));
};

// 处理选择规范
const handleSelect = (item: { value: string }) => {
  searchConfig.specificSpec = item.value;
};

// 搜索相似条款
const searchSimilarClauses = () => {
  loading.value = true
  
  // 保存配置
  saveConfig()
  
  // 模拟搜索过程
  setTimeout(() => {
    // 为每个原条款生成相似条款
    const result: Record<string, any[]> = {}
    
    // 不同规范的信息
    const specInfos = [
      {
        name: '建筑设计防火规范',
        clausePrefix: '1.0.',
        contentTemplate: '为了保障建筑工程的消防安全，减少火灾危害，保护人身和财产安全，制定本规范。第{num}条'
      },
      {
        name: '混凝土结构设计规范',
        clausePrefix: '3.1.',
        contentTemplate: '为了在混凝土结构设计中贯彻执行国家的技术经济政策，做到安全适用、技术先进、经济合理、确保质量，制定本规范。第{num}条'
      },
      {
        name: '建筑抗震设计规范',
        clausePrefix: '2.1.',
        contentTemplate: '为了贯彻执行国家的技术经济政策，做到安全、适用、经济，合理地进行抗震设计，制定本规范。第{num}条'
      },
      {
        name: '建筑地基基础设计规范',
        clausePrefix: '3.2.',
        contentTemplate: '为了在地基基础设计中贯彻执行国家的技术经济政策，做到安全适用、技术先进、经济合理、确保质量，制定本规范。第{num}条'
      },
      {
        name: '建筑节能设计标准',
        clausePrefix: '4.1.',
        contentTemplate: '为了贯彻执行国家节约能源的政策，改善室内热环境，提高能源利用效率，制定本标准。第{num}条'
      }
    ];
    
    originalClauses.value.forEach(originalClause => {
      // 模拟相似条款数据，生成20条记录
      let similarClausesForOriginal = []
      
      for (let i = 1; i <= 20; i++) {
        let specInfo = specInfos[0]; // 默认使用第一个规范
        
        // 根据搜索范围生成不同的规范信息
        if (searchConfig.searchScope === 'all') {
          // 所有规范：随机选择不同的规范
          specInfo = specInfos[Math.floor(Math.random() * specInfos.length)];
        } else if (searchConfig.searchScope === 'themes' && searchConfig.targetThemes.length > 0) {
          // 指定主题库：根据主题库选择规范
          // 这里简化处理，根据主题ID选择规范
          const themeIndex = (parseInt(searchConfig.targetThemes[0]) - 1) % specInfos.length;
          specInfo = specInfos[themeIndex];
        } else if (searchConfig.searchScope === 'specific' && searchConfig.specificSpec) {
          // 指定规范：根据用户输入的规范名称选择
          const specIndex = specInfos.findIndex(info => info.name === searchConfig.specificSpec);
          if (specIndex !== -1) {
            specInfo = specInfos[specIndex];
          } else {
            // 如果用户输入的规范不在列表中，使用默认规范
            specInfo = {
              name: searchConfig.specificSpec,
              clausePrefix: '1.0.',
              contentTemplate: `为了规范${searchConfig.specificSpec}，制定本规范。第{num}条`
            };
          }
        }
        // 当前规范：使用默认规范
        
        similarClausesForOriginal.push({
          id: `${originalClause.id}_${i}`,
          specName: specInfo.name,
          clauseId: `${specInfo.clausePrefix}${i}`,
          content: specInfo.contentTemplate.replace('{num}', i.toString()),
          similarity: Math.max(20, 95 - (i - 1) * 4), // 相似度从95%开始递减
          related: false,
          originalClauseId: originalClause.id
        })
      }
      
      // 根据配置的结果条数截取数据
      result[originalClause.id] = similarClausesForOriginal.slice(0, searchConfig.resultCount)
    })
    
    similarClausesByOriginal.value = result
    loading.value = false
  }, 1500)
}

// 二次检索相似条款
const searchSimilarForClause = (clause: any) => {
  // 打开新页面搜索相似条款
  try {
    const url = `/similar-clauses?clauseId=${clause.clauseId}&content=${encodeURIComponent(clause.content)}`;
    window.open(url, '_blank', 'width=1200,height=800');
    console.log('打开相似条款检索页面:', url);
  } catch (error) {
    console.error('打开页面失败:', error);
    ElMessage.error('打开页面失败，请检查网络连接');
  }
}

// 获取相似度样式类
const getSimilarityClass = (similarity: number): string => {
  if (similarity >= 90) return 'high-similarity'
  if (similarity >= 70) return 'medium-similarity'
  return 'low-similarity'
}

// 添加关联到知识图谱
const addRelation = (clause: any) => {
  // 模拟添加关联
  clause.related = true
  ElMessage.success('已关联到知识图谱')
  
  // 这里可以实现实际的关联逻辑，如调用API将关联关系保存到数据库
  console.log('添加关联:', originalClause.value.id, '->', clause.id)
}

// 关闭页面
const closePage = () => {
  window.close()
}

// 根据原条款ID获取原条款内容
const getOriginalClauseContent = (originalId: string): string => {
  const originalClause = originalClauses.value.find(clause => clause.id === originalId)
  return originalClause ? originalClause.content : ''
}
</script>

<style lang="scss" scoped>
.similar-clauses-view {
  width: 100%;
  padding: 20px;
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

.config-card,
.original-clause-card,
.similar-results-card {
  margin-bottom: 24px;
}

.config-form {
  width: 100%;
}

.threshold-value {
  margin-left: 12px;
  font-size: 14px;
  color: #606266;
}

.original-clause {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.clause-id {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.clause-content {
  line-height: 1.6;
  color: #606266;
}

.loading,
.no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.loading span,
.no-results span {
  margin-left: 8px;
}

.similarity-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.similarity-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 10px;
}

.high-similarity {
  background-color: #67c23a;
}

.medium-similarity {
  background-color: #e6a23c;
}

.low-similarity {
  background-color: #f56c6c;
}

.similarity-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.clause-content-text {
  line-height: 1.6;
  color: #606266;
  word-break: break-all;
}

.low-similarity-text {
  color: #909399;
  opacity: 0.7;
}

.low-similarity-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

.similar-results-wrapper {
  max-height: 500px;
  overflow-y: auto;
  
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
}

.clause-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .similar-clauses-view {
    padding: 10px;
  }
  
  .config-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .config-form .el-form-item {
    margin-bottom: 12px;
  }
}
</style>