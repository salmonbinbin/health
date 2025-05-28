import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API请求错误:', error)
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