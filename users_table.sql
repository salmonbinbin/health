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
  `is_admin` BOOLEAN DEFAULT 0 COMMENT '是否管理员',
  `is_disabled` BOOLEAN DEFAULT 0 COMMENT '是否被禁用',
  `disabled_reason` VARCHAR(255) DEFAULT NULL COMMENT '禁用原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 