/**
 * 创建管理员账户脚本
 * 运行方式：node server/scripts/create-admin.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { createPool } from 'mysql2/promise'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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
    process.exit(1)
  }
}

// 读取用户数据
const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8')
    
    if (!data || data.trim() === '') {
      return []
    }
    
    try {
      const parsed = JSON.parse(data)
      
      if (!parsed || !Array.isArray(parsed.users)) {
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
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2))
    return true
  } catch (error) {
    console.error('写入用户数据失败:', error)
    return false
  }
}

// 创建管理员账户
async function createAdminAccount() {
  // 管理员账户信息
  const adminUsername = 'admin'
  const adminPassword = '1234'
  
  try {
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
        console.log('数据库连接成功，将使用数据库存储管理员账户')
      } catch (error) {
        console.error('数据库连接失败，将使用文件存储:', error.message)
        useDatabase = false
      }
    } else {
      console.log('未配置数据库连接信息，将使用文件存储')
    }
    
    // 密码加密
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(adminPassword, salt)
    
    // 使用数据库存储
    if (useDatabase && pool) {
      // 检查管理员是否已存在
      const [existingAdmins] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [adminUsername]
      )
      
      if (existingAdmins.length > 0) {
        console.log('管理员账户已存在，无需创建')
        return
      }
      
      // 创建管理员账户
      await pool.query(
        'INSERT INTO users (username, password, created_at, is_admin) VALUES (?, ?, NOW(), 1)',
        [adminUsername, hashedPassword]
      )
      
      console.log('管理员账户创建成功（数据库）')
    } else {
      // 使用文件存储
      const users = readUsers()
      
      // 检查管理员是否已存在
      if (users.some(user => user.username === adminUsername)) {
        console.log('管理员账户已存在，无需创建')
        return
      }
      
      // 创建新管理员
      const newAdmin = {
        id: 'admin-' + Date.now().toString(),
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
        createdAt: new Date().toISOString()
      }
      
      // 添加新管理员到用户列表
      const updatedUsers = [...users, newAdmin]
      
      // 写入更新后的用户数据
      if (writeUsers(updatedUsers)) {
        console.log('管理员账户创建成功（文件存储）')
      } else {
        console.error('管理员账户创建失败')
      }
    }
  } catch (error) {
    console.error('创建管理员账户时出错:', error)
  }
}

// 执行创建管理员账户
createAdminAccount().then(() => {
  console.log('脚本执行完成')
  process.exit(0)
}).catch(error => {
  console.error('脚本执行失败:', error)
  process.exit(1)
}) 