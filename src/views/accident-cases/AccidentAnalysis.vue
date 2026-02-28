<template>
  <div class="accident-analysis">
    <div class="analysis-header">
      <h2>事故分析</h2>
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
        <div class="info-list">
          <div class="info-list-item">
            <span class="info-list-label">事故类型：</span>
            <span class="info-list-value">{{ selectedAccident.type }}</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">事故日期：</span>
            <span class="info-list-value">{{ selectedAccident.accidentDate }}</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">所属省份：</span>
            <span class="info-list-value">{{ selectedAccident.province }}</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">人员伤亡：</span>
            <span class="info-list-value">{{ selectedAccident.casualties }}</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">经济损失：</span>
            <span class="info-list-value">{{ selectedAccident.economicLoss }}万元</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">责任单位：</span>
            <span class="info-list-value">{{ selectedAccident.responsibleUnit }}</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">工程类型：</span>
            <span class="info-list-value">{{ selectedAccident.projectType }}</span>
          </div>
          <div class="info-list-item">
            <span class="info-list-label">事故等级：</span>
            <span class="info-list-value">{{ selectedAccident.level }}</span>
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
            <el-button type="primary" size="small" @click="addTimelineEvent">添加环节</el-button>
          </div>
        </template>
        <div class="timeline-container">
          <el-timeline>
            <el-timeline-item 
              v-for="(event, index) in accidentTimeline" 
              :key="index" 
              :timestamp="event.time"
              :type="event.type"
              :icon="event.icon"
            >
              <div class="timeline-content">
                <div class="timeline-header">
                  <h4>{{ event.title }}</h4>
                  <div class="timeline-actions">
                    <el-button size="small" @click="addSubEvent(index)">添加子环节</el-button>
                    <el-button size="small" type="primary" @click="editEvent(index)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteEvent(index)">删除</el-button>
                  </div>
                </div>
                <p>{{ event.description }}</p>
                <!-- 子环节 -->
                <div class="sub-timeline" v-if="event.subEvents && event.subEvents.length > 0">
                  <el-timeline>
                    <el-timeline-item 
                      v-for="(subEvent, subIndex) in event.subEvents" 
                      :key="subIndex" 
                      :timestamp="subEvent.time"
                      :type="subEvent.type"
                      :icon="subEvent.icon"
                    >
                      <div class="sub-timeline-content">
                        <div class="sub-timeline-header">
                          <h5>{{ subEvent.title }}</h5>
                          <div class="sub-timeline-actions">
                            <el-button size="small" type="primary" @click="editSubEvent(index, subIndex)">编辑</el-button>
                            <el-button size="small" type="danger" @click="deleteSubEvent(index, subIndex)">删除</el-button>
                          </div>
                        </div>
                        <p>{{ subEvent.description }}</p>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
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
            <el-button type="primary" size="small" @click="downloadReport">下载报告</el-button>
          </div>
        </template>
        <div class="report-content">
          <div class="report-reader">
            <div class="report-header">
              <h3>{{ selectedAccident.name }} 事故调查报告</h3>
              <p class="report-date">发布日期：{{ new Date().toISOString().split('T')[0] }}</p>
            </div>
            <div class="report-body">
              <div class="report-section">
                <h4>一、调查概况</h4>
                <p>根据国务院安委会的部署，成立了由应急管理部、公安部、住建部等部门组成的事故调查组，对事故进行了全面调查。调查组通过现场勘察、查阅资料、询问相关人员等方式，对事故的发生原因、经过和责任进行了深入分析。</p>
              </div>
              <div class="report-section">
                <h4>二、事故基本情况</h4>
                <p><strong>事故发生时间：</strong>{{ selectedAccident.accidentDate }}</p>
                <p><strong>事故发生地点：</strong>{{ selectedAccident.province }}</p>
                <p><strong>事故类型：</strong>{{ selectedAccident.type }}</p>
                <p><strong>事故等级：</strong>{{ selectedAccident.level }}</p>
                <p><strong>人员伤亡情况：</strong>{{ selectedAccident.casualties }}</p>
                <p><strong>经济损失：</strong>{{ selectedAccident.economicLoss }}万元</p>
              </div>
              <div class="report-section">
                <h4>三、事故原因分析</h4>
                <div class="cause-analysis">
                  <div class="cause-item">
                    <h5>（一）直接原因</h5>
                    <p>{{ selectedAccident.directCause }}</p>
                  </div>
                  <div class="cause-item">
                    <h5>（二）间接原因</h5>
                    <p>{{ selectedAccident.indirectCause }}</p>
                  </div>
                </div>
              </div>
              <div class="report-section">
                <h4>四、责任认定</h4>
                <p>经调查认定，该事故是一起责任事故，相关单位和人员存在失职渎职行为。具体责任认定如下：</p>
                <ul>
                  <li>1. {{ selectedAccident.responsibleUnit }}：作为责任单位，安全生产主体责任落实不到位，安全管理混乱，对事故发生负有主要责任。</li>
                  <li>2. 相关监管部门：监管职责落实不到位，对事故隐患排查治理不力，对事故发生负有监管责任。</li>
                  <li>3. 相关责任人：安全意识淡薄，违章指挥、违章作业，对事故发生负有直接责任。</li>
                </ul>
              </div>
              <div class="report-section">
                <h4>五、处理建议</h4>
                <p>{{ selectedAccident.punishment }}</p>
              </div>
              <div class="report-section">
                <h4>六、整改措施建议</h4>
                <p>为防止类似事故再次发生，提出以下整改措施建议：</p>
                <ul>
                  <li>1. 加强安全生产管理，建立健全安全管理制度和操作规程。</li>
                  <li>2. 加强安全培训教育，提高员工安全意识和操作技能。</li>
                  <li>3. 加强安全检查和隐患排查治理，及时消除安全隐患。</li>
                  <li>4. 加强应急管理，完善应急预案，定期开展应急演练。</li>
                  <li>5. 加强监管执法，严厉打击违法违规行为。</li>
                </ul>
              </div>
            </div>
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
            <el-button type="primary" size="small" @click="generateLogicDiagram">智能生成逻辑图</el-button>
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
            <el-button type="primary" size="small" @click="generateKnowledgeGraph">智能生成图谱</el-button>
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
            <el-button type="primary" size="small" @click="addPhoto">添加照片</el-button>
          </div>
        </template>
        <div class="photos-grid">
          <div class="photo-item" v-for="(photo, index) in accidentPhotos" :key="index">
            <div class="photo-container">
              <img :src="photo.url" :alt="photo.description" class="photo-image" />
              <div class="photo-actions">
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
    </div>

    <div v-else class="empty-state">
      <el-icon class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></el-icon>
      <p>请选择一个事故案例进行分析</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
    time: '2025-04-08 20:00',
    title: '事故发生',
    description: '国恩老年公寓发生火灾',
    type: 'danger',
    icon: 'el-icon-warning'
  },
  {
    time: '2025-04-08 20:30',
    title: '救援启动',
    description: '当地消防部门接到报警并赶赴现场',
    type: 'warning',
    icon: 'el-icon-s-flag'
  },
  {
    time: '2025-04-09 00:00',
    title: '明火扑灭',
    description: '经过数小时扑救，明火被扑灭',
    type: 'info',
    icon: 'el-icon-finished'
  },
  {
    time: '2025-04-09 08:00',
    title: '事故调查',
    description: '成立事故调查组，开始调查',
    type: 'primary',
    icon: 'el-icon-search'
  },
  {
    time: '2025-04-15',
    title: '调查报告',
    description: '事故调查报告公布',
    type: 'success',
    icon: 'el-icon-document'
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
      icon: 'el-icon-finished'
    },
    {
      time: '2025-04-09 08:00',
      title: '事故调查',
      description: '成立事故调查组，开始调查',
      type: 'primary',
      icon: 'el-icon-search'
    },
    {
      time: '2025-04-15',
      title: '调查报告',
      description: '事故调查报告公布',
      type: 'success',
      icon: 'el-icon-document'
    }
  ]
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

// 下载报告
const downloadReport = () => {
  console.log('下载报告')
  // 实际项目中这里会处理文件下载逻辑
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
    icon: 'el-icon-info'
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

// 编辑事件
const editEvent = (eventIndex) => {
  eventDialogTitle.value = '编辑环节'
  eventForm.value = { ...accidentTimeline.value[eventIndex] }
  editingEventIndex.value = eventIndex
  editingSubEventIndex.value = -1
  eventDialogVisible.value = true
}

// 编辑子事件
const editSubEvent = (eventIndex, subEventIndex) => {
  eventDialogTitle.value = '编辑子环节'
  eventForm.value = { ...accidentTimeline.value[eventIndex].subEvents[subEventIndex] }
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

// 保存事件
const saveEvent = () => {
  if (editingSubEventIndex.value === -1) {
    // 保存主事件
    if (editingEventIndex.value === -1) {
      // 添加新事件
      accidentTimeline.value.push({
        ...eventForm.value,
        subEvents: []
      })
    } else {
      // 更新现有事件
      accidentTimeline.value[editingEventIndex.value] = { ...eventForm.value }
    }
  } else {
    // 保存子事件
    if (!accidentTimeline.value[editingEventIndex.value].subEvents) {
      accidentTimeline.value[editingEventIndex.value].subEvents = []
    }
    if (editingSubEventIndex.value === -1) {
      // 添加新子事件
      accidentTimeline.value[editingEventIndex.value].subEvents.push({ ...eventForm.value })
    } else {
      // 更新现有子事件
      accidentTimeline.value[editingEventIndex.value].subEvents[editingSubEventIndex.value] = { ...eventForm.value }
    }
  }
  eventDialogVisible.value = false
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

.accident-selector .el-select {
  width: 300px;
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

/* 基本信息样式 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.info-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}

.info-list-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.info-list-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.info-list-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
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

.el-timeline-item {
  margin-bottom: 24px;
  position: relative;
}

/* 时间线箭头样式 */
.el-timeline-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 20px;
  bottom: -24px;
  width: 2px;
  background: linear-gradient(to bottom, #409eff, #69c0ff);
  z-index: 0;
}

.el-timeline-item:last-child::before {
  display: none;
}

.timeline-content {
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.timeline-content:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #ffffff;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.timeline-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.timeline-actions {
  display: flex;
  gap: 8px;
}

.timeline-content p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  margin: 0 0 16px 0;
}

/* 子时间线样式 */
.sub-timeline {
  margin-top: 16px;
  margin-left: 20px;
  padding-left: 20px;
  border-left: 2px dashed #dcdfe6;
}

.sub-timeline .el-timeline-item {
  margin-bottom: 16px;
}

.sub-timeline-content {
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.sub-timeline-content:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.sub-timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.sub-timeline-header h5 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.sub-timeline-actions {
  display: flex;
  gap: 4px;
}

.sub-timeline-content p {
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
  margin: 0;
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