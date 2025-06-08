<template>
  <div class="register-container">
    <div class="register-box">
      <div class="avatar-container">
        <img :src="avatarPreview || defaultAvatar" class="avatar" alt="用户头像">
        <input 
          type="file" 
          ref="avatarInput" 
          @change="handleAvatarChange" 
          accept="image/*" 
          style="display: none"
        >
        <button @click="triggerAvatarUpload" class="upload-button">上传头像</button>
      </div>
      <div class="form-container">
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
        <input 
          type="password" 
          v-model="confirmPassword" 
          placeholder="请确认密码" 
          class="input-field"
        >
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="button-group">
          <button @click="handleRegister" class="register-button" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
          <button @click="goToLogin" class="back-button" :disabled="loading">返回登录</button>
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
  name: 'RegisterView',
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: '',
      avatarPreview: '',
      loading: false,
      errorMessage: '',
      defaultAvatar: defaultAvatarImg
    }
  },
  methods: {
    triggerAvatarUpload() {
      this.$refs.avatarInput.click()
    },
    handleAvatarChange(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.avatarPreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    async handleRegister() {
      // 清除之前的错误信息
      this.errorMessage = '';
      
      // 验证表单
      if (!this.username || !this.password) {
        this.errorMessage = '请填写完整信息';
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.errorMessage = '两次输入的密码不一致';
        return;
      }
      
      this.loading = true;
      
      try {
        // 调用注册API
        const response = await authApi.register({
          username: this.username,
          password: this.password
        });
        
        // 如果API调用成功
        if (response.success) {
          // 保存JWT和用户信息
          authApi.setAuthInfo({
            token: response.token,
            user: response.user
          });
          
          // 保存用户头像到本地存储（保持向后兼容性）
          if (this.avatarPreview) {
            localStorage.setItem('lastUserAvatar', this.avatarPreview);
          }
          
          // 显示成功消息
          ElMessage.success('注册成功！请登录');
      
      // 注册成功，跳转到登录页
          this.$router.push('/login');
        } else {
          this.errorMessage = response.message || '注册失败，请稍后重试';
        }
      } catch (error) {
        console.error('注册错误:', error);
        this.errorMessage = error.response?.data?.message || '注册失败，请检查网络连接';
      } finally {
        this.loading = false;
      }
    },
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url('@/assets/image.png') no-repeat center center;
  background-size: cover;
}

.register-box {
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
  margin-bottom: 10px;
}

.upload-button {
  background-color: #909399;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.upload-button:hover {
  background-color: #a6a9ad;
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

.register-button, .back-button {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.register-button {
  background-color: #67C23A;
  color: white;
}

.register-button:hover:not(:disabled) {
  background-color: #85ce61;
}

.register-button:disabled,
.back-button:disabled {
  background-color: #c2e7b0;
  cursor: not-allowed;
}

.back-button {
  background-color: #909399;
  color: white;
}

.back-button:hover:not(:disabled) {
  background-color: #a6a9ad;
}
</style> 