<template>
  <div class="accident-analysis">
    <div class="analysis-header">
      <h2>事故分析</h2>
      <div class="header-actions">
        <div class="accident-selector">
          <el-select v-model="selectedAccidentId" placeholder="选择事故案例" @change="loadAccidentDetail">
            <el-option 
              v-for="accident in accidents" 
              :key="accident.id" 
              :label="accident.name" 
              :value="accident.id" 
            />
          </el-select>
        </div>
        <el-switch 
          v-model="isEditMode" 
          active-text="编辑模式" 
          inactive-text="锁定模式" 
          @change="handleEditModeChange"
        />
      </div>
    </div>

    <div v-if="selectedAccident" class="analysis-content">
      <!-- 事故基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ selectedAccident.name }}</span>
            <span class="card-badge" :class="getLevelClass(selectedAccident.level)">{{ selectedAccident.level }}</span>
          </div>
        </template>
        <div class="info-grid">
          <div class="info-grid-item">
            <span class="info-grid-label">事故类型：</span>
            <span class="info-grid-value">{{ selectedAccident.type }}</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">事故日期：</span>
            <span class="info-grid-value">{{ selectedAccident.accidentDate }}</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">所属省份：</span>
            <span class="info-grid-value">{{ selectedAccident.province }}</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">人员伤亡：</span>
            <span class="info-grid-value">{{ selectedAccident.casualties }}</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">经济损失：</span>
            <span class="info-grid-value">{{ selectedAccident.economicLoss }}万元</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">责任单位：</span>
            <span class="info-grid-value">{{ selectedAccident.responsibleUnit }}</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">工程类型：</span>
            <span class="info-grid-value">{{ selectedAccident.projectType }}</span>
          </div>
          <div class="info-grid-item">
            <span class="info-grid-label">事故等级：</span>
            <span class="info-grid-value">{{ selectedAccident.level }}</span>
          </div>
        </div>
        <div class="accident-summary">
          <h3>事故概要</h3>
          <p>{{ selectedAccident.summary }}</p>
        </div>
      </el-card>

      <!-- 事故发展历程 -->
      <el-card class="timeline-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">事故发展历程</span>
            <div class="header-actions" v-if="isEditMode">
              <el-button type="primary" size="small" @click="addTimelineEvent">添加环节</el-button>
              <el-button type="success" size="small" @click="addMajorEvent">添加重大节点</el-button>
              <el-button type="info" size="small" @click="saveAllChanges">保存修改</el-button>
              <el-button type="warning" size="small" @click="refreshTimeline">刷新排序</el-button>
            </div>
          </div>
        </template>
        <div class="timeline-container">
          <!-- 批量编辑模式 -->
          <div v-if="isEditMode" class="batch-edit-mode">
            <div v-for="(event, index) in accidentTimeline" :key="index" :class="['event-edit-card', event.isMajor ? 'major-event-card' : '']">
              <div class="event-header">
                <div class="event-info">
                  <el-input v-model="event.title" placeholder="环节标题" class="event-title-input" />
                  <el-datetime-picker v-model="event.time" type="datetime" placeholder="选择时间" class="event-time-input" />
                  <el-checkbox v-model="event.isMajor" class="event-major-checkbox">重大节点</el-checkbox>
                </div>
                <div class="event-actions">
                  <el-select v-model="event.type" placeholder="类型" class="event-type-select">
                    <el-option label="危险" value="danger" />
                    <el-option label="警告" value="warning" />
                    <el-option label="信息" value="info" />
                    <el-option label="主要" value="primary" />
                    <el-option label="成功" value="success" />
                  </el-select>
                  <el-select v-model="event.icon" placeholder="图标" class="event-icon-select">
                    <el-option label="警告" value="el-icon-warning" />
                    <el-option label="旗帜" value="el-icon-s-flag" />
                    <el-option label="完成" value="el-icon-finished" />
                    <el-option label="搜索" value="el-icon-search" />
                    <el-option label="文档" value="el-icon-document" />
                  </el-select>
                  <el-button size="small" @click="addEventBefore(index)">在前面添加</el-button>
                  <el-button size="small" @click="addEventAfter(index)">在后面添加</el-button>
                  <el-button size="small" @click="addSubEvent(index)">添加子环节</el-button>
                  <el-button size="small" type="danger" @click="deleteEvent(index)">删除</el-button>
                </div>
              </div>
              <el-input 
                type="textarea" 
                v-model="event.description" 
                placeholder="环节描述" 
                :rows="2" 
                class="event-description-input"
              />
              
              <!-- 子环节编辑 -->
              <div v-if="event.subEvents && event.subEvents.length > 0" class="sub-events-container">
                <div v-for="(subEvent, subIndex) in event.subEvents" :key="subIndex" class="sub-event-edit-card">
                  <div class="sub-event-header">
                    <div class="sub-event-info">
                      <el-input v-model="subEvent.title" placeholder="子环节标题" class="sub-event-title-input" />
                      <el-datetime-picker v-model="subEvent.time" type="datetime" placeholder="选择时间" class="sub-event-time-input" />
                    </div>
                    <div class="sub-event-actions">
                      <el-select v-model="subEvent.type" placeholder="类型" class="sub-event-type-select">
                        <el-option label="危险" value="danger" />
                        <el-option label="警告" value="warning" />
                        <el-option label="信息" value="info" />
                        <el-option label="主要" value="primary" />
                        <el-option label="成功" value="success" />
                      </el-select>
                      <el-select v-model="subEvent.icon" placeholder="图标" class="sub-event-icon-select">
                        <el-option label="警告" value="el-icon-warning" />
                        <el-option label="旗帜" value="el-icon-s-flag" />
                        <el-option label="完成" value="el-icon-finished" />
                        <el-option label="搜索" value="el-icon-search" />
                        <el-option label="文档" value="el-icon-document" />
                      </el-select>
                      <el-button size="small" @click="addSubEventBefore(index, subIndex)">在前面添加</el-button>
                      <el-button size="small" @click="addSubEventAfter(index, subIndex)">在后面添加</el-button>
                      <el-button size="small" type="danger" @click="deleteSubEvent(index, subIndex)">删除</el-button>
                    </div>
                  </div>
                  <el-input 
                    type="textarea" 
                    v-model="subEvent.description" 
                    placeholder="子环节描述" 
                    :rows="2" 
                    class="sub-event-description-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- 查看模式 - 事件发展树 -->
          <div v-else class="event-tree-container">
            <div v-for="(event, index) in accidentTimeline" :key="index" :class="['event-tree-item', event.isMajor ? 'major-event-item' : '']">
              <!-- 时间线节点 -->
              <div class="event-tree-node">
                <div :class="['node-dot', event.isMajor ? 'major-node-dot' : '']"></div>
                <div v-if="index < accidentTimeline.length - 1" :class="['node-line', event.isMajor ? 'major-node-line' : '']"></div>
              </div>
              
              <!-- 事件内容 -->
              <div :class="['event-tree-content', event.isMajor ? 'major-event-content' : '']">
                <div class="event-tree-header">
                  <div class="event-tree-title">
                    <h4>{{ event.title }}</h4>
                    <span v-if="event.isMajor" class="major-event-badge">重大节点</span>
                  </div>
                  <span class="event-tree-time">{{ event.time }}</span>
                </div>
                <p class="event-tree-description">{{ event.description }}</p>
                
                <!-- 子环节树 -->
                <div v-if="event.subEvents && event.subEvents.length > 0" class="sub-event-tree">
                  <div v-for="(subEvent, subIndex) in event.subEvents" :key="subIndex" class="sub-event-tree-item">
                    <div class="sub-event-tree-node">
                      <div class="sub-node-dot"></div>
                      <div v-if="subIndex < event.subEvents.length - 1" class="sub-node-line"></div>
                    </div>
                    <div class="sub-event-tree-content">
                      <div class="sub-event-tree-header">
                        <h5>{{ subEvent.title }}</h5>
                        <span class="sub-event-tree-time">{{ subEvent.time }}</span>
                      </div>
                      <p class="sub-event-tree-description">{{ subEvent.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 添加/编辑事件对话框 -->
      <el-dialog
        v-model="eventDialogVisible"
        :title="eventDialogTitle"
        width="500px"
      >
        <el-form :model="eventForm" label-width="80px">
          <el-form-item label="时间">
            <el-datetime-picker v-model="eventForm.time" type="datetime" placeholder="选择时间" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="eventForm.description" placeholder="请输入事件描述" :rows="3" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="eventForm.type" placeholder="请选择事件类型">
              <el-option label="危险" value="danger" />
              <el-option label="警告" value="warning" />
              <el-option label="信息" value="info" />
              <el-option label="主要" value="primary" />
              <el-option label="成功" value="success" />
            </el-select>
          </el-form-item>
          <el-form-item label="图标">
            <el-select v-model="eventForm.icon" placeholder="请选择图标">
              <el-option label="警告" value="el-icon-warning" />
              <el-option label="旗帜" value="el-icon-s-flag" />
              <el-option label="完成" value="el-icon-finished" />
              <el-option label="搜索" value="el-icon-search" />
              <el-option label="文档" value="el-icon-document" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="eventDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveEvent">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 官方调查报告 -->
      <el-card class="report-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">官方调查报告</span>
            <div class="report-actions">
              <el-button type="primary" size="small" @click="uploadReport">上传报告</el-button>
              <el-button type="success" size="small" @click="downloadReport" :disabled="!currentPdfUrl">下载报告</el-button>
            </div>
          </div>
        </template>
        <div class="report-content">
          <div v-if="currentPdfUrl" class="pdf-reader">
            <div ref="pdfContainer" class="pdf-container">
              <div v-for="(page, index) in pdfPages" :key="index" class="pdf-page">
                <canvas :ref="el => pdfCanvasRefs[index] = el"></canvas>
              </div>
            </div>
          </div>
          <div v-else class="report-placeholder">
            <el-icon class="placeholder-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></el-icon>
            <p>请上传事故调查报告PDF文件</p>
            <el-button type="primary" @click="uploadReport">点击上传</el-button>
          </div>
        </div>
      </el-card>

      <!-- 事故原因分析 -->
      <el-card class="analysis-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">事故原因分析</span>
          </div>
        </template>
        <div class="analysis-content">
          <div class="analysis-item">
            <h3>技术原因</h3>
            <p>通过对事故现场的勘察和技术分析，事故的技术原因主要包括设备故障、操作不当、安全防护措施不到位等方面。</p>
          </div>
          <div class="analysis-item">
            <h3>管理原因</h3>
            <p>事故的管理原因主要包括安全管理制度不健全、安全培训不到位、安全检查流于形式、隐患排查治理不彻底等方面。</p>
          </div>
          <div class="analysis-item">
            <h3>责任原因</h3>
            <p>相关责任单位和人员存在安全意识淡薄、责任落实不到位、违法违规操作等问题，是导致事故发生的重要原因。</p>
          </div>
        </div>
      </el-card>

      <!-- 事故发生机理逻辑图 -->
      <el-card class="logic-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">事故发生机理逻辑图</span>
            <el-button v-if="isEditMode" type="primary" size="small" @click="generateLogicDiagram">智能生成逻辑图</el-button>
          </div>
        </template>
        <div class="logic-diagram">
          <div v-if="!mermaidCode" class="diagram-placeholder">
            <el-icon class="diagram-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></el-icon>
            <p>逻辑图可视化区域</p>
            <p class="diagram-description">点击"智能生成逻辑图"按钮，基于事故调查报告生成事件机理演化图</p>
          </div>
          <div v-else class="mermaid-container">
            <div ref="mermaidContainer" class="mermaid">{{ mermaidCode }}</div>
          </div>
        </div>
      </el-card>

      <!-- 知识图谱 -->
      <el-card class="graph-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">事故知识图谱</span>
            <el-button v-if="isEditMode" type="primary" size="small" @click="generateKnowledgeGraph">智能生成图谱</el-button>
          </div>
        </template>
        <div class="graph-container">
          <div v-if="!knowledgeGraphData.nodes || knowledgeGraphData.nodes.length === 0" class="graph-placeholder">
            <el-icon class="graph-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></el-icon>
            <p>知识图谱可视化区域</p>
            <p class="graph-description">点击"智能生成图谱"按钮，基于事故调查报告生成知识图谱</p>
          </div>
          <div v-else class="graph-content" ref="graphContainer"></div>
        </div>
      </el-card>

      <!-- 处理结果 -->
      <el-card class="result-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">处理结果</span>
          </div>
        </template>
        <div class="result-content">
          <div class="result-item">
            <h3>责任追究</h3>
            <p>{{ selectedAccident.punishment }}</p>
          </div>
          <div class="result-item">
            <h3>整改措施</h3>
            <p>1. 加强安全管理，建立健全安全管理制度</p>
            <p>2. 加强安全培训，提高员工安全意识和操作技能</p>
            <p>3. 加强安全检查，及时排查和治理安全隐患</p>
            <p>4. 加强应急管理，完善应急预案和演练</p>
          </div>
          <div class="result-item">
            <h3>经验教训</h3>
            <p>{{ selectedAccident.lessons }}</p>
          </div>
        </div>
      </el-card>

      <!-- 事故现场照片 -->
      <el-card class="photos-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">事故现场照片</span>
            <el-button v-if="isEditMode" type="primary" size="small" @click="addPhoto">添加照片</el-button>
          </div>
        </template>
        <div class="photos-grid">
          <div class="photo-item" v-for="(photo, index) in accidentPhotos" :key="index">
            <div class="photo-container">
              <img :src="photo.url" :alt="photo.description" class="photo-image" />
              <div class="photo-actions" v-if="isEditMode">
                <el-button size="small" type="primary" @click="editPhoto(index)">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePhoto(index)">删除</el-button>
              </div>
            </div>
            <p class="photo-description">{{ photo.description }}</p>
          </div>
        </div>
      </el-card>

      <!-- 相关资料 -->
      <el-card class="materials-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">相关资料</span>
          </div>
        </template>
        <div class="materials-list">
          <div class="material-item" v-for="(material, index) in accidentMaterials" :key="index">
            <el-icon class="material-icon"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></el-icon>
            <div class="material-info">
              <h4>{{ material.name }}</h4>
              <p>{{ material.description }}</p>
            </div>
            <el-button type="primary" size="small" @click="downloadMaterial(material)">下载</el-button>
          </div>
        </div>
      </el-card>

      <!-- 添加/编辑照片对话框 -->
      <el-dialog
        v-model="photoDialogVisible"
        :title="photoDialogTitle"
        width="500px"
      >
        <el-form :model="photoForm" label-width="80px">
          <el-form-item label="照片URL">
            <el-input v-model="photoForm.url" placeholder="请输入照片URL" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="photoForm.description" placeholder="请输入照片描述" :rows="3" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="photoDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="savePhoto">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 上传报告对话框 -->
      <el-dialog
        v-model="uploadDialogVisible"
        title="上传调查报告"
        width="600px"
        :close-on-click-modal="false"
      >
        <div class="upload-container">
          <div 
            class="upload-area" 
            :class="{ 'drag-over': isDragOver }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <el-icon class="upload-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></el-icon>
            <p>拖拽文件到此处或点击上传</p>
            <p class="upload-tip">支持 PDF 格式文件，最大 50MB</p>
            <input 
              ref="fileInput" 
              type="file" 
              accept=".pdf" 
              style="display: none" 
              @change="handleFileSelect"
            />
          </div>
          <div v-if="uploadedFiles.length > 0" class="uploaded-files">
            <h4>已上传文件：</h4>
            <el-table :data="uploadedFiles" style="width: 100%">
              <el-table-column prop="name" label="文件名" width="300" />
              <el-table-column prop="size" label="大小" width="100" />
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button size="small" type="danger" @click="removeFile(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="continueUpload">继续上传</el-button>
            <el-button type="primary" @click="saveAndExit" :disabled="uploadedFiles.length === 0">保存退出</el-button>
          </span>
        </template>
      </el-dialog>
    </div>

    <div v-else class="empty-state">
      <el-icon class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></el-icon>
      <p>请选择一个事故案例进行分析</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { ElMessage } from 'element-plus'

// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js'

// 事故数据（从父组件或API获取）
const accidents = ref([
  {
    id: 'AC001',
    name: '河北承德国恩老年公寓重大火灾事故',
    summary: '2025年4月8日晚，河北省承德市国恩老年公寓发生重大火灾事故，造成20人死亡，直接经济损失1274.8万元。',
    type: '火灾事故',
    directCause: '电气线路老化，短路引发火灾',
    indirectCause: '消防安全管理不到位，消防设施不完善，人员疏散通道不畅',
    responsibleUnit: '国恩老年公寓',
    projectType: '民用建筑',
    accidentDate: '2025-04-08',
    projectInfo: '国恩老年公寓，为老年人提供养老服务的场所',
    level: '重大',
    province: '河北省',
    severity: '特别严重',
    casualties: '20死',
    economicLoss: '1274.8',
    progress: '国务院安委会已挂牌督办，事故调查报告已公布，45人被追责问责',
    lessons: '加强养老机构消防安全管理，完善消防设施，定期开展安全检查和演练',
    punishment: '相关责任人被依法追究刑事责任，养老机构被吊销营业执照',
    files: {
      report: [{
        name: '事故调查报告.pdf',
        url: '#'
      }],
      reading: [{
        name: '事故分析报告.docx',
        url: '#'
      }],
      media: [{
        name: '新闻报道链接',
        url: '#'
      }]
    }
  },
  {
    id: 'AC002',
    name: '河南平顶山平煤股份十二矿事故',
    summary: '2024年，河南省平顶山市平煤股份十二矿发生重大安全事故。',
    type: '煤矿事故',
    directCause: '瓦斯爆炸',
    indirectCause: '安全管理不到位，瓦斯监测系统失效',
    responsibleUnit: '平顶山天安煤业股份有限公司',
    projectType: '矿业工程',
    accidentDate: '2024-01-01',
    projectInfo: '平煤股份十二矿，煤炭开采项目',
    level: '重大',
    province: '河南省',
    severity: '严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '国务院安委会已挂牌督办，事故调查正在进行中',
    lessons: '加强煤矿安全管理，完善瓦斯监测系统，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  }
])

// 选中的事故
const selectedAccidentId = ref('AC001')
const selectedAccident = computed(() => {
  return accidents.value.find(accident => accident.id === selectedAccidentId.value)
})

// 事故发展历程
const accidentTimeline = ref([
  {
    time: '2025-04-08 21:15',
    title: '火灾发生',
    description: '承德市隆化县国恩老年公寓6号楼302房间发生火灾，与电动防褥疮气床垫相连的移动插排电源线短路，引燃周围衣物等可燃物',
    type: 'danger',
    icon: 'el-icon-warning',
    isMajor: true
  },
  {
    time: '2025-04-08 21:20',
    title: '火势蔓延',
    description: '火灾引燃室内衣柜、电视机、床上用品，高温烟气进入吊顶后快速向其他房间蔓延',
    type: 'danger',
    icon: 'el-icon-warning',
    isMajor: false
  },
  {
    time: '2025-04-08 21:25',
    title: '报警救援',
    description: '有人发现火灾并报警，当地消防部门接到报警并赶赴现场',
    type: 'warning',
    icon: 'el-icon-s-flag',
    isMajor: true
  },
  {
    time: '2025-04-08 21:30',
    title: '救援展开',
    description: '消防队员到达现场，开始灭火和人员疏散工作',
    type: 'warning',
    icon: 'el-icon-s-flag',
    isMajor: false
  },
  {
    time: '2025-04-08 23:00',
    title: '明火扑灭',
    description: '经过数小时扑救，现场明火被扑灭',
    type: 'info',
    icon: 'el-icon-finished',
    isMajor: true
  },
  {
    time: '2025-04-09 00:30',
    title: '人员搜救',
    description: '消防队员继续搜救被困人员，确认伤亡情况',
    type: 'info',
    icon: 'el-icon-search',
    isMajor: false
  },
  {
    time: '2025-04-09 08:00',
    title: '事故调查启动',
    description: '河北省政府成立事故调查组，开始调查工作',
    type: 'primary',
    icon: 'el-icon-search',
    isMajor: true
  },
  {
    time: '2025-04-09 10:00',
    title: '负责人控制',
    description: '国恩老年公寓相关负责人被公安机关控制',
    type: 'info',
    icon: 'el-icon-document',
    isMajor: false
  },
  {
    time: '2025-04-09 14:00',
    title: '伤者救治',
    description: '19名未受伤人员被送医观察，受伤人员得到救治',
    type: 'info',
    icon: 'el-icon-finished',
    isMajor: false
  },
  {
    time: '2025-04-10',
    title: '国务院督办',
    description: '国务院安委会对事故实施挂牌督办',
    type: 'primary',
    icon: 'el-icon-s-flag',
    isMajor: true
  },
  {
    time: '2025-04-15',
    title: '初步调查',
    description: '调查组完成初步调查，确定事故直接原因',
    type: 'info',
    icon: 'el-icon-search',
    isMajor: false
  },
  {
    time: '2025-12-30',
    title: '调查报告发布',
    description: '河北省消防救援总队发布事故调查报告，认定为重大生产安全责任事故，21人被移送司法机关，45名公职人员被追责问责',
    type: 'success',
    icon: 'el-icon-document',
    isMajor: true
  }
])

// 事故相关资料
const accidentMaterials = ref([
  {
    name: '事故调查报告.pdf',
    description: '官方发布的事故调查报告',
    url: '#'
  },
  {
    name: '事故现场照片.zip',
    description: '事故现场的相关照片',
    url: '#'
  },
  {
    name: '安全检查记录.docx',
    description: '事故发生前的安全检查记录',
    url: '#'
  },
  {
    name: '相关法律法规.pdf',
    description: '事故处理涉及的相关法律法规',
    url: '#'
  }
])

// 事故现场照片
const accidentPhotos = ref([
  {
    url: 'https://via.placeholder.com/400x300?text=事故现场照片1',
    description: '事故现场全景照'
  },
  {
    url: 'https://via.placeholder.com/400x300?text=事故现场照片2',
    description: '事故现场局部照'
  },
  {
    url: 'https://via.placeholder.com/400x300?text=事故现场照片3',
    description: '事故现场细节照'
  },
  {
    url: 'https://via.placeholder.com/400x300?text=事故现场照片4',
    description: '事故现场救援照'
  }
])

// 事件对话框相关
const eventDialogVisible = ref(false)
const eventDialogTitle = ref('添加环节')
const eventForm = ref({
  time: new Date(),
  title: '',
  description: '',
  type: 'info',
  icon: 'el-icon-info'
})
const editingEventIndex = ref(-1)
const editingSubEventIndex = ref(-1)

// 照片对话框相关
const photoDialogVisible = ref(false)
const photoDialogTitle = ref('添加照片')
const photoForm = ref({
  url: '',
  description: ''
})
const editingPhotoIndex = ref(-1)

// 知识图谱相关
const knowledgeGraphData = ref({
  nodes: [],
  links: []
})
const graphContainer = ref(null)

// 逻辑图相关
const mermaidCode = ref('')
const mermaidContainer = ref(null)

// PDF相关
const currentPdfUrl = ref('')
const pdfContainer = ref(null)
const pdfCanvasRefs = ref([])
const pdfPages = ref([])
const pdfDoc = ref(null)

// 上传相关
const uploadDialogVisible = ref(false)
const isDragOver = ref(false)
const uploadedFiles = ref([])
const fileInput = ref(null)

// 进入编辑模式时转换时间格式
const convertTimesToDate = () => {
  accidentTimeline.value.forEach(event => {
    if (typeof event.time === 'string') {
      event.time = new Date(event.time)
    }
    if (event.subEvents && event.subEvents.length > 0) {
      event.subEvents.forEach(subEvent => {
        if (typeof subEvent.time === 'string') {
          subEvent.time = new Date(subEvent.time)
        }
      })
    }
  })
}

// 编辑模式相关
const isEditMode = ref(true)

// 初始化时转换时间格式
convertTimesToDate()

// 处理编辑模式切换
const handleEditModeChange = (value) => {
  console.log('编辑模式切换:', value ? '编辑模式' : '锁定模式')
  if (value) {
    // 进入编辑模式时转换时间格式
    convertTimesToDate()
  }
  // 实际项目中这里可以添加保存逻辑
}

// 加载事故详情
const loadAccidentDetail = (id) => {
  // 这里可以从API获取详细信息
  console.log('加载事故详情:', id)
  // 模拟更新时间线和资料
  accidentTimeline.value = [
    {
      time: '2025-04-08 20:00',
      title: '事故发生',
      description: '国恩老年公寓发生火灾',
      type: 'danger',
      icon: 'el-icon-warning',
      isMajor: true,
      subEvents: [
        {
          time: '2025-04-08 20:05',
          title: '火势蔓延',
          description: '火势迅速蔓延至整个建筑',
          type: 'danger',
          icon: 'el-icon-warning'
        }
      ]
    },
    {
      time: '2025-04-08 20:30',
      title: '救援启动',
      description: '当地消防部门接到报警并赶赴现场',
      type: 'warning',
      icon: 'el-icon-s-flag',
      isMajor: true,
      subEvents: [
        {
          time: '2025-04-08 20:35',
          title: '消防到达',
          description: '消防队员到达现场开始救援',
          type: 'warning',
          icon: 'el-icon-s-flag'
        },
        {
          time: '2025-04-08 21:00',
          title: '人员疏散',
          description: '开始疏散被困人员',
          type: 'info',
          icon: 'el-icon-finished'
        }
      ]
    },
    {
      time: '2025-04-09 00:00',
      title: '明火扑灭',
      description: '经过数小时扑救，明火被扑灭',
      type: 'info',
      icon: 'el-icon-finished',
      isMajor: true
    },
    {
      time: '2025-04-09 08:00',
      title: '事故调查',
      description: '成立事故调查组，开始调查',
      type: 'primary',
      icon: 'el-icon-search',
      isMajor: true
    },
    {
      time: '2025-04-15',
      title: '调查报告',
      description: '事故调查报告公布',
      type: 'success',
      icon: 'el-icon-document',
      isMajor: true
    }
  ]
  
  // 转换时间格式
  convertTimesToDate()
}

// 获取事故等级样式
const getLevelClass = (level) => {
  switch (level) {
    case '特别重大':
      return 'badge特别重大';
    case '重大':
      return 'badge重大';
    case '较大':
      return 'badge较大';
    case '一般':
      return 'badge一般';
    default:
      return '';
  }
}



// 下载资料
const downloadMaterial = (material) => {
  console.log('下载资料:', material.name)
  // 实际项目中这里会处理文件下载逻辑
}

// 添加时间线事件
const addTimelineEvent = () => {
  eventDialogTitle.value = '添加环节'
  eventForm.value = {
    time: new Date(),
    title: '',
    description: '',
    type: 'info',
    icon: 'el-icon-info',
    isMajor: false
  }
  editingEventIndex.value = -1
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 添加重大节点事件
const addMajorEvent = () => {
  eventDialogTitle.value = '添加重大节点'
  eventForm.value = {
    time: new Date(),
    title: '',
    description: '',
    type: 'primary',
    icon: 'el-icon-s-flag',
    isMajor: true
  }
  editingEventIndex.value = -1
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 在指定事件前添加新事件
const addEventBefore = (eventIndex) => {
  eventDialogTitle.value = '在前面添加环节'
  const targetEvent = accidentTimeline.value[eventIndex]
  // 设置时间为目标事件时间的前10分钟
  const targetTime = new Date(targetEvent.time)
  targetTime.setMinutes(targetTime.getMinutes() - 10)
  eventForm.value = {
    time: targetTime,
    title: '',
    description: '',
    type: 'info',
    icon: 'el-icon-info',
    isMajor: false
  }
  editingEventIndex.value = -1
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 在指定事件后添加新事件
const addEventAfter = (eventIndex) => {
  eventDialogTitle.value = '在后面添加环节'
  const targetEvent = accidentTimeline.value[eventIndex]
  // 设置时间为目标事件时间的后10分钟
  const targetTime = new Date(targetEvent.time)
  targetTime.setMinutes(targetTime.getMinutes() + 10)
  eventForm.value = {
    time: targetTime,
    title: '',
    description: '',
    type: 'info',
    icon: 'el-icon-info',
    isMajor: false
  }
  editingEventIndex.value = -1
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 添加子事件
const addSubEvent = (eventIndex) => {
  eventDialogTitle.value = '添加子环节'
  eventForm.value = {
    time: new Date(),
    title: '',
    description: '',
    type: 'info',
    icon: 'el-icon-info'
  }
  editingEventIndex.value = eventIndex
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 在指定子事件前添加新子事件
const addSubEventBefore = (eventIndex, subEventIndex) => {
  eventDialogTitle.value = '在前面添加子环节'
  const targetSubEvent = accidentTimeline.value[eventIndex].subEvents[subEventIndex]
  // 设置时间为目标子事件时间的前5分钟
  const targetTime = new Date(targetSubEvent.time)
  targetTime.setMinutes(targetTime.getMinutes() - 5)
  eventForm.value = {
    time: targetTime,
    title: '',
    description: '',
    type: 'info',
    icon: 'el-icon-info'
  }
  editingEventIndex.value = eventIndex
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 在指定子事件后添加新子事件
const addSubEventAfter = (eventIndex, subEventIndex) => {
  eventDialogTitle.value = '在后面添加子环节'
  const targetSubEvent = accidentTimeline.value[eventIndex].subEvents[subEventIndex]
  // 设置时间为目标子事件时间的后5分钟
  const targetTime = new Date(targetSubEvent.time)
  targetTime.setMinutes(targetTime.getMinutes() + 5)
  eventForm.value = {
    time: targetTime,
    title: '',
    description: '',
    type: 'info',
    icon: 'el-icon-info'
  }
  editingEventIndex.value = eventIndex
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 编辑事件
const editEvent = (eventIndex) => {
  eventDialogTitle.value = '编辑环节'
  const event = { ...accidentTimeline.value[eventIndex] }
  // 将字符串时间转换为 Date 对象
  event.time = new Date(event.time)
  eventForm.value = event
  editingEventIndex.value = eventIndex
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 编辑子事件
const editSubEvent = (eventIndex, subEventIndex) => {
  eventDialogTitle.value = '编辑子环节'
  const subEvent = { ...accidentTimeline.value[eventIndex].subEvents[subEventIndex] }
  // 将字符串时间转换为 Date 对象
  subEvent.time = new Date(subEvent.time)
  eventForm.value = subEvent
  editingEventIndex.value = eventIndex
  editingSubEventIndex.value = subEventIndex
  eventDialogVisible.value = true
}

// 删除事件
const deleteEvent = (eventIndex) => {
  accidentTimeline.value.splice(eventIndex, 1)
}

// 删除子事件
const deleteSubEvent = (eventIndex, subEventIndex) => {
  accidentTimeline.value[eventIndex].subEvents.splice(subEventIndex, 1)
}

// 按时间排序事件
const sortEventsByTime = (events) => {
  return events.sort((a, b) => {
    return new Date(a.time).getTime() - new Date(b.time).getTime()
  })
}

// 格式化时间为字符串
const formatTime = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 保存事件
const saveEvent = () => {
  // 复制表单数据并格式化时间
  const eventData = { ...eventForm.value }
  eventData.time = formatTime(eventData.time)
  
  if (editingSubEventIndex.value === -1) {
    // 保存主事件
    if (editingEventIndex.value === -1) {
      // 添加新事件
      accidentTimeline.value.push({
        ...eventData,
        subEvents: []
      })
    } else {
      // 更新现有事件
      accidentTimeline.value[editingEventIndex.value] = { ...eventData }
    }
    // 对主事件按时间排序
    accidentTimeline.value = sortEventsByTime(accidentTimeline.value)
  } else {
    // 保存子事件
    if (!accidentTimeline.value[editingEventIndex.value].subEvents) {
      accidentTimeline.value[editingEventIndex.value].subEvents = []
    }
    if (editingSubEventIndex.value === -1) {
      // 添加新子事件
      accidentTimeline.value[editingEventIndex.value].subEvents.push({ ...eventData })
    } else {
      // 更新现有子事件
      accidentTimeline.value[editingEventIndex.value].subEvents[editingSubEventIndex.value] = { ...eventData }
    }
    // 对子事件按时间排序
    accidentTimeline.value[editingEventIndex.value].subEvents = sortEventsByTime(accidentTimeline.value[editingEventIndex.value].subEvents)
  }
  eventDialogVisible.value = false
}

// 整理事件层级，将非重大节点转为二级子节点
const organizeEventHierarchy = () => {
  const majorEvents = []
  
  // 首先按时间排序所有事件
  const sortedEvents = sortEventsByTime([...accidentTimeline.value])
  
  sortedEvents.forEach(event => {
    if (event.isMajor) {
      // 重大节点作为主事件
      if (!event.subEvents) {
        event.subEvents = []
      }
      majorEvents.push(event)
    } else {
      // 非重大节点作为最近的重大节点的子节点
      if (majorEvents.length > 0) {
        const lastMajorEvent = majorEvents[majorEvents.length - 1]
        if (!lastMajorEvent.subEvents) {
          lastMajorEvent.subEvents = []
        }
        lastMajorEvent.subEvents.push(event)
        // 对子事件按时间排序
        lastMajorEvent.subEvents = sortEventsByTime(lastMajorEvent.subEvents)
      } else {
        // 如果还没有重大节点，暂时作为主事件
        event.subEvents = []
        majorEvents.push(event)
      }
    }
  })
  
  // 更新时间线数据
  accidentTimeline.value = majorEvents
}

// 保存所有修改
const saveAllChanges = () => {
  // 格式化所有时间为字符串
  accidentTimeline.value.forEach(event => {
    event.time = formatTime(event.time)
    if (event.subEvents && event.subEvents.length > 0) {
      event.subEvents.forEach(subEvent => {
        subEvent.time = formatTime(subEvent.time)
      })
      // 对子事件按时间排序
      event.subEvents = sortEventsByTime(event.subEvents)
    }
  })
  
  // 整理事件层级
  organizeEventHierarchy()
  
  console.log('保存所有修改完成')
}

// 刷新排序
const refreshTimeline = () => {
  // 首先将所有子事件提取出来，与主事件一起排序
  const allEvents = []
  accidentTimeline.value.forEach(event => {
    allEvents.push(event)
    if (event.subEvents && event.subEvents.length > 0) {
      event.subEvents.forEach(subEvent => {
        allEvents.push(subEvent)
      })
    }
  })
  
  // 按时间排序所有事件
  const sortedEvents = sortEventsByTime(allEvents)
  
  // 重新构建时间线
  accidentTimeline.value = []
  sortedEvents.forEach(event => {
    accidentTimeline.value.push(event)
  })
  
  // 整理事件层级
  organizeEventHierarchy()
  
  console.log('时间线排序刷新完成')
}

// 添加照片
const addPhoto = () => {
  photoDialogTitle.value = '添加照片'
  photoForm.value = {
    url: '',
    description: ''
  }
  editingPhotoIndex.value = -1
  photoDialogVisible.value = true
}

// 编辑照片
const editPhoto = (photoIndex) => {
  photoDialogTitle.value = '编辑照片'
  photoForm.value = { ...accidentPhotos.value[photoIndex] }
  editingPhotoIndex.value = photoIndex
  photoDialogVisible.value = true
}

// 删除照片
const deletePhoto = (photoIndex) => {
  accidentPhotos.value.splice(photoIndex, 1)
}

// 保存照片
const savePhoto = () => {
  if (editingPhotoIndex.value === -1) {
    // 添加新照片
    accidentPhotos.value.push({ ...photoForm.value })
  } else {
    // 更新现有照片
    accidentPhotos.value[editingPhotoIndex.value] = { ...photoForm.value }
  }
  photoDialogVisible.value = false
}

// 生成知识图谱
const generateKnowledgeGraph = () => {
  // 模拟基于事故调查报告生成知识图谱数据
  console.log('生成知识图谱')
  
  // 模拟知识图谱数据
  knowledgeGraphData.value = {
    nodes: [
      { id: '1', name: selectedAccident.value.name, category: 0 },
      { id: '2', name: selectedAccident.value.responsibleUnit, category: 1 },
      { id: '3', name: selectedAccident.value.directCause, category: 2 },
      { id: '4', name: selectedAccident.value.indirectCause, category: 2 },
      { id: '5', name: selectedAccident.value.casualties, category: 3 },
      { id: '6', name: selectedAccident.value.economicLoss + '万元', category: 3 },
      { id: '7', name: selectedAccident.value.punishment, category: 4 }
    ],
    links: [
      { source: '1', target: '2', label: '责任单位' },
      { source: '1', target: '3', label: '直接原因' },
      { source: '1', target: '4', label: '间接原因' },
      { source: '1', target: '5', label: '人员伤亡' },
      { source: '1', target: '6', label: '经济损失' },
      { source: '1', target: '7', label: '处理结果' }
    ]
  }
  
  // 实际项目中这里会调用大语言模型API生成知识图谱数据
  // 然后使用echarts渲染图谱
  setTimeout(() => {
    console.log('知识图谱生成完成')
  }, 1000)
}

// 生成逻辑图
const generateLogicDiagram = () => {
  // 模拟基于事故调查报告生成mermaid代码
  console.log('生成逻辑图')
  
  // 模拟mermaid代码
  mermaidCode.value = `graph TD
    A[初始事件: ${selectedAccident.value.directCause}] --> B[发展过程: 事件连锁反应]
    B --> C[事故后果: ${selectedAccident.value.casualties}, 经济损失${selectedAccident.value.economicLoss}万元]
    A --> D[间接原因: ${selectedAccident.value.indirectCause}]
    D --> B
    C --> E[处理结果: ${selectedAccident.value.punishment}]
    C --> F[经验教训: ${selectedAccident.value.lessons}]`
  
  // 实际项目中这里会调用大语言模型API生成mermaid代码
  // 然后使用mermaid库渲染图形
  setTimeout(() => {
    console.log('逻辑图生成完成')
    // 实际项目中这里会初始化mermaid
  }, 1000)
}

// 渲染PDF
const renderPdf = async (pdfUrl) => {
  try {
    // 加载PDF文档
    pdfDoc.value = await pdfjsLib.getDocument(pdfUrl).promise
    
    // 设置页数
    pdfPages.value = Array.from({ length: pdfDoc.value.numPages }, (_, i) => i + 1)
    
    // 渲染每一页
    for (let i = 1; i <= pdfDoc.value.numPages; i++) {
      const page = await pdfDoc.value.getPage(i)
      const viewport = page.getViewport({ scale: 1.2 })
      
      // 获取canvas元素
      const canvas = pdfCanvasRefs.value[i - 1]
      if (!canvas) continue
      
      // 设置canvas尺寸
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      // 渲染页面
      const context = canvas.getContext('2d')
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      await page.render(renderContext).promise
    }
  } catch (error) {
    console.error('渲染PDF失败:', error)
  }
}

// 上传报告
const uploadReport = () => {
  uploadDialogVisible.value = true
  uploadedFiles.value = []
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    processFiles(files)
  }
}

// 处理拖拽事件
const handleDragOver = () => {
  isDragOver.value = true
}

// 处理拖拽离开事件
const handleDragLeave = () => {
  isDragOver.value = false
}

// 处理拖拽文件
const handleDrop = (event) => {
  isDragOver.value = false
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processFiles(files)
  }
}

// 处理文件
const processFiles = (files) => {
  Array.from(files).forEach(file => {
    // 检查文件类型
    if (file.type !== 'application/pdf') {
      ElMessage.error('请上传PDF格式文件')
      return
    }
    
    // 检查文件大小
    if (file.size > 50 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过50MB')
      return
    }
    
    // 添加到已上传文件列表
    uploadedFiles.value.push({
      name: file.name,
      size: formatFileSize(file.size),
      file: file
    })
  })
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 删除文件
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

// 继续上传
const continueUpload = () => {
  // 清空已上传文件列表，继续上传
  uploadedFiles.value = []
}

// 保存并退出
const saveAndExit = () => {
  if (uploadedFiles.value.length > 0) {
    const file = uploadedFiles.value[0].file
    // 创建临时URL
    const url = URL.createObjectURL(file)
    currentPdfUrl.value = url
    
    // 渲染PDF
    renderPdf(url)
    
    // 关闭对话框
    uploadDialogVisible.value = false
  }
}

// 下载报告
const downloadReport = () => {
  if (currentPdfUrl.value) {
    // 创建下载链接
    const link = document.createElement('a')
    link.href = currentPdfUrl.value
    link.download = `${selectedAccident.value.name}调查报告.pdf`
    link.click()
  }
}
</script>

<style scoped>
.accident-analysis {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.analysis-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.accident-selector .el-select {
  width: 300px;
}

/* 基本信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-grid-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}

.info-grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.info-grid-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 4px;
}

.info-grid-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片样式 */
.el-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge特别重大 {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.badge重大 {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  color: #856404;
  border: 1px solid #ffeaa7;
}

.badge较大 {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee3f8 100%);
  color: #0c5460;
  border: 1px solid #bee3f8;
}

.badge一般 {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border: 1px solid #c3e6cb;
}



.accident-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eaeaea;
}

.accident-summary h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.accident-summary p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

/* 时间线样式 */
.timeline-container {
  padding: 20px 0;
}

/* 批量编辑模式样式 */
.batch-edit-mode {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-edit-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.event-edit-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #ffffff;
}

.event-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.event-info {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.event-title-input {
  flex: 1;
  min-width: 200px;
}

.event-time-input {
  width: 200px;
}

.event-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.event-type-select,
.event-icon-select {
  width: 120px;
}

.event-description-input {
  width: 100%;
  margin-bottom: 12px;
}

/* 子环节编辑样式 */
.sub-events-container {
  margin-top: 16px;
  margin-left: 20px;
  padding-left: 20px;
  border-left: 2px dashed #dcdfe6;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* PDF阅读器样式 */
.pdf-reader {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 600px;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.pdf-page {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  background: white;
  padding: 10px;
}

.pdf-page canvas {
  max-width: 100%;
  height: auto;
}

/* 报告占位符样式 */
.report-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dcdfe6;
  gap: 20px;
}

.placeholder-icon {
  color: #409eff;
  margin-bottom: 10px;
}

.report-placeholder p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

/* 报告操作按钮样式 */
.report-actions {
  display: flex;
  gap: 10px;
}

/* 上传对话框样式 */
.upload-container {
  padding: 20px 0;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f8f9fa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 20px;
}

.upload-area:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.upload-area.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
  transform: scale(1.02);
}

.upload-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.upload-area p {
  font-size: 16px;
  color: #606266;
  margin: 5px 0;
  text-align: center;
}

.upload-tip {
  font-size: 14px !important;
  color: #909399 !important;
}

.uploaded-files {
  margin-top: 30px;
}

.uploaded-files h4 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
}

.sub-event-edit-card {
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.sub-event-edit-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.sub-event-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.sub-event-info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.sub-event-title-input {
  flex: 1;
  min-width: 150px;
}

.sub-event-time-input {
  width: 180px;
}

.sub-event-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.sub-event-type-select,
.sub-event-icon-select {
  width: 100px;
}

.sub-event-description-input {
  width: 100%;
}

/* 事件发展树样式 */
.event-tree-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 20px;
}

.event-tree-item {
  display: flex;
  position: relative;
  margin-bottom: 24px;
}

.event-tree-node {
  position: relative;
  width: 20px;
  flex-shrink: 0;
}

.node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #409eff;
  position: absolute;
  left: 4px;
  top: 6px;
  z-index: 1;
}

.major-node-dot {
  width: 16px;
  height: 16px;
  background: #f56c6c;
  box-shadow: 0 0 0 2px #f56c6c;
  left: 2px;
  top: 4px;
}

.node-line {
  width: 2px;
  background: #409eff;
  position: absolute;
  left: 9px;
  top: 20px;
  bottom: -24px;
}

.major-node-line {
  background: #f56c6c;
  left: 9px;
}

.event-tree-content {
  flex: 1;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-left: 16px;
  position: relative;
}

.event-tree-content:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #ffffff;
}

.major-event-content {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.major-event-content:hover {
  background: #ffffff;
}

.event-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.event-tree-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.event-tree-title h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.major-event-badge {
  padding: 2px 8px;
  background: #f56c6c;
  color: #ffffff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.event-tree-time {
  font-size: 14px;
  color: #909399;
  white-space: nowrap;
}

.event-tree-description {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0 0 16px 0;
}

/* 子事件树样式 */
.sub-event-tree {
  margin-top: 16px;
  margin-left: 20px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-event-tree-item {
  display: flex;
  position: relative;
}

.sub-event-tree-node {
  position: relative;
  width: 20px;
  flex-shrink: 0;
}

.sub-node-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #67c23a;
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 1;
}

.sub-node-line {
  width: 2px;
  background: #dcdfe6;
  position: absolute;
  left: 9px;
  top: 16px;
  bottom: -16px;
}

.sub-event-tree-content {
  flex: 1;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-left: 16px;
}

.sub-event-tree-content:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.sub-event-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.sub-event-tree-header h5 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.sub-event-tree-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.sub-event-tree-description {
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
  margin: 0;
}

/* 重大事件编辑卡片样式 */
.major-event-card {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.major-event-card:hover {
  background: #ffffff;
}

.event-major-checkbox {
  margin-left: 16px;
}

/* 报告样式 */
.report-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.report-reader {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.report-header {
  padding: 24px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
  border-bottom: 1px solid #eaeaea;
  text-align: center;
}

.report-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.report-date {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.report-body {
  padding: 24px;
}

.report-section {
  margin-bottom: 32px;
  padding: 0;
  background: none;
  border-left: none;
}

.report-section:last-child {
  margin-bottom: 0;
}

.report-section h4 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.report-section p {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
  margin: 0 0 16px 0;
  text-align: justify;
}

.report-section ul {
  margin: 0 0 16px 0;
  padding-left: 24px;
}

.report-section li {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin-bottom: 8px;
}

.report-section li:last-child {
  margin-bottom: 0;
}

.cause-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0;
}

.cause-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.cause-item h5 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.cause-item p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0;
  text-align: justify;
}

/* 分析样式 */
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}

.analysis-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.analysis-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.analysis-item p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

/* 逻辑图样式 */
.logic-diagram {
  padding: 40px 0;
}

.diagram-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #909399;
}

.diagram-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.diagram-description {
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
  padding: 0 20px;
}

.mermaid-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.mermaid {
  font-size: 14px;
  line-height: 1.5;
}

/* 知识图谱样式 */
.graph-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.graph-placeholder {
  text-align: center;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.graph-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.graph-description {
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
  padding: 0 20px;
}

.graph-content {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

/* 照片样式 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.photo-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
}

.photo-item:hover {
  transform: translateY(-4px);
}

.photo-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.photo-container:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.photo-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: all 0.3s ease;
}

.photo-container:hover .photo-image {
  transform: scale(1.05);
}

.photo-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s ease;
}

.photo-container:hover .photo-actions {
  opacity: 1;
}

.photo-description {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0;
  text-align: center;
  padding: 0 12px;
}

/* 处理结果样式 */
.result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.result-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.result-item p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0 0 8px 0;
}

.result-item p:last-child {
  margin-bottom: 0;
}

/* 相关资料样式 */
.materials-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.material-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.material-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.material-icon {
  margin-right: 16px;
  color: #409eff;
}

.material-info {
  flex: 1;
}

.material-info h4 {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
}

.material-info p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state p {
  font-size: 16px;
  color: #909399;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .diagram-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .logic-arrow {
    width: 2px;
    height: 40px;
  }
  
  .logic-arrow::after {
    right: -4px;
    top: 100%;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #409eff;
  }
}
</style>