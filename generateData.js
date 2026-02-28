// 生成工程单位和专家模拟数据的脚本

// 工程单位类型
const companyTypes = [
  '建筑施工', '铁路施工', '水利施工', '公路施工', '市政工程',
  '电力工程', '通信工程', '石油化工', '冶金工程', '矿山工程'
];

// 专家专业领域
const specialties = [
  '土木工程', '结构工程', '水利工程', '交通工程', '电气工程',
  '通信工程', '市政工程', '建筑设计', '工程管理', '工程造价',
  '工程监理', '环境工程', '安全工程', '机械工程', '材料工程'
];

// 专家研究领域
const researchAreas = [
  '结构力学、施工技术', '预应力结构、抗震设计', '水力学、水利枢纽设计',
  '道路工程、桥梁设计', '电力系统、新能源', '通信网络、信息技术',
  '城市规划、市政设施', '建筑节能、绿色建筑', '工程管理、项目策划',
  '工程造价、成本控制', '工程监理、质量控制', '环境影响评估、可持续发展',
  '安全管理、风险评估', '机械设计、设备管理', '材料科学、新型材料'
];

// 专家职称
const titles = [
  '教授级高工', '高级工程师', '工程师', '助理工程师',
  '教授', '副教授', '研究员', '副研究员'
];

// 参编规范标准
const standards = [
  'GB50009-2012', 'GB50010-2010', 'GB50011-2010', 'GB50204-2015',
  'SL274-2001', 'SL378-2007', 'JTG D60-2015', 'JTG F80/1-2017',
  'GB50034-2013', 'GB50116-2013', 'GB50166-2017', 'GB50303-2015'
];

// 生成随机姓名
function generateName() {
  const surnames = ['张', '王', '李', '赵', '钱', '孙', '周', '吴', '郑', '陈', '杨', '黄', '赵', '马', '刘'];
  const maleNames = ['伟', '强', '军', '勇', '杰', '涛', '磊', '明', '超', '刚', '健', '辉', '鹏', '军', '阳'];
  const femaleNames = ['芳', '娜', '敏', '静', '丽', '艳', '娟', '涛', '明', '超', '刚', '健', '辉', '鹏', '阳'];
  
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const isMale = Math.random() > 0.4; // 60%男性
  const nameArray = isMale ? maleNames : femaleNames;
  const name = nameArray[Math.floor(Math.random() * nameArray.length)];
  
  return { name: surname + name, gender: isMale ? '男' : '女' };
}

// 生成随机电话
function generatePhone() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '170', '171', '172', '173', '175', '176', '177', '178', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

// 生成随机地址
function generateAddress() {
  const provinces = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '武汉市', '成都市', '重庆市', '天津市', '苏州市', '西安市', '长沙市', '青岛市', '郑州市'];
  const districts = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '石景山区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区'];
  const streets = ['建国路', '复兴路', '长安街', '中关村大街', '王府井大街', '西单大街', '东三环', '西三环', '北四环', '南四环', '朝阳路', '建国门外大街', '复兴门外大街', '德胜门外大街', '安定门外大街'];
  
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 1000) + 1;
  
  return province + district + street + number + '号';
}

// 生成工程单位数据
function generateCompanies(count) {
  const companies = [];
  for (let i = 1; i <= count; i++) {
    const nameArray = ['中国', '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '重庆', '天津', '苏州', '西安', '长沙', '青岛', '郑州'];
    const namePrefix = nameArray[Math.floor(Math.random() * nameArray.length)];
    const nameSuffix = ['建筑工程', '建设工程', '土木工程', '市政工程', '交通工程', '电力工程', '通信工程', '石油化工', '冶金工程', '矿山工程'];
    const suffix = nameSuffix[Math.floor(Math.random() * nameSuffix.length)];
    const nameType = ['总公司', '股份有限公司', '集团公司', '有限公司', '工程局'];
    const type = nameType[Math.floor(Math.random() * nameType.length)];
    
    const { name: contactPerson } = generateName();
    
    companies.push({
      id: 'C' + String(i).padStart(3, '0'),
      name: namePrefix + suffix + type,
      type: companyTypes[Math.floor(Math.random() * companyTypes.length)],
      contactPerson: contactPerson,
      contactPhone: generatePhone(),
      address: generateAddress()
    });
  }
  return companies;
}

// 生成专家数据
function generateExperts(count, companies) {
  const experts = [];
  for (let i = 1; i <= count; i++) {
    const { name, gender } = generateName();
    const company = companies[Math.floor(Math.random() * companies.length)].name;
    const age = Math.floor(Math.random() * 30) + 30; // 30-60岁
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const researchArea = researchAreas[Math.floor(Math.random() * researchAreas.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    // 生成从业经历
    const experienceYears = age - 22; // 假设22岁开始工作
    const workExperience = `${experienceYears}年从业经验，曾参与多个大型${specialty}项目的设计和施工`;
    
    // 生成参与评审项目
    const reviewProjects = `参与过${company}等多个重点项目的评审`;
    
    // 生成特点
    const characteristicsArray = [
      '擅长结构安全评估，具有丰富的现场经验',
      '注重细节，擅长复杂结构分析',
      '理论基础扎实，具有全局视野',
      '技术全面，实践经验丰富',
      '创新能力强，善于解决复杂问题',
      '沟通能力强，团队协作精神好',
      '专业知识深厚，行业经验丰富',
      '严谨细致，工作态度认真'
    ];
    const characteristics = characteristicsArray[Math.floor(Math.random() * characteristicsArray.length)];
    
    // 生成参编标准
    const standardCount = Math.floor(Math.random() * 3) + 1; // 1-3个标准
    const selectedStandards = [];
    for (let j = 0; j < standardCount; j++) {
      const standard = standards[Math.floor(Math.random() * standards.length)];
      if (!selectedStandards.includes(standard)) {
        selectedStandards.push(standard);
      }
    }
    
    experts.push({
      id: 'E' + String(i).padStart(3, '0'),
      name: name + '专家',
      age: age,
      gender: gender,
      specialty: specialty,
      researchArea: researchArea,
      title: title,
      company: company,
      phone: generatePhone(),
      wechat: name.toLowerCase() + 'zhuanjia',
      workExperience: workExperience,
      reviewProjects: reviewProjects,
      characteristics: characteristics,
      userId: 'U' + String(i).padStart(3, '0'),
      参编Standards: selectedStandards
    });
  }
  return experts;
}

// 生成数据
const companies = generateCompanies(20);
const experts = generateExperts(50, companies);

// 保存数据到文件
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let output = '';

// 工程单位数据
output += '// 工程单位数据\n';
output += 'const companies = ref([\n';
companies.forEach((company, index) => {
  output += '  {\n';
  output += `    id: '${company.id}',\n`;
  output += `    name: '${company.name}',\n`;
  output += `    type: '${company.type}',\n`;
  output += `    contactPerson: '${company.contactPerson}',\n`;
  output += `    contactPhone: '${company.contactPhone}',\n`;
  output += `    address: '${company.address}'\n`;
  output += index === companies.length - 1 ? '  }\n' : '  },\n';
});
output += '])\n\n';

// 专家数据
output += '// 专家数据\n';
output += 'const experts = ref([\n';
experts.forEach((expert, index) => {
  output += '  {\n';
  output += `    id: '${expert.id}',\n`;
  output += `    name: '${expert.name}',\n`;
  output += `    age: ${expert.age},\n`;
  output += `    gender: '${expert.gender}',\n`;
  output += `    specialty: '${expert.specialty}',\n`;
  output += `    researchArea: '${expert.researchArea}',\n`;
  output += `    title: '${expert.title}',\n`;
  output += `    company: '${expert.company}',\n`;
  output += `    phone: '${expert.phone}',\n`;
  output += `    wechat: '${expert.wechat}',\n`;
  output += `    workExperience: '${expert.workExperience}',\n`;
  output += `    reviewProjects: '${expert.reviewProjects}',\n`;
  output += `    characteristics: '${expert.characteristics}',\n`;
  output += `    userId: '${expert.userId}',\n`;
  output += `    参编Standards: ['${expert.参编Standards.join("', '")}']\n`;
  output += index === experts.length - 1 ? '  }\n' : '  },\n';
});
output += '])';

fs.writeFileSync('generatedData.js', output);
console.log('数据已保存到 generatedData.js 文件');

