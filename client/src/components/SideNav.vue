<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref(localStorage.getItem('lastUsername') || '未登录')
const userAvatar = ref(localStorage.getItem('lastUserAvatar') || '/src/assets/1.jpg')

const navItems = [
  { name: '体测记录分析', path: '/timeline', icon: '📊' },
  { name: '健康记录分析', path: '/health-records', icon: '📈' },
  { name: '健康目标制定', path: '/health-indicators', icon: '🎯' },
  { name: '智能健康管家', path: '/ai-assistant', icon: '🤖' }
]

const handleAvatarClick = () => {
  router.push('/profile')
}

const handleUsernameClick = () => {
  router.push('/profile')
}

const updateUserInfo = () => {
  username.value = localStorage.getItem('lastUsername') || '未登录'
  userAvatar.value = localStorage.getItem('lastUserAvatar') || '/src/assets/1.jpg'
}

// 监听存储变化
window.addEventListener('storage', updateUserInfo)

// 初始加载时更新一次
onMounted(() => {
  updateUserInfo()
})

// 组件卸载时移除监听
onBeforeUnmount(() => {
  window.removeEventListener('storage', updateUserInfo)
})
</script>

<template>
  <div class="sidebar">
    <h1 class="logo">智能校园健康系统</h1>
    <div class="profile">
      <img :src="userAvatar" alt="用户头像" class="avatar" @click="handleAvatarClick">
      <h2 class="username" @click="handleUsernameClick">{{ username }}</h2>
    </div>
    <nav class="nav-menu">
      <router-link
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.sidebar {
  width: 280px;
  padding: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  text-align: center;
  font-size: 24px;
  margin-bottom: 40px;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3),
               0 0 20px rgba(255, 255, 255, 0.2);
  font-weight: bold;
  letter-spacing: 1px;
}

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
  width: 100%;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 15px;
  cursor: pointer;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.avatar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.username {
  font-size: 28px;
  cursor: pointer;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3),
               0 0 20px rgba(255, 255, 255, 0.2);
  margin-bottom: 40px;
  font-weight: 500;
  letter-spacing: 1px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: 20px;
  padding: 12px 15px;
  text-align: left;
  position: relative;
  transition: all 0.3s ease;
  border-radius: 12px;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  width: 100%;
}

.nav-icon {
  margin-right: 12px;
  font-size: 22px;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.nav-item.active {
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border-left: 4px solid white;
}

.nav-item::after {
  display: none;
}

.nav-item span {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.nav-item:hover span.nav-text {
  transform: translateX(3px);
}

.nav-item.active span.nav-text {
  font-weight: 600;
}

.nav-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 