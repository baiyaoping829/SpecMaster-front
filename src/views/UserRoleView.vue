<template>
  <div class="user-role-view">
    <h2>权限设置</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户管理" name="user">
        <div class="user-management">
          <div class="user-search">
            <el-input
              v-model="userSearchQuery"
              placeholder="搜索用户名或邮箱"
              prefix-icon="el-icon-search"
              style="width: 300px;"
            />
            <el-button type="primary" style="margin-left: 12px;">搜索</el-button>
            <el-button type="success" style="margin-left: 12px;" @click="addUser">添加用户</el-button>
          </div>
          
          <el-table :data="users" style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="用户ID" width="100" />
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="role" label="角色" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                  {{ scope.row.status === 'active' ? '活跃' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="editUser(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteUser(scope.row.id)">删除</el-button>
                <el-button size="small" @click="toggleUserStatus(scope.row)">
                  {{ scope.row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="角色管理" name="role">
        <div class="role-management">
          <div class="role-actions">
            <el-button type="success" @click="addRole">添加角色</el-button>
          </div>
          
          <el-table :data="roles" style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="角色ID" width="100" />
            <el-table-column prop="name" label="角色名称" width="150" />
            <el-table-column prop="description" label="角色描述" min-width="200" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="editRole(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteRole(scope.row.id)">删除</el-button>
                <el-button size="small" @click="setPermissions(scope.row)">权限设置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="权限管理" name="permission">
        <div class="permission-management">
          <el-tree
            :data="permissionTree"
            node-key="id"
            :default-expand-all="true"
            :props="permissionProps"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 标签页
const activeTab = ref('user')

// 用户搜索
const userSearchQuery = ref('')

// 用户数据
const users = ref([
  {
    id: 'U001',
    username: 'admin',
    email: 'admin@example.com',
    role: '管理员',
    status: 'active',
    createdAt: '2024-01-01 00:00:00'
  },
  {
    id: 'U002',
    username: 'user1',
    email: 'user1@example.com',
    role: '普通用户',
    status: 'active',
    createdAt: '2024-01-02 12:00:00'
  },
  {
    id: 'U003',
    username: 'user2',
    email: 'user2@example.com',
    role: '普通用户',
    status: 'disabled',
    createdAt: '2024-01-03 18:00:00'
  }
])

// 角色数据
const roles = ref([
  {
    id: 'R001',
    name: '管理员',
    description: '系统管理员，拥有所有权限'
  },
  {
    id: 'R002',
    name: '普通用户',
    description: '普通用户，拥有基础操作权限'
  },
  {
    id: 'R003',
    name: '只读用户',
    description: '只读用户，只能查看数据'
  }
])

// 权限树数据
const permissionTree = ref([
  {
    id: 'P001',
    label: '系统管理',
    children: [
      { id: 'P001-1', label: '用户管理' },
      { id: 'P001-2', label: '角色管理' },
      { id: 'P001-3', label: '权限管理' }
    ]
  },
  {
    id: 'P002',
    label: '规标管理',
    children: [
      { id: 'P002-1', label: '规标数据管理' },
      { id: 'P002-2', label: '规范智阅' },
      { id: 'P002-3', label: '规范智答' }
    ]
  },
  {
    id: 'P003',
    label: '工程管理',
    children: [
      { id: 'P003-1', label: '方案智审' },
      { id: 'P003-2', label: '风险智控' },
      { id: 'P003-3', label: '合同智审' }
    ]
  }
])

// 权限树配置
const permissionProps = {
  children: 'children',
  label: 'label'
}

// 添加用户
const addUser = () => {
  console.log('添加用户')
  // 这里可以打开添加用户对话框
}

// 编辑用户
const editUser = (user: any) => {
  console.log('编辑用户:', user)
  // 这里可以打开编辑用户对话框
}

// 删除用户
const deleteUser = (id: string) => {
  console.log('删除用户:', id)
  // 这里可以显示删除确认对话框
}

// 切换用户状态
const toggleUserStatus = (user: any) => {
  console.log('切换用户状态:', user)
  // 这里可以切换用户状态
}

// 添加角色
const addRole = () => {
  console.log('添加角色')
  // 这里可以打开添加角色对话框
}

// 编辑角色
const editRole = (role: any) => {
  console.log('编辑角色:', role)
  // 这里可以打开编辑角色对话框
}

// 删除角色
const deleteRole = (id: string) => {
  console.log('删除角色:', id)
  // 这里可以显示删除确认对话框
}

// 设置权限
const setPermissions = (role: any) => {
  console.log('设置权限:', role)
  // 这里可以打开权限设置对话框
}
</script>

<style lang="scss" scoped>
.user-role-view {
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
  
  .user-search,
  .role-actions {
    margin-bottom: 20px;
  }
  
  .permission-management {
    margin-top: 20px;
  }
}
</style>