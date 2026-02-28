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
              @keyup.enter="searchUsers"
            />
            <el-button type="primary" style="margin-left: 12px;" @click="searchUsers">搜索</el-button>
            <el-button type="success" style="margin-left: 12px;" @click="addUser">添加用户</el-button>
          </div>
          
          <el-table :data="filteredUsers" style="width: 100%; margin-top: 20px;">
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
                <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
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
          <div class="permission-actions">
            <el-button type="success" @click="addPermission">添加权限</el-button>
          </div>
          <el-tree
            :data="permissionTree"
            node-key="id"
            :default-expand-all="true"
            :props="permissionProps"
            @node-click="handlePermissionClick"
          >
            <template #default="{ node, data }">
              <span class="permission-node">
                <span>{{ data.label }}</span>
                <span class="permission-actions">
                  <el-button size="small" @click.stop="editPermission(data)">编辑</el-button>
                  <el-button size="small" type="danger" @click.stop="deletePermission(data.id)">删除</el-button>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="付费等级" name="plan">
        <div class="plan-management">
          <div class="plan-actions">
            <el-button type="success" @click="addPlan">添加付费等级</el-button>
          </div>
          
          <el-table :data="plans" style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="等级ID" width="100" />
            <el-table-column prop="name" label="等级名称" width="150" />
            <el-table-column prop="description" label="等级描述" min-width="200" />
            <el-table-column prop="price" label="价格" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="editPlan(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePlan(scope.row)">删除</el-button>
                <el-button size="small" @click="setPlanPermissions(scope.row)">权限设置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="isEditMode ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户名" required>
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.status" active-value="active" inactive-value="disabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除用户确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除用户"
      width="300px"
    >
      <p>确定要删除用户 {{ deleteUserId }} 吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="isEditRoleMode ? '编辑角色' : '添加角色'"
      width="500px"
    >
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input type="textarea" v-model="roleForm.description" placeholder="请输入角色描述" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRole">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 角色权限设置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="设置角色权限"
      width="600px"
    >
      <el-form label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="currentRole.name" disabled />
        </el-form-item>
        <el-form-item label="权限设置">
          <el-tree
            :data="permissionTree"
            node-key="id"
            :default-expand-all="true"
            :props="permissionProps"
            show-checkbox
            :default-checked-keys="checkedPermissions"
            @check="handlePermissionCheck"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermissions">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除角色确认对话框 -->
    <el-dialog
      v-model="deleteRoleDialogVisible"
      title="删除角色"
      width="300px"
    >
      <p>确定要删除角色 {{ deleteRoleId }} 吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteRoleDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteRole">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑权限对话框 -->
    <el-dialog
      v-model="permissionDialogVisible2"
      :title="isEditPermissionMode ? '编辑权限' : '添加权限'"
      width="500px"
    >
      <el-form :model="permissionForm" label-width="80px">
        <el-form-item label="权限名称" required>
          <el-input v-model="permissionForm.label" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限ID" required>
          <el-input v-model="permissionForm.id" placeholder="请输入权限ID" />
        </el-form-item>
        <el-form-item label="父权限">
          <el-select v-model="permissionForm.parentId" placeholder="请选择父权限">
            <el-option label="无" value="" />
            <el-option v-for="permission in allPermissions" :key="permission.id" :label="permission.label" :value="permission.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible2 = false">取消</el-button>
          <el-button type="primary" @click="savePermission">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除权限确认对话框 -->
    <el-dialog
      v-model="deletePermissionDialogVisible"
      title="删除权限"
      width="300px"
    >
      <p>确定要删除权限 {{ deletePermissionId }} 吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deletePermissionDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeletePermission">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加/编辑付费等级对话框 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="isEditPlanMode ? '编辑付费等级' : '添加付费等级'"
      width="500px"
    >
      <el-form :model="planForm" label-width="80px">
        <el-form-item label="等级名称" required>
          <el-input v-model="planForm.name" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="等级描述">
          <el-input type="textarea" v-model="planForm.description" placeholder="请输入等级描述" rows="3" />
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input v-model.number="planForm.price" placeholder="请输入价格" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="planDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePlan">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 付费等级权限设置对话框 -->
    <el-dialog
      v-model="planPermissionDialogVisible"
      title="设置付费等级权限"
      width="600px"
    >
      <el-form label-width="80px">
        <el-form-item label="等级名称">
          <el-input v-model="currentPlan.name" disabled />
        </el-form-item>
        <el-form-item label="权限设置">
          <el-tree
            :data="permissionTree"
            node-key="id"
            :default-expand-all="true"
            :props="permissionProps"
            show-checkbox
            :default-checked-keys="planCheckedPermissions"
            @check="handlePlanPermissionCheck"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="planPermissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePlanPermissions">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除付费等级确认对话框 -->
    <el-dialog
      v-model="deletePlanDialogVisible"
      title="删除付费等级"
      width="300px"
    >
      <p>确定要删除付费等级 {{ deletePlanId }} 吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deletePlanDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeletePlan">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

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

// 过滤后的用户数据
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) {
    return users.value
  }
  const query = userSearchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  )
})

// 用户对话框
const userDialogVisible = ref(false)
const isEditMode = ref(false)
const userForm = ref({
  id: '',
  username: '',
  email: '',
  role: '',
  status: 'active'
})

// 删除用户对话框
const deleteDialogVisible = ref(false)
const deleteUserId = ref('')

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

// 角色对话框
const roleDialogVisible = ref(false)
const isEditRoleMode = ref(false)
const roleForm = ref({
  id: '',
  name: '',
  description: ''
})

// 角色权限设置对话框
const permissionDialogVisible = ref(false)
const currentRole = ref({
  id: '',
  name: ''
})
const checkedPermissions = ref<string[]>([])

// 角色权限映射
const rolePermissions = ref({
  'R001': ['P001', 'P001-1', 'P001-2', 'P001-3', 'P002', 'P002-1', 'P002-2', 'P002-3', 'P003', 'P003-1', 'P003-2', 'P003-3'],
  'R002': ['P002', 'P002-1', 'P002-2', 'P003', 'P003-1'],
  'R003': ['P002-2']
})

// 删除角色对话框
const deleteRoleDialogVisible = ref(false)
const deleteRoleId = ref('')

// 权限树数据
const permissionTree = ref([
  {
    id: 'P001',
    label: '系统管理',
    children: [
      { id: 'P001-1', label: '用户管理' },
      { id: 'P001-2', label: '角色管理' },
      { id: 'P001-3', label: '权限管理' },
      { id: 'P001-4', label: '系统设置' }
    ]
  },
  {
    id: 'P002',
    label: '规标管理',
    children: [
      { id: 'P002-1', label: '规标数据管理' },
      { id: 'P002-2', label: '规范智阅' },
      { id: 'P002-3', label: '规范智答' },
      { id: 'P002-4', label: '规标导入导出' }
    ]
  },
  {
    id: 'P003',
    label: '工程管理',
    children: [
      { id: 'P003-1', label: '方案智审' },
      { id: 'P003-2', label: '风险智控' },
      { id: 'P003-3', label: '合同智审' },
      { id: 'P003-4', label: '工程数据管理' }
    ]
  },
  {
    id: 'P004',
    label: '事故管理',
    children: [
      { id: 'P004-1', label: '事故案例管理' },
      { id: 'P004-2', label: '事故分析' },
      { id: 'P004-3', label: '媒体报道' }
    ]
  },
  {
    id: 'P005',
    label: '知识库',
    children: [
      { id: 'P005-1', label: '知识管理' },
      { id: 'P005-2', label: '知识检索' }
    ]
  }
])

// 权限树配置
const permissionProps = {
  children: 'children',
  label: 'label'
}

// 所有权限列表（扁平化）
const allPermissions = computed(() => {
  const permissions: any[] = []
  
  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      permissions.push({ id: node.id, label: node.label })
      if (node.children) {
        traverse(node.children)
      }
    }
  }
  
  traverse(permissionTree.value)
  return permissions
})

// 权限对话框
const permissionDialogVisible2 = ref(false)
const isEditPermissionMode = ref(false)
const permissionForm = ref({
  id: '',
  label: '',
  parentId: ''
})

// 删除权限对话框
const deletePermissionDialogVisible = ref(false)
const deletePermissionId = ref('')

// 付费等级数据
const plans = ref([
  {
    id: 'PL001',
    name: '免费版',
    description: '基础功能，适合个人用户',
    price: 0
  },
  {
    id: 'PL002',
    name: '标准版',
    description: '标准功能，适合中小企业',
    price: 99
  },
  {
    id: 'PL003',
    name: '企业版',
    description: '全功能，适合大型企业',
    price: 299
  }
])

// 付费等级对话框
const planDialogVisible = ref(false)
const isEditPlanMode = ref(false)
const planForm = ref({
  id: '',
  name: '',
  description: '',
  price: 0
})

// 付费等级权限设置对话框
const planPermissionDialogVisible = ref(false)
const currentPlan = ref({
  id: '',
  name: ''
})
const planCheckedPermissions = ref<string[]>([])

// 付费等级权限映射
const planPermissions = ref({
  'PL001': ['P002-2', 'P003-1'],
  'PL002': ['P002', 'P002-1', 'P002-2', 'P003', 'P003-1', 'P003-2', 'P004-2', 'P005-2'],
  'PL003': ['P001', 'P001-1', 'P001-2', 'P001-3', 'P001-4', 'P002', 'P002-1', 'P002-2', 'P002-3', 'P002-4', 'P003', 'P003-1', 'P003-2', 'P003-3', 'P003-4', 'P004', 'P004-1', 'P004-2', 'P004-3', 'P005', 'P005-1', 'P005-2']
})

// 删除付费等级对话框
const deletePlanDialogVisible = ref(false)
const deletePlanId = ref('')

// 添加用户
const addUser = () => {
  isEditMode.value = false
  userForm.value = {
    id: '',
    username: '',
    email: '',
    role: '',
    status: 'active'
  }
  userDialogVisible.value = true
}

// 编辑用户
const editUser = (user: any) => {
  isEditMode.value = true
  userForm.value = { ...user }
  userDialogVisible.value = true
}

// 删除用户
const deleteUser = (user: any) => {
  deleteUserId.value = user.username
  deleteDialogVisible.value = true
}

// 确认删除用户
const confirmDeleteUser = () => {
  const index = users.value.findIndex(user => user.username === deleteUserId.value)
  if (index !== -1) {
    users.value.splice(index, 1)
    ElMessage.success('用户删除成功')
  }
  deleteDialogVisible.value = false
}

// 切换用户状态
const toggleUserStatus = (user: any) => {
  user.status = user.status === 'active' ? 'disabled' : 'active'
  ElMessage.success(`用户 ${user.username} 状态已切换`)
}

// 搜索用户
const searchUsers = () => {
  // 搜索功能由filteredUsers计算属性实现
  ElMessage.info('搜索完成')
}

// 保存用户
const saveUser = () => {
  if (!userForm.value.username || !userForm.value.email || !userForm.value.role) {
    ElMessage.error('请填写完整的用户信息')
    return
  }
  
  if (isEditMode.value) {
    // 编辑现有用户
    const index = users.value.findIndex(user => user.id === userForm.value.id)
    if (index !== -1) {
      users.value[index] = { ...userForm.value }
      ElMessage.success('用户编辑成功')
    }
  } else {
    // 添加新用户
    const newUser = {
      ...userForm.value,
      id: `U${String(users.value.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    users.value.push(newUser)
    ElMessage.success('用户添加成功')
  }
  
  userDialogVisible.value = false
}

// 添加角色
const addRole = () => {
  isEditRoleMode.value = false
  roleForm.value = {
    id: '',
    name: '',
    description: ''
  }
  roleDialogVisible.value = true
}

// 编辑角色
const editRole = (role: any) => {
  isEditRoleMode.value = true
  roleForm.value = { ...role }
  roleDialogVisible.value = true
}

// 删除角色
const deleteRole = (role: any) => {
  deleteRoleId.value = role.name
  deleteRoleDialogVisible.value = true
}

// 确认删除角色
const confirmDeleteRole = () => {
  const index = roles.value.findIndex(role => role.name === deleteRoleId.value)
  if (index !== -1) {
    const roleId = roles.value[index].id
    roles.value.splice(index, 1)
    // 同时删除角色权限映射
    delete rolePermissions.value[roleId]
    ElMessage.success('角色删除成功')
  }
  deleteRoleDialogVisible.value = false
}

// 设置权限
const setPermissions = (role: any) => {
  currentRole.value = { ...role }
  // 加载角色已有权限
  checkedPermissions.value = rolePermissions.value[role.id] || []
  permissionDialogVisible.value = true
}

// 处理权限选择
const handlePermissionCheck = (data: any, checked: any) => {
  // 权限选择逻辑由el-tree组件处理
}

// 保存权限
const savePermissions = () => {
  rolePermissions.value[currentRole.value.id] = checkedPermissions.value
  ElMessage.success('权限设置成功')
  permissionDialogVisible.value = false
}

// 保存角色
const saveRole = () => {
  if (!roleForm.value.name) {
    ElMessage.error('请填写角色名称')
    return
  }
  
  if (isEditRoleMode.value) {
    // 编辑现有角色
    const index = roles.value.findIndex(role => role.id === roleForm.value.id)
    if (index !== -1) {
      roles.value[index] = { ...roleForm.value }
      ElMessage.success('角色编辑成功')
    }
  } else {
    // 添加新角色
    const newRole = {
      ...roleForm.value,
      id: `R${String(roles.value.length + 1).padStart(3, '0')}`
    }
    roles.value.push(newRole)
    // 初始化角色权限
    rolePermissions.value[newRole.id] = []
    ElMessage.success('角色添加成功')
  }
  
  roleDialogVisible.value = false
}

// 处理权限点击
const handlePermissionClick = (data: any) => {
  console.log('点击权限:', data)
}

// 添加权限
const addPermission = () => {
  isEditPermissionMode.value = false
  permissionForm.value = {
    id: '',
    label: '',
    parentId: ''
  }
  permissionDialogVisible2.value = true
}

// 编辑权限
const editPermission = (data: any) => {
  isEditPermissionMode.value = true
  permissionForm.value = {
    id: data.id,
    label: data.label,
    parentId: '' // 需要根据实际情况获取父权限ID
  }
  permissionDialogVisible2.value = true
}

// 删除权限
const deletePermission = (id: string) => {
  deletePermissionId.value = id
  deletePermissionDialogVisible.value = true
}

// 确认删除权限
const confirmDeletePermission = () => {
  // 递归删除权限及其子权限
  const deletePermissionRecursive = (nodes: any[]) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === deletePermissionId.value) {
        nodes.splice(i, 1)
        return true
      }
      if (nodes[i].children) {
        if (deletePermissionRecursive(nodes[i].children)) {
          return true
        }
      }
    }
    return false
  }
  
  deletePermissionRecursive(permissionTree.value)
  
  // 同时从角色权限映射中删除该权限
  for (const roleId in rolePermissions.value) {
    rolePermissions.value[roleId] = rolePermissions.value[roleId].filter((perm: string) => perm !== deletePermissionId.value)
  }
  
  ElMessage.success('权限删除成功')
  deletePermissionDialogVisible.value = false
}

// 保存权限
const savePermission = () => {
  if (!permissionForm.value.id || !permissionForm.value.label) {
    ElMessage.error('请填写权限ID和名称')
    return
  }
  
  if (isEditPermissionMode.value) {
    // 编辑现有权限
    const updatePermissionRecursive = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.id === permissionForm.value.id) {
          node.label = permissionForm.value.label
          return true
        }
        if (node.children) {
          if (updatePermissionRecursive(node.children)) {
            return true
          }
        }
      }
      return false
    }
    
    updatePermissionRecursive(permissionTree.value)
    ElMessage.success('权限编辑成功')
  } else {
    // 添加新权限
    if (permissionForm.value.parentId) {
      // 添加为子权限
      const addChildPermission = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.id === permissionForm.value.parentId) {
            if (!node.children) {
              node.children = []
            }
            node.children.push({
              id: permissionForm.value.id,
              label: permissionForm.value.label
            })
            return true
          }
          if (node.children) {
            if (addChildPermission(node.children)) {
              return true
            }
          }
        }
        return false
      }
      
      addChildPermission(permissionTree.value)
    } else {
      // 添加为顶级权限
      permissionTree.value.push({
        id: permissionForm.value.id,
        label: permissionForm.value.label,
        children: []
      })
    }
    ElMessage.success('权限添加成功')
  }
  
  permissionDialogVisible2.value = false
}

// 添加付费等级
const addPlan = () => {
  isEditPlanMode.value = false
  planForm.value = {
    id: '',
    name: '',
    description: '',
    price: 0
  }
  planDialogVisible.value = true
}

// 编辑付费等级
const editPlan = (plan: any) => {
  isEditPlanMode.value = true
  planForm.value = { ...plan }
  planDialogVisible.value = true
}

// 删除付费等级
const deletePlan = (plan: any) => {
  deletePlanId.value = plan.name
  deletePlanDialogVisible.value = true
}

// 确认删除付费等级
const confirmDeletePlan = () => {
  const index = plans.value.findIndex(plan => plan.name === deletePlanId.value)
  if (index !== -1) {
    const planId = plans.value[index].id
    plans.value.splice(index, 1)
    // 同时删除付费等级权限映射
    delete planPermissions.value[planId]
    ElMessage.success('付费等级删除成功')
  }
  deletePlanDialogVisible.value = false
}

// 设置付费等级权限
const setPlanPermissions = (plan: any) => {
  currentPlan.value = { ...plan }
  // 加载付费等级已有权限
  planCheckedPermissions.value = planPermissions.value[plan.id] || []
  planPermissionDialogVisible.value = true
}

// 处理付费等级权限选择
const handlePlanPermissionCheck = (data: any, checked: any) => {
  // 权限选择逻辑由el-tree组件处理
}

// 保存付费等级权限
const savePlanPermissions = () => {
  planPermissions.value[currentPlan.value.id] = planCheckedPermissions.value
  ElMessage.success('付费等级权限设置成功')
  planPermissionDialogVisible.value = false
}

// 保存付费等级
const savePlan = () => {
  if (!planForm.value.name || planForm.value.price < 0) {
    ElMessage.error('请填写完整的付费等级信息')
    return
  }
  
  if (isEditPlanMode.value) {
    // 编辑现有付费等级
    const index = plans.value.findIndex(plan => plan.id === planForm.value.id)
    if (index !== -1) {
      plans.value[index] = { ...planForm.value }
      ElMessage.success('付费等级编辑成功')
    }
  } else {
    // 添加新付费等级
    const newPlan = {
      ...planForm.value,
      id: `PL${String(plans.value.length + 1).padStart(3, '0')}`
    }
    plans.value.push(newPlan)
    // 初始化付费等级权限
    planPermissions.value[newPlan.id] = []
    ElMessage.success('付费等级添加成功')
  }
  
  planDialogVisible.value = false
}

// 权限验证机制
// 检查用户是否拥有某个权限
const checkPermission = (userId: string, permissionId: string): boolean => {
  // 查找用户
  const user = users.value.find(u => u.id === userId)
  if (!user) return false
  
  // 查找用户角色
  const role = roles.value.find(r => r.name === user.role)
  if (!role) return false
  
  // 获取角色权限
  const rolePerms = rolePermissions.value[role.id] || []
  
  // 检查权限
  return checkPermissionRecursive(rolePerms, permissionId)
}

// 递归检查权限（包括父权限）
const checkPermissionRecursive = (permissions: string[], permissionId: string): boolean => {
  // 直接检查权限
  if (permissions.includes(permissionId)) return true
  
  // 检查父权限
  const parentPermissionId = getParentPermissionId(permissionId)
  if (parentPermissionId) {
    return checkPermissionRecursive(permissions, parentPermissionId)
  }
  
  return false
}

// 获取父权限ID
const getParentPermissionId = (permissionId: string): string | null => {
  // 例如：P001-1的父权限是P001
  const parts = permissionId.split('-')
  if (parts.length > 1) {
    return parts[0]
  }
  return null
}

// 检查付费等级权限
const checkPlanPermission = (planId: string, permissionId: string): boolean => {
  const planPerms = planPermissions.value[planId] || []
  return checkPermissionRecursive(planPerms, permissionId)
}

// 权限层级结构
// 获取权限的完整层级路径
const getPermissionPath = (permissionId: string): string[] => {
  const path: string[] = [permissionId]
  let parentId = getParentPermissionId(permissionId)
  
  while (parentId) {
    path.unshift(parentId)
    parentId = getParentPermissionId(parentId)
  }
  
  return path
}

// 获取权限的子权限
const getChildPermissions = (permissionId: string): string[] => {
  const children: string[] = []
  
  const findChildren = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.id === permissionId && node.children) {
        node.children.forEach((child: any) => {
          children.push(child.id)
          if (child.children) {
            findChildren(child.children)
          }
        })
        return
      }
      if (node.children) {
        findChildren(node.children)
      }
    }
  }
  
  findChildren(permissionTree.value)
  return children
}
</script>

<style lang="scss" scoped>
.user-role-view {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 80vh;
  
  h2 {
    margin-bottom: 24px;
    color: #303133;
    font-size: 18px;
    font-weight: 600;
  }
  
  .user-search,
  .role-actions,
  .permission-actions,
  .plan-actions {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
  }
  
  .permission-management {
    margin-top: 20px;
  }
  
  .permission-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f5f7fa;
      border-radius: 4px;
      padding: 0 8px;
    }
  }
  
  .permission-node .permission-actions {
    margin: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .permission-node:hover .permission-actions {
    opacity: 1;
  }
  
  .permission-node .permission-actions .el-button {
    margin-left: 5px;
    padding: 4px 12px;
  }
  
  // 表格样式优化
  .el-table {
    border-radius: 8px;
    overflow: hidden;
    
    .el-table__header-wrapper {
      background-color: #f5f7fa;
    }
    
    .el-table__row {
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
  
  // 标签页样式优化
  .el-tabs {
    .el-tabs__header {
      margin-bottom: 24px;
    }
    
    .el-tabs__item {
      font-size: 14px;
      padding: 0 20px;
    }
    
    .el-tabs__active-bar {
      background-color: #409eff;
    }
  }
  
  // 按钮样式优化
  .el-button {
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
  
  // 对话框样式优化
  .el-dialog {
    border-radius: 8px;
    overflow: hidden;
    
    .el-dialog__header {
      background-color: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;
    }
    
    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
    }
  }
  
  // 表单样式优化
  .el-form {
    .el-form-item {
      margin-bottom: 16px;
    }
  }
  
  // 树状结构样式优化
  .el-tree {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 8px;
    
    .el-tree-node {
      padding: 4px 0;
    }
  }
  
  // 响应式布局
  @media (max-width: 768px) {
    padding: 16px;
    
    .user-search,
    .role-actions,
    .permission-actions,
    .plan-actions {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    
    .el-table {
      font-size: 12px;
    }
    
    .el-table-column {
      width: auto !important;
    }
  }
}
</style>