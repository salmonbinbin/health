import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chatWithSparkAPI } from './utils/sparkApi.js'
import dotenv from 'dotenv'
import { createPool } from 'mysql2/promise'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import { authenticateJWT } from './middleware/auth.js'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const RECORDS_FILE = path.join(__dirname, 'data', 'records.json')
const PHYSICAL_TEST_FILE = path.join(__dirname, 'data/physical-test-records.json')

// 确保data目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'))
}

// 确保records.json文件存在
if (!fs.existsSync(RECORDS_FILE)) {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify({ records: [] }))
}

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

// 认证路由
app.use('/api/auth', authRouter)

// 管理员路由
app.use('/api/admin', adminRouter)

// 添加JWT认证中间件（非强制性，保持向后兼容）
app.use(authenticateJWT)

// 数据库连接配置
let pool = null
let useDatabase = false

// 尝试连接数据库
try {
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    pool = createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    
    // 测试数据库连接
    async function testConnection() {
      try {
        const connection = await pool.getConnection()
        console.log('数据库连接成功，将使用MySQL数据库存储')
        connection.release()
        useDatabase = true
        return true
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        return false
      }
    }
    
    // 立即测试连接
    testConnection()
  } else {
    console.log('未配置数据库连接信息，将使用文件存储')
  }
} catch (error) {
  console.error('初始化数据库连接失败，将使用文件存储:', error.message)
}

// 读取记录数据
function readRecords() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data/records.json'), 'utf8')
    const recordsData = JSON.parse(data)
    return recordsData.records || []
  } catch (error) {
    console.error('读取记录数据失败:', error)
    return []
  }
}

// 写入记录
const writeRecords = (records) => {
  try {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify({ records }, null, 2))
    return true
  } catch (error) {
    console.error('写入记录失败:', error)
    return false
  }
}

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '欢迎访问时漪健康系统API',
    documentation: {
      api: '/api/docs - API接口文档（JSON格式）',
      html: '/docs - API接口文档（HTML格式）'
    },
    apis: {
      test: 'GET /api/test - 测试服务器连接',
      healthRecords: {
        get: 'GET /api/health-records - 获取健康记录列表',
        post: 'POST /api/health-records - 添加新的健康记录'
      }
    },
    storageMode: useDatabase ? 'MySQL数据库' : '文件存储'
  })
})

// API文档路由
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: '时漪健康系统 API 文档',
    version: '1.0.0',
    storageMode: useDatabase ? 'MySQL数据库' : '文件存储',
    endpoints: [
      {
        path: '/api/test',
        method: 'GET',
        description: '测试服务器连接',
        response: { code: 200, message: '服务器连接成功', storageType: '当前存储类型' }
      },
      {
        path: '/api/health-records',
        method: 'GET',
        description: '获取健康记录列表',
        params: [
          { name: 'userId', type: 'number', default: 1, description: '用户ID' },
          { name: 'type', type: 'string', optional: true, description: '记录类型' }
        ],
        response: { records: [] }
      },
      {
        path: '/api/health-records',
        method: 'POST',
        description: '添加新的健康记录',
        body: {
          date: 'string (YYYY-MM-DD)',
          type: 'string',
          value: 'number',
          unit: 'string',
          remark: 'string (可选)',
          userId: 'number (默认为1)'
        },
        response: { success: true, data: {} }
      },
      {
        path: '/api/goals',
        method: 'GET',
        description: '获取所有目标',
        params: [
          { name: 'userId', type: 'number', default: 1, description: '用户ID' }
        ],
        response: []
      },
      {
        path: '/api/goals',
        method: 'POST',
        description: '添加/更新目标',
        body: {
          type: 'string',
          value: 'number',
          unit: 'string',
          userId: 'number (默认为1)'
        },
        response: { success: true }
      },
      {
        path: '/api/goals/:type',
        method: 'DELETE',
        description: '删除目标',
        params: [
          { name: 'type', type: 'string', description: '目标类型' },
          { name: 'userId', type: 'number', default: 1, description: '用户ID' }
        ],
        response: { success: true, message: '目标已删除' }
      },
      {
        path: '/api/spark-chat',
        method: 'POST',
        description: 'AI健康建议接口 (使用讯飞星火API)',
        body: {
          message: 'string',
          username: 'string (可选)'
        },
        response: { success: true, reply: 'string' }
      },
      {
        path: '/api/ai-suggestion',
        method: 'POST',
        description: '简单AI健康建议接口',
        body: {
          username: 'string'
        },
        response: { success: true, suggestion: 'string' }
      },
      {
        path: '/api/indicator-analysis',
        method: 'POST',
        description: '健康指标AI分析接口',
        body: {
          indicatorId: 'string',
          username: 'string (可选)',
          userId: 'number (默认为1)'
        },
        response: { success: true, analysis: 'string' }
      },
      {
        path: '/api/physical-test-records',
        method: 'GET',
        description: '获取所有体测记录',
        params: [
          { name: 'userId', type: 'number', default: 1, description: '用户ID' },
          { name: 'type', type: 'string', optional: true, description: '记录类型' }
        ],
        response: { records: [] }
      },
      {
        path: '/api/physical-test-records/latest',
        method: 'GET',
        description: '获取最新体测记录',
        params: [
          { name: 'userId', type: 'number', default: 1, description: '用户ID' }
        ],
        response: {}
      },
      {
        path: '/api/physical-test-records',
        method: 'POST',
        description: '添加体测记录',
        body: {
          semester: 'string',
          type: 'string',
          value: 'number',
          unit: 'string (可选)',
          grade: 'string',
          remark: 'string (可选)',
          userId: 'number (默认为1)'
        },
        response: {}
      }
    ]
  }
  
  res.json(apiDocs)
})

// HTML文档路由
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'))
})

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    message: '服务器连接成功',
    storageType: useDatabase ? 'MySQL数据库' : '文件存储'
  })
})

// 获取健康记录
app.get('/api/health-records', async (req, res) => {
  try {
    // 从认证中间件获取用户ID，如果未认证则使用请求参数或默认值
    // 这样可以保持向后兼容性
    const userId = req.user?.isAuthenticated ? req.user.userId : (req.query.userId || 1)
    const type = req.query.type
    
    if (useDatabase && pool) {
      let query = 'SELECT * FROM health_records WHERE user_id = ?'
      let params = [userId]
      
      if (type) {
        query += ' AND type = ?'
        params.push(type)
      }
      
      query += ' ORDER BY date DESC, created_at DESC'
      
      const [rows] = await pool.query(query, params)
      res.json({ data: rows })
    } else {
      const recordsData = readRecords()
      // 确保返回的是数组格式
      const records = Array.isArray(recordsData) ? recordsData : 
                     (recordsData.records || [])
      
      // 如果用户已认证，过滤出该用户的记录
      const filteredRecords = req.user?.isAuthenticated 
        ? records.filter(record => record.userId == userId || record.user_id == userId)
        : records
        
      res.json({ data: filteredRecords })
    }
  } catch (error) {
    console.error('获取健康记录失败:', error)
    res.status(500).json({ error: '获取健康记录失败' })
  }
})

// 添加健康记录
app.post('/api/health-records', async (req, res) => {
  try {
    // 从认证中间件获取用户ID，如果未认证则使用请求参数或默认值
    const userId = req.user?.isAuthenticated ? req.user.userId : (req.body.userId || 1)
    
    const newRecord = {
      id: Date.now().toString(),
      ...req.body,
      userId: userId, // 确保记录中包含用户ID
      createdAt: new Date().toISOString()
    }
    
    if (useDatabase && pool) {
      // 使用数据库存储
      const sql = `
        INSERT INTO health_records 
        (id, date, type, value, unit, remark, created_at, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      // 将ISO日期格式转换为MySQL日期时间格式
      const formattedDate = new Date(newRecord.createdAt)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')
      
      await pool.execute(sql, [
        newRecord.id,
        newRecord.date,
        newRecord.type,
        newRecord.value,
        newRecord.unit,
        newRecord.remark,
        formattedDate,
        userId
      ])
      
      res.json({ success: true, data: newRecord })
    } else {
      // 使用文件存储
      const records = readRecords()
      records.push(newRecord)
      
      if (writeRecords(records)) {
        res.json({ success: true, data: newRecord })
      } else {
        res.status(500).json({ success: false, message: '保存记录失败' })
      }
    }
  } catch (error) {
    console.error('添加健康记录失败:', error)
    res.status(500).json({ success: false, message: '添加记录失败' })
  }
})

// 获取所有目标
app.get('/api/goals', async (req, res) => {
  try {
    if (useDatabase && pool) {
      const [rows] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [req.query.userId || 1])
      res.json(rows)
    } else {
      const goalsPath = path.join(__dirname, 'data', 'goals.json')
      const goals = JSON.parse(fs.readFileSync(goalsPath, 'utf8'))
      res.json(goals)
    }
  } catch (error) {
    console.error('获取目标失败:', error)
    res.status(500).json({ error: '获取目标失败' })
  }
})

// 添加/更新目标
app.post('/api/goals', async (req, res) => {
  try {
    const { type, value, unit, userId = 1 } = req.body
    
    if (useDatabase && pool) {
      // 查找是否已存在相同类型的目标
      const [existing] = await pool.query(
        'SELECT * FROM goals WHERE type = ? AND user_id = ?', 
        [type, userId]
      )
      
      if (existing.length > 0) {
        // 更新现有目标
        await pool.query(
          'UPDATE goals SET value = ?, unit = ? WHERE type = ? AND user_id = ?',
          [value, unit, type, userId]
        )
      } else {
        // 添加新目标
        await pool.query(
          'INSERT INTO goals (type, value, unit, user_id) VALUES (?, ?, ?, ?)',
          [type, value, unit, userId]
        )
      }
      
      res.json({ success: true })
    } else {
      const goalsPath = path.join(__dirname, 'data', 'goals.json')
      const goals = JSON.parse(fs.readFileSync(goalsPath, 'utf8'))
      const newGoal = req.body
      
      const index = goals.findIndex(g => g.type === newGoal.type)
      if (index > -1) {
        goals[index] = newGoal
      } else {
        goals.push(newGoal)
      }
      
      fs.writeFileSync(goalsPath, JSON.stringify(goals, null, 2))
      res.json(newGoal)
    }
  } catch (error) {
    console.error('保存目标失败:', error)
    res.status(500).json({ error: '保存目标失败' })
  }
})

// 删除目标
app.delete('/api/goals/:type', async (req, res) => {
  try {
    const { type } = req.params
    const userId = req.query.userId || 1
    
    if (useDatabase && pool) {
      await pool.query(
        'DELETE FROM goals WHERE type = ? AND user_id = ?',
        [type, userId]
      )
      
      res.json({ success: true })
    } else {
      const goalsPath = path.join(__dirname, 'data', 'goals.json')
      const goals = JSON.parse(fs.readFileSync(goalsPath, 'utf8'))
      
      const filteredGoals = goals.filter(g => g.type !== type)
      
      // 检查是否找到并删除了目标
      if (filteredGoals.length === goals.length) {
        return res.status(404).json({ success: false, message: '未找到指定目标' })
      }
      
      fs.writeFileSync(goalsPath, JSON.stringify(filteredGoals, null, 2))
      res.json({ success: true, message: '目标已删除' })
    }
  } catch (error) {
    console.error('删除目标失败:', error)
    res.status(500).json({ success: false, message: '删除目标失败' })
  }
})

// AI健康建议接口 (使用讯飞星火API)
app.post('/api/spark-chat', async (req, res) => {
  const { message, username } = req.body
  
  // 验证请求参数
  if (!message) {
    return res.status(400).json({
      success: false,
      message: '消息内容不能为空'
    })
  }
  
  try {
    // 获取用户的健康记录，构建上下文
    const records = readRecords()
    const userRecords = username ? records.filter(r => r.username === username) : []
    
    // 构建健康数据上下文
    let healthContext = ""
    if (userRecords.length > 0) {
      const recentRecords = userRecords.slice(-3) // 最近三条记录
      healthContext = "用户最近的健康数据：\n" + 
        recentRecords.map(record => {
          let recordText = `记录时间: ${new Date(record.createdAt).toLocaleString()}\n`
          if (record.bloodPressureHigh) recordText += `血压(高): ${record.bloodPressureHigh}\n`
          if (record.bloodPressureLow) recordText += `血压(低): ${record.bloodPressureLow}\n`
          if (record.bloodSugar) recordText += `血糖: ${record.bloodSugar}\n`
          if (record.heartRate) recordText += `心率: ${record.heartRate}\n`
          if (record.weight) recordText += `体重: ${record.weight}kg\n`
          if (record.note) recordText += `备注: ${record.note}\n`
          return recordText
        }).join("\n")
    }
    
    console.log(`处理来自用户"${username || '游客'}"的请求: "${message}"`)
    
    // 调用星火API
    const response = await chatWithSparkAPI(message, username || 'anonymous_user', healthContext)
    
    res.json({
      success: true,
      reply: response
    })
  } catch (error) {
    console.error('调用星火API出错:', error)
    res.status(500).json({
      success: false,
      message: `调用AI服务出错: ${error.message || '未知错误'}`
    })
  }
})

// 原有的简单AI健康建议接口(保留兼容性)
app.post('/api/ai-suggestion', (req, res) => {
  const records = readRecords()
  const userRecords = records.filter(r => r.username === req.body.username)
  
  // 简单的AI分析逻辑 (实际应用中应使用更复杂的算法)
  let suggestion = '您最近的健康数据看起来不错，继续保持！'
  
  const recentRecords = userRecords.slice(-3)
  for (const record of recentRecords) {
    if (record.bloodPressureHigh && record.bloodPressureHigh > 140) {
      suggestion = '注意：您的血压偏高，建议减少盐分摄入，增加运动，如有不适请及时就医。'
      break
    } else if (record.bloodSugar && record.bloodSugar > 7.0) {
      suggestion = '注意：您的血糖值偏高，建议控制饮食，避免过多糖分摄入，必要时咨询医生。'
      break
    }
  }
  
  res.json({
    success: true,
    suggestion
  })
})

// 健康指标AI分析接口
app.post('/api/indicator-analysis', async (req, res) => {
  const { indicatorId, username } = req.body
  
  try {
    // 健康指标元数据
    const indicatorMeta = {
      'heart-rate': { name: '心率', unit: 'BPM' },
      'weight': { name: '体重', unit: 'kg' },
      'bmi': { name: 'BMI', unit: '' },
      'body-fat': { name: '体脂率', unit: '%' },
      'calorie': { name: '卡路里', unit: 'kcal' },
      'sleep': { name: '睡眠', unit: 'h' },
      'running': { name: '跑步', unit: 'km' },
      'exercise-heart-rate': { name: '运动心率', unit: 'BPM' }
    }
    
    // 获取用户的健康记录
    let indicatorRecords = []
    
    if (useDatabase && pool) {
      // 从数据库获取记录
      const userId = req.body.userId || 1
      
      const [rows] = await pool.query(
        'SELECT * FROM health_records WHERE user_id = ? AND type = ? ORDER BY date DESC LIMIT 10',
        [userId, indicatorId]
      )
      
      indicatorRecords = rows
    } else {
      // 从文件获取记录
      const records = readRecords()
      console.log(`读取到总记录数: ${records.length}`)
      
      // 尝试按用户名筛选，如果没有匹配的记录，则使用所有记录
      let userRecords = username ? records.filter(r => r.username === username) : []
      if (userRecords.length === 0) {
        console.log(`用户"${username}"没有记录，使用所有记录进行分析`)
        userRecords = records;
      }
      console.log(`筛选后记录数: ${userRecords.length}`)
      
      // 过滤指定类型的记录
      indicatorRecords = userRecords.filter(r => r.type === indicatorId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-10) // 最近10条记录
    }
    
    // 判断数据是否足够进行分析
    const minRequiredRecords = {
      'heart-rate': 3,
      'weight': 3,
      'bmi': 3,
      'body-fat': 3,
      'calorie': 3,
      'sleep': 3,
      'running': 3,
      'exercise-heart-rate': 3
    }
    
    // 获取当前指标所需的最低记录数
    const requiredCount = minRequiredRecords[indicatorId] || 3
    
    if (indicatorRecords.length < requiredCount) {
      return res.json({
        success: true,
        analysis: `需要至少${requiredCount}条${indicatorMeta[indicatorId]?.name || indicatorId}记录才能进行AI分析。当前仅有${indicatorRecords.length}条记录，请继续记录更多数据。`
      })
    }
    
    // 构建健康数据上下文
    let healthContext = `用户${indicatorMeta[indicatorId]?.name || indicatorId}指标的最近${indicatorRecords.length}条记录:\n`
    
    indicatorRecords.forEach((record, index) => {
      const date = new Date(record.createdAt).toLocaleDateString()
      const valueText = `${record.value}${record.unit || indicatorMeta[indicatorId]?.unit || ''}`
      healthContext += `${index + 1}. ${date}: ${valueText}\n`
    })
    
    // 构建分析请求
    const promptTemplate = `
    作为健康专家，请根据以下${indicatorMeta[indicatorId]?.name || indicatorId}指标数据进行分析:
    ${healthContext}
    
    请提供:
    1. 这些数据的整体趋势分析
    2. 目前状况评估(是否在健康范围内)
    3. 个性化的改善建议
    
    回答要简洁专业，不超过200字。
    `
    
    console.log(`分析健康指标: ${indicatorId}, 用户: ${username || '游客'}, 数据点数量: ${indicatorRecords.length}`)
    
    // 调用星火API
    const analysis = await chatWithSparkAPI(promptTemplate, username || 'anonymous_user')
    
    res.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('健康指标分析失败:', error)
    res.status(500).json({
      success: false,
      message: `分析失败: ${error.message || '未知错误'}`
    })
  }
})

// 获取所有体测记录
app.get('/api/physical-test-records', async (req, res) => {
  try {
    if (useDatabase && pool) {
      const userId = req.query.userId || 1
      const type = req.query.type
      
      let query = 'SELECT * FROM physical_test_records WHERE user_id = ?'
      let params = [userId]
      
      if (type) {
        query += ' AND type = ?'
        params.push(type)
      }
      
      query += ' ORDER BY created_at DESC'
      
      const [rows] = await pool.query(query, params)
      res.json({ records: rows })
    } else {
      const data = JSON.parse(fs.readFileSync(PHYSICAL_TEST_FILE, 'utf8'))
      res.json(data)
    }
  } catch (error) {
    console.error('获取体测记录失败:', error)
    res.status(500).json({ error: '读取记录失败' })
  }
})

// 获取最新体测记录
app.get('/api/physical-test-records/latest', async (req, res) => {
  try {
    if (useDatabase && pool) {
      const userId = req.query.userId || 1
      
      // 获取每种类型的最新记录
      const [rows] = await pool.query(`
        SELECT * FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at DESC) as rn
          FROM physical_test_records
          WHERE user_id = ?
        ) ranked
        WHERE rn = 1
      `, [userId])
      
      // 转换为对象格式
      const latestRecords = {}
      rows.forEach(record => {
        latestRecords[record.type] = record
      })
      
      res.json(latestRecords)
    } else {
      const data = JSON.parse(fs.readFileSync(PHYSICAL_TEST_FILE, 'utf8'))
      const latestRecords = {}
      data.records.forEach(record => {
        if (!latestRecords[record.type] || 
            new Date(record.createdAt) > new Date(latestRecords[record.type].createdAt)) {
          latestRecords[record.type] = record
        }
      })
      res.json(latestRecords)
    }
  } catch (error) {
    console.error('获取最新体测记录失败:', error)
    res.status(500).json({ error: '读取记录失败' })
  }
})

// 添加体测记录
app.post('/api/physical-test-records', async (req, res) => {
  try {
    const newRecord = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    }
    
    if (useDatabase && pool) {
      // 使用数据库存储
      const sql = `
        INSERT INTO physical_test_records 
        (id, semester, type, value, unit, grade, remark, created_at, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      // 将ISO日期格式转换为MySQL日期时间格式
      const formattedDate = new Date(newRecord.createdAt)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')
      
      await pool.execute(sql, [
        newRecord.id,
        newRecord.semester,
        newRecord.type,
        newRecord.value,
        newRecord.unit || '',
        newRecord.grade,
        newRecord.remark || null,
        formattedDate,
        req.body.userId || 1
      ])
      
      res.json(newRecord)
    } else {
      // 使用文件存储
      const data = JSON.parse(fs.readFileSync(PHYSICAL_TEST_FILE, 'utf8'))
      data.records.push(newRecord)
      fs.writeFileSync(PHYSICAL_TEST_FILE, JSON.stringify(data, null, 2))
      res.json(newRecord)
    }
  } catch (error) {
    console.error('添加体测记录失败:', error)
    res.status(500).json({ error: '添加记录失败' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`存储模式: ${useDatabase ? 'MySQL数据库' : '文件存储'}`)
}) 