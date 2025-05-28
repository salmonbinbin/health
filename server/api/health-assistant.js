import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import SparkClient from '../utils/sparkClient.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sparkClient = new SparkClient()

async function analyzeHealthData() {
  try {
    // 读取健康目标数据
    const goalsPath = path.join(__dirname, '../data/goals.json')
    const goalsData = await fs.readFile(goalsPath, 'utf8')
    const goals = JSON.parse(goalsData)

    // 读取最新健康记录
    const recordsPath = path.join(__dirname, '../data/records.json')
    const recordsData = await fs.readFile(recordsPath, 'utf8')
    const records = JSON.parse(recordsData)

    // 构建提示词
    const prompt = `作为一个专业的健康管理AI助手，请根据以下数据分析用户的健康状况并提供建议：

用户的健康目标：
${JSON.stringify(goals, null, 2)}

最近的健康记录（最新10条）：
${JSON.stringify(records.records.slice(-10), null, 2)}

请提供以下分析：
1. 目标达成情况分析
2. 健康状况评估
3. 针对性的改进建议
4. 个性化的饮食建议
5. 运动训练计划

请用专业但易懂的语言回答，确保建议具体可行，并注意以下几点：
- 分析要基于数据趋势，不要过度解读单次数据
- 建议要循序渐进，避免过于激进
- 饮食和运动计划要具体且可执行
- 如果发现异常指标，要提醒就医检查`

    // 调用讯飞星火API
    console.log('开始分析健康数据...')
    const analysis = await sparkClient.chat(prompt)
    console.log('健康数据分析完成')
    return analysis

  } catch (error) {
    console.error('健康数据分析失败:', error)
    throw error
  }
}

export default async function (req, res) {
  try {
    console.log('收到健康分析请求')
    const analysis = await analyzeHealthData()
    res.json({ analysis })
  } catch (error) {
    console.error('处理健康分析请求失败:', error)
    res.status(500).json({ 
      error: '分析失败，请稍后再试',
      details: error.message 
    })
  }
} 