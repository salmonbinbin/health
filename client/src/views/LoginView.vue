<template>
  <div class="login-container">
    <div class="login-box">
      <div class="avatar-container">
        <img :src="lastUserAvatar || defaultAvatar" class="avatar" alt="用户头像">
      </div>
      <div class="form-container">
        <h2>登录</h2>
        <input 
          type="text" 
          v-model="username" 
          placeholder="请输入用户名"
          class="input-field"
        >
        <input 
          type="password" 
          v-model="password" 
          placeholder="请输入密码" 
          class="input-field"
        >
        <div class="button-group">
          <button @click="handleLogin" class="login-button">登录</button>
          <button @click="goToRegister" class="register-button">注册</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultAvatarImg from '@/assets/1.jpg'

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      defaultAvatar: defaultAvatarImg,
      lastUserAvatar: localStorage.getItem('lastUserAvatar'),
      lastUsername: localStorage.getItem('lastUsername')
    }
  },
  methods: {
    handleLogin() {
      // 这里添加登录逻辑
      if (this.username && this.password) {
        // 保存用户信息到本地存储
        localStorage.setItem('lastUsername', this.username)
        // 模拟登录成功
        this.$router.push('/timeline')
      } else {
        alert('请输入用户名和密码')
      }
    },
    goToRegister() {
      this.$router.push('/register')
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url('@/assets/image.png') no-repeat center center;
  background-size: cover;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 400px;
}

.avatar-container {
  text-align: center;
  margin-bottom: 30px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-field {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #409EFF;
}

.button-group {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.login-button, .register-button {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button {
  background-color: #409EFF;
  color: white;
}

.login-button:hover {
  background-color: #66b1ff;
}

.register-button {
  background-color: #67C23A;
  color: white;
}

.register-button:hover {
  background-color: #85ce61;
}
</style> 