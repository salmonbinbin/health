import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 读取健康记录数据
    const recordsData = await fs.readFile(path.join(__dirname, '../data/records.json'), 'utf8');
    const records = JSON.parse(recordsData).records;

    // 简单分析数据
    const analysis = analyzeHealthData(records);
    
    res.json({ analysis });
  } catch (error) {
    console.error('健康分析失败:', error);
    res.status(500).json({ error: '健康数据分析失败' });
  }
});

function analyzeHealthData(records) {
  // 获取最近的记录
  const recentRecords = records.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // 分析各项指标
  const analysis = [];
  
  // 心率分析
  const heartRates = recentRecords.filter(r => r.type === 'heart-rate');
  if (heartRates.length > 0) {
    const avg = heartRates.reduce((sum, r) => sum + r.value, 0) / heartRates.length;
    analysis.push(`心率情况：平均${avg.toFixed(1)}BPM，${
      avg < 60 ? '偏低' : avg > 100 ? '偏高' : '正常范围内'
    }`);
  }

  // 体重分析
  const weights = recentRecords.filter(r => r.type === 'weight');
  if (weights.length > 0) {
    const latest = weights[0];
    analysis.push(`体重情况：最新记录${latest.value}kg`);
  }

  // BMI分析
  const bmis = recentRecords.filter(r => r.type === 'bmi');
  if (bmis.length > 0) {
    const latest = bmis[0];
    let bmiStatus = '';
    if (latest.value < 18.5) bmiStatus = '偏瘦';
    else if (latest.value < 24.9) bmiStatus = '正常';
    else if (latest.value < 29.9) bmiStatus = '超重';
    else bmiStatus = '肥胖';
    analysis.push(`BMI情况：${latest.value}，属于${bmiStatus}范围`);
  }

  // 睡眠分析
  const sleeps = recentRecords.filter(r => r.type === 'sleep');
  if (sleeps.length > 0) {
    const avg = sleeps.reduce((sum, r) => sum + r.value, 0) / sleeps.length;
    analysis.push(`睡眠情况：平均${avg.toFixed(1)}小时，${
      avg < 7 ? '睡眠时间偏少' : avg > 9 ? '睡眠时间偏多' : '睡眠时间适中'
    }`);
  }

  // 运动分析
  const runs = recentRecords.filter(r => r.type === 'running');
  if (runs.length > 0) {
    const totalDistance = runs.reduce((sum, r) => sum + r.value, 0);
    analysis.push(`运动情况：共跑步${totalDistance.toFixed(1)}公里`);
  }

  return analysis.join('\n\n');
}

export default router; 