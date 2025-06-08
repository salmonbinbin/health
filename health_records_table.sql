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