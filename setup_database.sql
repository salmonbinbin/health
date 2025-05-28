-- 创建数据库
CREATE DATABASE IF NOT EXISTS `health_management_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `health_management_system`;

-- 导入表结构
SOURCE users_table.sql;
SOURCE goals_table.sql;
SOURCE physical_test_records_table.sql;
SOURCE health_records_table.sql;

-- 创建默认用户
INSERT INTO `users` (`username`, `password`, `avatar`) VALUES 
('admin', '$2b$10$XFE0rDomoGlPO9eYnlAkLOUVK/DkVCJ.Y9oKMXfInKKPMhpf9.tPe', '/src/assets/1.jpg'); -- 密码: admin123

-- 导入健康目标数据
INSERT INTO `goals` (`type`, `value`, `unit`, `user_id`) VALUES 
('heart-rate', '60-100', 'BPM', 1),
('weight', '60-70', 'kg', 1),
('bmi', '18.5-24.9', '', 1),
('body-fat', '15-25', '%', 1),
('calorie', '2000-2500', 'kcal', 1),
('sleep', '7-9', 'h', 1),
('running', '5', 'km', 1),
('exercise-heart-rate', '120-150', 'BPM', 1);

-- 注意: 实际导入体测记录和健康记录数据需要使用Node.js脚本或其他工具
-- 因为数据量较大，这里不直接写入SQL语句 