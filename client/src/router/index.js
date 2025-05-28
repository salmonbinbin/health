import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HealthRecordView from '../views/HealthRecordView.vue'
import MyRecordsView from '../views/MyRecordsView.vue'
import PhysicalTestRecordsView from '../views/PhysicalTestRecordsView.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('lastUsername')
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
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
