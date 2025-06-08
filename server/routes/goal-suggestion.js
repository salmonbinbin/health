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
    
    // 获取最新的健康记录
    const latestRecords = getLatestRecords(records);
    
    // 读取目标数据
    let goals = [];
    try {
      const goalsData = await fs.readFile(path.join(__dirname, '../data/goals.json'), 'utf8');
      const goalsObj = JSON.parse(goalsData);
      goals = goalsObj.goals || [];
      
      // 确保goals是数组
      if (!Array.isArray(goals)) {
        console.error('目标数据格式错误，不是数组:', goals);
        goals = [];
      }
    } catch (error) {
      console.error('读取目标数据失败:', error);
      goals = [];
    }
    
    // 生成AI建议
    const suggestion = generateAISuggestion(latestRecords, goals);
    
    res.json({ suggestion });
  } catch (error) {
    console.error('生成目标建议失败:', error);
    res.status(500).json({ error: '生成目标建议失败', message: error.message });
  }
});

// 获取每种类型的最新记录
function getLatestRecords(records) {
  const recordsByType = {};
  
  if (!Array.isArray(records)) {
    console.error('记录数据格式错误，不是数组');
    return [];
  }
  
  records.forEach(record => {
    const type = record.type;
    
    if (!recordsByType[type] || new Date(record.createdAt) > new Date(recordsByType[type].createdAt)) {
      recordsByType[type] = record;
    }
  });
  
  return Object.values(recordsByType);
}

// 生成AI建议
function generateAISuggestion(latestRecords, goals) {
  let suggestion = '基于您的健康数据和设定的目标，以下是我的建议：\n\n';
  
  try {
    // 分析心率
    const heartRate = latestRecords.find(r => r.type === 'heart-rate');
    if (heartRate) {
      const heartRateGoal = goals.find(g => g.type === 'heart-rate');
      if (heartRateGoal && heartRateGoal.value) {
        const targetParts = heartRateGoal.value.toString().split('-');
        if (targetParts.length === 2) {
          const minTarget = parseInt(targetParts[0]);
          const maxTarget = parseInt(targetParts[1]);
          
          if (heartRate.value < minTarget) {
            suggestion += `💓 心率分析：您当前心率(${heartRate.value}BPM)低于目标范围(${heartRateGoal.value}BPM)。建议适当增加有氧运动，如快走、慢跑等。\n\n`;
          } else if (heartRate.value > maxTarget) {
            suggestion += `💓 心率分析：您当前心率(${heartRate.value}BPM)高于目标范围(${heartRateGoal.value}BPM)。建议注意休息，减少咖啡因摄入，并考虑放松训练。\n\n`;
          } else {
            suggestion += `💓 心率分析：您当前心率(${heartRate.value}BPM)在目标范围内(${heartRateGoal.value}BPM)，状态良好。\n\n`;
          }
        } else {
          suggestion += `💓 心率分析：您当前心率为${heartRate.value}BPM。\n\n`;
        }
      } else {
        suggestion += `💓 心率分析：您当前心率为${heartRate.value}BPM。\n\n`;
      }
    }
    
    // 分析体重
    const weight = latestRecords.find(r => r.type === 'weight');
    if (weight) {
      const weightGoal = goals.find(g => g.type === 'weight');
      if (weightGoal && weightGoal.value) {
        const targetParts = weightGoal.value.toString().split('-');
        if (targetParts.length === 2) {
          const minTarget = parseFloat(targetParts[0]);
          const maxTarget = parseFloat(targetParts[1]);
          
          if (weight.value < minTarget) {
            suggestion += `⚖️ 体重分析：您当前体重(${weight.value}kg)低于目标范围(${weightGoal.value}kg)。建议适当增加蛋白质和健康脂肪的摄入。\n\n`;
          } else if (weight.value > maxTarget) {
            suggestion += `⚖️ 体重分析：您当前体重(${weight.value}kg)高于目标范围(${weightGoal.value}kg)。建议控制碳水化合物摄入，增加蛋白质比例，并坚持有氧运动。\n\n`;
          } else {
            suggestion += `⚖️ 体重分析：您当前体重(${weight.value}kg)在目标范围内(${weightGoal.value}kg)，状态良好。\n\n`;
          }
        } else {
          suggestion += `⚖️ 体重分析：您当前体重为${weight.value}kg。\n\n`;
        }
      } else {
        suggestion += `⚖️ 体重分析：您当前体重为${weight.value}kg。\n\n`;
      }
    }
    
    // 分析BMI
    const bmi = latestRecords.find(r => r.type === 'bmi');
    if (bmi) {
      let bmiStatus = '';
      if (bmi.value < 18.5) bmiStatus = '偏瘦';
      else if (bmi.value < 24.9) bmiStatus = '正常';
      else if (bmi.value < 29.9) bmiStatus = '超重';
      else bmiStatus = '肥胖';
      
      suggestion += `📏 BMI分析：您当前BMI为${bmi.value}，属于${bmiStatus}范围。`;
      
      if (bmiStatus === '偏瘦') {
        suggestion += '建议增加优质蛋白质和碳水化合物的摄入，进行力量训练增加肌肉量。\n\n';
      } else if (bmiStatus === '超重' || bmiStatus === '肥胖') {
        suggestion += '建议控制热量摄入，增加运动量，特别是有氧运动和HIIT训练。\n\n';
      } else {
        suggestion += '请继续保持当前的健康生活方式。\n\n';
      }
    }
    
    // 分析睡眠
    const sleep = latestRecords.find(r => r.type === 'sleep');
    if (sleep) {
      const sleepGoal = goals.find(g => g.type === 'sleep');
      if (sleepGoal && sleepGoal.value) {
        const targetParts = sleepGoal.value.toString().split('-');
        if (targetParts.length === 2) {
          const minTarget = parseFloat(targetParts[0]);
          const maxTarget = parseFloat(targetParts[1]);
          
          if (sleep.value < minTarget) {
            suggestion += `⏰ 睡眠分析：您当前睡眠时间(${sleep.value}小时)低于建议范围(${sleepGoal.value}小时)。建议调整作息，避免睡前使用电子设备，尝试冥想放松。\n\n`;
          } else if (sleep.value > maxTarget) {
            suggestion += `⏰ 睡眠分析：您当前睡眠时间(${sleep.value}小时)高于建议范围(${sleepGoal.value}小时)。过长的睡眠可能影响白天精力，建议保持规律作息。\n\n`;
          } else {
            suggestion += `⏰ 睡眠分析：您当前睡眠时间(${sleep.value}小时)在建议范围内(${sleepGoal.value}小时)，状态良好。\n\n`;
          }
        } else {
          suggestion += `⏰ 睡眠分析：您当前睡眠时间为${sleep.value}小时。\n\n`;
        }
      } else {
        suggestion += `⏰ 睡眠分析：您当前睡眠时间为${sleep.value}小时。\n\n`;
      }
    }
  } catch (error) {
    console.error('生成健康分析时出错:', error);
    return '抱歉，生成健康建议时出现错误，请稍后再试。';
  }
  
  // 饮食建议
  suggestion += '🍽️ 饮食建议：\n';
  suggestion += '1. 增加蛋白质摄入：每天摄入体重(kg)×1.6-2.0g的蛋白质，分布在各餐中\n';
  suggestion += '2. 控制碳水化合物质量：选择全谷物、豆类等低GI食物\n';
  suggestion += '3. 增加蔬菜水果摄入：每天至少5份蔬果\n';
  suggestion += '4. 保持充分水分：每天饮水2000-2500ml\n\n';
  
  // 训练建议
  suggestion += '🏃 训练建议：\n';
  
  const running = latestRecords.find(r => r.type === 'running');
  if (running) {
    suggestion += `1. 有氧训练：基于您当前跑步水平(${running.value}km)，建议每周进行3-4次有氧训练，每次30-45分钟\n`;
  } else {
    suggestion += '1. 有氧训练：建议每周进行3-4次有氧训练，每次30-45分钟\n';
  }
  
  suggestion += '2. 力量训练：每周2-3次全身力量训练，重点关注大肌群\n';
  suggestion += '3. 灵活性训练：每天进行10-15分钟的拉伸\n';
  suggestion += '4. 休息：确保训练日之间有足够的恢复时间\n\n';
  
  suggestion += '请根据个人情况调整以上建议，如有不适请立即停止并咨询专业医生或教练。';
  
  return suggestion;
}

export default router; 