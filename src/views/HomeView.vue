<template>
  <div class="home-view">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>SpecMaster</h1>
        <p>规范标准综合应用系统</p>
        <p class="hero-description">
          基于Vue框架和大语言模型技术，为工程领域提供规范标准管理、智能阅读、智能问答、方案审查、风险控制、合同审查等全方位的智能化服务。
        </p>
        <div class="hero-actions">
          <router-link to="/spec-data" class="btn-primary">开始使用</router-link>
          <a href="#features" class="btn-secondary">了解更多</a>
        </div>
      </div>
    </section>

    <!-- 功能特性 -->
    <section id="features" class="features-section">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <!-- 功能卡片 1 -->
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <h3>规标大数据</h3>
          <p>统一管理工程相关的规范标准，包括规范标准的名称、编号、用途、类型、等级、是否有效、实施日期、编制单位等信息，以及每个规范标准的历史版本和相关说明、pdf、html、docx等不同格式的文件。</p>
          <router-link to="/spec-data" class="feature-link">查看详情</router-link>
        </div>

        <!-- 功能卡片 2 -->
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Reading /></el-icon>
          </div>
          <h3>规范智阅</h3>
          <p>在规标大数据模块中选择多个规范生成阅览主题知识库，可对目标规范标准进行单选或多选进行同步阅览，并利用大语言模型进行目标规范标准的同步翻译、摘要提取、导图生成、知识图谱生成、公式识别、有声阅读等功能。</p>
          <router-link to="/spec-reader" class="feature-link">查看详情</router-link>
        </div>

        <!-- 功能卡片 3 -->
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><HelpFilled /></el-icon>
          </div>
          <h3>规范智答</h3>
          <p>在规标大数据模块中选择多个规范生成问答主题知识库，然后加载不同主题的知识库进行基于大语言模型的问题，获得相关的信息。</p>
          <router-link to="/spec-qa" class="feature-link">查看详情</router-link>
        </div>

        <!-- 功能卡片 4 -->
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Check /></el-icon>
          </div>
          <h3>方案智审</h3>
          <p>在规标大数据模块中选择多个规范生成审查依据标准库，然后上传目标待审查的施工方案，提出项目概要、编制依据、方案的用途、关键词等信息，然后根据规范标准对施工方案利用大语言模型的理解和推理能力进行评审。</p>
          <router-link to="/plan-review" class="feature-link">查看详情</router-link>
        </div>

        <!-- 功能卡片 5 -->
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <h3>风险智控</h3>
          <p>对上传的施工安全专项方案，根据风险管理相关规范进行风险识别、风险评估、风险处理、专家评审、方案报批、项目归档等，该流程同样需要基于规标大数据模块的选择的多个风险管理控制、安全法规等规范标准生产的风险识别相关规范、类似事故案例等组成的知识库。</p>
          <router-link to="/risk-control" class="feature-link">查看详情</router-link>
        </div>

        <!-- 功能卡片 6 -->
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Document /></el-icon>
          </div>
          <h3>合同智审</h3>
          <p>对合同的所有条款给出合作内容、风险条款、法律漏洞等全面多维度的审查，利用大语言模型进行全面审查。同一不同版本的合同进行对比，给出差异，展示过程管理，同时每个条款要求给出存在的问题、修改建议、依据的规范标准等。</p>
          <router-link to="/contract-review" class="feature-link">查看详情</router-link>
        </div>
      </div>
    </section>

    <!-- 会员等级 -->
    <section class="pricing-section">
      <h2 class="section-title">会员等级</h2>
      <div class="pricing-grid">
        <!-- 免费用户 -->
        <div class="pricing-card">
          <h3>免费用户</h3>
          <div class="pricing-price">
            <span class="price">¥0</span>
            <span class="period">/ 永久</span>
          </div>
          <ul class="pricing-features">
            <li>基础功能免费使用</li>
            <li>有限的规范标准访问</li>
            <li>基础的智能阅读功能</li>
            <li>每月5次智能问答</li>
          </ul>
          <button class="btn-primary">立即注册</button>
        </div>

        <!-- 普通会员 -->
        <div class="pricing-card featured">
          <div class="badge">推荐</div>
          <h3>普通会员</h3>
          <div class="pricing-price">
            <span class="price">¥99</span>
            <span class="period">/ 月</span>
          </div>
          <ul class="pricing-features">
            <li>全部基础功能</li>
            <li>完整的规范标准访问</li>
            <li>完整的智能阅读功能</li>
            <li>每月50次智能问答</li>
            <li>基础的方案审查功能</li>
          </ul>
          <button class="btn-primary">立即购买</button>
        </div>

        <!-- 高级会员 -->
        <div class="pricing-card">
          <h3>高级会员</h3>
          <div class="pricing-price">
            <span class="price">¥199</span>
            <span class="period">/ 月</span>
          </div>
          <ul class="pricing-features">
            <li>全部功能</li>
            <li>完整的规范标准访问</li>
            <li>完整的智能阅读功能</li>
            <li>无限次智能问答</li>
            <li>完整的方案审查功能</li>
            <li>完整的风险控制功能</li>
            <li>完整的合同审查功能</li>
          </ul>
          <button class="btn-primary">立即购买</button>
        </div>
      </div>
    </section>

    <!-- 底部区域 -->
    <footer class="footer-section">
      <div class="footer-content">
        <div class="footer-info">
          <h3>SpecMaster</h3>
          <p>规范标准综合应用系统</p>
          <p>基于Vue框架和大语言模型技术，为工程领域提供全方位的智能化服务。</p>
        </div>
        <div class="footer-links">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/">首页</router-link></li>
            <li><router-link to="/spec-data">规标大数据</router-link></li>
            <li><router-link to="/spec-reader">规范智阅</router-link></li>
            <li><router-link to="/spec-qa">规范智答</router-link></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>联系我们</h4>
          <ul>
            <li>邮箱：contact@specmaster.com</li>
            <li>电话：400-123-4567</li>
            <li>地址：北京市海淀区中关村</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 SpecMaster. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 导入图标
import { 
  DataAnalysis, 
  Reading, 
  HelpFilled, 
  Check, 
  Warning, 
  Document 
} from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
}

/* 英雄区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-content h1 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hero-content p {
  font-size: 24px;
  margin-bottom: 24px;
}

.hero-description {
  font-size: 16px !important;
  line-height: 1.6;
  margin-bottom: 32px !important;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn-primary {
  display: inline-block;
  padding: 12px 24px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    background-color: #66b1ff;
  }
}

.btn-secondary {
  display: inline-block;
  padding: 12px 24px;
  background-color: transparent;
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 功能特性 */
.features-section {
  padding: 80px 0;
  background-color: white;
}

.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 64px;
  color: #303133;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.feature-card {
  background-color: #f9f9f9;
  padding: 32px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
}

.feature-icon {
  width: 64px;
  height: 64px;
  background-color: #ecf5ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  el-icon {
    font-size: 28px;
    color: #409EFF;
  }
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.feature-card p {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
  color: #606266;
}

.feature-link {
  font-size: 14px;
  color: #409EFF;
  text-decoration: none;
  transition: all 0.3s;
  
  &:hover {
    color: #66b1ff;
  }
}

/* 会员等级 */
.pricing-section {
  padding: 80px 0;
  background-color: #f5f7fa;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.pricing-card {
  background-color: white;
  padding: 32px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e4e7ed;
  position: relative;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  &.featured {
    border-color: #409EFF;
    transform: scale(1.05);
  }
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #409EFF;
  color: white;
  padding: 4px 16px;
  border-radius: 0 8px 0 8px;
  font-size: 12px;
  font-weight: 500;
}

.pricing-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #303133;
}

.pricing-price {
  margin-bottom: 32px;
}

.price {
  font-size: 32px;
  font-weight: 700;
  color: #409EFF;
}

.period {
  font-size: 14px;
  color: #606266;
}

.pricing-features {
  list-style: none;
  margin-bottom: 32px;
  text-align: left;
}

.pricing-features li {
  padding: 8px 0;
  font-size: 14px;
  color: #606266;
  position: relative;
  padding-left: 24px;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    width: 16px;
    height: 16px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2367C23A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }
}

/* 底部区域 */
.footer-section {
  background-color: #303133;
  color: white;
  padding: 60px 0 30px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  margin-bottom: 30px;
}

.footer-info h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.footer-info p {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  color: #909399;
}

.footer-links h4,
.footer-contact h4 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #e4e7ed;
}

.footer-links ul,
.footer-contact ul {
  list-style: none;
}

.footer-links li,
.footer-contact li {
  padding: 8px 0;
  font-size: 14px;
  color: #909399;
}

.footer-links a {
  color: #909399;
  text-decoration: none;
  transition: all 0.3s;
  
  &:hover {
    color: #409EFF;
  }
}

.footer-bottom {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid #404244;
  font-size: 12px;
  color: #909399;
}
</style>