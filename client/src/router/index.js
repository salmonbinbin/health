import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HealthRecordView from '../views/HealthRecordView.vue'
import MyRecordsView from '../views/MyRecordsView.vue'
import PhysicalTestRecordsView from '../views/PhysicalTestRecordsView.vue'
import AdminView from '../views/AdminView.vue'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/health-record',
    redirect: '/health-records'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('../views/TimelineView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health-records',
    name: 'health-records',
    component: HealthRecordView,
    meta: { requiresAuth: true }
  },
  {
    path: '/health-indicators',
    name: 'HealthIndicators',
    component: () => import('../views/HealthIndicatorsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/indicator/:id',
    name: 'IndicatorDetail',
    component: () => import('../views/IndicatorDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/add-record',
    name: 'AddRecord',
    component: () => import('../views/AddRecordView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-records',
    name: 'MyRecords',
    component: MyRecordsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/physical-test-records',
    name: 'PhysicalTestRecords',
    component: PhysicalTestRecordsView
  },
  {
    path: '/ai-assistant',
    name: 'AIAssistant',
    component: () => import('../views/AIAssistantView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  console.log('路由导航开始:', to.path);
  
  // 从localStorage获取认证信息
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  console.log('当前用户信息:', JSON.stringify({
    ...user,
    token: token ? '***有token***' : '***无token***'
  }));
  
  // 尝试使用JWT认证，如果失败则回退到旧的认证方式
  const isAuthenticated = (token && user.id) || localStorage.getItem('lastUsername')
  
  // 检查用户是否被禁用 - 仅从用户对象检查
  const isDisabled = user && user.isDisabled === true;
  
  console.log('用户认证状态:', isAuthenticated ? '已认证' : '未认证');
  console.log('用户禁用状态:', isDisabled ? '已禁用' : '未禁用');
  
  // 如果用户被禁用，只能访问登录和注册页面
  if (isDisabled && to.path !== '/login' && to.path !== '/register') {
    console.log('用户被禁用，重定向到登录页面');
    ElMessage.error('您的账户已被禁用，请联系管理员')
    next('/login')
    return
  }
  
  // 检查是否是管理员路由
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (user.username === 'admin') {
      next()
    } else {
      // 不是管理员，重定向到登录页
      next('/login')
    }
  }
  // 检查是否需要普通用户认证
  else if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
