<template>
  <div class="accident-cases-view">
    <h2>工程事故案例库</h2>
    <div class="case-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索事故案例"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      />
      <el-button type="primary" style="margin-left: 12px;">搜索</el-button>
    </div>
    
    <div class="case-filters">
      <el-select v-model="caseType" placeholder="事故类型" style="width: 150px; margin-right: 12px;">
        <el-option label="坍塌事故" value="collapse" />
        <el-option label="火灾事故" value="fire" />
        <el-option label="触电事故" value="electric" />
        <el-option label="机械伤害" value="mechanical" />
      </el-select>
      <el-select v-model="projectType" placeholder="工程类型" style="width: 150px; margin-right: 12px;">
        <el-option label="建筑工程" value="building" />
        <el-option label="市政工程" value="municipal" />
        <el-option label="水利工程" value="water" />
        <el-option label="交通工程" value="transport" />
      </el-select>
      <el-date-picker
        v-model="accidentDate"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px;"
      />
    </div>
    
    <el-table :data="accidentCases" style="width: 100%; margin-top: 20px;">
      <el-table-column prop="id" label="案例编号" width="100" />
      <el-table-column prop="title" label="事故标题" min-width="200" />
      <el-table-column prop="type" label="事故类型" width="120" />
      <el-table-column prop="projectType" label="工程类型" width="120" />
      <el-table-column prop="date" label="事故日期" width="150" />
      <el-table-column prop="severity" label="严重程度" width="100" />
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewCase(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 搜索和筛选参数
const searchQuery = ref('')
const caseType = ref('')
const projectType = ref('')
const accidentDate = ref<[Date, Date] | null>(null)

// 事故案例数据
const accidentCases = ref([
  {
    id: 'AC001',
    title: '某建筑工地坍塌事故',
    type: '坍塌事故',
    projectType: '建筑工程',
    date: '2023-05-15',
    severity: '重大'
  },
  {
    id: 'AC002',
    title: '某市政道路施工火灾',
    type: '火灾事故',
    projectType: '市政工程',
    date: '2023-08-22',
    severity: '较大'
  },
  {
    id: 'AC003',
    title: '某水利工程触电事故',
    type: '触电事故',
    projectType: '水利工程',
    date: '2023-11-03',
    severity: '一般'
  },
  {
    id: 'AC004',
    title: '某桥梁施工机械伤害',
    type: '机械伤害',
    projectType: '交通工程',
    date: '2024-01-18',
    severity: '较大'
  }
])

// 查看案例详情
const viewCase = (caseItem: any) => {
  console.log('查看案例详情:', caseItem)
  // 这里可以打开详情对话框或跳转到详情页面
}
</script>

<style lang="scss" scoped>
.accident-cases-view {
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
  
  .case-search {
    margin-bottom: 16px;
  }
  
  .case-filters {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
  }
}
</style>