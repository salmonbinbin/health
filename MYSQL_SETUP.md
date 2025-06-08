# MySQL 数据库设置指南

本项目使用MySQL数据库存储健康管理系统的数据。以下是设置步骤：

## 1. 安装 MySQL

### Windows
1. 下载并安装 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
2. 按照安装向导进行安装，记住设置的root密码
3. 安装完成后，可以通过MySQL Workbench或命令行访问MySQL

### macOS
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

## 2. 创建数据库和表

有两种方法可以创建数据库和表：

### 方法1：使用SQL脚本

1. 连接到MySQL服务器
```bash
mysql -u root -p
```

2. 执行setup_database.sql脚本
```bash
source path/to/setup_database.sql
```

### 方法2：分步执行

1. 创建数据库
```sql
CREATE DATABASE health_management_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE health_management_system;
```

2. 创建用户表
```sql
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像路径',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `gender` ENUM('男', '女', '其他') DEFAULT NULL COMMENT '性别',
  `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
  `height` DECIMAL(5,2) DEFAULT NULL COMMENT '身高(cm)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

3. 创建健康目标表
```sql
CREATE TABLE `goals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL COMMENT '目标类型',
  `value` VARCHAR(50) NOT NULL COMMENT '目标值范围',
  `unit` VARCHAR(10) NOT NULL COMMENT '单位',
  `user_id` INT COMMENT '用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

4. 创建健康记录表
```sql
CREATE TABLE `health_records` (
  `id` VARCHAR(50) PRIMARY KEY,
  `date` DATE NOT NULL COMMENT '记录日期',
  `type` VARCHAR(50) NOT NULL COMMENT '记录类型',
  `value` DECIMAL(10,2) NOT NULL COMMENT '记录值',
  `unit` VARCHAR(10) NOT NULL COMMENT '单位',
  `remark` TEXT DEFAULT NULL COMMENT '备注',
  `user_id` INT COMMENT '用户ID',
  `created_at` TIMESTAMP NOT NULL COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_date` (`date`),
  INDEX `idx_type` (`type`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

5. 创建体测记录表
```sql
CREATE TABLE `physical_test_records` (
  `id` VARCHAR(50) PRIMARY KEY,
  `semester` VARCHAR(50) NOT NULL COMMENT '学期',
  `type` VARCHAR(50) NOT NULL COMMENT '体测类型',
  `value` DECIMAL(10,2) NOT NULL COMMENT '测量值',
  `unit` VARCHAR(10) DEFAULT NULL COMMENT '单位',
  `grade` VARCHAR(20) NOT NULL COMMENT '等级评价',
  `remark` TEXT DEFAULT NULL COMMENT '备注',
  `user_id` INT COMMENT '用户ID',
  `created_at` TIMESTAMP NOT NULL COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_semester` (`semester`),
  INDEX `idx_type` (`type`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3. 导入初始数据

1. 创建默认用户
```sql
INSERT INTO `users` (`username`, `password`, `avatar`) VALUES 
('admin', '$2b$10$XFE0rDomoGlPO9eYnlAkLOUVK/DkVCJ.Y9oKMXfInKKPMhpf9.tPe', '/src/assets/1.jpg');
```

2. 导入健康目标数据
```sql
INSERT INTO `goals` (`type`, `value`, `unit`, `user_id`) VALUES 
('heart-rate', '60-100', 'BPM', 1),
('weight', '60-70', 'kg', 1),
('bmi', '18.5-24.9', '', 1),
('body-fat', '15-25', '%', 1),
('calorie', '2000-2500', 'kcal', 1),
('sleep', '7-9', 'h', 1),
('running', '5', 'km', 1),
('exercise-heart-rate', '120-150', 'BPM', 1);
```

3. 导入健康记录和体测记录数据
```bash
# 在项目根目录执行
cd server
node scripts/import-data.js
```

## 4. 配置应用连接

1. 复制配置示例文件
```bash
cp server/config/env.example.js server/config/.env.js
```

2. 编辑配置文件，填入你的MySQL连接信息
```javascript
// server/config/.env.js
module.exports = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: 'your_password',
  DB_NAME: 'health_management_system',
  // 其他配置...
};
```

## 5. 启动应用

```bash
# 安装依赖
npm install

# 启动服务器
npm run dev
```

## 常见问题

1. **连接错误**: 确保MySQL服务正在运行，并且连接信息正确
2. **权限错误**: 确保用户有正确的数据库权限
3. **字符集问题**: 如果出现中文乱码，检查数据库和表的字符集设置 