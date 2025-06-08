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
  password: process.env.DB_PASSWORD || '',
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

// 导入健康记录数据
async function importHealthRecords() {
  try {
    // 读取JSON文件
    const data = await fs.readFile(path.join(__dirname, '../data/records.json'), 'utf8');
    const records = JSON.parse(data).records;
    
    // 准备SQL语句 - 使用REPLACE INTO替代INSERT INTO
    const sql = `
      REPLACE INTO health_records 
      (id, date, type, value, unit, remark, created_at, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    // 批量插入数据
    console.log(`开始导入${records.length}条健康记录数据...`);
    let successCount = 0;
    
    for (const record of records) {
      try {
        await pool.execute(sql, [
          record.id,
          record.date,
          record.type,
          record.value,
          record.unit,
          record.remark,
          formatDateForMySQL(record.createdAt),
        ]);
        successCount++;
      } catch (err) {
        console.error(`导入记录失败 ID: ${record.id}:`, err.message);
      }
    }
    
    console.log(`成功导入${successCount}/${records.length}条健康记录数据`);
  } catch (err) {
    console.error('导入健康记录数据失败:', err);
  }
}

// 导入体测记录数据
async function importPhysicalTestRecords() {
  try {
    // 读取JSON文件
    const data = await fs.readFile(path.join(__dirname, '../data/physical-test-records.json'), 'utf8');
    const records = JSON.parse(data).records;
    
    // 准备SQL语句 - 使用REPLACE INTO替代INSERT INTO
    const sql = `
      REPLACE INTO physical_test_records 
      (id, semester, type, value, unit, grade, remark, created_at, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    // 批量插入数据
    console.log(`开始导入${records.length}条体测记录数据...`);
    let successCount = 0;
    
    for (const record of records) {
      try {
        await pool.execute(sql, [
          record.id,
          record.semester,
          record.type,
          record.value,
          record.unit || '',
          record.grade,
          record.remark || null,
          formatDateForMySQL(record.createdAt),
        ]);
        successCount++;
      } catch (err) {
        console.error(`导入体测记录失败 ID: ${record.id}:`, err.message);
      }
    }
    
    console.log(`成功导入${successCount}/${records.length}条体测记录数据`);
  } catch (err) {
    console.error('导入体测记录数据失败:', err);
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
}

// 执行导入
async function runImport() {
  try {
    // 先测试连接
    const connected = await testConnection();
    if (!connected) {
      console.error('无法连接到数据库，请检查配置');
      process.exit(1);
    }
    
    await importHealthRecords();
    await importPhysicalTestRecords();
    console.log('所有数据导入完成');
    process.exit(0);
  } catch (err) {
    console.error('数据导入过程中发生错误:', err);
    process.exit(1);
  }
}

// 运行导入脚本
runImport(); 