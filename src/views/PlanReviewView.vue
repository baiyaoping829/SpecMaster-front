<template>
  <div class="plan-review-view">
    <!-- 左侧约束主题管理 -->
    <div class="constraint-theme-sidebar">
      <div class="sidebar-header">
        <h2>方案智审</h2>
        <div class="header-actions">
          <el-button type="primary" @click="createConstraintTheme">
            <el-icon><FolderAdd /></el-icon>
            创建约束主题
          </el-button>
        </div>
      </div>
      
      <div class="constraint-theme-header">
        <h3>约束主题管理</h3>
      </div>
      
      <div class="constraint-theme-tree">
        <el-tree
          ref="constraintThemeTreeRef"
          :data="constraintThemeTree"
          node-key="id"
          :props="constraintThemeProps"
          @node-click="handleConstraintThemeClick"
          default-expand-all
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.label }}</span>
              <span class="node-actions">
                <el-button size="small" @click.stop="editConstraintTheme(data)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteConstraintTheme(data.id)">
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
      <!-- 约束主题库 -->
      <div class="constraint-theme-shelf">
        <h3>约束主题库</h3>
        <div class="shelf-container">
          <div 
            v-for="theme in loadedConstraintThemes" 
            :key="theme.id" 
            class="theme-book"
            :class="{ active: selectedConstraintThemeId === theme.id }"
          >
            <div class="book-header" @click="selectConstraintTheme(theme.id)">
              <div class="book-cover">
                <div class="book-title">{{ theme.name }}</div>
                <div class="book-info">{{ theme.items.length }} 个项目</div>
              </div>
              <div class="book-actions">
                <el-button size="small" @click.stop="toggleThemeExpand(theme.id)">
                  <el-icon v-if="expandedThemes.includes(theme.id)"><ArrowUp /></el-icon>
                  <el-icon v-else><ArrowDown /></el-icon>
                </el-button>
                <el-button size="small" @click.stop="editConstraintTheme(theme)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="removeConstraintTheme(theme.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-if="expandedThemes.includes(theme.id)" class="book-items">
              <div class="items-title">包含项目：</div>
              <ul class="items-list">
                <li v-for="itemId in theme.items" :key="itemId">
                  {{ getItemName(itemId) }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="add-book" @click="openAddConstraintThemeDialog">
            <el-icon class="add-icon"><Plus /></el-icon>
            <span>添加约束主题</span>
          </div>
        </div>
      </div>

      <!-- 约束主题选择 -->
      <div class="constraint-theme-select">
        <div class="operation-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>操作提示：单击约束主题或项目进行选择，再单击取消选择</span>
        </div>
        <el-form :inline="true" :model="constraintThemeForm" class="constraint-theme-form">
          <el-form-item label="选择约束主题">
            <el-select v-model="constraintThemeForm.themeIds" multiple placeholder="请选择约束主题" clearable style="width: 200px;">
              <el-option label="全部主题" value="all" />
              <el-option v-for="theme in constraintThemes" :key="theme.id" :label="theme.name" :value="theme.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择项目">
            <el-select v-model="constraintThemeForm.itemIds" multiple placeholder="请选择项目" clearable style="width: 300px;">
              <el-option v-for="item in filteredItems" :key="item.id" :label="`${item.name} (${item.code || item.type})`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadConstraintTheme">加载约束主题</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 方案上传 -->
      <div class="plan-upload">
        <el-card shadow="hover">
          <h3>被审方案上传</h3>
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="uploadedFiles"
            :limit="5"
            accept=".pdf,.docx,.xlsx"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传 PDF、DOCX、XLSX 格式文件，单个文件不超过 50MB，最多上传 5 个文件
              </div>
            </template>
            <template #file-list="{ files }">
              <div class="file-list">
                <div v-for="(file, index) in files" :key="file.uid" class="file-item">
                  <div class="file-info">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    <el-tag v-if="file.status === 'success'" size="small" type="success">成功</el-tag>
                  </div>
                  <div v-if="file.status === 'uploading'" class="file-progress">
                    <el-progress :percentage="file.progress" :stroke-width="10" :show-text="false" />
                  </div>
                  <div class="file-actions">
                    <el-button
                      size="small"
                      type="danger"
                      @click="handleFileRemove(file, index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </el-upload>
          <div v-if="fileUploadError" class="upload-error">
            {{ fileUploadError }}
          </div>

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
              <el-input v-model="newKeyword" placeholder="输入关键词后按回车" @keyup.enter="addKeyword" style="margin-top: 8px; width: 100%;" />
            </el-form-item>
          </el-form>

          <div class="upload-actions">
            <el-button @click="intelligentFillForm" type="primary" style="margin-left: auto;">智能填表</el-button>
          </div>

        </el-card>
      </div>

      <!-- 智能问答模块 -->
      <div class="intelligent-qa-module">
        <el-card shadow="hover">
          <h3>智能审查</h3>
          <div class="qa-container">
            <!-- 模型和模式选择 -->
            <div class="qa-header">
              <div class="model-selector">
                <span>模型选择：</span>
                <el-select v-model="modelConfig.models" multiple placeholder="选择模型（最多3个）" style="width: 200px; margin-right: 16px;" :multiple-limit="3">
                  <el-option label="Qwen" value="qwen" />
                  <el-option label="Deepseek" value="deepseek" />
                  <el-option label="GPT-4" value="gpt4" />
                  <el-option label="Claude" value="claude" />
                  <el-option label="Llama 3" value="llama3" />
                </el-select>
                <span>任务模式：</span>
                <el-select v-model="modelConfig.mode" placeholder="选择模式" style="width: 120px; margin-right: 16px;">
                  <el-option label="问答模式" value="qa" />
                  <el-option label="摘要模式" value="summary" />
                  <el-option label="翻译模式" value="translate" />
                  <el-option label="审查模式" value="review" />
                </el-select>
                <el-button @click="openPromptLibraryDialog" style="margin-right: 16px;">
                  <el-icon><Collection /></el-icon>
                  提示词库
                </el-button>
                <span>网络检索：</span>
                <el-switch v-model="modelConfig.useWebSearch" />
              </div>
            </div>

            <!-- 对话历史 -->
            <div class="chat-history">
              <div class="conversation-history-container">
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
            </div>

            <!-- 输入区域 -->
            <div class="chat-input">
              <div class="prompt-selector" style="margin-bottom: 12px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">提示词选择：</span>
                <el-select v-model="modelConfig.promptId" placeholder="选择提示词" style="width: 150px; flex-shrink: 0;">
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
                style="min-height: 80px; width: 100%;"
              />
              <div class="input-actions">
                <el-button @click="startReview" type="primary" style="margin-left: auto;">开始审查</el-button>
                <el-button @click="clearChat" style="margin-left: 8px;">清空对话</el-button>
                <el-button type="primary" @click="handleSend" style="margin-left: 8px;">发送</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 审查进度 -->
      <div v-if="isReviewing" class="review-progress">
        <el-card shadow="hover">
          <h3>审查进度</h3>
          <el-progress :percentage="reviewProgress" :format="() => `${reviewProgress}%`" />
          <div class="model-status-list">
            <div v-for="result in modelReviewResults" :key="result.model" class="model-status-item">
              <span class="model-name">{{ result.model }}</span>
              <el-tag :type="result.status === 'completed' ? 'success' : result.status === 'error' ? 'danger' : 'warning'">
                {{ result.status === 'completed' ? '已完成' : result.status === 'error' ? '失败' : '进行中' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 审查结果 -->
      <div v-if="showReviewResult" class="review-result">
        <el-card shadow="hover">
          <h3>审查结果</h3>
          
          <!-- 多模型审查结果 -->
          <div class="multi-model-results">
            <h4>多模型审查意见</h4>
            <el-tabs type="border-card">
              <el-tab-pane v-for="result in modelReviewResults" :key="result.model" :label="result.model">
                <div class="model-review-content">
                    <div class="model-opinion">
                      <strong>审查意见：</strong>
                      <p>{{ result.opinion }}</p>
                    </div>
                    <div class="model-suggestions">
                      <strong>修改建议：</strong>
                      <el-collapse>
                        <el-collapse-item v-for="(suggestion, index) in result.suggestions" :key="index" :title="`问题 ${index + 1}: ${suggestion.issue}`">
                          <div class="suggestion-content">
                            <div class="suggestion-header">
                              <p><strong>问题描述：</strong>{{ suggestion.issue }}</p>
                              <div 
                                class="suggestion-status" 
                                @click="toggleModelSuggestionStatus(result.model, index)"
                                :class="suggestion.status || 'pending'"
                                style="padding: 4px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; background-color: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff;"
                              >
                                <span>{{ 
                                  (suggestion.status || 'pending') === 'pending' ? '待处理' : 
                                  (suggestion.status || 'pending') === 'accepted' ? '采纳' : 
                                  (suggestion.status || 'pending') === 'rejected' ? '不采纳' : '修改采纳' 
                                }}</span>
                              </div>
                            </div>
                            <p><strong>修改建议：</strong>{{ suggestion.suggestion }}</p>
                            <p><strong>依据标准：</strong>{{ suggestion.standard }}</p>
                            <p><strong>风险等级：</strong>
                              <el-tag :type="getRiskLevelType(suggestion.riskLevel)">
                                {{ suggestion.riskLevel }}
                              </el-tag>
                            </p>
                            <div v-if="(suggestion.status || 'pending') === 'modified'" class="modification-input">
                              <p><strong>修改采纳方式：</strong></p>
                              <el-input
                                :id="`model-modification-input-${result.model}-${index}`"
                                v-model="suggestion.modification"
                                type="textarea"
                                :rows="2"
                                placeholder="请输入修改采纳的具体方式..."
                                @input="handleModelModificationInput(result.model, index, suggestion.modification || '')"
                              />
                            </div>
                          </div>
                        </el-collapse-item>
                      </el-collapse>
                    </div>
                    <div class="model-timestamp">
                      审查时间：{{ result.timestamp }}
                    </div>
                  </div>
              </el-tab-pane>
            </el-tabs>
          </div>
          
          <!-- 智能汇审功能 -->
          <div class="intelligent-assembly">
            <h4>智能汇审</h4>
            <div class="assembly-content">
              <div v-if="!finalReviewResult" class="assembly-actions">
                <el-button type="primary" @click="startAssemblyReview">开始智能汇审</el-button>
                <el-tooltip content="智能汇审将综合分析各模型的审查意见，生成结构化、专业、全面的最终审查意见" placement="top">
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <div v-else class="final-review-result">
                <div class="final-opinion">
                  <strong>最终审查意见：</strong>
                  <p>{{ finalReviewResult.opinion }}</p>
                </div>
                <div class="final-suggestions">
                  <strong>综合修改建议：</strong>
                  <el-collapse>
                    <el-collapse-item v-for="(suggestion, index) in finalReviewResult.suggestions" :key="index" :title="`问题 ${index + 1}: ${suggestion.issue}`">
                      <div class="suggestion-content">
                        <div class="suggestion-header">
                          <p><strong>问题描述：</strong>{{ suggestion.issue }}</p>
                          <div 
                            class="suggestion-status" 
                            @click="toggleSuggestionStatus(index)"
                            :class="suggestion.status"
                            style="padding: 4px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; background-color: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff;"
                          >
                            <span>{{ 
                              suggestion.status === 'pending' ? '待处理' : 
                              suggestion.status === 'accepted' ? '采纳' : 
                              suggestion.status === 'rejected' ? '不采纳' : '修改采纳' 
                            }}</span>
                          </div>
                        </div>
                        <p><strong>修改建议：</strong>{{ suggestion.suggestion }}</p>
                        <p><strong>依据标准：</strong>{{ suggestion.standard }}</p>
                        <p><strong>风险等级：</strong>
                          <el-tag :type="getRiskLevelType(suggestion.riskLevel)">
                            {{ suggestion.riskLevel }}
                          </el-tag>
                        </p>
                        <p v-if="suggestion.models && suggestion.models.length > 0" class="suggestion-models">
                          <strong>来源模型：</strong>
                          <el-tag v-for="model in suggestion.models" :key="model" size="small" type="info" style="margin-right: 4px;">
                            {{ model }}
                          </el-tag>
                        </p>
                        <div v-if="suggestion.status === 'modified'" class="modification-input">
                          <p><strong>修改采纳方式：</strong></p>
                          <el-input
                            :id="`modification-input-${index}`"
                            v-model="suggestion.modification"
                            type="textarea"
                            :rows="2"
                            placeholder="请输入修改采纳的具体方式..."
                            @input="handleModificationInput(index, suggestion.modification || '')"
                          />
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                <div class="final-highlights">
                  <strong>审查要点：</strong>
                  <div class="highlights-tags">
                    <el-tag v-for="highlight in finalReviewResult.highlights" :key="highlight" type="warning" size="small" style="margin-right: 4px; margin-bottom: 4px;">
                      {{ highlight }}
                    </el-tag>
                  </div>
                </div>
                <div class="final-actions">
                  <el-button @click="exportReviewReport">导出审查报告</el-button>
                  <el-button @click="openExpertSignatureDialog">专家签名</el-button>
                  <el-button type="primary" @click="confirmReview">确认审查</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 数据同步 -->
      <div class="data-sync">
        <el-card shadow="hover">
          <h3>数据同步</h3>
          <div class="sync-content">
            <div class="sync-status">
              <div class="status-item">
                <span class="status-label">同步状态：</span>
                <el-tag :type="syncStatus === 'success' ? 'success' : syncStatus === 'error' ? 'danger' : syncStatus === 'syncing' ? 'warning' : 'info'">
                  {{ syncStatus === 'idle' ? '空闲' : syncStatus === 'syncing' ? '同步中' : syncStatus === 'success' ? '同步成功' : '同步失败' }}
                </el-tag>
              </div>
              <div class="status-item">
                <span class="status-label">当前版本：</span>
                <span class="version">{{ currentVersion }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">上次同步：</span>
                <span class="last-sync">{{ lastSyncTime || '从未同步' }}</span>
              </div>
            </div>

            <div v-if="syncStatus === 'syncing'" class="sync-progress">
              <el-progress :percentage="syncProgress" :format="() => `${syncProgress}%`" />
            </div>

            <div class="sync-actions">
              <el-button type="primary" @click="syncDataToKnowledgeBase" :loading="syncStatus === 'syncing'">
                <el-icon><Refresh /></el-icon>
                手动同步
              </el-button>
              <el-switch v-model="autoSyncEnabled" @change="handleAutoSync" active-text="自动同步" inactive-text="手动同步" />
            </div>

            <div class="version-history">
              <h4>版本历史</h4>
              <el-table :data="versionHistory" style="width: 100%;">
                <el-table-column prop="version" label="版本号" width="100" />
                <el-table-column prop="timestamp" label="时间" width="180" />
                <el-table-column prop="changes" label="变更内容" />
                <el-table-column prop="author" label="操作人" width="100" />
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button size="small" @click="rollbackToVersion(row.version)" :disabled="row.version === currentVersion">
                      回滚
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 新建约束主题对话框 -->
    <el-dialog
      v-model="createThemeDialogVisible"
      title="新建约束主题"
      width="700px"
    >
      <el-form :model="newThemeForm" label-width="80px">
        <el-form-item label="约束主题名称" required>
          <el-input v-model="newThemeForm.name" placeholder="请输入约束主题名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="newThemeForm.description" placeholder="请输入约束主题描述" rows="3" />
        </el-form-item>
        
        <!-- 约束清单 -->
        <el-form-item label="约束清单">
          <div class="constraint-list">
            <div v-if="constraintList.length === 0" class="empty-list">
              <el-icon><Document /></el-icon>
              <span>暂无约束文档，请从约束来源中添加</span>
            </div>
            <div v-else class="list-table">
              <el-table :data="constraintList" style="width: 100%">
                <el-table-column prop="name" label="约束名称" min-width="200">
                  <template #default="scope">
                    <span>{{ scope.row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="约束类型" width="120">
                  <template #default="scope">
                    <el-tag :type="getTypeTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="来源" width="100">
                  <template #default="scope">
                    <el-tag size="small" type="info">
                      {{ scope.row.id.startsWith('local-') ? '本地上传' : '知识库' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="scope">
                    <el-button size="small" type="danger" @click="removeFromConstraintList(scope.row.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-form-item>
        
        <!-- 约束来源 -->
        <el-form-item label="约束来源">
          <el-tabs @tab-click="handleSourceTabClick">
            <el-tab-pane label="规范标准" name="spec"></el-tab-pane>
            <el-tab-pane label="法律法规" name="law"></el-tab-pane>
            <el-tab-pane label="工程知识" name="knowledge"></el-tab-pane>
            <el-tab-pane label="本地上传" name="upload"></el-tab-pane>
          </el-tabs>
          
          <!-- 规范标准选择 -->
          <div v-if="activeSourceTab === 'spec'" class="source-content">
            <el-input v-model="specSearchKeyword" placeholder="搜索规范标准" style="margin-bottom: 12px;">
              <template #append>
                <el-button @click="searchSpecs"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="selectedSpecs" multiple placeholder="选择规范标准" style="width: 100%; margin-bottom: 12px;">
              <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
            </el-select>
            <el-button type="primary" size="small" @click="addSpecsToConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
          
          <!-- 法律法规选择 -->
          <div v-if="activeSourceTab === 'law'" class="source-content">
            <el-input v-model="lawSearchKeyword" placeholder="搜索法律法规" style="margin-bottom: 12px;">
              <template #append>
                <el-button @click="searchLaws"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="selectedLaws" multiple placeholder="选择法律法规" style="width: 100%; margin-bottom: 12px;">
              <el-option v-for="law in laws" :key="law.id" :label="law.name" :value="law.id" />
            </el-select>
            <el-button type="primary" size="small" @click="addLawsToConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
          
          <!-- 工程知识选择 -->
          <div v-if="activeSourceTab === 'knowledge'" class="source-content">
            <el-input v-model="knowledgeSearchKeyword" placeholder="搜索工程知识" style="margin-bottom: 12px;">
              <template #append>
                <el-button @click="searchKnowledge"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="selectedKnowledge" multiple placeholder="选择工程知识" style="width: 100%; margin-bottom: 12px;">
              <el-option v-for="knowledge in knowledgeItems" :key="knowledge.id" :label="knowledge.name" :value="knowledge.id" />
            </el-select>
            <el-button type="primary" size="small" @click="addKnowledgeToConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
          
          <!-- 本地文件上传 -->
          <div v-if="activeSourceTab === 'upload'" class="source-content">
            <el-upload
              class="upload-source"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleLocalFileChange"
              :on-remove="handleLocalFileRemove"
              :file-list="localUploadedFiles"
              :limit="3"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传 PDF、DOCX、XLSX 格式文件，单个文件不超过 50MB，最多上传 3 个文件
                </div>
              </template>
            </el-upload>
            <div v-if="localFileUploadError" class="upload-error">
              {{ localFileUploadError }}
            </div>
            <el-select v-model="localFileCategory" placeholder="选择文件类别" style="width: 100%; margin-top: 12px; margin-bottom: 12px;">
              <el-option label="规范标准" value="spec" />
              <el-option label="法律法规" value="law" />
              <el-option label="工程知识" value="knowledge" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <el-input v-if="localFileCategory === 'custom'" v-model="customCategoryName" placeholder="请输入自定义类型名称" style="width: 100%; margin-bottom: 12px;" />
            <el-button type="primary" size="small" @click="addLocalFilesToConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createThemeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitNewTheme">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑约束主题对话框 -->
    <el-dialog
      v-model="editThemeDialogVisible"
      title="编辑约束主题"
      width="700px"
    >
      <el-form :model="editThemeForm" label-width="80px">
        <el-form-item label="约束主题名称" required>
          <el-input v-model="editThemeForm.name" placeholder="请输入约束主题名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="editThemeForm.description" placeholder="请输入约束主题描述" rows="3" />
        </el-form-item>
        
        <!-- 约束清单 -->
        <el-form-item label="约束清单">
          <div class="constraint-list">
            <div v-if="editConstraintList.length === 0" class="empty-list">
              <el-icon><Document /></el-icon>
              <span>暂无约束文档，请从约束来源中添加</span>
            </div>
            <div v-else class="list-table">
              <el-table :data="editConstraintList" style="width: 100%">
                <el-table-column prop="name" label="约束名称" min-width="200">
                  <template #default="scope">
                    <span>{{ scope.row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="约束类型" width="120">
                  <template #default="scope">
                    <el-tag :type="getTypeTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="来源" width="100">
                  <template #default="scope">
                    <el-tag size="small" type="info">
                      {{ scope.row.id.startsWith('local-') ? '本地上传' : '知识库' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="scope">
                    <el-button size="small" type="danger" @click="removeFromEditConstraintList(scope.row.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-form-item>
        
        <!-- 约束来源 -->
        <el-form-item label="约束来源">
          <el-tabs @tab-click="handleSourceTabClick">
            <el-tab-pane label="规范标准" name="spec"></el-tab-pane>
            <el-tab-pane label="法律法规" name="law"></el-tab-pane>
            <el-tab-pane label="工程知识" name="knowledge"></el-tab-pane>
            <el-tab-pane label="本地上传" name="upload"></el-tab-pane>
          </el-tabs>
          
          <!-- 规范标准选择 -->
          <div v-if="activeSourceTab === 'spec'" class="source-content">
            <el-input v-model="specSearchKeyword" placeholder="搜索规范标准" style="margin-bottom: 12px;">
              <template #append>
                <el-button @click="searchSpecs"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="selectedSpecs" multiple placeholder="选择规范标准" style="width: 100%; margin-bottom: 12px;">
              <el-option v-for="spec in specs" :key="spec.id" :label="`${spec.name} (${spec.code})`" :value="spec.id" />
            </el-select>
            <el-button type="primary" size="small" @click="addSpecsToEditConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
          
          <!-- 法律法规选择 -->
          <div v-if="activeSourceTab === 'law'" class="source-content">
            <el-input v-model="lawSearchKeyword" placeholder="搜索法律法规" style="margin-bottom: 12px;">
              <template #append>
                <el-button @click="searchLaws"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="selectedLaws" multiple placeholder="选择法律法规" style="width: 100%; margin-bottom: 12px;">
              <el-option v-for="law in laws" :key="law.id" :label="law.name" :value="law.id" />
            </el-select>
            <el-button type="primary" size="small" @click="addLawsToEditConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
          
          <!-- 工程知识选择 -->
          <div v-if="activeSourceTab === 'knowledge'" class="source-content">
            <el-input v-model="knowledgeSearchKeyword" placeholder="搜索工程知识" style="margin-bottom: 12px;">
              <template #append>
                <el-button @click="searchKnowledge"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
            <el-select v-model="selectedKnowledge" multiple placeholder="选择工程知识" style="width: 100%; margin-bottom: 12px;">
              <el-option v-for="knowledge in knowledgeItems" :key="knowledge.id" :label="knowledge.name" :value="knowledge.id" />
            </el-select>
            <el-button type="primary" size="small" @click="addKnowledgeToEditConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
          
          <!-- 本地文件上传 -->
          <div v-if="activeSourceTab === 'upload'" class="source-content">
            <el-upload
              class="upload-source"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleLocalFileChange"
              :on-remove="handleLocalFileRemove"
              :file-list="localUploadedFiles"
              :limit="3"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传 PDF、DOCX、XLSX 格式文件，单个文件不超过 50MB，最多上传 3 个文件
                </div>
              </template>
            </el-upload>
            <div v-if="localFileUploadError" class="upload-error">
              {{ localFileUploadError }}
            </div>
            <el-select v-model="localFileCategory" placeholder="选择文件类别" style="width: 100%; margin-top: 12px; margin-bottom: 12px;">
              <el-option label="规范标准" value="spec" />
              <el-option label="法律法规" value="law" />
              <el-option label="工程知识" value="knowledge" />
              <el-option label="自定义" value="custom" />
            </el-select>
            <el-input v-if="localFileCategory === 'custom'" v-model="customCategoryName" placeholder="请输入自定义类型名称" style="width: 100%; margin-bottom: 12px;" />
            <el-button type="primary" size="small" @click="addLocalFilesToEditConstraint" style="width: 100%;">添加到约束清单</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editThemeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditTheme">确定</el-button>
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
    
    <!-- 专家签名对话框 -->
    <el-dialog
      v-model="expertSignatureDialogVisible"
      title="专家签名"
      width="700px"
    >
      <div class="signature-container">
        <el-form :model="expertInfo" label-width="80px">
          <el-form-item label="专家姓名" required>
            <el-input v-model="expertInfo.name" placeholder="请输入专家姓名" />
          </el-form-item>
          <el-form-item label="专家职称" required>
            <el-input v-model="expertInfo.title" placeholder="请输入专家职称" />
          </el-form-item>
          <el-form-item label="签名选择">
            <div class="signature-selection">
              <el-radio-group v-model="signatureMode" @change="handleSignatureModeChange">
                <el-radio label="draw">手绘签名</el-radio>
                <el-radio label="select">选择已有签名</el-radio>
              </el-radio-group>
              
              <!-- 手绘签名 -->
              <div v-if="signatureMode === 'draw'" class="signature-pad" ref="signaturePad">
                <canvas ref="signatureCanvas" width="600" height="200" style="border: 1px solid #e4e7ed; border-radius: 4px;"></canvas>
                <div class="signature-actions">
                  <el-button size="small" @click="clearSignature">清除签名</el-button>
                  <el-button size="small" type="primary" @click="saveSignature">保存签名</el-button>
                </div>
              </div>
              
              <!-- 选择已有签名 -->
              <div v-if="signatureMode === 'select'" class="signature-library">
                <div class="signature-grid">
                  <div 
                    v-for="signature in availableSignatures" 
                    :key="signature.id"
                    class="signature-item"
                    :class="{ active: selectedSignatureId === signature.id }"
                    @click="selectExistingSignature(signature)"
                  >
                    <img :src="signature.url" :alt="signature.name" class="signature-image" />
                    <div class="signature-info">
                      <span class="signature-name">{{ signature.name }}</span>
                      <span class="signature-date">{{ signature.uploadDate }}</span>
                    </div>
                  </div>
                  
                  <div v-if="availableSignatures.length === 0" class="empty-signatures">
                    <el-icon class="empty-icon"><Picture /></el-icon>
                    <p>暂无签名，请先在签名管理页面上传</p>
                    <el-button type="primary" @click="navigateToSignatureManagement">
                      <el-icon><Setting /></el-icon> 前往签名管理
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="expertSignatureDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSignature">确认签名</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown, Edit, Delete, Plus, FolderAdd, InfoFilled, UploadFilled, Search, Refresh, Collection, DocumentCopy, Picture, Setting } from '@element-plus/icons-vue'

// 类型定义
interface ConstraintTheme {
  id: string
  name: string
  description: string
  items: string[]
  parentId?: string
}

interface ConstraintItem {
  id: string
  name: string
  code?: string
  type: string
}

interface ReviewSuggestion {
  issue: string
  suggestion: string
  standard: string
  riskLevel: string
  status?: 'pending' | 'accepted' | 'rejected' | 'modified'
  modification?: string
}

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

interface PromptTemplate {
  id: string
  name: string
  content: string
  description: string
}

interface Signature {
  id: string
  name: string
  url: string
  uploadDate: string
}

// 响应式数据
const constraintThemeForm = reactive({
  themeIds: [] as string[],
  itemIds: [] as string[]
})

const planForm = reactive({
  projectSummary: '',
  basis: '',
  purpose: '',
  keywords: [] as string[]
})

const newKeyword = ref('')

// 路由实例
const router = useRouter()
const showReviewResult = ref(false)

// 文件上传相关
const uploadedFiles = ref<any[]>([])
const fileUploadError = ref('')

// 约束主题数据
const constraintThemes = ref<ConstraintTheme[]>([
  { id: '1', name: '建筑施工方案审查', description: '建筑施工方案相关的约束主题', items: ['1', '2', '4'] },
  { id: '2', name: '结构施工方案审查', description: '结构施工方案相关的约束主题', items: ['2', '3', '5'] },
  { id: '3', name: '安全施工方案审查', description: '安全施工方案相关的约束主题', items: ['1', '3', '6'] }
])

// 约束项目数据（模拟）
const constraintItems = ref<ConstraintItem[]>([
  // 规范标准类
  { id: '1', name: '建筑设计防火规范', code: 'GB 50016-2014', type: '规范标准' },
  { id: '2', name: '混凝土结构设计规范', code: 'GB 50010-2010', type: '规范标准' },
  { id: '3', name: '建筑抗震设计规范', code: 'GB 50011-2010', type: '规范标准' },
  // 法律法规类
  { id: '4', name: '中华人民共和国建筑法', type: '法律法规' },
  { id: '5', name: '建设工程安全生产管理条例', type: '法律法规' },
  // 工程知识类
  { id: '6', name: '建筑施工安全技术规程', type: '工程知识' }
])

// 约束主题来源相关
const activeSourceTab = ref('spec')
const specSearchKeyword = ref('')
const lawSearchKeyword = ref('')
const knowledgeSearchKeyword = ref('')
const selectedSpecs = ref<string[]>([])
const selectedLaws = ref<string[]>([])
const selectedKnowledge = ref<string[]>([])
const localUploadedFiles = ref<any[]>([])
const localFileUploadError = ref('')
const localFileCategory = ref('spec')
const customCategoryName = ref('')

// 智能问答相关
const modelConfig = reactive({
  models: [] as string[],
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
  },
  {
    id: 'review',
    name: '审查提示词',
    content: '你是一个专业的方案审查助手，请根据提供的约束主题和规范标准内容，对用户上传的方案进行审查。分析方案是否符合相关规范要求，指出存在的问题，并提供具体的修改建议。',
    description: '用于方案审查的提示词'
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

// 对话相关
const userInput = ref('')
const chatMessages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '您好！我是规范智答助手，请问有什么可以帮助您的问题？',
    timestamp: new Date().toLocaleString(),
    references: []
  }
])

// 鼠标悬浮消息索引
const hoveredMessageIndex = ref(-1)

// 约束清单相关
const constraintList = ref<ConstraintItem[]>([])
const editConstraintList = ref<ConstraintItem[]>([])

// 从约束清单中移除项目
const removeFromConstraintList = (id: string) => {
  constraintList.value = constraintList.value.filter(item => item.id !== id)
  ElMessage.success('已从约束清单中移除')
}

// 从编辑约束清单中移除项目
const removeFromEditConstraintList = (id: string) => {
  editConstraintList.value = editConstraintList.value.filter(item => item.id !== id)
  ElMessage.success('已从约束清单中移除')
}

// 数据同步相关
const syncStatus = ref('idle') // idle, syncing, success, error
const lastSyncTime = ref('')
const syncProgress = ref(0)
const versionHistory = ref([
  {
    version: 'v1.0.0',
    timestamp: '2024-01-01 10:00:00',
    changes: '初始版本',
    author: '系统'
  },
  {
    version: 'v1.0.1',
    timestamp: '2024-01-02 14:30:00',
    changes: '添加了新的约束主题',
    author: '管理员'
  }
])
const currentVersion = ref('v1.0.1')
const autoSyncEnabled = ref(false)

// 模拟数据 - 规范标准
const specs = ref([
  { id: 'spec-1', name: '建筑设计防火规范', code: 'GB 50016-2014' },
  { id: 'spec-2', name: '混凝土结构设计规范', code: 'GB 50010-2010' },
  { id: 'spec-3', name: '建筑抗震设计规范', code: 'GB 50011-2010' },
  { id: 'spec-4', name: '建筑地基基础设计规范', code: 'GB 50007-2011' },
  { id: 'spec-5', name: '建筑结构荷载规范', code: 'GB 50009-2012' }
])

// 模拟数据 - 法律法规
const laws = ref([
  { id: 'law-1', name: '中华人民共和国建筑法' },
  { id: 'law-2', name: '建设工程安全生产管理条例' },
  { id: 'law-3', name: '中华人民共和国安全生产法' },
  { id: 'law-4', name: '建设工程质量管理条例' },
  { id: 'law-5', name: '中华人民共和国消防法' }
])

// 模拟数据 - 工程知识
const knowledgeItems = ref([
  { id: 'knowledge-1', name: '建筑施工安全技术规程' },
  { id: 'knowledge-2', name: '建筑施工高处作业安全技术规范' },
  { id: 'knowledge-3', name: '建筑机械使用安全技术规程' },
  { id: 'knowledge-4', name: '施工现场临时用电安全技术规范' },
  { id: 'knowledge-5', name: '建筑施工扣件式钢管脚手架安全技术规范' }
])

// 状态管理
const loadedConstraintThemes = ref<ConstraintTheme[]>([
  { id: '1', name: '建筑施工方案审查', description: '建筑施工方案相关的约束主题', items: ['1', '2', '4'] },
  { id: '2', name: '结构施工方案审查', description: '结构施工方案相关的约束主题', items: ['2', '3', '5'] },
  { id: '3', name: '安全施工方案审查', description: '安全施工方案相关的约束主题', items: ['1', '3', '6'] }
])

const selectedConstraintThemeId = ref('1')
const expandedThemes = ref<string[]>([])
const constraintThemeTreeRef = ref()

// 对话框状态
const createThemeDialogVisible = ref(false)
const editThemeDialogVisible = ref(false)
const newThemeForm = reactive({
  name: '',
  description: '',
  itemIds: [] as string[]
})
const editThemeForm = reactive({
  id: '',
  name: '',
  description: '',
  itemIds: [] as string[]
})

// 计算属性
const constraintThemeTree = computed(() => {
  return constraintThemes.value.map(theme => {
    const itemChildren = theme.items.map(itemId => {
      const item = constraintItems.value.find((i: any) => i.id === itemId)
      return {
        id: `item-${itemId}`,
        label: item ? `${item.name} (${item.code || item.type})` : itemId
      }
    })
    
    return {
      id: theme.id,
      label: theme.name,
      children: itemChildren.length > 0 ? itemChildren : undefined
    }
  })
})

const constraintThemeProps = {
  children: 'children',
  label: 'label'
}



const filteredItems = computed(() => {
  if (constraintThemeForm.themeIds.length === 0) {
    return []
  }
  
  if (constraintThemeForm.themeIds.includes('all')) {
    return constraintItems.value
  }
  
  const itemIds = new Set<string>()
  constraintThemeForm.themeIds.forEach(themeId => {
    const theme = constraintThemes.value.find(theme => theme.id === themeId)
    if (theme) {
      theme.items.forEach(itemId => itemIds.add(itemId))
    }
  })
  
  return constraintItems.value.filter(item => itemIds.has(item.id))
})

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

const getTypeTagType = (type: string): string => {
  switch (type) {
    case '规范标准':
      return 'primary'
    case '法律法规':
      return 'success'
    case '工程知识':
      return 'warning'
    default:
      return 'info'
  }
}

const createConstraintTheme = () => {
  createThemeDialogVisible.value = true
}

const submitNewTheme = () => {
  if (!newThemeForm.name) {
    ElMessage.error('请填写约束主题名称')
    return
  }
  
  if (constraintList.value.length === 0) {
    ElMessage.error('请从约束来源中添加约束文档')
    return
  }
  
  // 从约束清单中获取项目ID
  const itemIds = constraintList.value.map(item => item.id)
  
  const newTheme: ConstraintTheme = {
    id: String(constraintThemes.value.length + 1),
    name: newThemeForm.name,
    description: newThemeForm.description,
    items: itemIds
  }
  
  constraintThemes.value.push(newTheme)
  loadedConstraintThemes.value.push(newTheme)
  
  ElMessage.success('约束主题创建成功')
  createThemeDialogVisible.value = false
  
  // 重置表单和约束清单
  newThemeForm.name = ''
  newThemeForm.description = ''
  constraintList.value = []
}

const editConstraintTheme = (data: any) => {
  const theme = constraintThemes.value.find(theme => theme.id === data.id)
  if (theme) {
    editThemeForm.id = theme.id
    editThemeForm.name = theme.name
    editThemeForm.description = theme.description
    editThemeForm.itemIds = [...theme.items]
    
    // 加载现有的约束项目到编辑约束清单
    editConstraintList.value = []
    theme.items.forEach(itemId => {
      const item = constraintItems.value.find(i => i.id === itemId)
      if (item) {
        editConstraintList.value.push(item)
      }
    })
    
    editThemeDialogVisible.value = true
  }
}

const submitEditTheme = () => {
  if (!editThemeForm.name) {
    ElMessage.error('请填写约束主题名称')
    return
  }
  
  if (editConstraintList.value.length === 0) {
    ElMessage.error('请从约束来源中添加约束文档')
    return
  }
  
  // 从约束清单中获取项目ID
  const itemIds = editConstraintList.value.map(item => item.id)
  
  const index = constraintThemes.value.findIndex(theme => theme.id === editThemeForm.id)
  if (index > -1) {
    constraintThemes.value[index] = {
      id: editThemeForm.id,
      name: editThemeForm.name,
      description: editThemeForm.description,
      items: itemIds
    }
  }
  
  const loadedIndex = loadedConstraintThemes.value.findIndex(theme => theme.id === editThemeForm.id)
  if (loadedIndex > -1) {
    loadedConstraintThemes.value[loadedIndex] = {
      id: editThemeForm.id,
      name: editThemeForm.name,
      description: editThemeForm.description,
      items: itemIds
    }
  }
  
  ElMessage.success('约束主题编辑成功')
  editThemeDialogVisible.value = false
  
  // 重置编辑约束清单
  editConstraintList.value = []
}

const deleteConstraintTheme = (id: string) => {
  constraintThemes.value = constraintThemes.value.filter(theme => theme.id !== id)
  loadedConstraintThemes.value = loadedConstraintThemes.value.filter(theme => theme.id !== id)
  
  if (selectedConstraintThemeId.value === id) {
    selectedConstraintThemeId.value = loadedConstraintThemes.value.length > 0 ? loadedConstraintThemes.value[0]?.id || '' : ''
  }
  
  ElMessage.success('约束主题删除成功')
}

const handleConstraintThemeClick = (data: any) => {
  console.log('点击约束主题:', data)
  const theme = constraintThemes.value.find(theme => theme.id === data.id)
  if (theme) {
    if (!loadedConstraintThemes.value.some(loadedTheme => loadedTheme.id === theme.id)) {
      loadedConstraintThemes.value.push(theme)
      selectedConstraintThemeId.value = theme.id
      ElMessage.success('约束主题已加载到约束主题库')
    } else {
      selectedConstraintThemeId.value = theme.id
    }
    
    const index = constraintThemeForm.themeIds.indexOf(theme.id)
    if (index > -1) {
      constraintThemeForm.themeIds.splice(index, 1)
    } else {
      constraintThemeForm.themeIds.push(theme.id)
    }
  } else if (data.id.startsWith('item-')) {
    const itemId = data.id.replace('item-', '')
    const containingThemes = constraintThemes.value.filter(theme => theme.items.includes(itemId))
    if (containingThemes.length > 0) {
      containingThemes.forEach(theme => {
        const index = constraintThemeForm.themeIds.indexOf(theme.id)
        if (index > -1) {
          constraintThemeForm.themeIds.splice(index, 1)
        } else {
          constraintThemeForm.themeIds.push(theme.id)
        }
      })
      const itemIndex = constraintThemeForm.itemIds.indexOf(itemId)
      if (itemIndex > -1) {
        constraintThemeForm.itemIds.splice(itemIndex, 1)
      } else {
        constraintThemeForm.itemIds.push(itemId)
      }
    }
  }
}

const selectConstraintTheme = (id: string) => {
  selectedConstraintThemeId.value = id
  console.log('选择约束主题:', id)
  if (constraintThemeTreeRef.value) {
    constraintThemeTreeRef.value.setCurrentKey(id)
  }
  
  const index = constraintThemeForm.themeIds.indexOf(id)
  if (index > -1) {
    constraintThemeForm.themeIds.splice(index, 1)
  } else {
    constraintThemeForm.themeIds.push(id)
  }
}

const removeConstraintTheme = (id: string) => {
  loadedConstraintThemes.value = loadedConstraintThemes.value.filter(theme => theme.id !== id)
  if (selectedConstraintThemeId.value === id) {
    selectedConstraintThemeId.value = loadedConstraintThemes.value.length > 0 ? loadedConstraintThemes.value[0]?.id || '' : ''
  }
  ElMessage.success('约束主题已移除')
}

const openAddConstraintThemeDialog = () => {
  createThemeDialogVisible.value = true
}

const loadConstraintTheme = () => {
  if (constraintThemeForm.themeIds.length === 0) {
    ElMessage.error('请选择约束主题')
    return
  }
  
  constraintThemeForm.themeIds.forEach(themeId => {
    if (themeId !== 'all') {
      const theme = constraintThemes.value.find(theme => theme.id === themeId)
      if (theme) {
        if (!loadedConstraintThemes.value.some(loadedTheme => loadedTheme.id === theme.id)) {
          loadedConstraintThemes.value.push(theme)
        }
      }
    } else {
      constraintThemes.value.forEach(theme => {
        if (!loadedConstraintThemes.value.some(loadedTheme => loadedTheme.id === theme.id)) {
          loadedConstraintThemes.value.push(theme)
        }
      })
    }
  })
  
  selectedConstraintThemeId.value = loadedConstraintThemes.value.length > 0 ? loadedConstraintThemes.value[0]?.id || '' : ''
  ElMessage.success('约束主题加载成功')
}

const toggleThemeExpand = (id: string) => {
  const index = expandedThemes.value.indexOf(id)
  if (index > -1) {
    expandedThemes.value.splice(index, 1)
  } else {
    expandedThemes.value.push(id)
  }
}

const getItemName = (itemId: string) => {
  const item = constraintItems.value.find((i: any) => i.id === itemId)
  return item ? `${item.name} (${item.code || item.type})` : itemId
}

const handleFileChange = (file: any) => {
  console.log('文件上传', file)
  
  // 重置错误信息
  fileUploadError.value = ''
  
  // 验证文件类型
  const allowedTypes = ['.pdf', '.docx', '.xlsx']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(fileExtension)) {
    fileUploadError.value = '只支持上传 PDF、DOCX、XLSX 格式的文件'
    return
  }
  
  // 验证文件大小（50MB）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    fileUploadError.value = '单个文件大小不能超过 50MB'
    return
  }
  
  // 验证文件数量
  if (uploadedFiles.value.length >= 5) {
    fileUploadError.value = '最多只能上传 5 个文件'
    return
  }
  
  // 检查文件是否已存在
  const existingFile = uploadedFiles.value.find(f => f.name === file.name)
  if (existingFile) {
    fileUploadError.value = '该文件已上传'
    return
  }
  
  // 添加文件到上传列表，并添加上传状态
  const fileWithStatus = {
    ...file,
    status: 'uploading' as 'uploading' | 'success' | 'error',
    progress: 0
  }
  uploadedFiles.value.push(fileWithStatus)
  
  // 模拟上传进度
  simulateUploadProgress(fileWithStatus)
}

// 模拟上传进度
const simulateUploadProgress = (file: any) => {
  const interval = setInterval(() => {
    if (file.progress < 100) {
      file.progress += Math.floor(Math.random() * 10) + 5
      if (file.progress > 100) {
        file.progress = 100
      }
    } else {
      clearInterval(interval)
      file.status = 'success'
      console.log('文件上传成功:', file.name)
    }
  }, 300)
}

const handleFileRemove = (file: any, index?: number) => {
  console.log('移除文件', file)
  if (index !== undefined) {
    uploadedFiles.value.splice(index, 1)
  } else {
    uploadedFiles.value = uploadedFiles.value.filter(f => f.uid !== file.uid)
  }
  console.log('文件移除成功:', file.name)
}

const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

const addKeyword = () => {
  if (newKeyword.value.trim()) {
    planForm.keywords.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

// 多模型审查结果
interface ModelReviewResult {
  model: string
  opinion: string
  suggestions: ReviewSuggestion[]
  timestamp: string
  status: 'pending' | 'completed' | 'error'
}

// 最终审查结果（带模型来源）
interface FinalReviewSuggestion extends ReviewSuggestion {
  models: string[]
  status: 'pending' | 'accepted' | 'rejected' | 'modified'
  modification?: string
}

interface FinalReviewResult {
  opinion: string
  suggestions: FinalReviewSuggestion[]
  highlights: string[]
  timestamp: string
}

const modelReviewResults = ref<ModelReviewResult[]>([])
const finalReviewResult = ref<FinalReviewResult | null>(null)
const isReviewing = ref(false)
const reviewProgress = ref(0)

// 开始多模型并行审查
const startReview = async () => {
  if (modelConfig.models.length === 0) {
    ElMessage.error('请至少选择一个模型进行审查')
    return
  }
  
  if (uploadedFiles.value.length === 0) {
    ElMessage.error('请先上传方案文件')
    return
  }
  
  isReviewing.value = true
  reviewProgress.value = 0
  showReviewResult.value = false
  
  // 初始化模型审查结果
  modelReviewResults.value = modelConfig.models.map(model => ({
    model,
    opinion: '',
    suggestions: [],
    timestamp: new Date().toLocaleString(),
    status: 'pending'
  }))
  
  ElMessage.info(`开始使用 ${modelConfig.models.length} 个模型进行并行审查...`)
  
  try {
    // 并行执行多模型审查
    const reviewPromises = modelConfig.models.map(async (model, index) => {
      // 模拟模型审查过程
      await new Promise(resolve => setTimeout(resolve, 2000 + index * 500))
      
      // 模拟各模型的审查结果
      const modelOpinions: Record<string, string> = {
        qwen: '根据对方案的审查，发现以下问题：1. 安全措施不够完善；2. 进度计划存在不合理之处；3. 资源配置需要优化。',
        deepseek: '审查结果显示，该方案在以下方面需要改进：1. 质量保证措施需加强；2. 安全管理计划不全面；3. 施工工艺选择有待优化。',
        gpt4: '经过详细分析，该方案存在以下问题：1. 安全措施不到位；2. 质量控制体系不健全；3. 进度安排不合理；4. 资源配置不均衡。',
        claude: '审查发现方案存在以下不足：1. 安全管理措施不完善；2. 质量保证体系不健全；3. 进度计划安排不合理；4. 资源配置需要优化。',
        llama3: '方案审查结果：1. 安全措施需要加强；2. 质量控制计划不全面；3. 进度安排存在缺陷；4. 资源配置不合理。'
      }
      
      const modelSuggestions: Record<string, ReviewSuggestion[]> = {
        qwen: [
          { issue: '安全措施不够完善', suggestion: '增加详细的安全管理计划和应急预案', standard: '建筑施工安全检查标准 (JGJ59-2011)', riskLevel: '高' },
          { issue: '进度计划存在不合理之处', suggestion: '重新调整施工进度计划，确保各工序合理衔接', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' },
          { issue: '资源配置需要优化', suggestion: '根据施工进度计划，合理配置人力、材料和设备资源', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' }
        ],
        deepseek: [
          { issue: '质量保证措施需加强', suggestion: '建立完善的质量保证体系，增加质量检查点', standard: '建设工程质量管理条例', riskLevel: '高' },
          { issue: '安全管理计划不全面', suggestion: '制定详细的安全管理计划，包括安全培训、安全检查等内容', standard: '建筑施工安全检查标准 (JGJ59-2011)', riskLevel: '高' },
          { issue: '施工工艺选择有待优化', suggestion: '根据工程特点，选择更加合理的施工工艺', standard: '建筑施工技术统一标准 (GB50354-2015)', riskLevel: '中' }
        ],
        gpt4: [
          { issue: '安全措施不到位', suggestion: '加强安全措施，增加安全防护设施', standard: '建筑施工安全检查标准 (JGJ59-2011)', riskLevel: '高' },
          { issue: '质量控制体系不健全', suggestion: '建立健全的质量控制体系，加强过程控制', standard: '建设工程质量管理条例', riskLevel: '高' },
          { issue: '进度安排不合理', suggestion: '优化施工进度计划，合理安排各工序', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' },
          { issue: '资源配置不均衡', suggestion: '根据施工进度，均衡配置资源', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' }
        ],
        claude: [
          { issue: '安全管理措施不完善', suggestion: '完善安全管理措施，加强安全监督', standard: '建筑施工安全检查标准 (JGJ59-2011)', riskLevel: '高' },
          { issue: '质量保证体系不健全', suggestion: '建立健全质量保证体系，加强质量检查', standard: '建设工程质量管理条例', riskLevel: '高' },
          { issue: '进度计划安排不合理', suggestion: '调整进度计划，确保施工顺利进行', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' },
          { issue: '资源配置需要优化', suggestion: '优化资源配置，提高资源利用效率', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' }
        ],
        llama3: [
          { issue: '安全措施需要加强', suggestion: '加强安全措施，确保施工安全', standard: '建筑施工安全检查标准 (JGJ59-2011)', riskLevel: '高' },
          { issue: '质量控制计划不全面', suggestion: '制定全面的质量控制计划，加强质量监督', standard: '建设工程质量管理条例', riskLevel: '高' },
          { issue: '进度安排存在缺陷', suggestion: '修复进度安排中的缺陷，确保按时完成', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' },
          { issue: '资源配置不合理', suggestion: '合理配置资源，提高施工效率', standard: '建设工程项目管理规范 (GB/T50326-2017)', riskLevel: '中' }
        ]
      }
      
      // 更新模型审查结果
      const resultIndex = modelReviewResults.value.findIndex(r => r.model === model)
      if (resultIndex !== -1) {
        modelReviewResults.value[resultIndex] = {
          model,
          opinion: modelOpinions[model] || '审查完成',
          suggestions: modelSuggestions[model] || [],
          timestamp: new Date().toLocaleString(),
          status: 'completed'
        }
      }
      
      // 更新审查进度
      reviewProgress.value = Math.round(((index + 1) / modelConfig.models.length) * 100)
    })
    
    // 等待所有模型审查完成
    await Promise.all(reviewPromises)
    
    ElMessage.success('多模型并行审查完成')
    showReviewResult.value = true
  } catch (error) {
    ElMessage.error('审查过程中出现错误')
    console.error('审查错误:', error)
  } finally {
    isReviewing.value = false
  }
}

// 智能填表功能
const intelligentFillForm = async () => {
  if (uploadedFiles.value.length === 0) {
    ElMessage.error('请先上传方案文件')
    return
  }
  
  // 模拟大语言模型处理过程
  ElMessage.info('正在分析上传的方案文件...')
  
  try {
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 模拟大语言模型对方案的理解和提取
    // 实际项目中，这里应该调用后端API，使用大语言模型分析上传的文件
    
    // 智能填充表单数据
    planForm.projectSummary = '本方案针对某办公楼建筑工程的施工组织设计，包括施工部署、施工进度计划、资源配置、质量保证措施等内容。项目总建筑面积为15000平方米，地上12层，地下2层，计划工期为180天。'
    planForm.basis = '1. 建筑设计防火规范 (GB 50016-2014)\n2. 混凝土结构设计规范 (GB 50010-2010)\n3. 建筑抗震设计规范 (GB 50011-2010)\n4. 建筑地基基础设计规范 (GB 50007-2011)\n5. 建设工程质量管理条例'
    planForm.purpose = '指导该办公楼建筑工程的施工组织与管理，确保工程质量、安全、进度和成本目标的实现'
    planForm.keywords = ['办公楼', '施工组织设计', '质量保证', '安全措施', '进度计划']
    
    ElMessage.success('智能填表完成，已自动填充表单数据')
  } catch (error) {
    ElMessage.error('智能填表失败，请重试')
    console.error('智能填表错误:', error)
  }
}

// 智能汇审功能
const startAssemblyReview = async () => {
  if (modelReviewResults.value.length === 0) {
    ElMessage.error('请先完成多模型审查')
    return
  }
  
  ElMessage.info('正在进行智能汇审...')
  
  try {
    // 模拟汇审处理时间
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 收集所有模型的审查意见和建议
    const allSuggestions: { [key: string]: { suggestion: ReviewSuggestion, models: string[] } } = {}
    
    modelReviewResults.value.forEach(result => {
      result.suggestions.forEach(suggestion => {
        // 基于问题描述进行去重
        const key = suggestion.issue.trim()
        if (allSuggestions[key]) {
          allSuggestions[key].models.push(result.model)
        } else {
          allSuggestions[key] = { suggestion, models: [result.model] }
        }
      })
    })
    
    // 转换为数组并按风险等级排序
    const consolidatedSuggestions: FinalReviewSuggestion[] = Object.values(allSuggestions).map(({ suggestion, models }) => ({
      ...suggestion,
      models,
      status: 'pending' as const
    })).sort((a, b) => {
      const riskOrder = { '高': 0, '中': 1, '低': 2 }
      return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 3) - (riskOrder[b.riskLevel as keyof typeof riskOrder] || 3)
    })
    
    // 提取审查要点
    const highlights = Array.from(new Set(
      consolidatedSuggestions.map(s => s.issue.split('：')[0] || s.issue)
    ))
    
    // 生成最终审查意见
    const finalOpinion = `根据${modelReviewResults.value.length}个模型的审查结果，综合分析如下：\n\n` +
      `1. 安全管理方面：${consolidatedSuggestions.filter(s => s.issue.includes('安全')).length}个问题，主要集中在安全措施不完善、安全管理计划不全面等方面\n` +
      `2. 质量管理方面：${consolidatedSuggestions.filter(s => s.issue.includes('质量')).length}个问题，主要集中在质量保证体系不健全、质量控制计划不全面等方面\n` +
      `3. 进度管理方面：${consolidatedSuggestions.filter(s => s.issue.includes('进度')).length}个问题，主要集中在进度计划不合理、进度安排存在缺陷等方面\n` +
      `4. 资源管理方面：${consolidatedSuggestions.filter(s => s.issue.includes('资源')).length}个问题，主要集中在资源配置不合理、资源配置不均衡等方面\n\n` +
      `建议重点关注高风险问题，优先解决安全和质量相关的问题，确保施工方案的可行性和安全性。`
    
    // 生成最终审查结果
    finalReviewResult.value = {
      opinion: finalOpinion,
      suggestions: consolidatedSuggestions,
      highlights,
      timestamp: new Date().toLocaleString()
    }
    
    ElMessage.success('智能汇审完成')
  } catch (error) {
    ElMessage.error('智能汇审失败，请重试')
    console.error('汇审错误:', error)
  }
}

// 导出审查报告
const exportReviewReport = () => {
  if (!finalReviewResult.value) {
    ElMessage.error('请先完成智能汇审')
    return
  }
  
  // 模拟导出功能
  ElMessage.info('正在导出审查报告...')
  setTimeout(() => {
    ElMessage.success('审查报告导出成功')
  }, 1000)
}

// 切换意见状态
const toggleSuggestionStatus = (index: number) => {
  if (!finalReviewResult.value) return
  
  const suggestion = finalReviewResult.value.suggestions[index]
  if (!suggestion) return
  
  // 状态轮换顺序：pending -> accepted -> rejected -> modified -> pending
  switch (suggestion.status) {
    case 'pending':
      suggestion.status = 'accepted'
      break
    case 'accepted':
      suggestion.status = 'rejected'
      break
    case 'rejected':
      suggestion.status = 'modified'
      // 当切换到修改采纳状态时，打开输入框让用户输入修改内容
      setTimeout(() => {
        const inputEl = document.getElementById(`modification-input-${index}`)
        if (inputEl) {
          (inputEl as HTMLInputElement).focus()
        }
      }, 100)
      break
    case 'modified':
      suggestion.status = 'pending'
      // 重置修改内容
      suggestion.modification = undefined
      break
  }
}

// 处理修改内容输入
const handleModificationInput = (index: number, value: string) => {
  if (!finalReviewResult.value) return
  const suggestion = finalReviewResult.value.suggestions[index]
  if (!suggestion) return
  suggestion.modification = value
}

// 切换模型建议状态
const toggleModelSuggestionStatus = (model: string, index: number) => {
  const result = modelReviewResults.value.find(r => r.model === model)
  if (!result) return
  
  const suggestion = result.suggestions[index]
  if (!suggestion) return
  
  // 状态轮换顺序：pending -> accepted -> rejected -> modified -> pending
  const currentStatus = suggestion.status || 'pending'
  switch (currentStatus) {
    case 'pending':
      suggestion.status = 'accepted'
      break
    case 'accepted':
      suggestion.status = 'rejected'
      break
    case 'rejected':
      suggestion.status = 'modified'
      // 当切换到修改采纳状态时，打开输入框让用户输入修改内容
      setTimeout(() => {
        const inputEl = document.getElementById(`model-modification-input-${model}-${index}`)
        if (inputEl) {
          (inputEl as HTMLInputElement).focus()
        }
      }, 100)
      break
    case 'modified':
      suggestion.status = 'pending'
      // 重置修改内容
      suggestion.modification = undefined
      break
  }
}

// 处理模型修改内容输入
const handleModelModificationInput = (model: string, index: number, value: string) => {
  const result = modelReviewResults.value.find(r => r.model === model)
  if (!result) return
  const suggestion = result.suggestions[index]
  if (!suggestion) return
  suggestion.modification = value
}

// 专家签名相关
const expertSignatureDialogVisible = ref(false)
const expertInfo = reactive({
  name: '',
  title: '',
  signature: ''
})
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const isExpertSigned = ref(false)

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

// 签名管理相关
const signatureMode = ref<'draw' | 'select'>('draw')
const availableSignatures = ref<Signature[]>([
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
const selectedSignatureId = ref<string>('')

// 监听全局签名状态变化
const handleSignatureChange = (signature: Signature | null) => {
  if (signature) {
    selectedSignatureId.value = signature.id
    expertInfo.signature = signature.url
  }
}

// 添加监听器
globalSignatureState.addListener(handleSignatureChange)

// 打开专家签名对话框
const openExpertSignatureDialog = () => {
  expertSignatureDialogVisible.value = true
  // 初始化签名画布
  setTimeout(() => {
    if (signatureCanvas.value) {
      const canvas = signatureCanvas.value
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 设置画笔样式
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#000'
        
        // 鼠标事件处理
        let isDrawing = false
        let lastX = 0
        let lastY = 0
        
        const startDrawing = (e: MouseEvent) => {
          isDrawing = true
          const rect = canvas.getBoundingClientRect()
          lastX = e.clientX - rect.left
          lastY = e.clientY - rect.top
        }
        
        const draw = (e: MouseEvent) => {
          if (!isDrawing) return
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          
          ctx.beginPath()
          ctx.moveTo(lastX, lastY)
          ctx.lineTo(x, y)
          ctx.stroke()
          
          lastX = x
          lastY = y
        }
        
        const stopDrawing = () => {
          isDrawing = false
        }
        
        // 添加事件监听器
        canvas.addEventListener('mousedown', startDrawing)
        canvas.addEventListener('mousemove', draw)
        canvas.addEventListener('mouseup', stopDrawing)
        canvas.addEventListener('mouseout', stopDrawing)
      }
    }
  }, 100)
}

// 清除签名
const clearSignature = () => {
  if (signatureCanvas.value) {
    const canvas = signatureCanvas.value
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

// 保存签名
const saveSignature = () => {
  if (signatureCanvas.value) {
    expertInfo.signature = signatureCanvas.value.toDataURL('image/png')
    ElMessage.success('签名已保存')
  }
}

// 处理签名模式切换
const handleSignatureModeChange = () => {
  if (signatureMode.value === 'draw') {
    // 切换到手绘模式时初始化画布
    setTimeout(() => {
      if (signatureCanvas.value) {
        const canvas = signatureCanvas.value
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // 设置画笔样式
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.strokeStyle = '#000'
        }
      }
    }, 100)
  }
}

// 选择已有签名
const selectExistingSignature = (signature: Signature) => {
  selectedSignatureId.value = signature.id
  expertInfo.signature = signature.url
  ElMessage.success('已选择签名')
}

// 导航到签名管理页面
const navigateToSignatureManagement = () => {
  expertSignatureDialogVisible.value = false
  router.push('/expert-signature')
}

// 确认签名
const confirmSignature = () => {
  if (!expertInfo.name || !expertInfo.title) {
    ElMessage.error('请填写专家姓名和职称')
    return
  }
  if (!expertInfo.signature) {
    ElMessage.error('请完成签名')
    return
  }
  
  isExpertSigned.value = true
  expertSignatureDialogVisible.value = false
  ElMessage.success('专家签名已确认')
}

// 审查版本管理
const reviewVersions = ref<{[key: string]: number}>({})

// 生成审查意见文档
const generateReviewDocument = () => {
  if (!finalReviewResult.value) return null
  
  // 收集被采纳的修改意见
  const acceptedSuggestions = finalReviewResult.value.suggestions.filter(s => 
    s.status === 'accepted' || s.status === 'modified'
  )
  
  // 生成审查意见内容
  let documentContent = `# 施工方案审查意见\n\n`
  documentContent += `## 审查信息\n`
  documentContent += `审查日期: ${new Date().toLocaleDateString()}\n`
  documentContent += `审查类型: ${isExpertSigned.value ? '专家审查' : 'AI审查'}\n`
  if (isExpertSigned.value) {
    documentContent += `审查专家: ${expertInfo.name} (${expertInfo.title})\n`
  }
  documentContent += `\n`
  
  documentContent += `## 审查意见\n`
  documentContent += `${finalReviewResult.value.opinion}\n\n`
  
  documentContent += `## 采纳的修改建议\n`
  if (acceptedSuggestions.length === 0) {
    documentContent += `无\n`
  } else {
    acceptedSuggestions.forEach((suggestion, index) => {
      documentContent += `### 问题 ${index + 1}: ${suggestion.issue}\n`
      documentContent += `**修改建议:** ${suggestion.status === 'modified' && suggestion.modification ? suggestion.modification : suggestion.suggestion}\n`
      documentContent += `**依据标准:** ${suggestion.standard}\n`
      documentContent += `**风险等级:** ${suggestion.riskLevel}\n`
      documentContent += `**处理状态:** ${suggestion.status === 'accepted' ? '采纳' : '修改采纳'}\n\n`
    })
  }
  
  documentContent += `## 审查要点\n`
  finalReviewResult.value.highlights.forEach(highlight => {
    documentContent += `- ${highlight}\n`
  })
  
  return documentContent
}

// 生成PDF文件
const generatePDF = (_content: string, fileName: string) => {
  // 模拟PDF生成
  ElMessage.info(`正在生成PDF文件: ${fileName}`)
  setTimeout(() => {
    ElMessage.success(`PDF文件生成成功: ${fileName}`)
  }, 1000)
}

// 确认审查
const confirmReview = () => {
  if (!finalReviewResult.value) {
    ElMessage.error('请先完成智能汇审')
    return
  }
  
  // 生成审查意见文档
  const documentContent = generateReviewDocument()
  if (!documentContent) {
    ElMessage.error('生成审查意见文档失败')
    return
  }
  
  // 生成文件名
  const planName = planForm.projectSummary ? planForm.projectSummary.substring(0, 20) : '未命名方案'
  const today = new Date().toISOString().split('T')[0]
  
  // 版本管理
  const key = `${planName}_${today}`
  if (!reviewVersions.value[key]) {
    reviewVersions.value[key] = 1
  } else {
    reviewVersions.value[key] += 1
  }
  const version = reviewVersions.value[key]
  
  const fileName = `${planName}审查意见版本V${version}_${today}.pdf`
  
  // 生成PDF
  generatePDF(documentContent, fileName)
  
  ElMessage.success('审查已确认，审查意见文档已生成')
  // 这里可以添加确认后的处理逻辑
}

// 约束主题来源相关方法
const handleSourceTabClick = (tab: any) => {
  activeSourceTab.value = tab.props.name
}

const searchSpecs = () => {
  console.log('搜索规范标准:', specSearchKeyword.value)
  // 这里可以添加实际的搜索逻辑
  ElMessage.success('规范标准搜索功能已触发')
}

const searchLaws = () => {
  console.log('搜索法律法规:', lawSearchKeyword.value)
  // 这里可以添加实际的搜索逻辑
  ElMessage.success('法律法规搜索功能已触发')
}

const searchKnowledge = () => {
  console.log('搜索工程知识:', knowledgeSearchKeyword.value)
  // 这里可以添加实际的搜索逻辑
  ElMessage.success('工程知识搜索功能已触发')
}

const addSpecsToConstraint = () => {
  if (selectedSpecs.value.length === 0) {
    ElMessage.error('请选择规范标准')
    return
  }
  
  // 为选中的规范标准添加到约束清单
  selectedSpecs.value.forEach(specId => {
    const spec = specs.value.find(s => s.id === specId)
    if (spec) {
      // 检查约束清单中是否已存在
      const existingItem = constraintList.value.find(item => item.id === specId)
      if (!existingItem) {
        constraintList.value.push({
          id: specId,
          name: spec.name,
          code: spec.code,
          type: '规范标准'
        })
        
        // 同时添加到约束项目列表，确保数据完整性
        const existingConstraintItem = constraintItems.value.find(item => item.id === specId)
        if (!existingConstraintItem) {
          constraintItems.value.push({
            id: specId,
            name: spec.name,
            code: spec.code,
            type: '规范标准'
          })
        }
      }
    }
  })
  
  ElMessage.success('规范标准已添加到约束清单')
  selectedSpecs.value = []
}

const addLawsToConstraint = () => {
  if (selectedLaws.value.length === 0) {
    ElMessage.error('请选择法律法规')
    return
  }
  
  // 为选中的法律法规添加到约束清单
  selectedLaws.value.forEach(lawId => {
    const law = laws.value.find(l => l.id === lawId)
    if (law) {
      // 检查约束清单中是否已存在
      const existingItem = constraintList.value.find(item => item.id === lawId)
      if (!existingItem) {
        constraintList.value.push({
          id: lawId,
          name: law.name,
          type: '法律法规'
        })
        
        // 同时添加到约束项目列表，确保数据完整性
        const existingConstraintItem = constraintItems.value.find(item => item.id === lawId)
        if (!existingConstraintItem) {
          constraintItems.value.push({
            id: lawId,
            name: law.name,
            type: '法律法规'
          })
        }
      }
    }
  })
  
  ElMessage.success('法律法规已添加到约束清单')
  selectedLaws.value = []
}

const addKnowledgeToConstraint = () => {
  if (selectedKnowledge.value.length === 0) {
    ElMessage.error('请选择工程知识')
    return
  }
  
  // 为选中的工程知识添加到约束清单
  selectedKnowledge.value.forEach(knowledgeId => {
    const knowledge = knowledgeItems.value.find(k => k.id === knowledgeId)
    if (knowledge) {
      // 检查约束清单中是否已存在
      const existingItem = constraintList.value.find(item => item.id === knowledgeId)
      if (!existingItem) {
        constraintList.value.push({
          id: knowledgeId,
          name: knowledge.name,
          type: '工程知识'
        })
        
        // 同时添加到约束项目列表，确保数据完整性
        const existingConstraintItem = constraintItems.value.find(item => item.id === knowledgeId)
        if (!existingConstraintItem) {
          constraintItems.value.push({
            id: knowledgeId,
            name: knowledge.name,
            type: '工程知识'
          })
        }
      }
    }
  })
  
  ElMessage.success('工程知识已添加到约束清单')
  selectedKnowledge.value = []
}

const handleLocalFileChange = (file: any) => {
  console.log('本地文件上传', file)
  
  // 重置错误信息
  localFileUploadError.value = ''
  
  // 验证文件类型
  const allowedTypes = ['.pdf', '.docx', '.xlsx']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(fileExtension)) {
    localFileUploadError.value = '只支持上传 PDF、DOCX、XLSX 格式的文件'
    return
  }
  
  // 验证文件大小（50MB）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    localFileUploadError.value = '单个文件大小不能超过 50MB'
    return
  }
  
  // 验证文件数量
  if (localUploadedFiles.value.length >= 3) {
    localFileUploadError.value = '最多只能上传 3 个文件'
    return
  }
  
  // 检查文件是否已存在
  const existingFile = localUploadedFiles.value.find(f => f.name === file.name)
  if (existingFile) {
    localFileUploadError.value = '该文件已上传'
    return
  }
  
  // 添加文件到上传列表
  localUploadedFiles.value.push(file)
  console.log('文件上传成功:', file.name)
}

const handleLocalFileRemove = (file: any, index?: number) => {
  console.log('移除本地文件', file)
  if (index !== undefined) {
    localUploadedFiles.value.splice(index, 1)
  } else {
    localUploadedFiles.value = localUploadedFiles.value.filter(f => f.uid !== file.uid)
  }
  console.log('文件移除成功:', file.name)
}

const addLocalFilesToConstraint = () => {
  if (localUploadedFiles.value.length === 0) {
    ElMessage.error('请上传本地文件')
    return
  }
  
  if (!localFileCategory.value) {
    ElMessage.error('请选择文件类别')
    return
  }
  
  if (localFileCategory.value === 'custom' && !customCategoryName.value) {
    ElMessage.error('请输入自定义类型名称')
    return
  }
  
  // 为上传的本地文件添加到约束清单
  localUploadedFiles.value.forEach(file => {
    const fileId = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    let type = '规范标准'
    if (localFileCategory.value === 'law') {
      type = '法律法规'
    } else if (localFileCategory.value === 'knowledge') {
      type = '工程知识'
    } else if (localFileCategory.value === 'custom') {
      type = customCategoryName.value
    }
    
    // 添加到约束清单
    constraintList.value.push({
      id: fileId,
      name: file.name,
      type: type
    })
    
    // 同时添加到约束项目列表，确保数据完整性
    constraintItems.value.push({
      id: fileId,
      name: file.name,
      type: type
    })
  })
  
  ElMessage.success('本地文件已添加到约束清单')
  localUploadedFiles.value = []
  localFileCategory.value = 'spec'
  customCategoryName.value = ''
  
  // 触发数据同步
  syncDataToKnowledgeBase()
}

// 编辑模式下添加规范标准到约束清单
const addSpecsToEditConstraint = () => {
  if (selectedSpecs.value.length === 0) {
    ElMessage.error('请选择规范标准')
    return
  }
  
  // 为选中的规范标准添加到约束清单
  selectedSpecs.value.forEach(specId => {
    const spec = specs.value.find(s => s.id === specId)
    if (spec) {
      // 检查约束清单中是否已存在
      const existingItem = editConstraintList.value.find(item => item.id === specId)
      if (!existingItem) {
        editConstraintList.value.push({
          id: specId,
          name: spec.name,
          code: spec.code,
          type: '规范标准'
        })
        
        // 同时添加到约束项目列表，确保数据完整性
        const existingConstraintItem = constraintItems.value.find(item => item.id === specId)
        if (!existingConstraintItem) {
          constraintItems.value.push({
            id: specId,
            name: spec.name,
            code: spec.code,
            type: '规范标准'
          })
        }
      }
    }
  })
  
  ElMessage.success('规范标准已添加到约束清单')
  selectedSpecs.value = []
}

// 编辑模式下添加法律法规到约束清单
const addLawsToEditConstraint = () => {
  if (selectedLaws.value.length === 0) {
    ElMessage.error('请选择法律法规')
    return
  }
  
  // 为选中的法律法规添加到约束清单
  selectedLaws.value.forEach(lawId => {
    const law = laws.value.find(l => l.id === lawId)
    if (law) {
      // 检查约束清单中是否已存在
      const existingItem = editConstraintList.value.find(item => item.id === lawId)
      if (!existingItem) {
        editConstraintList.value.push({
          id: lawId,
          name: law.name,
          type: '法律法规'
        })
        
        // 同时添加到约束项目列表，确保数据完整性
        const existingConstraintItem = constraintItems.value.find(item => item.id === lawId)
        if (!existingConstraintItem) {
          constraintItems.value.push({
            id: lawId,
            name: law.name,
            type: '法律法规'
          })
        }
      }
    }
  })
  
  ElMessage.success('法律法规已添加到约束清单')
  selectedLaws.value = []
}

// 编辑模式下添加工程知识到约束清单
const addKnowledgeToEditConstraint = () => {
  if (selectedKnowledge.value.length === 0) {
    ElMessage.error('请选择工程知识')
    return
  }
  
  // 为选中的工程知识添加到约束清单
  selectedKnowledge.value.forEach(knowledgeId => {
    const knowledge = knowledgeItems.value.find(k => k.id === knowledgeId)
    if (knowledge) {
      // 检查约束清单中是否已存在
      const existingItem = editConstraintList.value.find(item => item.id === knowledgeId)
      if (!existingItem) {
        editConstraintList.value.push({
          id: knowledgeId,
          name: knowledge.name,
          type: '工程知识'
        })
        
        // 同时添加到约束项目列表，确保数据完整性
        const existingConstraintItem = constraintItems.value.find(item => item.id === knowledgeId)
        if (!existingConstraintItem) {
          constraintItems.value.push({
            id: knowledgeId,
            name: knowledge.name,
            type: '工程知识'
          })
        }
      }
    }
  })
  
  ElMessage.success('工程知识已添加到约束清单')
  selectedKnowledge.value = []
}

// 编辑模式下添加本地文件到约束清单
const addLocalFilesToEditConstraint = () => {
  if (localUploadedFiles.value.length === 0) {
    ElMessage.error('请上传本地文件')
    return
  }
  
  if (!localFileCategory.value) {
    ElMessage.error('请选择文件类别')
    return
  }
  
  if (localFileCategory.value === 'custom' && !customCategoryName.value) {
    ElMessage.error('请输入自定义类型名称')
    return
  }
  
  // 为上传的本地文件添加到约束清单
  localUploadedFiles.value.forEach(file => {
    const fileId = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    let type = '规范标准'
    if (localFileCategory.value === 'law') {
      type = '法律法规'
    } else if (localFileCategory.value === 'knowledge') {
      type = '工程知识'
    } else if (localFileCategory.value === 'custom') {
      type = customCategoryName.value
    }
    
    // 添加到约束清单
    editConstraintList.value.push({
      id: fileId,
      name: file.name,
      type: type
    })
    
    // 同时添加到约束项目列表，确保数据完整性
    constraintItems.value.push({
      id: fileId,
      name: file.name,
      type: type
    })
  })
  
  ElMessage.success('本地文件已添加到约束清单')
  localUploadedFiles.value = []
  localFileCategory.value = 'spec'
  customCategoryName.value = ''
  
  // 触发数据同步
  syncDataToKnowledgeBase()
}

// 数据同步相关方法
const syncDataToKnowledgeBase = async () => {
  syncStatus.value = 'syncing'
  syncProgress.value = 0
  
  try {
    // 模拟同步过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      syncProgress.value = i
    }
    
    syncStatus.value = 'success'
    lastSyncTime.value = new Date().toLocaleString()
    
    // 更新版本信息
    updateVersionHistory('添加了新的约束主题或项目')
    
    ElMessage.success('数据同步成功')
  } catch (error) {
    syncStatus.value = 'error'
    ElMessage.error('数据同步失败，请重试')
  } finally {
    // 3秒后恢复 idle 状态
    setTimeout(() => {
      syncStatus.value = 'idle'
    }, 3000)
  }
}

const updateVersionHistory = (changes: string) => {
  const versionParts = currentVersion.value.split('.')
  const newVersion = `v${versionParts[0]}.${versionParts[1]}.${parseInt(versionParts[2] || '0') + 1}`
  currentVersion.value = newVersion
  
  versionHistory.value.unshift({
    version: newVersion,
    timestamp: new Date().toLocaleString(),
    changes: changes,
    author: '系统'
  })
  
  // 只保留最近10个版本
  if (versionHistory.value.length > 10) {
    versionHistory.value = versionHistory.value.slice(0, 10)
  }
}

const handleAutoSync = (enabled: boolean) => {
  if (enabled) {
    ElMessage.success('自动同步已开启')
    // 这里可以添加自动同步的逻辑，比如定时同步
  } else {
    ElMessage.info('自动同步已关闭')
  }
}

const rollbackToVersion = (version: string) => {
  ElMessageBox.confirm(`确定要回滚到版本 ${version} 吗？这将覆盖当前的约束主题数据。`, '版本回滚', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success(`已回滚到版本 ${version}`)
    // 这里可以添加实际的回滚逻辑
  }).catch(() => {
    // 取消回滚
  })
}

// 智能问答相关方法

// 加载知识主题文档到RAG库
const loadKnowledgeBaseToRAG = () => {
  // 模拟加载知识主题文档到RAG库的过程
  console.log('正在加载知识主题文档到RAG库...')
  // 实际项目中，这里应该调用后端API来加载文档到RAG库
  // 例如：return api.loadKnowledgeBaseToRAG(loadedConstraintThemes.value)
  return Promise.resolve('知识主题文档加载到RAG库成功')
}

// 执行网络检索
const performWebSearch = (_query: string, _themeIds: string[]) => {
  // 模拟网络检索过程
  console.log('正在执行网络检索...')
  // 实际项目中，这里应该调用后端API来执行网络检索
  // 例如：return api.performWebSearch(query, themeIds)
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
      await performWebSearch(tempInput, constraintThemeForm.themeIds)
      if (hasPrompt) {
        content = `根据约束主题的内容和网络检索结果，${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...\n\n网络检索补充：...`
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
        content = `根据约束主题的内容，${tempInput}的相关规定如下：\n\n1. 建筑设计防火规范 (GB 50016-2014) 中规定...\n2. 混凝土结构设计规范 (GB 50010-2010) 中规定...\n3. 建筑抗震设计规范 (GB 50011-2010) 中规定...`
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
</script>

<style lang="scss" scoped>
.plan-review-view {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 左侧约束主题管理 */
.constraint-theme-sidebar {
  width: 300px;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #ffffff;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .constraint-theme-header {
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .constraint-theme-tree {
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
  
  /* 约束项目来源 */
  .source-content {
    margin-top: 16px;
    
    .upload-source {
      margin-bottom: 12px;
    }
    
    .upload-error {
      color: #f56c6c;
      font-size: 12px;
      margin-top: 8px;
      margin-bottom: 12px;
    }
  }
  
  /* 约束清单样式 */
  .constraint-list {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 16px;
    min-height: 120px;
    background-color: #f9fafc;
    
    .empty-list {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #909399;
      font-size: 14px;
      
      .el-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
    }
    
    .list-table {
      .el-table {
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        overflow: hidden;
      }
    }
  }
  
  /* 智能问答模块 */
  .intelligent-qa-module {
    margin-bottom: 20px;
  }

  /* 智能问答界面 */
  .qa-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 500px;
    height: auto;

    /* 模型和模式选择 */
    .qa-header {
      padding: 12px 0;
      border-bottom: 1px solid #e4e7ed;
      margin-bottom: 16px;

      .model-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    /* 对话历史 */
    .chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;
      border-bottom: 1px solid #e4e7ed;
      margin-bottom: 16px;

      .conversation-history-container {
        width: 100%;
      }

      .message-item {
        margin-bottom: 16px;
        width: 100%;
        
        &.user-message {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        &.ai-message {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: #909399;
        width: 100%;
        max-width: 80%;
        
        .user-message & {
          justify-content: flex-end;
        }
        
        .ai-message & {
          justify-content: flex-start;
        }
        
        .message-role {
          font-weight: 500;
        }
        
        .message-header-right {
          display: flex;
          align-items: center;
        }
        
        .message-time {
          margin-right: 8px;
        }
      }

      .message-content {
        padding: 12px;
        border-radius: 4px;
        line-height: 1.6;
        width: 100%;
        max-width: 80%;
        
        .user-message & {
          background-color: #ecf5ff;
          color: #409EFF;
          border-top-right-radius: 0;
        }
        
        .ai-message & {
          background-color: #f5f7fa;
          color: #606266;
          border-top-left-radius: 0;
        }
      }

      .message-references {
        margin-top: 8px;
        font-size: 12px;
        color: #909399;
        width: 100%;
        max-width: 80%;
        
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
      padding: 0;
      min-height: 150px;
      box-sizing: border-box;

      .prompt-selector {
        margin-bottom: 12px;
      }

      .input-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
    }
  }

  /* 提示词库样式 */
  .add-prompt {
    padding-left: 30px;
  }
  
  .list-items {
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      background-color: #ffffff;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .item-info {
        flex: 1;
        
        .item-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .item-type {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .el-button {
        margin-left: 12px;
      }
    }
  }
  
  /* 审查进度样式 */
  .review-progress {
    margin-bottom: 20px;
    
    .model-status-list {
      margin-top: 16px;
      
      .model-status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .model-name {
          font-weight: 500;
        }
      }
    }
  }
  
  /* 多模型审查结果样式 */
  .multi-model-results {
    margin-bottom: 24px;
    
    h4 {
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .model-review-content {
      padding: 16px;
      background-color: #f9fafc;
      border-radius: 4px;
      
      .model-opinion {
        margin-bottom: 16px;
        
        p {
          margin-top: 8px;
          line-height: 1.6;
        }
      }
      
      .model-suggestions {
        margin-bottom: 16px;
        
        .el-collapse {
          margin-top: 8px;
        }
      }
      
      .model-timestamp {
        font-size: 12px;
        color: #909399;
        margin-top: 12px;
      }
    }
  }
  
  /* 智能汇审样式 */
  .intelligent-assembly {
    
    h4 {
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .assembly-content {
      
      .assembly-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background-color: #f9fafc;
        border-radius: 4px;
        
        .info-icon {
          font-size: 16px;
          color: #409EFF;
          cursor: help;
        }
      }
      
      .final-review-result {
        padding: 16px;
        background-color: #f9fafc;
        border-radius: 4px;
        
        .final-opinion {
          margin-bottom: 16px;
          
          p {
            margin-top: 8px;
            line-height: 1.6;
          }
        }
        
        .final-suggestions {
          margin-bottom: 16px;
          
          .el-collapse {
            margin-top: 8px;
          }
          
          .suggestion-content {
            .suggestion-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
              
              p {
                flex: 1;
                margin: 0;
              }
              
              .suggestion-status {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                
                &:hover {
                  transform: scale(1.05);
                }
                
                &.pending {
                  background-color: #e6f7ff;
                  color: #1890ff;
                  border: 1px solid #91d5ff;
                }
                
                &.accepted {
                  background-color: #f6ffed;
                  color: #52c41a;
                  border: 1px solid #b7eb8f;
                }
                
                &.rejected {
                  background-color: #fff2f0;
                  color: #ff4d4f;
                  border: 1px solid #ffccc7;
                }
                
                &.modified {
                  background-color: #fffbe6;
                  color: #faad14;
                  border: 1px solid #ffe58f;
                }
              }
            }
            
            .suggestion-models {
              margin-top: 8px;
            }
            
            .modification-input {
              margin-top: 12px;
              padding: 12px;
              background-color: #ffffff;
              border-radius: 4px;
              border: 1px solid #e4e7ed;
              
              p {
                margin: 0 0 8px 0;
              }
              
              .el-input {
                width: 100%;
              }
            }
          }
        }
        
        .final-highlights {
          margin-bottom: 16px;
          
          .highlights-tags {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
          }
        }
        
        .final-actions {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      }
    }
  }
  
  /* 上传操作样式 */
  .upload-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

/* 右侧主界面 */

/* 右侧主界面 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 0 20px 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  height: auto;

  /* 约束主题书架 */
  .constraint-theme-shelf {
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

      .theme-book {
        width: 180px;
        height: 240px;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        display: flex;
        flex-direction: column;
        background: linear-gradient(to right, #ffffff, #f8f9fa);
        border-radius: 4px 8px 8px 4px;
        box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
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

        .book-items {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #e4e7ed;
          font-size: 11px;

          .items-title {
            font-size: 11px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 6px;
          }

          .items-list {
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

  /* 约束主题选择 */
  .constraint-theme-select {
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

  .constraint-theme-form {
    width: 100%;
  }

  /* 方案上传 */
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

  /* 文件上传样式 */
  .file-list {
    margin-top: 16px;
    
    .file-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      margin-bottom: 12px;
      background-color: #f9f9f9;
      
      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        
        .file-name {
          flex: 1;
          font-weight: 500;
          color: #303133;
        }
        
        .file-size {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .file-progress {
        margin: 8px 0;
        
        .el-progress {
          width: 100%;
        }
      }
      
      .file-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
    }
  }

  /* 审查结果 */
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

  /* 数据同步 */
  .data-sync {
    margin-bottom: 24px;
  }

  .data-sync h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 24px;
  }

  .sync-content {
    .sync-status {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      
      .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .status-label {
          font-size: 14px;
          color: #606266;
        }
        
        .version {
          font-weight: 500;
          color: #409EFF;
        }
        
        .last-sync {
          color: #606266;
        }
      }
    }

    .sync-progress {
      margin-bottom: 20px;
    }

    .sync-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .version-history {
      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }
      
      .el-table {
        font-size: 13px;
        
        .el-table__row:hover {
          background-color: #f5f7fa;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .constraint-theme-sidebar {
    width: 250px;
  }

  .main-content {
    padding: 16px;
  }

  .constraint-theme-shelf .shelf-container .theme-book,
  .constraint-theme-shelf .shelf-container .add-book {
    width: 150px;
    height: 200px;
  }
}

@media (max-width: 768px) {
  .plan-review-view {
    flex-direction: column;
  }

  .constraint-theme-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }

  .main-content {
    flex: 1;
  }

  .constraint-theme-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .constraint-theme-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
  /* 专家签名样式 */
  .signature-container {
    .signature-selection {
      margin-top: 16px;
      
      .el-radio-group {
        margin-bottom: 20px;
      }
      
      .signature-pad {
        canvas {
          cursor: crosshair;
        }
        
        .signature-actions {
          margin-top: 12px;
          display: flex;
          gap: 12px;
        }
      }
      
      .signature-library {
        .signature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          
          .signature-item {
            border: 2px solid #e4e7ed;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            
            &:hover {
              border-color: #409EFF;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            &.active {
              border-color: #409EFF;
              background-color: #ecf5ff;
              box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
            }
            
            .signature-image {
              width: 100%;
              height: 100px;
              object-fit: contain;
              background-color: #f9f9f9;
              border-radius: 4px;
              margin-bottom: 8px;
            }
            
            .signature-info {
              display: flex;
              flex-direction: column;
              gap: 4px;
              
              .signature-name {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
              }
              
              .signature-date {
                font-size: 12px;
                color: #909399;
              }
            }
          }
          
          .empty-signatures {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            background-color: #fafafa;
            border: 2px dashed #d9d9d9;
            border-radius: 8px;
            
            .empty-icon {
              font-size: 32px;
              color: #d9d9d9;
              margin-bottom: 12px;
            }
            
            p {
              font-size: 14px;
              color: #909399;
              margin: 0 0 16px 0;
            }
          }
        }
      }
    }
  }
</style>
