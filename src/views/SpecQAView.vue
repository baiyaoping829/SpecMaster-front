<template>
  <div class="spec-qa-view">
    <div class="page-header">
      <h2>规范智答</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createQAKnowledgeBase">
          <el-icon><folder-add /></el-icon>
          创建问答主题
        </el-button>
      </div>
    </div>

    <!-- 知识库选择 -->
    <div class="knowledge-base-select">
      <el-form :inline="true" :model="knowledgeBaseForm" class="knowledge-base-form">
        <el-form-item label="选择问答主题">
          <el-select v-model="knowledgeBaseForm.knowledgeBaseId" placeholder="请选择问答主题" clearable>
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

    <!-- 问答区域 -->
    <div class="qa-container">
      <div class="chat-history">
        <div v-for="(message, index) in chatMessages" :key="index" class="message-item" :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
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
        <el-tag v-for="(question, index) in recommendedQuestions" :key="index" @click="useRecommendedQuestion(question)">
          {{ question }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

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

// 响应式数据
const knowledgeBaseForm = reactive({
  knowledgeBaseId: '',
  specIds: [] as string[]
})

const knowledgeBases = ref([
  { id: '1', name: '建筑设计规范问答' },
  { id: '2', name: '结构设计规范问答' },
  { id: '3', name: '施工安全规范问答' }
])

const specs = ref([
  { id: '1', name: '建筑设计防火规范', code: 'GB 50016-2014' },
  { id: '2', name: '混凝土结构设计规范', code: 'GB 50010-2010' },
  { id: '3', name: '建筑抗震设计规范', code: 'GB 50011-2010' }
])

const userInput = ref('')
const chatMessages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '您好！我是规范智答助手，请问有什么可以帮助您的问题？',
    timestamp: '2026-02-26 10:00:00',
    references: []
  }
])

const recommendedQuestions = ref([
  '建筑设计防火规范中对防火墙的要求是什么？',
  '混凝土结构设计规范中对钢筋的要求是什么？',
  '建筑抗震设计规范中对建筑高度的限制是什么？'
])

// 方法
const createQAKnowledgeBase = () => {
  // 创建问答主题
  console.log('创建问答主题')
}

const loadKnowledgeBase = () => {
  // 加载知识库
  console.log('加载知识库', knowledgeBaseForm)
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

  // 模拟AI回复
  setTimeout(() => {
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: `根据规范标准，${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...`,
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
</script>

<style lang="scss" scoped>
.spec-qa-view {
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

.qa-container {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-bottom: 24px;
  overflow: hidden;
}

.chat-history {
  height: 500px;
  overflow-y: auto;
  padding: 24px;
}

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

.chat-input {
  border-top: 1px solid #e4e7ed;
  padding: 16px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.recommended-questions {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  padding: 16px;
}

.recommended-questions h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-list .el-tag {
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: #ecf5ff;
    border-color: #409EFF;
    color: #409EFF;
  }
}

@media (max-width: 768px) {
  .message-item {
    max-width: 90%;
  }
  
  .chat-history {
    height: 400px;
    padding: 16px;
  }
}
</style>