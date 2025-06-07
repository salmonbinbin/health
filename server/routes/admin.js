import express from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { createPool } from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')
const RECORDS_FILE = path.join(__dirname, '..', 'data', 'records.json')
const PHYSICAL_TEST_FILE = path.join(__dirname, '..', 'data/physical-test-records.json')

// 读取用户数据
const readUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      console.warn('用户数据文件不存在')
      return []
    }
    
    const data = fs.readFileSync(USERS_FILE, 'utf8')
    
    if (!data || data.trim() === '') {
      console.warn('用户数据文件为空')
      return []
    }
    
    try {
      const parsed = JSON.parse(data)
      
      if (!parsed || !Array.isArray(parsed.users)) {
        console.warn('用户数据格式不正确')
        return []
      }
      
      return parsed.users
    } catch (parseError) {
      console.error('解析用户数据JSON失败:', parseError)
      return []
    }
  } catch (error) {
    console.error('读取用户数据失败:', error)
    return []
  }
}

// 写入用户数据
const writeUsers = (users) => {
  try {
    // 确保users是一个数组
    if (!Array.isArray(users)) {
      console.error('写入用户数据失败: users不是数组')
      return false
    }
    
    // 创建包含用户数组的对象
    const data = JSON.stringify({ users }, null, 2)
    
    // 检查目录是否存在，如果不存在则创建
    const dirPath = path.dirname(USERS_FILE)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    // 写入文件
    fs.writeFileSync(USERS_FILE, data, 'utf8')
    return true
  } catch (error) {
    console.error('写入用户数据失败:', error)
    return false
  }
}

// 读取健康记录数据
const readHealthRecords = () => {
  try {
    const data = fs.readFileSync(RECORDS_FILE, 'utf8')
    const recordsData = JSON.parse(data)
    return recordsData.records || []
  } catch (error) {
    console.error('读取记录数据失败:', error)
    return []
  }
}

// 读取体测记录数据
const readPhysicalRecords = () => {
  try {
    const data = fs.readFileSync(PHYSICAL_TEST_FILE, 'utf8')
    const recordsData = JSON.parse(data)
    return recordsData.records || []
  } catch (error) {
    console.error('读取体测记录数据失败:', error)
    return []
  }
}

/**
 * 获取所有用户
 * GET /api/admin/users
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    let users = []
    let useDatabase = false
    let pool = null
    
    // 尝试连接数据库
    if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
      try {
        pool = createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })
        
        const connection = await pool.getConnection()
        connection.release()
        useDatabase = true
        console.log('数据库连接成功，将从数据库获取用户列表')
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    } else {
      console.log('未配置数据库连接信息，将使用文件存储')
    }
    
    // 从数据库获取用户
    if (useDatabase && pool) {
      const [rows] = await pool.query('SELECT * FROM users')
      
      // 简化用户数据（移除密码等敏感信息）
      users = rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    } else {
      // 从文件获取用户
      const fileUsers = readUsers()
      
      // 简化用户数据（移除密码等敏感信息）
      users = fileUsers.map(user => ({
        id: user.id,
        username: user.username,
        isDisabled: user.isDisabled || false,
        disabledReason: user.disabledReason || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    }
    
    res.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: `获取用户列表失败: ${error.message || '服务器错误'}`
    })
  }
})

/**
 * 获取用户健康记录
 * GET /api/admin/user-records/:userId/health
 */
router.get('/user-records/:userId/health', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId
    let records = []
    let useDatabase = false
    let pool = null
    
    // 尝试连接数据库
    if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
      try {
        pool = createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })
        
        const connection = await pool.getConnection()
        connection.release()
        useDatabase = true
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    }
    
    // 从数据库获取记录
    if (useDatabase && pool) {
      const [rows] = await pool.query(
        'SELECT * FROM health_records WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      )
      records = rows
    } else {
      // 从文件获取记录
      const allRecords = readHealthRecords()
      records = allRecords.filter(record => {
        // 处理可能存在的不同用户ID格式
        const recordUserId = record.userId || record.user_id
        return recordUserId === userId || recordUserId === Number(userId)
      })
    }
    
    res.json({
      success: true,
      records
    })
  } catch (error) {
    console.error('获取用户健康记录失败:', error)
    res.status(500).json({
      success: false,
      message: `获取用户健康记录失败: ${error.message || '服务器错误'}`
    })
  }
})

/**
 * 获取用户体测记录
 * GET /api/admin/user-records/:userId/physical
 */
router.get('/user-records/:userId/physical', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId
    let records = []
    let useDatabase = false
    let pool = null
    
    // 尝试连接数据库
    if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
      try {
        pool = createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })
        
        const connection = await pool.getConnection()
        connection.release()
        useDatabase = true
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    }
    
    // 从数据库获取记录
    if (useDatabase && pool) {
      const [rows] = await pool.query(
        'SELECT * FROM physical_test_records WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      )
      records = rows
    } else {
      // 从文件获取记录
      const allRecords = readPhysicalRecords()
      records = allRecords.filter(record => {
        // 处理可能存在的不同用户ID格式
        const recordUserId = record.userId || record.user_id
        return recordUserId === userId || recordUserId === Number(userId)
      })
    }
    
    res.json({
      success: true,
      records
    })
  } catch (error) {
    console.error('获取用户体测记录失败:', error)
    res.status(500).json({
      success: false,
      message: `获取用户体测记录失败: ${error.message || '服务器错误'}`
    })
  }
})

/**
 * 禁用用户
 * POST /api/admin/users/:userId/disable
 */
router.post('/users/:userId/disable', requireAdmin, async (req, res) => {
  try {
    // 获取请求参数
    const userId = req.params.userId
    const { reason } = req.body

    console.log(`尝试禁用用户ID: ${userId}, 原因: ${reason || '无'}, 类型: ${typeof userId}`)
    
    let useDatabase = false
    let pool = null
    
    // 尝试连接数据库
    if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
      try {
        pool = createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })
        
        const connection = await pool.getConnection()
        
        // 检查users表是否有必要的字段
        try {
          // 检查表结构
          const [columns] = await connection.query("SHOW COLUMNS FROM users");
          const columnNames = columns.map(col => col.Field);
          
          if (!columnNames.includes('is_disabled') || !columnNames.includes('disabled_reason')) {
            console.warn('数据库users表缺少必要的字段(is_disabled/disabled_reason)，将使用文件存储')
            useDatabase = false
          } else {
            useDatabase = true
          }
        } catch (tableError) {
          console.error('检查数据库表结构失败:', tableError.message)
          useDatabase = false
        }
        
        connection.release()
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    }
    
    // 使用数据库
    if (useDatabase && pool) {
      try {
        // 检查用户是否存在
        const [users] = await pool.query(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        )
        
        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          })
        }
        
        // 检查是否是管理员
        if (users[0].is_admin) {
          return res.status(403).json({
            success: false,
            message: '无法禁用管理员账户'
          })
        }
        
        // 禁用用户
        await pool.query(
          'UPDATE users SET is_disabled = 1, disabled_reason = ? WHERE id = ?',
          [reason || null, userId]
        )
        
        console.log(`用户 ${userId} 已成功禁用(数据库)`)
        res.json({
          success: true,
          message: '用户已禁用'
        })
      } catch (dbError) {
        console.error('数据库操作失败:', dbError.message)
        
        // 如果数据库操作失败，回退到文件存储
        console.log('数据库操作失败，切换到文件存储模式')
        useDatabase = false
            }
    }
    
    // 使用文件存储（当数据库不可用或操作失败时）
    if (!useDatabase) {
      const users = readUsers()
      console.log(`从文件读取到 ${users.length} 个用户`)
      console.log(`用户ID列表: ${JSON.stringify(users.map(u => u.id))}`)
      
      // 找到要禁用的用户
      const userIndex = users.findIndex(user => {
        const uid = String(user.id);
        const queryId = String(userId);
        const match = uid === queryId;
        console.log(`比较用户ID: ${uid} 与查询ID: ${queryId}, 匹配: ${match}`);
        return match;
      })
      
      console.log(`找到用户索引: ${userIndex}`)
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }
      
      // 检查是否是管理员
      if (users[userIndex].isAdmin) {
        return res.status(403).json({
          success: false,
          message: '无法禁用管理员账户'
        })
      }
      
      // 禁用用户
      users[userIndex].isDisabled = true
      users[userIndex].disabledReason = reason || null
      
      console.log('设置禁用状态完成，用户数据:', JSON.stringify({
        ...users[userIndex],
        password: '***隐藏***'
      }))
      
      // 保存更新后的用户数据
      if (writeUsers(users)) {
        console.log(`用户 ${userId} 已成功禁用，禁用状态: ${users[userIndex].isDisabled}`)
        
        // 再次验证保存后的用户数据
        const updatedUsers = readUsers()
        const updatedUser = updatedUsers.find(u => String(u.id) === String(userId))
        console.log(`验证保存后的禁用状态: ${updatedUser?.isDisabled}, 类型: ${typeof updatedUser?.isDisabled}`)
        
        res.json({
          success: true,
          message: '用户已禁用'
        })
      } else {
        console.error(`保存用户数据失败`)
        res.status(500).json({
          success: false,
          message: '保存用户数据失败'
        })
      }
    }
  } catch (error) {
    console.error('禁用用户失败:', error)
    res.status(500).json({
      success: false,
      message: `禁用用户失败: ${error.message || '服务器错误'}`
    })
  }
})

/**
 * 启用用户
 * POST /api/admin/users/:userId/enable
 */
router.post('/users/:userId/enable', requireAdmin, async (req, res) => {
  try {
    // 获取请求参数
    const userId = req.params.userId
    
    console.log(`尝试启用用户ID: ${userId}`)
    
    let useDatabase = false
    let pool = null
    
    // 尝试连接数据库
    if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
      try {
        pool = createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })
        
        const connection = await pool.getConnection()
        
        // 检查users表是否有必要的字段
        try {
          // 检查表结构
          const [columns] = await connection.query("SHOW COLUMNS FROM users");
          const columnNames = columns.map(col => col.Field);
          
          if (!columnNames.includes('is_disabled') || !columnNames.includes('disabled_reason')) {
            console.warn('数据库users表缺少必要的字段(is_disabled/disabled_reason)，将使用文件存储')
            useDatabase = false
          } else {
            useDatabase = true
          }
        } catch (tableError) {
          console.error('检查数据库表结构失败:', tableError.message)
          useDatabase = false
        }
        
        connection.release()
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    }
    
    // 使用数据库
    if (useDatabase && pool) {
      try {
        // 检查用户是否存在
        const [users] = await pool.query(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        )
        
        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          })
        }
        
        // 启用用户
        await pool.query(
          'UPDATE users SET is_disabled = 0, disabled_reason = NULL WHERE id = ?',
          [userId]
        )
        
        console.log(`用户 ${userId} 已成功启用(数据库)`)
        res.json({
          success: true,
          message: '用户已启用'
        })
      } catch (dbError) {
        console.error('数据库操作失败:', dbError.message)
        // 如果数据库操作失败，回退到文件存储
        console.log('数据库操作失败，切换到文件存储模式')
        useDatabase = false
      }
    }
    
        // 使用文件存储（当数据库不可用或操作失败时）
    if (!useDatabase) {
      const users = readUsers()
      console.log(`从文件读取到 ${users.length} 个用户`)
      console.log(`用户ID列表: ${JSON.stringify(users.map(u => u.id))}`)
      
      // 找到要启用的用户
      const userIndex = users.findIndex(user => {
        const uid = String(user.id);
        const queryId = String(userId);
        const match = uid === queryId;
        console.log(`比较用户ID: ${uid} 与查询ID: ${queryId}, 匹配: ${match}`);
        return match;
      })
      
      console.log(`找到用户索引: ${userIndex}`)
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }
      
      // 启用用户
      users[userIndex].isDisabled = false
      users[userIndex].disabledReason = null
      
      // 保存更新后的用户数据
      if (writeUsers(users)) {
        console.log(`用户 ${userId} 已成功启用`)
        res.json({
          success: true,
          message: '用户已启用'
        })
      } else {
        console.error(`保存用户数据失败`)
        res.status(500).json({
          success: false,
          message: '保存用户数据失败'
        })
      }
    }
  } catch (error) {
    console.error('启用用户失败:', error)
    res.status(500).json({
      success: false,
      message: `启用用户失败: ${error.message || '服务器错误'}`
    })
  }
})

export default router 