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
            <el-select v-model="userRoleFilter" placeholder="选择角色" style="margin-left: 12px; width: 150px;">
              <el-option label="全部" value="" />
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.name" />
            </el-select>
            <el-select v-model="userPlanFilter" placeholder="选择付费等级" style="margin-left: 12px; width: 150px;">
              <el-option label="全部" value="" />
              <el-option v-for="plan in plans" :key="plan.id" :label="plan.name" :value="plan.name" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-left: 12px;"
              @change="searchUsers"
            />
            <el-button type="primary" style="margin-left: 12px;" @click="searchUsers">搜索</el-button>
            <el-button type="success" style="margin-left: 12px;" @click="addUser">添加用户</el-button>
            <el-button type="info" style="margin-left: 12px;" @click="clearUserFilters">清空筛选</el-button>
          </div>
          
          <el-table :data="filteredUsers" style="width: 100%; margin-top: 20px;" height="600">
            <el-table-column prop="id" label="用户ID" width="100" />
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="phone" label="手机号" width="150" />
            <el-table-column prop="wechat" label="微信号" width="150" />
            <el-table-column prop="role" label="角色" width="120" />
            <el-table-column prop="plan" label="付费等级" width="120" />
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
            <template #default="{ data }">
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
      
      <el-tab-pane label="权限日志" name="log">
        <div class="log-management">
          <div class="log-search">
            <el-input
              v-model="logSearchQuery"
              placeholder="搜索日志内容"
              prefix-icon="el-icon-search"
              style="width: 300px;"
              @keyup.enter="searchLogs"
            />
            <el-select v-model="logTypeFilter" placeholder="选择操作类型" style="margin-left: 12px; width: 150px;">
              <el-option label="全部" value="" />
              <el-option label="用户操作" value="user" />
              <el-option label="角色操作" value="role" />
              <el-option label="权限操作" value="permission" />
              <el-option label="付费等级操作" value="plan" />
            </el-select>
            <el-button type="primary" style="margin-left: 12px;" @click="searchLogs">搜索</el-button>
            <el-button type="success" style="margin-left: 12px;" @click="clearLogFilters">清空筛选</el-button>
          </div>
          
          <el-table :data="filteredLogs" style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="日志ID" width="100" />
            <el-table-column prop="actionType" label="操作类型" width="120">
              <template #default="scope">
                <el-tag :type="getLogTypeTagType(scope.row.actionType)">
                  {{ getLogTypeLabel(scope.row.actionType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="action" label="操作内容" min-width="300" />
            <el-table-column prop="operator" label="操作人" width="150" />
            <el-table-column prop="timestamp" label="操作时间" width="200" />
            <el-table-column prop="ip" label="操作IP" width="150" />
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="自助管理" name="self">
        <div class="self-management">
          <div class="self-info">
            <h3>我的权限信息</h3>
            <el-card>
              <div class="user-info">
                <div class="info-item">
                  <span class="label">用户名：</span>
                  <span class="value">{{ currentUser.username }}</span>
                </div>
                <div class="info-item">
                  <span class="label">邮箱：</span>
                  <span class="value">{{ currentUser.email }}</span>
                </div>
                <div class="info-item">
                  <span class="label">角色：</span>
                  <span class="value">{{ currentUser.role }}</span>
                </div>
                <div class="info-item">
                  <span class="label">付费等级：</span>
                  <span class="value">{{ currentUser.plan }}</span>
                </div>
              </div>
            </el-card>
          </div>
          
          <div class="self-permissions" style="margin-top: 20px;">
            <h3>我的权限列表</h3>
            <el-tree
              :data="userPermissionTree"
              node-key="id"
              :default-expand-all="false"
              :props="permissionProps"
            >
              <template #default="{ data }">
                <span class="permission-node">
                  <span>{{ data.label }}</span>
                  <span v-if="data.hasPermission" class="permission-status success">已拥有</span>
                  <span v-else class="permission-status error">未拥有</span>
                </span>
              </template>
            </el-tree>
          </div>
          
          <div class="permission-request" style="margin-top: 20px;">
            <h3>权限申请</h3>
            <el-card>
              <el-form :model="permissionRequestForm" label-width="80px">
                <el-form-item label="申请权限">
                  <el-select v-model="permissionRequestForm.permissionId" placeholder="选择要申请的权限">
                    <el-option
                      v-for="permission in allPermissions"
                      :key="permission.id"
                      :label="permission.label"
                      :value="permission.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="申请理由">
                  <el-input type="textarea" v-model="permissionRequestForm.reason" placeholder="请输入申请理由" rows="3" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitPermissionRequest">提交申请</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
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
        <el-form-item label="手机号" required>
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="微信号" required>
          <el-input v-model="userForm.wechat" placeholder="请输入微信号" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="付费等级" required>
          <el-select v-model="userForm.plan" placeholder="请选择付费等级">
            <el-option v-for="plan in plans" :key="plan.id" :label="plan.name" :value="plan.name" />
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
      width="700px"
    >
      <el-form label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="currentRole.name" disabled />
        </el-form-item>
        <el-form-item label="权限模板">
          <el-select v-model="permissionTemplate" placeholder="选择权限模板">
            <el-option label="无模板" value="" />
            <el-option label="管理员模板" value="admin" />
            <el-option label="普通用户模板" value="user" />
            <el-option label="只读用户模板" value="reader" />
          </el-select>
          <el-button type="primary" size="small" style="margin-left: 12px;" @click="applyTemplate">应用模板</el-button>
        </el-form-item>
        <el-form-item label="权限设置">
          <div class="permission-tree-actions">
            <el-button size="small" @click="selectAllPermissions">全选</el-button>
            <el-button size="small" @click="clearAllPermissions">清空</el-button>
            <el-button size="small" @click="expandAllPermissions">展开全部</el-button>
            <el-button size="small" @click="collapseAllPermissions">收起全部</el-button>
          </div>
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTree"
            node-key="id"
            :default-expand-all="false"
            :props="permissionProps"
            show-checkbox
            check-strictly
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
      width="700px"
    >
      <el-form label-width="80px">
        <el-form-item label="等级名称">
          <el-input v-model="currentPlan.name" disabled />
        </el-form-item>
        <el-form-item label="权限模板">
          <el-select v-model="planPermissionTemplate" placeholder="选择权限模板">
            <el-option label="无模板" value="" />
            <el-option label="免费版模板" value="free" />
            <el-option label="标准版模板" value="standard" />
            <el-option label="企业版模板" value="enterprise" />
          </el-select>
          <el-button type="primary" size="small" style="margin-left: 12px;" @click="applyPlanTemplate">应用模板</el-button>
        </el-form-item>
        <el-form-item label="权限设置">
          <div class="permission-tree-actions">
            <el-button size="small" @click="selectAllPlanPermissions">全选</el-button>
            <el-button size="small" @click="clearAllPlanPermissions">清空</el-button>
            <el-button size="small" @click="expandAllPlanPermissions">展开全部</el-button>
            <el-button size="small" @click="collapseAllPlanPermissions">收起全部</el-button>
          </div>
          <el-tree
            ref="planPermissionTreeRef"
            :data="permissionTree"
            node-key="id"
            :default-expand-all="false"
            :props="permissionProps"
            show-checkbox
            check-strictly
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
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 标签页
const activeTab = ref('user')

// 用户搜索
const userSearchQuery = ref('')
const userRoleFilter = ref('')
const userPlanFilter = ref('')
const dateRange = ref<[Date, Date] | null>(null)

// 用户数据
const users = ref([
  {
    id: 'U001',
    username: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    wechat: 'admin_wechat',
    role: '管理员',
    plan: '企业版',
    status: 'active',
    createdAt: '2024-01-01 00:00:00'
  },
  {
    id: 'U002',
    username: 'user1',
    email: 'user1@example.com',
    phone: '13800138001',
    wechat: 'user1_wechat',
    role: '普通用户',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-02 12:00:00'
  },
  {
    id: 'U003',
    username: 'user2',
    email: 'user2@example.com',
    phone: '13800138002',
    wechat: 'user2_wechat',
    role: '普通用户',
    plan: '免费版',
    status: 'disabled',
    createdAt: '2024-01-03 18:00:00'
  },
  {
    id: 'U004',
    username: 'reader',
    email: 'reader@example.com',
    phone: '13800138003',
    wechat: 'reader_wechat',
    role: '只读用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-04 09:00:00'
  },
  {
    id: 'U005',
    username: 'spec_admin',
    email: 'spec_admin@example.com',
    phone: '13800138004',
    wechat: 'spec_admin_wechat',
    role: '单模块管理员',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-05 10:00:00'
  },
  {
    id: 'U006',
    username: 'multi_admin',
    email: 'multi_admin@example.com',
    phone: '13800138005',
    wechat: 'multi_admin_wechat',
    role: '多模块管理员',
    plan: '企业版',
    status: 'active',
    createdAt: '2024-01-06 11:00:00'
  },
  {
    id: 'U007',
    username: 'advanced_user',
    email: 'advanced_user@example.com',
    phone: '13800138006',
    wechat: 'advanced_user_wechat',
    role: '高级用户',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-07 12:00:00'
  },
  {
    id: 'U008',
    username: 'user3',
    email: 'user3@example.com',
    phone: '13800138007',
    wechat: 'user3_wechat',
    role: '普通用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-08 13:00:00'
  },
  {
    id: 'U009',
    username: 'user4',
    email: 'user4@example.com',
    phone: '13800138008',
    wechat: 'user4_wechat',
    role: '普通用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-09 14:00:00'
  },
  {
    id: 'U010',
    username: 'user5',
    email: 'user5@example.com',
    phone: '13800138009',
    wechat: 'user5_wechat',
    role: '普通用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-10 15:00:00'
  },
  {
    id: 'U011',
    username: 'user6',
    email: 'user6@example.com',
    phone: '13800138010',
    wechat: 'user6_wechat',
    role: '只读用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-11 16:00:00'
  },
  {
    id: 'U012',
    username: 'user7',
    email: 'user7@example.com',
    phone: '13800138011',
    wechat: 'user7_wechat',
    role: '只读用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-12 17:00:00'
  },
  {
    id: 'U013',
    username: 'user8',
    email: 'user8@example.com',
    phone: '13800138012',
    wechat: 'user8_wechat',
    role: '高级用户',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-13 18:00:00'
  },
  {
    id: 'U014',
    username: 'user9',
    email: 'user9@example.com',
    phone: '13800138013',
    wechat: 'user9_wechat',
    role: '高级用户',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-14 19:00:00'
  },
  {
    id: 'U015',
    username: 'user10',
    email: 'user10@example.com',
    phone: '13800138014',
    wechat: 'user10_wechat',
    role: '单模块管理员',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-15 20:00:00'
  },
  {
    id: 'U016',
    username: 'user11',
    email: 'user11@example.com',
    phone: '13800138015',
    wechat: 'user11_wechat',
    role: '多模块管理员',
    plan: '企业版',
    status: 'active',
    createdAt: '2024-01-16 21:00:00'
  },
  {
    id: 'U017',
    username: 'user12',
    email: 'user12@example.com',
    phone: '13800138016',
    wechat: 'user12_wechat',
    role: '普通用户',
    plan: '免费版',
    status: 'disabled',
    createdAt: '2024-01-17 22:00:00'
  },
  {
    id: 'U018',
    username: 'user13',
    email: 'user13@example.com',
    phone: '13800138017',
    wechat: 'user13_wechat',
    role: '普通用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-18 23:00:00'
  },
  {
    id: 'U019',
    username: 'user14',
    email: 'user14@example.com',
    phone: '13800138018',
    wechat: 'user14_wechat',
    role: '高级用户',
    plan: '标准版',
    status: 'active',
    createdAt: '2024-01-19 00:00:00'
  },
  {
    id: 'U020',
    username: 'user15',
    email: 'user15@example.com',
    phone: '13800138019',
    wechat: 'user15_wechat',
    role: '只读用户',
    plan: '免费版',
    status: 'active',
    createdAt: '2024-01-20 01:00:00'
  }
])

// 过滤后的用户数据
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    // 用户名或邮箱搜索
    const query = userSearchQuery.value.toLowerCase()
    const matchesSearch = !userSearchQuery.value || 
      user.username.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    
    // 角色筛选
    const matchesRole = !userRoleFilter.value || user.role === userRoleFilter.value
    
    // 付费等级筛选
    const matchesPlan = !userPlanFilter.value || user.plan === userPlanFilter.value
    
    // 日期范围筛选
    const matchesDate = !dateRange.value || (() => {
      const userDate = new Date(user.createdAt)
      const startDate = dateRange.value![0]
      const endDate = dateRange.value![1]
      return userDate >= startDate && userDate <= endDate
    })()
    
    return matchesSearch && matchesRole && matchesPlan && matchesDate
  })
})

// 用户对话框
const userDialogVisible = ref(false)
const isEditMode = ref(false)
const userForm = ref({
  id: '',
  username: '',
  email: '',
  phone: '',
  wechat: '',
  role: '',
  plan: '',
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
  },
  {
    id: 'R004',
    name: '单模块管理员',
    description: '拥有单个模块所有权限'
  },
  {
    id: 'R005',
    name: '多模块管理员',
    description: '拥有多个模块的所有权限'
  },
  {
    id: 'R006',
    name: '高级用户',
    description: '拥有基础操作权限和智能模块操作权限'
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
const permissionTreeRef = ref()
const permissionTemplate = ref('')

// 角色权限映射 - 重构后（符合最小权限原则）
const rolePermissions = ref<Record<string, string[]>>({
  'R001': [ // 管理员 - 拥有所有权限
    // 系统管理
    'P001', 'P001-1', 'P001-1-1', 'P001-1-2', 'P001-1-3', 'P001-1-4', 'P001-1-5',
    'P001-2', 'P001-2-1', 'P001-2-2', 'P001-2-3', 'P001-2-4', 'P001-2-5',
    'P001-3', 'P001-3-1', 'P001-3-2', 'P001-3-3', 'P001-3-4',
    'P001-4', 'P001-4-1', 'P001-4-2', 'P001-4-3',
    // 规标管理
    'P002', 'P002-1', 'P002-1-1', 'P002-1-2', 'P002-1-3', 'P002-1-4', 'P002-1-5',
    'P002-2', 'P002-2-1', 'P002-2-2', 'P002-2-3',
    'P002-3', 'P002-3-1', 'P002-3-2', 'P002-3-3',
    'P002-4', 'P002-4-1', 'P002-4-2', 'P002-4-3',
    // 工程管理
    'P003', 'P003-1', 'P003-1-1', 'P003-1-2', 'P003-1-3',
    'P003-2', 'P003-2-1', 'P003-2-2', 'P003-2-3',
    'P003-3', 'P003-3-1', 'P003-3-2', 'P003-3-3',
    'P003-4', 'P003-4-1', 'P003-4-2', 'P003-4-3', 'P003-4-4',
    // 事故管理
    'P004', 'P004-1', 'P004-1-1', 'P004-1-2', 'P004-1-3', 'P004-1-4',
    'P004-2', 'P004-2-1', 'P004-2-2', 'P004-2-3',
    'P004-3', 'P004-3-1', 'P004-3-2', 'P004-3-3', 'P004-3-4',
    // 知识库
    'P005', 'P005-1', 'P005-1-1', 'P005-1-2', 'P005-1-3', 'P005-1-4',
    'P005-2', 'P005-2-1', 'P005-2-2', 'P005-2-3'
  ],
  'R002': [ // 普通用户 - 基础操作权限
    // 规标管理
    'P002-2', 'P002-2-1', 'P002-2-2',
    'P002-3', 'P002-3-1', 'P002-3-2',
    // 工程管理
    'P003-1', 'P003-1-1', 'P003-1-2',
    // 知识库
    'P005-2', 'P005-2-1'
  ],
  'R003': [ // 只读用户 - 只能查看数据
    // 规标管理
    'P002-2', 'P002-2-1', 'P002-2-2',
    // 知识库
    'P005-2', 'P005-2-1'
  ],
  'R004': [ // 单模块管理员（规标管理）
    // 规标管理
    'P002', 'P002-1', 'P002-1-1', 'P002-1-2', 'P002-1-3', 'P002-1-4', 'P002-1-5',
    'P002-2', 'P002-2-1', 'P002-2-2', 'P002-2-3',
    'P002-3', 'P002-3-1', 'P002-3-2', 'P002-3-3',
    'P002-4', 'P002-4-1', 'P002-4-2', 'P002-4-3'
  ],
  'R005': [ // 多模块管理员（规标管理、工程管理、事故管理）
    // 规标管理
    'P002', 'P002-1', 'P002-1-1', 'P002-1-2', 'P002-1-3', 'P002-1-4', 'P002-1-5',
    'P002-2', 'P002-2-1', 'P002-2-2', 'P002-2-3',
    'P002-3', 'P002-3-1', 'P002-3-2', 'P002-3-3',
    'P002-4', 'P002-4-1', 'P002-4-2', 'P002-4-3',
    // 工程管理
    'P003', 'P003-1', 'P003-1-1', 'P003-1-2', 'P003-1-3',
    'P003-2', 'P003-2-1', 'P003-2-2', 'P003-2-3',
    'P003-3', 'P003-3-1', 'P003-3-2', 'P003-3-3',
    'P003-4', 'P003-4-1', 'P003-4-2', 'P003-4-3', 'P003-4-4',
    // 事故管理
    'P004', 'P004-1', 'P004-1-1', 'P004-1-2', 'P004-1-3', 'P004-1-4',
    'P004-2', 'P004-2-1', 'P004-2-2', 'P004-2-3',
    'P004-3', 'P004-3-1', 'P004-3-2', 'P004-3-3', 'P004-3-4'
  ],
  'R006': [ // 高级用户（基础操作权限和智能模块操作权限）
    // 规标管理
    'P002-1', 'P002-1-1', 'P002-1-2', 'P002-1-3',
    'P002-2', 'P002-2-1', 'P002-2-2', 'P002-2-3',
    'P002-3', 'P002-3-1', 'P002-3-2', 'P002-3-3',
    // 工程管理
    'P003-1', 'P003-1-1', 'P003-1-2', 'P003-1-3',
    'P003-2', 'P003-2-1', 'P003-2-2', 'P003-2-3',
    // 事故管理
    'P004-2', 'P004-2-1', 'P004-2-2', 'P004-2-3',
    // 知识库
    'P005-1', 'P005-1-1', 'P005-1-2', 'P005-1-3',
    'P005-2', 'P005-2-1', 'P005-2-2', 'P005-2-3'
  ]
})

// 删除角色对话框
const deleteRoleDialogVisible = ref(false)
const deleteRoleId = ref('')

// 权限树数据 - 重构后
const permissionTree = ref([
  {
    id: 'P001',
    label: '系统管理',
    children: [
      { id: 'P001-1', label: '用户管理', children: [
        { id: 'P001-1-1', label: '查看用户' },
        { id: 'P001-1-2', label: '添加用户' },
        { id: 'P001-1-3', label: '编辑用户' },
        { id: 'P001-1-4', label: '删除用户' },
        { id: 'P001-1-5', label: '批量操作' }
      ]},
      { id: 'P001-2', label: '角色管理', children: [
        { id: 'P001-2-1', label: '查看角色' },
        { id: 'P001-2-2', label: '添加角色' },
        { id: 'P001-2-3', label: '编辑角色' },
        { id: 'P001-2-4', label: '删除角色' },
        { id: 'P001-2-5', label: '设置角色权限' }
      ]},
      { id: 'P001-3', label: '权限管理', children: [
        { id: 'P001-3-1', label: '查看权限' },
        { id: 'P001-3-2', label: '添加权限' },
        { id: 'P001-3-3', label: '编辑权限' },
        { id: 'P001-3-4', label: '删除权限' }
      ]},
      { id: 'P001-4', label: '系统设置', children: [
        { id: 'P001-4-1', label: '基本设置' },
        { id: 'P001-4-2', label: '安全设置' },
        { id: 'P001-4-3', label: '通知设置' }
      ]}
    ]
  },
  {
    id: 'P002',
    label: '规标管理',
    children: [
      { id: 'P002-1', label: '规标数据管理', children: [
        { id: 'P002-1-1', label: '查看数据' },
        { id: 'P002-1-2', label: '添加数据' },
        { id: 'P002-1-3', label: '编辑数据' },
        { id: 'P002-1-4', label: '删除数据' },
        { id: 'P002-1-5', label: '批量操作' }
      ]},
      { id: 'P002-2', label: '规范智阅', children: [
        { id: 'P002-2-1', label: '查看文档' },
        { id: 'P002-2-2', label: '搜索文档' },
        { id: 'P002-2-3', label: '下载文档' }
      ]},
      { id: 'P002-3', label: '规范智答', children: [
        { id: 'P002-3-1', label: '提交问题' },
        { id: 'P002-3-2', label: '查看答案' },
        { id: 'P002-3-3', label: '导出答案' }
      ]},
      { id: 'P002-4', label: '规标导入导出', children: [
        { id: 'P002-4-1', label: '导入规标' },
        { id: 'P002-4-2', label: '导出规标' },
        { id: 'P002-4-3', label: '模板管理' }
      ]}
    ]
  },
  {
    id: 'P003',
    label: '工程管理',
    children: [
      { id: 'P003-1', label: '方案智审', children: [
        { id: 'P003-1-1', label: '提交方案' },
        { id: 'P003-1-2', label: '查看审核结果' },
        { id: 'P003-1-3', label: '导出报告' }
      ]},
      { id: 'P003-2', label: '风险智控', children: [
        { id: 'P003-2-1', label: '风险评估' },
        { id: 'P003-2-2', label: '风险监控' },
        { id: 'P003-2-3', label: '风险报告' }
      ]},
      { id: 'P003-3', label: '合同智审', children: [
        { id: 'P003-3-1', label: '上传合同' },
        { id: 'P003-3-2', label: '查看审核结果' },
        { id: 'P003-3-3', label: '导出报告' }
      ]},
      { id: 'P003-4', label: '工程数据管理', children: [
        { id: 'P003-4-1', label: '查看数据' },
        { id: 'P003-4-2', label: '添加数据' },
        { id: 'P003-4-3', label: '编辑数据' },
        { id: 'P003-4-4', label: '删除数据' }
      ]}
    ]
  },
  {
    id: 'P004',
    label: '事故管理',
    children: [
      { id: 'P004-1', label: '事故案例管理', children: [
        { id: 'P004-1-1', label: '查看案例' },
        { id: 'P004-1-2', label: '添加案例' },
        { id: 'P004-1-3', label: '编辑案例' },
        { id: 'P004-1-4', label: '删除案例' }
      ]},
      { id: 'P004-2', label: '事故分析', children: [
        { id: 'P004-2-1', label: '分析报告' },
        { id: 'P004-2-2', label: '趋势分析' },
        { id: 'P004-2-3', label: '导出报告' }
      ]},
      { id: 'P004-3', label: '媒体报道', children: [
        { id: 'P004-3-1', label: '查看报道' },
        { id: 'P004-3-2', label: '添加报道' },
        { id: 'P004-3-3', label: '编辑报道' },
        { id: 'P004-3-4', label: '删除报道' }
      ]}
    ]
  },
  {
    id: 'P005',
    label: '知识库',
    children: [
      { id: 'P005-1', label: '知识管理', children: [
        { id: 'P005-1-1', label: '查看知识' },
        { id: 'P005-1-2', label: '添加知识' },
        { id: 'P005-1-3', label: '编辑知识' },
        { id: 'P005-1-4', label: '删除知识' }
      ]},
      { id: 'P005-2', label: '知识检索', children: [
        { id: 'P005-2-1', label: '关键词搜索' },
        { id: 'P005-2-2', label: '高级搜索' },
        { id: 'P005-2-3', label: '搜索历史' }
      ]}
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
const planPermissionTreeRef = ref()
const planPermissionTemplate = ref('')

// 付费等级权限映射
const planPermissions = ref<Record<string, string[]>>({
  'PL001': ['P002-2', 'P003-1'],
  'PL002': ['P002', 'P002-1', 'P002-2', 'P003', 'P003-1', 'P003-2', 'P004-2', 'P005-2'],
  'PL003': ['P001', 'P001-1', 'P001-2', 'P001-3', 'P001-4', 'P002', 'P002-1', 'P002-2', 'P002-3', 'P002-4', 'P003', 'P003-1', 'P003-2', 'P003-3', 'P003-4', 'P004', 'P004-1', 'P004-2', 'P004-3', 'P005', 'P005-1', 'P005-2']
})

// 删除付费等级对话框
const deletePlanDialogVisible = ref(false)
const deletePlanId = ref('')

// 权限变更日志
const logs = ref([
  {
    id: 'L001',
    actionType: 'user',
    action: '添加用户: admin',
    operator: 'system',
    timestamp: '2024-01-01 00:00:00',
    ip: '127.0.0.1'
  },
  {
    id: 'L002',
    actionType: 'role',
    action: '添加角色: 管理员',
    operator: 'system',
    timestamp: '2024-01-01 00:00:00',
    ip: '127.0.0.1'
  },
  {
    id: 'L003',
    actionType: 'permission',
    action: '设置角色权限: 管理员',
    operator: 'system',
    timestamp: '2024-01-01 00:00:00',
    ip: '127.0.0.1'
  }
])

// 日志搜索和筛选
const logSearchQuery = ref('')
const logTypeFilter = ref('')

// 过滤后的日志数据
const filteredLogs = computed(() => {
  let result = logs.value
  
  if (logSearchQuery.value) {
    const query = logSearchQuery.value.toLowerCase()
    result = result.filter(log => 
      log.action.toLowerCase().includes(query) ||
      log.operator.toLowerCase().includes(query) ||
      log.ip.toLowerCase().includes(query)
    )
  }
  
  if (logTypeFilter.value) {
    result = result.filter(log => log.actionType === logTypeFilter.value)
  }
  
  return result
})

// 添加用户
const addUser = () => {
  isEditMode.value = false
  userForm.value = {
    id: '',
    username: '',
    email: '',
    phone: '',
    wechat: '',
    role: '',
    plan: '',
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
    addLog('user', `删除用户: ${deleteUserId.value}`)
  }
  deleteDialogVisible.value = false
}

// 切换用户状态
const toggleUserStatus = (user: any) => {
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  user.status = newStatus
  ElMessage.success(`用户 ${user.username} 状态已切换`)
  addLog('user', `切换用户状态: ${user.username} -> ${newStatus === 'active' ? '活跃' : '禁用'}`)
}

// 搜索用户
const searchUsers = () => {
  // 搜索功能由filteredUsers计算属性实现
  ElMessage.info('搜索完成')
}

// 清空用户筛选
const clearUserFilters = () => {
  userSearchQuery.value = ''
  userRoleFilter.value = ''
  userPlanFilter.value = ''
  dateRange.value = null
  ElMessage.info('筛选条件已清空')
}

// 保存用户
const saveUser = () => {
  if (!userForm.value.username || !userForm.value.email || !userForm.value.phone || !userForm.value.wechat || !userForm.value.role || !userForm.value.plan) {
    ElMessage.error('请填写完整的用户信息')
    return
  }
  
  if (isEditMode.value) {
    // 编辑现有用户
    const index = users.value.findIndex(user => user.id === userForm.value.id)
    if (index !== -1 && users.value[index]) {
      const existingUser = users.value[index]
      users.value[index] = { 
        ...userForm.value, 
        createdAt: existingUser.createdAt 
      }
      ElMessage.success('用户编辑成功')
      addLog('user', `编辑用户: ${userForm.value.username}`)
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
    addLog('user', `添加用户: ${newUser.username}`)
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
  if (index !== -1 && roles.value[index]) {
    const roleId = roles.value[index].id
    roles.value.splice(index, 1)
    // 同时删除角色权限映射
    if (roleId) {
      delete rolePermissions.value[roleId]
    }
    ElMessage.success('角色删除成功')
    addLog('role', `删除角色: ${deleteRoleId.value}`)
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
const handlePermissionCheck = (_data: any, _checked: any) => {
  // 权限选择逻辑由el-tree组件处理
}

// 保存权限
const savePermissions = () => {
  rolePermissions.value[currentRole.value.id] = checkedPermissions.value
  ElMessage.success('权限设置成功')
  addLog('permission', `设置角色权限: ${currentRole.value.name}`)
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
      addLog('role', `编辑角色: ${roleForm.value.name}`)
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
    addLog('role', `添加角色: ${newRole.name}`)
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
      const perms = rolePermissions.value[roleId]
      if (perms) {
        rolePermissions.value[roleId] = perms.filter((perm: string) => perm !== deletePermissionId.value)
      }
    }
  
  ElMessage.success('权限删除成功')
  addLog('permission', `删除权限: ${deletePermissionId.value}`)
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
    addLog('permission', `编辑权限: ${permissionForm.value.label} (${permissionForm.value.id})`)
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
    addLog('permission', `添加权限: ${permissionForm.value.label} (${permissionForm.value.id})`)
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
  if (index !== -1 && plans.value[index]) {
    const planId = plans.value[index].id
    plans.value.splice(index, 1)
    // 同时删除付费等级权限映射
    if (planId) {
      delete planPermissions.value[planId]
    }
    ElMessage.success('付费等级删除成功')
    addLog('plan', `删除付费等级: ${deletePlanId.value}`)
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
const handlePlanPermissionCheck = (_data: any, _checked: any) => {
  // 权限选择逻辑由el-tree组件处理
}

// 保存付费等级权限
const savePlanPermissions = () => {
  planPermissions.value[currentPlan.value.id] = planCheckedPermissions.value
  ElMessage.success('付费等级权限设置成功')
  addLog('plan', `设置付费等级权限: ${currentPlan.value.name}`)
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
      addLog('plan', `编辑付费等级: ${planForm.value.name}`)
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
    addLog('plan', `添加付费等级: ${newPlan.name}`)
  }
  
  planDialogVisible.value = false
}

// 权限验证机制
// 权限验证缓存
// const permissionCache = ref(new Map())

// 检查用户是否拥有某个权限
// const checkPermission = (userId: string, permissionId: string): boolean => {
//   // 生成缓存键
//   const cacheKey = `${userId}:${permissionId}`
//   
//   // 检查缓存
//   if (permissionCache.value.has(cacheKey)) {
//     return permissionCache.value.get(cacheKey)
//   }
//   
//   // 查找用户
//   const user = users.value.find(u => u.id === userId)
//   if (!user) {
//     permissionCache.value.set(cacheKey, false)
//     return false
//   }
//   
//   // 查找用户角色
//   const role = roles.value.find(r => r.name === user.role)
//   if (!role) {
//     permissionCache.value.set(cacheKey, false)
//     return false
//   }
//   
//   // 获取角色权限
//   const rolePerms = rolePermissions.value[role.id] || []
//   
//   // 检查权限
//   const result = checkPermissionRecursive(rolePerms, permissionId)
//   
//   // 缓存结果
//   permissionCache.value.set(cacheKey, result)
//   return result
// }

// 批量检查用户权限
// const checkPermissions = (userId: string, permissionIds: string[]): Record<string, boolean> => {
//   const results: Record<string, boolean> = {}
//   
//   permissionIds.forEach(permissionId => {
//     results[permissionId] = checkPermission(userId, permissionId)
//   })
//   
//   return results
// }

// 递归检查权限（包括父权限）
// const checkPermissionRecursive = (permissions: string[], permissionId: string): boolean => {
//   // 直接检查权限
//   if (permissions.includes(permissionId)) return true
//   
//   // 检查父权限
//   const parentPermissionId = getParentPermissionId(permissionId)
//   if (parentPermissionId) {
//     return checkPermissionRecursive(permissions, parentPermissionId)
//   }
//   
//   return false
// }

// 获取父权限ID
// const getParentPermissionId = (permissionId: string): string | null => {
//   // 例如：P001-1的父权限是P001
//   const parts = permissionId.split('-')
//   if (parts.length > 1 && parts[0]) {
//     return parts[0]
//   }
//   return null
// }

// 检查付费等级权限
// const checkPlanPermission = (planId: string, permissionId: string): boolean => {
//   const planPerms = planPermissions.value[planId] || []
//   return checkPermissionRecursive(planPerms, permissionId)
// }

// 批量检查付费等级权限
// const checkPlanPermissions = (planId: string, permissionIds: string[]): Record<string, boolean> => {
//   const results: Record<string, boolean> = {}
//   
//   permissionIds.forEach(permissionId => {
//     results[permissionId] = checkPlanPermission(planId, permissionId)
//   })
//   
//   return results
// }

// 清除权限缓存
// const clearPermissionCache = () => {
//   permissionCache.value.clear()
//   ElMessage.success('权限缓存已清除')
// }

// 检查用户是否拥有模块权限
// const checkModulePermission = (userId: string, moduleId: string): boolean => {
//   return checkPermission(userId, moduleId)
// }

// 检查用户是否拥有操作权限
// const checkOperationPermission = (userId: string, operationId: string): boolean => {
//   return checkPermission(userId, operationId)
// }

// 权限层级结构
// 获取权限的完整层级路径
// const getPermissionPath = (permissionId: string): string[] => {
//   const path: string[] = [permissionId]
//   let parentId = getParentPermissionId(permissionId)
//   
//   while (parentId) {
//     path.unshift(parentId)
//     parentId = getParentPermissionId(parentId)
//   }
//   
//   return path
// }

// 获取权限的子权限
// const getChildPermissions = (permissionId: string): string[] => {
//   const children: string[] = []
//   
//   const findChildren = (nodes: any[]) => {
//     for (const node of nodes) {
//       if (node.id === permissionId && node.children) {
//         node.children.forEach((child: any) => {
//           children.push(child.id)
//           if (child.children) {
//             findChildren(child.children)
//           }
//         })
//         return
//       }
//       if (node.children) {
//         findChildren(node.children)
//       }
//     }
//   }
//   
//   findChildren(permissionTree.value)
//   return children
// }

// 角色权限批量操作方法
// 全选所有权限
const selectAllPermissions = () => {
  const allPerms: string[] = []
  const collectPermissions = (nodes: any[]) => {
    for (const node of nodes) {
      allPerms.push(node.id)
      if (node.children) {
        collectPermissions(node.children)
      }
    }
  }
  collectPermissions(permissionTree.value)
  checkedPermissions.value = allPerms
  ElMessage.success('已全选所有权限')
}

// 清空所有权限
const clearAllPermissions = () => {
  checkedPermissions.value = []
  ElMessage.success('已清空所有权限')
}

// 展开所有权限节点
const expandAllPermissions = async () => {
  await nextTick()
  permissionTreeRef.value?.expandAll()
  ElMessage.success('已展开所有权限节点')
}

// 收起所有权限节点
const collapseAllPermissions = async () => {
  await nextTick()
  permissionTreeRef.value?.collapseAll()
  ElMessage.success('已收起所有权限节点')
}

// 应用权限模板
const applyTemplate = () => {
  if (!permissionTemplate.value) {
    ElMessage.warning('请选择权限模板')
    return
  }
  
  switch (permissionTemplate.value) {
    case 'admin':
      checkedPermissions.value = rolePermissions.value['R001'] || []
      break
    case 'user':
      checkedPermissions.value = rolePermissions.value['R002'] || []
      break
    case 'reader':
      checkedPermissions.value = rolePermissions.value['R003'] || []
      break
  }
  ElMessage.success('权限模板应用成功')
}

// 付费等级权限批量操作方法
// 全选所有权限
const selectAllPlanPermissions = () => {
  const allPerms: string[] = []
  const collectPermissions = (nodes: any[]) => {
    for (const node of nodes) {
      allPerms.push(node.id)
      if (node.children) {
        collectPermissions(node.children)
      }
    }
  }
  collectPermissions(permissionTree.value)
  planCheckedPermissions.value = allPerms
  ElMessage.success('已全选所有权限')
}

// 清空所有权限
const clearAllPlanPermissions = () => {
  planCheckedPermissions.value = []
  ElMessage.success('已清空所有权限')
}

// 展开所有权限节点
const expandAllPlanPermissions = async () => {
  await nextTick()
  planPermissionTreeRef.value?.expandAll()
  ElMessage.success('已展开所有权限节点')
}

// 收起所有权限节点
const collapseAllPlanPermissions = async () => {
  await nextTick()
  planPermissionTreeRef.value?.collapseAll()
  ElMessage.success('已收起所有权限节点')
}

// 应用付费等级权限模板
const applyPlanTemplate = () => {
  if (!planPermissionTemplate.value) {
    ElMessage.warning('请选择权限模板')
    return
  }
  
  switch (planPermissionTemplate.value) {
    case 'free':
      planCheckedPermissions.value = planPermissions.value['PL001'] || []
      break
    case 'standard':
      planCheckedPermissions.value = planPermissions.value['PL002'] || []
      break
    case 'enterprise':
      planCheckedPermissions.value = planPermissions.value['PL003'] || []
      break
  }
  ElMessage.success('权限模板应用成功')
}

// 日志相关方法
// 记录权限变更日志
const addLog = (actionType: string, action: string, operator: string = 'admin') => {
  const newLog = {
    id: `L${String(logs.value.length + 1).padStart(3, '0')}`,
    actionType,
    action,
    operator,
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    ip: '127.0.0.1' // 实际应用中应从请求中获取
  }
  logs.value.unshift(newLog)
}

// 搜索日志
const searchLogs = () => {
  ElMessage.info('日志搜索完成')
}

// 清空日志筛选
const clearLogFilters = () => {
  logSearchQuery.value = ''
  logTypeFilter.value = ''
  ElMessage.success('筛选条件已清空')
}

// 获取日志类型标签样式
const getLogTypeTagType = (actionType: string): string => {
  switch (actionType) {
    case 'user': return 'primary'
    case 'role': return 'success'
    case 'permission': return 'warning'
    case 'plan': return 'info'
    default: return 'default'
  }
}

// 获取日志类型标签文本
const getLogTypeLabel = (actionType: string): string => {
  switch (actionType) {
    case 'user': return '用户操作'
    case 'role': return '角色操作'
    case 'permission': return '权限操作'
    case 'plan': return '付费等级操作'
    default: return '其他操作'
  }
}

// 用户权限自助管理
// 当前用户信息
const currentUser = ref({
  id: 'U001',
  username: 'admin',
  email: 'admin@example.com',
  role: '管理员',
  plan: '企业版'
})

// 生成用户权限树
const userPermissionTree = computed(() => {
  const buildPermissionTree = (nodes: any[]) => {
    return nodes.map(node => {
      // 模拟权限检查，实际应用中应该使用真实的权限检查逻辑
      const hasPermission = true
      const newNode = {
        ...node,
        hasPermission
      }
      if (node.children) {
        newNode.children = buildPermissionTree(node.children)
      }
      return newNode
    })
  }
  return buildPermissionTree(permissionTree.value)
})

// 权限申请表单
const permissionRequestForm = ref({
  permissionId: '',
  reason: ''
})

// 提交权限申请
const submitPermissionRequest = () => {
  if (!permissionRequestForm.value.permissionId || !permissionRequestForm.value.reason) {
    ElMessage.error('请填写完整的申请信息')
    return
  }
  
  // 查找权限名称
  const permission = allPermissions.value.find(p => p.id === permissionRequestForm.value.permissionId)
  const permissionName = permission ? permission.label : permissionRequestForm.value.permissionId
  
  // 记录权限申请日志
  addLog('user', `申请权限: ${permissionName}，理由: ${permissionRequestForm.value.reason}`, currentUser.value.username)
  
  ElMessage.success('权限申请提交成功，请等待管理员审批')
  
  // 重置表单
  permissionRequestForm.value = {
    permissionId: '',
    reason: ''
  }
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
    border: 1px solid #e4e7ed;
    
    .el-table__header-wrapper {
      background-color: #f5f7fa;
    }
    
    .el-table__row {
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
    
    .el-table__cell {
      border-right: 1px solid #e4e7ed;
      border-bottom: 1px solid #e4e7ed;
    }
    
    .el-table__header th {
      border-right: 1px solid #e4e7ed;
      border-bottom: 1px solid #e4e7ed;
    }
  }
  
  // 分模块显示不同背景色
  .el-tab-pane {
    &:nth-child(1) { // 用户管理
      background-color: #f9fafc;
      padding: 20px;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    &:nth-child(2) { // 角色管理
      background-color: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    &:nth-child(3) { // 权限管理
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    &:nth-child(4) { // 付费等级
      background-color: #fff7e6;
      padding: 20px;
      border-radius: 8px;
      margin-top: 10px;
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
    margin-top: 10px;
    
    .el-tree-node {
      padding: 4px 0;
    }
  }
  
  // 权限树操作按钮样式
  .permission-tree-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e4e7ed;
    
    .el-button {
      padding: 4px 12px;
      font-size: 12px;
    }
  }
  
  // 自助管理样式
  .self-management {
    padding: 20px;
    background-color: #f9fafc;
    border-radius: 8px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
    
    .user-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .label {
          font-weight: 500;
          color: #606266;
        }
        
        .value {
          color: #303133;
        }
      }
    }
    
    .permission-status {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 10px;
      
      &.success {
        background-color: #f0f9eb;
        color: #67c23a;
      }
      
      &.error {
        background-color: #fef0f0;
        color: #f56c6c;
      }
    }
    
    .el-card {
      margin-bottom: 20px;
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