import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 认证工具类
export const authApi = {
  // 用户注册
  register(userData) {
    return api.post('/auth/register', userData)
  },
  
  // 用户登录
  login(credentials) {
    return api.post('/auth/login', credentials)
  },
  
  // 获取当前认证信息
  getAuthInfo() {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAuthenticated = !!token && !!user.id
    
    return { token, user, isAuthenticated }
  },
  
  // 设置认证信息
  setAuthInfo(authData) {
    if (authData.token) {
      localStorage.setItem('token', authData.token)
    }
    
    if (authData.user) {
      // 检查用户是否被禁用，将禁用状态存储在用户对象中，而不是单独的localStorage项
      localStorage.setItem('user', JSON.stringify(authData.user))
      
      // 保持向后兼容性，同时设置lastUsername
      if (authData.user.username) {
        localStorage.setItem('lastUsername', authData.user.username)
      }
    }
  },
  
  // 清除认证信息
  clearAuthInfo() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 不要删除lastUsername，以保持与现有功能的兼容性
  },
  
  // 获取JWT请求头
  getAuthHeader() {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
  
  // 检查当前用户是否被禁用
  isCurrentUserDisabled() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user && user.isDisabled === true
  }
}

// 请求拦截器：自动添加JWT令牌
api.interceptors.request.use(
  config => {
    // 获取JWT认证头
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    // 检查当前用户是否被禁用（仅从用户对象中检查）
    const isDisabled = user && user.isDisabled === true;
    
    // 如果用户被禁用且不是登录或注册请求，拒绝请求
    if (isDisabled && 
        !config.url.includes('/auth/login') && 
        !config.url.includes('/auth/register')) {
      console.warn('禁用用户尝试发送请求:', config.url);
      // 创建一个伪造的请求取消错误
      const error = new Error('用户已禁用，无法发送请求');
      error.isDisabledError = true;
      return Promise.reject(error);
    }
    
    // 检查是否是管理员用户
    if (user.isAdmin && token === 'admin-token') {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer admin-token`
      }
      return config
    }
    
    // 普通用户处理
    const headers = authApi.getAuthHeader()
    
    // 合并认证头到请求头
    config.headers = {
      ...config.headers,
      ...headers
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 检查是否是登录响应，并且用户被禁用
    if (response.data && 
        response.config.url.includes('/auth/login') && 
        response.data.user && 
        response.data.user.isDisabled === true) {
      
      console.warn('检测到禁用用户登录成功响应');
      
      // 创建一个禁用错误
      const error = new Error('用户已被禁用，请联系管理员');
      error.response = {
        status: 403,
        data: {
          success: false,
          message: '账户已被禁用，请联系管理员',
          isDisabled: true
        }
      };
      return Promise.reject(error);
    }
    
    return response.data;
  },
  error => {
    // 处理认证错误
    if (error.response && error.response.status === 401) {
      // 清除过期的认证信息
      console.warn('身份验证已过期或无效')
      // 我们不清除认证信息，以保持与现有功能的兼容性
      // authApi.clearAuthInfo()
    }
    
    // 处理自定义禁用错误
    if (error.isDisabledError) {
      console.error('用户已禁用，请求被拒绝');
      // 重定向到登录页面
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    } else {
      console.error('API请求错误:', error);
    }
    
    return Promise.reject(error)
  }
)

// 健康记录相关API
export const healthRecordApi = {
  // 获取健康记录列表
  getList() {
    return api.get('/health-records')
  },
  
  // 添加健康记录
  add(record) {
    return api.post('/health-records', record)
  }
}

// 测试连接
export const testConnection = () => api.get('/test')

export const physicalTestApi = {
  getList: () => axios.get('/api/physical-test-records'),
  add: (data) => axios.post('/api/physical-test-records', data),
  getLatest: () => axios.get('/api/physical-test-records/latest')
}

export default api 