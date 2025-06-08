# 智能校园健康系统

智能校园健康系统是一个全面的健康数据记录和分析平台，帮助用户追踪、管理和分析个人健康数据，提供智能化健康建议。

## 功能特点

- **健康数据记录**：记录体重、心率、血压等多种健康指标
- **体测成绩管理**：记录和跟踪体育测试成绩
- **健康目标设定**：设置个人健康目标并追踪进度
- **AI智能分析**：基于讯飞星火API提供健康数据分析和建议
- **数据可视化**：直观展示健康数据变化趋势
- **双存储模式**：支持文件存储和MySQL数据库存储

## 技术栈

### 前端
- Vue.js
- Vite
- Axios
- ECharts (数据可视化)

### 后端
- Node.js
- Express
- MySQL (可选)
- 讯飞星火API (AI分析)

## 系统架构

系统采用前后端分离架构：
- 前端：负责用户界面和交互
- 后端：提供RESTful API服务
- 数据存储：支持文件存储或MySQL数据库存储

## 安装指南

### 前提条件
- Node.js (v14+)
- npm 或 yarn
- MySQL (可选，如需使用数据库存储)

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/health-system.git
cd health-system
```

2. 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client
npm install

# 安装服务端依赖
cd ../server
npm install
```

3. 配置环境变量

在server目录下创建.env文件：
```
# 数据库配置（可选）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=health_management_system

# 讯飞星火API配置
SPARK_APP_ID=your_app_id
SPARK_API_KEY=your_api_key
SPARK_API_SECRET=your_api_secret
```

4. 数据库设置（可选）

如果使用MySQL存储，执行以下命令设置数据库：
```bash
# 创建数据库和表
npm run db:setup

# 导入初始数据
npm run db:import
```

5. 启动应用
```bash
# 开发模式启动（前后端同时启动）
npm run dev
```

## 使用指南

### 访问应用
- 前端: http://localhost:5173
- 后端: http://localhost:3001

### API文档
- JSON格式: http://localhost:3001/api/docs
- HTML格式: http://localhost:3001/docs

## 存储模式

系统支持两种存储模式：

1. **文件存储**：默认模式，数据存储在JSON文件中
2. **MySQL数据库**：配置.env文件后自动使用数据库存储

系统会自动检测环境变量配置，优先使用数据库存储；如果数据库连接失败，则自动回退到文件存储模式。

## 数据库表结构

### health_records（健康记录表）
- id: 记录ID
- date: 记录日期
- type: 记录类型（如weight、heart-rate等）
- value: 记录值
- unit: 单位
- remark: 备注
- created_at: 创建时间
- user_id: 用户ID

### physical_test_records（体测记录表）
- id: 记录ID
- semester: 学期
- type: 体测项目类型
- value: 成绩值
- unit: 单位
- grade: 等级评定
- remark: 备注
- created_at: 创建时间
- user_id: 用户ID

### goals（健康目标表）
- id: 目标ID
- type: 目标类型
- value: 目标值
- unit: 单位
- user_id: 用户ID

### users（用户表）
- id: 用户ID
- username: 用户名
- password: 密码（加密存储）
- created_at: 创建时间

## API接口

系统提供完整的RESTful API：

- `GET /api/health-records` - 获取健康记录
- `POST /api/health-records` - 添加健康记录
- `GET /api/goals` - 获取健康目标
- `POST /api/goals` - 添加/更新健康目标
- `DELETE /api/goals/:type` - 删除健康目标
- `GET /api/physical-test-records` - 获取体测记录
- `GET /api/physical-test-records/latest` - 获取最新体测记录
- `POST /api/physical-test-records` - 添加体测记录
- `POST /api/spark-chat` - AI健康建议（星火API）
- `POST /api/indicator-analysis` - 健康指标AI分析

更多详细API信息请访问API文档。

## 开发指南

### 项目结构
```
health-system/
├── client/             # 前端代码
│   ├── public/         # 静态资源
│   ├── src/            # 源代码
│   │   ├── assets/     # 资源文件
│   │   ├── components/ # 组件
│   │   ├── views/      # 页面
│   │   ├── router/     # 路由
│   │   ├── store/      # 状态管理
│   │   └── App.vue     # 主组件
├── server/             # 后端代码
│   ├── data/           # 文件存储数据
│   ├── public/         # 静态资源
│   ├── scripts/        # 脚本文件
│   ├── utils/          # 工具函数
│   └── app.js          # 主应用文件
├── setup_database.sql  # 数据库设置脚本
└── package.json        # 项目配置
```

### 命令说明

- `npm run dev` - 开发模式启动（前后端）
- `npm run client:dev` - 仅启动前端
- `npm run server:dev` - 仅启动后端
- `npm run build` - 构建前端
- `npm run start` - 生产模式启动
- `npm run db:setup` - 设置数据库
- `npm run db:import` - 导入初始数据

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request


## 联系方式

项目维护者：qq：2186185477
