import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// JWT密钥，理想情况下应该从环境变量中获取
const JWT_SECRET = process.env.JWT_SECRET || 'health_system_secret_key'
// 令牌有效期：24小时
const JWT_EXPIRES_IN = '24h'

/**
 * 生成JWT令牌
 * @param {Object} userData - 用户数据，应包含userId和可选的username
 * @returns {String} JWT令牌
 */
export const generateToken = (userData) => {
  return jwt.sign(
    { 
      userId: userData.id || userData.userId,
      username: userData.username 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * 验证JWT令牌
 * @param {String} token - JWT令牌
 * @returns {Object|null} 解码后的用户数据或null(如果验证失败)
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('JWT验证失败:', error.message)
    return null
  }
}

/**
 * 从请求中提取JWT令牌
 * @param {Object} req - Express请求对象
 * @returns {String|null} JWT令牌或null
 */
export const getTokenFromRequest = (req) => {
  // 从Authorization头部获取
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7) // 移除"Bearer "前缀
  }
  
  // 或者从查询参数获取
  if (req.query && req.query.token) {
    return req.query.token
  }
  
  // 或者从cookie获取
  if (req.cookies && req.cookies.token) {
    return req.cookies.token
  }
  
  return null
} 