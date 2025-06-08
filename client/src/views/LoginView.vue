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
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="button-group">
          <button @click="handleLogin" class="login-button" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <button @click="goToRegister" class="register-button" :disabled="loading">注册</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultAvatarImg from '@/assets/1.jpg'
import { authApi } from '@/utils/api'
import { ElMessage } from 'element-plus'

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      errorMessage: '',
      defaultAvatar: defaultAvatarImg,
      lastUserAvatar: localStorage.getItem('lastUserAvatar'),
      lastUsername: localStorage.getItem('lastUsername')
    }
  },
  methods: {
    async handleLogin() {
      // 清除之前的错误信息
      this.errorMessage = '';
      
      // 基本验证
      if (!this.username || !this.password) {
        this.errorMessage = '请输入用户名和密码';
        return;
      }
      
      this.loading = true;
      
      try {
        // 管理员登录特殊处理
        if (this.username === 'admin' && this.password === '1234') {
          // 管理员认证信息
          const adminUser = {
            id: 'admin',
            username: 'admin',
            isAdmin: true
          };
          
          // 直接设置管理员登录信息
          authApi.setAuthInfo({
            token: 'admin-token', // 简单处理，实际中应该有正规的JWT
            user: adminUser
          });
          
          // 保存用户信息到本地存储（保持向后兼容性）
          localStorage.setItem('lastUsername', this.username);
          
          // 显示成功消息
          ElMessage.success('管理员登录成功！');
          
          // 跳转到管理后台
          this.$router.push('/admin');
          this.loading = false;
          return;
        }
        
        // 普通用户登录处理
        // 调用登录API
        const response = await authApi.login({
          username: this.username,
          password: this.password
        });
        
        // 如果API调用成功
        if (response.success) {
          console.log('登录成功响应:', JSON.stringify({
            ...response,
            token: '***隐藏***'
          }));
          
          // 检查用户是否被禁用 - 严格检查
          if (response.user && response.user.isDisabled === true) {
            console.log('检测到用户被禁用，阻止登录');
            this.errorMessage = `账户已被禁用，请联系管理员`;
            ElMessage.error({
              message: this.errorMessage,
              duration: 5000
            });
            this.loading = false;
            return;
          }
          
          // 额外检查，防止绕过
          if (typeof response.user.isDisabled !== 'undefined' && response.user.isDisabled !== false) {
            console.log('检测到可疑的禁用状态:', response.user.isDisabled);
            this.errorMessage = `账户状态异常，请联系管理员`;
            ElMessage.error({
              message: this.errorMessage,
              duration: 5000
            });
            this.loading = false;
            return;
          }
          
          console.log('用户未被禁用，允许登录');
          
          // 保存JWT和用户信息
          authApi.setAuthInfo({
            token: response.token,
            user: response.user
          });
          
          // 保存用户信息到本地存储（保持向后兼容性）
          localStorage.setItem('lastUsername', this.username);
          
          // 显示成功消息
          ElMessage.success('登录成功！');
          
          // 跳转到主页
          this.$router.push('/timeline');
        } else {
          this.errorMessage = response.message || '登录失败，请检查用户名和密码';
        }
      } catch (error) {
        console.error('登录错误:', error);
        
        // 处理账户被禁用的情况
        if (error.response && error.response.status === 403 && error.response.data.isDisabled) {
          this.errorMessage = error.response.data.message || '您的账户已被禁用，请联系管理员';
          ElMessage.error({
            message: this.errorMessage,
            duration: 5000
          });
        } else {
          this.errorMessage = error.response?.data?.message || '登录失败，请检查网络连接';
        }
      } finally {
        this.loading = false;
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

.error-message {
  color: #F56C6C;
  font-size: 14px;
  margin-top: -10px;
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

.login-button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.login-button:disabled,
.register-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.register-button {
  background-color: #67C23A;
  color: white;
}

.register-button:hover:not(:disabled) {
  background-color: #85ce61;
}
</style> 