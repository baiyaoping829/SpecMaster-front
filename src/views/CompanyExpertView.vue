<template>
  <div class="company-expert-view">
    <h2>工程管理</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="单位管理" name="company">
        <div class="company-management">
          <div class="company-search" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center;">
              <el-input
                v-model="companySearchQuery"
                placeholder="搜索单位名称"
                prefix-icon="el-icon-search"
                style="width: 300px;"
              />
              <el-button type="primary" style="margin-left: 12px;">搜索</el-button>
              <el-button type="success" style="margin-left: 12px;" @click="addCompany">添加单位</el-button>
            </div>
            <div v-if="selectedCompanies.length > 0" style="display: flex; align-items: center;">
              <el-button type="danger" @click="batchDeleteCompanies">批量删除</el-button>
            </div>
          </div>
          
          <div style="max-height: 500px; overflow-y: auto;">
            <el-table :data="companies" style="width: 100%;" @selection-change="handleCompanySelectionChange">
              <el-table-column type="selection" width="55" />
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
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="专家管理" name="expert">
        <div class="expert-management">
          <div class="expert-search" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <el-input
                v-model="expertSearchQuery"
                placeholder="搜索专家姓名、专业领域、研究领域"
                prefix-icon="el-icon-search"
                style="width: 300px;"
                @keyup.enter="handleSearch"
              />
              <el-select v-model="filterGender" placeholder="性别" style="width: 120px;">
                <el-option label="全部" value="" />
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
              <el-select v-model="filterCompany" placeholder="所属单位" style="width: 200px;">
                <el-option label="全部" value="" />
                <el-option v-for="company in companies" :key="company.id" :label="company.name" :value="company.name" />
              </el-select>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button type="success" @click="addExpert">添加专家</el-button>
            </div>
            <div v-if="selectedExperts.length > 0" style="display: flex; align-items: center;">
              <el-button type="danger" @click="batchDeleteExperts">批量删除</el-button>
            </div>
          </div>
          
          <div style="max-height: 500px; overflow-y: auto;">
            <el-table :data="pagedExperts" style="width: 100%;" @selection-change="handleExpertSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="专家编号" width="100" />
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="age" label="年龄" width="80" />
              <el-table-column prop="gender" label="性别" width="80" />
              <el-table-column prop="specialty" label="专业领域" min-width="150" />
              <el-table-column prop="researchArea" label="研究领域" min-width="150" />
              <el-table-column prop="title" label="职称" width="120" />
              <el-table-column prop="company" label="所属单位" min-width="150" />
              <el-table-column prop="phone" label="联系电话" width="150" />
              <el-table-column prop="wechat" label="微信" width="150" />
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button size="small" @click="viewExpert(scope.row)">详情</el-button>
                  <el-button size="small" @click="editExpert(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteExpert(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 分页 -->
          <div class="pagination" style="margin-top: 20px; display: flex; justify-content: flex-end;">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredExperts.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="项目管理" name="project">
        <div class="project-management">
          <div class="project-search" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center;">
              <el-input
                v-model="projectSearchQuery"
                placeholder="搜索项目名称"
                prefix-icon="el-icon-search"
                style="width: 300px;"
              />
              <el-button type="primary" style="margin-left: 12px;" @click="handleProjectSearch">搜索</el-button>
              <el-button type="success" style="margin-left: 12px;" @click="addProjectItem">添加项目</el-button>
            </div>
            <div v-if="selectedProjects.length > 0" style="display: flex; align-items: center;">
              <el-button type="danger" @click="batchDeleteProjects">批量删除</el-button>
            </div>
          </div>
          
          <div style="max-height: 500px; overflow-y: auto;">
            <el-table :data="pagedProjects" style="width: 100%;" @selection-change="handleProjectSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="项目编号" width="100" />
              <el-table-column prop="name" label="项目名称" min-width="200" />
              <el-table-column prop="type" label="项目类型" width="120" />
              <el-table-column prop="level" label="项目等级" width="100" />
              <el-table-column prop="startDate" label="开始日期" width="120" />
              <el-table-column prop="endDate" label="结束日期" width="120" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="viewProject(scope.row)">详情</el-button>
                  <el-button size="small" @click="editProject(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteProject(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 分页 -->
          <div class="pagination" style="margin-top: 20px; display: flex; justify-content: flex-end;">
            <el-pagination
              v-model:current-page="projectCurrentPage"
              v-model:page-size="projectPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredProjects.length"
              @size-change="handleProjectSizeChange"
              @current-change="handleProjectCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 添加专家对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form :model="expertForm" :rules="rules" ref="expertFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name" required>
          <el-input v-model="expertForm.name" placeholder="请输入专家姓名" />
        </el-form-item>
        <el-form-item label="年龄" prop="age" required>
          <el-input-number v-model="expertForm.age" :min="18" :max="100" placeholder="请输入年龄" />
        </el-form-item>
        <el-form-item label="性别" prop="gender" required>
          <el-select v-model="expertForm.gender" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业领域" prop="specialty" required>
          <el-input v-model="expertForm.specialty" placeholder="请输入专业领域" />
        </el-form-item>
        <el-form-item label="研究领域" prop="researchArea">
          <el-input v-model="expertForm.researchArea" placeholder="请输入研究领域" />
        </el-form-item>
        <el-form-item label="职称" prop="title" required>
          <el-input v-model="expertForm.title" placeholder="请输入职称" />
        </el-form-item>
        <el-form-item label="所属单位" prop="company" required>
          <el-select v-model="expertForm.company" placeholder="请选择所属单位">
            <el-option v-for="company in companies" :key="company.id" :label="company.name" :value="company.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone" required>
          <el-input v-model="expertForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="微信" prop="wechat">
          <el-input v-model="expertForm.wechat" placeholder="请输入微信号" />
        </el-form-item>
        <el-form-item label="从业经历" prop="workExperience">
          <el-input type="textarea" v-model="expertForm.workExperience" placeholder="请输入从业经历" :rows="3" />
        </el-form-item>
        <el-form-item label="参与评审项目" prop="reviewProjects">
          <el-input type="textarea" v-model="expertForm.reviewProjects" placeholder="请输入参与评审项目" :rows="3" />
        </el-form-item>
        <el-form-item label="特点" prop="characteristics">
          <el-input type="textarea" v-model="expertForm.characteristics" placeholder="请输入专家特点" :rows="3" />
        </el-form-item>
        
        <!-- 正在参与项目 -->
        <el-form-item label="正在参与项目">
          <el-table :data="expertForm.ongoingProjects" style="width: 100%; margin-bottom: 10px;">
            <el-table-column label="项目名称" min-width="200">
              <template #default="scope">
                <el-input v-model="scope.row.name" placeholder="请输入项目名称" />
              </template>
            </el-table-column>
            <el-table-column label="项目特点" min-width="300">
              <template #default="scope">
                <el-input type="textarea" v-model="scope.row.characteristics" placeholder="请输入项目特点" :rows="2" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="danger" size="small" @click="removeOngoingProject(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" @click="addOngoingProject">添加项目</el-button>
        </el-form-item>
        
        <!-- 近三年及未来两年项目 -->
        <el-form-item label="项目参与情况">
          <div v-for="(yearData, yearIndex) in expertForm.projects" :key="yearData.year" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">{{ yearData.year }}年项目</h4>
            <el-table :data="yearData.projectList" style="width: 100%; margin-bottom: 10px;">
              <el-table-column label="项目名称" min-width="200">
                <template #default="scope">
                  <el-input v-model="scope.row.name" placeholder="请输入项目名称" />
                </template>
              </el-table-column>
              <el-table-column label="项目特点" min-width="300">
                <template #default="scope">
                  <el-input type="textarea" v-model="scope.row.characteristics" placeholder="请输入项目特点" :rows="2" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button type="danger" size="small" @click="removeExpertProject(yearIndex, scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" @click="addExpertProject(yearIndex)">添加项目</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="info" @click="intelligentFillExpert" style="margin-left: 12px;">智能填表</el-button>
          <el-button type="primary" @click="submitForm" style="margin-left: 12px;">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 专家详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="专家详情"
      width="600px"
    >
      <div v-if="selectedExpert" class="expert-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="专家编号">{{ selectedExpert.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedExpert.name }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ selectedExpert.age }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ selectedExpert.gender }}</el-descriptions-item>
          <el-descriptions-item label="专业领域">{{ selectedExpert.specialty }}</el-descriptions-item>
          <el-descriptions-item label="研究领域">{{ selectedExpert.researchArea || '无' }}</el-descriptions-item>
          <el-descriptions-item label="职称">{{ selectedExpert.title }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ selectedExpert.company }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedExpert.phone }}</el-descriptions-item>
          <el-descriptions-item label="微信">{{ selectedExpert.wechat || '无' }}</el-descriptions-item>
          <el-descriptions-item label="从业经历" :span="2">{{ selectedExpert.workExperience || '无' }}</el-descriptions-item>
          <el-descriptions-item label="参与评审项目" :span="2">{{ selectedExpert.reviewProjects || '无' }}</el-descriptions-item>
          <el-descriptions-item label="特点" :span="2">{{ selectedExpert.characteristics || '无' }}</el-descriptions-item>
          <el-descriptions-item label="关联用户ID">{{ selectedExpert.userId || '无' }}</el-descriptions-item>
          <el-descriptions-item label="参编规范标准" :span="2">
            <div v-if="selectedExpert.参编Standards && selectedExpert.参编Standards.length > 0">
              <el-tag v-for="standard in selectedExpert.参编Standards" :key="standard" style="margin-right: 8px; margin-bottom: 8px;">{{ standard }}</el-tag>
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
    
    <!-- 添加单位对话框 -->
    <el-dialog
      v-model="companyDialogVisible"
      :title="companyDialogTitle"
      width="800px"
    >
      <el-form :model="companyForm" :rules="companyRules" ref="companyFormRef" label-width="120px">
        <el-form-item label="单位名称" prop="name" required>
          <el-input v-model="companyForm.name" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="单位类型" prop="type" required>
          <el-select v-model="companyForm.type" placeholder="请选择单位类型">
            <el-option label="水利施工" value="水利施工" />
            <el-option label="建筑施工" value="建筑施工" />
            <el-option label="铁路施工" value="铁路施工" />
            <el-option label="矿山工程" value="矿山工程" />
            <el-option label="电力工程" value="电力工程" />
            <el-option label="市政工程" value="市政工程" />
            <el-option label="公路施工" value="公路施工" />
            <el-option label="冶金工程" value="冶金工程" />
            <el-option label="通信工程" value="通信工程" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson" required>
          <el-input v-model="companyForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone" required>
          <el-input v-model="companyForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="地址" prop="address" required>
          <el-input v-model="companyForm.address" placeholder="请输入地址" />
        </el-form-item>
        
        <!-- 公司关系信息 -->
        <el-form-item label="母公司">
          <el-input v-model="companyForm.parentCompany" placeholder="请输入母公司名称" />
        </el-form-item>
        
        <el-form-item label="兄弟公司">
          <div v-for="(company, index) in companyForm.brotherCompanies" :key="index" style="display: flex; align-items: center; margin-bottom: 8px;">
            <el-input v-model="companyForm.brotherCompanies[index]" placeholder="请输入兄弟公司名称" style="flex: 1; margin-right: 8px;" />
            <el-button type="danger" size="small" @click="removeBrotherCompany(index)">删除</el-button>
          </div>
          <el-button type="primary" size="small" @click="addBrotherCompany">添加兄弟公司</el-button>
        </el-form-item>
        
        <el-form-item label="子公司">
          <div v-for="(company, index) in companyForm.subsidiaryCompanies" :key="index" style="display: flex; align-items: center; margin-bottom: 8px;">
            <el-input v-model="companyForm.subsidiaryCompanies[index]" placeholder="请输入子公司名称" style="flex: 1; margin-right: 8px;" />
            <el-button type="danger" size="small" @click="removeSubsidiaryCompany(index)">删除</el-button>
          </div>
          <el-button type="primary" size="small" @click="addSubsidiaryCompany">添加子公司</el-button>
        </el-form-item>
        
        <!-- 近五年项目信息 -->
        <el-form-item label="近五年项目">
          <div v-for="(yearData, yearIndex) in companyForm.recentProjects" :key="yearData.year" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">{{ yearData.year }}年项目</h4>
            <el-table :data="yearData.projects" style="width: 100%; margin-bottom: 10px;">
              <el-table-column label="项目名称" min-width="200">
                <template #default="scope">
                  <el-input v-model="scope.row.name" placeholder="请输入项目名称" />
                </template>
              </el-table-column>
              <el-table-column label="联系人" width="120">
                <template #default="scope">
                  <el-input v-model="scope.row.contactPerson" placeholder="请输入联系人" />
                </template>
              </el-table-column>
              <el-table-column label="联系电话" width="150">
                <template #default="scope">
                  <el-input v-model="scope.row.contactPhone" placeholder="请输入联系电话" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button type="danger" size="small" @click="removeProject(yearIndex, scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" @click="addProject(yearIndex)">添加项目</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="companyDialogVisible = false">取消</el-button>
          <el-button type="info" @click="intelligentFillCompany" style="margin-left: 12px;">智能填表</el-button>
          <el-button type="primary" @click="submitCompanyForm" style="margin-left: 12px;">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加项目对话框 -->
    <el-dialog
      v-model="projectDialogVisible"
      :title="projectDialogTitle"
      width="900px"
    >
      <el-form :model="projectForm" :rules="projectRules" ref="projectFormRef" label-width="100px">
        <el-form-item label="项目名称" prop="name" required>
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目特点">
          <el-input type="textarea" v-model="projectForm.characteristics" placeholder="请输入项目特点" :rows="3" />
        </el-form-item>
        <el-form-item label="项目类型" prop="type" required>
          <el-select v-model="projectForm.type" placeholder="请选择项目类型">
            <el-option label="市政工程" value="市政工程" />
            <el-option label="交通工程" value="交通工程" />
            <el-option label="建筑工程" value="建筑工程" />
            <el-option label="工业工程" value="工业工程" />
            <el-option label="水利工程" value="水利工程" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目等级" prop="level" required>
          <el-select v-model="projectForm.level" placeholder="请选择项目等级">
            <el-option label="国家级" value="国家级" />
            <el-option label="省级" value="省级" />
            <el-option label="市级" value="市级" />
            <el-option label="县级" value="县级" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate" required>
          <el-date-picker v-model="projectForm.startDate" type="date" placeholder="选择开始日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate" required>
          <el-date-picker v-model="projectForm.endDate" type="date" placeholder="选择结束日期" style="width: 100%;" />
        </el-form-item>
        
        <!-- 勘察单位 -->
        <el-form-item label="勘察单位">
          <div v-for="(company, index) in projectForm.surveyCompanies" :key="index" style="border: 1px solid #e4e7ed; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <el-form-item label="单位名称" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.name" placeholder="请输入单位名称" />
              </el-form-item>
              <el-form-item label="角色" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-select v-model="company.role" placeholder="请选择角色">
                  <el-option label="总体勘察" value="总体勘察" />
                  <el-option label="详细勘察" value="详细勘察" />
                  <el-option label="专项勘察" value="专项勘察" />
                </el-select>
              </el-form-item>
              <el-form-item label="联系人" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPerson" placeholder="请输入联系人" />
              </el-form-item>
              <el-form-item label="联系电话" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </div>
            <div style="margin-top: 8px; text-align: right;">
              <el-button type="danger" size="small" @click="removeProjectCompany('surveyCompanies', index)">删除</el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addProjectCompany('surveyCompanies')">添加勘察单位</el-button>
        </el-form-item>
        
        <!-- 设计单位 -->
        <el-form-item label="设计单位">
          <div v-for="(company, index) in projectForm.designCompanies" :key="index" style="border: 1px solid #e4e7ed; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <el-form-item label="单位名称" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.name" placeholder="请输入单位名称" />
              </el-form-item>
              <el-form-item label="角色" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-select v-model="company.role" placeholder="请选择角色">
                  <el-option label="总体设计" value="总体设计" />
                  <el-option label="标段设计" value="标段设计" />
                  <el-option label="专项设计" value="专项设计" />
                </el-select>
              </el-form-item>
              <el-form-item label="联系人" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPerson" placeholder="请输入联系人" />
              </el-form-item>
              <el-form-item label="联系电话" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </div>
            <div style="margin-top: 8px; text-align: right;">
              <el-button type="danger" size="small" @click="removeProjectCompany('designCompanies', index)">删除</el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addProjectCompany('designCompanies')">添加设计单位</el-button>
        </el-form-item>
        
        <!-- 施工单位 -->
        <el-form-item label="施工单位">
          <div v-for="(company, index) in projectForm.constructionCompanies" :key="index" style="border: 1px solid #e4e7ed; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <el-form-item label="单位名称" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.name" placeholder="请输入单位名称" />
              </el-form-item>
              <el-form-item label="角色" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-select v-model="company.role" placeholder="请选择角色">
                  <el-option label="总承包" value="总承包" />
                  <el-option label="专业分包" value="专业分包" />
                  <el-option label="劳务分包" value="劳务分包" />
                </el-select>
              </el-form-item>
              <el-form-item label="联系人" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPerson" placeholder="请输入联系人" />
              </el-form-item>
              <el-form-item label="联系电话" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </div>
            <div style="margin-top: 8px; text-align: right;">
              <el-button type="danger" size="small" @click="removeProjectCompany('constructionCompanies', index)">删除</el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addProjectCompany('constructionCompanies')">添加施工单位</el-button>
        </el-form-item>
        
        <!-- 监理单位 -->
        <el-form-item label="监理单位">
          <div v-for="(company, index) in projectForm.supervisionCompanies" :key="index" style="border: 1px solid #e4e7ed; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <el-form-item label="单位名称" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.name" placeholder="请输入单位名称" />
              </el-form-item>
              <el-form-item label="角色" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-select v-model="company.role" placeholder="请选择角色">
                  <el-option label="总监理" value="总监理" />
                  <el-option label="专业监理" value="专业监理" />
                  <el-option label="监理员" value="监理员" />
                </el-select>
              </el-form-item>
              <el-form-item label="联系人" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPerson" placeholder="请输入联系人" />
              </el-form-item>
              <el-form-item label="联系电话" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </div>
            <div style="margin-top: 8px; text-align: right;">
              <el-button type="danger" size="small" @click="removeProjectCompany('supervisionCompanies', index)">删除</el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addProjectCompany('supervisionCompanies')">添加监理单位</el-button>
        </el-form-item>
        
        <!-- 建设单位 -->
        <el-form-item label="建设单位">
          <div v-for="(company, index) in projectForm.建设单位" :key="index" style="border: 1px solid #e4e7ed; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <el-form-item label="单位名称" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.name" placeholder="请输入单位名称" />
              </el-form-item>
              <el-form-item label="角色" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-select v-model="company.role" placeholder="请选择角色">
                  <el-option label="项目业主" value="项目业主" />
                  <el-option label="代建单位" value="代建单位" />
                  <el-option label="项目管理单位" value="项目管理单位" />
                </el-select>
              </el-form-item>
              <el-form-item label="联系人" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPerson" placeholder="请输入联系人" />
              </el-form-item>
              <el-form-item label="联系电话" style="width: calc(25% - 9px); margin-bottom: 0;">
                <el-input v-model="company.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </div>
            <div style="margin-top: 8px; text-align: right;">
              <el-button type="danger" size="small" @click="removeProjectCompany('建设单位', index)">删除</el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addProjectCompany('建设单位')">添加建设单位</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="projectDialogVisible = false">取消</el-button>
          <el-button type="info" @click="intelligentFillProject" style="margin-left: 12px;">智能填表</el-button>
          <el-button type="primary" @click="submitProjectForm" style="margin-left: 12px;">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 项目详情对话框 -->
    <el-dialog
      v-model="projectDetailDialogVisible"
      title="项目详情"
      width="800px"
    >
      <div v-if="selectedProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目编号">{{ selectedProject.id }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ selectedProject.name }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ selectedProject.type }}</el-descriptions-item>
          <el-descriptions-item label="项目等级">{{ selectedProject.level }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ selectedProject.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ selectedProject.endDate }}</el-descriptions-item>
          <el-descriptions-item label="项目特点" :span="2">{{ selectedProject.characteristics }}</el-descriptions-item>
          
          <!-- 勘察单位 -->
          <el-descriptions-item label="勘察单位" :span="2">
            <div v-if="selectedProject.surveyCompanies && selectedProject.surveyCompanies.length > 0">
              <div v-for="(company, index) in selectedProject.surveyCompanies" :key="index" style="margin-bottom: 8px;">
                <strong>{{ company.name }}</strong> ({{ company.role || '无角色' }}) - 联系人: {{ company.contactPerson }}, 电话: {{ company.contactPhone }}
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <!-- 设计单位 -->
          <el-descriptions-item label="设计单位" :span="2">
            <div v-if="selectedProject.designCompanies && selectedProject.designCompanies.length > 0">
              <div v-for="(company, index) in selectedProject.designCompanies" :key="index" style="margin-bottom: 8px;">
                <strong>{{ company.name }}</strong> ({{ company.role || '无角色' }}) - 联系人: {{ company.contactPerson }}, 电话: {{ company.contactPhone }}
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <!-- 施工单位 -->
          <el-descriptions-item label="施工单位" :span="2">
            <div v-if="selectedProject.constructionCompanies && selectedProject.constructionCompanies.length > 0">
              <div v-for="(company, index) in selectedProject.constructionCompanies" :key="index" style="margin-bottom: 8px;">
                <strong>{{ company.name }}</strong> ({{ company.role || '无角色' }}) - 联系人: {{ company.contactPerson }}, 电话: {{ company.contactPhone }}
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <!-- 监理单位 -->
          <el-descriptions-item label="监理单位" :span="2">
            <div v-if="selectedProject.supervisionCompanies && selectedProject.supervisionCompanies.length > 0">
              <div v-for="(company, index) in selectedProject.supervisionCompanies" :key="index" style="margin-bottom: 8px;">
                <strong>{{ company.name }}</strong> ({{ company.role || '无角色' }}) - 联系人: {{ company.contactPerson }}, 电话: {{ company.contactPhone }}
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <!-- 建设单位 -->
          <el-descriptions-item label="建设单位" :span="2">
            <div v-if="selectedProject.建设单位 && selectedProject.建设单位.length > 0">
              <div v-for="(company, index) in selectedProject.建设单位" :key="index" style="margin-bottom: 8px;">
                <strong>{{ company.name }}</strong> ({{ company.role || '无角色' }}) - 联系人: {{ company.contactPerson }}, 电话: {{ company.contactPhone }}
              </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="projectDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessageBox } from 'element-plus'

// 标签页
const activeTab = ref('company')

// 单位搜索
const companySearchQuery = ref('')

// 专家搜索
const expertSearchQuery = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加专家')
const expertFormRef = ref()

// 单位对话框相关
const companyDialogVisible = ref(false)
const companyDialogTitle = ref('添加单位')
const companyFormRef = ref()

// 详情对话框相关
const detailDialogVisible = ref(false)
const selectedExpert = ref<any>(null)

// 多选相关
const selectedCompanies = ref([]) as any
const selectedExperts = ref([]) as any
const selectedProjects = ref([]) as any

// 项目搜索
const projectSearchQuery = ref('')

// 项目分页相关
const projectCurrentPage = ref(1)
const projectPageSize = ref(10)
const filteredProjects = ref([]) as any
const pagedProjects = ref([]) as any

// 项目对话框相关
const projectDialogVisible = ref(false)
const projectDialogTitle = ref('添加项目')
const projectFormRef = ref()

// 项目详情对话框相关
const projectDetailDialogVisible = ref(false)
const selectedProject = ref<any>(null)

// 项目表单数据
const projectForm = reactive({
  id: '',
  name: '',
  characteristics: '',
  type: '',
  level: '',
  startDate: '',
  endDate: '',
  surveyCompanies: [{
    name: '',
    role: '',
    contactPerson: '',
    contactPhone: ''
  }],
  designCompanies: [{
    name: '',
    role: '',
    contactPerson: '',
    contactPhone: ''
  }],
  constructionCompanies: [{
    name: '',
    role: '',
    contactPerson: '',
    contactPhone: ''
  }],
  supervisionCompanies: [{
    name: '',
    role: '',
    contactPerson: '',
    contactPhone: ''
  }],
  建设单位: [{
    name: '',
    role: '',
    contactPerson: '',
    contactPhone: ''
  }]
}) as any

// 项目表单验证规则
const projectRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择项目等级', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

// 项目数据（模拟10个项目）
const projects = ref([
  {
    id: 'P001',
    name: '北京市轨道交通12号线工程',
    characteristics: '城市轨道交通项目，总长度29.6公里，设站21座',
    type: '市政工程',
    level: '国家级',
    startDate: '2024-01-01',
    endDate: '2027-12-31',
    surveyCompanies: [{
      name: '北京市勘察设计研究院',
      contactPerson: '王工',
      contactPhone: '13800138001'
    }],
    designCompanies: [{
      name: '中国铁路设计集团有限公司',
      contactPerson: '李工',
      contactPhone: '13800138002'
    }],
    constructionCompanies: [{
      name: '中国铁建股份有限公司',
      contactPerson: '张工',
      contactPhone: '13800138003'
    }],
    supervisionCompanies: [{
      name: '北京城建监理有限公司',
      contactPerson: '刘工',
      contactPhone: '13800138004'
    }],
    建设单位: [{
      name: '北京市基础设施投资有限公司',
      contactPerson: '陈工',
      contactPhone: '13800138005'
    }]
  },
  {
    id: 'P002',
    name: '上海市浦东新区综合交通枢纽',
    characteristics: '集机场、高铁、地铁于一体的综合交通枢纽',
    type: '交通工程',
    level: '国家级',
    startDate: '2023-06-01',
    endDate: '2026-06-30',
    surveyCompanies: [{
      name: '上海市勘察设计研究院',
      contactPerson: '赵工',
      contactPhone: '13900139001'
    }],
    designCompanies: [{
      name: '同济大学建筑设计研究院',
      contactPerson: '钱工',
      contactPhone: '13900139002'
    }],
    constructionCompanies: [{
      name: '上海建工集团股份有限公司',
      contactPerson: '孙工',
      contactPhone: '13900139003'
    }],
    supervisionCompanies: [{
      name: '上海建科监理有限公司',
      contactPerson: '周工',
      contactPhone: '13900139004'
    }],
    建设单位: [{
      name: '上海市交通委员会',
      contactPerson: '吴工',
      contactPhone: '13900139005'
    }]
  },
  {
    id: 'P003',
    name: '广州市珠江新城地下空间开发',
    characteristics: '城市地下空间综合开发项目，总建筑面积50万平方米',
    type: '市政工程',
    level: '省级',
    startDate: '2024-03-01',
    endDate: '2027-03-31',
    surveyCompanies: [{
      name: '广东省工程勘察院',
      contactPerson: '郑工',
      contactPhone: '13700137001'
    }],
    designCompanies: [{
      name: '华南理工大学建筑设计研究院',
      contactPerson: '王工',
      contactPhone: '13700137002'
    }],
    constructionCompanies: [{
      name: '中国建筑第四工程局有限公司',
      contactPerson: '李工',
      contactPhone: '13700137003'
    }],
    supervisionCompanies: [{
      name: '广东工程建设监理有限公司',
      contactPerson: '张工',
      contactPhone: '13700137004'
    }],
    建设单位: [{
      name: '广州市城市建设投资集团有限公司',
      contactPerson: '刘工',
      contactPhone: '13700137005'
    }]
  },
  {
    id: 'P004',
    name: '深圳市前海自贸区基础设施建设',
    characteristics: '自贸区基础设施建设项目，包括道路、桥梁、管网等',
    type: '市政工程',
    level: '国家级',
    startDate: '2023-09-01',
    endDate: '2026-09-30',
    surveyCompanies: [{
      name: '深圳市勘察研究院有限公司',
      contactPerson: '陈工',
      contactPhone: '13600136001'
    }],
    designCompanies: [{
      name: '深圳市建筑设计研究总院有限公司',
      contactPerson: '杨工',
      contactPhone: '13600136002'
    }],
    constructionCompanies: [{
      name: '中国建筑第八工程局有限公司',
      contactPerson: '黄工',
      contactPhone: '13600136003'
    }],
    supervisionCompanies: [{
      name: '深圳中海建设监理有限公司',
      contactPerson: '周工',
      contactPhone: '13600136004'
    }],
    建设单位: [{
      name: '深圳市前海开发投资控股有限公司',
      contactPerson: '吴工',
      contactPhone: '13600136005'
    }]
  },
  {
    id: 'P005',
    name: '成都市天府新区中央商务区',
    characteristics: '城市新区中央商务区建设，总建筑面积100万平方米',
    type: '建筑工程',
    level: '省级',
    startDate: '2024-02-01',
    endDate: '2027-02-28',
    surveyCompanies: [{
      name: '四川省地质工程勘察院',
      contactPerson: '赵工',
      contactPhone: '13500135001'
    }],
    designCompanies: [{
      name: '中国建筑西南设计研究院有限公司',
      contactPerson: '钱工',
      contactPhone: '13500135002'
    }],
    constructionCompanies: [{
      name: '四川华西集团有限公司',
      contactPerson: '孙工',
      contactPhone: '13500135003'
    }],
    supervisionCompanies: [{
      name: '四川明清工程咨询有限公司',
      contactPerson: '周工',
      contactPhone: '13500135004'
    }],
    建设单位: [{
      name: '成都天府新区投资集团有限公司',
      contactPerson: '吴工',
      contactPhone: '13500135005'
    }]
  },
  {
    id: 'P006',
    name: '武汉市长江大桥改扩建工程',
    characteristics: '长江大桥改扩建项目，提高通行能力和安全性',
    type: '交通工程',
    level: '国家级',
    startDate: '2023-11-01',
    endDate: '2026-11-30',
    surveyCompanies: [{
      name: '湖北省交通规划设计院',
      contactPerson: '郑工',
      contactPhone: '13400134001'
    }],
    designCompanies: [{
      name: '中交第二公路勘察设计研究院有限公司',
      contactPerson: '王工',
      contactPhone: '13400134002'
    }],
    constructionCompanies: [{
      name: '中铁大桥局集团有限公司',
      contactPerson: '李工',
      contactPhone: '13400134003'
    }],
    supervisionCompanies: [{
      name: '湖北公路工程咨询监理有限公司',
      contactPerson: '张工',
      contactPhone: '13400134004'
    }],
    建设单位: [{
      name: '武汉市交通运输局',
      contactPerson: '刘工',
      contactPhone: '13400134005'
    }]
  },
  {
    id: 'P007',
    name: '西安市地铁8号线工程',
    characteristics: '城市地铁环线工程，总长度50公里，设站37座',
    type: '市政工程',
    level: '省级',
    startDate: '2024-04-01',
    endDate: '2028-04-30',
    surveyCompanies: [{
      name: '陕西省工程勘察研究院',
      contactPerson: '陈工',
      contactPhone: '13300133001'
    }],
    designCompanies: [{
      name: '中铁第一勘察设计院集团有限公司',
      contactPerson: '杨工',
      contactPhone: '13300133002'
    }],
    constructionCompanies: [{
      name: '中国中铁股份有限公司',
      contactPerson: '黄工',
      contactPhone: '13300133003'
    }],
    supervisionCompanies: [{
      name: '西安铁一院工程咨询监理有限责任公司',
      contactPerson: '周工',
      contactPhone: '13300133004'
    }],
    建设单位: [{
      name: '西安市地下铁道有限责任公司',
      contactPerson: '吴工',
      contactPhone: '13300133005'
    }]
  },
  {
    id: 'P008',
    name: '重庆市两江新区智能网联汽车测试基地',
    characteristics: '智能网联汽车测试基地，包含多种测试场景',
    type: '工业工程',
    level: '省级',
    startDate: '2023-08-01',
    endDate: '2025-08-31',
    surveyCompanies: [{
      name: '重庆市勘测院',
      contactPerson: '赵工',
      contactPhone: '13200132001'
    }],
    designCompanies: [{
      name: '中机中联工程有限公司',
      contactPerson: '钱工',
      contactPhone: '13200132002'
    }],
    constructionCompanies: [{
      name: '重庆建工集团股份有限公司',
      contactPerson: '孙工',
      contactPhone: '13200132003'
    }],
    supervisionCompanies: [{
      name: '重庆联盛建设项目管理有限公司',
      contactPerson: '周工',
      contactPhone: '13200132004'
    }],
    建设单位: [{
      name: '重庆两江新区管理委员会',
      contactPerson: '吴工',
      contactPhone: '13200132005'
    }]
  },
  {
    id: 'P009',
    name: '杭州市西湖区城市更新项目',
    characteristics: '老城区城市更新项目，改善人居环境和城市功能',
    type: '市政工程',
    level: '市级',
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    surveyCompanies: [{
      name: '浙江省工程勘察设计院',
      contactPerson: '郑工',
      contactPhone: '13100131001'
    }],
    designCompanies: [{
      name: '浙江大学建筑设计研究院有限公司',
      contactPerson: '王工',
      contactPhone: '13100131002'
    }],
    constructionCompanies: [{
      name: '中天建设集团有限公司',
      contactPerson: '李工',
      contactPhone: '13100131003'
    }],
    supervisionCompanies: [{
      name: '浙江工程建设监理有限公司',
      contactPerson: '张工',
      contactPhone: '13100131004'
    }],
    建设单位: [{
      name: '杭州市西湖区城市建设投资集团有限公司',
      contactPerson: '刘工',
      contactPhone: '13100131005'
    }]
  },
  {
    id: 'P010',
    name: '南京市江北新区科技创新中心',
    characteristics: '科技创新中心建设，总建筑面积30万平方米',
    type: '建筑工程',
    level: '省级',
    startDate: '2023-10-01',
    endDate: '2026-10-31',
    surveyCompanies: [{
      name: '江苏省工程勘察研究院',
      contactPerson: '陈工',
      contactPhone: '13000130001'
    }],
    designCompanies: [{
      name: '东南大学建筑设计研究院有限公司',
      contactPerson: '杨工',
      contactPhone: '13000130002'
    }],
    constructionCompanies: [{
      name: '江苏建工集团有限公司',
      contactPerson: '黄工',
      contactPhone: '13000130003'
    }],
    supervisionCompanies: [{
      name: '江苏建科工程咨询有限公司',
      contactPerson: '周工',
      contactPhone: '13000130004'
    }],
    建设单位: [{
      name: '南京江北新区建设投资集团有限公司',
      contactPerson: '吴工',
      contactPhone: '13000130005'
    }]
  }
])

// 生成近五年的年份数组
const generateRecentYears = () => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i)
  }
  return years
}

// 单位表单数据
const companyForm = reactive({
  id: '',
  name: '',
  type: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  parentCompany: '', // 母公司
  brotherCompanies: [] as string[], // 兄弟公司
  subsidiaryCompanies: [] as string[], // 子公司
  recentProjects: generateRecentYears().map(year => ({
    year,
    projects: [{
      name: '',
      contactPerson: '',
      contactPhone: ''
    }]
  }))
})

// 单位表单验证规则
const companyRules = {
  name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择单位类型', trigger: 'change' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

// 添加项目
const addProject = (yearIndex: number) => {
  if (companyForm.recentProjects[yearIndex]) {
    companyForm.recentProjects[yearIndex].projects.push({
      name: '',
      contactPerson: '',
      contactPhone: ''
    })
  }
}

// 删除项目
const removeProject = (yearIndex: number, projectIndex: number) => {
  if (companyForm.recentProjects[yearIndex] && companyForm.recentProjects[yearIndex].projects.length > 1) {
    companyForm.recentProjects[yearIndex].projects.splice(projectIndex, 1)
  }
}

// 添加兄弟公司
const addBrotherCompany = () => {
  companyForm.brotherCompanies.push('')
}

// 删除兄弟公司
const removeBrotherCompany = (index: number) => {
  companyForm.brotherCompanies.splice(index, 1)
}

// 添加子公司
const addSubsidiaryCompany = () => {
  companyForm.subsidiaryCompanies.push('')
}

// 删除子公司
const removeSubsidiaryCompany = (index: number) => {
  companyForm.subsidiaryCompanies.splice(index, 1)
}

// 生成项目年份范围
const generateProjectYears = () => {
  const years = []
  const currentYear = new Date().getFullYear()
  // 近三年
  for (let i = 2; i >= 0; i--) {
    years.push({ year: currentYear - i, type: 'past' })
  }
  // 未来两年
  for (let i = 1; i <= 2; i++) {
    years.push({ year: currentYear + i, type: 'future' })
  }
  return years
}

// 专家表单数据
const expertForm = reactive({
  id: '',
  name: '',
  age: 0,
  gender: '',
  specialty: '',
  researchArea: '',
  title: '',
  company: '',
  phone: '',
  wechat: '',
  workExperience: '',
  reviewProjects: '',
  characteristics: '',
  userId: '', // 关联的注册用户ID
 参编Standards: [], // 参编的规范标准列表
  projects: generateProjectYears().map(item => ({
    year: item.year,
    type: item.type,
    projectList: [{
      name: '',
      characteristics: ''
    }]
  })),
  ongoingProjects: [{
    name: '',
    characteristics: ''
  }]
})

// 添加专家项目
const addExpertProject = (yearIndex: number) => {
  if (expertForm.projects[yearIndex]) {
    expertForm.projects[yearIndex].projectList.push({
      name: '',
      characteristics: ''
    })
  }
}

// 删除专家项目
const removeExpertProject = (yearIndex: number, projectIndex: number) => {
  if (expertForm.projects[yearIndex] && expertForm.projects[yearIndex].projectList.length > 1) {
    expertForm.projects[yearIndex].projectList.splice(projectIndex, 1)
  }
}

// 添加进行中项目
const addOngoingProject = () => {
  expertForm.ongoingProjects.push({
    name: '',
    characteristics: ''
  })
}

// 删除进行中项目
const removeOngoingProject = (index: number) => {
  if (expertForm.ongoingProjects.length > 1) {
    expertForm.ongoingProjects.splice(index, 1)
  }
}

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入专家姓名', trigger: 'blur' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  specialty: [{ required: true, message: '请输入专业领域', trigger: 'blur' }],
  title: [{ required: true, message: '请输入职称', trigger: 'blur' }],
  company: [{ required: true, message: '请选择所属单位', trigger: 'change' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

// 工程单位数据
const companies = ref([
  {
    id: 'C001',
    name: '中国交通工程总公司',
    type: '水利施工',
    contactPerson: '赵明',
    contactPhone: '13396215124',
    address: '西安市房山区北四环6号'
  },
  {
    id: 'C002',
    name: '武汉土木工程工程局',
    type: '水利施工',
    contactPerson: '马娜',
    contactPhone: '18355769444',
    address: '广州市石景山区建国门外大街203号'
  },
  {
    id: 'C003',
    name: '天津市政工程集团公司',
    type: '建筑施工',
    contactPerson: '孙强',
    contactPhone: '17037068675',
    address: '深圳市昌平区南四环662号'
  },
  {
    id: 'C004',
    name: '上海建设工程总公司',
    type: '铁路施工',
    contactPerson: '赵伟',
    contactPhone: '17047724876',
    address: '成都市石景山区建国门外大街225号'
  },
  {
    id: 'C005',
    name: '郑州交通工程有限公司',
    type: '矿山工程',
    contactPerson: '吴丽',
    contactPhone: '17027196875',
    address: '苏州市平谷区西三环980号'
  },
  {
    id: 'C006',
    name: '成都土木工程总公司',
    type: '铁路施工',
    contactPerson: '赵鹏',
    contactPhone: '13625837307',
    address: '广州市顺义区中关村大街158号'
  },
  {
    id: 'C007',
    name: '杭州冶金工程股份有限公司',
    type: '电力工程',
    contactPerson: '周刚',
    contactPhone: '13799614195',
    address: '南京市大兴区德胜门外大街651号'
  },
  {
    id: 'C008',
    name: '天津电力工程总公司',
    type: '铁路施工',
    contactPerson: '马刚',
    contactPhone: '17212226267',
    address: '苏州市怀柔区建国门外大街127号'
  },
  {
    id: 'C009',
    name: '成都土木工程工程局',
    type: '电力工程',
    contactPerson: '赵阳',
    contactPhone: '17726011090',
    address: '广州市石景山区朝阳路16号'
  },
  {
    id: 'C010',
    name: '成都交通工程有限公司',
    type: '市政工程',
    contactPerson: '张明',
    contactPhone: '13809312656',
    address: '北京市平谷区复兴门外大街90号'
  },
  {
    id: 'C011',
    name: '杭州交通工程工程局',
    type: '公路施工',
    contactPerson: '赵刚',
    contactPhone: '13188108511',
    address: '西安市平谷区南四环754号'
  },
  {
    id: 'C012',
    name: '中国土木工程有限公司',
    type: '铁路施工',
    contactPerson: '郑辉',
    contactPhone: '13016828336',
    address: '武汉市门头沟区北四环530号'
  },
  {
    id: 'C013',
    name: '杭州建筑工程有限公司',
    type: '矿山工程',
    contactPerson: '周超',
    contactPhone: '17217705992',
    address: '武汉市丰台区建国门外大街84号'
  },
  {
    id: 'C014',
    name: '成都电力工程工程局',
    type: '冶金工程',
    contactPerson: '杨明',
    contactPhone: '17631495847',
    address: '杭州市石景山区西三环881号'
  },
  {
    id: 'C015',
    name: '西安市政工程股份有限公司',
    type: '矿山工程',
    contactPerson: '陈强',
    contactPhone: '15763511468',
    address: '南京市朝阳区王府井大街256号'
  },
  {
    id: 'C016',
    name: '重庆通信工程有限公司',
    type: '建筑施工',
    contactPerson: '郑艳',
    contactPhone: '18396886137',
    address: '武汉市石景山区建国路153号'
  },
  {
    id: 'C017',
    name: '西安冶金工程总公司',
    type: '水利施工',
    contactPerson: '吴芳',
    contactPhone: '18276276519',
    address: '苏州市大兴区复兴路765号'
  },
  {
    id: 'C018',
    name: '重庆矿山工程股份有限公司',
    type: '水利施工',
    contactPerson: '钱涛',
    contactPhone: '17303108234',
    address: '成都市昌平区西单大街169号'
  },
  {
    id: 'C019',
    name: '青岛建筑工程工程局',
    type: '通信工程',
    contactPerson: '郑强',
    contactPhone: '13225279175',
    address: '杭州市海淀区复兴路826号'
  },
  {
    id: 'C020',
    name: '西安电力工程股份有限公司',
    type: '通信工程',
    contactPerson: '孙涛',
    contactPhone: '13949175483',
    address: '成都市大兴区朝阳路751号'
  }
])

// 专家数据
const experts = ref([
  {
    id: 'E001',
    name: '赵芳专家',
    age: 39,
    gender: '女',
    specialty: '结构工程',
    researchArea: '环境影响评估、可持续发展',
    title: '高级工程师',
    company: '成都土木工程总公司',
    phone: '13559493239',
    wechat: '赵芳zhuanjia',
    workExperience: '17年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过成都土木工程总公司等多个重点项目的评审',
    characteristics: '严谨细致，工作态度认真',
    userId: 'U001',
    参编Standards: ['GB50010-2010', 'GB50009-2012']
  },
  {
    id: 'E002',
    name: '马辉专家',
    age: 34,
    gender: '男',
    specialty: '机械工程',
    researchArea: '道路工程、桥梁设计',
    title: '教授级高工',
    company: '上海建设工程总公司',
    phone: '18314286080',
    wechat: '马辉zhuanjia',
    workExperience: '12年从业经验，曾参与多个大型机械工程项目的设计和施工',
    reviewProjects: '参与过上海建设工程总公司等多个重点项目的评审',
    characteristics: '专业知识深厚，行业经验丰富',
    userId: 'U002',
    参编Standards: ['SL378-2007', 'GB50011-2010', 'GB50034-2013']
  },
  {
    id: 'E003',
    name: '孙鹏专家',
    age: 49,
    gender: '男',
    specialty: '安全工程',
    researchArea: '城市规划、市政设施',
    title: '研究员',
    company: '西安电力工程股份有限公司',
    phone: '15917349894',
    wechat: '孙鹏zhuanjia',
    workExperience: '27年从业经验，曾参与多个大型安全工程项目的设计和施工',
    reviewProjects: '参与过西安电力工程股份有限公司等多个重点项目的评审',
    characteristics: '擅长结构安全评估，具有丰富的现场经验',
    userId: 'U003',
    参编Standards: ['GB50303-2015']
  },
  {
    id: 'E004',
    name: '刘辉专家',
    age: 56,
    gender: '男',
    specialty: '工程管理',
    researchArea: '环境影响评估、可持续发展',
    title: '高级工程师',
    company: '杭州建筑工程有限公司',
    phone: '15772230417',
    wechat: '刘辉zhuanjia',
    workExperience: '34年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过杭州建筑工程有限公司等多个重点项目的评审',
    characteristics: '严谨细致，工作态度认真',
    userId: 'U004',
    参编Standards: ['JTG D60-2015', 'GB50204-2015', 'SL274-2001']
  },
  {
    id: 'E005',
    name: '赵磊专家',
    age: 56,
    gender: '男',
    specialty: '材料工程',
    researchArea: '通信网络、信息技术',
    title: '助理工程师',
    company: '西安市政工程股份有限公司',
    phone: '18003119958',
    wechat: '赵磊zhuanjia',
    workExperience: '34年从业经验，曾参与多个大型材料工程项目的设计和施工',
    reviewProjects: '参与过西安市政工程股份有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U005',
    参编Standards: ['JTG F80/1-2017', 'GB50011-2010', 'GB50116-2013']
  },
  {
    id: 'E006',
    name: '陈军专家',
    age: 47,
    gender: '男',
    specialty: '通信工程',
    researchArea: '城市规划、市政设施',
    title: '副教授',
    company: '西安市政工程股份有限公司',
    phone: '15741332199',
    wechat: '陈军zhuanjia',
    workExperience: '25年从业经验，曾参与多个大型通信工程项目的设计和施工',
    reviewProjects: '参与过西安市政工程股份有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U006',
    参编Standards: ['GB50010-2010']
  },
  {
    id: 'E007',
    name: '杨勇专家',
    age: 32,
    gender: '男',
    specialty: '机械工程',
    researchArea: '工程造价、成本控制',
    title: '工程师',
    company: '重庆矿山工程股份有限公司',
    phone: '17722610112',
    wechat: '杨勇zhuanjia',
    workExperience: '10年从业经验，曾参与多个大型机械工程项目的设计和施工',
    reviewProjects: '参与过重庆矿山工程股份有限公司等多个重点项目的评审',
    characteristics: '专业知识深厚，行业经验丰富',
    userId: 'U007',
    参编Standards: ['JTG D60-2015', 'GB50011-2010']
  },
  {
    id: 'E008',
    name: '郑健专家',
    age: 54,
    gender: '男',
    specialty: '材料工程',
    researchArea: '工程管理、项目策划',
    title: '教授级高工',
    company: '西安市政工程股份有限公司',
    phone: '15695416120',
    wechat: '郑健zhuanjia',
    workExperience: '32年从业经验，曾参与多个大型材料工程项目的设计和施工',
    reviewProjects: '参与过西安市政工程股份有限公司等多个重点项目的评审',
    characteristics: '理论基础扎实，具有全局视野',
    userId: 'U008',
    参编Standards: ['GB50166-2017']
  },
  {
    id: 'E009',
    name: '赵明专家',
    age: 54,
    gender: '男',
    specialty: '工程管理',
    researchArea: '建筑节能、绿色建筑',
    title: '副教授',
    company: '成都电力工程工程局',
    phone: '17187877482',
    wechat: '赵明zhuanjia',
    workExperience: '32年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过成都电力工程工程局等多个重点项目的评审',
    characteristics: '专业知识深厚，行业经验丰富',
    userId: 'U009',
    参编Standards: ['SL274-2001']
  },
  {
    id: 'E010',
    name: '郑明专家',
    age: 50,
    gender: '女',
    specialty: '结构工程',
    researchArea: '城市规划、市政设施',
    title: '教授',
    company: '上海建设工程总公司',
    phone: '18426674359',
    wechat: '郑明zhuanjia',
    workExperience: '28年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过上海建设工程总公司等多个重点项目的评审',
    characteristics: '擅长结构安全评估，具有丰富的现场经验',
    userId: 'U010',
    参编Standards: ['GB50204-2015', 'GB50166-2017']
  },
  {
    id: 'E011',
    name: '陈军专家',
    age: 56,
    gender: '男',
    specialty: '工程监理',
    researchArea: '工程造价、成本控制',
    title: '助理工程师',
    company: '中国土木工程有限公司',
    phone: '17636736843',
    wechat: '陈军zhuanjia',
    workExperience: '34年从业经验，曾参与多个大型工程监理项目的设计和施工',
    reviewProjects: '参与过中国土木工程有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U011',
    参编Standards: ['GB50204-2015', 'GB50011-2010']
  },
  {
    id: 'E012',
    name: '赵丽专家',
    age: 44,
    gender: '女',
    specialty: '安全工程',
    researchArea: '机械设计、设备管理',
    title: '助理工程师',
    company: '中国土木工程有限公司',
    phone: '13906333618',
    wechat: '赵丽zhuanjia',
    workExperience: '22年从业经验，曾参与多个大型安全工程项目的设计和施工',
    reviewProjects: '参与过中国土木工程有限公司等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U012',
    参编Standards: ['SL378-2007', 'GB50010-2010']
  },
  {
    id: 'E013',
    name: '吴静专家',
    age: 32,
    gender: '女',
    specialty: '电气工程',
    researchArea: '工程监理、质量控制',
    title: '副研究员',
    company: '武汉土木工程工程局',
    phone: '18846796525',
    wechat: '吴静zhuanjia',
    workExperience: '10年从业经验，曾参与多个大型电气工程项目的设计和施工',
    reviewProjects: '参与过武汉土木工程工程局等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U013',
    参编Standards: ['JTG F80/1-2017']
  },
  {
    id: 'E014',
    name: '王军专家',
    age: 59,
    gender: '男',
    specialty: '交通工程',
    researchArea: '工程造价、成本控制',
    title: '助理工程师',
    company: '重庆矿山工程股份有限公司',
    phone: '17160143869',
    wechat: '王军zhuanjia',
    workExperience: '37年从业经验，曾参与多个大型交通工程项目的设计和施工',
    reviewProjects: '参与过重庆矿山工程股份有限公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U014',
    参编Standards: ['SL274-2001']
  },
  {
    id: 'E015',
    name: '刘伟专家',
    age: 58,
    gender: '男',
    specialty: '水利工程',
    researchArea: '预应力结构、抗震设计',
    title: '高级工程师',
    company: '中国土木工程有限公司',
    phone: '18757781163',
    wechat: '刘伟zhuanjia',
    workExperience: '36年从业经验，曾参与多个大型水利工程项目的设计和施工',
    reviewProjects: '参与过中国土木工程有限公司等多个重点项目的评审',
    characteristics: '专业知识深厚，行业经验丰富',
    userId: 'U015',
    参编Standards: ['GB50166-2017', 'GB50010-2010', 'GB50011-2010']
  },
  {
    id: 'E016',
    name: '周鹏专家',
    age: 43,
    gender: '男',
    specialty: '电气工程',
    researchArea: '安全管理、风险评估',
    title: '副教授',
    company: '郑州交通工程有限公司',
    phone: '18053138675',
    wechat: '周鹏zhuanjia',
    workExperience: '21年从业经验，曾参与多个大型电气工程项目的设计和施工',
    reviewProjects: '参与过郑州交通工程有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U016',
    参编Standards: ['GB50010-2010']
  },
  {
    id: 'E017',
    name: '陈鹏专家',
    age: 34,
    gender: '男',
    specialty: '建筑设计',
    researchArea: '安全管理、风险评估',
    title: '高级工程师',
    company: '重庆矿山工程股份有限公司',
    phone: '18695053475',
    wechat: '陈鹏zhuanjia',
    workExperience: '12年从业经验，曾参与多个大型建筑设计项目的设计和施工',
    reviewProjects: '参与过重庆矿山工程股份有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U017',
    参编Standards: ['GB50009-2012', 'SL378-2007']
  },
  {
    id: 'E018',
    name: '张杰专家',
    age: 34,
    gender: '男',
    specialty: '电气工程',
    researchArea: '机械设计、设备管理',
    title: '副教授',
    company: '重庆通信工程有限公司',
    phone: '18906859624',
    wechat: '张杰zhuanjia',
    workExperience: '12年从业经验，曾参与多个大型电气工程项目的设计和施工',
    reviewProjects: '参与过重庆通信工程有限公司等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U018',
    参编Standards: ['GB50010-2010', 'GB50303-2015']
  },
  {
    id: 'E019',
    name: '王伟专家',
    age: 34,
    gender: '男',
    specialty: '机械工程',
    researchArea: '安全管理、风险评估',
    title: '助理工程师',
    company: '重庆通信工程有限公司',
    phone: '15334881969',
    wechat: '王伟zhuanjia',
    workExperience: '12年从业经验，曾参与多个大型机械工程项目的设计和施工',
    reviewProjects: '参与过重庆通信工程有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U019',
    参编Standards: ['SL274-2001', 'JTG F80/1-2017']
  },
  {
    id: 'E020',
    name: '刘强专家',
    age: 58,
    gender: '男',
    specialty: '通信工程',
    researchArea: '工程管理、项目策划',
    title: '助理工程师',
    company: '天津电力工程总公司',
    phone: '17279466054',
    wechat: '刘强zhuanjia',
    workExperience: '36年从业经验，曾参与多个大型通信工程项目的设计和施工',
    reviewProjects: '参与过天津电力工程总公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U020',
    参编Standards: ['JTG D60-2015']
  },
  {
    id: 'E021',
    name: '杨超专家',
    age: 48,
    gender: '男',
    specialty: '工程管理',
    researchArea: '工程管理、项目策划',
    title: '高级工程师',
    company: '郑州交通工程有限公司',
    phone: '13817288983',
    wechat: '杨超zhuanjia',
    workExperience: '26年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过郑州交通工程有限公司等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U021',
    参编Standards: ['GB50010-2010', 'GB50034-2013']
  },
  {
    id: 'E022',
    name: '刘勇专家',
    age: 39,
    gender: '男',
    specialty: '市政工程',
    researchArea: '结构力学、施工技术',
    title: '教授级高工',
    company: '武汉土木工程工程局',
    phone: '17048980037',
    wechat: '刘勇zhuanjia',
    workExperience: '17年从业经验，曾参与多个大型市政工程项目的设计和施工',
    reviewProjects: '参与过武汉土木工程工程局等多个重点项目的评审',
    characteristics: '注重细节，擅长复杂结构分析',
    userId: 'U022',
    参编Standards: ['SL274-2001', 'SL378-2007', 'GB50034-2013']
  },
  {
    id: 'E023',
    name: '赵辉专家',
    age: 33,
    gender: '男',
    specialty: '工程造价',
    researchArea: '水力学、水利枢纽设计',
    title: '助理工程师',
    company: '中国交通工程总公司',
    phone: '15961697454',
    wechat: '赵辉zhuanjia',
    workExperience: '11年从业经验，曾参与多个大型工程造价项目的设计和施工',
    reviewProjects: '参与过中国交通工程总公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U023',
    参编Standards: ['GB50166-2017', 'JTG D60-2015']
  },
  {
    id: 'E024',
    name: '吴静专家',
    age: 43,
    gender: '女',
    specialty: '工程管理',
    researchArea: '机械设计、设备管理',
    title: '研究员',
    company: '西安市政工程股份有限公司',
    phone: '15246179030',
    wechat: '吴静zhuanjia',
    workExperience: '21年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过西安市政工程股份有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U024',
    参编Standards: ['GB50166-2017', 'GB50303-2015']
  },
  {
    id: 'E025',
    name: '赵刚专家',
    age: 37,
    gender: '男',
    specialty: '结构工程',
    researchArea: '工程管理、项目策划',
    title: '工程师',
    company: '重庆矿山工程股份有限公司',
    phone: '13735112589',
    wechat: '赵刚zhuanjia',
    workExperience: '15年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过重庆矿山工程股份有限公司等多个重点项目的评审',
    characteristics: '理论基础扎实，具有全局视野',
    userId: 'U025',
    参编Standards: ['GB50010-2010']
  },
  {
    id: 'E026',
    name: '钱涛专家',
    age: 52,
    gender: '女',
    specialty: '安全工程',
    researchArea: '电力系统、新能源',
    title: '副研究员',
    company: '青岛建筑工程工程局',
    phone: '17050205626',
    wechat: '钱涛zhuanjia',
    workExperience: '30年从业经验，曾参与多个大型安全工程项目的设计和施工',
    reviewProjects: '参与过青岛建筑工程工程局等多个重点项目的评审',
    characteristics: '理论基础扎实，具有全局视野',
    userId: 'U026',
    参编Standards: ['GB50011-2010']
  },
  {
    id: 'E027',
    name: '陈阳专家',
    age: 44,
    gender: '女',
    specialty: '结构工程',
    researchArea: '通信网络、信息技术',
    title: '助理工程师',
    company: '杭州建筑工程有限公司',
    phone: '18292313520',
    wechat: '陈阳zhuanjia',
    workExperience: '22年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过杭州建筑工程有限公司等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U027',
    参编Standards: ['GB50116-2013', 'SL378-2007']
  },
  {
    id: 'E028',
    name: '李明专家',
    age: 35,
    gender: '男',
    specialty: '工程监理',
    researchArea: '工程造价、成本控制',
    title: '工程师',
    company: '上海建设工程总公司',
    phone: '13986259622',
    wechat: '李明zhuanjia',
    workExperience: '13年从业经验，曾参与多个大型工程监理项目的设计和施工',
    reviewProjects: '参与过上海建设工程总公司等多个重点项目的评审',
    characteristics: '注重细节，擅长复杂结构分析',
    userId: 'U028',
    参编Standards: ['JTG D60-2015', 'GB50011-2010']
  },
  {
    id: 'E029',
    name: '黄静专家',
    age: 42,
    gender: '女',
    specialty: '结构工程',
    researchArea: '环境影响评估、可持续发展',
    title: '高级工程师',
    company: '天津电力工程总公司',
    phone: '15119485870',
    wechat: '黄静zhuanjia',
    workExperience: '20年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过天津电力工程总公司等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U029',
    参编Standards: ['SL274-2001', 'GB50034-2013', 'GB50010-2010']
  },
  {
    id: 'E030',
    name: '孙辉专家',
    age: 32,
    gender: '男',
    specialty: '工程管理',
    researchArea: '工程造价、成本控制',
    title: '工程师',
    company: '中国交通工程总公司',
    phone: '17837309686',
    wechat: '孙辉zhuanjia',
    workExperience: '10年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过中国交通工程总公司等多个重点项目的评审',
    characteristics: '严谨细致，工作态度认真',
    userId: 'U030',
    参编Standards: ['GB50034-2013']
  },
  {
    id: 'E031',
    name: '孙涛专家',
    age: 47,
    gender: '男',
    specialty: '建筑设计',
    researchArea: '环境影响评估、可持续发展',
    title: '教授',
    company: '成都交通工程有限公司',
    phone: '18437714314',
    wechat: '孙涛zhuanjia',
    workExperience: '25年从业经验，曾参与多个大型建筑设计项目的设计和施工',
    reviewProjects: '参与过成都交通工程有限公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U031',
    参编Standards: ['GB50009-2012', 'JTG F80/1-2017', 'GB50034-2013']
  },
  {
    id: 'E032',
    name: '赵勇专家',
    age: 48,
    gender: '男',
    specialty: '市政工程',
    researchArea: '工程监理、质量控制',
    title: '研究员',
    company: '杭州建筑工程有限公司',
    phone: '15269189974',
    wechat: '赵勇zhuanjia',
    workExperience: '26年从业经验，曾参与多个大型市政工程项目的设计和施工',
    reviewProjects: '参与过杭州建筑工程有限公司等多个重点项目的评审',
    characteristics: '理论基础扎实，具有全局视野',
    userId: 'U032',
    参编Standards: ['GB50010-2010']
  },
  {
    id: 'E033',
    name: '钱军专家',
    age: 43,
    gender: '男',
    specialty: '通信工程',
    researchArea: '结构力学、施工技术',
    title: '助理工程师',
    company: '天津市政工程集团公司',
    phone: '13186681520',
    wechat: '钱军zhuanjia',
    workExperience: '21年从业经验，曾参与多个大型通信工程项目的设计和施工',
    reviewProjects: '参与过天津市政工程集团公司等多个重点项目的评审',
    characteristics: '理论基础扎实，具有全局视野',
    userId: 'U033',
    参编Standards: ['GB50303-2015', 'GB50011-2010']
  },
  {
    id: 'E034',
    name: '孙军专家',
    age: 41,
    gender: '男',
    specialty: '机械工程',
    researchArea: '城市规划、市政设施',
    title: '教授级高工',
    company: '成都交通工程有限公司',
    phone: '15339433038',
    wechat: '孙军zhuanjia',
    workExperience: '19年从业经验，曾参与多个大型机械工程项目的设计和施工',
    reviewProjects: '参与过成都交通工程有限公司等多个重点项目的评审',
    characteristics: '严谨细致，工作态度认真',
    userId: 'U034',
    参编Standards: ['GB50303-2015', 'SL274-2001', 'GB50011-2010']
  },
  {
    id: 'E035',
    name: '李刚专家',
    age: 58,
    gender: '男',
    specialty: '工程管理',
    researchArea: '水力学、水利枢纽设计',
    title: '工程师',
    company: '郑州交通工程有限公司',
    phone: '17746287358',
    wechat: '李刚zhuanjia',
    workExperience: '36年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过郑州交通工程有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U035',
    参编Standards: ['GB50116-2013']
  },
  {
    id: 'E036',
    name: '李艳专家',
    age: 32,
    gender: '女',
    specialty: '工程造价',
    researchArea: '环境影响评估、可持续发展',
    title: '工程师',
    company: '杭州建筑工程有限公司',
    phone: '13976502474',
    wechat: '李艳zhuanjia',
    workExperience: '10年从业经验，曾参与多个大型工程造价项目的设计和施工',
    reviewProjects: '参与过杭州建筑工程有限公司等多个重点项目的评审',
    characteristics: '严谨细致，工作态度认真',
    userId: 'U036',
    参编Standards: ['GB50011-2010']
  },
  {
    id: 'E037',
    name: '钱健专家',
    age: 58,
    gender: '女',
    specialty: '工程监理',
    researchArea: '机械设计、设备管理',
    title: '教授级高工',
    company: '成都交通工程有限公司',
    phone: '18494229170',
    wechat: '钱健zhuanjia',
    workExperience: '36年从业经验，曾参与多个大型工程监理项目的设计和施工',
    reviewProjects: '参与过成都交通工程有限公司等多个重点项目的评审',
    characteristics: '擅长结构安全评估，具有丰富的现场经验',
    userId: 'U037',
    参编Standards: ['SL274-2001', 'JTG F80/1-2017']
  },
  {
    id: 'E038',
    name: '吴杰专家',
    age: 32,
    gender: '男',
    specialty: '安全工程',
    researchArea: '工程管理、项目策划',
    title: '助理工程师',
    company: '重庆矿山工程股份有限公司',
    phone: '18759247535',
    wechat: '吴杰zhuanjia',
    workExperience: '10年从业经验，曾参与多个大型安全工程项目的设计和施工',
    reviewProjects: '参与过重庆矿山工程股份有限公司等多个重点项目的评审',
    characteristics: '注重细节，擅长复杂结构分析',
    userId: 'U038',
    参编Standards: ['GB50204-2015', 'JTG D60-2015', 'GB50303-2015']
  },
  {
    id: 'E039',
    name: '赵杰专家',
    age: 38,
    gender: '男',
    specialty: '机械工程',
    researchArea: '环境影响评估、可持续发展',
    title: '教授',
    company: '中国交通工程总公司',
    phone: '15611563627',
    wechat: '赵杰zhuanjia',
    workExperience: '16年从业经验，曾参与多个大型机械工程项目的设计和施工',
    reviewProjects: '参与过中国交通工程总公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U039',
    参编Standards: ['GB50009-2012', 'GB50011-2010']
  },
  {
    id: 'E040',
    name: '钱涛专家',
    age: 44,
    gender: '男',
    specialty: '通信工程',
    researchArea: '工程管理、项目策划',
    title: '副教授',
    company: '上海建设工程总公司',
    phone: '18837395045',
    wechat: '钱涛zhuanjia',
    workExperience: '22年从业经验，曾参与多个大型通信工程项目的设计和施工',
    reviewProjects: '参与过上海建设工程总公司等多个重点项目的评审',
    characteristics: '专业知识深厚，行业经验丰富',
    userId: 'U040',
    参编Standards: ['JTG D60-2015', 'SL378-2007']
  },
  {
    id: 'E041',
    name: '张军专家',
    age: 54,
    gender: '男',
    specialty: '结构工程',
    researchArea: '工程监理、质量控制',
    title: '高级工程师',
    company: '中国土木工程有限公司',
    phone: '17159541611',
    wechat: '张军zhuanjia',
    workExperience: '32年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过中国土木工程有限公司等多个重点项目的评审',
    characteristics: '严谨细致，工作态度认真',
    userId: 'U041',
    参编Standards: ['GB50204-2015']
  },
  {
    id: 'E042',
    name: '黄勇专家',
    age: 55,
    gender: '男',
    specialty: '市政工程',
    researchArea: '环境影响评估、可持续发展',
    title: '副研究员',
    company: '青岛建筑工程工程局',
    phone: '18418523940',
    wechat: '黄勇zhuanjia',
    workExperience: '33年从业经验，曾参与多个大型市政工程项目的设计和施工',
    reviewProjects: '参与过青岛建筑工程工程局等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U042',
    参编Standards: ['GB50011-2010']
  },
  {
    id: 'E043',
    name: '杨刚专家',
    age: 36,
    gender: '男',
    specialty: '工程管理',
    researchArea: '工程管理、项目策划',
    title: '助理工程师',
    company: '成都土木工程工程局',
    phone: '17242228723',
    wechat: '杨刚zhuanjia',
    workExperience: '14年从业经验，曾参与多个大型工程管理项目的设计和施工',
    reviewProjects: '参与过成都土木工程工程局等多个重点项目的评审',
    characteristics: '擅长结构安全评估，具有丰富的现场经验',
    userId: 'U043',
    参编Standards: ['GB50303-2015', 'GB50034-2013', 'GB50166-2017']
  },
  {
    id: 'E044',
    name: '赵辉专家',
    age: 57,
    gender: '男',
    specialty: '环境工程',
    researchArea: '工程监理、质量控制',
    title: '教授',
    company: '郑州交通工程有限公司',
    phone: '18612889431',
    wechat: '赵辉zhuanjia',
    workExperience: '35年从业经验，曾参与多个大型环境工程项目的设计和施工',
    reviewProjects: '参与过郑州交通工程有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U044',
    参编Standards: ['GB50010-2010']
  },
  {
    id: 'E045',
    name: '赵刚专家',
    age: 30,
    gender: '女',
    specialty: '水利工程',
    researchArea: '工程管理、项目策划',
    title: '高级工程师',
    company: '中国交通工程总公司',
    phone: '13782529377',
    wechat: '赵刚zhuanjia',
    workExperience: '8年从业经验，曾参与多个大型水利工程项目的设计和施工',
    reviewProjects: '参与过中国交通工程总公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U045',
    参编Standards: ['GB50116-2013', 'JTG D60-2015', 'GB50009-2012']
  },
  {
    id: 'E046',
    name: '郑涛专家',
    age: 57,
    gender: '男',
    specialty: '水利工程',
    researchArea: '城市规划、市政设施',
    title: '教授',
    company: '成都土木工程工程局',
    phone: '17822820847',
    wechat: '郑涛zhuanjia',
    workExperience: '35年从业经验，曾参与多个大型水利工程项目的设计和施工',
    reviewProjects: '参与过成都土木工程工程局等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U046',
    参编Standards: ['GB50166-2017']
  },
  {
    id: 'E047',
    name: '郑阳专家',
    age: 37,
    gender: '男',
    specialty: '结构工程',
    researchArea: '城市规划、市政设施',
    title: '工程师',
    company: '郑州交通工程有限公司',
    phone: '15389815594',
    wechat: '郑阳zhuanjia',
    workExperience: '15年从业经验，曾参与多个大型结构工程项目的设计和施工',
    reviewProjects: '参与过郑州交通工程有限公司等多个重点项目的评审',
    characteristics: '技术全面，实践经验丰富',
    userId: 'U047',
    参编Standards: ['GB50116-2013', 'GB50204-2015', 'JTG F80/1-2017']
  },
  {
    id: 'E048',
    name: '刘军专家',
    age: 37,
    gender: '男',
    specialty: '土木工程',
    researchArea: '机械设计、设备管理',
    title: '教授级高工',
    company: '重庆矿山工程股份有限公司',
    phone: '18563167717',
    wechat: '刘军zhuanjia',
    workExperience: '15年从业经验，曾参与多个大型土木工程项目的设计和施工',
    reviewProjects: '参与过重庆矿山工程股份有限公司等多个重点项目的评审',
    characteristics: '理论基础扎实，具有全局视野',
    userId: 'U048',
    参编Standards: ['GB50204-2015']
  },
  {
    id: 'E049',
    name: '郑伟专家',
    age: 55,
    gender: '男',
    specialty: '工程监理',
    researchArea: '工程监理、质量控制',
    title: '教授级高工',
    company: '西安市政工程股份有限公司',
    phone: '13090215689',
    wechat: '郑伟zhuanjia',
    workExperience: '33年从业经验，曾参与多个大型工程监理项目的设计和施工',
    reviewProjects: '参与过西安市政工程股份有限公司等多个重点项目的评审',
    characteristics: '创新能力强，善于解决复杂问题',
    userId: 'U049',
    参编Standards: ['GB50034-2013', 'SL378-2007']
  },
  {
    id: 'E050',
    name: '郑涛专家',
    age: 44,
    gender: '女',
    specialty: '材料工程',
    researchArea: '安全管理、风险评估',
    title: '教授',
    company: '杭州冶金工程股份有限公司',
    phone: '18822819793',
    wechat: '郑涛zhuanjia',
    workExperience: '22年从业经验，曾参与多个大型材料工程项目的设计和施工',
    reviewProjects: '参与过杭州冶金工程股份有限公司等多个重点项目的评审',
    characteristics: '沟通能力强，团队协作精神好',
    userId: 'U050',
    参编Standards: ['GB50166-2017']
  }
])

// 筛选条件
const filterGender = ref('')
const filterCompany = ref('')

// 过滤后的专家数据
const filteredExperts = ref([]) as any

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 分页后的数据
const pagedExperts = ref([]) as any

// 过滤专家数据
const filterExperts = () => {
  let result = [...experts.value]
  
  // 根据搜索关键词过滤
  if (expertSearchQuery.value) {
    const keyword = expertSearchQuery.value.toLowerCase()
    result = result.filter(expert => 
      expert.name.toLowerCase().includes(keyword) ||
      expert.specialty.toLowerCase().includes(keyword) ||
      (expert.researchArea && expert.researchArea.toLowerCase().includes(keyword))
    )
  }
  
  // 根据性别过滤
  if (filterGender.value) {
    result = result.filter(expert => expert.gender === filterGender.value)
  }
  
  // 根据单位过滤
  if (filterCompany.value) {
    result = result.filter(expert => expert.company === filterCompany.value)
  }
  
  filteredExperts.value = result
  return result
}

// 计算分页数据
const updatePagedExperts = () => {
  const filtered = filterExperts()
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  pagedExperts.value = filtered.slice(start, end)
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置页码
  updatePagedExperts()
}

// 初始化分页数据
updatePagedExperts()

// 处理页码变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  updatePagedExperts()
}

// 处理每页大小变化
const handleCurrentChange = (current: number) => {
  currentPage.value = current
  updatePagedExperts()
}

// 处理单位选择变化
const handleCompanySelectionChange = (val: any[]) => {
  selectedCompanies.value = val
}

// 处理专家选择变化
const handleExpertSelectionChange = (val: any[]) => {
  selectedExperts.value = val
}

// 批量删除单位
const batchDeleteCompanies = () => {
  if (selectedCompanies.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedCompanies.value.length} 个单位吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行批量删除操作
    const idsToDelete = selectedCompanies.value.map((company: any) => company.id)
    companies.value = companies.value.filter(company => !idsToDelete.includes(company.id))
    selectedCompanies.value = []
    console.log('单位批量删除成功')
  }).catch(() => {
    // 取消删除
    console.log('取消删除单位')
  })
}

// 批量删除专家
const batchDeleteExperts = () => {
  if (selectedExperts.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedExperts.value.length} 位专家吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行批量删除操作
    const idsToDelete = selectedExperts.value.map((expert: any) => expert.id)
    experts.value = experts.value.filter(expert => !idsToDelete.includes(expert.id))
    selectedExperts.value = []
    updatePagedExperts()
    console.log('专家批量删除成功')
  }).catch(() => {
    // 取消删除
    console.log('取消删除专家')
  })
}

// 添加单位
const addCompany = () => {
  companyDialogTitle.value = '添加单位'
  // 重置表单
  Object.assign(companyForm, {
    id: '',
    name: '',
    type: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    parentCompany: '',
    brotherCompanies: [],
    subsidiaryCompanies: [],
    recentProjects: generateRecentYears().map(year => ({
      year,
      projects: [{
        name: '',
        contactPerson: '',
        contactPhone: ''
      }]
    }))
  })
  companyDialogVisible.value = true
}

// 编辑单位
const editCompany = (company: any) => {
  companyDialogTitle.value = '编辑单位'
  // 填充表单数据
  Object.assign(companyForm, {
    ...company,
    parentCompany: company.parentCompany || '',
    brotherCompanies: company.brotherCompanies || [],
    subsidiaryCompanies: company.subsidiaryCompanies || [],
    recentProjects: company.recentProjects || generateRecentYears().map(year => ({
      year,
      projects: [{
        name: '',
        contactPerson: '',
        contactPhone: ''
      }]
    }))
  })
  companyDialogVisible.value = true
}

// 删除单位
const deleteCompany = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除该单位吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行删除操作
    const index = companies.value.findIndex(item => item.id === id)
    if (index !== -1) {
      companies.value.splice(index, 1)
      console.log('单位删除成功:', id)
    }
  }).catch(() => {
    // 取消删除
    console.log('取消删除单位:', id)
  })
}

// 提交单位表单
const submitCompanyForm = async () => {
  if (!companyFormRef.value) return
  
  try {
    await companyFormRef.value.validate()
    
    if (companyForm.id) {
      // 编辑操作：更新现有单位
      const index = companies.value.findIndex(item => item.id === companyForm.id)
      if (index !== -1) {
        companies.value[index] = { ...companyForm }
        console.log('单位编辑成功:', companyForm)
      }
    } else {
      // 添加操作：创建新单位
      const newId = 'C' + String(companies.value.length + 1).padStart(3, '0')
      const newCompany = {
        ...companyForm,
        id: newId
      }
      companies.value.push(newCompany)
      console.log('单位添加成功:', newCompany)
    }
    
    companyDialogVisible.value = false
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}

// 智能填表（单位）
const intelligentFillCompany = async () => {
  // 这里可以集成大语言模型API来实现智能填表功能
  // 示例：基于单位名称和类型自动填充其他信息
  if (companyForm.name && companyForm.type) {
    // 模拟智能填表
    console.log('正在智能填充单位信息...')
    // 实际项目中这里会调用API
    setTimeout(() => {
      // 模拟填充结果
      if (!companyForm.contactPerson) {
        companyForm.contactPerson = '张经理'
      }
      if (!companyForm.contactPhone) {
        companyForm.contactPhone = '13800138000'
      }
      if (!companyForm.address) {
        companyForm.address = '北京市朝阳区'
      }
      console.log('智能填充完成')
    }, 1000)
  }
}

// 智能填表（专家）
const intelligentFillExpert = async () => {
  // 这里可以集成大语言模型API来实现智能填表功能
  // 示例：基于姓名和单位自动填充其他信息
  if (expertForm.name && expertForm.company) {
    // 模拟智能填表
    console.log('正在智能填充专家信息...')
    // 实际项目中这里会调用API
    setTimeout(() => {
      // 模拟填充结果
      if (!expertForm.age) {
        expertForm.age = 45
      }
      if (!expertForm.gender) {
        expertForm.gender = '男'
      }
      if (!expertForm.specialty) {
        expertForm.specialty = '土木工程'
      }
      if (!expertForm.title) {
        expertForm.title = '高级工程师'
      }
      if (!expertForm.phone) {
        expertForm.phone = '13900139000'
      }
      console.log('智能填充完成')
    }, 1000)
  }
}

// 过滤项目数据
const filterProjects = () => {
  let result = [...projects.value]
  
  // 根据搜索关键词过滤
  if (projectSearchQuery.value) {
    const keyword = projectSearchQuery.value.toLowerCase()
    result = result.filter(project => 
      project.name.toLowerCase().includes(keyword) ||
      project.characteristics.toLowerCase().includes(keyword)
    )
  }
  
  filteredProjects.value = result
  return result
}

// 计算项目分页数据
const updatePagedProjects = () => {
  const filtered = filterProjects()
  const start = (projectCurrentPage.value - 1) * projectPageSize.value
  const end = start + projectPageSize.value
  pagedProjects.value = filtered.slice(start, end)
}

// 处理项目搜索
const handleProjectSearch = () => {
  projectCurrentPage.value = 1 // 重置页码
  updatePagedProjects()
}

// 处理项目页码变化
const handleProjectSizeChange = (size: number) => {
  projectPageSize.value = size
  updatePagedProjects()
}

// 处理项目每页大小变化
const handleProjectCurrentChange = (current: number) => {
  projectCurrentPage.value = current
  updatePagedProjects()
}

// 处理项目选择变化
const handleProjectSelectionChange = (val: any[]) => {
  selectedProjects.value = val
}

// 添加项目单位
const addProjectCompany = (companyType: string) => {
  projectForm[companyType].push({
    name: '',
    role: '',
    contactPerson: '',
    contactPhone: ''
  })
}

// 删除项目单位
const removeProjectCompany = (companyType: string, index: any) => {
  const numIndex = typeof index === 'string' ? parseInt(index, 10) : index
  if (projectForm[companyType] && projectForm[companyType].length > 1) {
    projectForm[companyType].splice(numIndex, 1)
  }
}

// 添加项目
const addProjectItem = () => {
  projectDialogTitle.value = '添加项目'
  // 重置表单
  Object.assign(projectForm, {
    id: '',
    name: '',
    characteristics: '',
    type: '',
    level: '',
    startDate: '',
    endDate: '',
    surveyCompanies: [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    designCompanies: [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    constructionCompanies: [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    supervisionCompanies: [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    建设单位: [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }]
  })
  projectDialogVisible.value = true
}

// 编辑项目
const editProject = (project: any) => {
  projectDialogTitle.value = '编辑项目'
  // 填充表单数据
  Object.assign(projectForm, {
    ...project,
    surveyCompanies: project.surveyCompanies || [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    designCompanies: project.designCompanies || [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    constructionCompanies: project.constructionCompanies || [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    supervisionCompanies: project.supervisionCompanies || [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }],
    建设单位: project.建设单位 || [{
      name: '',
      role: '',
      contactPerson: '',
      contactPhone: ''
    }]
  })
  projectDialogVisible.value = true
}

// 删除项目
const deleteProject = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除该项目吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行删除操作
    const index = projects.value.findIndex(item => item.id === id)
    if (index !== -1) {
      projects.value.splice(index, 1)
      console.log('项目删除成功:', id)
      updatePagedProjects()
    }
  }).catch(() => {
    // 取消删除
    console.log('取消删除项目:', id)
  })
}

// 批量删除项目
const batchDeleteProjects = () => {
  if (selectedProjects.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedProjects.value.length} 个项目吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行批量删除操作
    const idsToDelete = selectedProjects.value.map((project: any) => project.id)
    projects.value = projects.value.filter(project => !idsToDelete.includes(project.id))
    selectedProjects.value = []
    updatePagedProjects()
    console.log('项目批量删除成功')
  }).catch(() => {
    // 取消删除
    console.log('取消删除项目')
  })
}

// 查看项目详情
const viewProject = (project: any) => {
  selectedProject.value = project
  projectDetailDialogVisible.value = true
}

// 提交项目表单
const submitProjectForm = async () => {
  if (!projectFormRef.value) return
  
  try {
    await projectFormRef.value.validate()
    
    if (projectForm.id) {
      // 编辑操作：更新现有项目
      const index = projects.value.findIndex(item => item.id === projectForm.id)
      if (index !== -1) {
        projects.value[index] = { ...projectForm }
        console.log('项目编辑成功:', projectForm)
      }
    } else {
      // 添加操作：创建新项目
      const newId = 'P' + String(projects.value.length + 1).padStart(3, '0')
      const newProject = {
        ...projectForm,
        id: newId
      }
      projects.value.push(newProject)
      console.log('项目添加成功:', newProject)
    }
    
    projectDialogVisible.value = false
    updatePagedProjects()
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}

// 智能填表（项目）
const intelligentFillProject = async () => {
  // 这里可以集成大语言模型API来实现智能填表功能
  // 示例：基于项目名称自动填充其他信息
  if (projectForm.name) {
    // 模拟智能填表
    console.log('正在智能填充项目信息...')
    // 实际项目中这里会调用API
    setTimeout(() => {
      // 模拟填充结果
      if (!projectForm.type) {
        projectForm.type = '市政工程'
      }
      if (!projectForm.level) {
        projectForm.level = '省级'
      }
      if (!projectForm.startDate) {
        projectForm.startDate = new Date().toISOString().split('T')[0] || ''
      }
      if (!projectForm.endDate) {
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 2)
        projectForm.endDate = endDate.toISOString().split('T')[0] || ''
      }
      console.log('智能填充完成')
    }, 1000)
  }
}

// 初始化项目分页数据
updatePagedProjects()

// 添加专家
const addExpert = () => {
  dialogTitle.value = '添加专家'
  // 重置表单
  Object.assign(expertForm, {
    id: '',
    name: '',
    age: null,
    gender: '',
    specialty: '',
    researchArea: '',
    title: '',
    company: '',
    phone: '',
    wechat: '',
    workExperience: '',
    reviewProjects: '',
    characteristics: '',
    userId: '',
    参编Standards: [],
    projects: generateProjectYears().map(item => ({
      year: item.year,
      type: item.type,
      projectList: [{
        name: '',
        characteristics: ''
      }]
    })),
    ongoingProjects: [{
      name: '',
      characteristics: ''
    }]
  })
  dialogVisible.value = true
}

// 编辑专家
const editExpert = (expert: any) => {
  dialogTitle.value = '编辑专家'
  // 填充表单数据
  Object.assign(expertForm, {
    ...expert,
    参编Standards: expert.参编Standards || [],
    projects: expert.projects || generateProjectYears().map(item => ({
      year: item.year,
      type: item.type,
      projectList: [{
        name: '',
        characteristics: ''
      }]
    })),
    ongoingProjects: expert.ongoingProjects || [{
      name: '',
      characteristics: ''
    }]
  })
  dialogVisible.value = true
}

// 删除专家
const deleteExpert = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除该专家吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 执行删除操作
    const index = experts.value.findIndex(item => item.id === id)
    if (index !== -1) {
      experts.value.splice(index, 1)
      console.log('专家删除成功:', id)
      
      // 更新分页数据
      updatePagedExperts()
    }
  }).catch(() => {
    // 取消删除
    console.log('取消删除专家:', id)
  })
}

// 查看专家详情
const viewExpert = (expert: any) => {
  selectedExpert.value = expert
  detailDialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!expertFormRef.value) return
  
  try {
    await expertFormRef.value.validate()
    
    if (expertForm.id) {
      // 编辑操作：更新现有专家
      const index = experts.value.findIndex(item => item.id === expertForm.id)
      if (index !== -1) {
        experts.value[index] = { ...expertForm }
        console.log('专家编辑成功:', expertForm)
      }
    } else {
      // 添加操作：创建新专家
      const newId = 'E' + String(experts.value.length + 1).padStart(3, '0')
      const newExpert = {
        ...expertForm,
        id: newId
      }
      experts.value.push(newExpert)
      console.log('专家添加成功:', newExpert)
    }
    
    // 关闭对话框
    dialogVisible.value = false
    
    // 更新分页数据
    updatePagedExperts()
  } catch (error) {
    console.log('表单验证失败:', error)
  }
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