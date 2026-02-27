<template>
  <div class="spec-data-convert">
    <div class="convert-container">
      <h2>规范标准格式转换</h2>
      <el-form :model="convertForm" label-width="120px" class="convert-form">
        <el-form-item label="规范信息" required>
          <div class="spec-info">
            <h3>{{ specInfo.name }}</h3>
            <p>{{ specInfo.code }} - {{ getTypeText(specInfo.type) }}</p>
          </div>
        </el-form-item>
        <el-form-item label="源文件格式" required>
          <el-select v-model="convertForm.sourceFormat" placeholder="请选择源文件格式" @change="handleSourceFormatChange">
            <el-option label="PDF" value="pdf" />
            <el-option label="DOCX" value="docx" />
            <el-option label="HTML" value="html" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标文件格式" required>
          <el-select v-model="convertForm.targetFormat" placeholder="请选择目标文件格式" @change="handleTargetFormatChange">
            <el-option label="PDF" value="pdf" />
            <el-option label="DOCX" value="docx" />
            <el-option label="HTML" value="html" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件来源" required>
          <el-radio-group v-model="fileSource" @change="handleFileSourceChange">
            <el-radio-button label="上传文件">上传文件</el-radio-button>
            <el-radio-button label="历史版本">历史版本</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <!-- 上传文件 -->
        <el-form-item v-if="fileSource === '上传文件'" label="上传文件" required>
          <el-upload
            class="upload-demo drag-upload"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :accept="getFileAccept(convertForm.sourceFormat)"
            :drag="true"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                请上传{{ getFormatText(convertForm.sourceFormat) }}格式的文件
              </div>
            </template>
          </el-upload>
          <div v-if="selectedFile" class="selected-file">
            <el-tag>{{ selectedFile.name }}</el-tag>
            <el-button size="small" type="danger" @click="selectedFile = null">删除</el-button>
          </div>
        </el-form-item>
        
        <!-- 从历史版本选择 -->
        <el-form-item v-else-if="fileSource === '历史版本'" label="选择历史版本" required>
          <el-select v-model="selectedVersion" placeholder="请选择历史版本">
            <el-option 
              v-for="version in versionList" 
              :key="version.id" 
              :label="`${version.versionName} (${version.date})`" 
              :value="version"
            />
          </el-select>
          <div v-if="selectedVersion" class="selected-version">
            <p>文件: {{ selectedVersion.fileName }}</p>
            <p>格式: {{ selectedVersion.format }}</p>
            <p>上传日期: {{ selectedVersion.date }}</p>
          </div>
        </el-form-item>
        <el-form-item label="转换选项">
          <el-checkbox v-model="convertForm.includeImages">包含图片</el-checkbox>
          <el-checkbox v-model="convertForm.preserveLayout">保留布局</el-checkbox>
          <el-checkbox v-model="convertForm.ocrText">OCR文字识别</el-checkbox>
        </el-form-item>
        <el-form-item label="智能建图谱">
          <el-checkbox v-model="convertForm.buildKnowledgeGraph">构建规范条款知识图谱</el-checkbox>
          <span class="auto-fill-tip">将规范标准按照条款进行入数据库管理，构建规范条款知识图谱</span>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConvert" :loading="isConverting">开始转换</el-button>
      </div>
      
      <!-- 转换结果 -->
      <div class="convert-result">
        <el-divider content-position="left">转换结果</el-divider>
        <div v-if="!convertResult" class="result-info empty-result">
          <p>请选择文件并点击开始转换按钮</p>
          <p class="result-tip">转换后将显示转换结果和可用操作</p>
        </div>
        <div v-else class="result-info">
          <p>转换状态: <el-tag type="success">成功</el-tag></p>
          <p>转换时间: {{ convertResult.convertTime }}</p>
          <p>文件大小: {{ convertResult.fileSize }}</p>
          <p>转换文件: {{ convertResult.fileName }}.{{ convertForm.targetFormat }}</p>
          <p class="result-tip">转换成功！您可以下载文件、对比查看或挂接到历史版本</p>
        </div>
        <div v-if="convertResult" class="result-actions">
          <el-button type="primary" @click="handleDownload">下载转换文件</el-button>
          <el-button @click="handleCompare">对比查看</el-button>
          <el-button v-if="convertForm.buildKnowledgeGraph" type="info" @click="handleViewKnowledgeGraph">查看知识图谱</el-button>
          <el-button type="warning" @click="handleAttachToHistory">挂接到历史版本</el-button>
        </div>
      </div>
    </div>
    
    <!-- 对比查看对话框 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="转换前后对比"
      width="90%"
      height="80vh"
      :close-on-click-modal="false"
    >
      <div class="compare-container">
        <div class="compare-panel">
          <h4>源文件 ({{ getFormatText(convertForm.sourceFormat) }})</h4>
          <div 
            class="compare-content source-content"
            @scroll="handleSourceScroll"
            ref="sourceContentRef"
          >
            <div v-if="isLoading" class="loading-container">
              <el-spinner size="large" />
              <p>加载中...</p>
            </div>
            <div v-else>
              <iframe v-if="convertForm.sourceFormat === 'pdf'" :src="sourceFileUrl" frameborder="0" width="100%" height="100%"></iframe>
              <div v-else class="text-content">
                <pre>{{ sourceFileContent }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="compare-panel">
          <h4>转换文件 ({{ getFormatText(convertForm.targetFormat) }})</h4>
          <div 
            class="compare-content target-content"
            @scroll="handleTargetScroll"
            ref="targetContentRef"
          >
            <div v-if="isLoading" class="loading-container">
              <el-spinner size="large" />
              <p>加载中...</p>
            </div>
            <div v-else>
              <iframe v-if="convertForm.targetFormat === 'pdf'" :src="targetFileUrl" frameborder="0" width="100%" height="100%"></iframe>
              <div v-else class="text-content">
                <pre>{{ targetFileContent }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="compareDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 知识图谱对话框 -->
    <el-dialog
      v-model="knowledgeGraphDialogVisible"
      title="规范条款知识图谱"
      width="90%"
      :height="dialogHeight"
      @open="handleKnowledgeGraphOpen"
      @close="handleKnowledgeGraphClose"
    >
      <div class="knowledge-graph-container">
        <div v-if="isLoading" class="loading-container">
          <el-spinner size="large" />
          <p>加载中...</p>
        </div>
        <div v-else class="graph-content">
          <!-- 配置选项 -->
          <div class="graph-config" :class="{ 'collapsed': configCollapsed }">
            <div class="config-header">
              <h4>配置选项</h4>
              <el-button size="small" @click="toggleConfigCollapse">
                {{ configCollapsed ? '展开' : '折叠' }}
              </el-button>
            </div>
            <div v-if="!configCollapsed" class="config-content">
              <div class="config-row">
                <div class="config-section">
                  <h5>记录信息</h5>
                  <el-checkbox-group v-model="selectedInfoFields">
                    <el-checkbox label="name">规范名称</el-checkbox>
                    <el-checkbox label="code">规范编号</el-checkbox>
                    <el-checkbox label="level">规定等级</el-checkbox>
                    <el-checkbox label="status">状态</el-checkbox>
                  </el-checkbox-group>
                </div>
                <div class="config-section">
                  <h5>可视化配置</h5>
                  <el-form :inline="true" size="small">
                    <el-form-item label="显示层级">
                      <el-select v-model="visualizationConfig.maxLevel" placeholder="选择层级">
                        <el-option label="1级" value="1" />
                        <el-option label="2级" value="2" />
                        <el-option label="3级" value="3" />
                        <el-option label="全部" value="99" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="节点规模">
                      <el-select v-model="visualizationConfig.nodeScale" placeholder="选择规模">
                        <el-option label="小型" value="small" />
                        <el-option label="中型" value="medium" />
                        <el-option label="大型" value="large" />
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" size="small" @click="renderKnowledgeGraph">应用配置</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                <div class="config-section">
                  <h5>智能连图</h5>
                  <el-button type="info" size="small" @click="handleIntelligentConnect">智能连图</el-button>
                  <span class="auto-fill-tip">利用大语言模型识别并构建子图之间的虚拟连接</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 可视化和数据展示 -->
          <div class="graph-main">
            <!-- 知识图谱可视化 -->
            <div class="graph-visualization" :class="{ 'collapsed': graphCollapsed, 'fullscreen': fullScreenMode }">
              <div class="graph-header">
                <h4>知识图谱可视化</h4>
                <div class="graph-actions">
                  <el-button size="small" @click="toggleGraphCollapse">
                    {{ graphCollapsed ? '展开' : '折叠' }}
                  </el-button>
                  <el-button size="small" @click="toggleFullScreen">
                    {{ fullScreenMode ? '退出全屏' : '全屏' }}
                  </el-button>
                </div>
              </div>
              <div ref="graphContainerRef" class="graph-container"></div>
            </div>
            
            <!-- 条款数据表格 -->
            <div class="graph-data" :class="{ 'expanded': graphCollapsed }">
              <div class="graph-header">
                <h4>条款数据</h4>
                <div class="table-controls">
                  <el-form :inline="true" size="small">
                    <el-form-item label="每页显示">
                      <el-select v-model="tableConfig.pageSize" @change="handlePageSizeChange">
                        <el-option label="10条" value="10" />
                        <el-option label="20条" value="20" />
                        <el-option label="50条" value="50" />
                      </el-select>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
              <el-table 
                :data="pagedKnowledgeGraphData" 
                style="width: 100%"
                :height="tableHeight"
                :stripe="true"
                :border="true"
              >
                <el-table-column prop="id" label="条款ID" width="80" />
                <el-table-column prop="title" label="条款标题" min-width="200" />
                <el-table-column prop="content" label="条款内容" min-width="300">
                  <template #default="scope">
                    <div class="content-preview">{{ scope.row.content.substring(0, 100) }}...</div>
                  </template>
                </el-table-column>
                <el-table-column prop="level" label="层级" width="80" />
                <el-table-column prop="parentId" label="父条款ID" width="100" />
                <el-table-column label="连接" min-width="150">
                  <template #default="scope">
                    <div v-if="scope.row.connections && scope.row.connections.length > 0">
                      <div v-for="(connection, index) in scope.row.connections" :key="index">
                        <span :class="{ 'virtual-connection': connection.type === 'virtual' }">
                          {{ connection.target }} ({{ connection.type === 'virtual' ? '虚拟' : '实际' }})
                        </span>
                        <el-button 
                          v-if="connection.type === 'virtual'" 
                          size="small" 
                          type="danger" 
                          @click.stop="deleteVirtualConnection(scope.row.id, connection.target)"
                        >
                          删除
                        </el-button>
                      </div>
                    </div>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button size="small" type="primary" @click="editRecord(scope.row)">
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteRecord(scope.row.id)">
                      删除
                    </el-button>
                    <el-button size="small" @click="addRecordBelow(scope.row.id)">
                      在下方添加
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination">
                <el-pagination
                  v-model:current-page="tableConfig.currentPage"
                  v-model:page-size="tableConfig.pageSize"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="knowledgeGraphData.length"
                  @size-change="handlePageSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="knowledgeGraphDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 挂接到历史版本对话框 -->
    <el-dialog
      v-model="attachToHistory"
      title="挂接到历史版本"
      width="500px"
    >
      <div class="attach-to-history-container">
        <p>请选择要挂接的历史版本：</p>
        <el-select v-model="attachVersionId" placeholder="请选择历史版本" style="width: 100%">
          <el-option 
            v-for="version in versionList" 
            :key="version.id" 
            :label="`${version.versionName} (${version.date})`" 
            :value="version.id"
          />
        </el-select>
        <p class="attach-tip">转换后的文件将作为该版本的一个格式保存</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="attachToHistory = false">取消</el-button>
          <el-button type="primary" @click="confirmAttachToHistory" :loading="isLoading">确认挂接</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 编辑记录对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑记录"
      width="600px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="条款ID" disabled>
          <el-input v-model="editForm.id" />
        </el-form-item>
        <el-form-item label="条款标题" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="条款内容" required>
          <el-input v-model="editForm.content" type="textarea" rows="4" />
        </el-form-item>
        <el-form-item label="层级" required>
          <el-input-number v-model="editForm.level" :min="1" :max="5" />
        </el-form-item>
        <el-form-item label="父条款ID">
          <el-input v-model="editForm.parentId" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加记录对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加记录"
      width="500px"
    >
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="添加数量" required>
          <el-input-number v-model="addForm.count" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="父条款ID">
          <el-input v-model="addForm.parentId" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAdd">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataAnalysis, UploadFilled } from '@element-plus/icons-vue'
import * as d3 from 'd3'

// 响应式数据
const route = useRoute()
const isConverting = ref(false)
const isLoading = ref(false)
const selectedFile = ref<File | null>(null)
const convertResult = ref<any>(null)
const compareDialogVisible = ref(false)
const knowledgeGraphDialogVisible = ref(false)
const sourceFileUrl = ref('')
const targetFileUrl = ref('')
const sourceFileContent = ref('')
const targetFileContent = ref('')
const fileSource = ref('上传文件')
const selectedVersion = ref<any>(null)
const attachToHistory = ref(false)
const sourceContentRef = ref<HTMLElement | null>(null)
const targetContentRef = ref<HTMLElement | null>(null)
const attachVersionId = ref<number | null>(null)
const graphContainerRef = ref<HTMLElement | null>(null)

// 知识图谱配置
const selectedInfoFields = ref(['name', 'code', 'level', 'status'])
const visualizationConfig = reactive({
  maxLevel: 99,
  nodeScale: 'medium'
})
const graphCollapsed = ref(false)
const configCollapsed = ref(true)
const fullScreenMode = ref(false)

// 智能连图相关数据
const virtualLinks = ref<any[]>([])
const intelligentConnectLoading = ref(false)

// 表格配置
const tableConfig = reactive({
  currentPage: 1,
  pageSize: 20
})
const tableHeight = ref('400px')
const dialogHeight = ref('80vh')

// 编辑记录相关数据
const editDialogVisible = ref(false)
const currentEditRecord = ref<any>(null)
const editForm = reactive({
  id: '',
  title: '',
  content: '',
  level: 1,
  parentId: ''
})

// 增加记录相关数据
const addDialogVisible = ref(false)
const addForm = reactive({
  count: 1,
  parentId: ''
})

// 历史版本列表
const versionList = ref([
  {
    id: 1,
    versionName: 'GB 50016-2014 (2018年版)',
    fileName: '建筑设计防火规范.pdf',
    format: 'PDF',
    date: '2018-10-01'
  },
  {
    id: 2,
    versionName: 'GB 50016-2014',
    fileName: '建筑设计防火规范.docx',
    format: 'DOCX',
    date: '2015-05-01'
  },
  {
    id: 3,
    versionName: 'GB 50016-2006',
    fileName: '建筑设计防火规范.html',
    format: 'HTML',
    date: '2006-12-01'
  }
])

// 规范信息
const specInfo = reactive({
  id: '',
  name: '',
  code: '',
  type: ''
})

// 转换表单
const convertForm = reactive({
  sourceFormat: 'pdf',
  targetFormat: 'docx',
  includeImages: true,
  preserveLayout: true,
  ocrText: true,
  buildKnowledgeGraph: false
})

// 知识图谱数据
const knowledgeGraphData = ref([
  {
    id: '1',
    title: '总则',
    content: '为了规范建筑设计防火，保障人身和财产安全，制定本规范。',
    level: 1,
    parentId: '',
    connections: []
  },
  {
    id: '2',
    title: '术语',
    content: '本规范中使用的术语定义。',
    level: 1,
    parentId: ''
  },
  {
    id: '3',
    title: '建筑物分类和耐火等级',
    content: '建筑物的分类和耐火等级的确定。',
    level: 1,
    parentId: ''
  },
  {
    id: '3.1',
    title: '建筑物分类',
    content: '建筑物按照使用性质、建筑高度、建筑面积等进行分类。',
    level: 2,
    parentId: '3'
  },
  {
    id: '3.1.1',
    title: '民用建筑分类',
    content: '民用建筑分为住宅建筑和公共建筑两大类。',
    level: 3,
    parentId: '3.1'
  },
  {
    id: '3.1.2',
    title: '工业建筑分类',
    content: '工业建筑分为厂房和仓库两大类。',
    level: 3,
    parentId: '3.1'
  },
  {
    id: '3.1.3',
    title: '建筑高度分类',
    content: '建筑高度大于27m的住宅建筑和建筑高度大于24m的非单层公共建筑，为高层建筑。',
    level: 3,
    parentId: '3.1'
  },
  {
    id: '3.2',
    title: '耐火等级',
    content: '建筑物的耐火等级分为一级、二级、三级、四级。',
    level: 2,
    parentId: '3'
  },
  {
    id: '3.2.1',
    title: '一级耐火等级',
    content: '一级耐火等级建筑的主要构件全部为不燃烧体。',
    level: 3,
    parentId: '3.2'
  },
  {
    id: '3.2.2',
    title: '二级耐火等级',
    content: '二级耐火等级建筑的主要构件除吊顶为难燃烧体外，其余为不燃烧体。',
    level: 3,
    parentId: '3.2'
  },
  {
    id: '3.2.3',
    title: '三级耐火等级',
    content: '三级耐火等级建筑的屋顶承重构件为难燃烧体。',
    level: 3,
    parentId: '3.2'
  },
  {
    id: '3.2.4',
    title: '四级耐火等级',
    content: '四级耐火等级建筑的屋顶承重构件为可燃烧体。',
    level: 3,
    parentId: '3.2'
  },
  {
    id: '4',
    title: '总平面布局',
    content: '建筑物的总平面布局应符合防火要求。',
    level: 1,
    parentId: ''
  },
  {
    id: '4.1',
    title: '建筑间距',
    content: '建筑物之间的防火间距应符合规定。',
    level: 2,
    parentId: '4'
  },
  {
    id: '4.1.1',
    title: '民用建筑间距',
    content: '民用建筑之间的防火间距不应小于6m。',
    level: 3,
    parentId: '4.1'
  },
  {
    id: '4.1.2',
    title: '工业建筑间距',
    content: '工业建筑之间的防火间距应根据建筑高度、耐火等级等因素确定。',
    level: 3,
    parentId: '4.1'
  },
  {
    id: '4.2',
    title: '消防车道',
    content: '建筑物应设置消防车道。',
    level: 2,
    parentId: '4'
  },
  {
    id: '4.2.1',
    title: '消防车道设置',
    content: '消防车道的宽度不应小于4m，转弯半径不应小于9m。',
    level: 3,
    parentId: '4.2'
  },
  {
    id: '4.2.2',
    title: '消防车道通行要求',
    content: '消防车道应保持畅通，不得占用。',
    level: 3,
    parentId: '4.2'
  },
  {
    id: '5',
    title: '平面布置',
    content: '建筑物的平面布置应符合防火要求。',
    level: 1,
    parentId: ''
  },
  {
    id: '5.1',
    title: '设备用房',
    content: '设备用房的布置应符合规定。',
    level: 2,
    parentId: '5'
  },
  {
    id: '5.1.1',
    title: '锅炉房',
    content: '锅炉房应设置在建筑的首层或地下一层。',
    level: 3,
    parentId: '5.1'
  },
  {
    id: '5.1.2',
    title: '变配电室',
    content: '变配电室应设置在建筑的首层或地下一层。',
    level: 3,
    parentId: '5.1'
  },
  {
    id: '5.2',
    title: '人员密集场所',
    content: '人员密集场所的布置应符合规定。',
    level: 2,
    parentId: '5'
  },
  {
    id: '5.2.1',
    title: '观众厅',
    content: '观众厅的布置应符合防火要求。',
    level: 3,
    parentId: '5.2'
  },
  {
    id: '5.2.2',
    title: '会议厅',
    content: '会议厅的布置应符合防火要求。',
    level: 3,
    parentId: '5.2'
  },
  {
    id: '6',
    title: '安全疏散',
    content: '建筑物的安全疏散应符合防火要求。',
    level: 1,
    parentId: ''
  },
  {
    id: '6.1',
    title: '安全出口',
    content: '建筑物应设置足够的安全出口。',
    level: 2,
    parentId: '6'
  },
  {
    id: '6.1.1',
    title: '安全出口数量',
    content: '公共建筑的每个防火分区或一个防火分区的每个楼层，其安全出口的数量应经计算确定，且不应少于2个。',
    level: 3,
    parentId: '6.1'
  },
  {
    id: '6.1.2',
    title: '安全出口宽度',
    content: '安全出口的宽度应符合规定。',
    level: 3,
    parentId: '6.1'
  },
  {
    id: '6.2',
    title: '疏散楼梯',
    content: '疏散楼梯的设置应符合规定。',
    level: 2,
    parentId: '6'
  },
  {
    id: '6.2.1',
    title: '封闭楼梯间',
    content: '封闭楼梯间的设置应符合规定。',
    level: 3,
    parentId: '6.2'
  },
  {
    id: '6.2.2',
    title: '防烟楼梯间',
    content: '防烟楼梯间的设置应符合规定。',
    level: 3,
    parentId: '6.2'
  },
  {
    id: '7',
    title: '建筑构造',
    content: '建筑物的构造应符合防火要求。',
    level: 1,
    parentId: ''
  },
  {
    id: '7.1',
    title: '防火墙',
    content: '防火墙的设置应符合规定。',
    level: 2,
    parentId: '7'
  },
  {
    id: '7.1.1',
    title: '防火墙构造',
    content: '防火墙应采用不燃烧材料建造，耐火极限不应低于3.00h。',
    level: 3,
    parentId: '7.1'
  },
  {
    id: '7.1.2',
    title: '防火墙开口',
    content: '防火墙不应开设门窗洞口，当必须开设时，应设置甲级防火门窗。',
    level: 3,
    parentId: '7.1'
  },
  {
    id: '7.2',
    title: '防火隔墙',
    content: '防火隔墙的设置应符合规定。',
    level: 2,
    parentId: '7'
  },
  {
    id: '7.2.1',
    title: '防火隔墙构造',
    content: '防火隔墙应采用不燃烧材料建造，耐火极限不应低于1.00h。',
    level: 3,
    parentId: '7.2'
  },
  {
    id: '7.2.2',
    title: '防火隔墙开口',
    content: '防火隔墙开设门窗洞口时，应设置乙级防火门窗。',
    level: 3,
    parentId: '7.2'
  },
  {
    id: '8',
    title: '消防设施',
    content: '建筑物应设置消防设施。',
    level: 1,
    parentId: ''
  },
  {
    id: '8.1',
    title: '火灾自动报警系统',
    content: '火灾自动报警系统的设置应符合规定。',
    level: 2,
    parentId: '8'
  },
  {
    id: '8.1.1',
    title: '系统组成',
    content: '火灾自动报警系统由火灾探测器、手动火灾报警按钮、火灾报警控制器等组成。',
    level: 3,
    parentId: '8.1'
  },
  {
    id: '8.1.2',
    title: '系统设置',
    content: '火灾自动报警系统的设置应符合规定。',
    level: 3,
    parentId: '8.1'
  },
  {
    id: '8.2',
    title: '自动灭火系统',
    content: '自动灭火系统的设置应符合规定。',
    level: 2,
    parentId: '8'
  },
  {
    id: '8.2.1',
    title: '自动喷水灭火系统',
    content: '自动喷水灭火系统的设置应符合规定。',
    level: 3,
    parentId: '8.2'
  },
  {
    id: '8.2.2',
    title: '气体灭火系统',
    content: '气体灭火系统的设置应符合规定。',
    level: 3,
    parentId: '8.2'
  }
])

// 加载规范信息
const loadSpecData = () => {
  const specId = route.params.id as string
  
  // 模拟从后端获取规范信息
  setTimeout(() => {
    // 这里应该从后端API获取规范信息，这里使用模拟数据
    specInfo.id = specId
    specInfo.name = '建筑设计防火规范'
    specInfo.code = 'GB 50016-2014'
    specInfo.type = 'GB'
    
    // 加载历史版本列表
    loadVersionList()
  }, 500)
}

// 加载历史版本列表
const loadVersionList = () => {
  // 模拟从后端获取历史版本列表
  setTimeout(() => {
    versionList.value = [
      {
        id: 1,
        versionName: 'GB 50016-2014 (2018年版)',
        fileName: '建筑设计防火规范.pdf',
        format: 'PDF',
        date: '2018-10-01'
      },
      {
        id: 2,
        versionName: 'GB 50016-2014',
        fileName: '建筑设计防火规范.docx',
        format: 'DOCX',
        date: '2015-05-01'
      },
      {
        id: 3,
        versionName: 'GB 50016-2006',
        fileName: '建筑设计防火规范.html',
        format: 'HTML',
        date: '2006-12-01'
      }
    ]
  }, 300)
}

// 获取文件接受类型
const getFileAccept = (format: string) => {
  const acceptMap: Record<string, string> = {
    'pdf': '.pdf',
    'docx': '.docx',
    'html': '.html'
  }
  return acceptMap[format] || ''
}

// 获取格式文本
const getFormatText = (format: string) => {
  const formatMap: Record<string, string> = {
    'pdf': 'PDF',
    'docx': 'DOCX',
    'html': 'HTML'
  }
  return formatMap[format] || format
}

// 处理文件来源变化
const handleFileSourceChange = () => {
  selectedFile.value = null
  selectedVersion.value = null
}

// 处理源文件格式变化
const handleSourceFormatChange = () => {
  selectedFile.value = null
  selectedVersion.value = null
}

// 处理目标文件格式变化
const handleTargetFormatChange = () => {
  // 可以添加一些逻辑，比如根据目标格式调整转换选项
}

// 处理文件上传
const handleFileUpload = (file: any) => {
  selectedFile.value = file.raw
}

// 开始转换
const handleConvert = () => {
  if (fileSource.value === '上传文件' && !selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  
  if (fileSource.value === '历史版本' && !selectedVersion.value) {
    ElMessage.warning('请选择历史版本')
    return
  }
  
  isConverting.value = true
  
  // 模拟转换过程
  setTimeout(() => {
    // 模拟转换结果
    convertResult.value = {
      convertTime: new Date().toLocaleString(),
      fileSize: '1.2 MB',
      fileName: fileSource.value === '上传文件' ? selectedFile.value!.name.replace(/\.[^/.]+$/, '') : selectedVersion.value.fileName.replace(/\.[^/.]+$/, '')
    }
    
    // 模拟文件URL
    sourceFileUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    targetFileUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    
    // 模拟文件内容
    sourceFileContent.value = '这是源文件的内容...'
    targetFileContent.value = '这是转换后文件的内容...'
    
    ElMessage.success('转换成功')
    isConverting.value = false
  }, 3000)
}

// 下载转换文件
const handleDownload = () => {
  if (!convertResult.value) {
    ElMessage.warning('请先完成转换')
    return
  }
  
  // 模拟文件下载
  const fileName = `${convertResult.value.fileName}.${convertForm.targetFormat}`
  const fileContent = targetFileContent.value || '转换后的文件内容'
  
  // 创建Blob对象
  const blob = new Blob([fileContent], { type: getMimeType(convertForm.targetFormat) })
  
  // 创建下载链接
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  
  // 释放URL对象
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
  }, 100)
  
  ElMessage.success(`文件 ${fileName} 下载成功`)
}

// 获取文件MIME类型
const getMimeType = (format: string) => {
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'html': 'text/html'
  }
  return mimeMap[format] || 'application/octet-stream'
}

// 对比查看
const handleCompare = () => {
  if (!convertResult.value) {
    ElMessage.warning('请先完成转换')
    return
  }
  
  isLoading.value = true
  
  // 加载示例PDF文件
  sourceFileUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  targetFileUrl.value = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  
  // 模拟加载过程
  setTimeout(() => {
    compareDialogVisible.value = true
    isLoading.value = false
  }, 1000)
}

// 查看知识图谱
const handleViewKnowledgeGraph = () => {
  isLoading.value = true
  
  // 模拟加载过程
  setTimeout(() => {
    knowledgeGraphDialogVisible.value = true
    isLoading.value = false
  }, 1000)
}

// 处理源文件滚动
const handleSourceScroll = (event: Event) => {
  if (sourceContentRef.value && targetContentRef.value) {
    const sourceElement = event.target as HTMLElement
    const sourceScrollTop = sourceElement.scrollTop
    const sourceScrollHeight = sourceElement.scrollHeight
    const sourceClientHeight = sourceElement.clientHeight
    
    // 计算滚动比例
    const scrollRatio = sourceScrollTop / (sourceScrollHeight - sourceClientHeight)
    
    // 应用到目标元素
    const targetElement = targetContentRef.value
    const targetScrollHeight = targetElement.scrollHeight
    const targetClientHeight = targetElement.clientHeight
    const targetScrollTop = scrollRatio * (targetScrollHeight - targetClientHeight)
    
    // 避免循环触发
    if (Math.abs(targetElement.scrollTop - targetScrollTop) > 1) {
      targetElement.scrollTop = targetScrollTop
    }
  }
}

// 处理目标文件滚动
const handleTargetScroll = (event: Event) => {
  if (sourceContentRef.value && targetContentRef.value) {
    const targetElement = event.target as HTMLElement
    const targetScrollTop = targetElement.scrollTop
    const targetScrollHeight = targetElement.scrollHeight
    const targetClientHeight = targetElement.clientHeight
    
    // 计算滚动比例
    const scrollRatio = targetScrollTop / (targetScrollHeight - targetClientHeight)
    
    // 应用到源元素
    const sourceElement = sourceContentRef.value
    const sourceScrollHeight = sourceElement.scrollHeight
    const sourceClientHeight = sourceElement.clientHeight
    const sourceScrollTop = scrollRatio * (sourceScrollHeight - sourceClientHeight)
    
    // 避免循环触发
    if (Math.abs(sourceElement.scrollTop - sourceScrollTop) > 1) {
      sourceElement.scrollTop = sourceScrollTop
    }
  }
}

// 挂接到历史版本
const handleAttachToHistory = () => {
  // 打开挂接对话框
  attachToHistory.value = true
  // 默认挂接到当前选择的版本
  if (selectedVersion.value) {
    attachVersionId.value = selectedVersion.value.id
  }
}

// 确认挂接
const confirmAttachToHistory = () => {
  if (!attachVersionId.value) {
    ElMessage.warning('请选择要挂接的历史版本')
    return
  }
  
  // 模拟挂接过程
  isLoading.value = true
  setTimeout(() => {
    ElMessage.success('成功挂接到历史版本')
    isLoading.value = false
    attachToHistory.value = false
  }, 1000)
}

// 计算分页数据
const pagedKnowledgeGraphData = computed(() => {
  const start = (tableConfig.currentPage - 1) * tableConfig.pageSize
  const end = start + tableConfig.pageSize
  return knowledgeGraphData.value.slice(start, end)
})

// 处理分页大小变化
const handlePageSizeChange = (size: number) => {
  tableConfig.pageSize = size
  tableConfig.currentPage = 1
  updateTableHeight()
}

// 处理当前页变化
const handleCurrentChange = (current: number) => {
  tableConfig.currentPage = current
}

// 切换配置选项折叠状态
const toggleConfigCollapse = () => {
  configCollapsed.value = !configCollapsed.value
  nextTick(() => {
    renderKnowledgeGraph()
  })
}

// 切换知识图谱折叠状态
const toggleGraphCollapse = () => {
  graphCollapsed.value = !graphCollapsed.value
  nextTick(() => {
    renderKnowledgeGraph()
    updateTableHeight()
  })
}

// 处理知识图谱对话框打开
const handleKnowledgeGraphOpen = () => {
  // 动态设置对话框高度
  const windowHeight = window.innerHeight
  dialogHeight.value = `${Math.min(windowHeight * 0.9, 850)}px`
  
  // 更新表格高度
  updateTableHeight()
  
  // 渲染知识图谱
  nextTick(() => {
    renderKnowledgeGraph()
  })
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleWindowResize)
}

// 处理窗口大小变化
const handleWindowResize = () => {
  const windowHeight = window.innerHeight
  dialogHeight.value = `${Math.min(windowHeight * 0.9, 850)}px`
  updateTableHeight()
  nextTick(() => {
    renderKnowledgeGraph()
  })
}

// 切换全屏模式
const toggleFullScreen = () => {
  fullScreenMode.value = !fullScreenMode.value
  nextTick(() => {
    renderKnowledgeGraph()
  })
}

// 处理知识图谱对话框关闭
const handleKnowledgeGraphClose = () => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleWindowResize)
}

// 智能连图功能
const handleIntelligentConnect = () => {
  intelligentConnectLoading.value = true
  
  // 模拟智能连图过程
  setTimeout(() => {
    // 检测子图
    const subgraphs = detectSubgraphs()
    
    // 生成虚拟连接
    const newVirtualLinks = generateVirtualLinks(subgraphs)
    virtualLinks.value = newVirtualLinks
    
    // 重新渲染知识图谱，显示虚拟连接
    renderKnowledgeGraph()
    
    // 显示确认对话框
    if (newVirtualLinks.length > 0) {
      ElMessage({
        message: `检测到 ${subgraphs.length} 个子图，生成了 ${newVirtualLinks.length} 个虚拟连接建议`,
        type: 'info',
        duration: 3000
      })
      
      // 显示确认对话框
      showVirtualLinksDialog()
    } else {
      ElMessage({
        message: '未检测到独立子图，知识图谱已经是一个整体',
        type: 'success',
        duration: 3000
      })
    }
    
    intelligentConnectLoading.value = false
  }, 2000)
}

// 检测子图
const detectSubgraphs = () => {
  const nodes = knowledgeGraphData.value
  const links = []
  
  // 构建连接关系
  nodes.forEach(node => {
    if (node.parentId) {
      links.push({
        source: node.parentId,
        target: node.id
      })
    }
  })
  
  // 使用并查集检测子图
  const parent = {}
  nodes.forEach(node => {
    parent[node.id] = node.id
  })
  
  // 查找根节点
  const find = (id: string) => {
    if (parent[id] !== id) {
      parent[id] = find(parent[id])
    }
    return parent[id]
  }
  
  // 合并集合
  links.forEach(link => {
    const rootSource = find(link.source)
    const rootTarget = find(link.target)
    if (rootSource !== rootTarget) {
      parent[rootTarget] = rootSource
    }
  })
  
  // 统计子图
  const subgraphs = {}
  nodes.forEach(node => {
    const root = find(node.id)
    if (!subgraphs[root]) {
      subgraphs[root] = []
    }
    subgraphs[root].push(node)
  })
  
  return Object.values(subgraphs)
}

// 生成虚拟连接
const generateVirtualLinks = (subgraphs: any[][]) => {
  const virtualLinks = []
  
  // 如果子图数量小于2，不需要生成虚拟连接
  if (subgraphs.length < 2) {
    return virtualLinks
  }
  
  // 为每对子图生成虚拟连接
  for (let i = 0; i < subgraphs.length - 1; i++) {
    for (let j = i + 1; j < subgraphs.length; j++) {
      // 选择每个子图的根节点
      const subgraph1 = subgraphs[i]
      const subgraph2 = subgraphs[j]
      
      // 找到每个子图的根节点（parentId为空的节点）
      const root1 = subgraph1.find((node: any) => !node.parentId) || subgraph1[0]
      const root2 = subgraph2.find((node: any) => !node.parentId) || subgraph2[0]
      
      // 生成虚拟连接
      const virtualLink = {
        source: root1.id,
        target: root2.id,
        type: 'virtual',
        strength: Math.random() * 0.5 + 0.5 // 连接强度
      }
      
      virtualLinks.push(virtualLink)
      
      // 更新源节点的连接信息
      const sourceNode = knowledgeGraphData.value.find(node => node.id === root1.id)
      if (sourceNode) {
        if (!sourceNode.connections) {
          sourceNode.connections = []
        }
        // 添加虚拟连接
        sourceNode.connections.push({
          target: root2.id,
          type: 'virtual'
        })
      }
      
      // 更新目标节点的连接信息
      const targetNode = knowledgeGraphData.value.find(node => node.id === root2.id)
      if (targetNode) {
        if (!targetNode.connections) {
          targetNode.connections = []
        }
        // 添加虚拟连接
        targetNode.connections.push({
          target: root1.id,
          type: 'virtual'
        })
      }
    }
  }
  
  return virtualLinks
}

// 显示虚拟连接确认对话框
const showVirtualLinksDialog = () => {
  // 这里可以实现一个对话框，让用户确认虚拟连接
  // 为了简化，我们直接在控制台输出虚拟连接
  console.log('虚拟连接建议:', virtualLinks.value)
  
  // 模拟用户确认
  setTimeout(() => {
    confirmVirtualLinks()
  }, 1000)
}

// 确认虚拟连接
const confirmVirtualLinks = () => {
  // 将虚拟连接转换为实际连接
  virtualLinks.value.forEach(link => {
    // 更新源节点的连接信息
    const sourceNode = knowledgeGraphData.value.find(node => node.id === link.source)
    if (sourceNode) {
      if (!sourceNode.connections) {
        sourceNode.connections = []
      }
      // 移除虚拟连接
      sourceNode.connections = sourceNode.connections.filter(conn => !(conn.target === link.target && conn.type === 'virtual'))
      // 添加实际连接
      sourceNode.connections.push({
        target: link.target,
        type: 'actual'
      })
    }
    
    // 更新目标节点的连接信息
    const targetNode = knowledgeGraphData.value.find(node => node.id === link.target)
    if (targetNode) {
      if (!targetNode.connections) {
        targetNode.connections = []
      }
      // 移除虚拟连接
      targetNode.connections = targetNode.connections.filter(conn => !(conn.target === link.source && conn.type === 'virtual'))
      // 添加实际连接
      targetNode.connections.push({
        target: link.source,
        type: 'actual'
      })
    }
  })
  
  // 清空虚拟连接
  virtualLinks.value = []
  
  ElMessage({
    message: '虚拟连接已确认并转换为实际连接',
    type: 'success',
    duration: 3000
  })
  
  // 重新渲染知识图谱
  renderKnowledgeGraph()
}

// 编辑记录
const editRecord = (record: any) => {
  currentEditRecord.value = { ...record }
  editForm.id = record.id
  editForm.title = record.title
  editForm.content = record.content
  editForm.level = record.level
  editForm.parentId = record.parentId
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = () => {
  const index = knowledgeGraphData.value.findIndex(node => node.id === editForm.id)
  if (index !== -1) {
    knowledgeGraphData.value[index] = {
      ...knowledgeGraphData.value[index],
      title: editForm.title,
      content: editForm.content,
      level: editForm.level,
      parentId: editForm.parentId
    }
    ElMessage({
      message: '记录编辑成功',
      type: 'success',
      duration: 3000
    })
    editDialogVisible.value = false
    // 重新渲染知识图谱
    renderKnowledgeGraph()
  }
}

// 删除记录
const deleteRecord = (id: string) => {
  ElMessageBox.confirm('确定要删除这条记录吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    knowledgeGraphData.value = knowledgeGraphData.value.filter(node => node.id !== id)
    ElMessage({
      message: '记录删除成功',
      type: 'success',
      duration: 3000
    })
    // 重新渲染知识图谱
    renderKnowledgeGraph()
  }).catch(() => {
    // 取消删除
  })
}

// 在下方添加记录
const addRecordBelow = (id: string) => {
  const index = knowledgeGraphData.value.findIndex(node => node.id === id)
  if (index !== -1) {
    addForm.parentId = knowledgeGraphData.value[index].parentId
    addDialogVisible.value = true
  }
}

// 保存添加记录
const saveAdd = () => {
  const index = knowledgeGraphData.value.findIndex(node => node.id === currentEditRecord.value?.id)
  const startIndex = index !== -1 ? index + 1 : knowledgeGraphData.value.length
  
  for (let i = 0; i < addForm.count; i++) {
    const newId = `new_${Date.now()}_${i}`
    const newRecord = {
      id: newId,
      title: `新条款 ${i + 1}`,
      content: '请输入条款内容',
      level: 1,
      parentId: addForm.parentId,
      connections: []
    }
    knowledgeGraphData.value.splice(startIndex + i, 0, newRecord)
  }
  
  ElMessage({
    message: `成功添加 ${addForm.count} 条记录`,
    type: 'success',
    duration: 3000
  })
  addDialogVisible.value = false
  // 重新渲染知识图谱
  renderKnowledgeGraph()
}

// 删除虚拟连接
const deleteVirtualConnection = (sourceId: string, targetId: string) => {
  // 从virtualLinks中删除
  virtualLinks.value = virtualLinks.value.filter(link => !(link.source === sourceId && link.target === targetId))
  
  // 从知识图谱数据中删除
  const sourceNode = knowledgeGraphData.value.find(node => node.id === sourceId)
  if (sourceNode && sourceNode.connections) {
    sourceNode.connections = sourceNode.connections.filter(conn => !(conn.target === targetId && conn.type === 'virtual'))
  }
  
  const targetNode = knowledgeGraphData.value.find(node => node.id === targetId)
  if (targetNode && targetNode.connections) {
    targetNode.connections = targetNode.connections.filter(conn => !(conn.target === sourceId && conn.type === 'virtual'))
  }
  
  ElMessage({
    message: '虚拟连接已删除',
    type: 'success',
    duration: 3000
  })
  
  // 重新渲染知识图谱
  renderKnowledgeGraph()
}

// 更新表格高度
const updateTableHeight = () => {
  // 获取对话框高度
  const dialogHeightValue = parseInt(dialogHeight.value)
  // 计算容器高度，减去配置区域和边距
  const containerHeight = dialogHeightValue - 150
  // 计算足够显示20条记录的高度（每条记录约40px）
  const minTableHeight = 20 * 40 + 60 // 20条记录 + 表头高度 + 分页高度
  
  if (graphCollapsed.value) {
    // 折叠知识图谱时，表格高度设置为足够显示20条记录
    tableHeight.value = `${Math.max(containerHeight - 50, minTableHeight)}px`
  } else {
    // 展开知识图谱时，表格高度也设置为足够显示20条记录
    tableHeight.value = `${Math.max(containerHeight - 220, minTableHeight)}px`
  }
}

// 渲染知识图谱
const renderKnowledgeGraph = () => {
  nextTick(() => {
    if (!graphContainerRef.value) return
    
    try {
      // 清空容器
      graphContainerRef.value.innerHTML = ''
      
      // 过滤数据
      const filteredData = knowledgeGraphData.value.filter(item => {
        return item.level <= visualizationConfig.maxLevel
      })
      
      // 准备数据
      const nodes = filteredData.map(item => ({
        id: item.id,
        title: item.title,
        level: item.level,
        connections: item.connections || []
      }))
      
      const links = []
      filteredData.forEach(item => {
        if (item.parentId) {
          links.push({
            source: item.parentId,
            target: item.id
          })
        }
      })
      
      // 检查数据是否存在
      if (nodes.length === 0) {
        const width = graphContainerRef.value.clientWidth
        const height = Math.max(width / 2, 300)
        
        const svg = d3.select(graphContainerRef.value)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
        
        svg.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#909399')
          .text('暂无数据')
        return
      }
      
      // 设置容器尺寸
      const width = graphContainerRef.value.clientWidth
      // 宽高比为2:1
      let height = Math.max(width / 2, 300)
      
      // 如果是折叠状态，使用固定高度
      if (graphCollapsed.value) {
        height = 200
      }
      // 如果是全屏模式，使用更大的高度
      if (fullScreenMode.value) {
        height = window.innerHeight - 200
      }
      
      // 创建SVG
      const svg = d3.select(graphContainerRef.value)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'max-width: 100%; height: auto;')
      
      // 根据节点规模设置参数
      let nodeRadius = 20
      let linkDistance = 100
      let chargeStrength = -300
      
      switch (visualizationConfig.nodeScale) {
        case 'small':
          nodeRadius = 15
          linkDistance = 80
          chargeStrength = -200
          break
        case 'large':
          nodeRadius = 25
          linkDistance = 120
          chargeStrength = -400
          break
        default:
          nodeRadius = 20
          linkDistance = 100
          chargeStrength = -300
      }
      
      // 确保links格式正确
      const formattedLinks = links.map(link => ({
        source: link.source.toString(),
        target: link.target.toString(),
        type: 'actual'
      }))
      
      // 添加虚拟连接
      virtualLinks.value.forEach(link => {
        formattedLinks.push({
          source: link.source.toString(),
          target: link.target.toString(),
          type: 'virtual'
        })
      })
      
      // 确保nodes格式正确
      const formattedNodes = nodes.map(node => ({
        ...node,
        id: node.id.toString()
      }))
      
      // 创建力导向图
      const simulation = d3.forceSimulation(formattedNodes)
        .force('link', d3.forceLink(formattedLinks).id((d: any) => d.id).distance(linkDistance))
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(nodeRadius + 10))
      
      // 创建连接线
      const link = svg.append('g')
        .selectAll('line')
        .data(formattedLinks)
        .enter()
        .append('line')
        .attr('stroke', (d: any) => d.type === 'virtual' ? '#F56C6C' : '#999')
        .attr('stroke-opacity', (d: any) => d.type === 'virtual' ? 0.8 : 0.6)
        .attr('stroke-width', (d: any) => d.type === 'virtual' ? 2 : 2)
        .attr('stroke-dasharray', (d: any) => d.type === 'virtual' ? '5,5' : 'none')
      
      // 创建节点
      const node = svg.append('g')
        .selectAll('g')
        .data(formattedNodes)
        .enter()
        .append('g')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
      
      // 添加节点圆形
      node.append('circle')
        .attr('r', (d: any) => nodeRadius + d.level * 3)
        .attr('fill', (d: any) => {
          const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
          return colors[d.level - 1] || '#909399'
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
      
      // 添加节点文本
      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('fill', '#fff')
        .attr('font-size', visualizationConfig.nodeScale === 'small' ? '10px' : '12px')
        .text((d: any) => d.title)
      
      // 添加节点标题
      node.append('title')
        .text((d: any) => d.title)
      
      // 添加SVG拖拽功能（移动整个图谱）
      svg.call(d3.drag()
        .on('start', (event) => {
          // 禁用节点拖拽
          node.attr('pointer-events', 'none')
        })
        .on('drag', (event) => {
          // 移动所有节点
          formattedNodes.forEach(node => {
            node.x = (node.x || 0) + event.dx
            node.y = (node.y || 0) + event.dy
          })
          // 更新力导向图
          simulation.alpha(0.3).restart()
        })
        .on('end', (event) => {
          // 启用节点拖拽
          node.attr('pointer-events', 'all')
          simulation.alphaTarget(0)
        })
      )
      
      // 更新力导向图
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x || 0)
          .attr('y1', (d: any) => d.source.y || 0)
          .attr('x2', (d: any) => d.target.x || 0)
          .attr('y2', (d: any) => d.target.y || 0)
        
        node
          .attr('transform', (d: any) => `translate(${d.x || 0}, ${d.y || 0})`)
      })
      
      // 拖拽函数
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }
      
      function dragged(event: any, d: any) {
        d.fx = event.x
        d.fy = event.y
      }
      
      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }
    } catch (error) {
      console.error('知识图谱渲染错误:', error)
      if (graphContainerRef.value) {
        graphContainerRef.value.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #F56C6C;">渲染失败，请重试</div>'
      }
    }
  })
}

// 取消
const handleCancel = () => {
  window.close()
}

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'GB': '国家标准',
    'HB': '行业标准',
    'DB': '地方标准',
    'QB': '企业标准',
    'ISO': '国际标准'
  }
  return typeMap[type] || type
}

// 生命周期
onMounted(() => {
  loadSpecData()
})
</script>

<style lang="scss" scoped>
.spec-data-convert {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin: 0;
}

.convert-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 900px;
  min-height: 90vh;
  max-height: none;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

/* 确保在小屏幕上也能正常显示 */
@media (max-height: 768px) {
  .convert-container {
    min-height: 95vh;
    padding: 20px;
  }
  
  .convert-container h2 {
    font-size: 24px;
    margin-bottom: 24px;
    padding-bottom: 16px;
  }
  
  .spec-info {
    padding: 16px;
    margin-bottom: 24px;
  }
  
  .result-info {
    padding: 16px;
  }
  
  .form-actions {
    padding: 16px;
  }
  
  .result-actions .el-button,
  .form-actions .el-button {
    padding: 8px 16px;
    font-size: 14px;
  }
}

/* 立体效果装饰 */
.convert-container::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  background: linear-gradient(45deg, #409EFF, #67C23A, #E6A23C, #F56C6C);
  border-radius: 20px;
  z-index: -1;
  opacity: 0.5;
  animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.convert-container {
  background-size: 200% 200%;
  transition: all 0.3s ease;
}

.convert-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

/* 自定义滚动条 */
.convert-container::-webkit-scrollbar {
  width: 8px;
}

.convert-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.convert-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.convert-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.convert-container h2 {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 32px 0;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 3px solid #409EFF;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  position: relative;
}

.convert-container h2::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  border-radius: 3px;
}

.convert-form {
  margin-bottom: 24px;
}

.spec-info {
  background: linear-gradient(135deg, #ecf5ff 0%, #e3f2fd 100%);
  padding: 24px;
  border-radius: 12px;
  border-left: 4px solid #409EFF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  transition: all 0.3s ease;
}

.spec-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.spec-info h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.spec-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 16px;
  line-height: 1.5;
}

.selected-file {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-version {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #67C23A;
}

.selected-version p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.drag-upload {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #409EFF;
    background-color: #ecf5ff;
  }
}

.auto-fill-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding: 24px;
  border-top: 2px solid #e4e7ed;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0 0 12px 12px;
  position: relative;
}

.form-actions::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  border-radius: 2px;
}

.form-actions .el-button {
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 10px 20px;
  font-size: 16px;
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
    z-index: -1;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    
    &::before {
      left: 100%;
    }
  }
}

.convert-result {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.result-info {
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.result-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #409EFF;
}

.result-info p {
  margin: 12px 0;
  color: #606266;
  font-size: 16px;
  line-height: 1.5;
}

.empty-result {
  text-align: center;
  color: #909399;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e4e7ed 100%);
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
}

.empty-result p {
  font-size: 18px;
  color: #909399;
  margin: 8px 0;
}

.result-tip {
  font-size: 14px;
  color: #67C23A;
  margin-top: 16px !important;
  font-style: italic;
  font-weight: 500;
}

.convert-result {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid #e4e7ed;
  position: relative;
}

.convert-result::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  border-radius: 2px;
}

.result-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 24px;
  justify-content: center;
}

.result-actions .el-button {
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 10px 20px;
  font-size: 16px;
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
    z-index: -1;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    
    &::before {
      left: 100%;
    }
  }
}

.compare-container {
  display: flex;
  gap: 24px;
  height: 70vh;
}

.compare-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.compare-panel h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.compare-content {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.text-content {
  padding: 16px;
  height: 100%;
  overflow: auto;
  background-color: #f9f9f9;
}

.text-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
}

.knowledge-graph-container {
  min-height: 70vh;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.graph-config {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.graph-config.collapsed {
  padding: 16px 24px;
  margin-bottom: 16px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.config-header h4 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.config-content {
  transition: all 0.3s ease;
}

.graph-actions {
  display: flex;
  gap: 8px;
}

.graph-visualization.fullscreen {
  position: relative;
  z-index: 1000;
  margin: -24px;
  border-radius: 0;
  height: calc(100vh - 100px);
}

.graph-visualization.fullscreen .graph-container {
  min-height: calc(100vh - 200px);
}

/* 知识图谱容器添加竖向滚动条 */
.knowledge-graph-container {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
}

/* 自定义滚动条 */
.knowledge-graph-container::-webkit-scrollbar {
  width: 8px;
}

.knowledge-graph-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.knowledge-graph-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.knowledge-graph-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.config-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.config-section {
  flex: 1;
  min-width: 300px;
}

.config-section h5 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.config-section .el-checkbox {
  margin-right: 16px;
  margin-bottom: 8px;
}

.graph-main {
  display: flex;
  gap: 24px;
  flex-direction: column;
  flex: 1;
  min-height: 500px;
}

.graph-visualization {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.graph-visualization.collapsed {
  flex: 0;
  min-height: 120px;
}

.graph-visualization.collapsed .graph-container {
  display: none;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.graph-header h4 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.graph-container {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
  min-height: 300px;
}

.graph-data {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.graph-data.expanded {
  flex: 2;
}

.table-controls {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 表格样式 */
.graph-data .el-table {
  border: none;
  flex: 1;
}

.graph-data .el-table__header-wrapper {
  background-color: #f5f7fa;
}

.graph-data .el-table__body-wrapper {
  overflow: auto;
}

/* 自定义滚动条 */
.graph-data .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
}

.graph-data .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.graph-data .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.graph-data .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.graph-icon {
  font-size: 48px;
  color: #409EFF;
}

.graph-description {
  text-align: center;
  color: #909399;
  font-size: 14px;
  max-width: 600px;
}

.graph-data {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.graph-data h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.content-preview {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.virtual-connection {
  color: #F56C6C;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-style: dashed;
}

.dialog-footer {
  text-align: right;
}

.attach-to-history-container {
  padding: 20px 0;
}

.attach-to-history-container p {
  margin-bottom: 16px;
  color: #606266;
}

.attach-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 页面美化 */
.convert-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.convert-container h2 {
  color: #303133;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 32px;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #409EFF;
}

.spec-info {
  background: linear-gradient(135deg, #ecf5ff 0%, #e3f2fd 100%);
  border-radius: 8px;
  border-left: 4px solid #409EFF;
  padding: 20px;
  margin-bottom: 24px;
}

.spec-info h3 {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.spec-info p {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

.form-actions {
  background-color: #f8f9fa;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  margin-top: 32px;
  border-radius: 0 0 12px 12px;
}

.result-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.result-actions .el-button {
  border-radius: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.compare-container {
  display: flex;
  gap: 24px;
  height: 70vh;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.compare-panel {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.compare-panel h4 {
  padding: 16px 20px;
  margin: 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
  font-weight: 600;
}

.compare-content {
  height: calc(100% - 56px);
  overflow: auto;
  padding: 0;
}

/* 自定义滚动条 */
.compare-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.compare-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.compare-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.compare-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 知识图谱容器美化 */
.knowledge-graph-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.graph-visualization {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  overflow: hidden;
}

.graph-data {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.graph-data h4 {
  padding: 16px 20px;
  margin: 0;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
  font-weight: 600;
}

.graph-data .el-table {
  border: none;
}

.graph-data .el-table__header-wrapper {
  background-color: #f5f7fa;
}

.graph-data .el-table__body-wrapper {
  overflow: auto;
  height: calc(100% - 56px);
}
</style>