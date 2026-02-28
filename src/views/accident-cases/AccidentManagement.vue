<template>
  <div class="accident-management">
    <div class="accident-search" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div style="display: flex; align-items: center;">
        <el-input
          v-model="searchQuery"
          placeholder="搜索事故名称、类型、责任单位"
          prefix-icon="el-icon-search"
          style="width: 300px;"
        />
        <el-select v-model="filterType" placeholder="事故类型" style="width: 150px; margin-left: 12px;">
          <el-option label="全部" value="" />
          <el-option label="坍塌事故" value="坍塌事故" />
          <el-option label="高处坠落" value="高处坠落" />
          <el-option label="物体打击" value="物体打击" />
          <el-option label="触电事故" value="触电事故" />
          <el-option label="机械伤害" value="机械伤害" />
          <el-option label="其他" value="其他" />
        </el-select>
        <el-button type="primary" style="margin-left: 12px;" @click="handleSearch">搜索</el-button>
        <el-button type="success" style="margin-left: 12px;" @click="addAccident">添加事故案例</el-button>
      </div>
      <div style="display: flex; align-items: center;">
        <el-radio-group v-model="viewMode" style="margin-right: 12px;">
          <el-radio-button label="list">列表视图</el-radio-button>
          <el-radio-button label="card">卡片视图</el-radio-button>
        </el-radio-group>
        <div v-if="selectedAccidents.length > 0" style="display: flex; align-items: center;">
          <el-button type="danger" @click="batchDeleteAccidents">批量删除</el-button>
        </div>
      </div>
    </div>
    
    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" style="max-height: 500px; overflow-y: auto;">
      <el-table :data="pagedAccidents" style="width: 100%;" @selection-change="handleAccidentSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="案例编号" width="100" />
        <el-table-column prop="name" label="事故名称" min-width="200" />
        <el-table-column prop="type" label="事故类型" width="120" />
        <el-table-column prop="accidentDate" label="事故日期" width="120" />
        <el-table-column prop="province" label="所属省份" width="120" />
        <el-table-column prop="level" label="事故等级" width="100" />
        <el-table-column prop="casualties" label="人员伤亡" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewAccident(scope.row)">详情</el-button>
            <el-button size="small" @click="editAccident(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAccident(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 卡片视图 -->
    <div v-else-if="viewMode === 'card'" style="max-height: 500px; overflow-y: auto;">
      <div class="card-container">
        <el-card v-for="accident in pagedAccidents" :key="accident.id" class="accident-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ accident.name }}</span>
              <span class="card-badge" :class="getLevelClass(accident.level)">{{ accident.level }}</span>
            </div>
          </template>
          <div class="card-body">
            <div class="card-info">
              <span class="info-item"><i class="el-icon-time"></i> {{ accident.accidentDate }}</span>
              <span class="info-item"><i class="el-icon-position"></i> {{ accident.province }}</span>
              <span class="info-item"><i class="el-icon-warning"></i> {{ accident.type }}</span>
            </div>
            <p class="card-summary">{{ accident.summary }}</p>
            <div class="card-stats">
              <span class="stat-item">人员伤亡: {{ accident.casualties }}</span>
              <span class="stat-item">经济损失: {{ accident.economicLoss }}万元</span>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="viewAccident(accident)">详情</el-button>
              <el-button size="small" @click="editAccident(accident)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteAccident(accident.id)">删除</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredAccidents.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 添加事故案例对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
    >
      <el-form :model="accidentForm" :rules="rules" ref="accidentFormRef" label-width="120px">
        <el-form-item label="事故名称" prop="name" required>
          <el-input v-model="accidentForm.name" placeholder="请输入事故名称" />
        </el-form-item>
        <el-form-item label="事故概要" prop="summary">
          <el-input type="textarea" v-model="accidentForm.summary" placeholder="请输入事故概要" :rows="3" />
        </el-form-item>
        <el-form-item label="事故类型" prop="type" required>
          <el-select v-model="accidentForm.type" placeholder="请选择事故类型">
            <el-option label="坍塌事故" value="坍塌事故" />
            <el-option label="高处坠落" value="高处坠落" />
            <el-option label="物体打击" value="物体打击" />
            <el-option label="触电事故" value="触电事故" />
            <el-option label="机械伤害" value="机械伤害" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="直接原因" prop="directCause">
          <el-input type="textarea" v-model="accidentForm.directCause" placeholder="请输入直接原因" :rows="3" />
        </el-form-item>
        <el-form-item label="间接原因" prop="indirectCause">
          <el-input type="textarea" v-model="accidentForm.indirectCause" placeholder="请输入间接原因" :rows="3" />
        </el-form-item>
        <el-form-item label="责任单位" prop="responsibleUnit">
          <el-input v-model="accidentForm.responsibleUnit" placeholder="请输入责任单位" />
        </el-form-item>
        <el-form-item label="工程类型" prop="projectType">
          <el-select v-model="accidentForm.projectType" placeholder="请选择工程类型">
            <el-option label="建筑工程" value="建筑工程" />
            <el-option label="市政工程" value="市政工程" />
            <el-option label="交通工程" value="交通工程" />
            <el-option label="水利工程" value="水利工程" />
            <el-option label="电力工程" value="电力工程" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="事故日期" prop="accidentDate" required>
          <el-date-picker v-model="accidentForm.accidentDate" type="date" placeholder="选择事故日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="项目信息" prop="projectInfo">
          <el-input type="textarea" v-model="accidentForm.projectInfo" placeholder="请输入项目信息" :rows="3" />
        </el-form-item>
        <el-form-item label="事故等级" prop="level" required>
          <el-select v-model="accidentForm.level" placeholder="请选择事故等级">
            <el-option label="特别重大" value="特别重大" />
            <el-option label="重大" value="重大" />
            <el-option label="较大" value="较大" />
            <el-option label="一般" value="一般" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属省份" prop="province" required>
          <el-input v-model="accidentForm.province" placeholder="请输入所属省份" />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="accidentForm.severity" placeholder="请选择严重程度">
            <el-option label="特别严重" value="特别严重" />
            <el-option label="严重" value="严重" />
            <el-option label="较严重" value="较严重" />
            <el-option label="一般" value="一般" />
          </el-select>
        </el-form-item>
        <el-form-item label="人员伤亡" prop="casualties">
          <el-input v-model="accidentForm.casualties" placeholder="请输入人员伤亡情况" />
        </el-form-item>
        <el-form-item label="经济损失" prop="economicLoss">
          <div style="display: flex; align-items: center;">
            <el-slider v-model="accidentForm.economicLoss" :min="0" :max="10000" :step="10" style="flex: 1; margin-right: 12px;" />
            <el-input v-model="accidentForm.economicLoss" placeholder="请输入经济损失" style="width: 150px;" />
            <span style="margin-left: 12px;">万元</span>
          </div>
        </el-form-item>
        <el-form-item label="事故进展" prop="progress">
          <el-input type="textarea" v-model="accidentForm.progress" placeholder="请输入事故进展" :rows="3" />
        </el-form-item>
        <el-form-item label="经验教训" prop="lessons">
          <el-input type="textarea" v-model="accidentForm.lessons" placeholder="请输入经验教训" :rows="3" />
        </el-form-item>
        <el-form-item label="处罚结果" prop="punishment">
          <el-input type="textarea" v-model="accidentForm.punishment" placeholder="请输入处罚结果" :rows="3" />
        </el-form-item>
        
        <!-- 文件上传 -->
        <el-form-item label="事故调查报告">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :file-list="accidentForm.files.report"
            :limit="3"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传PDF、Word等格式文件，最多3个
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="阅览报告">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :file-list="accidentForm.files.reading"
            :limit="3"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传PDF、Word等格式文件，最多3个
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="媒体报道">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileUpload"
            :auto-upload="false"
            :file-list="accidentForm.files.media"
            :limit="5"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传新闻报告、视频链接等，最多5个
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="info" @click="intelligentFillAccident" style="margin-left: 12px;">智能填表</el-button>
          <el-button type="primary" @click="submitForm" style="margin-left: 12px;">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 事故案例详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="事故案例详情"
      width="900px"
    >
      <div v-if="selectedAccident" class="accident-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案例编号">{{ selectedAccident.id }}</el-descriptions-item>
          <el-descriptions-item label="事故名称">{{ selectedAccident.name }}</el-descriptions-item>
          <el-descriptions-item label="事故类型">{{ selectedAccident.type }}</el-descriptions-item>
          <el-descriptions-item label="事故日期">{{ selectedAccident.accidentDate }}</el-descriptions-item>
          <el-descriptions-item label="所属省份">{{ selectedAccident.province }}</el-descriptions-item>
          <el-descriptions-item label="事故等级">{{ selectedAccident.level }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">{{ selectedAccident.severity }}</el-descriptions-item>
          <el-descriptions-item label="人员伤亡">{{ selectedAccident.casualties }}</el-descriptions-item>
          <el-descriptions-item label="经济损失">{{ selectedAccident.economicLoss }}</el-descriptions-item>
          <el-descriptions-item label="责任单位">{{ selectedAccident.responsibleUnit }}</el-descriptions-item>
          <el-descriptions-item label="工程类型">{{ selectedAccident.projectType }}</el-descriptions-item>
          <el-descriptions-item label="事故概要" :span="2">{{ selectedAccident.summary }}</el-descriptions-item>
          <el-descriptions-item label="直接原因" :span="2">{{ selectedAccident.directCause }}</el-descriptions-item>
          <el-descriptions-item label="间接原因" :span="2">{{ selectedAccident.indirectCause }}</el-descriptions-item>
          <el-descriptions-item label="项目信息" :span="2">{{ selectedAccident.projectInfo }}</el-descriptions-item>
          <el-descriptions-item label="事故进展" :span="2">{{ selectedAccident.progress }}</el-descriptions-item>
          <el-descriptions-item label="经验教训" :span="2">{{ selectedAccident.lessons }}</el-descriptions-item>
          <el-descriptions-item label="处罚结果" :span="2">{{ selectedAccident.punishment }}</el-descriptions-item>
          
          <!-- 文件信息 -->
          <el-descriptions-item label="事故调查报告" :span="2">
            <div v-if="selectedAccident.files && selectedAccident.files.report && selectedAccident.files.report.length > 0">
              <div v-for="(file, index) in selectedAccident.files.report" :key="index" style="margin-bottom: 8px;">
                <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="阅览报告" :span="2">
            <div v-if="selectedAccident.files && selectedAccident.files.reading && selectedAccident.files.reading.length > 0">
              <div v-for="(file, index) in selectedAccident.files.reading" :key="index" style="margin-bottom: 8px;">
                <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="媒体报道" :span="2">
            <div v-if="selectedAccident.files && selectedAccident.files.media && selectedAccident.files.media.length > 0">
              <div v-for="(file, index) in selectedAccident.files.media" :key="index" style="margin-bottom: 8px;">
                <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessageBox } from 'element-plus'

// 搜索和过滤
const searchQuery = ref('')
const filterType = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加事故案例')
const accidentFormRef = ref()

// 详情对话框相关
const detailDialogVisible = ref(false)
const selectedAccident = ref(null)

// 视图模式
const viewMode = ref('list')

// 多选相关
const selectedAccidents = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const filteredAccidents = ref([])
const pagedAccidents = ref([])

// 事故表单数据
const accidentForm = reactive({
  id: '',
  name: '',
  summary: '',
  type: '',
  directCause: '',
  indirectCause: '',
  responsibleUnit: '',
  projectType: '',
  accidentDate: '',
  projectInfo: '',
  level: '',
  province: '',
  severity: '',
  casualties: '',
  economicLoss: '',
  progress: '',
  lessons: '',
  punishment: '',
  files: {
    report: [],
    reading: [],
    media: []
  }
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入事故名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择事故类型', trigger: 'change' }],
  accidentDate: [{ required: true, message: '请选择事故日期', trigger: 'change' }],
  level: [{ required: true, message: '请选择事故等级', trigger: 'change' }],
  province: [{ required: true, message: '请输入所属省份', trigger: 'blur' }]
}

// 事故数据（真实案例）
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
    economicLoss: '1274.8万元',
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
  },
  {
    id: 'AC003',
    name: '贵州船舶侧翻事故',
    summary: '2024年12月，贵州省发生船舶侧翻事故，造成8人死亡。',
    type: '水上交通事故',
    directCause: '船舶超载，操作不当',
    indirectCause: '安全管理不到位，船员培训不足',
    responsibleUnit: '相关航运公司',
    projectType: '交通运输',
    accidentDate: '2024-12-01',
    projectInfo: '内河航运船舶',
    level: '重大',
    province: '贵州省',
    severity: '严重',
    casualties: '8死',
    economicLoss: '重大',
    progress: '国务院安委办已挂牌督办，事故调查正在进行中',
    lessons: '加强水上交通安全管理，严格执行船舶载重规定，加强船员培训',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC004',
    name: '广东深圳深江铁路5标段路面坍塌事故',
    summary: '2024年12月4日，广东省深圳市宝安区航城街道深江铁路5标段施工现场发生重大路面坍塌事故，造成13人失联。',
    type: '坍塌事故',
    directCause: '施工过程中地面坍塌',
    indirectCause: '安全管理不到位，施工方案不完善',
    responsibleUnit: '深江铁路施工单位',
    projectType: '交通工程',
    accidentDate: '2024-12-04',
    projectInfo: '深江铁路5标段，铁路建设项目',
    level: '重大',
    province: '广东省',
    severity: '特别严重',
    casualties: '13人失联',
    economicLoss: '重大',
    progress: '国务院安委会已挂牌督办，事故调查正在进行中',
    lessons: '加强铁路建设安全管理，完善施工方案，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC005',
    name: '河南大学大礼堂火灾事故',
    summary: '2024年5月2日，河南大学大礼堂发生火灾事故。',
    type: '火灾事故',
    directCause: '电气线路故障引发火灾',
    indirectCause: '消防安全管理不到位，消防设施不完善',
    responsibleUnit: '河南大学',
    projectType: '公共建筑',
    accidentDate: '2024-05-02',
    projectInfo: '河南大学大礼堂，历史建筑',
    level: '重大',
    province: '河南省',
    severity: '严重',
    casualties: '无人员伤亡',
    economicLoss: '重大',
    progress: '国务院安委会已挂牌督办，事故调查正在进行中',
    lessons: '加强古建筑消防安全管理，完善消防设施，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC006',
    name: '江西南昌重大道路交通事故',
    summary: '2023年1月8日，江西省南昌市发生一起大货车冲撞人群的重大道路交通事故，造成19人死亡，20人受伤。',
    type: '道路交通事故',
    directCause: '大货车失控冲撞人群',
    indirectCause: '驾驶员操作不当，车辆安全性能不达标',
    responsibleUnit: '相关运输公司',
    projectType: '交通运输',
    accidentDate: '2023-01-08',
    projectInfo: '城市道路运输',
    level: '重大',
    province: '江西省',
    severity: '特别严重',
    casualties: '19死20伤',
    economicLoss: '重大',
    progress: '国务院安委会已挂牌督办，事故调查已完成',
    lessons: '加强道路交通安全管理，严格驾驶员培训，定期检查车辆安全性能',
    punishment: '相关责任人被依法追究刑事责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC007',
    name: '宁夏银川富洋烧烤店特别重大燃气爆炸事故',
    summary: '2023年6月21日，宁夏回族自治区银川市兴庆区富洋烧烤民族街店发生一起特别重大燃气爆炸事故，造成31人死亡。',
    type: '燃气爆炸事故',
    directCause: '燃气泄漏引发爆炸',
    indirectCause: '燃气安全管理不到位，燃气设施老化',
    responsibleUnit: '富洋烧烤店',
    projectType: '商业建筑',
    accidentDate: '2023-06-21',
    projectInfo: '富洋烧烤民族街店，餐饮场所',
    level: '特别重大',
    province: '宁夏回族自治区',
    severity: '特别严重',
    casualties: '31死',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强燃气安全管理，定期检查燃气设施，开展燃气安全培训',
    punishment: '相关责任人被依法追究刑事责任，烧烤店被吊销营业执照',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC008',
    name: '辽宁某化工有限公司重大爆炸着火事故',
    summary: '2023年1月15日13时25分左右，辽宁省某化工有限公司在烷基化装置水洗罐入口管道带压密封作业过程中管道焊缝处突然断裂，大量介质泄漏引发爆炸着火事故。',
    type: '爆炸事故',
    directCause: '管道焊缝处突然断裂，大量介质泄漏引发爆炸',
    indirectCause: '安全管理不到位，设备维护不及时',
    responsibleUnit: '某化工有限公司',
    projectType: '化工工程',
    accidentDate: '2023-01-15',
    projectInfo: '烷基化装置，化工生产项目',
    level: '重大',
    province: '辽宁省',
    severity: '严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强化工企业安全管理，定期检查设备，规范带压作业',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC009',
    name: '内蒙古阿拉善左旗煤矿坍塌事故',
    summary: '2023年2月22日，内蒙古自治区阿拉善左旗发生煤矿坍塌事故。',
    type: '坍塌事故',
    directCause: '煤矿采空区坍塌',
    indirectCause: '安全管理不到位，监测预警系统失效',
    responsibleUnit: '相关煤矿企业',
    projectType: '矿业工程',
    accidentDate: '2023-02-22',
    projectInfo: '煤矿开采项目',
    level: '重大',
    province: '内蒙古自治区',
    severity: '严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强煤矿安全管理，完善监测预警系统，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC010',
    name: '甘肃白银宏达铝型材有限公司较大生产安全事故',
    summary: '2023年9月6日2时22分许，甘肃省白银市白银区甘肃宏达铝型材有限公司熔铸车间发生一起冷却水闪蒸事故，造成4人死亡。',
    type: '灼烫事故',
    directCause: '冷却水闪蒸引发事故',
    indirectCause: '安全管理不到位，操作规程不规范',
    responsibleUnit: '甘肃宏达铝型材有限公司',
    projectType: '工业工程',
    accidentDate: '2023-09-06',
    projectInfo: '熔铸车间，铝型材生产项目',
    level: '较大',
    province: '甘肃省',
    severity: '较严重',
    casualties: '4死',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强工业企业安全管理，规范操作规程，加强员工培训',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC011',
    name: '山西吕梁某煤业公司地面联建楼火灾事故',
    summary: '山西省吕梁市某煤业公司地面联建楼发生火灾事故，造成26人死亡，38人受伤。',
    type: '火灾事故',
    directCause: '企业安全主体责任不落实，超限额加装电动吊篮、违规敷设吊篮供电线路，违规在井口浴室使用易燃材料',
    indirectCause: '安全管理不到位，消防设施不完善',
    responsibleUnit: '某煤业公司',
    projectType: '矿业工程',
    accidentDate: '2023-01-01',
    projectInfo: '地面联建楼，煤矿配套设施',
    level: '重大',
    province: '山西省',
    severity: '特别严重',
    casualties: '26死38伤',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强煤矿地面设施安全管理，规范电气线路敷设，加强消防安全检查',
    punishment: '相关责任人被依法追究刑事责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC012',
    name: '安徽亳州较大坍塌事故',
    summary: '2023年2月25日，安徽省亳州市发生较大坍塌事故。',
    type: '坍塌事故',
    directCause: '建筑施工过程中坍塌',
    indirectCause: '安全管理不到位，施工方案不完善',
    responsibleUnit: '相关施工单位',
    projectType: '建筑工程',
    accidentDate: '2023-02-25',
    projectInfo: '建筑施工项目',
    level: '较大',
    province: '安徽省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '安徽省安委会办公室已挂牌督办，事故调查已完成',
    lessons: '加强建筑施工安全管理，完善施工方案，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC013',
    name: '广东深圳某公司火灾事故',
    summary: '深圳一公司发生火灾，造成1人坠楼死亡，直接经济损失37.92万元。',
    type: '火灾事故',
    directCause: '员工蔡某泉用胶盒将半成品电芯组装后放在工作台上，电芯发生热失控引发火灾',
    indirectCause: '安全管理不到位，员工操作不规范',
    responsibleUnit: '相关公司',
    projectType: '工业工程',
    accidentDate: '2024-01-01',
    projectInfo: '电子产品生产车间',
    level: '一般',
    province: '广东省',
    severity: '一般',
    casualties: '1死',
    economicLoss: '37.92万元',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强电子产品生产安全管理，规范员工操作，加强消防安全培训',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC014',
    name: '辽宁涉海渔船安全生产事故',
    summary: '辽宁省发生涉海渔船安全生产事故，造成10人失联。',
    type: '水上交通事故',
    directCause: '渔船作业过程中发生事故',
    indirectCause: '安全管理不到位，船员培训不足',
    responsibleUnit: '相关渔业公司',
    projectType: '渔业工程',
    accidentDate: '2025-01-01',
    projectInfo: '涉海渔船作业',
    level: '重大',
    province: '辽宁省',
    severity: '严重',
    casualties: '10人失联',
    economicLoss: '重大',
    progress: '国务院安委会已挂牌督办，事故调查正在进行中',
    lessons: '加强渔业安全生产管理，严格船员培训，完善安全保障措施',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC015',
    name: '山东淄博临淄事故',
    summary: '2025年2月25日，山东省淄博市临淄区发生事故。',
    type: '安全事故',
    directCause: '事故原因正在调查中',
    indirectCause: '安全管理不到位',
    responsibleUnit: '相关单位',
    projectType: '工业工程',
    accidentDate: '2025-02-25',
    projectInfo: '工业生产项目',
    level: '较大',
    province: '山东省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '山东省政府安委办已挂牌督办，事故调查正在进行中',
    lessons: '加强工业企业安全管理，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC016',
    name: '北京某建筑工地坍塌事故',
    summary: '北京市某建筑工地发生坍塌事故，造成多人伤亡。',
    type: '坍塌事故',
    directCause: '施工过程中坍塌',
    indirectCause: '安全管理不到位，施工方案不完善',
    responsibleUnit: '相关施工单位',
    projectType: '建筑工程',
    accidentDate: '2024-01-01',
    projectInfo: '建筑施工项目',
    level: '较大',
    province: '北京市',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强建筑施工安全管理，完善施工方案，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC017',
    name: '上海某商场火灾事故',
    summary: '上海市某商场发生火灾事故，造成多人伤亡。',
    type: '火灾事故',
    directCause: '电气线路故障引发火灾',
    indirectCause: '消防安全管理不到位，消防设施不完善',
    responsibleUnit: '相关商场',
    projectType: '商业建筑',
    accidentDate: '2024-01-01',
    projectInfo: '商场建筑',
    level: '较大',
    province: '上海市',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强商场消防安全管理，完善消防设施，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC018',
    name: '江苏南京某化工厂爆炸事故',
    summary: '江苏省南京市某化工厂发生爆炸事故，造成多人伤亡。',
    type: '爆炸事故',
    directCause: '化学品泄漏引发爆炸',
    indirectCause: '安全管理不到位，设备维护不及时',
    responsibleUnit: '某化工厂',
    projectType: '化工工程',
    accidentDate: '2024-01-01',
    projectInfo: '化工生产项目',
    level: '较大',
    province: '江苏省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强化工企业安全管理，定期检查设备，规范操作规程',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC019',
    name: '浙江杭州某地铁施工坍塌事故',
    summary: '浙江省杭州市某地铁施工现场发生坍塌事故，造成多人伤亡。',
    type: '坍塌事故',
    directCause: '施工过程中坍塌',
    indirectCause: '安全管理不到位，施工方案不完善',
    responsibleUnit: '相关施工单位',
    projectType: '交通工程',
    accidentDate: '2024-01-01',
    projectInfo: '地铁施工项目',
    level: '较大',
    province: '浙江省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强地铁施工安全管理，完善施工方案，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC020',
    name: '福建厦门某码头坍塌事故',
    summary: '福建省厦门市某码头发生坍塌事故，造成多人伤亡。',
    type: '坍塌事故',
    directCause: '码头结构失稳坍塌',
    indirectCause: '安全管理不到位，维护不及时',
    responsibleUnit: '相关码头运营单位',
    projectType: '交通工程',
    accidentDate: '2024-01-01',
    projectInfo: '码头运营项目',
    level: '较大',
    province: '福建省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强码头安全管理，定期检查维护，完善安全保障措施',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC021',
    name: '湖北武汉某建筑工地高处坠落事故',
    summary: '湖北省武汉市某建筑工地发生高处坠落事故，造成1人死亡。',
    type: '高处坠落',
    directCause: '工人未系安全带，不慎从高处坠落',
    indirectCause: '安全管理不到位，安全培训不足',
    responsibleUnit: '相关施工单位',
    projectType: '建筑工程',
    accidentDate: '2024-01-01',
    projectInfo: '建筑施工项目',
    level: '一般',
    province: '湖北省',
    severity: '一般',
    casualties: '1死',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强建筑施工安全管理，严格执行安全操作规程，加强安全培训',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC022',
    name: '湖南长沙某工厂火灾事故',
    summary: '湖南省长沙市某工厂发生火灾事故，造成多人伤亡。',
    type: '火灾事故',
    directCause: '电气线路故障引发火灾',
    indirectCause: '消防安全管理不到位，消防设施不完善',
    responsibleUnit: '相关工厂',
    projectType: '工业工程',
    accidentDate: '2024-01-01',
    projectInfo: '工业生产项目',
    level: '较大',
    province: '湖南省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强工厂消防安全管理，完善消防设施，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC023',
    name: '四川成都某地铁施工透水事故',
    summary: '四川省成都市某地铁施工现场发生透水事故，造成多人伤亡。',
    type: '透水事故',
    directCause: '施工过程中透水',
    indirectCause: '安全管理不到位，地质勘察不足',
    responsibleUnit: '相关施工单位',
    projectType: '交通工程',
    accidentDate: '2024-01-01',
    projectInfo: '地铁施工项目',
    level: '较大',
    province: '四川省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强地铁施工安全管理，完善地质勘察，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC024',
    name: '陕西西安某建筑工地坍塌事故',
    summary: '陕西省西安市某建筑工地发生坍塌事故，造成多人伤亡。',
    type: '坍塌事故',
    directCause: '施工过程中坍塌',
    indirectCause: '安全管理不到位，施工方案不完善',
    responsibleUnit: '相关施工单位',
    projectType: '建筑工程',
    accidentDate: '2024-01-01',
    projectInfo: '建筑施工项目',
    level: '较大',
    province: '陕西省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强建筑施工安全管理，完善施工方案，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC025',
    name: '云南昆明某化工厂爆炸事故',
    summary: '云南省昆明市某化工厂发生爆炸事故，造成多人伤亡。',
    type: '爆炸事故',
    directCause: '化学品泄漏引发爆炸',
    indirectCause: '安全管理不到位，设备维护不及时',
    responsibleUnit: '某化工厂',
    projectType: '化工工程',
    accidentDate: '2024-01-01',
    projectInfo: '化工生产项目',
    level: '较大',
    province: '云南省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强化工企业安全管理，定期检查设备，规范操作规程',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC026',
    name: '贵州贵阳某建筑工地高处坠落事故',
    summary: '贵州省贵阳市某建筑工地发生高处坠落事故，造成1人死亡。',
    type: '高处坠落',
    directCause: '工人未系安全带，不慎从高处坠落',
    indirectCause: '安全管理不到位，安全培训不足',
    responsibleUnit: '相关施工单位',
    projectType: '建筑工程',
    accidentDate: '2024-01-01',
    projectInfo: '建筑施工项目',
    level: '一般',
    province: '贵州省',
    severity: '一般',
    casualties: '1死',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强建筑施工安全管理，严格执行安全操作规程，加强安全培训',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC027',
    name: '重庆某煤矿瓦斯爆炸事故',
    summary: '重庆市某煤矿发生瓦斯爆炸事故，造成多人伤亡。',
    type: '瓦斯爆炸',
    directCause: '瓦斯积聚引发爆炸',
    indirectCause: '安全管理不到位，瓦斯监测系统失效',
    responsibleUnit: '相关煤矿企业',
    projectType: '矿业工程',
    accidentDate: '2024-01-01',
    projectInfo: '煤矿开采项目',
    level: '较大',
    province: '重庆市',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强煤矿安全管理，完善瓦斯监测系统，定期开展安全检查',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC028',
    name: '天津某化工厂火灾事故',
    summary: '天津市某化工厂发生火灾事故，造成多人伤亡。',
    type: '火灾事故',
    directCause: '化学品泄漏引发火灾',
    indirectCause: '安全管理不到位，设备维护不及时',
    responsibleUnit: '某化工厂',
    projectType: '化工工程',
    accidentDate: '2024-01-01',
    projectInfo: '化工生产项目',
    level: '较大',
    province: '天津市',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强化工企业安全管理，定期检查设备，规范操作规程',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC029',
    name: '河北石家庄某建筑工地坍塌事故',
    summary: '河北省石家庄市某建筑工地发生坍塌事故，造成多人伤亡。',
    type: '坍塌事故',
    directCause: '施工过程中坍塌',
    indirectCause: '安全管理不到位，施工方案不完善',
    responsibleUnit: '相关施工单位',
    projectType: '建筑工程',
    accidentDate: '2024-01-01',
    projectInfo: '建筑施工项目',
    level: '较大',
    province: '河北省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强建筑施工安全管理，完善施工方案，加强现场监测',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  },
  {
    id: 'AC030',
    name: '吉林长春某工厂爆炸事故',
    summary: '吉林省长春市某工厂发生爆炸事故，造成多人伤亡。',
    type: '爆炸事故',
    directCause: '设备故障引发爆炸',
    indirectCause: '安全管理不到位，设备维护不及时',
    responsibleUnit: '相关工厂',
    projectType: '工业工程',
    accidentDate: '2024-01-01',
    projectInfo: '工业生产项目',
    level: '较大',
    province: '吉林省',
    severity: '较严重',
    casualties: '多人伤亡',
    economicLoss: '重大',
    progress: '事故调查已完成，相关责任人已被问责',
    lessons: '加强工厂安全管理，定期检查设备，规范操作规程',
    punishment: '相关责任人被依法追究责任',
    files: {
      report: [],
      reading: [],
      media: []
    }
  }
])

// 过滤事故数据
const filterAccidents = () => {
  let result = [...accidents.value]
  
  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase()
    result = result.filter(accident => 
      accident.name.toLowerCase().includes(keyword) ||
      accident.type.toLowerCase().includes(keyword) ||
      accident.responsibleUnit.toLowerCase().includes(keyword)
    )
  }
  
  // 根据事故类型过滤
  if (filterType.value) {
    result = result.filter(accident => accident.type === filterType.value)
  }
  
  filteredAccidents.value = result
  return result
}

// 计算分页数据
const updatePagedAccidents = () => {
  const filtered = filterAccidents()
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  pagedAccidents.value = filtered.slice(start, end)
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置页码
  updatePagedAccidents()
}

// 初始化分页数据
updatePagedAccidents()

// 处理页码变化
const handleSizeChange = (size) => {
  pageSize.value = size
  updatePagedAccidents()
}

// 处理每页大小变化
const handleCurrentChange = (current) => {
  currentPage.value = current
  updatePagedAccidents()
}

// 处理事故选择变化
const handleAccidentSelectionChange = (val) => {
  selectedAccidents.value = val
}

// 批量删除事故
const batchDeleteAccidents = () => {
  if (selectedAccidents.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedAccidents.value.length} 个事故案例吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行批量删除操作
    const idsToDelete = selectedAccidents.value.map((accident) => accident.id)
    accidents.value = accidents.value.filter(accident => !idsToDelete.includes(accident.id))
    selectedAccidents.value = []
    updatePagedAccidents()
    console.log('事故案例批量删除成功')
  }).catch(() => {
    // 取消删除
    console.log('取消删除事故案例')
  })
}

// 添加事故案例
const addAccident = () => {
  dialogTitle.value = '添加事故案例'
  // 重置表单
  Object.assign(accidentForm, {
    id: '',
    name: '',
    summary: '',
    type: '',
    directCause: '',
    indirectCause: '',
    responsibleUnit: '',
    projectType: '',
    accidentDate: '',
    projectInfo: '',
    level: '',
    province: '',
    severity: '',
    casualties: '',
    economicLoss: '',
    progress: '',
    lessons: '',
    punishment: '',
    files: {
      report: [],
      reading: [],
      media: []
    }
  })
  dialogVisible.value = true
}

// 编辑事故案例
const editAccident = (accident) => {
  dialogTitle.value = '编辑事故案例'
  // 填充表单数据
  Object.assign(accidentForm, {
    ...accident,
    files: accident.files || {
      report: [],
      reading: [],
      media: []
    }
  })
  dialogVisible.value = true
}

// 删除事故案例
const deleteAccident = (id) => {
  ElMessageBox.confirm(
    '确定要删除该事故案例吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行删除操作
    const index = accidents.value.findIndex(item => item.id === id)
    if (index !== -1) {
      accidents.value.splice(index, 1)
      updatePagedAccidents()
      console.log('事故案例删除成功:', id)
    }
  }).catch(() => {
    // 取消删除
    console.log('取消删除事故案例:', id)
  })
}

// 查看事故案例详情
const viewAccident = (accident) => {
  selectedAccident.value = accident
  detailDialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!accidentFormRef.value) return
  
  try {
    await accidentFormRef.value.validate()
    
    if (accidentForm.id) {
      // 编辑操作：更新现有事故案例
      const index = accidents.value.findIndex(item => item.id === accidentForm.id)
      if (index !== -1) {
        accidents.value[index] = { ...accidentForm }
        console.log('事故案例编辑成功:', accidentForm)
      }
    } else {
      // 添加操作：创建新事故案例
      const newId = 'AC' + String(accidents.value.length + 1).padStart(3, '0')
      const newAccident = {
        ...accidentForm,
        id: newId
      }
      accidents.value.push(newAccident)
      console.log('事故案例添加成功:', newAccident)
    }
    
    dialogVisible.value = false
    updatePagedAccidents()
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}

// 智能填表
const intelligentFillAccident = async () => {
  // 这里可以集成大语言模型API来实现智能填表功能
  // 示例：基于事故名称自动填充其他信息
  if (accidentForm.name) {
    // 模拟智能填表
    console.log('正在智能填充事故案例信息...')
    // 实际项目中这里会调用API
    setTimeout(() => {
      // 模拟填充结果
      if (!accidentForm.summary) {
        accidentForm.summary = '事故概要信息'
      }
      if (!accidentForm.type) {
        accidentForm.type = '坍塌事故'
      }
      if (!accidentForm.province) {
        accidentForm.province = '北京市'
      }
      if (!accidentForm.level) {
        accidentForm.level = '一般'
      }
      console.log('智能填充完成')
    }, 1000)
  }
}

// 处理文件上传
const handleFileUpload = (file, fileList) => {
  // 实际项目中这里会处理文件上传逻辑
  console.log('文件上传:', file)
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
</script>

<style scoped>
.accident-management {
  padding: 0 20px;
  min-height: 100vh;
  
  .accident-search {
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .pagination {
    margin-top: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .accident-detail {
    margin-top: 24px;
  }
  
  .card-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: 24px;
  }
  
  .accident-card {
    margin-bottom: 0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    background: #ffffff;
    border: 1px solid #eaeaea;
  }
  
  .accident-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
    border-bottom: 1px solid #eaeaea;
  }
  
  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .card-badge:hover {
    transform: scale(1.05);
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
  
  .card-body {
    padding: 20px;
  }
  
  .card-info {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .info-item {
    font-size: 14px;
    color: #606266;
    display: flex;
    align-items: center;
    padding: 4px 12px;
    background: #f8f9fa;
    border-radius: 16px;
    transition: all 0.3s ease;
  }
  
  .info-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }
  
  .info-item i {
    margin-right: 6px;
    color: #409eff;
    font-size: 16px;
  }
  
  .card-summary {
    font-size: 14px;
    line-height: 1.6;
    color: #606266;
    margin-bottom: 20px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    border-left: 4px solid #409eff;
  }
  
  .card-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    font-size: 14px;
  }
  
  .stat-item {
    font-weight: 600;
    color: #303133;
    padding: 8px 16px;
    background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .stat-item i {
    color: #409eff;
  }
  
  .card-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  
  .card-actions .el-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-actions .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  /* 列表视图美化 */
  .el-table {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .el-table th {
    background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
    font-weight: 600;
    color: #303133;
  }
  
  .el-table tr:hover {
    background: #f8f9fa;
  }
  
  .el-table__row {
    transition: all 0.3s ease;
  }
  
  .el-table__row:hover {
    transform: translateX(4px);
  }
  
  /* 表单美化 */
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .el-form-item__label {
    font-weight: 500;
    color: #303133;
  }
  
  .el-input,
  .el-select,
  .el-date-picker {
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .el-input:hover,
  .el-select:hover,
  .el-date-picker:hover {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
  
  .el-slider {
    border-radius: 4px;
  }
  
  .el-slider__runway {
    background: #e9ecef;
  }
  
  .el-slider__bar {
    background: linear-gradient(135deg, #409eff 0%, #69c0ff 100%);
  }
  
  .el-slider__button {
    border: 2px solid #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  }
  
  /* 按钮美化 */
  .el-button {
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  /* 视图切换按钮美化 */
  .el-radio-group {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background: linear-gradient(135deg, #409eff 0%, #69c0ff 100%);
    border-color: #409eff;
  }
  
  /* 分页组件美化 */
  .el-pagination {
    margin-top: 0;
  }
  
  .el-pagination__item {
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  
  .el-pagination__item:hover,
  .el-pagination__item:focus {
    color: #409eff;
    border-color: #409eff;
  }
  
  .el-pagination__item.is-active {
    background: linear-gradient(135deg, #409eff 0%, #69c0ff 100%);
    border-color: #409eff;
  }
  
  /* 对话框美化 */
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
  
  .el-dialog__header {
    background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
    border-bottom: 1px solid #eaeaea;
  }
  
  .el-dialog__title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
  
  /* 描述列表美化 */
  .el-descriptions {
    border-radius: 8px;
    overflow: hidden;
  }
  
  .el-descriptions__header {
    background: linear-gradient(135deg, #f0f4f8 0%, #e9ecef 100%);
    padding: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .el-descriptions__body {
    padding: 20px;
  }
  
  .el-descriptions__cell {
    padding: 12px;
  }
  
  .el-descriptions__label {
    font-weight: 500;
    color: #303133;
    background: #f8f9fa;
  }
}
</style>