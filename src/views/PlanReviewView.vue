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
          <h3>方案上传</h3>
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
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleFileRemove(file, index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
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
              <el-input v-model="newKeyword" placeholder="输入关键词后按回车" @keyup.enter="addKeyword" style="margin-top: 8px;" />
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

            <h4>修改建议</h4>
            <div class="review-suggestions">
              <el-collapse>
                <el-collapse-item v-for="(suggestion, index) in reviewSuggestions" :key="index" :title="`问题 ${index + 1}: ${suggestion.issue}`">
                  <div class="suggestion-content">
                    <p><strong>问题描述：</strong>{{ suggestion.issue }}</p>
                    <p><strong>修改建议：</strong>{{ suggestion.suggestion }}</p>
                    <p><strong>依据标准：</strong>{{ suggestion.standard }}</p>
                    <p><strong>风险等级：</strong>
                      <el-tag :type="getRiskLevelType(suggestion.riskLevel)">
                        {{ suggestion.riskLevel }}
                      </el-tag>
                    </p>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div class="review-actions">
              <el-button @click="downloadReport">下载审查报告</el-button>
              <el-button type="primary" @click="confirmReview">确认审查</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown, Edit, Delete, Plus, FolderAdd, InfoFilled, UploadFilled, Search, Refresh } from '@element-plus/icons-vue'

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

// 模拟数据
const reviewOpinion = ref(`根据约束主题和相关规范，对该施工方案进行了全面审查，发现以下问题：

1. 方案中对防火措施的描述不够详细，未明确防火等级和具体措施
2. 混凝土结构设计参数不符合规范要求，需要重新计算
3. 安全措施不全面，缺少应急预案
4. 施工进度安排不合理，可能影响整体工期

建议对以上问题进行修改后重新提交审查。`)

const reviewSuggestions = ref<ReviewSuggestion[]>([
  {
    issue: '防火措施描述不够详细',
    suggestion: '应明确防火等级，增加具体的防火措施和消防设施布置',
    standard: '建筑设计防火规范 (GB 50016-2014)',
    riskLevel: '高'
  },
  {
    issue: '混凝土结构设计参数不符合规范要求',
    suggestion: '根据混凝土结构设计规范 (GB 50010-2010) 重新计算结构参数',
    standard: '混凝土结构设计规范 (GB 50010-2010)',
    riskLevel: '高'
  },
  {
    issue: '安全措施不全面',
    suggestion: '增加详细的安全措施和应急预案',
    standard: '建筑施工安全检查标准 (JGJ59-2011)',
    riskLevel: '中'
  },
  {
    issue: '施工进度安排不合理',
    suggestion: '重新调整施工进度计划，确保各工序合理衔接',
    standard: '建设工程项目管理规范 (GB/T50326-2017)',
    riskLevel: '低'
  }
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
  
  // 添加文件到上传列表
  uploadedFiles.value.push(file)
  console.log('文件上传成功:', file.name)
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

const startReview = () => {
  console.log('开始审查', planForm)
  showReviewResult.value = true
}

const downloadReport = () => {
  console.log('下载审查报告')
}

const confirmReview = () => {
  console.log('确认审查')
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
  }
}

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
</style>