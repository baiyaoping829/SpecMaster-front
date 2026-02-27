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
                @change="handleThemeChange"
              >
                <el-option 
                  label="全部主题" 
                  value="all"
                  :style="{ width: 'auto' }"
                />
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
                  v-for="spec in filteredSpecs" 
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
                          size="small" 
                          type="success" 
                          @click="toggleExplanation(clause)"
                          class="explanation-btn"
                        >
                          <el-icon><Document /></el-icon>
                          {{ clause.showExplanation ? '隐藏说明' : '条文说明' }}
                        </el-button>
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
                        <el-button 
                          size="small" 
                          type="warning" 
                          @click="toggleComments(clause)"
                          class="comment-btn"
                        >
                          <el-icon><ChatLineRound /></el-icon>
                          {{ clause.showComments ? '隐藏批注' : '批注' }}
                        </el-button>
                      </div>
                      
                      <!-- 条文说明区域 -->
                      <div v-if="clause.showExplanation" class="clause-explanation">
                        <h4>条文说明</h4>
                        <div class="explanation-content">
                          {{ clause.explanation || '暂无条文说明' }}
                        </div>
                      </div>
                      
                      <!-- 翻译区域 -->
                      <div v-if="clause.isTranslated && clause.showTranslations" class="clause-translations">
                        <h4>翻译结果</h4>
                        <div class="translations-list">
                          <!-- qwen 翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.qwen.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">Qwen</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'qwen')"
                                :disabled="clause.translations.qwen.isAdopted"
                              >
                                {{ clause.translations.qwen.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <div class="translation-content">{{ clause.translations.qwen.content || '' }}</div>
                          </div>
                          
                          <!-- doubao 翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.doubao.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">Doubao</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'doubao')"
                                :disabled="clause.translations.doubao.isAdopted"
                              >
                                {{ clause.translations.doubao.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <div class="translation-content">{{ clause.translations.doubao.content || '' }}</div>
                          </div>
                          
                          <!-- deepseek 翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.deepseek.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">DeepSeek</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'deepseek')"
                                :disabled="clause.translations.deepseek.isAdopted"
                              >
                                {{ clause.translations.deepseek.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <div class="translation-content">{{ clause.translations.deepseek.content || '' }}</div>
                          </div>
                          
                          <!-- 人工翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.custom.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">人工翻译</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'custom')"
                                :disabled="clause.translations.custom.isAdopted"
                              >
                                {{ clause.translations.custom.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <el-input
                              v-model="clause.manualTranslation"
                              type="textarea"
                              placeholder="请输入人工翻译"
                              @input="updateManualTranslation(clause)"
                            />
                            <div class="translation-content">{{ clause.translations.custom.content || '' }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 公式区域 -->
                      <div v-if="clause.hasFormula" class="clause-formula">
                        <h4>公式</h4>
                        <div class="formula-content">
                          <!-- 渲染后的公式 -->
                          <div class="formula-rendered">
                            {{ clause.formula }}
                          </div>
                          <!-- LaTeX 源代码 -->
                          <div v-if="clause.latexCode" class="latex-code">
                            <div class="latex-code-header">
                              <span>LaTeX源代码</span>
                              <el-button 
                                size="small" 
                                @click="copyLatexCode(clause.latexCode)"
                              >
                                复制
                              </el-button>
                            </div>
                            <div class="latex-code-content">
                              ${{ clause.latexCode }}$
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 表格区域 -->
                      <div v-if="clause.hasTable && clause.table" class="clause-table">
                        <h4>表格</h4>
                        <el-table 
                          :data="clause.table.slice(1)" 
                          style="width: 100%"
                          border
                          :cell-style="{ textAlign: 'center' }"
                          :header-cell-style="{ textAlign: 'center' }"
                        >
                          <el-table-column 
                            v-for="(header, index) in clause.table[0]" 
                            :key="index" 
                            :label="header"
                          >
                            <template #default="scope">
                              {{ scope.row[index] }}
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                      
                      <!-- 图片区域 -->
                      <div v-if="clause.hasImage && clause.image" class="clause-image">
                        <h4>图片</h4>
                        <div class="image-content">
                          <img :src="clause.image" alt="条款图片" class="clause-image-item">
                        </div>
                        <div class="image-actions">
                          <el-button size="small" @click="copyImage(clause.image)">
                            复制图片
                          </el-button>
                          <el-button size="small" @click="zoomImage(clause.image)">
                            图片放大
                          </el-button>
                          <el-button size="small" @click="enhanceImage(clause)">
                            图片增强
                          </el-button>
                        </div>
                      </div>
                      
                      <!-- 引用区域 -->
                      <div v-if="clause.hasReferences && clause.references" class="clause-references">
                        <h4>引用规范</h4>
                        <div class="references-list">
                          <div 
                            v-for="(reference, index) in clause.references" 
                            :key="index"
                            class="reference-item"
                          >
                            <div class="reference-header" style="display: flex; justify-content: space-between; align-items: center;">
                              <div class="reference-info">
                                <span class="reference-spec">{{ reference.specName }} ({{ reference.specCode }})</span>
                                <span class="reference-clause">条款 {{ reference.clauseNumber }}</span>
                              </div>
                              <el-button 
                                size="small" 
                                type="primary" 
                                @click="linkToSpecData(reference)"
                                :disabled="reference.isLinked"
                                class="reference-link-btn"
                              >
                                {{ reference.isLinked ? '已链接' : '智能链接' }}
                              </el-button>
                            </div>
                            <div class="reference-content">{{ reference.clauseContent }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 批注区域 -->
                      <div v-if="clause.showComments" class="clause-comments">
                        <h4>用户批注</h4>
                        <!-- 添加批注 -->
                        <div class="add-comment">
                          <el-input
                            v-model="newCommentContent"
                            type="textarea"
                            placeholder="请输入批注内容"
                            :rows="3"
                          />
                          <div class="comment-actions">
                            <el-button 
                              size="small" 
                              type="primary" 
                              @click="addComment(clause)"
                              :disabled="!newCommentContent.trim()"
                            >
                              添加批注
                            </el-button>
                          </div>
                        </div>
                        
                        <!-- 批注列表 -->
                        <div class="comments-list" v-if="clause.comments && clause.comments.length > 0">
                          <div 
                            v-for="comment in clause.comments" 
                            :key="comment.id"
                            class="comment-item"
                          >
                            <!-- 编辑模式 -->
                            <div v-if="clause.editingComment && clause.editingComment.id === comment.id" class="comment-edit">
                              <el-input
                                v-model="clause.editingComment.content"
                                type="textarea"
                                :rows="3"
                              />
                              <div class="comment-edit-actions">
                                <el-button 
                                  size="small" 
                                  type="primary" 
                                  @click="saveComment(clause)"
                                >
                                  保存
                                </el-button>
                                <el-button 
                                  size="small" 
                                  @click="cancelEditComment(clause)"
                                >
                                  取消
                                </el-button>
                              </div>
                            </div>
                            <!-- 查看模式 -->
                            <div v-else class="comment-content">
                              <div class="comment-header">
                                <span class="comment-author">{{ comment.author }}</span>
                                <span class="comment-time">{{ comment.timestamp }}</span>
                              </div>
                              <div class="comment-text">{{ comment.content }}</div>
                              <div class="comment-actions">
                                <el-button 
                                  size="small" 
                                  @click="editComment(clause, comment)"
                                >
                                  编辑
                                </el-button>
                                <el-button 
                                  size="small" 
                                  type="danger" 
                                  @click="deleteComment(clause, comment.id)"
                                >
                                  删除
                                </el-button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-comments">
                          暂无批注，点击添加批注按钮开始添加
                        </div>
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
                          size="small" 
                          type="success" 
                          @click="toggleExplanation(clause)"
                          class="explanation-btn"
                        >
                          <el-icon><Document /></el-icon>
                          {{ clause.showExplanation ? '隐藏说明' : '条文说明' }}
                        </el-button>
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
                        <el-button 
                          size="small" 
                          type="warning" 
                          @click="toggleComments(clause)"
                          class="comment-btn"
                        >
                          <el-icon><ChatLineRound /></el-icon>
                          {{ clause.showComments ? '隐藏批注' : '批注' }}
                        </el-button>
                      </div>
                      
                      <!-- 条文说明区域 -->
                      <div v-if="clause.showExplanation" class="clause-explanation">
                        <h4>条文说明</h4>
                        <div class="explanation-content">
                          {{ clause.explanation || '暂无条文说明' }}
                        </div>
                      </div>
                      
                      <!-- 翻译区域 -->
                      <div v-if="clause.isTranslated && clause.showTranslations" class="clause-translations">
                        <h4>翻译结果</h4>
                        <div class="translations-list">
                          <!-- qwen 翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.qwen.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">Qwen</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'qwen')"
                                :disabled="clause.translations.qwen.isAdopted"
                              >
                                {{ clause.translations.qwen.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <div class="translation-content">{{ clause.translations.qwen.content || '' }}</div>
                          </div>
                          
                          <!-- doubao 翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.doubao.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">Doubao</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'doubao')"
                                :disabled="clause.translations.doubao.isAdopted"
                              >
                                {{ clause.translations.doubao.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <div class="translation-content">{{ clause.translations.doubao.content || '' }}</div>
                          </div>
                          
                          <!-- deepseek 翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.deepseek.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">DeepSeek</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'deepseek')"
                                :disabled="clause.translations.deepseek.isAdopted"
                              >
                                {{ clause.translations.deepseek.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <div class="translation-content">{{ clause.translations.deepseek.content || '' }}</div>
                          </div>
                          
                          <!-- 人工翻译 -->
                          <div class="translation-item" :class="{ 'adopted': clause.translations.custom.isAdopted }">
                            <div class="translation-header">
                              <span class="translation-model">人工翻译</span>
                              <el-button 
                                size="small" 
                                @click="adoptTranslation(clause, 'custom')"
                                :disabled="clause.translations.custom.isAdopted"
                              >
                                {{ clause.translations.custom.isAdopted ? '已采纳' : '采纳' }}
                              </el-button>
                            </div>
                            <el-input
                              v-model="clause.manualTranslation"
                              type="textarea"
                              placeholder="请输入人工翻译"
                              @input="updateManualTranslation(clause)"
                            />
                            <div class="translation-content">{{ clause.translations.custom.content || '' }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 公式区域 -->
                      <div v-if="clause.hasFormula" class="clause-formula">
                        <h4>公式</h4>
                        <div class="formula-content">
                          <!-- 渲染后的公式 -->
                          <div class="formula-rendered">
                            {{ clause.formula }}
                          </div>
                          <!-- LaTeX 源代码 -->
                          <div v-if="clause.latexCode" class="latex-code">
                            <div class="latex-code-header">
                              <span>LaTeX源代码</span>
                              <el-button 
                                size="small" 
                                @click="copyLatexCode(clause.latexCode)"
                              >
                                复制
                              </el-button>
                            </div>
                            <div class="latex-code-content">
                              ${{ clause.latexCode }}$
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 表格区域 -->
                      <div v-if="clause.hasTable && clause.table" class="clause-table">
                        <h4>表格</h4>
                        <el-table 
                          :data="clause.table.slice(1)" 
                          style="width: 100%"
                          border
                          :cell-style="{ textAlign: 'center' }"
                          :header-cell-style="{ textAlign: 'center' }"
                        >
                          <el-table-column 
                            v-for="(header, index) in clause.table[0]" 
                            :key="index" 
                            :label="header"
                          >
                            <template #default="scope">
                              {{ scope.row[index] }}
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                      
                      <!-- 图片区域 -->
                      <div v-if="clause.hasImage && clause.image" class="clause-image">
                        <h4>图片</h4>
                        <div class="image-content">
                          <img :src="clause.image" alt="条款图片" class="clause-image-item">
                        </div>
                        <div class="image-actions">
                          <el-button size="small" @click="copyImage(clause.image)">
                            复制图片
                          </el-button>
                          <el-button size="small" @click="zoomImage(clause.image)">
                            图片放大
                          </el-button>
                          <el-button size="small" @click="enhanceImage(clause)">
                            图片增强
                          </el-button>
                        </div>
                      </div>
                      
                      <!-- 引用区域 -->
                      <div v-if="clause.hasReferences && clause.references" class="clause-references">
                        <h4>引用规范</h4>
                        <div class="references-list">
                          <div 
                            v-for="(reference, index) in clause.references" 
                            :key="index"
                            class="reference-item"
                          >
                            <div class="reference-header" style="display: flex; justify-content: space-between; align-items: center;">
                              <div class="reference-info">
                                <span class="reference-spec">{{ reference.specName }} ({{ reference.specCode }})</span>
                                <span class="reference-clause">条款 {{ reference.clauseNumber }}</span>
                              </div>
                              <el-button 
                                size="small" 
                                type="primary" 
                                @click="linkToSpecData(reference)"
                                :disabled="reference.isLinked"
                                class="reference-link-btn"
                              >
                                {{ reference.isLinked ? '已链接' : '智能链接' }}
                              </el-button>
                            </div>
                            <div class="reference-content">{{ reference.clauseContent }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 批注区域 -->
                      <div v-if="clause.showComments" class="clause-comments">
                        <h4>用户批注</h4>
                        <!-- 添加批注 -->
                        <div class="add-comment">
                          <el-input
                            v-model="newCommentContent"
                            type="textarea"
                            placeholder="请输入批注内容"
                            :rows="3"
                          />
                          <div class="comment-actions">
                            <el-button 
                              size="small" 
                              type="primary" 
                              @click="addComment(clause)"
                              :disabled="!newCommentContent.trim()"
                            >
                              添加批注
                            </el-button>
                          </div>
                        </div>
                        
                        <!-- 批注列表 -->
                        <div class="comments-list" v-if="clause.comments && clause.comments.length > 0">
                          <div 
                            v-for="comment in clause.comments" 
                            :key="comment.id"
                            class="comment-item"
                          >
                            <!-- 编辑模式 -->
                            <div v-if="clause.editingComment && clause.editingComment.id === comment.id" class="comment-edit">
                              <el-input
                                v-model="clause.editingComment.content"
                                type="textarea"
                                :rows="3"
                              />
                              <div class="comment-edit-actions">
                                <el-button 
                                  size="small" 
                                  type="primary" 
                                  @click="saveComment(clause)"
                                >
                                  保存
                                </el-button>
                                <el-button 
                                  size="small" 
                                  @click="cancelEditComment(clause)"
                                >
                                  取消
                                </el-button>
                              </div>
                            </div>
                            <!-- 查看模式 -->
                            <div v-else class="comment-content">
                              <div class="comment-header">
                                <span class="comment-author">{{ comment.author }}</span>
                                <span class="comment-time">{{ comment.timestamp }}</span>
                              </div>
                              <div class="comment-text">{{ comment.content }}</div>
                              <div class="comment-actions">
                                <el-button 
                                  size="small" 
                                  @click="editComment(clause, comment)"
                                >
                                  编辑
                                </el-button>
                                <el-button 
                                  size="small" 
                                  type="danger" 
                                  @click="deleteComment(clause, comment.id)"
                                >
                                  删除
                                </el-button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-comments">
                          暂无批注，点击添加批注按钮开始添加
                        </div>
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
import { ArrowUp, ArrowDown, FolderAdd, Search, DataAnalysis, Connection, Star, StarFilled, User, Document, ChatLineRound } from '@element-plus/icons-vue'

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

// 计算属性根据选择的主题过滤规范
const filteredSpecs = computed(() => {
  const selectedThemeId = knowledgeBaseForm.knowledgeBaseId
  if (!selectedThemeId || selectedThemeId === 'all') {
    return specs.value
  }
  const selectedTheme = readerStore.getThemeById(selectedThemeId)
  if (selectedTheme && selectedTheme.specs) {
    return selectedTheme.specs
  }
  return []
})

// 处理主题变化
const handleThemeChange = () => {
  // 当主题变化时，清空已选择的规范
  knowledgeBaseForm.specIds = []
}

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

// 新批注内容
const newCommentContent = ref('')

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
  explanation?: string; // 条文说明
  showComments?: boolean; // 是否显示批注
  showTranslations?: boolean; // 是否显示翻译
  manualTranslation?: string; // 人工翻译
  // 编辑中的批注
  editingComment?: Comment | null;
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
        { id: '3.2.2', content: '3.2.2 混凝土结构的安全等级应按表3.2.2的规定划分。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations }, hasTable: true, table: [['安全等级', '破坏后果', '建筑物类型'], ['一级', '很严重', '重要的房屋'], ['二级', '严重', '一般的房屋'], ['三级', '不严重', '次要的房屋']] },
        // 带有公式的条款
        { id: '4.1.1', content: '4.1.1 混凝土轴心抗压强度设计值应按公式(4.1.1)计算。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations }, hasFormula: true, formula: 'f_c = f_ck / γ_c', latexCode: 'f_c = f_ck / \gamma_c' },
        // 带有图片的条款
        { id: '5.1.1', content: '5.1.1 钢筋的锚固长度应符合图5.1.1的规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 80, translations: { ...baseTranslations }, hasImage: true, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=reinforcement%20anchorage%20length%20diagram%20in%20concrete%20structure&image_size=landscape_16_9' },
        // 带有组合公式、表格和图片的条款
        { id: '6.1.1', content: '6.1.1 受弯构件的正截面承载力应按公式(6.1.1)计算，配筋率应符合表6.1.1的规定，构造要求应符合图6.1.1的要求。', isTranslated: false, level: 3, isFavorite: false, popularity: 90, translations: { ...baseTranslations }, hasFormula: true, formula: 'M ≤ f_y A_s (h_0 - x/2)', latexCode: 'M \leq f_y A_s (h_0 - x/2)', hasTable: true, table: [['构件类型', '最小配筋率(%)'], ['梁', '0.2'], ['板', '0.15']], hasImage: true, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=reinforced%20concrete%20beam%20cross%20section%20with%20reinforcement&image_size=landscape_16_9' },
        // 带有对其他规范引用的条款
        { id: '7.1.1', content: '7.1.1 混凝土结构的抗震设计应符合现行国家标准《建筑抗震设计规范》GB 50011的有关规定。', isTranslated: false, level: 3, isFavorite: false, popularity: 85, translations: { ...baseTranslations }, hasReferences: true, references: [{ specName: '建筑抗震设计规范', specCode: 'GB 50011', clauseNumber: '5.1.1', clauseContent: '建筑结构的抗震设计应符合本规范的规定。', isLinked: false, linkedSpecId: '3' }] }
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

// 切换条文说明显示状态
const toggleExplanation = (clause: Clause) => {
  clause.showExplanation = !clause.showExplanation;
  // 如果是第一次显示说明，生成模拟的条文说明
  if (clause.showExplanation && !clause.explanation) {
    clause.explanation = `本条款是${clause.content}的条文说明，详细解释了该条款的背景、适用范围和实施要点。`;
  }
};

// 翻译条款
const translateClause = (clause: Clause) => {
  // 检查是否已经有被采纳的翻译
  const hasAdoptedTranslation = Object.values(clause.translations).some(t => t.isAdopted && t.content);
  
  // 根据目标语言生成翻译结果
  const targetLanguage = readerOptions.translateLanguage;
  
  // 如果是首次翻译，生成新的翻译结果
  if (!clause.isTranslated || !hasAdoptedTranslation) {
    // 模拟多模型翻译过程
    console.log('翻译条款:', clause.id, clause.content);
    clause.isTranslated = true;
    clause.showTranslations = true;
    
    // 模拟 qwen 翻译
    if (targetLanguage === 'en') {
      clause.translations.qwen.content = `This is the Qwen translation of clause ${clause.id}`;
    } else {
      clause.translations.qwen.content = `这是条款 ${clause.id} 的 Qwen 翻译`;
    }
    
    // 模拟 doubao 翻译
    if (targetLanguage === 'en') {
      clause.translations.doubao.content = `This is the Doubao translation of clause ${clause.id}`;
    } else {
      clause.translations.doubao.content = `这是条款 ${clause.id} 的 Doubao 翻译`;
    }
    
    // 模拟 deepseek 翻译
    if (targetLanguage === 'en') {
      clause.translations.deepseek.content = `This is the DeepSeek translation of clause ${clause.id}`;
    } else {
      clause.translations.deepseek.content = `这是条款 ${clause.id} 的 DeepSeek 翻译`;
    }
  } else {
    // 已有被采纳的翻译，点击重新翻译时生成新的翻译结果
    console.log('重新翻译条款:', clause.id, clause.content);
    clause.showTranslations = true;
    
    // 模拟 qwen 翻译
    if (targetLanguage === 'en') {
      clause.translations.qwen.content = `This is the updated Qwen translation of clause ${clause.id}`;
    } else {
      clause.translations.qwen.content = `这是条款 ${clause.id} 的更新 Qwen 翻译`;
    }
    
    // 模拟 doubao 翻译
    if (targetLanguage === 'en') {
      clause.translations.doubao.content = `This is the updated Doubao translation of clause ${clause.id}`;
    } else {
      clause.translations.doubao.content = `这是条款 ${clause.id} 的更新 Doubao 翻译`;
    }
    
    // 模拟 deepseek 翻译
    if (targetLanguage === 'en') {
      clause.translations.deepseek.content = `This is the updated DeepSeek translation of clause ${clause.id}`;
    } else {
      clause.translations.deepseek.content = `这是条款 ${clause.id} 的更新 DeepSeek 翻译`;
    }
    
    // 重置所有翻译的采纳状态
    Object.keys(clause.translations).forEach(key => {
      clause.translations[key as TranslationModel].isAdopted = false;
    });
  }
};

// 采纳翻译
const adoptTranslation = (clause: Clause, model: TranslationModel) => {
  // 重置所有翻译的采纳状态
  Object.keys(clause.translations).forEach(key => {
    clause.translations[key as TranslationModel].isAdopted = false;
  });
  
  // 采纳选中的翻译
  clause.translations[model].isAdopted = true;
  
  // 保存被采纳的翻译到数据库（模拟）
  saveAdoptedTranslation(clause, model);
  
  // 清除其他翻译结果
  Object.keys(clause.translations).forEach(key => {
    const translationModel = key as TranslationModel;
    if (translationModel !== model) {
      clause.translations[translationModel].content = '';
    }
  });
  
  // 显示成功消息
  ElMessage.success(`已采纳 ${model === 'custom' ? '人工' : model} 翻译并保存到数据库`);
};

// 保存被采纳的翻译到数据库（模拟）
const saveAdoptedTranslation = (clause: Clause, model: TranslationModel) => {
  // 模拟保存到数据库的过程
  console.log('保存翻译到数据库:', {
    clauseId: clause.id,
    model: model,
    content: clause.translations[model].content
  });
  
  // 实际应用中，这里应该调用 API 将翻译结果保存到数据库
  // 例如：
  // await api.saveTranslation({ clauseId: clause.id, model: model, content: clause.translations[model].content });
};

// 复制 LaTeX 代码
const copyLatexCode = (latexCode: string) => {
  // 复制带 $ 符号的 LaTeX 代码到剪贴板
  const codeWithDollars = `$${latexCode}$`;
  navigator.clipboard.writeText(codeWithDollars).then(() => {
    ElMessage.success('LaTeX 代码已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
    ElMessage.error('复制失败，请手动复制');
  });
};

// 复制图片
const copyImage = (imageUrl: string) => {
  // 模拟复制图片功能
  console.log('复制图片:', imageUrl);
  ElMessage.success('图片已复制到剪贴板');
  
  // 实际应用中，这里可以使用 Canvas 或其他方法实现图片复制
  // 例如：
  // const img = new Image();
  // img.crossOrigin = 'anonymous';
  // img.onload = () => {
  //   const canvas = document.createElement('canvas');
  //   canvas.width = img.width;
  //   canvas.height = img.height;
  //   const ctx = canvas.getContext('2d');
  //   ctx.drawImage(img, 0, 0);
  //   canvas.toBlob(blob => {
  //     navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  //   });
  // };
  // img.src = imageUrl;
};

// 放大图片
const zoomImage = (imageUrl: string) => {
  // 模拟图片放大功能
  console.log('放大图片:', imageUrl);
  // 实际应用中，这里可以打开一个新窗口显示放大的图片
  window.open(imageUrl, '_blank', 'width=800,height=600');
  ElMessage.success('图片已放大显示');
};

// 增强图片
const enhanceImage = (clause: Clause) => {
  // 模拟图片增强功能
  console.log('增强图片:', clause.image);
  clause.isImageEnhanced = true;
  ElMessage.success('图片增强完成');
  
  // 实际应用中，这里可以调用多模态大模型 API 来增强图片
  // 例如：
  // const enhancedImage = await api.enhanceImage(clause.image);
  // clause.image = enhancedImage;
  // clause.isImageEnhanced = true;
};

// 智能链接功能
const linkToSpecData = (reference: SpecReference) => {
  // 模拟智能链接功能
  console.log('智能链接:', reference);
  reference.isLinked = true;
  
  // 将引用条款的信息添加到原规范的对应条款上，形成图谱
  const linkedInfo = `${reference.specName} (${reference.specCode}) 条款 ${reference.clauseNumber}: ${reference.clauseContent}`;
  console.log('添加到知识图谱:', linkedInfo);
  
  ElMessage.success('智能链接成功，已添加到知识图谱');
  
  // 实际应用中，这里可以调用 API 将链接关系保存到数据库
  // 例如：
  // await api.linkToSpecData(reference);
};

// 更新人工翻译
const updateManualTranslation = (clause: Clause) => {
  if (clause.manualTranslation) {
    clause.translations.custom.content = clause.manualTranslation;
  }
};

// 切换批注显示状态
const toggleComments = (clause: Clause) => {
  clause.showComments = !clause.showComments;
  // 初始化批注数组
  if (clause.showComments && !clause.comments) {
    clause.comments = [];
    clause.hasComments = false;
  }
};

// 添加批注
const addComment = (clause: Clause) => {
  if (!newCommentContent.value.trim()) return;
  
  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    content: newCommentContent.value.trim(),
    author: '当前用户', // 实际应用中应该从登录状态获取
    timestamp: new Date().toLocaleString()
  };
  
  if (!clause.comments) {
    clause.comments = [];
  }
  
  clause.comments.push(newComment);
  clause.hasComments = true;
  newCommentContent.value = '';
  
  ElMessage.success('批注添加成功');
};

// 编辑批注
const editComment = (clause: Clause, comment: Comment) => {
  // 复制批注对象，避免直接修改原始数据
  clause.editingComment = { ...comment };
};

// 保存编辑后的批注
const saveComment = (clause: Clause) => {
  if (!clause.editingComment) return;
  
  const commentIndex = clause.comments?.findIndex(c => c.id === clause.editingComment?.id);
  if (commentIndex !== undefined && commentIndex !== -1) {
    clause.comments![commentIndex] = {
      ...clause.editingComment,
      isEdited: true,
      lastEdited: new Date().toLocaleString()
    };
    ElMessage.success('批注编辑成功');
  }
  
  clause.editingComment = null;
};

// 取消编辑
const cancelEditComment = (clause: Clause) => {
  clause.editingComment = null;
};

// 删除批注
const deleteComment = (clause: Clause, commentId: string) => {
  if (!clause.comments) return;
  
  const commentIndex = clause.comments.findIndex(c => c.id === commentId);
  if (commentIndex !== -1) {
    clause.comments.splice(commentIndex, 1);
    clause.hasComments = clause.comments.length > 0;
    ElMessage.success('批注删除成功');
  }
};

// 搜索相似条款
const searchSimilarClauses = (clause: Clause) => {
  // 检查是否有多个条款被选择
  console.log('当前选中的条款数量:', selectedClauses.value.size);
  console.log('当前选中的条款ID:', Array.from(selectedClauses.value));
  
  if (selectedClauses.value.size > 1) {
    // 打开批量相似条款检索页面，包含所有选择的条款
    console.log('批量搜索相似条款:', Array.from(selectedClauses.value));
    try {
      // 构建包含所有选中条款内容的参数（只传递前5个条款，避免URL过长）
      const selectedClausesList = specContent.value
        .filter(c => selectedClauses.value.has(c.id))
        .slice(0, 5); // 限制数量，避免URL过长
      
      const clauseIds = selectedClausesList.map(c => c.id).join(',');
      const contents = selectedClausesList.map(c => encodeURIComponent(c.content)).join('|||');
      
      console.log('传递的条款ID:', clauseIds);
      console.log('传递的条款数量:', selectedClausesList.length);
      
      // 构建URL，使用与 SimilarClausesView 期望一致的参数名
      const url = `/similar-clauses?clauseId=${clauseIds}&content=${contents}`;
      window.open(url, '_blank', 'width=1200,height=800');
      
      // 显示提示信息
      ElMessage.success(`已为 ${selectedClausesList.length} 个选中条款启动相似条款检索`);
    } catch (error) {
      console.error('打开页面失败:', error);
      ElMessage.error('打开页面失败，请检查网络连接');
    }
  } else {
    // 只有当前条款被选择，打开单个条款的相似条款检索页面
    console.log('搜索相似条款:', clause.id, clause.content);
    try {
      // 构建URL，使用与 SimilarClausesView 期望一致的参数名
      const url = `/similar-clauses?clauseId=${clause.id}&content=${encodeURIComponent(clause.content)}`;
      window.open(url, '_blank', 'width=1200,height=800');
    } catch (error) {
      console.error('打开页面失败:', error);
      ElMessage.error('打开页面失败，请检查网络连接');
    }
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
    // 构建包含所有选中条款内容的参数（只传递前5个条款，避免URL过长）
    const selectedClausesList = specContent.value
      .filter(c => selectedClauses.value.has(c.id))
      .slice(0, 5); // 限制数量，避免URL过长
    
    const clauseIds = selectedClausesList.map(c => c.id).join(',');
    const contents = selectedClausesList.map(c => encodeURIComponent(c.content)).join('|||');
    
    // 构建URL，使用与 SimilarClausesView 期望一致的参数名
    const url = `/similar-clauses?clauseId=${clauseIds}&content=${contents}`;
    window.open(url, '_blank', 'width=1200,height=800');
    
    // 显示提示信息
    ElMessage.success(`已为 ${selectedClausesList.length} 个选中条款启动相似条款检索`);
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
  readerOptions.showTranslation = !readerOptions.showTranslation;
  
  if (readerOptions.showTranslation) {
    // 开启翻译时，对于已翻译的条款默认显示被采用的翻译结果
    specContent.value.forEach(clause => {
      if (clause.isTranslated) {
        // 检查是否有被采纳的翻译
        const hasAdoptedTranslation = Object.values(clause.translations).some(t => t.isAdopted && t.content);
        if (hasAdoptedTranslation) {
          clause.showTranslations = true;
        }
      }
    });
  } else {
    // 关闭翻译时，清除所有条款的翻译显示
    specContent.value.forEach(clause => {
      clause.showTranslations = false;
    });
  }
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
  width: 320px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 0 8px 8px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  color: white;
  border-radius: 0 8px 0 0;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
  color: white;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.sort-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: #f9f9f9;
}

/* 树形结构样式 */
.el-tree {
  --el-tree-node-hover-bg-color: rgba(64, 158, 255, 0.1);
  --el-tree-node-focus-bg-color: rgba(64, 158, 255, 0.2);
}

/* 主题节点样式 */
.el-tree-node__content {
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.el-tree-node__content:hover {
  background-color: rgba(64, 158, 255, 0.1);
  transform: translateX(4px);
}

/* 彩色主题 - 一级节点（主题） */
.el-tree-node:nth-child(odd) > .el-tree-node__content {
  background: linear-gradient(90deg, #e3f2fd 0%, #ffffff 100%);
  border-left: 4px solid #2196f3;
}

.el-tree-node:nth-child(even) > .el-tree-node__content {
  background: linear-gradient(90deg, #e8f5e8 0%, #ffffff 100%);
  border-left: 4px solid #4caf50;
}

/* 二级节点（规范） */
.el-tree-node .el-tree-node:nth-child(odd) > .el-tree-node__content {
  background: linear-gradient(90deg, #fff3e0 0%, #ffffff 100%);
  border-left: 4px solid #ff9800;
}

.el-tree-node .el-tree-node:nth-child(even) > .el-tree-node__content {
  background: linear-gradient(90deg, #f3e5f5 0%, #ffffff 100%);
  border-left: 4px solid #9c27b0;
}

/* 立体效果 */
.el-tree-node__content {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 4px;
}

.el-tree-node__content:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 层级节点之间的虚线连接 */
.el-tree-node__children {
  position: relative;
  padding-left: 20px;
}

.el-tree-node__children::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(to bottom, #e4e7ed 0px, #e4e7ed 4px, transparent 4px, transparent 8px);
  z-index: 0;
}

.el-tree-node__children .el-tree-node::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 20px;
  width: 20px;
  height: 2px;
  background: repeating-linear-gradient(to right, #e4e7ed 0px, #e4e7ed 4px, transparent 4px, transparent 8px);
  z-index: 0;
}

/* 树节点内容 */
.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: relative;
  z-index: 1;
}

.tree-node span:first-child {
  font-weight: 500;
  color: #303133;
  transition: all 0.3s ease;
}

.el-tree-node:hover .tree-node span:first-child {
  color: #409eff;
}

.spec-tag {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.no-themes {
  text-align: center;
  color: #909399;
  padding: 60px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin: 20px;
}

/* 滚动条样式 */
.tree-container::-webkit-scrollbar {
  width: 8px;
}

.tree-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tree-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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

/* 条文说明样式 */
.clause-explanation {
  margin-top: 16px;
  padding: 16px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
}

.clause-explanation h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #389e0d;
}

.explanation-content {
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
}

/* 翻译结果样式 */
.clause-translations {
  margin-top: 16px;
  padding: 16px;
  background-color: #f0f5ff;
  border: 1px solid #adc6ff;
  border-radius: 4px;
}

.clause-translations h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1890ff;
}

.translations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.translation-item {
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.translation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.translation-item.adopted {
  border-color: #52c41a;
  background-color: #f6ffed;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.translation-model {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.translation-content {
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  margin-top: 8px;
}

/* 人工翻译输入框 */
.el-input {
  margin-bottom: 8px;
}

/* 按钮样式 */
.explanation-btn {
  margin-right: 8px;
}

.translate-btn {
  margin-right: 8px;
}

.comment-btn {
  margin-right: 8px;
}

/* 批注区域样式 */
.clause-comments {
  margin-top: 16px;
  padding: 16px;
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
}

.clause-comments h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #d46b08;
}

/* 添加批注 */
.add-comment {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.comment-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

/* 批注列表 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.comment-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 批注内容 */
.comment-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.comment-author {
  font-weight: 500;
  color: #606266;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  margin: 8px 0;
}

/* 编辑模式 */
.comment-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 无批注提示 */
.no-comments {
  text-align: center;
  color: #909399;
  padding: 24px 0;
  background-color: #f9f9f9;
  border-radius: 4px;
}

/* 公式区域样式 */
.clause-formula {
  margin-top: 16px;
  padding: 16px;
  background-color: #f0f5ff;
  border: 1px solid #adc6ff;
  border-radius: 4px;
}

.clause-formula h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1890ff;
}

.formula-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.formula-rendered {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 4px;
  text-align: center;
}

.latex-code {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-family: monospace;
}

.latex-code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.latex-code-content {
  font-size: 14px;
  color: #303133;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

/* 表格区域样式 */
.clause-table {
  margin-top: 16px;
  padding: 16px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
}

.clause-table h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #389e0d;
}

/* 图片区域样式 */
.clause-image {
  margin-top: 16px;
  padding: 16px;
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
}

.clause-image h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #d46b08;
}

.image-content {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.clause-image-item {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

/* 引用区域样式 */
.clause-references {
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f0ff;
  border: 1px solid #d3adf7;
  border-radius: 4px;
}

.clause-references h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #722ed1;
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reference-item {
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.reference-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.reference-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reference-spec {
  font-weight: 500;
  color: #303133;
}

.reference-clause {
  font-size: 14px;
  color: #606266;
}

.reference-link-btn {
  margin-left: auto;
}

.reference-content {
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
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