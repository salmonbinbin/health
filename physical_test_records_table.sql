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