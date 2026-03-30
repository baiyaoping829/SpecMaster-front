<template>
  <div class="crawler-admin">
    <div class="toolbar">
      <el-form :inline="true" :model="taskForm">
        <el-form-item label="关键词">
          <el-input v-model="taskForm.keyword" placeholder="如：坍塌 2024 河北" style="width: 260px;" />
        </el-form-item>
        <el-form-item label="模式">
          <el-switch v-model="taskForm.regexMode" active-text="正则模式" inactive-text="单网址" @change="onModeChange" />
        </el-form-item>
        <el-form-item label="目标网址">
          <div class="target-url">
            <el-autocomplete
              v-model="taskForm.targetUrl"
              :placeholder="taskForm.regexMode ? '输入正则，如：https?://example\\.com/\\d{4}/\\w+\\.html' : 'https://...'"
              style="width: 420px;"
              :fetch-suggestions="queryHistory"
              trigger-on-focus
              popper-class="crawler-history-popper"
              @select="onHistorySelect"
              @focus="refreshFavoriteState"
            />
            <el-input v-if="taskForm.regexMode" v-model="taskForm.seedUrl" placeholder="种子网址（列表页）" style="width: 360px;" />
            <el-button v-if="taskForm.regexMode" :loading="regexPreviewLoading" @click="openRegexPreview">预览</el-button>
            <el-button
              v-if="!taskForm.regexMode"
              circle
              :type="isFavorite ? 'warning' : 'default'"
              class="favorite-btn"
              data-testid="favorite-site-button"
              @click="openFavoriteDialog"
            >
              <el-icon><star /></el-icon>
            </el-button>
            <el-button v-if="!taskForm.regexMode" data-testid="favorite-site-list-button" @click="openFavoriteList">收藏清单</el-button>
            <el-button data-testid="clear-url-history-button" @click="clearUrlHistory">清除历史</el-button>
          </div>
        </el-form-item>
        <el-form-item label="引擎">
          <el-select v-model="taskForm.engine" placeholder="选择引擎" style="width: 160px;">
            <el-option label="httpx+BS4" value="httpx_bs4" />
            <el-option label="requests+BS4" value="requests_bs4" />
            <el-option label="Playwright" value="playwright" />
            <el-option label="Scrapy" value="scrapy" />
          </el-select>
        </el-form-item>
        <el-form-item label="并发">
          <el-input-number v-model="taskForm.concurrency" :min="1" :max="100" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="creating" @click="createTask">创建任务</el-button>
          <el-button type="success" :loading="smartCreating" @click="createSmartTask">一键智能爬取</el-button>
          <el-button :loading="abLoading" @click="runABCompare">A/B对比</el-button>
          <el-button :loading="loadingTasks" @click="loadTasks">刷新任务</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="never" style="margin-bottom: 12px;">
      <template #header>
        <div style="display:flex; justify-content: space-between; align-items:center;">
          <span>爬取任务</span>
        </div>
      </template>
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 10px;">
        <el-input v-model="taskQuery" placeholder="按关键词/网址过滤" style="width: 260px;" clearable @input="loadTasks" />
        <el-select v-model="taskStatus" placeholder="状态" clearable style="width: 140px;" @change="loadTasks">
          <el-option label="pending" value="pending" />
          <el-option label="running" value="running" />
          <el-option label="succeeded" value="succeeded" />
          <el-option label="finished" value="finished" />
          <el-option label="failed" value="failed" />
        </el-select>
        <el-date-picker v-model="taskDateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" @change="loadTasks" />
        <el-button :loading="loadingTasks" @click="loadTasks">查询</el-button>
      </div>
      <div v-if="progressVisible" style="margin-bottom: 10px;">
        <el-progress :percentage="Math.min(100, Math.max(0, Math.round(progress.percent || 0)))" :status="progress.status === 'failed' ? 'exception' : undefined" />
        <div style="display:flex; justify-content:space-between; color:#666; font-size:12px; margin-top:6px;">
          <div>阶段：{{ progress.stage || '-' }}，进度：{{ progress.current }}/{{ progress.total }}，耗时：{{ progressElapsed }}s</div>
          <div v-if="progress.eta !== null">预计剩余：{{ progress.eta }}s</div>
          <div v-else>预计剩余：-</div>
        </div>
      </div>
      <el-table :data="tasks" style="width: 100%;">
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column prop="keyword" label="关键词" width="180" />
        <el-table-column prop="target_url" label="目标网址" min-width="240" />
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column prop="stage" label="阶段" width="120" />
        <el-table-column label="进度" width="120">
          <template #default="scope">
            <span>{{ scope.row.current }}/{{ scope.row.total }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="120">
          <template #default="scope">
            <span>{{ scope.row.success_count }}/{{ scope.row.fail_count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="last_error" label="失败原因" min-width="200" />
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button size="small" :loading="runningTaskId === scope.row.id" @click="runTask(scope.row.id)">运行</el-button>
            <el-button size="small" @click="openLog(scope.row.id)">日志</el-button>
            <el-button v-if="scope.row.status !== 'running'" size="small" @click="openReports(scope.row.id)">报告</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex; justify-content: space-between; align-items:center;">
          <span>已存事故摘要</span>
          <div style="display:flex; align-items:center; gap:10px;">
            <el-input v-model="filters.q" placeholder="关键词/地点" style="width: 220px;" />
            <el-select v-model="filters.accident_type" placeholder="事故类型" style="width: 140px;">
              <el-option label="全部" value="" />
              <el-option label="坍塌事故" value="坍塌事故" />
              <el-option label="火灾事故" value="火灾事故" />
              <el-option label="爆炸事故" value="爆炸事故" />
              <el-option label="触电事故" value="触电事故" />
              <el-option label="其他" value="其他" />
            </el-select>
            <el-select v-model="filters.casualties_level" placeholder="伤亡等级" style="width: 120px;">
              <el-option label="不限" value="" />
              <el-option label="死亡" value="死亡" />
              <el-option label="受伤" value="受伤" />
              <el-option label="重伤" value="重伤" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 260px;"
            />
            <el-button type="primary" :loading="loadingReports" @click="loadReports">检索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="reports" style="width: 100%;">
        <el-table-column prop="occurred_at" label="事故时间" width="120" />
        <el-table-column prop="location" label="地点" width="160" />
        <el-table-column prop="accident_type" label="类型" width="120" />
        <el-table-column prop="casualties" label="伤亡" width="140" />
        <el-table-column prop="report_no" label="报告编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="240" />
        <el-table-column label="链接" width="120">
          <template #default="scope">
            <el-link v-if="scope.row.report_url" :href="scope.row.report_url" target="_blank">报告</el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190">
          <template #default="scope">
            <el-button size="small" @click="reparse(scope.row.id)">重解析</el-button>
            <el-button size="small" type="danger" @click="remove(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex; justify-content:flex-end; margin-top: 12px;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="loadReports"
          @current-change="loadReports"
        />
      </div>
    </el-card>

    <el-dialog v-model="logVisible" title="爬取日志" width="900px" :close-on-press-escape="true">
      <el-skeleton v-if="logLoading" :rows="8" animated />
      <pre v-else style="white-space: pre-wrap; word-break: break-word; margin: 0;">{{ logText }}</pre>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="logVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="reportVisible" title="下载报告" width="720px" :close-on-press-escape="true">
      <div style="display:flex; gap:10px; margin-bottom: 10px;">
        <el-button type="primary" :disabled="!reportZip" @click="() => window.open(reportZip, '_blank')">下载 ZIP</el-button>
      </div>
      <el-table :data="reportLinks.map((u) => ({ url: u }))" style="width:100%;">
        <el-table-column prop="url" label="文件" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="() => window.open(scope.row.url, '_blank')">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="favoriteDialogVisible" title="收藏目标网址" width="520px" :close-on-press-escape="true">
      <el-form :model="favoriteForm" label-width="90px">
        <el-form-item label="网址">
          <el-input v-model="favoriteForm.site_url" disabled />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="favoriteForm.site_name" placeholder="可选，便于检索" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="favoriteForm.tags" multiple filterable allow-create default-first-option style="width: 100%;" placeholder="输入后回车创建">
            <el-option v-for="t in favoriteTagOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="favoriteDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="favoriteSaving" @click="saveFavorite">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="favoriteListVisible" title="收藏清单" width="980px" :close-on-press-escape="true">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 10px;">
        <el-input v-model="favoriteQuery" placeholder="按名称/标签/网址搜索" style="width: 320px;" clearable @input="loadFavorites" />
        <el-button :loading="favoriteListLoading" @click="loadFavorites">刷新</el-button>
        <el-button type="success" :disabled="favoriteSelected.length === 0" @click="confirmImportFavorites">导入到爬取队列</el-button>
      </div>
      <el-table :data="favoriteItems" style="width:100%;" @selection-change="onFavoriteSelection">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="site_name" label="名称" width="200" />
        <el-table-column prop="site_url" label="网址" min-width="320" />
        <el-table-column label="标签" min-width="180">
          <template #default="scope">
            <el-tag v-for="t in scope.row.tags || []" :key="t" style="margin-right: 6px;">{{ t }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="140">
          <template #default="scope">
            <el-button size="small" @click="editFavorite(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="removeFavorite(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display:flex; justify-content:flex-end; margin-top: 12px;">
        <el-pagination
          v-model:current-page="favoritePage"
          v-model:page-size="favoriteSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="favoriteTotal"
          @size-change="loadFavorites"
          @current-change="loadFavorites"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="regexPreviewVisible" title="正则预览" width="980px" :close-on-press-escape="true">
      <el-skeleton v-if="regexPreviewLoading" :rows="8" animated />
      <div v-else>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom: 10px;">
          <div style="color:#666;">发现 {{ regexDiscovered }} 个链接，匹配 {{ regexMatched }} 条，耗时 {{ Math.round(regexElapsedMs) }}ms</div>
          <el-button type="success" :disabled="regexUrls.length === 0" :loading="regexEnqueueLoading" @click="confirmRegexEnqueue">确认入队（{{ regexUrls.length }}）</el-button>
        </div>
        <el-table :data="regexUrls.slice(0, 200).map((u) => ({ url: u }))" style="width: 100%;">
          <el-table-column prop="url" label="URL（最多展示 200 条）" />
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="regexPreviewVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="abVisible" title="策略 A/B 对比" width="900px" :close-on-press-escape="true">
      <el-skeleton v-if="abLoading" :rows="8" animated />
      <div v-else-if="abResult">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="URL">{{ abResult.url }}</el-descriptions-item>
          <el-descriptions-item label="智能策略">{{ JSON.stringify(abResult.smart) }}</el-descriptions-item>
          <el-descriptions-item label="用户策略">{{ JSON.stringify(abResult.user) }}</el-descriptions-item>
          <el-descriptions-item label="智能结果">{{ JSON.stringify(abResult.smart_result) }}</el-descriptions-item>
          <el-descriptions-item label="用户结果">{{ JSON.stringify(abResult.user_result) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="abVisible = false">关闭</el-button>
          <el-button type="primary" :disabled="!abResult" @click="saveExperience">保存为经验策略</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { crawlerApi, type CrawledReportListVO, type CrawledReportVO, type CrawlTaskListVO, type CrawlTaskVO } from '../../api/crawler'
import { favoriteApi, type FavoriteListVO, type FavoriteSiteVO } from '../../api/favorite'
import { crawlerUrlHistory } from '../../utils/crawlerUrlHistory'
import { regexApi } from '../../api/regex'
import { strategyApi } from '../../api/strategy'
import { progressApi, type TaskProgress } from '../../api/progress'

const taskForm = reactive({
  keyword: '',
  targetUrl: '',
  seedUrl: '',
  maxItems: 20,
  maxDepth: 1,
  regexMode: false,
  engine: 'httpx_bs4',
  concurrency: 10
})

const creating = ref(false)
const loadingTasks = ref(false)
const runningTaskId = ref('')
const tasks = ref<CrawlTaskVO[]>([])
const taskQuery = ref('')
const taskStatus = ref('')
const taskDateRange = ref<string[]>([])
const logVisible = ref(false)
const logLoading = ref(false)
const logText = ref('')

const reportVisible = ref(false)
const reportLinks = ref<string[]>([])
const reportZip = ref<string>('')

const isFavorite = ref(false)
const favoriteDialogVisible = ref(false)
const favoriteListVisible = ref(false)
const favoriteSaving = ref(false)
const favoriteForm = reactive<{ id?: string; site_url: string; site_name: string; tags: string[] }>({
  id: '',
  site_url: '',
  site_name: '',
  tags: []
})
const favoriteTagOptions = ref<string[]>([])
const favoriteListLoading = ref(false)
const favoriteItems = ref<FavoriteSiteVO[]>([])
const favoriteSelected = ref<FavoriteSiteVO[]>([])
const favoriteQuery = ref('')
const favoritePage = ref(1)
const favoriteSize = ref(20)
const favoriteTotal = ref(0)

const filters = reactive({
  q: '',
  accident_type: '',
  casualties_level: ''
})

const dateRange = ref<[Date, Date] | null>(null)
const reports = ref<CrawledReportVO[]>([])
const loadingReports = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)

const regexPreviewVisible = ref(false)
const regexPreviewLoading = ref(false)
const regexEnqueueLoading = ref(false)
const regexUrls = ref<string[]>([])
const regexDiscovered = ref(0)
const regexMatched = ref(0)
const regexElapsedMs = ref(0)
const smartCreating = ref(false)
const abVisible = ref(false)
const abLoading = ref(false)
const abResult = ref<any>(null)

const progress = ref<TaskProgress>({
  taskId: '',
  status: '',
  stage: '',
  current: 0,
  total: 0,
  percent: 0,
  startTime: null,
  eta: null,
  traceId: ''
})
const progressVisible = ref(false)
const progressElapsed = ref(0)
let progressTimer: any = null
let progressSource: EventSource | null = null

const loadTasks = async () => {
  loadingTasks.value = true
  try {
    const start_time = taskDateRange.value?.[0] ? `${taskDateRange.value[0]}T00:00:00Z` : ''
    const end_time = taskDateRange.value?.[1] ? `${taskDateRange.value[1]}T23:59:59Z` : ''
    const res = await crawlerApi.listTasks({ page: 1, size: 50, q: taskQuery.value.trim(), status: taskStatus.value, start_time, end_time })
    const data = res.data as CrawlTaskListVO
    tasks.value = Array.isArray(data.items) ? data.items : []
  } finally {
    loadingTasks.value = false
  }
}

const createTask = async () => {
  if (!taskForm.keyword.trim() || !taskForm.targetUrl.trim()) {
    ElMessage.error(taskForm.regexMode ? '请输入关键词与正则表达式' : '请输入关键词与目标网址')
    return
  }
  if (taskForm.regexMode) {
    await openRegexPreview()
    return
  }
  creating.value = true
  try {
    await crawlerUrlHistory.add(taskForm.targetUrl.trim())
    await crawlerApi.createTask({
      keyword: taskForm.keyword.trim(),
      target_url: taskForm.targetUrl.trim(),
      max_items: taskForm.maxItems,
      max_depth: taskForm.maxDepth,
      engine: taskForm.engine,
      concurrency: taskForm.concurrency
    })
    ElMessage.success('已创建')
    await loadTasks()
    await refreshFavoriteState()
  } finally {
    creating.value = false
  }
}

const runTask = async (id: string) => {
  runningTaskId.value = id
  try {
    startProgressPoll(id)
    await crawlerApi.runTask(id)
    ElMessage.success('已触发运行')
    await loadTasks()
  } finally {
    runningTaskId.value = ''
  }
}

const openReports = async (id: string) => {
  const res = await crawlerApi.listTaskReports(id)
  const data = (res as any).data || {}
  reportLinks.value = Array.isArray(data.links) ? data.links : []
  reportZip.value = String(data.zip || '')
  reportVisible.value = true
}

const openLog = async (id: string) => {
  logVisible.value = true
  logLoading.value = true
  logText.value = ''
  try {
    const res = await crawlerApi.getTaskLog(id, { tail: 20000 })
    const data = res.data as any
    logText.value = String(data?.text || '')
  } finally {
    logLoading.value = false
  }
}

const queryHistory = async (queryString: string, cb: (results: Array<{ value: string }>) => void) => {
  const list = await crawlerUrlHistory.list(queryString)
  cb(list.map((u) => ({ value: u })))
}

const onHistorySelect = async (item: { value: string }) => {
  taskForm.targetUrl = String(item?.value || '')
  await crawlerUrlHistory.add(taskForm.targetUrl)
  await refreshFavoriteState()
}

const clearUrlHistory = async () => {
  await ElMessageBox.confirm('确认清除全部网址历史记录？', '提示', { type: 'warning' })
  await crawlerUrlHistory.clearAll()
  ElMessage.success('已清除')
}

const onModeChange = async () => {
  regexUrls.value = []
  if (!taskForm.regexMode) {
    await refreshFavoriteState()
  } else {
    isFavorite.value = false
  }
}

const openRegexPreview = async () => {
  if (!taskForm.seedUrl.trim()) {
    ElMessage.error('请输入种子网址（列表页）')
    return
  }
  regexPreviewLoading.value = true
  regexPreviewVisible.value = true
  try {
    const res = await regexApi.preview({
      seed_url: taskForm.seedUrl.trim(),
      regex: taskForm.targetUrl.trim(),
      max_preview: 1000,
      timeout_seconds: 3
    })
    const data = (res as any).data || {}
    regexUrls.value = Array.isArray(data.urls) ? data.urls : []
    regexDiscovered.value = Number(data.discovered || 0)
    regexMatched.value = Number(data.matched || 0)
    regexElapsedMs.value = Number(data.elapsed_ms || 0)
  } finally {
    regexPreviewLoading.value = false
  }
}

const confirmRegexEnqueue = async () => {
  await ElMessageBox.confirm(`确认将 ${regexUrls.value.length} 条 URL 拆分为任务入队？`, '提示', { type: 'warning' })
  regexEnqueueLoading.value = true
  try {
    const res = await regexApi.enqueue({
      keyword: taskForm.keyword.trim(),
      seed_url: taskForm.seedUrl.trim(),
      regex: taskForm.targetUrl.trim(),
      max_urls: 1000,
      max_depth: 0,
      engine: taskForm.engine,
      concurrency: taskForm.concurrency
    })
    const data = (res as any).data || {}
    ElMessage.success(`已入队批次 ${String(data.batch_id || '')}，任务数 ${Number(data.created_tasks || 0)}`)
    regexPreviewVisible.value = false
    await loadTasks()
  } finally {
    regexEnqueueLoading.value = false
  }
}

const createSmartTask = async () => {
  if (!taskForm.keyword.trim() || !taskForm.targetUrl.trim()) {
    ElMessage.error('请输入关键词与目标网址')
    return
  }
  smartCreating.value = true
  try {
    await crawlerUrlHistory.add(taskForm.targetUrl.trim())
    const res = await strategyApi.smartTask({
      keyword: taskForm.keyword.trim(),
      target_url: taskForm.targetUrl.trim(),
      max_items: taskForm.maxItems,
      max_depth: taskForm.maxDepth
    })
    const data = (res as any).data || {}
    const tid = String(data?.task?.id || '')
    ElMessage.success(`已按智能策略创建任务：${data?.task?.engine || ''}`)
    if (tid) {
      startProgressPoll(tid)
      await crawlerApi.runTask(tid)
    }
    await loadTasks()
  } finally {
    smartCreating.value = false
  }
}

const runABCompare = async () => {
  if (!taskForm.targetUrl.trim()) {
    ElMessage.error('请先输入目标网址')
    return
  }
  abVisible.value = true
  abLoading.value = true
  try {
    const res = await strategyApi.compareAB({
      url: taskForm.targetUrl.trim(),
      strategy: { engine: taskForm.engine, concurrency: taskForm.concurrency }
    })
    abResult.value = (res as any).data || null
  } finally {
    abLoading.value = false
  }
}

const saveExperience = async () => {
  if (!abResult.value) return
  const name = `经验策略-${Date.now()}`
  await strategyApi.saveExperience({
    url: taskForm.targetUrl.trim(),
    name,
    description: '由 A/B 对比保存',
    strategy: abResult.value.user || { engine: taskForm.engine, concurrency: taskForm.concurrency }
  })
  ElMessage.success('已保存经验策略')
}

const refreshFavoriteState = async () => {
  const url = taskForm.targetUrl.trim()
  if (!url) {
    isFavorite.value = false
    return
  }
  const res = await favoriteApi.lookup(url).catch(() => null)
  const data = (res as any)?.data || {}
  isFavorite.value = Boolean(data.found)
}

const openFavoriteDialog = async () => {
  const url = taskForm.targetUrl.trim()
  if (!url) {
    ElMessage.error('请先输入目标网址')
    return
  }
  const res = await favoriteApi.lookup(url).catch(() => null)
  const data = (res as any)?.data || {}
  if (data.found && data.item) {
    favoriteForm.id = data.item.id
    favoriteForm.site_url = data.item.site_url
    favoriteForm.site_name = data.item.site_name || ''
    favoriteForm.tags = Array.isArray(data.item.tags) ? data.item.tags : []
  } else {
    favoriteForm.id = ''
    favoriteForm.site_url = url
    favoriteForm.site_name = ''
    favoriteForm.tags = []
  }
  favoriteDialogVisible.value = true
}

const saveFavorite = async () => {
  favoriteSaving.value = true
  try {
    const payload = { site_url: favoriteForm.site_url, site_name: favoriteForm.site_name, tags: favoriteForm.tags }
    if (favoriteForm.id) {
      await favoriteApi.update(favoriteForm.id, { site_name: payload.site_name, tags: payload.tags })
      ElMessage.success('已更新')
    } else {
      const res = await favoriteApi.create(payload)
      const data = (res as any)?.data || {}
      if (data.existed) ElMessage.info('已收藏')
      else ElMessage.success('已收藏')
      favoriteForm.id = data?.item?.id || ''
    }
    isFavorite.value = true
    favoriteTagOptions.value = Array.from(new Set([...favoriteTagOptions.value, ...favoriteForm.tags])).slice(0, 100)
    favoriteDialogVisible.value = false
  } finally {
    favoriteSaving.value = false
  }
}

const openFavoriteList = async () => {
  favoriteListVisible.value = true
  favoritePage.value = 1
  await loadFavorites()
}

const loadFavorites = async () => {
  favoriteListLoading.value = true
  try {
    const res = await favoriteApi.list({ page: favoritePage.value, size: favoriteSize.value, q: favoriteQuery.value.trim() })
    const data = (res as any).data as FavoriteListVO
    favoriteItems.value = Array.isArray(data.items) ? data.items : []
    favoriteTotal.value = Number(data.total || 0)
    favoriteTagOptions.value = Array.from(new Set(favoriteItems.value.flatMap((x) => x.tags || []))).slice(0, 200)
  } finally {
    favoriteListLoading.value = false
  }
}

const onFavoriteSelection = (rows: FavoriteSiteVO[]) => {
  favoriteSelected.value = Array.isArray(rows) ? rows : []
}

const confirmImportFavorites = async () => {
  if (!taskForm.keyword.trim()) {
    ElMessage.error('请先输入关键词')
    return
  }
  const count = favoriteSelected.value.length
  await ElMessageBox.confirm(`确认导入 ${count} 条收藏网址到爬取队列？`, '提示', { type: 'warning' })
  for (const it of favoriteSelected.value) {
    await crawlerApi.createTask({ keyword: taskForm.keyword.trim(), target_url: it.site_url, max_items: taskForm.maxItems, max_depth: taskForm.maxDepth })
  }
  ElMessage.success(`已导入 ${count} 条`)
  await loadTasks()
}

const editFavorite = async (row: FavoriteSiteVO) => {
  favoriteForm.id = row.id
  favoriteForm.site_url = row.site_url
  favoriteForm.site_name = row.site_name || ''
  favoriteForm.tags = Array.isArray(row.tags) ? row.tags : []
  favoriteDialogVisible.value = true
}

const removeFavorite = async (row: FavoriteSiteVO) => {
  await ElMessageBox.confirm('确认删除该收藏？', '提示', { type: 'warning' })
  await favoriteApi.remove(row.id)
  ElMessage.success('已删除')
  await loadFavorites()
  await refreshFavoriteState()
}

const loadReports = async () => {
  loadingReports.value = true
  try {
    const start = dateRange.value?.[0] ? dateRange.value[0].toISOString().slice(0, 10) : ''
    const end = dateRange.value?.[1] ? dateRange.value[1].toISOString().slice(0, 10) : ''
    const res = await crawlerApi.listReports({
      q: filters.q.trim(),
      accident_type: filters.accident_type,
      casualties_level: filters.casualties_level,
      start_date: start,
      end_date: end,
      page: page.value,
      size: size.value,
      sort_by: 'created_at',
      sort_order: 'desc'
    })
    const data = res.data as CrawledReportListVO
    reports.value = Array.isArray(data.items) ? data.items : []
    total.value = Number(data.total || 0)
  } finally {
    loadingReports.value = false
  }
}

const remove = async (id: string) => {
  await ElMessageBox.confirm('确认删除该报告？', '提示', { type: 'warning' })
  await crawlerApi.deleteReport(id)
  ElMessage.success('已删除')
  await loadReports()
}

const reparse = async (id: string) => {
  await crawlerApi.reparseReport(id)
  ElMessage.success('已重解析')
  await loadReports()
}

onMounted(async () => {
  await loadTasks()
  await loadReports()
})

const startProgressPoll = (taskId: string) => {
  stopProgressPoll()
  progressVisible.value = true

  const apply = (data: TaskProgress) => {
    progress.value = data
    progressElapsed.value = data.startTime ? Math.max(0, Math.floor((Date.now() - Date.parse(data.startTime)) / 1000)) : 0
    if (data.status !== 'running') {
      stopProgressPoll()
      if (data.status === 'failed') {
        ElMessageBox.alert(`任务失败：${data.lastError || ''}\ntraceId: ${data.traceId || '-'}`, '失败', { type: 'error' })
      }
    }
  }

  try {
    progressSource = new EventSource(`/api/progress/${encodeURIComponent(taskId)}/stream`)
    progressSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as TaskProgress
        apply(data)
      } catch {}
    }
    progressSource.onerror = () => {
      if (progressSource) {
        progressSource.close()
        progressSource = null
      }
      startProgressPollFallback(taskId, apply)
    }
  } catch {
    startProgressPollFallback(taskId, apply)
  }
}

const startProgressPollFallback = (taskId: string, apply: (data: TaskProgress) => void) => {
  const tick = async () => {
    const res = await progressApi.get(taskId).catch(() => null)
    const data = (res as any)?.data as TaskProgress
    if (!data) return
    apply(data)
  }
  progressTimer = setInterval(tick, 1000)
  tick()
}

const stopProgressPoll = () => {
  if (progressSource) {
    progressSource.close()
    progressSource = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  progressVisible.value = false
}
</script>

<style scoped>
.crawler-admin {
  padding: 8px 0;
}
.target-url {
  display: flex;
  align-items: center;
  gap: 8px;
}
.favorite-btn {
  border-color: #f5c542;
}
:deep(.crawler-history-popper .el-autocomplete-suggestion__wrap) {
  max-height: 320px;
}
</style>
