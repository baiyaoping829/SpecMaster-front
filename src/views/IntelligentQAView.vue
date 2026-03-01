<template>
  <div class="intelligent-qa-view">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>知识主题管理</h3>
        <el-button type="primary" size="small" @click="createKnowledgeBase">
          <el-icon><folder-add /></el-icon>
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
          <template #default="{ node, data }">
            <span class="tree-node">
              <span>{{ data.label }}</span>
              <span class="node-actions">
                <el-button size="small" @click.stop="editKnowledgeBase(data)">
                  <el-icon><edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteKnowledgeBase(data.id)">
                  <el-icon><delete /></el-icon>
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
                  <el-icon>{{ expandedKnowledgeBases.includes(kb.id) ? 'arrow-up' : 'arrow-down' }}</el-icon>
                </el-button>
                <el-button size="small" @click.stop="editKnowledgeBase(kb)">
                  <el-icon><edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="removeKnowledgeBase(kb.id)">
                  <el-icon><delete /></el-icon>
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
            <el-icon class="add-icon"><plus /></el-icon>
            <span>添加知识主题</span>
          </div>
        </div>
      </div>

      <!-- 知识主题选择卡片（保留现有功能） -->
      <div class="knowledge-base-select">
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
          </div>
        </div>

        <!-- 对话历史 -->
        <div class="chat-history">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index" 
            class="message-item" 
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }"
          >
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</span>
              <span class="message-time">{{ message.timestamp }}</span>
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
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            @keyup.enter.exact="handleSend"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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

interface Spec {
  id: string
  name: string
  code: string
}

// 响应式数据
const knowledgeBaseForm = reactive({
  knowledgeBaseIds: [] as string[],
  specIds: [] as string[]
})

const modelConfig = reactive({
  model: 'qwen',
  mode: 'qa'
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
    selectedKnowledgeBaseId.value = loadedKnowledgeBases.value.length > 0 ? loadedKnowledgeBases.value[0].id : ''
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
}

const removeKnowledgeBase = (id: string) => {
  loadedKnowledgeBases.value = loadedKnowledgeBases.value.filter(kb => kb.id !== id)
  if (selectedKnowledgeBaseId.value === id) {
    selectedKnowledgeBaseId.value = loadedKnowledgeBases.value.length > 0 ? loadedKnowledgeBases.value[0].id : ''
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
  
  selectedKnowledgeBaseId.value = loadedKnowledgeBases.value.length > 0 ? loadedKnowledgeBases.value[0].id : ''
  ElMessage.success('知识主题加载成功')
}

const handleSend = () => {
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

  // 模拟AI回复（基于RAG技术）
  setTimeout(() => {
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: `根据${selectedKnowledgeBase.value?.name || '知识主题'}的内容，${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...`,
      timestamp: new Date().toLocaleString(),
      references: [
        { name: '建筑设计防火规范', code: 'GB 50016-2014', section: '3.1.1' },
        { name: '混凝土结构设计规范', code: 'GB 50010-2010', section: '4.2.1' },
        { name: '建筑抗震设计规范', code: 'GB 50011-2010', section: '5.1.1' }
      ]
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
  overflow: hidden;
  padding: 20px;
  background-color: #f0f2f5;

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
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 12px;

      .knowledge-book {
        width: 300px;
        min-height: 120px;
        background-color: white;
        border-radius: 8px;
        border: 2px solid #e4e7ed;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 16px;

        &:hover {
          border-color: #409EFF;
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        }

        &.active {
          border-color: #409EFF;
          background-color: #ecf5ff;
        }

        .book-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          cursor: pointer;

          .book-cover {
            flex: 1;
            text-align: left;

            .book-title {
              font-weight: 500;
              margin-bottom: 4px;
              color: #303133;
            }

            .book-info {
              font-size: 12px;
              color: #909399;
            }
          }

          .book-actions {
            display: flex;
            gap: 4px;

            .el-button {
              padding: 4px 8px;
            }
          }
        }

        .book-specs {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e4e7ed;

          .specs-title {
            font-size: 12px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }

          .specs-list {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
              line-height: 1.4;
            }
          }
        }
      }

      .add-book {
        width: 300px;
        height: 120px;
        border: 2px dashed #dcdfe6;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #409EFF;
          color: #409EFF;
        }

        .add-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        span {
          font-size: 14px;
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
        margin-bottom: 8px;
        font-size: 12px;
        color: #909399;
        
        .message-role {
          font-weight: 500;
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
}
</style>