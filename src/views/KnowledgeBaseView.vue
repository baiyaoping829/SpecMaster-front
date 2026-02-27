<template>
  <div class="knowledge-base-view">
    <h2>工程知识</h2>
    <div class="knowledge-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索知识内容"
        prefix-icon="el-icon-search"
        style="width: 300px;"
      />
      <el-button type="primary" style="margin-left: 12px;">搜索</el-button>
    </div>
    
    <div class="knowledge-categories">
      <el-tag
        v-for="category in categories"
        :key="category.value"
        :type="activeCategory === category.value ? 'primary' : ''"
        @click="activeCategory = category.value"
        style="margin-right: 8px; cursor: pointer;"
      >
        {{ category.label }}
      </el-tag>
    </div>
    
    <div class="knowledge-list">
      <el-card
        v-for="item in knowledgeItems"
        :key="item.id"
        class="knowledge-item"
      >
        <template #header>
          <div class="card-header">
            <h3>{{ item.title }}</h3>
            <span class="category-tag">{{ item.category }}</span>
          </div>
        </template>
        <div class="card-body">
          <p>{{ item.content }}</p>
          <div class="card-footer">
            <span class="update-time">{{ item.updateTime }}</span>
            <el-button size="small" type="primary" @click="viewDetails(item)">查看详情</el-button>
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 搜索参数
const searchQuery = ref('')

// 分类
const categories = [
  { label: '全部', value: '' },
  { label: '建筑工程', value: 'building' },
  { label: '市政工程', value: 'municipal' },
  { label: '水利工程', value: 'water' },
  { label: '交通工程', value: 'transport' },
  { label: '电气工程', value: 'electrical' }
]
const activeCategory = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(40)

// 知识条目数据
const knowledgeItems = ref([
  {
    id: 'KB001',
    title: '建筑工程施工安全规范',
    category: '建筑工程',
    content: '本规范适用于各类建筑工程的施工安全管理，包括施工现场安全、高处作业安全、临时用电安全等方面的要求...',
    updateTime: '2024-05-01'
  },
  {
    id: 'KB002',
    title: '市政道路工程质量验收标准',
    category: '市政工程',
    content: '本标准规定了市政道路工程的质量验收要求，包括路基、路面、人行道、交通设施等方面的验收标准...',
    updateTime: '2024-04-15'
  },
  {
    id: 'KB003',
    title: '水利工程防洪设计规范',
    category: '水利工程',
    content: '本规范适用于各类水利工程的防洪设计，包括水库、堤坝、水闸等水利设施的防洪标准和设计要求...',
    updateTime: '2024-03-20'
  },
  {
    id: 'KB004',
    title: '桥梁工程施工技术规程',
    category: '交通工程',
    content: '本规程规定了桥梁工程的施工技术要求，包括基础施工、墩台施工、上部结构施工等方面的技术规范...',
    updateTime: '2024-02-10'
  }
])

// 查看详情
const viewDetails = (item: any) => {
  console.log('查看知识详情:', item)
  // 这里可以打开详情对话框或跳转到详情页面
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  // 这里可以调用API获取数据
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  // 这里可以调用API获取数据
}
</script>

<style lang="scss" scoped>
.knowledge-base-view {
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
  
  .knowledge-search {
    margin-bottom: 16px;
  }
  
  .knowledge-categories {
    margin-bottom: 20px;
  }
  
  .knowledge-list {
    margin-bottom: 20px;
  }
  
  .knowledge-item {
    margin-bottom: 16px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .category-tag {
      font-size: 12px;
      color: #409EFF;
      background-color: #ecf5ff;
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
  
  .card-body {
    
    p {
      margin: 12px 0;
      color: #606266;
      line-height: 1.5;
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      
      .update-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
  
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>