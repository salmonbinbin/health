import express from 'express'
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwtUtils.js'
import { createPool } from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')

// 确保data目录存在
if (!fs.existsSync(path.dirname(USERS_FILE))) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true })
}

// 确保users.json文件存在
if (!fs.existsSync(USERS_FILE)) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2))
    console.log('创建用户数据文件成功:', USERS_FILE)
  } catch (error) {
    console.error('创建用户数据文件失败:', error)
  }
}

// 读取用户数据 - 增强版
const readUsers = () => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(USERS_FILE)) {
      console.warn('用户数据文件不存在，将创建新文件')
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2))
      return []
    }
    
    // 读取文件内容
    const data = fs.readFileSync(USERS_FILE, 'utf8')
    
    // 验证文件内容不为空
    if (!data || data.trim() === '') {
      console.warn('用户数据文件为空，初始化为空数组')
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2))
      return []
    }
    
    try {
      // 解析JSON数据
      const parsed = JSON.parse(data)
      
      // 确保返回的是数组
      if (!parsed || !Array.isArray(parsed.users)) {
        console.warn('用户数据格式不正确，重置为空数组')
        return []
      }
      
      console.log(`成功读取用户数据，共${parsed.users.length}个用户`)
      return parsed.users
    } catch (parseError) {
      console.error('解析用户数据JSON失败:', parseError)
      // 如果解析失败，备份原文件并创建新文件
      const backupFile = `${USERS_FILE}.backup.${Date.now()}`
      fs.copyFileSync(USERS_FILE, backupFile)
      console.warn(`已将损坏的用户数据文件备份到: ${backupFile}`)
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2))
      return []
    }
  } catch (error) {
    console.error('读取用户数据失败:', error)
    return []
  }
}

// 写入用户数据 - 增强版
const writeUsers = (users) => {
  try {
    // 首先验证输入
    if (!Array.isArray(users)) {
      console.error('写入失败: 用户数据必须是数组')
      return false
    }
    
    // 如果文件已存在，先读取当前内容作为备份
    let backupData = null
    if (fs.existsSync(USERS_FILE)) {
      try {
        const currentData = fs.readFileSync(USERS_FILE, 'utf8')
        if (currentData && currentData.trim() !== '') {
          backupData = currentData
        }
      } catch (readError) {
        console.warn('备份当前用户数据失败:', readError)
      }
    }
    
    // 写入新数据
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2))
    console.log(`成功写入用户数据，共${users.length}个用户`)
    
    // 验证写入是否成功
    try {
      const verification = fs.readFileSync(USERS_FILE, 'utf8')
      const parsed = JSON.parse(verification)
      if (!parsed || !Array.isArray(parsed.users) || parsed.users.length !== users.length) {
        throw new Error('写入验证失败')
      }
    } catch (verifyError) {
      console.error('写入验证失败，尝试恢复备份:', verifyError)
      if (backupData) {
        fs.writeFileSync(USERS_FILE, backupData)
        console.log('已恢复用户数据备份')
      }
      return false
    }
    
    return true
  } catch (error) {
    console.error('写入用户数据失败:', error)
    return false
  }
}

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    console.log('收到注册请求:', { ...req.body, password: '***隐藏***' })
    
    const { username, password } = req.body
    
    // 验证请求数据
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }
    
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
        console.log('数据库连接成功，将使用数据库存储用户信息')
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    } else {
      console.log('未配置数据库连接信息，将使用文件存储')
    }
    
    // 使用数据库存储
    if (useDatabase && pool) {
      // 检查用户名是否已存在
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      )
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        })
      }
      
      // 密码加密
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      
      // 创建新用户
      const [result] = await pool.query(
        'INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())',
        [username, hashedPassword]
      )
      
      const userId = result.insertId
      
      // 生成JWT
      const token = generateToken({ id: userId, username })
      
      console.log('用户注册成功（数据库）:', username)
      
      res.status(201).json({
        success: true,
        message: '注册成功',
        token,
        user: {
          id: userId,
          username
        }
      })
    } else {
      // 使用文件存储
      // 读取现有用户数据
      const users = readUsers()
      
      console.log('当前用户数据:', users.map(u => ({ id: u.id, username: u.username })))
      
      // 检查用户名是否已存在
      if (users.some(user => user.username === username)) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        })
      }
      
      // 密码加密
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      
      // 创建新用户
      const newUser = {
        id: Date.now().toString(),
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }
      
      // 添加新用户到用户列表
      const updatedUsers = [...users, newUser]
      
      // 写入更新后的用户数据
      if (writeUsers(updatedUsers)) {
        // 生成JWT
        const token = generateToken({ id: newUser.id, username })
        
        console.log('用户注册成功（文件存储）:', username)
        console.log('当前用户总数:', updatedUsers.length)
        
        res.status(201).json({
          success: true,
          message: '注册成功',
          token,
          user: {
            id: newUser.id,
            username
          }
        })
      } else {
        console.error('保存用户数据失败')
        res.status(500).json({
          success: false,
          message: '注册失败，无法保存用户数据'
        })
      }
    }
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      message: `注册失败: ${error.message || '服务器错误'}`
    })
  }
})

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    console.log('====== 登录请求开始 ======')
    console.log('收到登录请求:', { ...req.body, password: '***隐藏***' })
    
    const { username, password } = req.body
    
    // 验证请求数据
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }
    
    let user = null
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
        console.log('数据库连接成功，将从数据库验证用户')
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    } else {
      console.log('未配置数据库连接信息，将使用文件存储')
    }
    
    // 使用数据库存储
    if (useDatabase && pool) {
      // 查找用户
      const [users] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      )
      
      if (users.length === 0) {
        console.log('用户不存在（数据库）:', username)
        return res.status(400).json({
          success: false,
          message: '用户名或密码错误'
        })
      }
      
      user = users[0]
      
      console.log('找到用户(数据库):', username, ', 用户ID:', user.id, ', 禁用状态:', user.is_disabled ? '已禁用' : '正常')
      
      // 检查用户是否被禁用 - 数据库模式
      if (user.is_disabled === 1 || user.is_disabled === true) {
        console.log('用户已禁用(数据库)，拒绝登录')
        return res.status(403).json({
          success: false,
          message: `账户已被禁用${user.disabled_reason ? '，原因: ' + user.disabled_reason : ''}`,
          isDisabled: true
        })
      }
      
      // 同步检查文件存储中的禁用状态
      try {
        const fileUsers = readUsers();
        const fileUser = fileUsers.find(u => u.username === username);
        if (fileUser && fileUser.isDisabled === true) {
          console.log('用户在文件存储中被标记为禁用，同步更新数据库状态');
          await pool.query(
            'UPDATE users SET is_disabled = 1, disabled_reason = ? WHERE id = ?',
            [fileUser.disabledReason || null, user.id]
          );
          return res.status(403).json({
            success: false,
            message: `账户已被禁用${fileUser.disabledReason ? '，原因: ' + fileUser.disabledReason : ''}`,
            isDisabled: true
          });
        }
      } catch (syncError) {
        console.error('同步检查文件存储禁用状态失败:', syncError.message);
        // 不影响主流程，继续使用数据库中的状态
      }
    } else {
      // 使用文件存储
      const users = readUsers()
      
      console.log('从文件读取的用户数:', users.length)
      console.log('所有用户名:', users.map(u => u.username).join(', '))
      
      // 查找用户
      user = users.find(u => u.username === username)
      
      if (!user) {
        console.log('用户不存在（文件存储）:', username)
        return res.status(400).json({
          success: false,
          message: '用户名或密码错误'
        })
      }
      
      console.log('找到用户:', username, ', 用户ID:', user.id)
      console.log('用户完整信息:', JSON.stringify({
        ...user,
        password: '***隐藏***'
      }))
      console.log('禁用状态:', user.isDisabled, '类型:', typeof user.isDisabled)
      
      // 严格检查用户是否被禁用 - 文件存储模式
      const isUserDisabled = user.isDisabled === true;
      console.log('用户是否被禁用(严格检查):', isUserDisabled)
      
      if (isUserDisabled) {
        console.log('用户已禁用(文件存储)，拒绝登录:', username, '禁用原因:', user.disabledReason || '无')
        
        // 尝试同步更新数据库中的用户状态
        if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
          try {
            const syncPool = createPool({
              host: process.env.DB_HOST,
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD || '',
              database: process.env.DB_NAME,
              waitForConnections: true,
              connectionLimit: 10,
              queueLimit: 0
            });
            
            // 检查数据库中是否存在该用户
            const [dbUsers] = await syncPool.query(
              'SELECT * FROM users WHERE username = ?',
              [username]
            );
            
            if (dbUsers.length > 0) {
              // 用户在数据库中存在，更新禁用状态
              await syncPool.query(
                'UPDATE users SET is_disabled = 1, disabled_reason = ? WHERE username = ?',
                [user.disabledReason || null, username]
              );
              console.log(`已同步更新数据库中用户 ${username} 的禁用状态`);
            }
          } catch (syncError) {
            console.error('同步数据库禁用状态失败:', syncError.message);
            // 不影响主流程，所以这里不返回错误
          }
        }
        
        return res.status(403).json({
          success: false,
          message: `账户已被禁用${user.disabledReason ? '，原因: ' + user.disabledReason : ''}`,
          isDisabled: true
        })
      }
      
      console.log('用户未禁用，继续登录流程')
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password)
    
    if (!isMatch) {
      console.log('密码不匹配:', username)
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
    
    // 生成JWT
    const token = generateToken({ id: user.id, username: user.username })
    
    console.log('用户登录成功:', username)
    
    // 构建响应中的用户对象
    const userResponse = {
      id: user.id,
      username: user.username
    }
    
    // 添加禁用状态 - 再次确认
    if (useDatabase) {
      userResponse.isDisabled = user.is_disabled === 1 || user.is_disabled === true
    } else {
      userResponse.isDisabled = user.isDisabled === true
    }
    
    // 强制检查 - 如果用户被禁用，拒绝登录
    if (userResponse.isDisabled) {
      console.log('最终检查: 用户已禁用，拒绝登录')
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员',
        isDisabled: true
      })
    }
    
    console.log('最终检查: 用户未禁用，允许登录')
    console.log('返回用户信息:', JSON.stringify(userResponse))
    console.log('====== 登录请求结束 ======')
    
    // 返回登录成功响应
    res.json({
      success: true,
      message: '登录成功',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: `登录失败: ${error.message || '服务器错误'}`
    })
  }
})

export default router 