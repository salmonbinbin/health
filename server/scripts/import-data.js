const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/db');

// 导入健康记录数据
async function importHealthRecords() {
  try {
    // 读取JSON文件
    const data = await fs.readFile(path.join(__dirname, '../data/records.json'), 'utf8');
    const records = JSON.parse(data).records;
    
    // 准备SQL语句
    const sql = `
      INSERT INTO health_records 
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
          record.createdAt,
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
    
    // 准备SQL语句
    const sql = `
      INSERT INTO physical_test_records 
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
          record.createdAt,
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

// 执行导入
async function runImport() {
  try {
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