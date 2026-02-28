<template>
  <div class="accident-cases-view">
    <h2>事故案例</h2>
    
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="事故管理" name="accident-management">
        <AccidentManagement />
      </el-tab-pane>
      <el-tab-pane label="事故分析" name="accident-analysis">
        <AccidentAnalysis />
      </el-tab-pane>
      <el-tab-pane label="媒体报道" name="media-reports">
        <MediaReports />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AccidentManagement from './accident-cases/AccidentManagement.vue'
import AccidentAnalysis from './accident-cases/AccidentAnalysis.vue'
import MediaReports from './accident-cases/MediaReports.vue'

const activeTab = ref('accident-management')

const handleTabClick = (tab: any) => {
  activeTab.value = tab.props.name
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
  
  .accident-search {
    margin-bottom: 20px;
  }
  
  .graph-container,
  .mindmap-container {
    margin-top: 10px;
  }
}
</style>