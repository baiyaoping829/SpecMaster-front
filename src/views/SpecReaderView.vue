<template>
  <div class="spec-reader-view">
    <div class="reader-container">
      <!-- 左侧导航栏 -->
      <div class="left-sidebar">
        <div class="sidebar-header">
          <h3>阅览主题</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="createKnowledgeBase" style="margin-right: 8px;">
              <el-icon><FolderAdd /></el-icon>
              新建
            </el-button>
            <div class="sort-options">
              <el-dropdown @command="handleSort">
                <span class="sort-button">
                  排序方式 <el-icon class="el-icon-arrow-down">
                    <ArrowDown />
                  </el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="latest">最新使用</el-dropdown-item>
                    <el-dropdown-item command="popular">最受欢迎</el-dropdown-item>
                    <el-dropdown-item command="important">最重要性</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
        <div class="tree-container">
          <el-tree
            :data="knowledgeBaseTree"
            node-key="id"
            :default-expanded-keys="defaultExpandedKeys"
            :show-checkbox="false"
            :indent="20"
            @node-click="handleNodeClick"
            @node-dblclick="handleNodeDblClick"
            :default-expand-all="false"
            :expand-on-click-node="false"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <span>{{ data.name }}</span>
                <span v-if="data.type === 'spec'" class="spec-tag">规范</span>
              </div>
            </template>
          </el-tree>
          <div v-if="knowledgeBases.length === 0" class="no-themes">
            暂无已创建的主题
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="right-content">
        <div class="page-header">
          <h2>规范智阅</h2>
        </div>

        <!-- 知识库选择 -->
        <div class="knowledge-base-select">
          <el-form :inline="true" :model="knowledgeBaseForm" class="knowledge-base-form">
            <el-form-item label="选择阅览主题">
              <el-select 
                v-model="knowledgeBaseForm.knowledgeBaseId" 
                placeholder="请选择阅览主题" 
                clearable
                style="min-width: 200px; width: auto;"
              >
                <el-option 
                  v-for="kb in knowledgeBases" 
                  :key="kb.id" 
                  :label="kb.name" 
                  :value="kb.id"
                  :style="{ width: 'auto' }"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="选择规范">
              <el-select 
                v-model="knowledgeBaseForm.specIds" 
                multiple 
                placeholder="请选择规范" 
                clearable
                style="min-width: 300px; width: auto;"
              >
                <el-option 
                  v-for="spec in specs" 
                  :key="spec.id" 
                  :label="`${spec.name} (${spec.code})`" 
                  :value="spec.id"
                  :style="{ width: 'auto' }"
                />
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
                <span class="toolbar-label">视图模式：</span>
                <el-button size="small" :type="viewMode === 'standard' ? 'primary' : 'default'" @click="toggleViewMode">
                  {{ viewMode === 'standard' ? '标准视图' : '简洁视图' }}
                </el-button>
              </div>
              <div class="toolbar-group">
                <span class="toolbar-label">批量操作：</span>
                <el-button size="small" type="info" @click="batchSearchSimilarClauses">
                  <el-icon><Search /></el-icon>
                  批量相似检索
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
            <div class="spec-content-wrapper">
              <div class="spec-content">
                <div 
                  v-for="clause in specContent" 
                  :key="clause.id"
                  :class="['clause-item', `level-${clause.level}`, { 'compact': viewMode === 'compact' }]"
                >
                  <!-- 简洁视图 -->
                  <div v-if="viewMode === 'compact'" class="compact-view">
                    <div class="compact-header" @click="toggleClauseExpand(clause.id)">
                      <el-checkbox 
                        :checked="selectedClauses.has(clause.id)" 
                        @change="toggleClauseSelection(clause.id)"
                        class="clause-checkbox"
                      />
                      <div class="clause-content">{{ clause.content }}</div>
                      <el-icon :class="{ 'expanded': isClauseExpanded(clause.id) }">
                        <ArrowUp v-if="isClauseExpanded(clause.id)" />
                        <ArrowDown v-else />
                      </el-icon>
                    </div>
                    <div v-if="isClauseExpanded(clause.id)" class="compact-expanded">
                      <div class="clause-meta">
                        <el-tag :type="clause.isFavorite ? 'danger' : 'info'" size="small" @click="toggleFavorite(clause)" class="favorite-tag">
                          <el-icon v-if="clause.isFavorite"><StarFilled /></el-icon>
                          <el-icon v-else><Star /></el-icon>
                          {{ clause.isFavorite ? '已收藏' : '收藏' }}
                        </el-tag>
                        <el-tag type="warning" size="small" class="popularity-tag">
                          <el-icon><DataAnalysis /></el-icon>
                          欢迎度: {{ clause.popularity }}%
                        </el-tag>
                        <el-button size="small" @click="increasePopularity(clause)" class="popularity-btn">
                          <el-icon><User /></el-icon>
                          点赞
                        </el-button>
                      </div>
                      <div class="clause-actions">
                        <el-button 
                          v-if="readerOptions.showTranslation"
                          size="small" 
                          type="primary" 
                          @click="translateClause(clause)"
                          class="translate-btn"
                        >
                          <el-icon><Connection /></el-icon>
                          {{ clause.isTranslated ? '重新翻译' : '翻译' }}
                        </el-button>
                        <el-button 
                          size="small" 
                          type="info" 
                          @click="searchSimilarClauses(clause)"
                          class="similar-btn"
                        >
                          <el-icon><Search /></el-icon>
                          相似条款
                        </el-button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 标准视图 -->
                  <div v-else class="standard-view">
                    <div class="clause-header">
                      <div class="clause-content-wrapper">
                        <el-checkbox 
                          :checked="selectedClauses.has(clause.id)" 
                          @change="toggleClauseSelection(clause.id)"
                          class="clause-checkbox"
                        />
                        <div class="clause-content" :class="{ 'translated': clause.isTranslated }">
                          {{ clause.content }}
                        </div>
                        <div class="clause-meta">
                          <el-tag :type="clause.isFavorite ? 'danger' : 'info'" size="small" @click="toggleFavorite(clause)" class="favorite-tag">
                            <el-icon v-if="clause.isFavorite"><StarFilled /></el-icon>
                            <el-icon v-else><Star /></el-icon>
                            {{ clause.isFavorite ? '已收藏' : '收藏' }}
                          </el-tag>
                          <el-tag type="warning" size="small" class="popularity-tag">
                            <el-icon><DataAnalysis /></el-icon>
                            欢迎度: {{ clause.popularity }}%
                          </el-tag>
                          <el-button size="small" @click="increasePopularity(clause)" class="popularity-btn">
                            <el-icon><User /></el-icon>
                            点赞
                          </el-button>
                        </div>
                      </div>
                      <div class="clause-actions">
                        <el-button 
                          v-if="readerOptions.showTranslation"
                          size="small" 
                          type="primary" 
                          @click="translateClause(clause)"
                          class="translate-btn"
                        >
                          <el-icon><Connection /></el-icon>
                          {{ clause.isTranslated ? '重新翻译' : '翻译' }}
                        </el-button>
                        <el-button 
                          size="small" 
                          type="info" 
                          @click="searchSimilarClauses(clause)"
                          class="similar-btn"
                        >
                          <el-icon><Search /></el-icon>
                          相似条款
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 全文翻译按钮 -->
            <div class="full-translation">
              <el-button 
                type="primary" 
                @click="translateAll"
              >
                <el-icon><Connection /></el-icon>
                全文翻译
              </el-button>
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
                <el-icon class="placeholder-icon"><DataAnalysis /></el-icon>
                <p>思维导图将在这里显示</p>
              </div>
            </div>
          </el-card>

          <!-- 知识图谱区域 -->
          <el-card v-if="showKnowledgeGraph" class="knowledge-graph-card">
            <h4>知识图谱</h4>
            <div class="knowledge-graph-content">
              <div class="knowledge-graph-placeholder">
                <el-icon class="placeholder-icon"><Connection /></el-icon>
                <p>知识图谱将在这里显示</p>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useReaderStore } from '../store/modules/reader'
import { ArrowUp, ArrowDown, FolderAdd, Search, DataAnalysis, Connection, Star, StarFilled, User } from '@element-plus/icons-vue'

// 响应式数据
const knowledgeBaseForm = reactive({
  knowledgeBaseId: '',
  specIds: [] as string[]
})

// 视图模式
const viewMode = ref<'standard' | 'compact'>('standard')

// 展开的条款ID
const expandedClauses = ref<Set<string>>(new Set())

// 已选择的条款
const selectedClauses = ref<Set<string>>(new Set())

// 使用reader store
const readerStore = useReaderStore()

// 计算属性获取主题列表
const knowledgeBases = computed(() => readerStore.themes)

// 计算属性获取规范列表
const specs = computed(() => readerStore.availableSpecs)

const currentSpecIndex = ref(0)
const currentSpec = computed(() => {
  return specs.value[currentSpecIndex.value]
})

// 默认展开的节点
const defaultExpandedKeys = ref<string[]>([])

// 排序方式
const sortBy = ref('latest')

// 生命周期钩子
onMounted(() => {
  // 初始化主题数据
  readerStore.initializeThemes()
  
  // 监听localStorage变化，确保跨窗口数据同步
  window.addEventListener('storage', (event) => {
    if (event.key === 'readerThemes') {
      readerStore.initializeThemes()
    }
  })
})

const readerOptions = reactive({
  showTranslation: false,
  translateLanguage: 'en',
  audioPlaying: false
})

const showSummary = ref(false)
const showMindMap = ref(false)
const showKnowledgeGraph = ref(false)

// 翻译模型类型
type TranslationModel = 'qwen' | 'doubao' | 'deepseek' | 'custom';

// 翻译结果接口
interface TranslationResult {
  model: TranslationModel;
  content: string;
  isAdopted: boolean;
}

// 规范引用接口
interface SpecReference {
  specName: string; // 规范名称
  specCode: string; // 规范编号
  clauseNumber: string; // 条款编号
  clauseContent?: string; // 条款具体内容
  explanation?: string; // 条文说明
  isLinked?: boolean; // 是否已链接到规标大数据
  linkedSpecId?: string; // 链接的规范ID
}

// 批注接口
interface Comment {
  id: string; // 批注ID
  content: string; // 批注内容
  author: string; // 批注作者
  timestamp: string; // 批注时间
  isEdited?: boolean; // 是否编辑过
  lastEdited?: string; // 最后编辑时间
}

// 条款数据结构
interface Clause {
  id: string
  content: string
  translations: Record<TranslationModel, TranslationResult>;
  isTranslated: boolean;
  level: number; // 1: 章, 2: 节, 3: 条
  isFavorite: boolean; // 是否收藏
  popularity: number; // 欢迎度 (0-100)
  hasFormula?: boolean; // 是否有公式
  formula?: string; // 公式内容
  hasFormulaImage?: boolean; // 是否有公式图片
  formulaImage?: string; // 公式图片URL
  hasTable?: boolean; // 是否有表格
  table?: string[][]; // 表格数据
  hasImage?: boolean; // 是否有图片
  image?: string; // 图片URL
  latexCode?: string; // LaTeX代码
  isLatexGenerated?: boolean; // 是否已生成LaTeX代码
  isTableCopied?: boolean; // 表格是否已复制
  isImageEnhanced?: boolean; // 图片是否已清晰化
  isFormulaImageRecognized?: boolean; // 公式图片是否已识别
  references?: SpecReference[]; // 引用的其他规范
  hasReferences?: boolean; // 是否有规范引用
  comments?: Comment[]; // 用户批注
  hasComments?: boolean; // 是否有批注
  showExplanation?: boolean; // 是否显示条文说明
  showComments?: boolean; // 是否显示批注
}

// 计算属性生成知识基础树结构
const knowledgeBaseTree = computed(() => {
  // 从store获取主题数据
  const themes = readerStore.themes
  
  // 根据排序方式对主题进行排序
  const sortedThemes = [...themes].sort((a, b) => {
    switch (sortBy.value) {
      case 'latest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case 'popular':
        return (b.popularity || 0) - (a.popularity || 0)
      case 'important':
        return (b.importance || 0) - (a.importance || 0)
      default:
        return 0
    }
  })
  
  // 构建树结构
  return sortedThemes.map(theme => {
    // 构建主题的规范子节点
    const specChildren = (theme.specs || []).map(spec => ({
      id: `spec-${spec.id}`,
      name: spec.name,
      code: spec.code,
      type: 'spec',
      specId: spec.id
    }))
    
    return {
      id: theme.id,
      name: theme.name,
      type: 'theme',
      children: specChildren
    }
  })
})

// 处理排序
const handleSort = (command: string) => {
  sortBy.value = command
}

// 处理节点双击
const handleNodeDblClick = (data: any) => {
  // 如果是主题节点，可以实现重命名功能
  if (data.type === 'theme') {
    // 这里可以实现主题重命名功能
    console.log('双击主题节点:', data.name)
  }
}

// 处理节点点击
const handleNodeClick = (data: any) => {
  if (data.type === 'theme') {
    // 点击主题，加载该主题的规范
    const theme = readerStore.getThemeById(data.id)
    if (theme) {
      selectTheme(theme)
    }
  } else if (data.type === 'spec' && data.specId) {
    // 点击规范，加载该规范
    knowledgeBaseForm.specIds = [data.specId]
    loadKnowledgeBase()
  }
}

// 生成规范条款数据
const generateSpecContent = (specId: string): Clause[] => {
  const baseTranslations = {
    qwen: { model: 'qwen' as TranslationModel, content: '', isAdopted: false },
    doubao: { model: 'doubao' as TranslationModel, content: '', isAdopted: false },
    deepseek: { model: 'deepseek' as TranslationModel, content: '', isAdopted: false },
    custom: { model: 'custom' as TranslationModel, content: '', isAdopted: false }
  };
  
  // 根据规范ID生成不同的条款数据
  switch (specId) {
    case '2': // 混凝土结构设计规范 (GB 50010-2010)
      return [
        { id: '1', content: '1 总则', isTranslated: false, level: 1, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '1.0.1', content: '1.0.1 为了在混凝土结构设计中贯彻执行国家的技术经济政策，做到安全适用、技术先进、经济合理、确保质量，制定本规范。', isTranslated: false, level: 3, isFavorite: true, popularity: 90, translations: { ...baseTranslations } },
        { id: '1.0.2', content: '1.0.2 本规范适用于房屋和一般构筑物的钢筋混凝土、预应力混凝土以及素混凝土结构的设计。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '1.0.3', content: '1.0.3 混凝土结构的设计，除应符合本规范外，尚应符合国家现行有关标准的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '2', content: '2 术语和符号', isTranslated: false, level: 1, isFavorite: false, popularity: 65, translations: { ...baseTranslations } },
        { id: '2.1', content: '2.1 术语', isTranslated: false, level: 2, isFavorite: false, popularity: 60, translations: { ...baseTranslations } },
        { id: '2.1.1', content: '2.1.1 混凝土结构 以混凝土为主要材料制成的结构，包括素混凝土结构、钢筋混凝土结构和预应力混凝土结构。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '2.1.2', content: '2.1.2 素混凝土结构 无筋或不配置受力钢筋的混凝土结构。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '2.1.3', content: '2.1.3 钢筋混凝土结构 配置受力的普通钢筋、钢筋网或钢筋骨架的混凝土结构。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '2.1.4', content: '2.1.4 预应力混凝土结构 配置预应力钢筋的混凝土结构。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3', content: '3 基本设计规定', isTranslated: false, level: 1, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1', content: '3.1 一般规定', isTranslated: false, level: 2, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.1', content: '3.1.1 混凝土结构应按承载能力极限状态和正常使用极限状态进行设计。', isTranslated: false, level: 3, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1.2', content: '3.1.2 承载能力极限状态对应于结构或构件达到最大承载能力或不适于继续承载的变形。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.3', content: '3.1.3 正常使用极限状态对应于结构或构件达到正常使用或耐久性能的某项规定限值。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '3.2', content: '3.2 结构设计的安全等级', isTranslated: false, level: 2, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '3.2.1', content: '3.2.1 混凝土结构设计时，应根据结构破坏可能产生的后果的严重性，采用不同的安全等级。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.2.2', content: '3.2.2 混凝土结构的安全等级应按表3.2.2的规定划分。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } }
      ];
    
    case '3': // 建筑抗震设计规范 (GB 50011-2010)
      return [
        { id: '1', content: '1 总则', isTranslated: false, level: 1, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '1.0.1', content: '1.0.1 为了贯彻执行国家的技术经济政策，做到安全、适用、经济，合理地进行抗震设计，制定本规范。', isTranslated: false, level: 3, isFavorite: true, popularity: 90, translations: { ...baseTranslations } },
        { id: '1.0.2', content: '1.0.2 本规范适用于抗震设防烈度为6度至9度地区的建筑抗震设计。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '1.0.3', content: '1.0.3 建筑抗震设计，除应符合本规范外，尚应符合国家现行有关标准的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '2', content: '2 术语和符号', isTranslated: false, level: 1, isFavorite: false, popularity: 65, translations: { ...baseTranslations } },
        { id: '2.1', content: '2.1 术语', isTranslated: false, level: 2, isFavorite: false, popularity: 60, translations: { ...baseTranslations } },
        { id: '2.1.1', content: '2.1.1 抗震设防烈度 按国家规定的权限批准作为一个地区抗震设防依据的地震烈度。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '2.1.2', content: '2.1.2 设计基本地震加速度 50年设计基准期内超越概率10%的地震加速度的设计取值。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '2.1.3', content: '2.1.3 设计地震分组 对不同地区的抗震设计地震动参数进行的分组。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '2.1.4', content: '2.1.4 抗震措施 根据抗震设防烈度和建筑类别确定的抗震设计措施。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3', content: '3 基本规定', isTranslated: false, level: 1, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1', content: '3.1 建筑抗震设防分类', isTranslated: false, level: 2, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.1', content: '3.1.1 建筑应根据其使用功能的重要性分为甲类、乙类、丙类、丁类四个抗震设防类别。', isTranslated: false, level: 3, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1.2', content: '3.1.2 甲类建筑应属于重大建筑工程和地震时可能发生严重次生灾害的建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.3', content: '3.1.3 乙类建筑应属于地震时使用功能不能中断或需尽快恢复的建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '3.1.4', content: '3.1.4 丙类建筑应属于除甲、乙、丁类以外的一般建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '3.1.5', content: '3.1.5 丁类建筑应属于抗震次要建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '3.2', content: '3.2 抗震设防标准', isTranslated: false, level: 2, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.2.1', content: '3.2.1 各类建筑结构的抗震设防标准，应符合下列要求：1 甲类建筑，应按高于本地区抗震设防烈度一度的要求加强其抗震措施；但抗震设防烈度为9度时应按比9度更高的要求采取抗震措施。', isTranslated: false, level: 3, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.2.2', content: '3.2.2 乙类建筑，应按高于本地区抗震设防烈度一度的要求加强其抗震措施；但抗震设防烈度为9度时应按比9度更高的要求采取抗震措施。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } }
      ];
    
    case '4': // 建筑地基基础设计规范 (GB 50007-2011)
      return [
        { id: '1', content: '1 总则', isTranslated: false, level: 1, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '1.0.1', content: '1.0.1 为了在地基基础设计中贯彻执行国家的技术经济政策，做到安全适用、技术先进、经济合理、确保质量，制定本规范。', isTranslated: false, level: 3, isFavorite: true, popularity: 90, translations: { ...baseTranslations } },
        { id: '1.0.2', content: '1.0.2 本规范适用于工业与民用建筑（包括构筑物）的地基基础设计。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '1.0.3', content: '1.0.3 地基基础设计，除应符合本规范外，尚应符合国家现行有关标准的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '2', content: '2 术语和符号', isTranslated: false, level: 1, isFavorite: false, popularity: 65, translations: { ...baseTranslations } },
        { id: '2.1', content: '2.1 术语', isTranslated: false, level: 2, isFavorite: false, popularity: 60, translations: { ...baseTranslations } },
        { id: '2.1.1', content: '2.1.1 地基 为支承基础的土体或岩体。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '2.1.2', content: '2.1.2 基础 将结构所承受的各种作用传递到地基上的结构组成部分。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '2.1.3', content: '2.1.3 地基承载力特征值 由载荷试验测定的地基土压力变形曲线线性变形段内规定的变形所对应的压力值，其最大值为比例界限值。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '2.1.4', content: '2.1.4 地基变形 地基在建筑物荷载作用下产生的沉降，包括瞬时沉降、固结沉降和蠕变沉降。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3', content: '3 基本规定', isTranslated: false, level: 1, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1', content: '3.1 一般规定', isTranslated: false, level: 2, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.1', content: '3.1.1 地基基础设计应根据地基复杂程度、建筑物规模和功能特征以及由于地基问题可能造成建筑物破坏或影响正常使用的程度，分为甲级、乙级、丙级三个设计等级。', isTranslated: false, level: 3, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1.2', content: '3.1.2 根据建筑物地基基础设计等级及长期荷载作用下地基变形对上部结构的影响程度，地基基础设计应符合下列规定：1 所有建筑物的地基计算均应满足承载力计算的有关规定；2 设计等级为甲级、乙级的建筑物，均应按地基变形设计。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.3', content: '3.1.3 地基基础设计前应进行岩土工程勘察，并应符合下列规定：1 岩土工程勘察报告应提供地基承载力特征值和变形参数；2 对需要进行变形验算的建筑物，应提供地基变形计算参数。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '3.2', content: '3.2 地基设计', isTranslated: false, level: 2, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '3.2.1', content: '3.2.1 地基基础设计时，所采用的荷载效应最不利组合与相应的抗力限值应按下列规定：1 按地基承载力确定基础底面积及埋深或按单桩承载力确定桩数时，传至基础或承台底面上的荷载效应应按正常使用极限状态下荷载效应的标准组合。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.2.2', content: '3.2.2 计算地基变形时，传至基础底面上的荷载效应应按正常使用极限状态下荷载效应的准永久组合，不应计入风荷载和地震作用。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '3.2.3', content: '3.2.3 计算挡土墙、地基或滑坡稳定以及基础抗浮稳定时，作用效应应按承载能力极限状态下荷载效应的基本组合，但其分项系数均为1.0。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '3.2.4', content: '3.2.4 在确定基础或桩台高度、支挡结构截面、计算基础或支挡结构内力、确定配筋和验算材料强度时，上部结构传来的荷载效应组合和相应的基底反力，应按承载能力极限状态下荷载效应的基本组合，采用相应的分项系数。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } }
      ];
    
    default: // 默认规范（建筑设计防火规范）
      return [
        { id: '1', content: '1 总则', isTranslated: false, level: 1, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '1.0.1', content: '1.0.1 为了保障建筑工程的消防安全，减少火灾危害，保护人身和财产安全，制定本规范。', isTranslated: false, level: 3, isFavorite: true, popularity: 90, translations: { ...baseTranslations } },
        { id: '1.0.2', content: '1.0.2 本规范适用于新建、扩建和改建的建筑设计防火。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '1.0.3', content: '1.0.3 建筑设计防火应遵循国家的有关方针政策，从全局出发，统筹兼顾，做到安全适用、技术先进、经济合理。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '1.0.4', content: '1.0.4 建筑设计防火除应符合本规范外，尚应符合国家现行有关标准的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '2', content: '2 术语', isTranslated: false, level: 1, isFavorite: false, popularity: 65, translations: { ...baseTranslations } },
        { id: '2.0.1', content: '2.0.1 建筑高度 建筑物室外设计地面到其檐口或屋面面层的高度。', isTranslated: false, level: 3, isFavorite: false, popularity: 60, translations: { ...baseTranslations } },
        { id: '2.0.2', content: '2.0.2 建筑层数 建筑物的自然层数，按室内地坪±0.00以上计算。', isTranslated: false, level: 3, isFavorite: false, popularity: 55, translations: { ...baseTranslations } },
        { id: '2.0.3', content: '2.0.3 防火墙 防止火灾蔓延至相邻建筑或相邻水平防火分区且耐火极限不低于3.00h的不燃性墙体。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '2.0.4', content: '2.0.4 防火隔墙 建筑内防止火灾蔓延至相邻区域且耐火极限不低于规定要求的不燃性墙体。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '3', content: '3 厂房和仓库', isTranslated: false, level: 1, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '3.1', content: '3.1 火灾危险性分类', isTranslated: false, level: 2, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.1.1', content: '3.1.1 厂房的火灾危险性应根据生产中使用或产生的物质性质及其数量等因素划分，可分为甲、乙、丙、丁、戊类，并应符合表3.1.1的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 90, translations: { ...baseTranslations } },
        { id: '3.1.2', content: '3.1.2 仓库的火灾危险性应根据储存物品的性质和储存物品中的可燃物数量等因素划分，可分为甲、乙、丙、丁、戊类，并应符合表3.1.3的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations } },
        { id: '3.2', content: '3.2 厂房和仓库的耐火等级', isTranslated: false, level: 2, isFavorite: false, popularity: 80, translations: { ...baseTranslations } },
        { id: '3.2.1', content: '3.2.1 厂房和仓库的耐火等级可分为一、二、三、四级，相应建筑构件的燃烧性能和耐火极限应符合表3.2.1的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 75, translations: { ...baseTranslations } },
        { id: '3.2.2', content: '3.2.2 高层厂房，甲、乙类厂房的耐火等级不应低于二级，建筑面积不大于300m²的独立甲、乙类单层厂房可采用三级耐火等级的建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 70, translations: { ...baseTranslations } },
        { id: '3.2.3', content: '3.2.3 单、多层丙类厂房和多层丁、戊类厂房的耐火等级不应低于三级。', isTranslated: false, level: 3, isFavorite: false, popularity: 65, translations: { ...baseTranslations } },
        { id: '3.2.4', content: '3.2.4 使用或产生丙类液体的厂房和有火花、赤热表面、明火的丁类厂房，其耐火等级均不应低于二级；当为建筑面积不大于500m²的单层丙类厂房或建筑面积不大于1000m²的单层丁类厂房时，可采用三级耐火等级的建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 60, translations: { ...baseTranslations } },
        { id: '3.2.5', content: '3.2.5 锅炉房的耐火等级不应低于二级，当为燃煤锅炉房且锅炉的总蒸发量不大于4t/h时，可采用三级耐火等级的建筑。', isTranslated: false, level: 3, isFavorite: false, popularity: 55, translations: { ...baseTranslations } }
      ];
  }
};

// 模拟数据
const specContent = ref<Clause[]>(generateSpecContent('1'));

// 更新规范内容
const updateSpecContent = (specId: string) => {
  specContent.value = generateSpecContent(specId);
};

// 切换条款展开/折叠
const toggleClauseExpand = (clauseId: string) => {
  if (expandedClauses.value.has(clauseId)) {
    expandedClauses.value.delete(clauseId);
  } else {
    expandedClauses.value.add(clauseId);
  }
};

// 检查条款是否展开
const isClauseExpanded = (clauseId: string) => {
  return expandedClauses.value.has(clauseId);
};

// 切换条款选择状态
const toggleClauseSelection = (clauseId: string) => {
  if (selectedClauses.value.has(clauseId)) {
    selectedClauses.value.delete(clauseId);
  } else {
    selectedClauses.value.add(clauseId);
  }
};

// 切换收藏状态
const toggleFavorite = (clause: Clause) => {
  clause.isFavorite = !clause.isFavorite;
};

// 增加欢迎度
const increasePopularity = (clause: Clause) => {
  if (clause.popularity < 100) {
    clause.popularity += 5;
  }
};

// 翻译条款
const translateClause = (clause: Clause) => {
  // 模拟翻译过程
  console.log('翻译条款:', clause.id, clause.content);
  clause.isTranslated = true;
};

// 搜索相似条款
const searchSimilarClauses = (clause: Clause) => {
  // 打开相似条款检索页面
  console.log('搜索相似条款:', clause.id, clause.content);
  try {
    const url = `/similar-clauses?clauseId=${clause.id}&clauseContent=${encodeURIComponent(clause.content)}`;
    window.open(url, '_blank', 'width=1200,height=800');
  } catch (error) {
    console.error('打开页面失败:', error);
    ElMessage.error('打开页面失败，请检查网络连接');
  }
};

// 批量搜索相似条款
const batchSearchSimilarClauses = () => {
  if (selectedClauses.value.size === 0) {
    ElMessage.warning('请先选择要搜索的条款');
    return;
  }
  
  // 打开批量相似条款检索页面
  console.log('批量搜索相似条款:', Array.from(selectedClauses.value));
  try {
    const clauseIds = Array.from(selectedClauses.value).join(',');
    const url = `/similar-clauses?clauseIds=${clauseIds}`;
    window.open(url, '_blank', 'width=1200,height=800');
  } catch (error) {
    console.error('打开页面失败:', error);
    ElMessage.error('打开页面失败，请检查网络连接');
  }
};

// 全文翻译
const translateAll = () => {
  // 模拟全文翻译过程
  console.log('全文翻译');
  specContent.value.forEach(clause => {
    clause.isTranslated = true;
  });
};



const summaryContent = ref(`本规范主要内容包括：
1. 总则：规定了规范的目的、适用范围和基本原则
2. 术语：定义了建筑高度、建筑层数、防火墙、防火隔墙等术语
3. 厂房和仓库：规定了火灾危险性分类标准

本规范适用于新建、扩建和改建的建筑设计防火，旨在保障建筑工程的消防安全，减少火灾危害，保护人身和财产安全。`)

// 方法
const createKnowledgeBase = () => {
  // 创建阅览主题，打开新窗口
  try {
    const url = '/spec-reader-theme'
    window.open(url, '_blank', 'width=1200,height=800')
    console.log('打开创建阅览主题页面:', url)
  } catch (error) {
    console.error('打开页面失败:', error)
    ElMessage.error('打开页面失败，请检查网络连接')
  }
}

const loadKnowledgeBase = () => {
  // 加载知识库
  console.log('加载知识库', knowledgeBaseForm)
  
  // 如果选择了规范，更新规范内容
  if (knowledgeBaseForm.specIds && knowledgeBaseForm.specIds.length > 0) {
    const firstSpecId = knowledgeBaseForm.specIds[0] as string;
    updateSpecContent(firstSpecId);
    // 更新当前规范索引
    const specIndex = specs.value.findIndex(spec => spec.id === firstSpecId);
    if (specIndex !== -1) {
      currentSpecIndex.value = specIndex;
    }
  }
}

// 选择主题
const selectTheme = (theme: any) => {
  // 填充主题ID到下拉框
  knowledgeBaseForm.knowledgeBaseId = theme.id
  // 填充该主题对应的规范到下拉框
  knowledgeBaseForm.specIds = theme.specs.map((spec: any) => spec.id) || []
  // 设置当前主题
  readerStore.setCurrentTheme(theme)
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
  
  // 收集所有链接的规范和条款，用于构建知识图谱
  const linkedReferences = specContent.value
    .filter(clause => clause.hasReferences && clause.references)
    .flatMap(clause => {
      return clause.references!.filter(ref => ref.isLinked).map(ref => ({
        clauseId: clause.id,
        clauseContent: clause.content,
        specName: ref.specName,
        specCode: ref.specCode,
        clauseNumber: ref.clauseNumber,
        linkedSpecId: ref.linkedSpecId
      }));
    });
  
  console.log('链接的规范和条款:', linkedReferences);
  
  // 在实际应用中，这里可以使用收集到的链接数据构建知识图谱
  // 例如使用d3.js或其他可视化库
};

const toggleAudio = () => {
  readerOptions.audioPlaying = !readerOptions.audioPlaying
  // 有声阅读
  console.log('有声阅读', readerOptions.audioPlaying)
}

const previousSpec = () => {
  if (currentSpecIndex.value > 0) {
    currentSpecIndex.value--
    // 更新规范内容
    if (currentSpec.value) {
      updateSpecContent(currentSpec.value.id);
    }
  }
}

const nextSpec = () => {
  if (currentSpecIndex.value < specs.value.length - 1) {
    currentSpecIndex.value++
    // 更新规范内容
    if (currentSpec.value) {
      updateSpecContent(currentSpec.value.id);
    }
  }
}





// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'standard' ? 'compact' : 'standard';
};
</script>

<style scoped>
.spec-reader-view {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.reader-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧导航栏 */
.left-sidebar {
  width: 300px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
}

.sort-options {
  margin-left: 12px;
}

.sort-button {
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.spec-tag {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.no-themes {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

/* 右侧内容区 */
.right-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.page-header h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
}

/* 知识库选择 */
.knowledge-base-select {
  margin-bottom: 20px;
}

.knowledge-base-form {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 智能阅读工具栏 */
.reader-toolbar {
  margin-bottom: 20px;
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
}

/* 阅读内容区域 */
.reader-content {
  margin-bottom: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.content-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.content-card {
  margin-bottom: 20px;
}

.spec-content-wrapper {
  max-height: 600px;
  overflow: auto;
}

.spec-content {
  padding: 16px;
}

/* 条款样式 */
.clause-item {
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.clause-item.level-1 {
  border-left: 4px solid #409eff;
}

.clause-item.level-2 {
  border-left: 4px solid #67c23a;
}

.clause-item.level-3 {
  border-left: 4px solid #e6a23c;
}

.clause-item.compact {
  border: none;
  border-radius: 0;
  border-bottom: 1px solid #e4e7ed;
}

/* 简洁视图 */
.compact-view .compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background-color: #f9f9f9;
}

.compact-header:hover {
  background-color: #f0f2f5;
}

.compact-view .clause-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.compact-expanded {
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #e4e7ed;
}

/* 标准视图 */
.standard-view .clause-header {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.clause-content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.clause-checkbox {
  margin-top: 2px;
}

.clause-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.clause-content.translated {
  position: relative;
  padding-bottom: 20px;
}

.clause-content.translated::after {
  content: '已翻译';
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 12px;
  color: #909399;
  background-color: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.clause-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.favorite-tag {
  cursor: pointer;
}

.popularity-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.popularity-btn {
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
}

.clause-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.translate-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.similar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 全文翻译按钮 */
.full-translation {
  margin-top: 16px;
  text-align: center;
}

/* 摘要区域 */
.summary-card {
  margin-bottom: 20px;
}

.summary-content {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
}

/* 思维导图区域 */
.mindmap-card {
  margin-bottom: 20px;
}

.mindmap-content {
  margin-top: 12px;
  height: 400px;
  background-color: #f9f9f9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mindmap-placeholder {
  text-align: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

/* 知识图谱区域 */
.knowledge-graph-card {
  margin-bottom: 20px;
}

.knowledge-graph-content {
  margin-top: 12px;
  height: 400px;
  background-color: #f9f9f9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.knowledge-graph-placeholder {
  text-align: center;
  color: #909399;
}

/* 批注样式 */
.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comments-list {
  margin-bottom: 16px;
}

.comment-item {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
}

.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.comment-actions .el-button {
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  font-size: 12px;
}

.comment-input {
  margin-top: 12px;
}

/* 条文说明样式 */
.explanation-section {
  margin-top: 12px;
  padding: 12px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border-left: 4px solid #67c23a;
}

.explanation-content {
  font-size: 14px;
  line-height: 1.5;
  color: #67c23a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-container {
    flex-direction: column;
  }
  
  .left-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .right-content {
    padding: 12px;
  }
  
  .toolbar-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .toolbar-group {
    width: 100%;
    justify-content: space-between;
  }
  
  .clause-content-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .clause-meta {
    flex-wrap: wrap;
  }
  
  .clause-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .content-actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载动画 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

/* 公式和图片样式 */
.formula-container {
  margin: 12px 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  text-align: center;
}

.image-container {
  margin: 12px 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  text-align: center;
}

.image-container img {
  max-width: 100%;
  border-radius: 4px;
}

/* 表格样式 */
.table-container {
  margin: 12px 0;
  overflow-x: auto;
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
}

.table-container th,
.table-container td {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  text-align: left;
}

.table-container th {
  background-color: #f9f9f9;
  font-weight: 600;
}

/* 规范引用样式 */
.references-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.reference-item {
  padding: 8px 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reference-info {
  flex: 1;
}

.reference-name {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.reference-clause {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.reference-actions {
  display: flex;
  gap: 8px;
}

/* 响应式调整 */
@media (min-width: 769px) and (max-width: 1024px) {
  .left-sidebar {
    width: 250px;
  }
  
  .toolbar-content {
    gap: 12px;
  }
  
  .toolbar-group {
    gap: 4px;
  }
  
  .toolbar-label {
    font-size: 12px;
  }
  
  .el-button {
    font-size: 12px;
  }
  
  .el-select {
    font-size: 12px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .spec-reader-view {
    background-color: #1f2329;
  }
  
  .left-sidebar {
    background-color: #2c3e50;
    border-right-color: #4b5563;
  }
  
  .sidebar-header {
    border-bottom-color: #4b5563;
  }
  
  .sidebar-header h3 {
    color: #e5e7eb;
  }
  
  .sort-button {
    color: #9ca3af;
  }
  
  .tree-node span {
    color: #e5e7eb;
  }
  
  .spec-tag {
    color: #9ca3af;
  }
  
  .no-themes {
    color: #9ca3af;
  }
  
  .knowledge-base-form {
    background-color: #2c3e50;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }
  
  .el-card {
    background-color: #2c3e50;
    border-color: #4b5563;
  }
  
  .el-card__header {
    background-color: #374151;
    border-bottom-color: #4b5563;
  }
  
  .el-card__header h4 {
    color: #e5e7eb;
  }
  
  .page-header h2 {
    color: #e5e7eb;
  }
  
  .content-header h3 {
    color: #e5e7eb;
  }
  
  .clause-content {
    color: #e5e7eb;
  }
  
  .clause-item {
    border-color: #4b5563;
  }
  
  .compact-view .compact-header {
    background-color: #374151;
  }
  
  .compact-header:hover {
    background-color: #4b5563;
  }
  
  .compact-expanded {
    background-color: #2c3e50;
    border-top-color: #4b5563;
  }
  
  .summary-content {
    color: #d1d5db;
  }
  
  .mindmap-content {
    background-color: #374151;
  }
  
  .mindmap-placeholder {
    color: #9ca3af;
  }
  
  .knowledge-graph-content {
    background-color: #374151;
  }
  
  .knowledge-graph-placeholder {
    color: #9ca3af;
  }
  
  .comment-item {
    background-color: #374151;
  }
  
  .comment-author {
    color: #d1d5db;
  }
  
  .comment-content {
    color: #e5e7eb;
  }
  
  .explanation-section {
    background-color: #1f2937;
    border-left-color: #10b981;
  }
  
  .explanation-content {
    color: #10b981;
  }
  
  .formula-container {
    background-color: #374151;
  }
  
  .image-container {
    background-color: #374151;
  }
  
  .table-container th {
    background-color: #374151;
    color: #e5e7eb;
  }
  
  .table-container td {
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .references-section {
    border-top-color: #4b5563;
  }
  
  .reference-item {
    background-color: #1e3a8a;
  }
  
  .reference-name {
    color: #60a5fa;
  }
  
  .reference-clause {
    color: #93c5fd;
  }
  
  .empty-state {
    color: #9ca3af;
  }
}
</style>