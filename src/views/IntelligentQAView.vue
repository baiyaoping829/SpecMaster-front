<template>
  <div class="intelligent-qa-view">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>知识主题管理</h3>
        <el-button type="primary" size="small" @click="createKnowledgeBase">
          <el-icon><FolderAdd /></el-icon>
          新建知识主题
        </el-button>
      </div>
      
      <div class="knowledge-base-tree">
        <el-tree
          ref="knowledgeBaseTreeRef"
          :data="knowledgeBaseTree"
          node-key="id"
          :props="knowledgeBaseProps"
          @node-click="handleKnowledgeBaseClick"
          default-expand-all
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.label }}</span>
              <span class="node-actions">
                <el-button size="small" @click.stop="editKnowledgeBase(data)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteKnowledgeBase(data.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>

    <!-- 右侧主界面 -->
    <div class="main-content">
      <!-- 上部区域：知识主题书架 -->
      <div class="knowledge-shelf">
        <h3>知识主题库</h3>
        <div class="shelf-container">
          <div 
            v-for="kb in loadedKnowledgeBases" 
            :key="kb.id" 
            class="knowledge-book" 
            :class="{ active: selectedKnowledgeBaseId === kb.id }"
          >
            <div class="book-header" @click="selectKnowledgeBase(kb.id)">
              <div class="book-cover">
                <div class="book-title">{{ kb.name }}</div>
                <div class="book-info">{{ kb.specs.length }} 个规范</div>
              </div>
              <div class="book-actions">
                <el-button size="small" @click.stop="toggleKnowledgeBaseExpand(kb.id)">
                  <el-icon v-if="expandedKnowledgeBases.includes(kb.id)"><ArrowUp /></el-icon>
                  <el-icon v-else><ArrowDown /></el-icon>
                </el-button>
                <el-button size="small" @click.stop="editKnowledgeBase(kb)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="removeKnowledgeBase(kb.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-if="expandedKnowledgeBases.includes(kb.id)" class="book-specs">
              <div class="specs-title">包含规范：</div>
              <ul class="specs-list">
                <li v-for="specId in kb.specs" :key="specId">
                  {{ getSpecName(specId) }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="add-book" @click="openAddKnowledgeBaseDialog">
            <el-icon class="add-icon"><Plus /></el-icon>
            <span>添加知识主题</span>
          </div>
        </div>
      </div>

      <!-- 知识主题选择卡片（保留现有功能） -->
      <div class="knowledge-base-select">
        <div class="operation-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>操作提示：单击知识主题或规范标准进行选择，再单击取消选择</span>
        </div>
        <el-form :inline="true" :model="knowledgeBaseForm" class="knowledge-base-form">
          <el-form-item label="选择问答主题">
            <el-select v-model="knowledgeBaseForm.knowledgeBaseIds" multiple placeholder="请选择问答主题" clearable style="width: 200px;">
              <el-option label="全部主题" value="all" />
              <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择规范">
            <el-select v-model="knowledgeBaseForm.specIds" multiple placeholder="请选择规范" clearable style="width: 300px;">
              <el-option v-for="spec in filteredSpecs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadKnowledgeBase">加载知识主题</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 下部区域：智能问答界面 -->
      <div class="qa-container">
        <!-- 模型和模式选择 -->
        <div class="qa-header">
          <div class="model-selector">
            <el-form-item label="模型选择">
              <el-select v-model="modelConfig.model" placeholder="选择模型" style="width: 120px;">
                <el-option label="Qwen" value="qwen" />
                <el-option label="Deepseek" value="deepseek" />
                <el-option label="GPT-4" value="gpt4" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务模式">
              <el-select v-model="modelConfig.mode" placeholder="选择模式" style="width: 120px;">
                <el-option label="问答模式" value="qa" />
                <el-option label="摘要模式" value="summary" />
                <el-option label="翻译模式" value="translate" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="openPromptLibraryDialog">
                <el-icon><Collection /></el-icon>
                提示词库
              </el-button>
            </el-form-item>
            <el-form-item label="网络检索">
              <el-switch v-model="modelConfig.useWebSearch" />
            </el-form-item>
          </div>
        </div>

        <!-- 对话历史 -->
        <div class="chat-history">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index" 
            class="message-item" 
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }"
            @mouseenter="hoveredMessageIndex = index"
            @mouseleave="hoveredMessageIndex = -1"
          >
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</span>
              <div class="message-header-right">
                <span class="message-time">{{ message.timestamp }}</span>
                <el-button 
                v-show="hoveredMessageIndex === index"
                size="small" 
                @click="copyMessageContent(message.content)" 
                style="margin-left: 8px;"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
              </div>
            </div>
            <div class="message-content">{{ message.content }}</div>
            <div v-if="message.references && message.references.length > 0" class="message-references">
              <div class="references-title">参考来源：</div>
              <ul class="references-list">
                <li v-for="(ref, refIndex) in message.references" :key="refIndex">
                  {{ ref.name }} ({{ ref.code }}) - {{ ref.section }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="prompt-selector" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: flex-start;">
            <span>提示词选择：</span>
            <el-select v-model="modelConfig.promptId" placeholder="选择提示词" style="width: 150px;">
                <el-option label="无提示词" value="" />
                <el-option label="默认提示词" value="default" />
                <el-option v-for="prompt in promptTemplates" :key="prompt.id" :label="prompt.name" :value="prompt.id" />
              </el-select>
          </div>
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            @keyup.enter.exact="handleSend"
            style="min-height: 80px;"
          />
          <div class="input-actions">
            <el-button @click="clearChat">清空对话</el-button>
            <el-button type="primary" @click="handleSend">发送</el-button>
          </div>
        </div>
      </div>

      <!-- 推荐问题 -->
      <div class="recommended-questions">
        <h3>推荐问题</h3>
        <div class="question-list">
          <el-tag 
            v-for="(question, index) in recommendedQuestions" 
            :key="index" 
            @click="useRecommendedQuestion(question)"
          >
            {{ question }}
          </el-tag>
        </div>
      </div>

      <!-- 新建知识主题对话框 -->
      <el-dialog
        v-model="createKBDialogVisible"
        title="新建知识主题"
        width="500px"
      >
        <el-form :model="newKBForm" label-width="80px">
          <el-form-item label="知识主题名称" required>
            <el-input v-model="newKBForm.name" placeholder="请输入知识主题名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="newKBForm.description" placeholder="请输入知识主题描述" rows="3" />
          </el-form-item>
          <el-form-item label="选择规范" required>
            <el-select v-model="newKBForm.specIds" multiple filterable reserve-keyword placeholder="请输入规范名称或代码搜索">
              <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="createKBDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitNewKB">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 编辑知识主题对话框 -->
      <el-dialog
        v-model="editKBDialogVisible"
        title="编辑知识主题"
        width="500px"
      >
        <el-form :model="editKBForm" label-width="80px">
          <el-form-item label="知识主题名称" required>
            <el-input v-model="editKBForm.name" placeholder="请输入知识主题名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="editKBForm.description" placeholder="请输入知识主题描述" rows="3" />
          </el-form-item>
          <el-form-item label="选择规范" required>
            <el-select v-model="editKBForm.specIds" multiple filterable reserve-keyword placeholder="请输入规范名称或代码搜索">
              <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editKBDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitEditKB">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 提示词库对话框 -->
      <el-dialog
        v-model="promptLibraryDialogVisible"
        title="提示词库"
        width="800px"
      >
        <!-- 提示词列表 -->
        <div class="prompt-list">
          <h4>预定义提示词模板</h4>
          <el-table :data="promptTemplates" style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  @click="editPrompt(row)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deletePrompt(row.id)"
                  :disabled="row.id === 'default'"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 添加新提示词 -->
        <div class="add-prompt">
          <h4>{{ isEditing ? '编辑提示词' : '添加新提示词' }}</h4>
          <el-form :model="newPromptForm" label-width="100px">
            <el-form-item label="提示词名称" required>
              <el-input v-model="newPromptForm.name" placeholder="请输入提示词名称" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="newPromptForm.description" placeholder="请输入提示词描述" />
            </el-form-item>
            <el-form-item label="提示词内容" required>
              <el-input 
                type="textarea" 
                v-model="newPromptForm.content" 
                placeholder="请输入提示词内容" 
                rows="4" 
              />
              <div class="form-actions" style="margin-top: 10px; text-align: right;">
                <el-button @click="addNewPrompt">增加提示词</el-button>
                <el-button v-if="isEditing" type="primary" @click="submitNewPrompt">保存修改</el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="promptLibraryDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveAndExit">保存退出</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown, Edit, Delete, Plus, FolderAdd, InfoFilled, Collection, DocumentCopy } from '@element-plus/icons-vue'
import { useSpecStore } from '../store/modules/spec'

// 类型定义
interface Reference {
  name: string
  code: string
  section: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  references: Reference[]
}

interface KnowledgeBase {
  id: string
  name: string
  description: string
  specs: string[]
  parentId?: string
}



interface PromptTemplate {
  id: string
  name: string
  content: string
  description: string
}

// 响应式数据
const knowledgeBaseForm = reactive({
  knowledgeBaseIds: [] as string[],
  specIds: [] as string[]
})

const modelConfig = reactive({
  model: 'qwen',
  mode: 'qa',
  promptId: 'default',
  useWebSearch: false
})

// 提示词模板
const promptTemplates = ref<PromptTemplate[]>([
  {
    id: 'default',
    name: '默认提示词',
    content: '你是一个专业的规范智答助手，请根据提供的规范标准内容，回答用户的问题。回答要准确、清晰、专业，引用相关规范的具体条款。',
    description: '通用的规范问答提示词'
  },
  {
    id: 'detailed',
    name: '详细解释',
    content: '你是一个专业的规范智答助手，请根据提供的规范标准内容，详细回答用户的问题。不仅要给出答案，还要解释相关规范的背景、原理和应用场景，帮助用户深入理解。',
    description: '提供详细解释的提示词'
  },
  {
    id: 'summary',
    name: '总结概括',
    content: '你是一个专业的规范智答助手，请根据提供的规范标准内容，对用户的问题进行总结概括。回答要简洁明了，重点突出，抓住核心要点。',
    description: '用于总结概括的提示词'
  },
  {
    id: 'comparison',
    name: '对比分析',
    content: '你是一个专业的规范智答助手，请根据提供的规范标准内容，对用户提到的不同规范或条款进行对比分析。指出它们的异同点，帮助用户理解它们之间的关系。',
    description: '用于对比分析的提示词'
  }
])

// 提示词库对话框
const promptLibraryDialogVisible = ref(false)
const isEditing = ref(false)
const editingPromptId = ref('')
const newPromptForm = reactive({
  name: '',
  content: '',
  description: ''
})

const specStore = useSpecStore()

const knowledgeBases = ref<KnowledgeBase[]>([
  { id: '1', name: '建筑设计规范问答', description: '建筑设计相关规范的智能问答', specs: ['1', '2'] },
  { id: '2', name: '结构设计规范问答', description: '结构设计相关规范的智能问答', specs: ['2', '3'] },
  { id: '3', name: '施工安全规范问答', description: '施工安全相关规范的智能问答', specs: ['1', '3'] }
])

// 使用specStore中的specs数据
const specs = computed(() => specStore.specs)

// 模拟数据，实际项目中应该从API获取
onMounted(() => {
  // 为了测试，添加更多模拟数据，确保能看到20个规范
  if (specStore.specs.length < 20) {
    const mockSpecs = [
      { id: '1', name: '建筑设计防火规范', code: 'GB 50016-2014' },
      { id: '2', name: '混凝土结构设计规范', code: 'GB 50010-2010' },
      { id: '3', name: '建筑抗震设计规范', code: 'GB 50011-2010' },
      { id: '4', name: '建筑地基基础设计规范', code: 'GB 50007-2011' },
      { id: '5', name: '钢结构设计规范', code: 'GB 50017-2017' },
      { id: '6', name: '建筑给水排水设计规范', code: 'GB 50015-2019' },
      { id: '7', name: '通风与空调工程施工质量验收规范', code: 'GB 50243-2016' },
      { id: '8', name: '建筑装饰装修工程质量验收标准', code: 'GB 50210-2018' },
      { id: '9', name: '建筑工程施工质量验收统一标准', code: 'GB 50300-2013' },
      { id: '10', name: '建设工程工程量清单计价规范', code: 'GB 50500-2013' },
      { id: '11', name: '建筑节能工程施工质量验收规范', code: 'GB 50411-2019' },
      { id: '12', name: '智能建筑工程质量验收规范', code: 'GB 50339-2013' },
      { id: '13', name: '无障碍设计规范', code: 'GB 50763-2012' },
      { id: '14', name: '民用建筑设计统一标准', code: 'GB 50352-2019' },
      { id: '15', name: '住宅设计规范', code: 'GB 50096-2011' },
      { id: '16', name: '公共建筑节能设计标准', code: 'GB 50189-2015' },
      { id: '17', name: '建筑采光设计标准', code: 'GB 50033-2013' },
      { id: '18', name: '建筑隔声设计规范', code: 'GB 50118-2010' },
      { id: '19', name: '建筑灭火器配置设计规范', code: 'GB 50140-2005' },
      { id: '20', name: '自动喷水灭火系统设计规范', code: 'GB 50084-2017' }
    ]
    specStore.setSpecs(mockSpecs)
  }
})

// 从knowledgeBases动态生成左侧目录树，包含规范标准列表
const knowledgeBaseTree = computed(() => {
  return knowledgeBases.value.map(kb => {
    // 为每个知识主题生成规范标准子节点
    const specChildren = kb.specs.map(specId => {
      const spec = specStore.specs.find((s: any) => s.id === specId)
      return {
        id: `spec-${specId}`,
        label: spec ? `${spec.name} (${spec.code})` : specId
      }
    })
    
    return {
      id: kb.id,
      label: kb.name,
      children: specChildren.length > 0 ? specChildren : undefined
    }
  })
})

const knowledgeBaseProps = {
  children: 'children',
  label: 'label'
}

const loadedKnowledgeBases = ref<KnowledgeBase[]>([
  { id: '1', name: '建筑设计规范问答', description: '建筑设计相关规范的智能问答', specs: ['1', '2'] },
  { id: '2', name: '结构设计规范问答', description: '结构设计相关规范的智能问答', specs: ['2', '3'] },
  { id: '3', name: '施工安全规范问答', description: '施工安全相关规范的智能问答', specs: ['1', '3'] }
])

const selectedKnowledgeBaseId = ref('1')
const userInput = ref('')
const chatMessages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '您好！我是规范智答助手，请问有什么可以帮助您的问题？',
    timestamp: new Date().toLocaleString(),
    references: []
  }
])

const recommendedQuestions = ref([
  '建筑设计防火规范中对防火墙的要求是什么？',
  '混凝土结构设计规范中对钢筋的要求是什么？',
  '建筑抗震设计规范中对建筑高度的限制是什么？'
])

// 展开状态管理
const expandedKnowledgeBases = ref<string[]>([])

// 鼠标悬浮消息索引
const hoveredMessageIndex = ref(-1)

// 引用
const knowledgeBaseTreeRef = ref()

// 对话框状态
const createKBDialogVisible = ref(false)
const editKBDialogVisible = ref(false)
const newKBForm = reactive({
  name: '',
  description: '',
  specIds: [] as string[]
})
const editKBForm = reactive({
  id: '',
  name: '',
  description: '',
  specIds: [] as string[]
})

// 计算属性
const selectedKnowledgeBase = computed(() => {
  return knowledgeBases.value.find(kb => kb.id === knowledgeBaseForm.knowledgeBaseIds[0])
})

// 根据选择的主题过滤规范
const filteredSpecs = computed(() => {
  if (knowledgeBaseForm.knowledgeBaseIds.length === 0) {
    return []
  }
  
  if (knowledgeBaseForm.knowledgeBaseIds.includes('all')) {
    return specs.value
  }
  
  // 收集所有选中主题的规范ID
  const specIds = new Set<string>()
  knowledgeBaseForm.knowledgeBaseIds.forEach(kbId => {
    const kb = knowledgeBases.value.find(kb => kb.id === kbId)
    if (kb) {
      kb.specs.forEach(specId => specIds.add(specId))
    }
  })
  
  // 过滤出相关的规范
  return specs.value.filter(spec => specIds.has(spec.id))
})

// 方法
const createKnowledgeBase = () => {
  createKBDialogVisible.value = true
}

const submitNewKB = () => {
  if (!newKBForm.name || newKBForm.specIds.length === 0) {
    ElMessage.error('请填写知识主题名称并选择规范')
    return
  }
  
  const newKB: KnowledgeBase = {
    id: String(knowledgeBases.value.length + 1),
    name: newKBForm.name,
    description: newKBForm.description,
    specs: newKBForm.specIds
  }
  
  // 添加到知识主题列表
  knowledgeBases.value.push(newKB)
  
  // 自动加载到知识主题库中
  loadedKnowledgeBases.value.push(newKB)
  
  ElMessage.success('知识主题创建成功')
  createKBDialogVisible.value = false
  
  // 重置表单
  newKBForm.name = ''
  newKBForm.description = ''
  newKBForm.specIds = []
}

const editKnowledgeBase = (data: any) => {
  // 从knowledgeBases中找到对应的知识主题
  const kb = knowledgeBases.value.find(kb => kb.id === data.id)
  if (kb) {
    // 填充编辑表单
    editKBForm.id = kb.id
    editKBForm.name = kb.name
    editKBForm.description = kb.description
    editKBForm.specIds = [...kb.specs]
    // 打开编辑对话框
    editKBDialogVisible.value = true
  }
}

const deleteKnowledgeBase = (id: string) => {
  // 从知识主题列表中删除
  knowledgeBases.value = knowledgeBases.value.filter(kb => kb.id !== id)
  
  // 从知识主题库中删除
  loadedKnowledgeBases.value = loadedKnowledgeBases.value.filter(kb => kb.id !== id)
  
  // 如果删除的是当前选中的知识主题，重新选择第一个知识主题
  if (selectedKnowledgeBaseId.value === id) {
    selectedKnowledgeBaseId.value = loadedKnowledgeBases.value.length > 0 ? loadedKnowledgeBases.value[0]?.id || '' : ''
  }
  
  ElMessage.success('知识主题删除成功')
}

const handleKnowledgeBaseClick = (data: any) => {
  console.log('点击知识主题:', data)
  // 实现知识主题点击功能
  // 当点击左侧导航栏中的知识主题时，自动加载到右侧知识主题库中
  const kb = knowledgeBases.value.find(kb => kb.id === data.id)
  if (kb) {
    // 检查知识主题是否已加载到知识主题库中
    if (!loadedKnowledgeBases.value.some(loadedKb => loadedKb.id === kb.id)) {
      loadedKnowledgeBases.value.push(kb)
      selectedKnowledgeBaseId.value = kb.id
      ElMessage.success('知识主题已加载到知识主题库')
    } else {
      // 如果已加载，直接选中
      selectedKnowledgeBaseId.value = kb.id
    }
    
    // 在右侧栏选择问答主题中切换对应的主题（支持多选和取消选择）
    const index = knowledgeBaseForm.knowledgeBaseIds.indexOf(kb.id)
    if (index > -1) {
      // 如果已选择，则取消选择
      knowledgeBaseForm.knowledgeBaseIds.splice(index, 1)
    } else {
      // 如果未选择，则添加选择
      knowledgeBaseForm.knowledgeBaseIds.push(kb.id)
    }
  } else if (data.id.startsWith('spec-')) {
    // 点击的是规范标准记录
    const specId = data.id.replace('spec-', '')
    // 找到包含该规范的知识主题
    const containingKbs = knowledgeBases.value.filter(kb => kb.specs.includes(specId))
    if (containingKbs.length > 0) {
      // 切换对应的知识主题（支持多选和取消选择）
      containingKbs.forEach(kb => {
        const index = knowledgeBaseForm.knowledgeBaseIds.indexOf(kb.id)
        if (index > -1) {
          // 如果已选择，则取消选择
          knowledgeBaseForm.knowledgeBaseIds.splice(index, 1)
        } else {
          // 如果未选择，则添加选择
          knowledgeBaseForm.knowledgeBaseIds.push(kb.id)
        }
      })
      // 切换对应的规范（支持多选和取消选择）
      const specIndex = knowledgeBaseForm.specIds.indexOf(specId)
      if (specIndex > -1) {
        // 如果已选择，则取消选择
        knowledgeBaseForm.specIds.splice(specIndex, 1)
      } else {
        // 如果未选择，则添加选择
        knowledgeBaseForm.specIds.push(specId)
      }
    }
  }
}

const selectKnowledgeBase = (id: string) => {
  selectedKnowledgeBaseId.value = id
  console.log('选择知识主题:', id)
  // 实现选择知识主题功能
  // 同时在左侧目录中选中对应的节点
  if (knowledgeBaseTreeRef.value) {
    knowledgeBaseTreeRef.value.setCurrentKey(id)
  }
  
  // 在右侧栏选择问答主题中切换对应的主题（支持多选和取消选择）
  const index = knowledgeBaseForm.knowledgeBaseIds.indexOf(id)
  if (index > -1) {
    // 如果已选择，则取消选择
    knowledgeBaseForm.knowledgeBaseIds.splice(index, 1)
  } else {
    // 如果未选择，则添加选择
    knowledgeBaseForm.knowledgeBaseIds.push(id)
  }
}

const removeKnowledgeBase = (id: string) => {
  loadedKnowledgeBases.value = loadedKnowledgeBases.value.filter(kb => kb.id !== id)
  if (selectedKnowledgeBaseId.value === id) {
    selectedKnowledgeBaseId.value = loadedKnowledgeBases.value.length > 0 ? loadedKnowledgeBases.value[0]?.id || '' : ''
  }
  ElMessage.success('知识主题已移除')
}

const openAddKnowledgeBaseDialog = () => {
  createKBDialogVisible.value = true
}

const loadKnowledgeBase = () => {
  if (knowledgeBaseForm.knowledgeBaseIds.length === 0) {
    ElMessage.error('请选择问答主题')
    return
  }
  
  knowledgeBaseForm.knowledgeBaseIds.forEach(kbId => {
    if (kbId !== 'all') {
      const kb = knowledgeBases.value.find(kb => kb.id === kbId)
      if (kb) {
        // 检查知识主题是否已加载
        if (!loadedKnowledgeBases.value.some(loadedKb => loadedKb.id === kb.id)) {
          loadedKnowledgeBases.value.push(kb)
        }
      }
    } else {
      // 加载所有知识主题
      knowledgeBases.value.forEach(kb => {
        if (!loadedKnowledgeBases.value.some(loadedKb => loadedKb.id === kb.id)) {
          loadedKnowledgeBases.value.push(kb)
        }
      })
    }
  })
  
  selectedKnowledgeBaseId.value = loadedKnowledgeBases.value.length > 0 ? loadedKnowledgeBases.value[0]?.id || '' : ''
  ElMessage.success('知识主题加载成功')
}

// 加载知识主题文档到RAG库
const loadKnowledgeBaseToRAG = () => {
  // 模拟加载知识主题文档到RAG库的过程
  console.log('正在加载知识主题文档到RAG库...')
  // 实际项目中，这里应该调用后端API来加载文档到RAG库
  // 例如：return api.loadKnowledgeBaseToRAG(loadedKnowledgeBases.value)
  return Promise.resolve('知识主题文档加载到RAG库成功')
}

// 执行网络检索
const performWebSearch = (_query: string, _knowledgeBaseIds: string[]) => {
  // 模拟网络检索过程
  console.log('正在执行网络检索...')
  // 实际项目中，这里应该调用后端API来执行网络检索
  // 例如：return api.performWebSearch(query, knowledgeBaseIds)
  return Promise.resolve('网络检索完成')
}

const handleSend = async () => {
  if (!userInput.value.trim()) return

  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    content: userInput.value,
    timestamp: new Date().toLocaleString(),
    references: []
  }
  chatMessages.value.push(userMessage)

  // 清空输入框
  const tempInput = userInput.value
  userInput.value = ''

  // 加载知识主题文档到RAG库
  await loadKnowledgeBaseToRAG()

  // 模拟AI回复（基于RAG技术）
  setTimeout(async () => {
    let references: Reference[] = []
    let content = ''

    // 检查是否选择了无提示词
    const hasPrompt = modelConfig.promptId !== ''

    if (modelConfig.useWebSearch) {
      // 执行网络检索
      await performWebSearch(tempInput, knowledgeBaseForm.knowledgeBaseIds)
      if (hasPrompt) {
        content = `根据${selectedKnowledgeBase.value?.name || '知识主题'}的内容和网络检索结果，${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...\n\n网络检索补充：...`
      } else {
        content = `${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...\n\n网络检索补充：...`
      }
      references = [
        { name: '建筑设计防火规范', code: 'GB 50016-2014', section: '3.1.1' },
        { name: '混凝土结构设计规范', code: 'GB 50010-2010', section: '4.2.1' },
        { name: '建筑抗震设计规范', code: 'GB 50011-2010', section: '5.1.1' },
        { name: '网络检索结果', code: 'WEB', section: '相关信息' }
      ]
    } else {
      if (hasPrompt) {
        content = `根据${selectedKnowledgeBase.value?.name || '知识主题'}的内容，${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...`
      } else {
        content = `${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...`
      }
      references = [
        { name: '建筑设计防火规范', code: 'GB 50016-2014', section: '3.1.1' },
        { name: '混凝土结构设计规范', code: 'GB 50010-2010', section: '4.2.1' },
        { name: '建筑抗震设计规范', code: 'GB 50011-2010', section: '5.1.1' }
      ]
    }

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: content,
      timestamp: new Date().toLocaleString(),
      references: references
    }
    chatMessages.value.push(aiMessage)
  }, 1000)
}

const clearChat = () => {
  chatMessages.value = [
    {
      role: 'assistant',
      content: '您好！我是规范智答助手，请问有什么可以帮助您的问题？',
      timestamp: new Date().toLocaleString(),
      references: []
    }
  ]
}

const useRecommendedQuestion = (question: string) => {
  userInput.value = question
  handleSend()
}

// 复制消息内容到剪贴板并填充到输入框
const copyMessageContent = (content: string) => {
  // 复制到剪贴板
  navigator.clipboard.writeText(content).then(() => {
    // 填充到输入框
    userInput.value = content
    ElMessage.success('消息内容已复制并填充到输入框')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 打开提示词库对话框
const openPromptLibraryDialog = () => {
  // 重置编辑状态
  isEditing.value = false
  editingPromptId.value = ''
  // 重置表单
  newPromptForm.name = ''
  newPromptForm.content = ''
  newPromptForm.description = ''
  promptLibraryDialogVisible.value = true
}

// 编辑提示词
const editPrompt = (prompt: PromptTemplate) => {
  isEditing.value = true
  editingPromptId.value = prompt.id
  newPromptForm.name = prompt.name
  newPromptForm.content = prompt.content
  newPromptForm.description = prompt.description
}

// 增加提示词
const addNewPrompt = () => {
  if (!newPromptForm.name || !newPromptForm.content) {
    ElMessage.error('请填写提示词名称和内容')
    return
  }
  
  // 添加新提示词
  const newPrompt: PromptTemplate = {
    id: `prompt-${Date.now()}`,
    name: newPromptForm.name,
    content: newPromptForm.content,
    description: newPromptForm.description
  }
  
  promptTemplates.value.push(newPrompt)
  ElMessage.success('提示词添加成功')
  
  // 重置表单，但保持编辑状态不变
  newPromptForm.name = ''
  newPromptForm.content = ''
  newPromptForm.description = ''
}

// 提交新提示词或编辑提示词
const submitNewPrompt = () => {
  if (!newPromptForm.name || !newPromptForm.content) {
    ElMessage.error('请填写提示词名称和内容')
    return
  }
  
  if (isEditing.value) {
    // 编辑现有提示词
    const index = promptTemplates.value.findIndex(p => p.id === editingPromptId.value)
    if (index > -1) {
      promptTemplates.value[index] = {
        id: editingPromptId.value,
        name: newPromptForm.name,
        content: newPromptForm.content,
        description: newPromptForm.description
      }
      ElMessage.success('提示词编辑成功')
    }
  } else {
    // 添加新提示词
    const newPrompt: PromptTemplate = {
      id: `prompt-${Date.now()}`,
      name: newPromptForm.name,
      content: newPromptForm.content,
      description: newPromptForm.description
    }
    
    promptTemplates.value.push(newPrompt)
    ElMessage.success('提示词添加成功')
  }
  
  // 重置表单和编辑状态
  isEditing.value = false
  editingPromptId.value = ''
  newPromptForm.name = ''
  newPromptForm.content = ''
  newPromptForm.description = ''
}

// 保存退出
const saveAndExit = () => {
  promptLibraryDialogVisible.value = false
  // 重置编辑状态
  isEditing.value = false
  editingPromptId.value = ''
  // 重置表单
  newPromptForm.name = ''
  newPromptForm.content = ''
  newPromptForm.description = ''
}

// 删除提示词
const deletePrompt = (id: string) => {
  if (id === 'default') {
    ElMessage.error('默认提示词不能删除')
    return
  }
  
  promptTemplates.value = promptTemplates.value.filter(prompt => prompt.id !== id)
  
  // 如果当前选择的提示词被删除，切换到默认提示词
  if (modelConfig.promptId === id) {
    modelConfig.promptId = 'default'
  }
  
  ElMessage.success('提示词删除成功')
}

// 处理编辑知识主题提交
const submitEditKB = () => {
  if (!editKBForm.name || editKBForm.specIds.length === 0) {
    ElMessage.error('请填写知识主题名称并选择规范')
    return
  }
  
  // 更新知识主题列表
  const index = knowledgeBases.value.findIndex(kb => kb.id === editKBForm.id)
  if (index > -1) {
    knowledgeBases.value[index] = {
      id: editKBForm.id,
      name: editKBForm.name,
      description: editKBForm.description,
      specs: editKBForm.specIds
    }
  }
  
  // 更新已加载的知识主题库
  const loadedIndex = loadedKnowledgeBases.value.findIndex(kb => kb.id === editKBForm.id)
  if (loadedIndex > -1) {
    loadedKnowledgeBases.value[loadedIndex] = {
      id: editKBForm.id,
      name: editKBForm.name,
      description: editKBForm.description,
      specs: editKBForm.specIds
    }
  }
  
  ElMessage.success('知识主题编辑成功')
  editKBDialogVisible.value = false
}

// 切换知识主题展开/收起状态
const toggleKnowledgeBaseExpand = (id: string) => {
  const index = expandedKnowledgeBases.value.indexOf(id)
  if (index > -1) {
    expandedKnowledgeBases.value.splice(index, 1)
  } else {
    expandedKnowledgeBases.value.push(id)
  }
}

// 根据规范ID获取规范名称
const getSpecName = (specId: string) => {
  const spec = specStore.specs.find((s: any) => s.id === specId)
  return spec ? `${spec.name} (${spec.code})` : specId
}
</script>

<style lang="scss" scoped>
.intelligent-qa-view {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 左侧导航栏 */
.sidebar {
  width: 300px;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .knowledge-base-tree {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: linear-gradient(to bottom, #e6f7ff, #f0f9ff);

    .tree-node {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      .node-actions {
        display: none;
      }

      &:hover .node-actions {
        display: flex;
        gap: 4px;
      }
    }
  }
}

/* 右侧主界面 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  height: auto;

  /* 知识主题书架 */
  .knowledge-shelf {
    margin-bottom: 20px;

    h3 {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .shelf-container {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 8px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      /* 书架底部效果 */
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: linear-gradient(to bottom, #d1d9e6, #b0b8c1);
        border-radius: 0 0 8px 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .knowledge-book {
        width: 180px;
        height: 240px;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        display: flex;
        flex-direction: column;
        /* 书本效果 */
        background: linear-gradient(to right, #ffffff, #f8f9fa);
        border-radius: 4px 8px 8px 4px;
        box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
        /* 书脊效果 */
        border-left: 20px solid #409EFF;
        padding: 16px;
        transform-style: preserve-3d;
        transform: perspective(1000px) rotateY(-5deg);

        &:hover {
          transform: perspective(1000px) rotateY(-2deg) translateY(-5px);
          box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.25);
        }

        &.active {
          border-left-color: #67C23A;
          background: linear-gradient(to right, #f0f9eb, #e6f7ff);
          transform: perspective(1000px) rotateY(0deg) translateY(-5px);
        }

        /* 彩色方案 - 不同知识主题使用不同颜色 */
        &:nth-child(3n+1) {
          border-left-color: #409EFF;
        }
        &:nth-child(3n+2) {
          border-left-color: #67C23A;
        }
        &:nth-child(3n+3) {
          border-left-color: #E6A23C;
        }

        .book-header {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          cursor: pointer;
          justify-content: space-between;

          .book-cover {
            width: 100%;

            .book-title {
              font-weight: 600;
              margin-bottom: 12px;
              color: #303133;
              font-size: 14px;
              line-height: 1.4;
              height: 60px;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
            }

            .book-info {
              font-size: 12px;
              color: #606266;
              margin-bottom: 12px;
            }
          }
        }

        .book-actions {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.3s;

          .el-button {
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 11px;
            background-color: rgba(255, 255, 255, 0.9);
          }
        }

        &:hover .book-actions {
          opacity: 1;
        }

        .book-specs {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #e4e7ed;
          font-size: 11px;

          .specs-title {
            font-size: 11px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 6px;
          }

          .specs-list {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              font-size: 10px;
              color: #909399;
              margin-bottom: 3px;
              line-height: 1.3;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }

      .add-book {
        width: 180px;
        height: 240px;
        border: 2px dashed #dcdfe6;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;
        background-color: rgba(255, 255, 255, 0.7);

        &:hover {
          border-color: #409EFF;
          color: #409EFF;
          background-color: rgba(255, 255, 255, 0.9);
          transform: translateY(-3px);
        }

        .add-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }

        span {
          font-size: 13px;
          text-align: center;
          padding: 0 10px;
        }
      }
    }
  }

  /* 知识主题选择卡片 */
  .knowledge-base-select {
    margin-bottom: 20px;
    background-color: white;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .operation-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: #ecf5ff;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #409EFF;

      el-icon {
        font-size: 16px;
      }
    }
  }

  .knowledge-base-form {
    width: 100%;
  }

  /* 智能问答界面 */
  .qa-container {
    flex: 1;
    background-color: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 500px;
    height: auto;

    /* 模型和模式选择 */
    .qa-header {
      padding: 16px;
      border-bottom: 1px solid #e4e7ed;

      .model-selector {
        display: flex;
        gap: 16px;

        .el-form-item {
          margin-bottom: 0;
        }
      }
    }

    /* 对话历史 */
    .chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 24px;

      .message-item {
        margin-bottom: 20px;
        max-width: 80%;
        
        &.user-message {
          margin-left: auto;
          text-align: right;
        }
        
        &.ai-message {
          margin-right: auto;
          text-align: left;
        }
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: #909399;
        
        .message-role {
          font-weight: 500;
        }
        
        .message-header-right {
          display: flex;
          align-items: center;
        }
      }

      .message-content {
        padding: 12px;
        border-radius: 8px;
        line-height: 1.6;
        
        .user-message & {
          background-color: #ecf5ff;
          color: #409EFF;
        }
        
        .ai-message & {
          background-color: #f5f7fa;
          color: #606266;
        }
      }

      .message-references {
        margin-top: 8px;
        font-size: 12px;
        color: #909399;
        
        .references-title {
          margin-bottom: 4px;
        }
        
        .references-list {
          list-style: none;
          padding-left: 16px;
          
          li {
            margin-bottom: 2px;
          }
        }
      }
    }

    /* 输入区域 */
    .chat-input {
      border-top: 1px solid #e4e7ed;
      padding: 16px;
      min-height: 150px;
      box-sizing: border-box;

      .input-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
    }
  }

  /* 推荐问题 */
  .recommended-questions {
    background-color: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    padding: 16px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }

    .question-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .el-tag {
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          background-color: #ecf5ff;
          border-color: #409EFF;
          color: #409EFF;
        }
      }
    }
  }
}

/* 提示词库样式 */
.add-prompt {
  padding-left: 30px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar {
    width: 250px;
  }

  .main-content {
    padding: 16px;
  }

  .knowledge-shelf .shelf-container .knowledge-book,
  .knowledge-shelf .shelf-container .add-book {
    width: 180px;
    height: 100px;
  }
}

@media (max-width: 768px) {
  .intelligent-qa-view {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }

  .main-content {
    flex: 1;
  }

  .qa-container .chat-history {
    height: 400px;
  }

  .message-item {
    max-width: 90%;
  }

  .add-prompt {
    padding-left: 20px;
  }
}
</style>