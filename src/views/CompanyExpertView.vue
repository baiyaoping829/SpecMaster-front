<template>
  <div class="company-expert-view">
    <h2>工程单位及专家管理</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="工程单位管理" name="company">
        <div class="company-management">
          <div class="company-search">
            <el-input
              v-model="companySearchQuery"
              placeholder="搜索单位名称"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            />
            <el-button type="primary" style="margin-left: 12px;">搜索</el-button>
            <el-button type="success" style="margin-left: 12px;" @click="addCompany">添加单位</el-button>
          </div>
          
          <el-table :data="companies" style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="单位编号" width="100" />
            <el-table-column prop="name" label="单位名称" min-width="200" />
            <el-table-column prop="type" label="单位类型" width="120" />
            <el-table-column prop="contactPerson" label="联系人" width="120" />
            <el-table-column prop="contactPhone" label="联系电话" width="150" />
            <el-table-column prop="address" label="地址" min-width="200" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="editCompany(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCompany(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="专家管理" name="expert">
        <div class="expert-management">
          <div class="expert-search">
            <el-input
              v-model="expertSearchQuery"
              placeholder="搜索专家姓名"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            />
            <el-button type="primary" style="margin-left: 12px;">搜索</el-button>
            <el-button type="success" style="margin-left: 12px;" @click="addExpert">添加专家</el-button>
          </div>
          
          <el-table :data="experts" style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="专家编号" width="100" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="gender" label="性别" width="80" />
            <el-table-column prop="specialty" label="专业领域" min-width="150" />
            <el-table-column prop="title" label="职称" width="120" />
            <el-table-column prop="company" label="所属单位" min-width="150" />
            <el-table-column prop="phone" label="联系电话" width="150" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="editExpert(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteExpert(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 标签页
const activeTab = ref('company')

// 单位搜索
const companySearchQuery = ref('')

// 专家搜索
const expertSearchQuery = ref('')

// 工程单位数据
const companies = ref([
  {
    id: 'C001',
    name: '中国建筑工程总公司',
    type: '建筑施工',
    contactPerson: '张三',
    contactPhone: '13800138000',
    address: '北京市朝阳区建国门外大街1号'
  },
  {
    id: 'C002',
    name: '中国铁建股份有限公司',
    type: '铁路施工',
    contactPerson: '李四',
    contactPhone: '13900139000',
    address: '北京市海淀区复兴路40号'
  },
  {
    id: 'C003',
    name: '中国水利水电建设集团公司',
    type: '水利施工',
    contactPerson: '王五',
    contactPhone: '13700137000',
    address: '北京市西城区阜成门北大街6号'
  }
])

// 专家数据
const experts = ref([
  {
    id: 'E001',
    name: '赵专家',
    gender: '男',
    specialty: '土木工程',
    title: '教授级高工',
    company: '中国建筑工程总公司',
    phone: '13812345678'
  },
  {
    id: 'E002',
    name: '钱专家',
    gender: '女',
    specialty: '结构工程',
    title: '高级工程师',
    company: '中国铁建股份有限公司',
    phone: '13912345678'
  },
  {
    id: 'E003',
    name: '孙专家',
    gender: '男',
    specialty: '水利工程',
    title: '教授级高工',
    company: '中国水利水电建设集团公司',
    phone: '13712345678'
  }
])

// 添加单位
const addCompany = () => {
  console.log('添加单位')
  // 这里可以打开添加单位对话框
}

// 编辑单位
const editCompany = (company: any) => {
  console.log('编辑单位:', company)
  // 这里可以打开编辑单位对话框
}

// 删除单位
const deleteCompany = (id: string) => {
  console.log('删除单位:', id)
  // 这里可以显示删除确认对话框
}

// 添加专家
const addExpert = () => {
  console.log('添加专家')
  // 这里可以打开添加专家对话框
}

// 编辑专家
const editExpert = (expert: any) => {
  console.log('编辑专家:', expert)
  // 这里可以打开编辑专家对话框
}

// 删除专家
const deleteExpert = (id: string) => {
  console.log('删除专家:', id)
  // 这里可以显示删除确认对话框
}
</script>

<style lang="scss" scoped>
.company-expert-view {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-bottom: 24px;
    color: #303133;
    font-size: 18px;
    font-weight: 600;
  }
  
  .company-search,
  .expert-search {
    margin-bottom: 20px;
  }
}
</style>