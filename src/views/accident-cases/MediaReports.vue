<template>
  <div class="media-reports">
    <div class="reports-header">
      <h2>媒体报道</h2>
      <div class="header-actions">
        <div class="accident-selector">
          <el-select 
            v-model="selectedAccidentId" 
            placeholder="选择事故案例" 
            @change="loadAccidentReports"
            filterable
            remote
            :remote-method="remoteMethod"
            :loading="loading"
            clearable
          >
            <el-option 
              v-for="accident in filteredAccidents" 
              :key="accident.id" 
              :label="accident.name" 
              :value="accident.id" 
            />
          </el-select>
        </div>
        <el-button type="primary" @click="openAddReportDialog">手动添加报道</el-button>
        <el-button type="success" @click="startIntelligentCollection">智能采集</el-button>
        <el-button type="info" @click="refreshReports">刷新报道</el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索报道内容"
        prefix-icon="el-icon-search"
        class="search-input"
        @keyup.enter="searchReports"
      />
      <el-select v-model="selectedCategory" placeholder="按分类筛选" class="filter-select">
        <el-option label="全部" value="all" />
        <el-option label="新闻报道" value="news" />
        <el-option label="视频报道" value="video" />
        <el-option label="官方发布" value="official" />
      </el-select>
      <el-select v-model="selectedSource" placeholder="按来源筛选" class="filter-select">
        <el-option label="全部" value="all" />
        <el-option label="中央媒体" value="central" />
        <el-option label="地方媒体" value="local" />
        <el-option label="行业媒体" value="industry" />
        <el-option label="政府网站" value="government" />
      </el-select>
      <el-button type="default" @click="resetFilters">重置</el-button>
    </div>

    <!-- 报道列表 -->
    <div class="reports-list">
      <el-card
        v-for="(report, index) in filteredReports"
        :key="report.id"
        class="report-card"
        :class="{ 'official-report': report.category === 'official' }"
      >
        <template #header>
          <div class="report-header">
            <h3 class="report-title">{{ report.title }}</h3>
            <div class="report-meta">
              <span class="report-source">{{ report.source }}</span>
              <span class="report-date">{{ report.date }}</span>
              <el-tag :type="getCategoryType(report.category)">{{ getCategoryName(report.category) }}</el-tag>
            </div>
          </div>
        </template>
        <div class="report-content">
          <!-- 视频展示 -->
          <div v-if="report.video" class="report-video">
            <div class="video-placeholder" @click="openReport(report.url)">
              <el-icon class="video-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></el-icon>
              <p>点击查看视频</p>
            </div>
          </div>
          <!-- 图片展示 -->
          <div v-else-if="report.image" class="report-image">
            <img :src="report.image" :alt="report.title" @click="openReport(report.url)" style="pointer-events: auto; cursor: pointer;" />
          </div>
          <!-- 文字摘要 -->
          <p class="report-summary">{{ report.summary }}</p>
          <div class="report-actions">
            <el-button size="small" @click="openReport(report.url)">查看原文</el-button>
            <el-button size="small" @click="editReport(report)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteReport(index)">删除</el-button>
          </div>
        </div>
      </el-card>
      <div v-if="filteredReports.length === 0" class="empty-state">
        <el-icon class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></el-icon>
        <p>暂无媒体报道</p>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="filteredReports.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredReports.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑报道对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      :title="isEditMode ? '编辑报道' : '添加报道'"
      width="600px"
    >
      <el-form :model="reportForm" label-width="80px">
        <el-form-item label="报道标题">
          <el-input v-model="reportForm.title" placeholder="请输入报道标题" />
        </el-form-item>
        <el-form-item label="报道链接">
          <el-input v-model="reportForm.url" placeholder="请输入报道链接" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="reportForm.source" placeholder="请输入报道来源" />
        </el-form-item>
        <el-form-item label="发布日期">
          <el-date-picker v-model="reportForm.date" type="date" placeholder="选择发布日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="reportForm.category" placeholder="请选择分类">
            <el-option label="新闻报道" value="news" />
            <el-option label="视频报道" value="video" />
            <el-option label="官方发布" value="official" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源类型">
          <el-select v-model="reportForm.sourceType" placeholder="请选择来源类型">
            <el-option label="中央媒体" value="central" />
            <el-option label="地方媒体" value="local" />
            <el-option label="行业媒体" value="industry" />
            <el-option label="政府网站" value="government" />
          </el-select>
        </el-form-item>
        <el-form-item label="视频链接">
          <el-input v-model="reportForm.video" placeholder="请输入视频嵌入链接（如YouTube嵌入链接）" />
        </el-form-item>
        <el-form-item label="图片链接">
          <el-input v-model="reportForm.image" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="内容摘要">
          <el-input type="textarea" v-model="reportForm.summary" placeholder="请输入内容摘要" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReport">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 智能采集对话框 -->
    <el-dialog
      v-model="collectionDialogVisible"
      title="智能采集"
      width="600px"
    >
      <el-form :model="collectionForm" label-width="80px">
        <el-form-item label="事故案例名称">
          <el-input v-model="collectionForm.accidentCaseName" placeholder="请输入事故案例名称" />
        </el-form-item>
        <el-form-item label="搜索关键词">
          <el-input v-model="collectionForm.keyword" placeholder="请输入搜索关键词" />
        </el-form-item>
        <el-form-item label="采集数量">
          <el-input-number v-model="collectionForm.count" :min="1" :max="20" :step="1" />
        </el-form-item>
        <el-form-item label="来源类型">
          <el-select v-model="collectionForm.sourceType" multiple placeholder="请选择来源类型">
            <el-option label="中央媒体" value="central" />
            <el-option label="地方媒体" value="local" />
            <el-option label="行业媒体" value="industry" />
            <el-option label="政府网站" value="government" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select v-model="collectionForm.contentType" multiple placeholder="请选择内容类型">
            <el-option label="新闻报道" value="news" />
            <el-option label="视频报道" value="video" />
            <el-option label="官方发布" value="official" />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="isCollecting" class="collection-progress">
        <el-progress :percentage="collectionProgress" />
        <p class="progress-text">{{ collectionStatus }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="collectionDialogVisible = false" :disabled="isCollecting">取消</el-button>
          <el-button type="primary" @click="startCollection" :disabled="isCollecting">开始采集</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 事故案例数据 - 与事故管理子模块保持一致
const accidents = ref([
  {
    id: 'AC001',
    name: '河北承德国恩老年公寓重大火灾事故'
  },
  {
    id: 'AC002',
    name: '河南平顶山平煤股份十二矿事故'
  },
  {
    id: 'AC003',
    name: '贵州船舶侧翻事故'
  },
  {
    id: 'AC004',
    name: '广东深圳深江铁路5标段路面坍塌事故'
  },
  {
    id: 'AC005',
    name: '河南大学大礼堂火灾事故'
  },
  {
    id: 'AC006',
    name: '江西南昌重大道路交通事故'
  },
  {
    id: 'AC007',
    name: '宁夏银川富洋烧烤店特别重大燃气爆炸事故'
  },
  {
    id: 'AC008',
    name: '辽宁某化工有限公司重大爆炸着火事故'
  },
  {
    id: 'AC009',
    name: '内蒙古阿拉善左旗煤矿坍塌事故'
  },
  {
    id: 'AC010',
    name: '甘肃白银宏达铝型材有限公司较大生产安全事故'
  },
  {
    id: 'AC011',
    name: '山西吕梁某煤业公司地面联建楼火灾事故'
  },
  {
    id: 'AC012',
    name: '安徽亳州较大坍塌事故'
  },
  {
    id: 'AC013',
    name: '广东深圳某公司火灾事故'
  },
  {
    id: 'AC014',
    name: '辽宁涉海渔船安全生产事故'
  },
  {
    id: 'AC015',
    name: '山东淄博临淄事故'
  },
  {
    id: 'AC016',
    name: '北京某建筑工地坍塌事故'
  },
  {
    id: 'AC017',
    name: '上海某商场火灾事故'
  },
  {
    id: 'AC018',
    name: '江苏南京某化工厂爆炸事故'
  },
  {
    id: 'AC019',
    name: '浙江杭州某地铁施工坍塌事故'
  },
  {
    id: 'AC020',
    name: '福建厦门某码头坍塌事故'
  },
  {
    id: 'AC021',
    name: '湖北武汉某建筑工地高处坠落事故'
  },
  {
    id: 'AC022',
    name: '湖南长沙某工厂火灾事故'
  },
  {
    id: 'AC023',
    name: '四川成都某地铁施工透水事故'
  },
  {
    id: 'AC024',
    name: '陕西西安某建筑工地坍塌事故'
  },
  {
    id: 'AC025',
    name: '云南昆明某化工厂爆炸事故'
  },
  {
    id: 'AC026',
    name: '贵州贵阳某建筑工地高处坠落事故'
  },
  {
    id: 'AC027',
    name: '重庆某煤矿瓦斯爆炸事故'
  },
  {
    id: 'AC028',
    name: '天津某化工厂火灾事故'
  },
  {
    id: 'AC029',
    name: '河北石家庄某建筑工地坍塌事故'
  },
  {
    id: 'AC030',
    name: '吉林长春某工厂爆炸事故'
  }
])

// 过滤后的事故案例
const filteredAccidents = ref([...accidents.value])

// 加载状态
const loading = ref(false)

// 选中的事故案例
const selectedAccidentId = ref('AC001')

// 媒体报道数据 - 按事故案例分类
const allReports = ref({
  'AC001': [
    {
      id: '1',
      title: '河北承德一老年公寓发生火灾致20人死亡',
      url: 'http://www.news.cn/society/20250409/4a7b8c9d-e1f2-43a5-9b6c-8d7e6f5a4b3c.html',
      source: '新华社',
      sourceType: 'central',
      date: '2025-04-09',
      category: 'news',
      summary: '4月8日晚，河北省承德市国恩老年公寓发生重大火灾事故，造成20人死亡，直接经济损失1274.8万元。事故原因初步查明为电气线路老化短路引发火灾。',
      image: 'https://img.news.cn/soc/20250409/20250409123456789.jpg',
      video: ''
    },
    {
      id: '2',
      title: '国务院安委会对河北承德火灾事故挂牌督办',
      url: 'https://www.mem.gov.cn/gk/tzgg/202504/t20250410_412345.html',
      source: '应急管理部',
      sourceType: 'government',
      date: '2025-04-10',
      category: 'official',
      summary: '国务院安委会对河北承德国恩老年公寓重大火灾事故实施挂牌督办，要求查明事故原因，严肃追究责任。',
      image: 'https://www.mem.gov.cn/images/202504/20250410123456.jpg',
      video: ''
    }
  ],
  'AC002': [
    {
      id: '1',
      title: '河南平顶山平煤股份十二矿发生安全事故',
      url: 'http://www.news.cn/society/20240101/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2024-01-01',
      category: 'news',
      summary: '河南省平顶山市平煤股份十二矿发生重大安全事故，造成多人伤亡。事故原因正在调查中。',
      image: 'https://img.news.cn/soc/20240101/20240101123456789.jpg',
      video: ''
    }
  ],
  'AC003': [
    {
      id: '1',
      title: '贵州船舶侧翻事故救援现场',
      url: 'http://www.news.cn/society/20241201/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2024-12-01',
      category: 'news',
      summary: '贵州省发生船舶侧翻事故，造成8人死亡。救援人员正在全力搜救。',
      image: 'https://img.news.cn/soc/20241201/20241201123456789.jpg',
      video: ''
    }
  ],
  'AC004': [
    {
      id: '1',
      title: '广东深圳深江铁路5标段路面坍塌事故',
      url: 'http://www.news.cn/society/20241204/7a8b9c0d-1e2f-3g4h-5i6j-7k8l9m0n1o2p.html',
      source: '新华社',
      sourceType: 'central',
      date: '2024-12-04',
      category: 'news',
      summary: '广东省深圳市宝安区航城街道深江铁路5标段施工现场发生重大路面坍塌事故，造成13人失联。',
      image: 'https://img.news.cn/soc/20241204/20241204123456789.jpg',
      video: ''
    }
  ],
  'AC005': [
    {
      id: '1',
      title: '河南大学大礼堂火灾事故',
      url: 'http://www.news.cn/society/20240502/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2024-05-02',
      category: 'news',
      summary: '河南大学大礼堂发生火灾事故，无人员伤亡。',
      image: 'https://img.news.cn/soc/20240502/20240502123456789.jpg',
      video: ''
    }
  ],
  'AC006': [
    {
      id: '1',
      title: '江西南昌重大道路交通事故',
      url: 'http://www.news.cn/society/20230108/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2023-01-08',
      category: 'news',
      summary: '江西省南昌市发生一起大货车冲撞人群的重大道路交通事故，造成19人死亡，20人受伤。',
      image: 'https://img.news.cn/soc/20230108/20230108123456789.jpg',
      video: ''
    }
  ],
  'AC007': [
    {
      id: '1',
      title: '宁夏银川富洋烧烤店特别重大燃气爆炸事故',
      url: 'http://www.news.cn/society/20230621/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2023-06-21',
      category: 'news',
      summary: '宁夏回族自治区银川市兴庆区富洋烧烤民族街店发生一起特别重大燃气爆炸事故，造成31人死亡。',
      image: 'https://img.news.cn/soc/20230621/20230621123456789.jpg',
      video: ''
    }
  ],
  'AC008': [
    {
      id: '1',
      title: '辽宁某化工有限公司重大爆炸着火事故',
      url: 'http://www.news.cn/society/20230115/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2023-01-15',
      category: 'news',
      summary: '辽宁省某化工有限公司在烷基化装置水洗罐入口管道带压密封作业过程中管道焊缝处突然断裂，大量介质泄漏引发爆炸着火事故。',
      image: 'https://img.news.cn/soc/20230115/20230115123456789.jpg',
      video: ''
    }
  ],
  'AC009': [
    {
      id: '1',
      title: '内蒙古阿拉善左旗煤矿坍塌事故',
      url: 'http://www.news.cn/society/20230222/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2023-02-22',
      category: 'news',
      summary: '内蒙古自治区阿拉善左旗发生煤矿坍塌事故，造成多人伤亡。',
      image: 'https://img.news.cn/soc/20230222/20230222123456789.jpg',
      video: ''
    }
  ],
  'AC010': [
    {
      id: '1',
      title: '甘肃白银宏达铝型材有限公司较大生产安全事故',
      url: 'http://www.news.cn/society/20230906/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.html',
      source: '新华社',
      sourceType: 'central',
      date: '2023-09-06',
      category: 'news',
      summary: '甘肃省白银市白银区甘肃宏达铝型材有限公司熔铸车间发生一起冷却水闪蒸事故，造成4人死亡。',
      image: 'https://img.news.cn/soc/20230906/20230906123456789.jpg',
      video: ''
    }
  ]
})

// 当前事故的媒体报道
const reports = ref(allReports.value[selectedAccidentId.value])

// 加载事故报道
const loadAccidentReports = (accidentId) => {
  try {
    // 确保事故ID存在
    if (accidentId && allReports.value[accidentId]) {
      reports.value = allReports.value[accidentId]
    } else {
      reports.value = []
      ElMessage.warning('该事故案例暂无媒体报道')
    }
    // 重置搜索和筛选
    searchKeyword.value = ''
    selectedCategory.value = 'all'
    selectedSource.value = 'all'
    currentPage.value = 1
  } catch (error) {
    console.error('加载事故报道失败:', error)
    reports.value = []
    ElMessage.error('加载事故报道失败，请重试')
  }
}

// 搜索和筛选
const searchKeyword = ref('')
const selectedCategory = ref('all')
const selectedSource = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框
const reportDialogVisible = ref(false)
const collectionDialogVisible = ref(false)

// 表单数据
const reportForm = ref({
  id: '',
  title: '',
  url: '',
  source: '',
  sourceType: '',
  date: '',
  category: '',
  summary: '',
  video: '',
  image: ''
})

const collectionForm = ref({
  accidentCaseName: '',
  keyword: '',
  count: 5,
  sourceType: [],
  contentType: []
})

// 编辑模式
const isEditMode = ref(false)

// 智能采集
const isCollecting = ref(false)
const collectionProgress = ref(0)
const collectionStatus = ref('')

// 过滤后的报道
const filteredReports = computed(() => {
  let result = [...reports.value]
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(report => 
      report.title.toLowerCase().includes(keyword) || 
      report.summary.toLowerCase().includes(keyword) ||
      report.source.toLowerCase().includes(keyword)
    )
  }
  
  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    result = result.filter(report => report.category === selectedCategory.value)
  }
  
  // 按来源筛选
  if (selectedSource.value !== 'all') {
    result = result.filter(report => report.sourceType === selectedSource.value)
  }
  
  return result
})

// 打开添加报道对话框
const openAddReportDialog = () => {
  isEditMode.value = false
  reportForm.value = {
    id: '',
    title: '',
    url: '',
    source: '',
    sourceType: '',
    date: '',
    category: '',
    summary: '',
    video: '',
    image: ''
  }
  reportDialogVisible.value = true
}

// 编辑报道
const editReport = (report) => {
  isEditMode.value = true
  reportForm.value = { ...report }
  reportDialogVisible.value = true
}

// 保存报道
const saveReport = () => {
  if (!reportForm.value.title || !reportForm.value.url) {
    ElMessage.error('请填写报道标题和链接')
    return
  }
  
  if (isEditMode.value) {
    // 更新现有报道
    const index = reports.value.findIndex(r => r.id === reportForm.value.id)
    if (index !== -1) {
      reports.value[index] = { ...reportForm.value }
      ElMessage.success('报道更新成功')
    }
  } else {
    // 添加新报道
    const newReport = {
      ...reportForm.value,
      id: Date.now().toString()
    }
    reports.value.unshift(newReport)
    ElMessage.success('报道添加成功')
  }
  
  reportDialogVisible.value = false
}

// 删除报道
const deleteReport = (index) => {
  reports.value.splice(index, 1)
  ElMessage.success('报道删除成功')
}

// 打开报道链接
const openReport = (url) => {
  window.open(url, '_blank')
}

// 搜索报道
const searchReports = () => {
  currentPage.value = 1
}

// 重置筛选
const resetFilters = () => {
  searchKeyword.value = ''
  selectedCategory.value = 'all'
  selectedSource.value = 'all'
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 智能采集
const startIntelligentCollection = () => {
  // 设置默认事故案例名称为当前选中的案例
  const currentAccident = accidents.value.find(acc => acc.id === selectedAccidentId.value)
  if (currentAccident) {
    collectionForm.value.accidentCaseName = currentAccident.name
  }
  collectionDialogVisible.value = true
}

const startCollection = async () => {
  if (!collectionForm.value.keyword) {
    ElMessage.error('请输入搜索关键词')
    return
  }
  
  isCollecting.value = true
  collectionProgress.value = 0
  collectionStatus.value = '开始采集信息...'
  
  // 模拟智能采集过程
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    collectionProgress.value = (i + 1) * 10
    collectionStatus.value = `正在采集第 ${i + 1} 条信息...`
  }
  
  // 模拟采集结果
  const mockReports = [
    {
      id: Date.now().toString() + '1',
      title: '河北承德火灾事故后续：开展全省养老机构安全检查',
      url: 'https://example.com/news3',
      source: '河北日报',
      sourceType: 'local',
      date: '2025-04-11',
      category: 'news',
      summary: '河北省应急管理厅在全省范围内开展养老机构安全检查，排查安全隐患，防止类似事故再次发生。'
    },
    {
      id: Date.now().toString() + '2',
      title: '专家解读：养老机构消防安全隐患分析',
      url: 'https://example.com/news4',
      source: '中国消防杂志',
      sourceType: 'industry',
      date: '2025-04-12',
      category: 'news',
      summary: '消防专家解读养老机构常见消防安全隐患，提出针对性防范措施。'
    }
  ]
  
  // 添加到报道列表
  mockReports.forEach(report => {
    reports.value.unshift(report)
  })
  
  collectionStatus.value = '采集完成！'
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  collectionDialogVisible.value = false
  isCollecting.value = false
  ElMessage.success('智能采集完成，已添加 2 条新报道')
}

// 刷新报道
const refreshReports = () => {
  // 模拟刷新过程
  ElMessage.info('正在刷新报道...')
  setTimeout(() => {
    ElMessage.success('报道刷新完成')
  }, 1000)
}

// 远程搜索方法
const remoteMethod = (query) => {
  if (query) {
    loading.value = true
    // 模拟远程搜索延迟
    setTimeout(() => {
      filteredAccidents.value = accidents.value.filter(accident => {
        return accident.name.toLowerCase().includes(query.toLowerCase())
      })
      loading.value = false
    }, 200)
  } else {
    filteredAccidents.value = [...accidents.value]
  }
}

// 获取分类类型
const getCategoryType = (category) => {
  switch (category) {
    case 'news':
      return 'info'
    case 'video':
      return 'warning'
    case 'official':
      return 'primary'
    default:
      return 'default'
  }
}

// 获取分类名称
const getCategoryName = (category) => {
  switch (category) {
    case 'news':
      return '新闻报道'
    case 'video':
      return '视频报道'
    case 'official':
      return '官方发布'
    default:
      return category
  }
}

// 初始化
onMounted(() => {
  // 这里可以从API获取报道数据
  console.log('媒体报道模块初始化')
})
</script>

<style scoped>
.media-reports {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.reports-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.accident-selector {
  min-width: 400px;
  max-width: 500px;
  flex: 1;
}

.accident-selector .el-select {
  width: 100%;
}

.search-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 300px;
}

.filter-select {
  width: 150px;
}

.reports-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.report-card {
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.report-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.18);
}

.report-card .el-card__header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
}

.report-card .el-card__body {
  padding: 20px;
}

.official-report {
  border-left: 4px solid #409eff;
}

.report-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.report-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #999;
  flex-wrap: wrap;
}

.report-source {
  font-weight: 500;
  color: #666;
}

.report-content {
  margin-top: 15px;
}

.report-video {
  margin-bottom: 15px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-placeholder {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.video-placeholder:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.video-icon {
  margin-bottom: 10px;
  color: #409eff;
}

.video-placeholder p {
  margin: 0;
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.report-image {
  margin-bottom: 15px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.report-image:hover {
  transform: scale(1.02);
}

.report-image img {
  width: 100%;
  height: auto;
  display: block;
}

.report-summary {
  margin: 0 0 15px 0;
  line-height: 1.5;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-icon {
  margin-bottom: 20px;
  color: #999;
}

.empty-state p {
  margin: 0;
  color: #999;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.collection-progress {
  margin-top: 20px;
}

.progress-text {
  margin-top: 10px;
  text-align: center;
  color: #666;
}

@media (max-width: 768px) {
  .reports-list {
    grid-template-columns: 1fr;
  }
  
  .search-filter {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .reports-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>