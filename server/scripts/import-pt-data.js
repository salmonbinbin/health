import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库连接配置
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'health_management_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 将ISO日期格式转换为MySQL日期时间格式
function formatDateForMySQL(isoDateString) {
  if (!isoDateString) return null;
  try {
    const date = new Date(isoDateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (err) {
    console.error('日期格式转换错误:', err);
    return null;
  }
}

// 主函数
async function importPhysicalTestData() {
  try {
    // 读取体测记录JSON文件
    const filePath = path.join(__dirname, '../data/physical-test-records.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!data.records || !Array.isArray(data.records)) {
      console.error('无效的数据格式，缺少records数组');
      return;
    }
    
    console.log(`开始导入${data.records.length}条体测记录...`);
    
    // 连接数据库
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    
    // 遍历并插入记录
    for (const record of data.records) {
      const sql = `
        INSERT INTO physical_test_records 
        (id, semester, type, value, unit, grade, remark, created_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const createdAt = formatDateForMySQL(record.createdAt);
      
      await connection.execute(sql, [
        record.id,
        record.semester,
        record.type,
        record.value,
        record.unit || '',
        record.grade,
        record.remark || null,
        createdAt,
        1  // 默认用户ID为1
      ]);
    }
    
    connection.release();
    console.log('数据导入完成!');
    process.exit(0);
  } catch (error) {
    console.error('导入数据失败:', error);
    process.exit(1);
  }
}

// 执行导入
importPhysicalTestData(); 